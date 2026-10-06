export default function ReasoningTrace({ lines }) {
  if (!lines || lines.length === 0) return null;

  // Simulate timing for display
  const startTime = Date.now();

  return (
    <div className="bg-slate-900 text-slate-100 rounded-lg p-4 font-mono text-[11px] space-y-1">
      <div className="text-[10px] uppercase font-bold text-amber-400 tracking-wider mb-2 flex items-center justify-between">
        <span>🧠 Reasoning Trace</span>
        <span className="text-slate-500 font-normal normal-case">{lines.length} steps</span>
      </div>
      {lines.map((line, i) => {
        const isWarning = line.startsWith("⚠");
        const isSuccess = line.startsWith("✓");
        const isError = line.startsWith("✗");
        const isIndent = line.startsWith("  ·");
        const textClass = isWarning || isError ? "text-red-400"
          : isSuccess ? "text-emerald-400"
          : isIndent ? "text-slate-400 italic"
          : "text-slate-100";

        return (
          <div key={i} className={`flex gap-2 ${isIndent ? "pl-6" : ""}`}>
            {!isIndent && (
              <span className="text-slate-500 select-none w-6">
                {String(i + 1).padStart(2, "0")}
              </span>
            )}
            <span className={textClass}>{line}</span>
          </div>
        );
      })}
    </div>
  );
}
