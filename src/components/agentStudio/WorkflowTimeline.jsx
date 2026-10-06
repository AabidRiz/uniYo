import React from "react";
import { Users, Briefcase, GraduationCap, ShieldCheck, Check } from "lucide-react";

export default function WorkflowTimeline({ activeTab }) {
  const steps = [
    { id: "collaborator", label: "Plan", icon: Users, owner: "Aabid", color: "blue" },
    { id: "business", label: "Score", icon: Briefcase, owner: "Samaranayaka", color: "amber" },
    { id: "professor", label: "Endorse", icon: GraduationCap, owner: "Madusanka", color: "indigo" },
    { id: "validator", label: "Validate", icon: ShieldCheck, owner: "Jayasooriya", color: "emerald" }
  ];

  // Determine order
  const order = ["collaborator", "business", "professor", "validator"];
  const currentIdx = order.indexOf(activeTab);

  const colorMap = {
    blue: { done: "bg-blue-600 text-white", active: "bg-blue-100 text-blue-700 border-2 border-blue-500", idle: "bg-slate-100 text-slate-400" },
    amber: { done: "bg-amber-600 text-white", active: "bg-amber-100 text-amber-700 border-2 border-amber-500", idle: "bg-slate-100 text-slate-400" },
    indigo: { done: "bg-indigo-600 text-white", active: "bg-indigo-100 text-indigo-700 border-2 border-indigo-500", idle: "bg-slate-100 text-slate-400" },
    emerald: { done: "bg-emerald-600 text-white", active: "bg-emerald-100 text-emerald-700 border-2 border-emerald-500", idle: "bg-slate-100 text-slate-400" }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4">
      <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider mb-3">Workflow Pipeline</div>
      <div className="flex items-center justify-between">
        {steps.map((s, i) => {
          const Icon = s.icon;
          const isDone = i < currentIdx;
          const isActive = i === currentIdx;
          const isIdle = i > currentIdx;

          const stateClass = isDone ? colorMap[s.color].done
            : isActive ? colorMap[s.color].active
            : colorMap[s.color].idle;

          return (
            <React.Fragment key={s.id}>
              <div className="flex flex-col items-center gap-1 flex-1">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${stateClass}`}>
                  {isDone ? <Check className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                </div>
                <div className="text-[10px] font-bold text-slate-700">{s.label}</div>
                <div className="text-[9px] text-slate-400">{s.owner}</div>
              </div>
              {i < steps.length - 1 && (
                <div className={`flex-1 h-0.5 ${i < currentIdx ? "bg-slate-900" : "bg-slate-200"}`} />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}
