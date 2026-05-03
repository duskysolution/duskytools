"""
DuskyPDF FastAPI server.

Exposes:
    GET  /api/                 - Health & tool list
    GET  /api/tools            - Tool registry
    POST /api/tools/{slug}/process - Run a PDF tool (multipart)
    GET  /api/download/{token} - Download processed file
    GET  /api/sitemap.xml      - SEO sitemap
    GET  /api/robots.txt       - Robots.txt for crawlers
    GET  /api/ads.txt          - ads.txt placeholder (AdSense ready)

Files are stored in /tmp/duskypdf and cleaned up every 10 min if older than 1h.
"""
import os
import json
import logging
import asyncio
import uuid
from pathlib import Path
from typing import List, Optional
from datetime import datetime

from fastapi import (
    FastAPI, APIRouter, UploadFile, File, Form, HTTPException, BackgroundTasks
)
from fastapi.responses import FileResponse, JSONResponse, PlainTextResponse, Response
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient

from tools import TOOL_REGISTRY, TMP_DIR, cleanup_old_files

# ---------- Configuration ----------
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

# MongoDB is initialized but currently unused - kept for future features (job history)
mongo_url = os.environ.get("MONGO_URL", "mongodb://localhost:27017")
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ.get("DB_NAME", "duskypdf")]

# Public site URL (used in sitemap). Falls back to a sensible default.
SITE_URL = os.environ.get("PUBLIC_SITE_URL", "https://duskypdf.com").rstrip("/")

app = FastAPI(
    title="DuskyPDF API",
    description="REST API powering the DuskyPDF web app: 26+ PDF tools, real-time viewer, no signup.",
    version="1.0.0",
)
api_router = APIRouter(prefix="/api")

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger("duskypdf")


# ---------- Helpers ----------
def _save_upload(file: UploadFile) -> str:
    """Persist an UploadFile to TMP_DIR with a unique filename. Returns the path."""
    ext = Path(file.filename).suffix.lower() or ".bin"
    path = TMP_DIR / f"in_{uuid.uuid4().hex}{ext}"
    with open(path, "wb") as fp:
        while True:
            chunk = file.file.read(1024 * 1024)
            if not chunk:
                break
            fp.write(chunk)
    return str(path)


def _mime_for(ext: str) -> str:
    """Map a file extension to a Content-Type for FileResponse."""
    return {
        "pdf": "application/pdf",
        "jpg": "image/jpeg",
        "jpeg": "image/jpeg",
        "png": "image/png",
        "zip": "application/zip",
        "txt": "text/plain; charset=utf-8",
        "docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    }.get(ext.lower(), "application/octet-stream")


def _pikepdf_password_error_class():
    """Lazy import to avoid hard-failing if pikepdf changes its exception path."""
    try:
        import pikepdf
        return pikepdf.PasswordError
    except Exception:
        return Exception


# =====================================================================
# Routes
# =====================================================================
@api_router.get("/")
async def root():
    """Health check + tool inventory."""
    return {
        "service": "DuskyPDF API",
        "status": "ok",
        "version": "1.0.0",
        "tool_count": len(TOOL_REGISTRY),
        "tools": list(TOOL_REGISTRY.keys()),
    }


@api_router.get("/tools")
async def list_tools():
    """List the slugs of all functional tools."""
    return {"tools": list(TOOL_REGISTRY.keys())}


@api_router.post("/tools/{slug}/process")
async def process_tool(
    slug: str,
    background_tasks: BackgroundTasks,
    files: List[UploadFile] = File(...),
    options: Optional[str] = Form("{}"),
):
    """
    Process uploaded files with the given tool.

    Returns JSON with a download token + URL. The processed file is cached for ~1h.
    """
    if slug not in TOOL_REGISTRY:
        raise HTTPException(status_code=404, detail=f"Tool '{slug}' not implemented")
    if not files:
        raise HTTPException(status_code=400, detail="No files provided")

    try:
        opts = json.loads(options or "{}")
    except json.JSONDecodeError:
        opts = {}

    saved_paths = []
    try:
        for f in files:
            saved_paths.append(_save_upload(f))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to save upload: {e}")

    # Run blocking tool function in a worker thread so the event loop stays free
    try:
        loop = asyncio.get_event_loop()
        out_path = await loop.run_in_executor(
            None, lambda: TOOL_REGISTRY[slug](saved_paths, opts)
        )
    except _pikepdf_password_error_class() as e:
        raise HTTPException(status_code=400, detail=f"Password error: {e}")
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.exception("Tool processing failed")
        raise HTTPException(status_code=500, detail=f"Processing failed: {e}")
    finally:
        # Always remove input files
        for p in saved_paths:
            try:
                os.unlink(p)
            except Exception:
                pass

    out_path = Path(out_path)
    token = out_path.name
    ext = out_path.suffix.lstrip(".")
    base = files[0].filename.rsplit(".", 1)[0] if files[0].filename else "duskypdf"
    nice = f"duskypdf_{slug}_{base}.{ext}"

    background_tasks.add_task(cleanup_old_files, 3600)

    return JSONResponse({
        "success": True,
        "token": token,
        "download_url": f"/api/download/{token}",
        "filename": nice,
        "size": out_path.stat().st_size,
        "mime": _mime_for(ext),
    })


@api_router.get("/download/{token}")
async def download(token: str, filename: Optional[str] = None):
    """Stream a processed file back to the user. Token = filename in TMP_DIR."""
    if "/" in token or ".." in token:
        raise HTTPException(status_code=400, detail="Invalid token")
    path = TMP_DIR / token
    if not path.exists():
        raise HTTPException(status_code=404, detail="File expired or not found")
    ext = path.suffix.lstrip(".")
    return FileResponse(
        path=str(path),
        media_type=_mime_for(ext),
        filename=filename or f"duskypdf.{ext}",
    )


# ---------------------------------------------------------------------
# SEO endpoints
# ---------------------------------------------------------------------
@api_router.get("/sitemap.xml", response_class=Response)
async def sitemap_xml():
    """
    Generate a sitemap of every public route. Includes the homepage
    and every tool slug. Updated whenever the tool registry changes.
    """
    today = datetime.utcnow().strftime("%Y-%m-%d")
    urls = [f"{SITE_URL}/"]
    urls += [f"{SITE_URL}/{slug}" for slug in TOOL_REGISTRY.keys()]
    items = "\n".join(
        f"  <url>\n"
        f"    <loc>{u}</loc>\n"
        f"    <lastmod>{today}</lastmod>\n"
        f"    <changefreq>weekly</changefreq>\n"
        f"    <priority>{'1.0' if u.endswith('/') else '0.8'}</priority>\n"
        f"  </url>"
        for u in urls
    )
    body = (
        '<?xml version="1.0" encoding="UTF-8"?>\n'
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
        f"{items}\n"
        "</urlset>"
    )
    return Response(content=body, media_type="application/xml")


@api_router.get("/robots.txt", response_class=PlainTextResponse)
async def robots_txt():
    """Standard robots.txt allowing all crawlers + linking the sitemap."""
    body = (
        "User-agent: *\n"
        "Allow: /\n"
        "Disallow: /api/download/\n"
        "Disallow: /api/tools/\n"
        f"Sitemap: {SITE_URL}/api/sitemap.xml\n"
    )
    return PlainTextResponse(body)


@api_router.get("/ads.txt", response_class=PlainTextResponse)
async def ads_txt():
    """
    AdSense / ads.txt placeholder. Replace publisher ID with the real one
    once an AdSense account is approved.
    """
    body = (
        "# DuskyPDF ads.txt\n"
        "# Add your authorized digital sellers here, e.g.:\n"
        "# google.com, pub-0000000000000000, DIRECT, f08c47fec0942fa0\n"
        "placeholder.example.com, pub-DUSKYTEST01, DIRECT\n"
    )
    return PlainTextResponse(body)


# Mount the API router
app.include_router(api_router)

# CORS - permissive for the SPA front-end
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------- Lifecycle ----------
@app.on_event("startup")
async def startup_event():
    """Spin up a background loop that purges stale files every 10 minutes."""
    async def periodic_cleanup():
        while True:
            try:
                cleanup_old_files(3600)
            except Exception as e:
                logger.warning(f"Cleanup failed: {e}")
            await asyncio.sleep(600)

    asyncio.create_task(periodic_cleanup())
    logger.info(f"DuskyPDF API ready - {len(TOOL_REGISTRY)} tools loaded.")


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
