import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Download, RefreshCw, Trash2, Eye } from "lucide-react";
import { listDocuments, deleteDocument, exportExcel } from "../api/client";
import type { Document, DocumentStatus } from "../types";
import ConfidenceBadge from "../components/ConfidenceBadge";
import StatusBadge from "../components/StatusBadge";

const FIELD_LABELS: Record<string, string> = {
  date: "Date", manifest_no: "Manifest No", bol: "BoL",
  delivery_point: "Delivery Point", regular: "Regular", super: "Super", diesel: "Diesel",
};

const STATUS_TABS: { value: DocumentStatus | "all"; label: string }[] = [
  { value: "all",      label: "All" },
  { value: "pending",  label: "Pending" },
  { value: "processing", label: "Processing" },
  { value: "done",     label: "Done" },
  { value: "review",   label: "Needs Review" },
  { value: "approved", label: "Approved" },
];

function fieldValue(doc: Document, name: string): string {
  const f = doc.fields.find((x) => x.field_name === name);
  if (!f) return "—";
  return f.corrected_value ?? f.extracted_value ?? "—";
}

export default function Dashboard() {
  const [statusFilter, setStatusFilter] = useState<DocumentStatus | "all">("all");
  const [exportStatus, setExportStatus] = useState<DocumentStatus | "all">("all");
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const { data: docs = [], isLoading, refetch } = useQuery({
    queryKey: ["documents", statusFilter],
    queryFn: () => listDocuments(statusFilter === "all" ? undefined : statusFilter),
    refetchInterval: 5000,
  });

  const deleteMut = useMutation({
    mutationFn: deleteDocument,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["documents"] }),
  });

  const handleExport = async () => {
    await exportExcel(exportStatus === "all" ? undefined : exportStatus);
  };

  return (
    <div className="max-w-7xl mx-auto py-8 px-4">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Documents</h1>
        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={exportStatus}
            onChange={(e) => setExportStatus(e.target.value as DocumentStatus | "all")}
            className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 bg-white"
          >
            {STATUS_TABS.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
          <button
            onClick={handleExport}
            className="flex items-center gap-2 bg-green-700 hover:bg-green-800 text-white px-4 py-1.5 rounded-lg text-sm font-medium"
          >
            <Download size={15} /> Export Excel
          </button>
          <button
            onClick={() => refetch()}
            className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded-lg text-sm"
          >
            <RefreshCw size={15} /> Refresh
          </button>
        </div>
      </div>

      {/* Status filter tabs */}
      <div className="flex gap-1 mb-4 border-b border-gray-200">
        {STATUS_TABS.map((t) => (
          <button
            key={t.value}
            onClick={() => setStatusFilter(t.value)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              statusFilter === t.value
                ? "border-blue-600 text-blue-700"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="text-gray-500 text-sm py-12 text-center">Loading…</div>
      ) : docs.length === 0 ? (
        <div className="text-gray-400 text-sm py-12 text-center">No documents found.</div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-200 shadow-sm">
          <table className="min-w-full text-sm divide-y divide-gray-100">
            <thead className="bg-blue-900 text-white text-xs uppercase tracking-wide">
              <tr>
                <th className="px-3 py-3 text-left">File</th>
                <th className="px-3 py-3 text-left">Type</th>
                <th className="px-3 py-3 text-left">Date</th>
                <th className="px-3 py-3 text-left">Manifest No</th>
                <th className="px-3 py-3 text-left">BoL</th>
                <th className="px-3 py-3 text-left">Delivery Point</th>
                <th className="px-3 py-3 text-right">Regular</th>
                <th className="px-3 py-3 text-right">Super</th>
                <th className="px-3 py-3 text-right">Diesel</th>
                <th className="px-3 py-3 text-center">Confidence</th>
                <th className="px-3 py-3 text-center">Status</th>
                <th className="px-3 py-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {docs.map((doc) => (
                <>
                  <tr
                    key={doc.id}
                    className="hover:bg-blue-50 transition-colors cursor-pointer"
                    onClick={() => setExpandedId(expandedId === doc.id ? null : doc.id)}
                  >
                    <td className="px-3 py-2 max-w-[160px] truncate text-gray-700 font-medium">{doc.filename}</td>
                    <td className="px-3 py-2 text-gray-500 capitalize">{doc.doc_type.replace("_", " ")}</td>
                    <td className="px-3 py-2 text-gray-700">{fieldValue(doc, "date")}</td>
                    <td className="px-3 py-2 text-gray-700">{fieldValue(doc, "manifest_no")}</td>
                    <td className="px-3 py-2 text-gray-700">{fieldValue(doc, "bol")}</td>
                    <td className="px-3 py-2 text-gray-700 max-w-[140px] truncate">{fieldValue(doc, "delivery_point")}</td>
                    <td className="px-3 py-2 text-right text-gray-700">{fieldValue(doc, "regular")}</td>
                    <td className="px-3 py-2 text-right text-gray-700">{fieldValue(doc, "super")}</td>
                    <td className="px-3 py-2 text-right text-gray-700">{fieldValue(doc, "diesel")}</td>
                    <td className="px-3 py-2 text-center">
                      {doc.overall_confidence != null ? (
                        <ConfidenceBadge value={doc.overall_confidence} showLabel={false} />
                      ) : "—"}
                    </td>
                    <td className="px-3 py-2 text-center"><StatusBadge status={doc.status} /></td>
                    <td className="px-3 py-2 text-center">
                      <div className="flex justify-center gap-2">
                        {doc.status === "review" && (
                          <button
                            onClick={(e) => { e.stopPropagation(); navigate(`/review/${doc.id}`); }}
                            className="text-yellow-600 hover:text-yellow-800 p-1"
                            title="Review"
                          >
                            <Eye size={16} />
                          </button>
                        )}
                        <button
                          onClick={(e) => { e.stopPropagation(); if (confirm("Delete this document?")) deleteMut.mutate(doc.id); }}
                          className="text-red-400 hover:text-red-600 p-1"
                          title="Delete"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                  {expandedId === doc.id && (
                    <tr key={`${doc.id}-expand`} className="bg-blue-50">
                      <td colSpan={12} className="px-6 py-3">
                        <div className="flex flex-wrap gap-4">
                          {doc.fields.map((f) => (
                            <div key={f.id} className="bg-white rounded-lg border px-3 py-2 min-w-[140px]">
                              <div className="text-xs text-gray-400 uppercase tracking-wide mb-1">
                                {FIELD_LABELS[f.field_name] ?? f.field_name}
                              </div>
                              <div className="font-medium text-gray-800 text-sm">
                                {f.corrected_value ?? f.extracted_value ?? <span className="text-gray-300 italic">empty</span>}
                              </div>
                              {f.suggested_match && !f.corrected_value && (
                                <div className="text-xs text-blue-500 mt-0.5">Suggested: {f.suggested_match}</div>
                              )}
                              <ConfidenceBadge value={f.confidence} />
                            </div>
                          ))}
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
