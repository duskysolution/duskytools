"""
DuskyPDF Tool Processors
========================
Each function takes a list of absolute file paths and an options dict, and
returns the absolute path of the output file written inside TMP_DIR.

Dependencies (all pure-Python or wheels, no system libs besides tesseract):
    - pypdf         : basic page ops (merge, split, rotate, reorder)
    - pikepdf       : encryption, password, PDF repair
    - PyMuPDF(fitz) : rendering, watermark, compression, metadata, grayscale, n-up, HTML
    - Pillow        : image I/O
    - reportlab     : building PDFs from plain text
    - pdf2docx      : PDF -> Word conversion
    - pytesseract   : OCR (requires tesseract binary)

File lifecycle:
    * Outputs written to `/tmp/duskypdf/<uuid>.<ext>`
    * A background sweeper (see server.py) deletes files older than 1 hour.

Each processor function has the signature:
    f(files: List[str], options: Dict[str, Any]) -> pathlib.Path
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
from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas as rl_canvas
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer
from reportlab.lib.units import cm
from pdf2docx import Converter

# Shared temp directory for both inputs & outputs
TMP_DIR = Path("/tmp/duskypdf")
TMP_DIR.mkdir(parents=True, exist_ok=True)


def _out(ext: str = "pdf") -> Path:
    """Generate a unique output path inside TMP_DIR with the given extension."""
    return TMP_DIR / f"{uuid.uuid4().hex}.{ext}"


def _parse_ranges(spec: str, total: int) -> List[List[int]]:
    """
    Parse a human range spec like '1-3,5,7-9' into groups of 0-indexed pages.

    Returns a list of groups (each group becomes one output file when splitting).
    'all' or empty spec returns every page as its own group.
    """
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


def _parse_page_list(spec: str, total: int) -> List[int]:
    """Flatten a range spec into a sorted list of unique 0-indexed pages."""
    pages = set()
    for grp in _parse_ranges(spec, total):
        pages.update(grp)
    return sorted(pages)


# =====================================================================
# ORGANIZE
# =====================================================================
def merge_pdf(files: List[str], options: Dict[str, Any]) -> Path:
    """Concatenate multiple PDFs in input order into a single PDF."""
    out = _out("pdf")
    writer = pypdf.PdfWriter()
    for f in files:
        reader = pypdf.PdfReader(f)
        for page in reader.pages:
            writer.add_page(page)
    with open(out, "wb") as fp:
        writer.write(fp)
    return out


def split_pdf(files: List[str], options: Dict[str, Any]) -> Path:
    """
    Split a PDF.
    options:
        mode: 'ranges' (use 'ranges' spec) | 'each' (one file per page)
        ranges: e.g. '1-3,5,7-9'
    If multiple output files produced, returns a .zip.
    """
    src = files[0]
    reader = pypdf.PdfReader(src)
    total = len(reader.pages)
    mode = options.get("mode", "ranges")
    ranges_spec = options.get("ranges", "")
    groups = [[i] for i in range(total)] if mode == "each" else _parse_ranges(ranges_spec, total)

    if len(groups) == 1:
        out = _out("pdf")
        writer = pypdf.PdfWriter()
        for i in groups[0]:
            writer.add_page(reader.pages[i])
        with open(out, "wb") as fp:
            writer.write(fp)
        return out

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


def organize_pdf(files: List[str], options: Dict[str, Any]) -> Path:
    """Reorder / delete pages via options.page_order (list of 1-based indices)."""
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


def rotate_pdf(files: List[str], options: Dict[str, Any]) -> Path:
    """Rotate pages by degrees (90/180/270). options.pages: 'all' or ranges spec."""
    degrees = int(options.get("degrees", 90))
    pages_spec = options.get("pages", "all")
    out = _out("pdf")
    reader = pypdf.PdfReader(files[0])
    writer = pypdf.PdfWriter()
    total = len(reader.pages)
    target = set(range(total)) if pages_spec == "all" else set(_parse_page_list(pages_spec, total))
    for idx, page in enumerate(reader.pages):
        if idx in target:
            page.rotate(degrees)
        writer.add_page(page)
    with open(out, "wb") as fp:
        writer.write(fp)
    return out


def remove_pages(files: List[str], options: Dict[str, Any]) -> Path:
    """Delete pages matching 'pages' spec (ranges or comma list)."""
    spec = options.get("pages", "")
    out = _out("pdf")
    reader = pypdf.PdfReader(files[0])
    writer = pypdf.PdfWriter()
    total = len(reader.pages)
    to_delete = set(_parse_page_list(spec, total))
    for i, page in enumerate(reader.pages):
        if i not in to_delete:
            writer.add_page(page)
    with open(out, "wb") as fp:
        writer.write(fp)
    return out


def extract_pages(files: List[str], options: Dict[str, Any]) -> Path:
    """Keep only pages matching 'pages' spec."""
    spec = options.get("pages", "")
    out = _out("pdf")
    reader = pypdf.PdfReader(files[0])
    writer = pypdf.PdfWriter()
    total = len(reader.pages)
    to_keep = _parse_page_list(spec, total) if spec else list(range(total))
    for i in to_keep:
        if 0 <= i < total:
            writer.add_page(reader.pages[i])
    with open(out, "wb") as fp:
        writer.write(fp)
    return out


def n_up_pdf(files: List[str], options: Dict[str, Any]) -> Path:
    """
    Place N logical pages onto one physical A4 sheet (2-up, 4-up, 6-up).
    options.n: 2|4|6
    """
    n = int(options.get("n", 2))
    rows, cols = {2: (1, 2), 4: (2, 2), 6: (3, 2)}.get(n, (1, 2))
    src = fitz.open(files[0])
    out = _out("pdf")
    new_doc = fitz.open()
    page_w, page_h = fitz.paper_size("a4")
    cell_w, cell_h = page_w / cols, page_h / rows
    i = 0
    while i < src.page_count:
        np = new_doc.new_page(width=page_w, height=page_h)
        for r in range(rows):
            for c in range(cols):
                if i >= src.page_count:
                    break
                rect = fitz.Rect(c * cell_w, r * cell_h, (c + 1) * cell_w, (r + 1) * cell_h)
                np.show_pdf_page(rect, src, i)
                i += 1
    new_doc.save(str(out), garbage=3, deflate=True)
    new_doc.close()
    src.close()
    return out


# =====================================================================
# OPTIMIZE
# =====================================================================
def compress_pdf(files: List[str], options: Dict[str, Any]) -> Path:
    """
    Compress by re-encoding embedded images and running garbage collection.
    options.level: 'low' | 'recommended' | 'extreme'
    """
    level = options.get("level", "recommended")
    dpi = {"low": 150, "recommended": 110, "extreme": 72}.get(level, 110)
    quality = {"low": 85, "recommended": 70, "extreme": 50}.get(level, 70)

    out = _out("pdf")
    doc = fitz.open(files[0])
    for page in doc:
        for img in page.get_images(full=True):
            xref = img[0]
            try:
                pix = fitz.Pixmap(doc, xref)
                if pix.n > 4:
                    pix = fitz.Pixmap(fitz.csRGB, pix)
                if pix.width > dpi * 8 or pix.height > dpi * 11:
                    scale = min(1.0, (dpi * 8) / pix.width, (dpi * 11) / pix.height)
                    mat = fitz.Matrix(scale, scale)  # noqa: F841 (informational)
                    pix = fitz.Pixmap(pix, 0)
                img_bytes = pix.tobytes("jpeg", jpg_quality=quality)
                doc.update_stream(xref, img_bytes)
            except Exception:
                continue
    doc.save(str(out), garbage=4, deflate=True, clean=True)
    doc.close()
    return out


def grayscale_pdf(files: List[str], options: Dict[str, Any]) -> Path:
    """Render every page as a grayscale image and rebuild as PDF."""
    dpi = int(options.get("dpi", 150))
    src = fitz.open(files[0])
    out = _out("pdf")
    new_doc = fitz.open()
    for page in src:
        pix = page.get_pixmap(dpi=dpi, colorspace=fitz.csGRAY)
        np = new_doc.new_page(width=page.rect.width, height=page.rect.height)
        np.insert_image(np.rect, pixmap=pix)
    new_doc.save(str(out), garbage=3, deflate=True)
    new_doc.close(); src.close()
    return out


def repair_pdf(files: List[str], options: Dict[str, Any]) -> Path:
    """Attempt to fix a corrupt/malformed PDF via pikepdf re-save."""
    out = _out("pdf")
    with pikepdf.open(files[0]) as pdf:
        pdf.save(str(out), fix_metadata_version=True, linearize=False)
    return out


# =====================================================================
# SECURITY
# =====================================================================
def unlock_pdf(files: List[str], options: Dict[str, Any]) -> Path:
    """Remove password protection given the correct password."""
    password = options.get("password", "")
    out = _out("pdf")
    with pikepdf.open(files[0], password=password) as pdf:
        pdf.save(str(out))
    return out


def protect_pdf(files: List[str], options: Dict[str, Any]) -> Path:
    """Encrypt a PDF with an AES-128 (R=4) owner+user password."""
    password = options.get("password", "")
    if not password:
        raise ValueError("Password required")
    out = _out("pdf")
    with pikepdf.open(files[0]) as pdf:
        pdf.save(str(out), encryption=pikepdf.Encryption(owner=password, user=password, R=4))
    return out


# =====================================================================
# EDIT
# =====================================================================
def watermark_pdf(files: List[str], options: Dict[str, Any]) -> Path:
    """Stamp diagonal translucent text on every page."""
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
            (x, y), text, fontname="helv", fontsize=fontsize,
            color=(0.7, 0.1, 0.1), fill_opacity=opacity, rotate=45,
        )
    doc.save(str(out), garbage=3, deflate=True)
    doc.close()
    return out


def page_numbers_pdf(files: List[str], options: Dict[str, Any]) -> Path:
    """Add page numbers in configurable position/format (format uses {n} & {total})."""
    position = options.get("position", "bottom-center")
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


def crop_pdf(files: List[str], options: Dict[str, Any]) -> Path:
    """Crop each page by percentage margins (top/right/bottom/left)."""
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


def sign_pdf(files: List[str], options: Dict[str, Any]) -> Path:
    """
    Add a simple text signature (cursive-looking font) in a fixed position.
    options.text: signature text (e.g. 'John Doe')
    options.position: 'bottom-right' (default) | 'bottom-left' | 'top-right' | 'top-left'
    options.page: 1-based page index (default last page)
    """
    text = options.get("text", "Signature")
    position = options.get("position", "bottom-right")
    doc = fitz.open(files[0])
    page_idx = int(options.get("page", doc.page_count)) - 1
    page_idx = max(0, min(page_idx, doc.page_count - 1))
    page = doc[page_idx]
    r = page.rect
    fontsize = 20
    tw = fitz.get_text_length(text, fontname="tiit", fontsize=fontsize)  # Times italic
    margin = 40
    if position == "bottom-right":
        x, y = r.width - tw - margin, r.height - margin
    elif position == "bottom-left":
        x, y = margin, r.height - margin
    elif position == "top-right":
        x, y = r.width - tw - margin, margin + fontsize
    else:
        x, y = margin, margin + fontsize
    page.insert_text((x, y), text, fontname="tiit", fontsize=fontsize, color=(0.05, 0.1, 0.4))
    out = _out("pdf")
    doc.save(str(out), garbage=3, deflate=True)
    doc.close()
    return out


def edit_pdf(files: List[str], options: Dict[str, Any]) -> Path:
    """
    Lightweight edit: place a single text annotation at (x, y) on a chosen page.
    options: { page: 1-based, x: %, y: %, text: str, size: int, color: '#rrggbb' }
    """
    doc = fitz.open(files[0])
    page_idx = int(options.get("page", 1)) - 1
    page_idx = max(0, min(page_idx, doc.page_count - 1))
    page = doc[page_idx]
    x_pct = float(options.get("x", 10))
    y_pct = float(options.get("y", 10))
    text = options.get("text", "Edit text")
    size = int(options.get("size", 14))
    color_hex = (options.get("color") or "#111111").lstrip("#")
    r_ = int(color_hex[0:2], 16) / 255
    g_ = int(color_hex[2:4], 16) / 255
    b_ = int(color_hex[4:6], 16) / 255
    rect = page.rect
    page.insert_text(
        (rect.width * x_pct / 100, rect.height * y_pct / 100),
        text, fontname="helv", fontsize=size, color=(r_, g_, b_)
    )
    out = _out("pdf")
    doc.save(str(out), garbage=3, deflate=True)
    doc.close()
    return out


# =====================================================================
# CONVERT
# =====================================================================
def jpg_to_pdf(files: List[str], options: Dict[str, Any]) -> Path:
    """Bundle one or more images into a single PDF (one image per page)."""
    out = _out("pdf")
    images = [Image.open(f).convert("RGB") for f in files]
    if not images:
        raise ValueError("No images")
    first, rest = images[0], images[1:]
    first.save(str(out), save_all=True, append_images=rest)
    return out


def pdf_to_jpg(files: List[str], options: Dict[str, Any]) -> Path:
    """Render each page to a JPG. Returns a zip when multiple pages."""
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


def pdf_to_word(files: List[str], options: Dict[str, Any]) -> Path:
    """Convert PDF to editable DOCX using pdf2docx."""
    out = _out("docx")
    cv = Converter(files[0])
    cv.convert(str(out), start=0, end=None)
    cv.close()
    return out


def pdf_to_text(files: List[str], options: Dict[str, Any]) -> Path:
    """Extract plain text from every page into a single .txt file."""
    out = _out("txt")
    doc = fitz.open(files[0])
    parts = []
    for i, page in enumerate(doc, start=1):
        parts.append(f"----- Page {i} -----\n{page.get_text()}")
    out.write_text("\n\n".join(parts), encoding="utf-8")
    doc.close()
    return out


def extract_images(files: List[str], options: Dict[str, Any]) -> Path:
    """Extract every embedded image from a PDF into a zip."""
    doc = fitz.open(files[0])
    zip_out = _out("zip")
    count = 0
    with zipfile.ZipFile(zip_out, "w", zipfile.ZIP_DEFLATED) as zf:
        for pno, page in enumerate(doc, start=1):
            for ii, img in enumerate(page.get_images(full=True), start=1):
                xref = img[0]
                try:
                    pix = fitz.Pixmap(doc, xref)
                    if pix.n > 4:
                        pix = fitz.Pixmap(fitz.csRGB, pix)
                    buf = io.BytesIO()
                    pix.pil_save(buf, format="PNG")
                    zf.writestr(f"p{pno:03d}_img{ii:02d}.png", buf.getvalue())
                    count += 1
                except Exception:
                    continue
    if count == 0:
        zip_out.unlink(missing_ok=True)
        raise ValueError("No embedded images found")
    doc.close()
    return zip_out


def text_to_pdf(files: List[str], options: Dict[str, Any]) -> Path:
    """Convert a .txt file into a simple paginated PDF using reportlab."""
    src = Path(files[0])
    text = src.read_text(encoding="utf-8", errors="replace")
    out = _out("pdf")
    doc = SimpleDocTemplate(str(out), pagesize=A4, rightMargin=2*cm, leftMargin=2*cm, topMargin=2*cm, bottomMargin=2*cm)
    styles = getSampleStyleSheet()
    story = []
    for para in text.split("\n\n"):
        safe = para.replace("<", "&lt;").replace(">", "&gt;").replace("\n", "<br/>")
        story.append(Paragraph(safe or "&nbsp;", styles["BodyText"]))
        story.append(Spacer(1, 0.3 * cm))
    doc.build(story)
    return out


def html_to_pdf(files: List[str], options: Dict[str, Any]) -> Path:
    """
    Convert an HTML file to PDF using PyMuPDF's Story (no external browser).
    Note: complex CSS / external resources are not fully supported.
    """
    html = Path(files[0]).read_text(encoding="utf-8", errors="replace")
    out = _out("pdf")
    story = fitz.Story(html=html)
    writer = fitz.DocumentWriter(str(out))
    mediabox = fitz.paper_rect("a4")
    where = mediabox + (36, 36, -36, -36)
    more = 1
    while more:
        dev = writer.begin_page(mediabox)
        more, _ = story.place(where)
        story.draw(dev)
        writer.end_page()
    writer.close()
    return out


# =====================================================================
# INFO / DIAGNOSTICS
# =====================================================================
def pdf_info(files: List[str], options: Dict[str, Any]) -> Path:
    """Write a human-readable .txt report of PDF metadata + page statistics."""
    doc = fitz.open(files[0])
    md = doc.metadata or {}
    lines = [
        "DuskyPDF - Document Info Report",
        "=" * 40,
        f"File             : {Path(files[0]).name}",
        f"Pages            : {doc.page_count}",
        f"Encrypted        : {doc.is_encrypted}",
        f"Needs password   : {doc.needs_pass}",
        f"PDF version      : {doc.pdf_version() if hasattr(doc, 'pdf_version') else 'n/a'}",
        "",
        "Metadata:",
    ]
    for k in ("title", "author", "subject", "keywords", "creator", "producer",
              "creationDate", "modDate"):
        lines.append(f"  {k:<16}: {md.get(k) or '-'}")
    lines.append("")
    lines.append("Per-page dimensions (pt):")
    for i, page in enumerate(doc, start=1):
        r = page.rect
        lines.append(f"  Page {i:>3}: {r.width:.1f} x {r.height:.1f}")
    out = _out("txt")
    out.write_text("\n".join(lines), encoding="utf-8")
    doc.close()
    return out


# =====================================================================
# OCR
# =====================================================================
def ocr_pdf(files: List[str], options: Dict[str, Any]) -> Path:
    """Make a scanned PDF searchable by running Tesseract on each rendered page."""
    import pytesseract
    out = _out("pdf")
    src = fitz.open(files[0])
    new_doc = fitz.open()
    for page in src:
        pix = page.get_pixmap(dpi=200)
        img_bytes = pix.tobytes("png")
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


# =====================================================================
# REGISTRY: slug -> callable
# =====================================================================
TOOL_REGISTRY = {
    # Organize
    "merge-pdf": merge_pdf,
    "split-pdf": split_pdf,
    "organize-pdf": organize_pdf,
    "rotate-pdf": rotate_pdf,
    "remove-pages": remove_pages,
    "extract-pages": extract_pages,
    "n-up-pdf": n_up_pdf,
    # Optimize
    "compress-pdf": compress_pdf,
    "grayscale-pdf": grayscale_pdf,
    "repair-pdf": repair_pdf,
    # Security
    "unlock-pdf": unlock_pdf,
    "protect-pdf": protect_pdf,
    # Edit
    "watermark": watermark_pdf,
    "page-numbers": page_numbers_pdf,
    "crop-pdf": crop_pdf,
    "sign-pdf": sign_pdf,
    "edit-pdf": edit_pdf,
    # Convert
    "jpg-to-pdf": jpg_to_pdf,
    "pdf-to-jpg": pdf_to_jpg,
    "pdf-to-word": pdf_to_word,
    "pdf-to-text": pdf_to_text,
    "extract-images": extract_images,
    "text-to-pdf": text_to_pdf,
    "html-to-pdf": html_to_pdf,
    # Info
    "pdf-info": pdf_info,
    # OCR
    "ocr-pdf": ocr_pdf,
}


# =====================================================================
# CLEANUP
# =====================================================================
def cleanup_old_files(max_age_seconds: int = 3600):
    """Delete TMP_DIR files older than max_age_seconds. Safe to call repeatedly."""
    import time
    now = time.time()
    for p in TMP_DIR.iterdir():
        try:
            if p.is_file() and (now - p.stat().st_mtime) > max_age_seconds:
                p.unlink(missing_ok=True)
        except Exception:
            pass
