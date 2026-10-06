import React from "react";
import { ArrowDown, Database, CheckCircle2 } from "lucide-react";

export default function HandoffBanner({ fromAgent, owner, items, confidence }) {
  if (!fromAgent) return null;
  return (
    <div className="bg-slate-100 border-l-4 border-slate-400 rounded-r-lg p-3 flex items-start gap-3">
      <ArrowDown className="w-4 h-4 text-slate-500 mt-0.5 flex-shrink-0" />
      <div className="flex-1 text-xs">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="font-bold text-slate-700 flex items-center gap-1.5">
            <Database className="w-3.5 h-3.5" />
            Reading from <span className="text-slate-900">{fromAgent}</span>
            {owner && <span className="text-slate-500 font-normal">({owner})</span>}
          </div>
          {confidence != null && (
            <div className="text-[10px] text-slate-500 font-mono">
              conf {Math.round(confidence * 100)}%
            </div>
          )}
        </div>
        {items && items.length > 0 && (
          <div className="mt-1.5 flex flex-wrap gap-2">
            {items.map((item, i) => (
              <span key={i} className="inline-flex items-center gap-1 text-[10px] bg-white border border-slate-200 px-2 py-0.5 rounded-full">
                <CheckCircle2 className="w-2.5 h-2.5 text-emerald-500" />
                {item}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
