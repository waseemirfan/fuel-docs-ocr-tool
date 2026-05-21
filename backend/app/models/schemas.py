from pydantic import BaseModel
from datetime import datetime
from typing import Optional
from app.models.document import DocumentStatus, DocumentType


class FieldOut(BaseModel):
    id: int
    field_name: str
    extracted_value: Optional[str]
    corrected_value: Optional[str]
    confidence: float
    is_reviewed: bool
    suggested_match: Optional[str]

    model_config = {"from_attributes": True}


class DocumentOut(BaseModel):
    id: int
    filename: str
    status: DocumentStatus
    doc_type: DocumentType
    overall_confidence: Optional[float]
    uploaded_at: datetime
    processed_at: Optional[datetime]
    error_message: Optional[str]
    fields: list[FieldOut] = []

    model_config = {"from_attributes": True}


class ReviewFieldIn(BaseModel):
    field_id: int
    corrected_value: str


class ReviewSubmit(BaseModel):
    document_id: int
    corrections: list[ReviewFieldIn]


class DeliveryPointsUpdate(BaseModel):
    sites: list[str]
