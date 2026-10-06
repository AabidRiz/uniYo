export default function MatchBadge({ score }) {
  const color =
    score >= 80 ? "text-emerald-600 bg-emerald-50 border-emerald-300"
    : score >= 50 ? "text-amber-600 bg-amber-50 border-amber-300"
    : "text-red-600 bg-red-50 border-red-300";

  return (
    <div className={`text-center px-3 py-1.5 rounded-lg border ${color}`}>
      <div className="text-lg font-black leading-none">{score}%</div>
      <div className="text-[9px] uppercase tracking-wider font-bold opacity-70">Match</div>
    </div>
  );
}
