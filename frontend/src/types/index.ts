export type DocumentStatus = "pending" | "processing" | "done" | "review" | "approved";
export type DocumentType = "delivery_ticket" | "bol" | "combined" | "unknown";

export interface ExtractionField {
  id: number;
  field_name: string;
  extracted_value: string | null;
  corrected_value: string | null;
  confidence: number;
  is_reviewed: boolean;
  suggested_match: string | null;
}

export interface Document {
  id: number;
  filename: string;
  status: DocumentStatus;
  doc_type: DocumentType;
  overall_confidence: number | null;
  uploaded_at: string;
  processed_at: string | null;
  error_message: string | null;
  fields: ExtractionField[];
}

export interface ReviewFieldIn {
  field_id: number;
  corrected_value: string;
}

export interface ReviewSubmit {
  document_id: number;
  corrections: ReviewFieldIn[];
}
