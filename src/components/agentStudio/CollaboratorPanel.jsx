import React, { useState, useEffect } from "react";
import { Users, Play, Loader, CheckCircle2, User } from "lucide-react";
import AgentOwnerBadge from "./AgentOwnerBadge";
import ReasoningTrace from "./ReasoningTrace";
import ToolsPanel from "./ToolsPanel";
import ConfidenceBadge from "./ConfidenceBadge";

import API from "../../api/config";

export default function CollaboratorPanel({ projectId, workflowId, setWorkflowId, onSuccess }) {
  const [answers, setAnswers] = useState({ challenge: "", skills: [], universities: "all" });
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState(null);
  const [steps, setSteps] = useState(null);
  const [error, setError] = useState("");

  // DB-driven options
  const [skillOptions, setSkillOptions] = useState([]);
  const [universityOptions, setUniversityOptions] = useState([]);
  const [loadingOptions, setLoadingOptions] = useState(true);

  useEffect(() => {
    fetch(`${API}/meta/options`)
      .then(r => r.ok ? r.json() : { skills: [], studentUniversities: [] })
      .then(data => {
        setSkillOptions(data.skills || []);
        setUniversityOptions(data.studentUniversities || []);
      })
      .catch(err => console.error("Meta options failed:", err))
      .finally(() => setLoadingOptions(false));
  }, []);

  const toggleSkill = (s) => {
    setAnswers(a => ({
      ...a,
      skills: a.skills.includes(s) ? a.skills.filter(x => x !== s) : [...a.skills, s]
    }));
  };

  const run = async () => {
    setRunning(true); setError("");
    try {
      const res = await fetch(`${API}/agent/collaborator/run`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, initiatorId: "usr_std_01", workflowId, questionnaire: answers })
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setResult(data);
      if (data.workflowId && setWorkflowId) setWorkflowId(data.workflowId);

      setTimeout(async () => {
        try {
          const sres = await fetch(`${API}/agent/${data.workflowId}/steps`);
          if (sres.ok) {
            const stepList = await sres.json();
            setSteps(stepList.find(s => s.agentName === "collaborator"));
          }
        } catch {}
      }, 200);
    } catch (e) { setError(e.message); }
    finally { setRunning(false); }
  };

  const parsedOutput = steps?.output ? (typeof steps.output === "string" ? JSON.parse(steps.output) : steps.output) : null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <Users className="w-6 h-6 text-blue-600" />
          <div>
            <h3 className="font-bold text-lg">Collaborator Agent</h3>
            <p className="text-xs text-slate-500">Tactical planner + teammate matcher</p>
          </div>
        </div>
        <AgentOwnerBadge name="Aabid M.R.M" studentId="IT24103240" color="blue" />
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 space-y-4">
        <div>
          <label className="text-xs font-bold text-slate-700">Q1. Main technical challenge?</label>
          <textarea rows={2} value={answers.challenge} onChange={(e) => setAnswers({ ...answers, challenge: e.target.value })}
            className="mt-1 w-full px-3 py-2 text-xs border border-slate-300 rounded-lg" />
        </div>

        <div>
          <label className="text-xs font-bold text-slate-700">
            Q2. Which skills do you need? {skillOptions.length > 0 && <span className="text-slate-400 font-normal">({skillOptions.length} available from DB)</span>}
          </label>
          <div className="mt-2 max-h-48 overflow-y-auto border border-slate-200 rounded-lg p-3 bg-white">
            {loadingOptions ? (
              <div className="text-xs text-slate-400 italic">Loading skills from database…</div>
            ) : skillOptions.length === 0 ? (
              <div className="text-xs text-slate-400 italic">No skills found in DB.</div>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {skillOptions.map(s => (
                  <button key={s} onClick={() => toggleSkill(s)}
                    className={`text-xs px-2.5 py-1 rounded-full border font-semibold transition-all ${
                      answers.skills.includes(s)
                        ? "bg-blue-600 text-white border-blue-600"
                        : "bg-white text-slate-700 border-slate-300 hover:border-blue-500"
                    }`}>
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>
          {answers.skills.length > 0 && (
            <div className="mt-2 text-[11px] text-slate-600">
              <b>Selected ({answers.skills.length}):</b> {answers.skills.join(", ")}
            </div>
          )}
        </div>

        <div>
          <label className="text-xs font-bold text-slate-700">
            Q3. Universities? {universityOptions.length > 0 && <span className="text-slate-400 font-normal">({universityOptions.length} from DB)</span>}
          </label>
          <select value={answers.universities} onChange={(e) => setAnswers({ ...answers, universities: e.target.value })}
            className="mt-1 w-full px-3 py-2 text-xs border border-slate-300 rounded-lg">
            <option value="all">Any university</option>
            {universityOptions.map(u => (
              <option key={u} value={u}>{u}</option>
            ))}
          </select>
        </div>

        <button onClick={run} disabled={running || answers.skills.length === 0}
          className="w-full linkedin-btn-primary py-2.5 text-sm font-bold disabled:opacity-50 flex items-center justify-center">
          {running ? <Loader className="w-4 h-4 mr-2 animate-spin" /> : <Play className="w-4 h-4 mr-2" />}
          {running ? "Reasoning…" : "Run Collaborator Agent"}
        </button>
      </div>

      {error && <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-xs text-red-700 font-mono">{error}</div>}

      {result && result.plan && (
        <>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-blue-700 font-bold text-sm">
              <CheckCircle2 className="w-4 h-4" /> Plan Generated
            </div>
            {parsedOutput && <ConfidenceBadge value={parsedOutput.confidence || 0.8} />}
          </div>

          {parsedOutput?.reasoningTrace && <ReasoningTrace lines={parsedOutput.reasoningTrace} />}
          {parsedOutput?.toolsCalled && <ToolsPanel tools={parsedOutput.toolsCalled} />}

          <div className="bg-white border border-blue-200 rounded-xl p-4 space-y-3">
            <div>
              <div className="text-xs font-bold text-slate-600 mb-1">Plan Steps:</div>
              <ol className="list-decimal list-inside text-xs space-y-1">
                {result.plan.steps?.map((s, i) => <li key={i}>{s}</li>)}
              </ol>
            </div>

            <div>
              <div className="text-xs font-bold text-slate-600 mb-1">Required Skills:</div>
              <div className="flex flex-wrap gap-1">
                {result.plan.requiredSkills?.map((s, i) => <span key={i} className="text-[10px] bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full font-semibold">{s}</span>)}
              </div>
            </div>

            {result.plan.gaps?.length > 0 && (
              <div>
                <div className="text-xs font-bold text-red-600 mb-1">⚠ Skill Gaps:</div>
                <div className="flex flex-wrap gap-1">
                  {result.plan.gaps.map((g, i) => <span key={i} className="text-[10px] bg-red-100 text-red-800 px-2 py-0.5 rounded-full font-semibold">{g}</span>)}
                </div>
              </div>
            )}

            {result.plan.topCandidates?.length > 0 && (
              <div>
                <div className="text-xs font-bold text-slate-600 mb-2">Top Candidate Matches ({result.plan.topCandidates.length}):</div>
                <div className="space-y-1">
                  {result.plan.topCandidates.map((c, i) => (
                    <div key={i} className="flex items-center justify-between bg-blue-50 border border-blue-200 rounded px-3 py-2">
                      <div className="flex items-center gap-2">
                        <User className="w-3.5 h-3.5 text-blue-600" />
                        <div>
                          <div className="text-xs font-bold">{c.name}</div>
                          <div className="text-[10px] text-slate-500">{c.university}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-black text-blue-600">{c.matchScore}%</div>
                        <div className="text-[9px] text-slate-400">match</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {onSuccess && (
            <button onClick={onSuccess} className="w-full py-2 text-xs font-bold text-blue-600 border border-blue-300 rounded-full hover:bg-blue-50">
              Next: Business Agent →
            </button>
          )}
        </>
      )}
    </div>
  );
}

