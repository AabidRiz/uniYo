import React, { useState, useEffect } from "react";
import { Users, Briefcase, GraduationCap, ShieldCheck, AlertCircle, RotateCcw } from "lucide-react";
import CollaboratorPanel from "./CollaboratorPanel";
import BusinessPanel from "./BusinessPanel";
import ProfessorPanel from "./ProfessorPanel";
import ValidatorPanel from "./ValidatorPanel";
import WorkflowTimeline from "./WorkflowTimeline";

const API = "http://localhost:5000/api";

export default function AgentStudio() {
  const [activeTab, setActiveTab] = useState("collaborator");
  const [projects, setProjects] = useState([]);
  const [projectId, setProjectId] = useState("");
  const [workflowId, setWorkflowId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  // SHARED QUESTIONNAIRE — one source of truth
  const [sharedQuestionnaire, setSharedQuestionnaire] = useState({
    challenge: "",
    skills: [],
    universities: "all",
    amount: "500k-1m",
    industries: [],
    stage: "seed",
    domain: "",
    expertise: [],
    advisorUniversity: "any",
    formal: true
  });

  useEffect(() => {
    setLoading(true);
    fetch(`${API}/projects`)
      .then(r => r.ok ? r.json() : [])
      .then(list => {
        setProjects(list);
        if (list.length > 0) setProjectId(list[0].id);
      })
      .catch(err => setLoadError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const resetWorkflow = () => {
    if (confirm("Reset workflow? All agent outputs will be cleared.")) {
      setWorkflowId(null);
      setActiveTab("collaborator");
      setSharedQuestionnaire({
        challenge: "", skills: [], universities: "all",
        amount: "500k-1m", industries: [], stage: "seed",
        domain: "", expertise: [], advisorUniversity: "any", formal: true
      });
    }
  };

  const tabs = [
    { id: "collaborator", label: "Collaborator", owner: "Aabid", icon: Users, color: "text-blue-600" },
    { id: "business", label: "Business", owner: "Samaranayaka", icon: Briefcase, color: "text-amber-600" },
    { id: "professor", label: "Professor", owner: "Madusanka", icon: GraduationCap, color: "text-indigo-600" },
    { id: "validator", label: "Validator", owner: "Jayasooriya", icon: ShieldCheck, color: "text-emerald-600" }
  ];

  if (loading) return <div className="max-w-5xl mx-auto px-4 py-16 text-center text-slate-400">Loading Agent Studio…</div>;
  if (loadError) return <div className="max-w-5xl mx-auto px-4 py-6 text-red-600">Error: {loadError}</div>;

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white rounded-2xl p-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-black">UniYO Agent Studio</h1>
            <p className="text-xs text-slate-300 mt-1">4-agent workflow · select once, everything flows</p>
          </div>
          {workflowId && (
            <button onClick={resetWorkflow} className="text-xs text-slate-300 hover:text-white underline flex items-center gap-1">
              <RotateCcw className="w-3 h-3" /> Reset workflow
            </button>
          )}
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-4">
        <label className="text-xs font-bold text-slate-600">Project</label>
        <select value={projectId} onChange={(e) => { setProjectId(e.target.value); setWorkflowId(null); }}
          className="mt-2 w-full px-3 py-2 text-xs border border-slate-300 rounded-lg">
          {projects.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
        </select>
      </div>

      {workflowId && <WorkflowTimeline activeTab={activeTab} />}

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="flex border-b border-slate-200 overflow-x-auto">
          {tabs.map(t => {
            const Icon = t.icon;
            const isActive = activeTab === t.id;
            return (
              <button key={t.id} onClick={() => setActiveTab(t.id)}
                className={`flex-1 min-w-[140px] px-4 py-3 text-xs font-bold flex flex-col items-center gap-1 ${
                  isActive ? "bg-slate-50 border-b-2 border-blue-600 text-slate-900" : "text-slate-500 hover:bg-slate-50"
                }`}>
                <Icon className={`w-4 h-4 ${isActive ? t.color : ""}`} />
                <span>{t.label}</span>
                <span className="text-[9px] text-slate-400">by {t.owner}</span>
              </button>
            );
          })}
        </div>

        <div className="p-6">
          {activeTab === "collaborator" && (
            <CollaboratorPanel
              projectId={projectId}
              workflowId={workflowId}
              setWorkflowId={setWorkflowId}
              sharedQuestionnaire={sharedQuestionnaire}
              setSharedQuestionnaire={setSharedQuestionnaire}
              onSuccess={() => setActiveTab("business")}
            />
          )}
          {activeTab === "business" && (
            <BusinessPanel
              projectId={projectId}
              workflowId={workflowId}
              setWorkflowId={setWorkflowId}
              sharedQuestionnaire={sharedQuestionnaire}
              setSharedQuestionnaire={setSharedQuestionnaire}
              onSuccess={() => setActiveTab("professor")}
            />
          )}
          {activeTab === "professor" && (
            <ProfessorPanel
              projectId={projectId}
              workflowId={workflowId}
              setWorkflowId={setWorkflowId}
              sharedQuestionnaire={sharedQuestionnaire}
              setSharedQuestionnaire={setSharedQuestionnaire}
              onSuccess={() => setActiveTab("validator")}
            />
          )}
          {activeTab === "validator" && (
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
