import type { DocumentStatus } from "../types";

const CONFIG: Record<DocumentStatus, { label: string; classes: string }> = {
  pending:    { label: "Pending",    classes: "bg-gray-100 text-gray-700 border-gray-200" },
  processing: { label: "Processing", classes: "bg-blue-100 text-blue-700 border-blue-200 animate-pulse" },
  done:       { label: "Done",       classes: "bg-green-100 text-green-700 border-green-200" },
  review:     { label: "Needs Review", classes: "bg-yellow-100 text-yellow-700 border-yellow-200" },
  approved:   { label: "Approved",   classes: "bg-teal-100 text-teal-700 border-teal-200" },
};

export default function StatusBadge({ status }: { status: DocumentStatus }) {
  const { label, classes } = CONFIG[status] ?? CONFIG.pending;
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${classes}`}>
      {label}
    </span>
  );
}
