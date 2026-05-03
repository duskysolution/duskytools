"""
DuskyPDF - PDF tool processors.
Each function takes input path(s) + options dict, returns output path.
"""
import io
import os
import uuid
import zipfile
from pathlib import Path
from typing import List, Dict, Any

import pypdf
import pikepdf
import fitz  # PyMuPDF
from PIL import Image
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
from pdf2docx import Converter

TMP_DIR = Path("/tmp/duskypdf")
TMP_DIR.mkdir(parents=True, exist_ok=True)


def _out(ext: str = "pdf") -> Path:
    return TMP_DIR / f"{uuid.uuid4().hex}.{ext}"


# ---------- MERGE ----------
def merge_pdf(files: List[str], options: Dict[str, Any]) -> Path:
    out = _out("pdf")
    writer = pypdf.PdfWriter()
    for f in files:
        reader = pypdf.PdfReader(f)
        for page in reader.pages:
            writer.add_page(page)
    with open(out, "wb") as fp:
        writer.write(fp)
    return out


# ---------- SPLIT ----------
def _parse_ranges(spec: str, total: int) -> List[List[int]]:
    """Parse '1-3,5,7-9' -> [[0,1,2],[4],[6,7,8]] (0-indexed)."""
    if not spec or spec.strip().lower() == "all":
        return [[i] for i in range(total)]
    groups = []
    for part in spec.split(","):
        part = part.strip()
        if not part:
            continue
        if "-" in part:
            a, b = part.split("-", 1)
            a = max(1, int(a.strip()))
            b = min(total, int(b.strip()))
            groups.append(list(range(a - 1, b)))
        else:
            p = int(part)
            if 1 <= p <= total:
                groups.append([p - 1])
    return groups or [[i] for i in range(total)]


def split_pdf(files: List[str], options: Dict[str, Any]) -> Path:
    src = files[0]
    reader = pypdf.PdfReader(src)
    total = len(reader.pages)
    mode = options.get("mode", "ranges")  # "ranges" | "each"
    ranges_spec = options.get("ranges", "")
    if mode == "each":
        groups = [[i] for i in range(total)]
    else:
        groups = _parse_ranges(ranges_spec, total)

    if len(groups) == 1:
        out = _out("pdf")
        writer = pypdf.PdfWriter()
        for i in groups[0]:
            writer.add_page(reader.pages[i])
        with open(out, "wb") as fp:
            writer.write(fp)
        return out

    # multiple -> zip
    zip_out = _out("zip")
    with zipfile.ZipFile(zip_out, "w", zipfile.ZIP_DEFLATED) as zf:
        for gi, grp in enumerate(groups, start=1):
            writer = pypdf.PdfWriter()
            for i in grp:
                writer.add_page(reader.pages[i])
            buf = io.BytesIO()
            writer.write(buf)
            zf.writestr(f"split_{gi}.pdf", buf.getvalue())
    return zip_out


# ---------- COMPRESS ----------
def compress_pdf(files: List[str], options: Dict[str, Any]) -> Path:
    """Use PyMuPDF to re-save with garbage collection + image downscaling."""
    level = options.get("level", "recommended")  # low|recommended|extreme
    dpi_map = {"low": 150, "recommended": 110, "extreme": 72}
    quality_map = {"low": 85, "recommended": 70, "extreme": 50}
    dpi = dpi_map.get(level, 110)
    quality = quality_map.get(level, 70)

    out = _out("pdf")
    doc = fitz.open(files[0])
    # Re-encode images to JPEG with lower quality where possible
    for page in doc:
        for img in page.get_images(full=True):
            xref = img[0]
            try:
                pix = fitz.Pixmap(doc, xref)
                if pix.n > 4:  # CMYK -> RGB
                    pix = fitz.Pixmap(fitz.csRGB, pix)
                # downscale
                if pix.width > dpi * 8 or pix.height > dpi * 11:
                    scale = min(1.0, (dpi * 8) / pix.width, (dpi * 11) / pix.height)
                    new_w, new_h = int(pix.width * scale), int(pix.height * scale)
                    mat = fitz.Matrix(scale, scale)
                    pix = fitz.Pixmap(pix, 0)  # copy
                img_bytes = pix.tobytes("jpeg", jpg_quality=quality)
                doc.update_stream(xref, img_bytes)
            except Exception:
                continue
    doc.save(str(out), garbage=4, deflate=True, clean=True)
    doc.close()
    return out


# ---------- ROTATE ----------
def rotate_pdf(files: List[str], options: Dict[str, Any]) -> Path:
    degrees = int(options.get("degrees", 90))
    pages_spec = options.get("pages", "all")
    out = _out("pdf")
    reader = pypdf.PdfReader(files[0])
    writer = pypdf.PdfWriter()
    total = len(reader.pages)
    target = set(range(total)) if pages_spec == "all" else {
        i for grp in _parse_ranges(pages_spec, total) for i in grp
    }
    for idx, page in enumerate(reader.pages):
        if idx in target:
            page.rotate(degrees)
        writer.add_page(page)
    with open(out, "wb") as fp:
        writer.write(fp)
    return out


# ---------- WATERMARK ----------
def watermark_pdf(files: List[str], options: Dict[str, Any]) -> Path:
    text = options.get("text", "CONFIDENTIAL")
    opacity = float(options.get("opacity", 0.3))
    out = _out("pdf")
    doc = fitz.open(files[0])
    for page in doc:
        rect = page.rect
        fontsize = min(rect.width, rect.height) / 10
        tw = fitz.get_text_length(text, fontname="helv", fontsize=fontsize)
        x = (rect.width - tw) / 2
        y = rect.height / 2
        page.insert_text(
            (x, y), text,
            fontname="helv", fontsize=fontsize,
            color=(0.7, 0.1, 0.1), fill_opacity=opacity,
        )
    doc.save(str(out), garbage=3, deflate=True)
    doc.close()
    return out


# ---------- PAGE NUMBERS ----------
def page_numbers_pdf(files: List[str], options: Dict[str, Any]) -> Path:
    position = options.get("position", "bottom-center")  # bottom-center|bottom-right|top-right
    fmt = options.get("format", "Page {n} of {total}")
    out = _out("pdf")
    doc = fitz.open(files[0])
    total = doc.page_count
    for idx, page in enumerate(doc, start=1):
        rect = page.rect
        txt = fmt.format(n=idx, total=total)
        fontsize = 11
        tw = fitz.get_text_length(txt, fontname="helv", fontsize=fontsize)
        if position == "bottom-center":
            x, y = (rect.width - tw) / 2, rect.height - 20
        elif position == "bottom-right":
            x, y = rect.width - tw - 30, rect.height - 20
        elif position == "top-right":
            x, y = rect.width - tw - 30, 25
        else:
            x, y = (rect.width - tw) / 2, rect.height - 20
        page.insert_text((x, y), txt, fontname="helv", fontsize=fontsize, color=(0, 0, 0))
    doc.save(str(out), garbage=3, deflate=True)
    doc.close()
    return out


# ---------- JPG/IMAGE -> PDF ----------
def jpg_to_pdf(files: List[str], options: Dict[str, Any]) -> Path:
    out = _out("pdf")
    images = []
    for f in files:
        img = Image.open(f).convert("RGB")
        images.append(img)
    if not images:
        raise ValueError("No images")
    first, rest = images[0], images[1:]
    first.save(str(out), save_all=True, append_images=rest)
    return out


# ---------- PDF -> JPG ----------
def pdf_to_jpg(files: List[str], options: Dict[str, Any]) -> Path:
    dpi = int(options.get("dpi", 150))
    doc = fitz.open(files[0])
    if doc.page_count == 1:
        page = doc[0]
        pix = page.get_pixmap(dpi=dpi)
        out = _out("jpg")
        pix.pil_save(str(out), format="JPEG", quality=90)
        doc.close()
        return out
    zip_out = _out("zip")
    with zipfile.ZipFile(zip_out, "w", zipfile.ZIP_DEFLATED) as zf:
        for i, page in enumerate(doc, start=1):
            pix = page.get_pixmap(dpi=dpi)
            buf = io.BytesIO()
            pix.pil_save(buf, format="JPEG", quality=90)
            zf.writestr(f"page_{i:03d}.jpg", buf.getvalue())
    doc.close()
    return zip_out


# ---------- PDF -> WORD ----------
def pdf_to_word(files: List[str], options: Dict[str, Any]) -> Path:
    out = _out("docx")
    cv = Converter(files[0])
    cv.convert(str(out), start=0, end=None)
    cv.close()
    return out


# ---------- UNLOCK ----------
def unlock_pdf(files: List[str], options: Dict[str, Any]) -> Path:
    password = options.get("password", "")
    out = _out("pdf")
    with pikepdf.open(files[0], password=password) as pdf:
        pdf.save(str(out))
    return out


# ---------- PROTECT ----------
def protect_pdf(files: List[str], options: Dict[str, Any]) -> Path:
    password = options.get("password", "")
    if not password:
        raise ValueError("Password required")
    out = _out("pdf")
    with pikepdf.open(files[0]) as pdf:
        pdf.save(
            str(out),
            encryption=pikepdf.Encryption(owner=password, user=password, R=4),
        )
    return out


# ---------- ORGANIZE (reorder / delete) ----------
def organize_pdf(files: List[str], options: Dict[str, Any]) -> Path:
    """options.page_order: list of 1-based page indices in desired order."""
    order = options.get("page_order", [])
    out = _out("pdf")
    reader = pypdf.PdfReader(files[0])
    writer = pypdf.PdfWriter()
    if not order:
        order = list(range(1, len(reader.pages) + 1))
    for p in order:
        i = int(p) - 1
        if 0 <= i < len(reader.pages):
            writer.add_page(reader.pages[i])
    with open(out, "wb") as fp:
        writer.write(fp)
    return out


# ---------- OCR ----------
def ocr_pdf(files: List[str], options: Dict[str, Any]) -> Path:
    """Produce a searchable PDF by running OCR on each page image."""
    import pytesseract
    out = _out("pdf")
    src = fitz.open(files[0])
    new_doc = fitz.open()
    for page in src:
        pix = page.get_pixmap(dpi=200)
        img_bytes = pix.tobytes("png")
        # tesseract pdf
        pdf_bytes = pytesseract.image_to_pdf_or_hocr(
            Image.open(io.BytesIO(img_bytes)), extension="pdf"
        )
        overlay = fitz.open("pdf", pdf_bytes)
        new_doc.insert_pdf(overlay)
        overlay.close()
    new_doc.save(str(out), garbage=3, deflate=True)
    new_doc.close()
    src.close()
    return out


# ---------- CROP ----------
def crop_pdf(files: List[str], options: Dict[str, Any]) -> Path:
    """Crop margins by percentage (top/right/bottom/left)."""
    top = float(options.get("top", 0))
    right = float(options.get("right", 0))
    bottom = float(options.get("bottom", 0))
    left = float(options.get("left", 0))
    out = _out("pdf")
    doc = fitz.open(files[0])
    for page in doc:
        r = page.rect
        new_rect = fitz.Rect(
            r.x0 + r.width * left / 100,
            r.y0 + r.height * top / 100,
            r.x1 - r.width * right / 100,
            r.y1 - r.height * bottom / 100,
        )
        page.set_cropbox(new_rect)
    doc.save(str(out), garbage=3, deflate=True)
    doc.close()
    return out


# ---------- REPAIR ----------
def repair_pdf(files: List[str], options: Dict[str, Any]) -> Path:
    out = _out("pdf")
    with pikepdf.open(files[0], allow_overwriting_input=False) as pdf:
        pdf.save(str(out), fix_metadata_version=True, linearize=False)
    return out


TOOL_REGISTRY = {
    "merge-pdf": merge_pdf,
    "split-pdf": split_pdf,
    "compress-pdf": compress_pdf,
    "rotate-pdf": rotate_pdf,
    "watermark": watermark_pdf,
    "page-numbers": page_numbers_pdf,
    "jpg-to-pdf": jpg_to_pdf,
    "pdf-to-jpg": pdf_to_jpg,
    "pdf-to-word": pdf_to_word,
    "unlock-pdf": unlock_pdf,
    "protect-pdf": protect_pdf,
    "organize-pdf": organize_pdf,
    "ocr-pdf": ocr_pdf,
    "crop-pdf": crop_pdf,
    "repair-pdf": repair_pdf,
}


# ---------- CLEANUP ----------
def cleanup_old_files(max_age_seconds: int = 3600):
    import time
    now = time.time()
    for p in TMP_DIR.iterdir():
        try:
            if p.is_file() and (now - p.stat().st_mtime) > max_age_seconds:
                p.unlink(missing_ok=True)
        except Exception:
            pass
