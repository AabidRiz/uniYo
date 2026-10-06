export default function ConfidenceBadge({ value }) {
  const pct = Math.round(value * 100);
  const color = pct >= 80 ? "text-emerald-700 bg-emerald-50 border-emerald-300"
              : pct >= 50 ? "text-amber-700 bg-amber-50 border-amber-300"
              : "text-red-700 bg-red-50 border-red-300";
  return (
    <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full border ${color}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
      Confidence: {pct}%
    </span>
  );
}
