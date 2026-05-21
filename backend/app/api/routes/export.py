from typing import Optional
from fastapi import APIRouter, Depends, Query
from fastapi.responses import Response
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from app.database import get_db
from app.models.document import Document, DocumentStatus
from app.services.export_service import generate_excel

router = APIRouter(prefix="/export", tags=["export"])


@router.get("/excel")
async def export_excel(
    status: Optional[DocumentStatus] = Query(None),
    db: AsyncSession = Depends(get_db),
):
    q = select(Document).options(selectinload(Document.fields)).order_by(Document.uploaded_at.desc())
    if status:
        q = q.where(Document.status == status)
    result = await db.execute(q)
    docs = result.scalars().all()

    xlsx_bytes = generate_excel(list(docs))
    return Response(
        content=xlsx_bytes,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": "attachment; filename=extractions.xlsx"},
    )
