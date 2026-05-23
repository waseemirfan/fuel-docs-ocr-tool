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
ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".tiff", ".tif", ".bmp", ".pdf"}
MAX_FILE_SIZE = 50 * 1024 * 1024  # 50 MB (PDFs can be larger)


def _pdf_to_images(pdf_bytes: bytes, base_filename: str) -> list[tuple[str, str]]:
    """Convert each page of a PDF to a PNG and save to UPLOAD_DIR.
    Returns list of (save_path, page_filename) tuples."""
    import fitz  # pymupdf

    pages = []
    doc = fitz.open(stream=pdf_bytes, filetype="pdf")
    for page_num in range(len(doc)):
        page = doc.load_page(page_num)
        mat = fitz.Matrix(2.0, 2.0)  # 2x scale → ~144 DPI, sharp enough for OCR
        pix = page.get_pixmap(matrix=mat)
        safe_name = f"{uuid.uuid4()}.png"
        save_path = os.path.join(UPLOAD_DIR, safe_name)
        pix.save(save_path)
        label = f"{base_filename} (page {page_num + 1} of {len(doc)})"
        pages.append((save_path, label))
    doc.close()
    return pages


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

        if ext == ".pdf":
            try:
                pages = _pdf_to_images(content, file.filename or "document.pdf")
            except Exception as e:
                raise HTTPException(status_code=400, detail=f"Failed to read PDF: {e}")

            for save_path, label in pages:
                doc = Document(filename=label, image_path=save_path)
                db.add(doc)
                await db.flush()
                await db.refresh(doc)
                created.append(doc)
        else:
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
