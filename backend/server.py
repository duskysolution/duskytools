from fastapi import FastAPI, APIRouter, UploadFile, File, Form, HTTPException, BackgroundTasks
from fastapi.responses import FileResponse, JSONResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import json
import logging
import asyncio
import uuid
from pathlib import Path
from typing import List, Optional
from datetime import datetime

from tools import TOOL_REGISTRY, TMP_DIR, cleanup_old_files

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

# MongoDB (optional - kept for future features)
mongo_url = os.environ.get("MONGO_URL", "mongodb://localhost:27017")
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ.get("DB_NAME", "duskypdf")]

app = FastAPI(title="DuskyPDF API")
api_router = APIRouter(prefix="/api")

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)


# ---------- Helpers ----------
def _save_upload(file: UploadFile) -> str:
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
    return {
        "pdf": "application/pdf",
        "jpg": "image/jpeg",
        "jpeg": "image/jpeg",
        "png": "image/png",
        "zip": "application/zip",
        "docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    }.get(ext.lower(), "application/octet-stream")


# ---------- Routes ----------
@api_router.get("/")
async def root():
    return {"message": "DuskyPDF API", "tools": list(TOOL_REGISTRY.keys())}


@api_router.get("/tools")
async def list_tools():
    return {"tools": list(TOOL_REGISTRY.keys())}


@api_router.post("/tools/{slug}/process")
async def process_tool(
    slug: str,
    background_tasks: BackgroundTasks,
    files: List[UploadFile] = File(...),
    options: Optional[str] = Form("{}"),
):
    if slug not in TOOL_REGISTRY:
        raise HTTPException(status_code=404, detail=f"Tool '{slug}' not implemented")
    if not files:
        raise HTTPException(status_code=400, detail="No files provided")

    # Parse options
    try:
        opts = json.loads(options or "{}")
    except json.JSONDecodeError:
        opts = {}

    # Save uploads
    saved_paths = []
    try:
        for f in files:
            saved_paths.append(_save_upload(f))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to save upload: {e}")

    # Run tool (offload blocking work)
    try:
        loop = asyncio.get_event_loop()
        out_path = await loop.run_in_executor(
            None, lambda: TOOL_REGISTRY[slug](saved_paths, opts)
        )
    except pikepdf_password_error() as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.exception("Tool processing failed")
        raise HTTPException(status_code=500, detail=f"Processing failed: {e}")
    finally:
        # Delete input files after processing
        for p in saved_paths:
            try:
                os.unlink(p)
            except Exception:
                pass

    out_path = Path(out_path)
    token = out_path.name  # uuid.ext
    ext = out_path.suffix.lstrip(".")
    # Derive a nice filename
    base = files[0].filename.rsplit(".", 1)[0] if files[0].filename else "duskypdf"
    nice = f"duskypdf_{slug}_{base}.{ext}"

    # Schedule cleanup
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
    # Sanitize token
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


def pikepdf_password_error():
    # Lazy import so server can start even if pikepdf missing
    try:
        import pikepdf
        return pikepdf.PasswordError
    except Exception:
        return Exception


# Include router
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------- Periodic cleanup ----------
@app.on_event("startup")
async def startup_event():
    async def periodic_cleanup():
        while True:
            try:
                cleanup_old_files(3600)
            except Exception as e:
                logger.warning(f"Cleanup failed: {e}")
            await asyncio.sleep(600)  # every 10 min

    asyncio.create_task(periodic_cleanup())
    logger.info("DuskyPDF API started. Cleanup scheduler running.")


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
