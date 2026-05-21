from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from app.database import get_db
from app.models.document import Document, ExtractionField, DocumentStatus
from app.models.schemas import ReviewSubmit, DocumentOut

router = APIRouter(prefix="/review", tags=["review"])


@router.get("/queue", response_model=list[DocumentOut])
async def get_review_queue(db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Document)
        .options(selectinload(Document.fields))
        .where(Document.status == DocumentStatus.REVIEW)
        .order_by(Document.uploaded_at.asc())
    )
    return result.scalars().all()


@router.post("/submit", response_model=DocumentOut)
async def submit_review(payload: ReviewSubmit, db: AsyncSession = Depends(get_db)):
    doc_result = await db.execute(
        select(Document).options(selectinload(Document.fields)).where(Document.id == payload.document_id)
    )
    doc = doc_result.scalar_one_or_none()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    for correction in payload.corrections:
        field_result = await db.execute(
            select(ExtractionField).where(ExtractionField.id == correction.field_id)
        )
        field = field_result.scalar_one_or_none()
        if field and field.document_id == doc.id:
            field.corrected_value = correction.corrected_value
            field.is_reviewed = True

    doc.status = DocumentStatus.APPROVED
    await db.commit()
    await db.refresh(doc, ["fields"])
    return doc
