from datetime import datetime, timezone
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.document import Document, ExtractionField, DocumentStatus, DocumentType
from app.services.llm_service import extract_document  # updated import
from app.services.delivery_points import get_suggested_match

CONFIDENCE_REVIEW_THRESHOLD = 80.0

FIELD_NAMES = ["date", "manifest_no", "bol", "delivery_point", "regular", "super", "diesel"]


async def process_document(document_id: int, db: AsyncSession):
    result = await db.execute(select(Document).where(Document.id == document_id))
    doc = result.scalar_one_or_none()
    if not doc:
        return

    doc.status = DocumentStatus.PROCESSING
    await db.commit()

    try:
        llm_result = await extract_document(doc.image_path)

        doc_type_map = {
            "delivery_ticket": DocumentType.DELIVERY_TICKET,
            "bol": DocumentType.BOL,
            "combined": DocumentType.COMBINED,
            "unknown": DocumentType.UNKNOWN,
        }
        doc.doc_type = doc_type_map.get(llm_result.get("document_type", "unknown"), DocumentType.UNKNOWN)

        fields_data = llm_result.get("fields", {})
        confidences = []

        for field_name in FIELD_NAMES:
            field_info = fields_data.get(field_name, {"value": None, "confidence": 0})
            value = field_info.get("value")
            confidence = float(field_info.get("confidence", 0))
            confidences.append(confidence)

            suggested = None
            if field_name == "delivery_point" and value:
                suggested = await get_suggested_match(value)

            ef = ExtractionField(
                document_id=doc.id,
                field_name=field_name,
                extracted_value=str(value) if value is not None else None,
                confidence=confidence,
                suggested_match=suggested,
            )
            db.add(ef)

        non_zero = [c for c in confidences if c > 0]
        overall = sum(non_zero) / len(non_zero) if non_zero else 0.0
        doc.overall_confidence = round(overall, 2)

        needs_review = any(c < CONFIDENCE_REVIEW_THRESHOLD for c in non_zero) if non_zero else True
        doc.status = DocumentStatus.REVIEW if needs_review else DocumentStatus.DONE
        doc.processed_at = datetime.now(timezone.utc)

    except Exception as e:
        doc.status = DocumentStatus.REVIEW
        doc.error_message = str(e)
        doc.processed_at = datetime.now(timezone.utc)

    await db.commit()
