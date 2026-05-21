interface Props {
  value: number;
  showLabel?: boolean;
}

export default function ConfidenceBadge({ value, showLabel = true }: Props) {
  const pct = Math.round(value);
  const color =
    pct >= 80 ? "bg-green-100 text-green-800 border-green-200"
    : pct >= 60 ? "bg-yellow-100 text-yellow-800 border-yellow-200"
    : "bg-red-100 text-red-800 border-red-200";

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${color}`}>
      {showLabel && <span>Confidence</span>}
      {pct}%
    </span>
  );
}
