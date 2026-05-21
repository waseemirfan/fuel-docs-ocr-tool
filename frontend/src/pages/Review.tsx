import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, CheckCircle, AlertCircle } from "lucide-react";
import { getReviewQueue, getDocument, submitReview } from "../api/client";
import type { Document, ReviewFieldIn } from "../types";
import ConfidenceBadge from "../components/ConfidenceBadge";

const FIELD_LABELS: Record<string, string> = {
  date: "Date", manifest_no: "Manifest No", bol: "BoL",
  delivery_point: "Delivery Point", regular: "Regular", super: "Super", diesel: "Diesel",
};

function ReviewForm({ doc, onApproved }: { doc: Document; onApproved: () => void }) {
  const [values, setValues] = useState<Record<number, string>>({});
  const queryClient = useQueryClient();

  useEffect(() => {
    const init: Record<number, string> = {};
    doc.fields.forEach((f) => {
      init[f.id] = f.corrected_value ?? f.extracted_value ?? "";
    });
    setValues(init);
  }, [doc.id]);

  const mutation = useMutation({
    mutationFn: (corrections: ReviewFieldIn[]) =>
      submitReview({ document_id: doc.id, corrections }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documents"] });
      queryClient.invalidateQueries({ queryKey: ["review-queue"] });
      onApproved();
    },
  });

  const handleSubmit = () => {
    const corrections: ReviewFieldIn[] = doc.fields.map((f) => ({
      field_id: f.id,
      corrected_value: values[f.id] ?? "",
    }));
    mutation.mutate(corrections);
  };

  return (
    <div className="bg-white rounded-xl border shadow-sm p-6">
      <h3 className="font-semibold text-gray-800 mb-1 text-lg">{doc.filename}</h3>
      <p className="text-xs text-gray-400 mb-5">
        Type: {doc.doc_type.replace("_", " ")} &nbsp;|&nbsp;
        Uploaded: {new Date(doc.uploaded_at).toLocaleString()}
        {doc.error_message && (
          <span className="ml-2 text-red-500">&nbsp;⚠ {doc.error_message}</span>
        )}
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {doc.fields.map((field) => {
          const needsAttention = field.confidence < 80;
          return (
            <div
              key={field.id}
              className={`rounded-lg border p-3 ${needsAttention ? "border-yellow-300 bg-yellow-50" : "border-gray-200 bg-gray-50"}`}
            >
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                  {FIELD_LABELS[field.field_name] ?? field.field_name}
                </label>
                <ConfidenceBadge value={field.confidence} showLabel={false} />
              </div>

              {field.extracted_value && (
                <div className="text-xs text-gray-400 mb-1">
                  AI read: <span className="font-mono text-gray-600">{field.extracted_value}</span>
                </div>
              )}

              {field.suggested_match && (
                <div className="text-xs text-blue-600 mb-1">
                  Suggested site: <span className="font-medium">{field.suggested_match}</span>
                  <button
                    className="ml-2 text-blue-500 underline text-xs"
                    onClick={() => setValues((v) => ({ ...v, [field.id]: field.suggested_match! }))}
                  >
                    Use this
                  </button>
                </div>
              )}

              <input
                type="text"
                value={values[field.id] ?? ""}
                onChange={(e) => setValues((v) => ({ ...v, [field.id]: e.target.value }))}
                className="w-full mt-1 border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                placeholder={needsAttention ? "Please verify this value" : ""}
              />
            </div>
          );
        })}
      </div>

      <div className="mt-5 flex items-center gap-3">
        <button
          onClick={handleSubmit}
          disabled={mutation.isPending}
          className="flex items-center gap-2 bg-blue-700 hover:bg-blue-800 disabled:opacity-60 text-white px-6 py-2 rounded-lg text-sm font-medium"
        >
          <CheckCircle size={16} />
          {mutation.isPending ? "Saving…" : "Approve & Save"}
        </button>
        {mutation.isError && (
          <div className="flex items-center gap-1 text-red-600 text-sm">
            <AlertCircle size={15} /> Failed to save. Try again.
          </div>
        )}
      </div>
    </div>
  );
}

export default function ReviewPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [queueIdx, setQueueIdx] = useState(0);

  const { data: queue = [], isLoading: queueLoading } = useQuery({
    queryKey: ["review-queue"],
    queryFn: getReviewQueue,
  });

  const targetId = id ? parseInt(id) : queue[queueIdx]?.id;

  const { data: doc, isLoading: docLoading } = useQuery({
    queryKey: ["document", targetId],
    queryFn: () => getDocument(targetId!),
    enabled: !!targetId,
  });

  const handleApproved = () => {
    if (id) {
      navigate("/review");
    } else {
      if (queueIdx < queue.length - 1) setQueueIdx((i) => i + 1);
      else navigate("/dashboard");
    }
  };

  if (queueLoading) return <div className="py-20 text-center text-gray-400">Loading review queue…</div>;

  if (!id && queue.length === 0) {
    return (
      <div className="max-w-2xl mx-auto py-20 text-center">
        <CheckCircle size={48} className="mx-auto text-green-500 mb-3" />
        <h2 className="text-xl font-semibold text-gray-700">Review queue is empty</h2>
        <p className="text-gray-400 text-sm mt-1">All documents have been reviewed.</p>
        <button onClick={() => navigate("/dashboard")} className="mt-4 text-blue-600 underline text-sm">
          Back to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Human Review</h1>
          {!id && (
            <p className="text-gray-500 text-sm">
              {queueIdx + 1} of {queue.length} documents needing review
            </p>
          )}
        </div>
        {!id && queue.length > 1 && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setQueueIdx((i) => Math.max(0, i - 1))}
              disabled={queueIdx === 0}
              className="p-2 rounded border disabled:opacity-30 hover:bg-gray-100"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              onClick={() => setQueueIdx((i) => Math.min(queue.length - 1, i + 1))}
              disabled={queueIdx === queue.length - 1}
              className="p-2 rounded border disabled:opacity-30 hover:bg-gray-100"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        )}
      </div>

      {docLoading || !doc ? (
        <div className="text-gray-400 text-sm py-12 text-center">Loading document…</div>
      ) : (
        <ReviewForm doc={doc} onApproved={handleApproved} />
      )}
    </div>
  );
}
