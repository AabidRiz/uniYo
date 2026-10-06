export default function ToolsPanel({ tools }) {
  if (!tools || tools.length === 0) return null;
  return (
    <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
      <div className="text-[10px] uppercase font-bold text-slate-600 tracking-wider mb-2">🔧 Tools Called ({tools.length})</div>
      <div className="space-y-1">
        {tools.map((t, i) => (
          <div key={i} className="flex items-center justify-between text-[11px] font-mono bg-white border border-slate-200 rounded px-2 py-1">
            <span className="font-bold">{t.tool}()</span>
            <span className="text-slate-500">{t.durationMs}ms</span>
            <span className={`font-bold ${t.status === "ok" ? "text-emerald-600" : "text-red-600"}`}>{t.status.toUpperCase()}</span>
            {t.detail && <span className="text-slate-400 text-[10px]">{t.detail}</span>}
          </div>
        ))}
      </div>
    </div>
  );
}
