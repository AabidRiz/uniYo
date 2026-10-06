import React, { useState, useEffect } from "react";
import { Users, Briefcase, GraduationCap, ShieldCheck, AlertCircle, RotateCcw } from "lucide-react";
import CollaboratorPanel from "./CollaboratorPanel";
import BusinessPanel from "./BusinessPanel";
import ProfessorPanel from "./ProfessorPanel";
import ValidatorPanel from "./ValidatorPanel";
import WorkflowTimeline from "./WorkflowTimeline";

import API from "../../api/config";

export default function AgentStudio() {
  const [activeTab, setActiveTab] = useState("collaborator");
  const [projects, setProjects] = useState([]);
  const [projectId, setProjectId] = useState("");
  const [workflowId, setWorkflowId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    setLoading(true);
    setLoadError("");
    fetch(`${API}/projects`)
      .then(r => {
        if (!r.ok) throw new Error(`API returned ${r.status}`);
        return r.json();
      })
      .then(list => {
        if (!Array.isArray(list)) throw new Error("Projects response is not an array");
        setProjects(list);
        if (list.length > 0) setProjectId(list[0].id);
        else setLoadError("No projects found in the database");
      })
      .catch(err => {
        console.error("Failed to load projects:", err);
        setLoadError(`Could not reach API at ${API}. Is dotnet run active?`);
      })
      .finally(() => setLoading(false));
  }, []);

  const resetWorkflow = () => {
    if (confirm("Reset workflow? All agent outputs will be cleared.")) {
      setWorkflowId(null);
      setActiveTab("collaborator");
    }
  };

  const tabs = [
    { id: "collaborator", label: "Collaborator", owner: "Aabid", icon: Users, color: "text-blue-600" },
    { id: "business", label: "Business", owner: "Samaranayaka", icon: Briefcase, color: "text-amber-600" },
    { id: "professor", label: "Professor", owner: "Madusanka", icon: GraduationCap, color: "text-indigo-600" },
    { id: "validator", label: "Validator", owner: "Jayasooriya", icon: ShieldCheck, color: "text-emerald-600" }
  ];

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-16 text-center text-slate-400 text-sm">
        Loading Agent Studio…
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-6">
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center">
          <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-3" />
          <h2 className="font-bold text-red-700">Agent Studio unavailable</h2>
          <p className="text-xs text-red-600 mt-2 font-mono">{loadError}</p>
        </div>
      </div>
    );
  }

  // Status indicator
  const statusLabel = !workflowId ? "Not started"
    : workflowId && !activeTab.includes("validator") ? "In progress"
    : "Awaiting approval";

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white rounded-2xl p-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <div className="flex items-center gap-2 text-blue-300 text-xs font-bold mb-2">
              <ShieldCheck className="w-4 h-4" /> UniYO Agent Studio
            </div>
            <h1 className="text-2xl font-black">4-Agent Workflow</h1>
            <p className="text-xs text-slate-300 mt-1 max-w-2xl">
              Four specialized agents cooperate on a shared blackboard.
            </p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <div className="text-[10px] text-slate-400 font-mono">
              Status: <span className="text-white font-bold">{statusLabel}</span>
            </div>
            {workflowId && (
              <>
                <div className="text-[10px] text-slate-400 font-mono">
                  WF: {workflowId.slice(0, 8)}
                </div>
                <button
                  onClick={resetWorkflow}
                  className="text-[10px] text-slate-300 hover:text-white underline flex items-center gap-1"
                >
                  <RotateCcw className="w-3 h-3" /> Reset
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <details className="text-xs">
            <summary className="cursor-pointer font-bold text-blue-900 select-none">
              ℹ How this works — click to expand
            </summary>
            <div className="mt-3 space-y-2 text-slate-700 leading-relaxed">
              <p>
                This is a <b>4-agent orchestrated workflow</b>. Each agent runs in sequence and reads the previous agent's output from a shared blackboard (PostgreSQL).
              </p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li><b>Collaborator (Aabid)</b> — builds the plan and finds teammates using <i>deterministic skill matching</i>.</li>
                <li><b>Business (Samaranayaka)</b> — scores traction using a <i>fixed formula</i>, then matches investors by <i>thesis overlap</i>.</li>
                <li><b>Professor (Madusanka)</b> — assigns an advisor using <i>keyword matching</i> against their research areas.</li>
                <li><b>Validator (Jayasooriya)</b> — runs <i>8 deterministic checks</i> with no LLM. Pauses for human approval.</li>
              </ul>
              <p>
                Every agent shows a <b>reasoning trace</b> (what it thought), <b>tool calls</b> (what it queried), and a <b>confidence score</b>. Nothing is published without your approval.
              </p>
            </div>
          </details>
        </div>

        `<div className="bg-white border border-slate-200 rounded-xl p-4">
        <label className="text-xs font-bold text-slate-600">Select a project</label>
        <select
          value={projectId}
          onChange={(e) => {
            setProjectId(e.target.value);
            setWorkflowId(null);
          }}
          className="mt-2 w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
        >
          {projects.map(p => (
            <option key={p.id} value={p.id}>{p.title}</option>
          ))}
        </select>
      </div>

      {workflowId && <WorkflowTimeline activeTab={activeTab} />}

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="flex border-b border-slate-200 overflow-x-auto">
          {tabs.map(t => {
            const Icon = t.icon;
            const isActive = activeTab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className={`flex-1 min-w-[140px] px-4 py-3 text-xs font-bold whitespace-nowrap flex flex-col items-center gap-1 ${
                  isActive ? "bg-slate-50 border-b-2 border-blue-600 text-slate-900" : "text-slate-500 hover:bg-slate-50"
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? t.color : ""}`} />
                <span>{t.label}</span>
                <span className="text-[9px] text-slate-400">by {t.owner}</span>
              </button>
            );
          })}
        </div>

        <div className="p-6">
          {projectId && activeTab === "collaborator" && (
            <CollaboratorPanel
              projectId={projectId}
              workflowId={workflowId}
              setWorkflowId={setWorkflowId}
              onSuccess={() => setActiveTab("business")}
            />
          )}
          {projectId && activeTab === "business" && (
            <BusinessPanel
              projectId={projectId}
              workflowId={workflowId}
              setWorkflowId={setWorkflowId}
              onSuccess={() => setActiveTab("professor")}
            />
          )}
          {projectId && activeTab === "professor" && (
            <ProfessorPanel
              projectId={projectId}
              workflowId={workflowId}
              setWorkflowId={setWorkflowId}
              onSuccess={() => setActiveTab("validator")}
            />
          )}
          {projectId && activeTab === "validator" && (
            <ValidatorPanel
              projectId={projectId}
              workflowId={workflowId}
              setWorkflowId={setWorkflowId}
            />
          )}
        </div>
      </div>
    </div>
  );
}



