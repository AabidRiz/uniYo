import React, { useState, useEffect } from "react";
import { GraduationCap, Play, Loader, CheckCircle2, AlertCircle, Clock } from "lucide-react";
import AgentOwnerBadge from "./AgentOwnerBadge";
import ReasoningTrace from "./ReasoningTrace";
import ToolsPanel from "./ToolsPanel";
import ConfidenceBadge from "./ConfidenceBadge";
import HandoffBanner from "./HandoffBanner";

const API = "http://localhost:5000/api";

export default function ProfessorPanel({ projectId, workflowId, setWorkflowId, onSuccess }) {
  const [answers, setAnswers] = useState({ domain: "", expertise: [], university: "any", formal: true });
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState(null);
  const [steps, setSteps] = useState(null);
  const [error, setError] = useState("");

  // DB-driven options
  const [expertiseOptions, setExpertiseOptions] = useState([]);
  const [universityOptions, setUniversityOptions] = useState([]);
  const [loadingOptions, setLoadingOptions] = useState(true);

  useEffect(() => {
    fetch(`${API}/meta/options`)
      .then(r => r.ok ? r.json() : { expertise: [], studentUniversities: [] })
      .then(data => {
        setExpertiseOptions(data.expertise || []);
        setUniversityOptions(data.studentUniversities || []);
      })
      .catch(err => console.error("Meta options failed:", err))
      .finally(() => setLoadingOptions(false));
  }, []);

  const toggleExpertise = (e) => {
    setAnswers(a => ({
      ...a,
      expertise: a.expertise.includes(e) ? a.expertise.filter(x => x !== e) : [...a.expertise, e]
    }));
  };

  const run = async () => {
    if (!workflowId) { setError("Run the Collaborator Agent first."); return; }
    setRunning(true); setError("");
    try {
      const res = await fetch(`${API}/agent/professor/run`, {
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
            setSteps(stepList.find(s => s.agentName === "professor"));
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
          <GraduationCap className="w-6 h-6 text-indigo-600" />
          <div>
            <h3 className="font-bold text-lg">Professor Agent</h3>
            <p className="text-xs text-slate-500">Formal academic advisor matching</p>
          </div>
        </div>
        <AgentOwnerBadge name="Madusanka W.A.L.P" studentId="IT24101209" color="indigo" />
      </div>

      {!workflowId && (
        <div className="bg-yellow-50 border border-yellow-300 rounded-xl p-3 text-xs text-yellow-800 flex items-center gap-2">
          <AlertCircle className="w-4 h-4" /> Run the Collaborator Agent first.
        </div>
      )}

      {workflowId && (
        <HandoffBanner fromAgent="Business Agent" owner="Samaranayaka" items={["tractionScore", "investorMatches", "pitchDraft"]} />
      )}

      <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 space-y-4">
        <div>
          <label className="text-xs font-bold text-slate-700">Q1. Academic domain</label>
          <input type="text" value={answers.domain} onChange={(e) => setAnswers({ ...answers, domain: e.target.value })}
            placeholder="e.g. Robotics, AI"
            className="mt-1 w-full px-3 py-2 text-xs border border-slate-300 rounded-lg" />
        </div>

        <div>
          <label className="text-xs font-bold text-slate-700">
            Q2. Advisor expertise {expertiseOptions.length > 0 && <span className="text-slate-400 font-normal">({expertiseOptions.length} from DB)</span>}
          </label>
          <div className="mt-2 max-h-48 overflow-y-auto border border-slate-200 rounded-lg p-3 bg-white">
            {loadingOptions ? (
              <div className="text-xs text-slate-400 italic">Loading expertise from database…</div>
            ) : expertiseOptions.length === 0 ? (
              <div className="text-xs text-slate-400 italic">No expertise data available.</div>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {expertiseOptions.map(e => (
                  <button key={e} onClick={() => toggleExpertise(e)}
                    className={`text-xs px-2.5 py-1 rounded-full border font-semibold transition-all ${
                      answers.expertise.includes(e)
                        ? "bg-indigo-600 text-white border-indigo-600"
                        : "bg-white text-slate-700 border-slate-300 hover:border-indigo-500"
                    }`}>
                    {e}
                  </button>
                ))}
              </div>
            )}
          </div>
          {answers.expertise.length > 0 && (
            <div className="mt-2 text-[11px] text-slate-600">
              <b>Selected ({answers.expertise.length}):</b> {answers.expertise.join(", ")}
            </div>
          )}
        </div>

        <div>
          <label className="text-xs font-bold text-slate-700">Q3. Preferred university</label>
          <select value={answers.university} onChange={(e) => setAnswers({ ...answers, university: e.target.value })}
            className="mt-1 w-full px-3 py-2 text-xs border border-slate-300 rounded-lg">
            <option value="any">Any university</option>
            {universityOptions.map(u => <option key={u} value={u}>{u}</option>)}
          </select>
        </div>

        <button onClick={run} disabled={running || !workflowId}
          className="w-full py-2.5 text-sm font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-full disabled:opacity-50 flex items-center justify-center">
          {running ? <Loader className="w-4 h-4 mr-2 animate-spin" /> : <Play className="w-4 h-4 mr-2" />}
          {running ? "Matching advisor…" : "Run Professor Agent"}
        </button>
      </div>

      {error && <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-xs text-red-700 font-mono">{error}</div>}

      {result && result.endorsement && (
        <>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-indigo-700 font-bold text-sm">
              <CheckCircle2 className="w-4 h-4" /> Endorsement Ready
            </div>
            {parsedOutput && <ConfidenceBadge value={parsedOutput.confidence || 0.75} />}
          </div>

          {parsedOutput?.reasoningTrace && <ReasoningTrace lines={parsedOutput.reasoningTrace} />}
          {parsedOutput?.toolsCalled && <ToolsPanel tools={parsedOutput.toolsCalled} />}

          {result.endorsement.error === "no_professor_matched" ? (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-xs text-red-700">
              ⚠ No professor with matching expertise was found for this project.
            </div>
          ) : (
            <div className="bg-white border border-indigo-200 rounded-xl p-4 space-y-3">
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="bg-indigo-50 p-3 rounded-lg">
                  <div className="text-[10px] uppercase font-bold text-slate-500">Assigned Advisor</div>
                  <div className="font-bold mt-1 text-sm">{result.endorsement.professorName}</div>
                  <div className="text-[10px] text-slate-500">{result.endorsement.university}</div>
                  <div className="text-[10px] text-slate-500">{result.endorsement.faculty}</div>
                </div>
                <div className="bg-indigo-50 p-3 rounded-lg">
                  <div className="text-[10px] uppercase font-bold text-slate-500 flex items-center gap-1">
                    <Clock className="w-3 h-3" /> Availability
                  </div>
                  <div className="text-[11px] mt-1 space-y-1">
                    {result.endorsement.availability?.length > 0
                      ? result.endorsement.availability.map((a, i) => (
                          <div key={i} className="bg-white px-2 py-0.5 rounded border border-indigo-100">{a.Day} {a.Time}</div>
                        ))
                      : <span className="text-slate-400 italic">None set</span>}
                  </div>
                </div>
              </div>

              {result.endorsement.expertiseMatch > 0 && (
                <div className="text-[10px] text-indigo-700 bg-indigo-50 rounded px-2 py-1">
                  Expertise match score: <b>{result.endorsement.expertiseMatch}</b>
                </div>
              )}

              <div>
                <div className="text-xs font-bold text-slate-600 mb-1">Draft Endorsement:</div>
                <div className="text-xs italic bg-indigo-50 p-3 rounded-lg leading-relaxed">
                  "{result.endorsement.endorsementDraft}"
                </div>
              </div>
            </div>
          )}

          {onSuccess && (
            <button onClick={onSuccess} className="w-full py-2 text-xs font-bold text-indigo-600 border border-indigo-300 rounded-full hover:bg-indigo-50">
              Next: Validator Agent →
            </button>
          )}
        </>
      )}
    </div>
  );
}
