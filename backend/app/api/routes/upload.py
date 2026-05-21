import os
import uuid
import asyncio
from fastapi import APIRouter, UploadFile, File, Depends, HTTPException, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.models.document import Document, DocumentStatus
from app.models.schemas import DocumentOut
from app.services.document_processor import process_document

router = APIRouter(prefix="/upload", tags=["upload"])

UPLOAD_DIR = "uploads"
ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".tiff", ".tif", ".bmp"}
MAX_FILE_SIZE = 20 * 1024 * 1024  # 20 MB


@router.post("/", response_model=list[DocumentOut])
async def upload_documents(
    background_tasks: BackgroundTasks,
    files: list[UploadFile] = File(...),
    db: AsyncSession = Depends(get_db),
):
    os.makedirs(UPLOAD_DIR, exist_ok=True)
    created = []

    for file in files:
        ext = os.path.splitext(file.filename or "")[-1].lower()
        if ext not in ALLOWED_EXTENSIONS:
            raise HTTPException(status_code=400, detail=f"Unsupported file type: {ext}")

        content = await file.read()
        if len(content) > MAX_FILE_SIZE:
            raise HTTPException(status_code=400, detail=f"File too large: {file.filename}")

        safe_name = f"{uuid.uuid4()}{ext}"
        save_path = os.path.join(UPLOAD_DIR, safe_name)

        with open(save_path, "wb") as f:
            f.write(content)

        doc = Document(filename=file.filename or safe_name, image_path=save_path)
        db.add(doc)
        await db.flush()
        await db.refresh(doc)
        created.append(doc)

    await db.commit()

    for doc in created:
        await db.refresh(doc, ["fields"])
        background_tasks.add_task(_run_processing, doc.id)

    return created


async def _run_processing(document_id: int):
    from app.database import AsyncSessionLocal
    async with AsyncSessionLocal() as db:
        await process_document(document_id, db)
