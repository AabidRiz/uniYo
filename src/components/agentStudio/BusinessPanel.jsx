import React, { useState, useEffect } from "react";
import { Briefcase, Play, Loader, CheckCircle2, AlertCircle } from "lucide-react";
import AgentOwnerBadge from "./AgentOwnerBadge";
import MatchBadge from "./MatchBadge";
import ReasoningTrace from "./ReasoningTrace";
import ToolsPanel from "./ToolsPanel";
import ConfidenceBadge from "./ConfidenceBadge";
import HandoffBanner from "./HandoffBanner";

const API = "http://localhost:5000/api";

export default function BusinessPanel({ projectId, workflowId, setWorkflowId, onSuccess }) {
  const [answers, setAnswers] = useState({ amount: "500k-1m", industries: [], stage: "seed" });
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState(null);
  const [steps, setSteps] = useState(null);
  const [error, setError] = useState("");

  // DB-driven options
  const [thesisOptions, setThesisOptions] = useState([]);
  const [loadingOptions, setLoadingOptions] = useState(true);

  useEffect(() => {
    fetch(`${API}/meta/options`)
      .then(r => r.ok ? r.json() : { investorTheses: [] })
      .then(data => setThesisOptions(data.investorTheses || []))
      .catch(err => console.error("Meta options failed:", err))
      .finally(() => setLoadingOptions(false));
  }, []);

  const toggleIndustry = (i) => {
    setAnswers(a => ({
      ...a,
      industries: a.industries.includes(i) ? a.industries.filter(x => x !== i) : [...a.industries, i]
    }));
  };

  const run = async () => {
    if (!workflowId) { setError("Run the Collaborator Agent first."); return; }
    setRunning(true); setError("");
    try {
      const res = await fetch(`${API}/agent/business/run`, {
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
            setSteps(stepList.find(s => s.agentName === "business"));
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
          <Briefcase className="w-6 h-6 text-amber-600" />
          <div>
            <h3 className="font-bold text-lg">Business Agent</h3>
            <p className="text-xs text-slate-500">Analytical scoring + investor thesis matching</p>
          </div>
        </div>
        <AgentOwnerBadge name="Samaranayaka G.A.D.D.P" studentId="IT24101693" color="amber" />
      </div>

      {!workflowId && (
        <div className="bg-yellow-50 border border-yellow-300 rounded-xl p-3 text-xs text-yellow-800 flex items-center gap-2">
          <AlertCircle className="w-4 h-4" /> Run the Collaborator Agent first.
        </div>
      )}

      {workflowId && (
        <HandoffBanner fromAgent="Collaborator Agent" owner="Aabid" items={["plan", "requiredSkills", "topCandidates"]} />
      )}

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-4">
        <div>
          <label className="text-xs font-bold text-slate-700">Q1. Amount seeking</label>
          <select value={answers.amount} onChange={(e) => setAnswers({ ...answers, amount: e.target.value })}
            className="mt-1 w-full px-3 py-2 text-xs border border-slate-300 rounded-lg">
            <option value="under-500k">Under LKR 500,000</option>
            <option value="500k-1m">LKR 500,000 – 1,000,000</option>
            <option value="1m-5m">LKR 1M – 5M</option>
            <option value="over-5m">Over LKR 5M</option>
          </select>
        </div>

        <div>
          <label className="text-xs font-bold text-slate-700">
            Q2. Investor thesis areas {thesisOptions.length > 0 && <span className="text-slate-400 font-normal">({thesisOptions.length} from DB)</span>}
          </label>
          <div className="mt-2 max-h-48 overflow-y-auto border border-slate-200 rounded-lg p-3 bg-white">
            {loadingOptions ? (
              <div className="text-xs text-slate-400 italic">Loading theses from database…</div>
            ) : thesisOptions.length === 0 ? (
              <div className="text-xs text-slate-400 italic">No thesis data available.</div>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {thesisOptions.map(i => (
                  <button key={i} onClick={() => toggleIndustry(i)}
                    className={`text-xs px-2.5 py-1 rounded-full border font-semibold transition-all ${
                      answers.industries.includes(i)
                        ? "bg-amber-600 text-white border-amber-600"
                        : "bg-white text-slate-700 border-slate-300 hover:border-amber-500"
                    }`}>
                    {i}
                  </button>
                ))}
              </div>
            )}
          </div>
          {answers.industries.length > 0 && (
            <div className="mt-2 text-[11px] text-slate-600">
              <b>Selected ({answers.industries.length}):</b> {answers.industries.join(", ")}
            </div>
          )}
        </div>

        <div>
          <label className="text-xs font-bold text-slate-700">Q3. Stage</label>
          <select value={answers.stage} onChange={(e) => setAnswers({ ...answers, stage: e.target.value })}
            className="mt-1 w-full px-3 py-2 text-xs border border-slate-300 rounded-lg">
            <option value="preseed">Pre-seed</option>
            <option value="seed">Seed</option>
            <option value="series-a">Series A</option>
          </select>
        </div>

        <button onClick={run} disabled={running || !workflowId}
          className="w-full py-2.5 text-sm font-bold bg-amber-600 hover:bg-amber-700 text-white rounded-full disabled:opacity-50 flex items-center justify-center">
          {running ? <Loader className="w-4 h-4 mr-2 animate-spin" /> : <Play className="w-4 h-4 mr-2" />}
          {running ? "Analyzing…" : "Run Business Agent"}
        </button>
      </div>

      {error && <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-xs text-red-700 font-mono">{error}</div>}

      {result && result.analysis && (
        <>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-amber-700 font-bold text-sm">
              <CheckCircle2 className="w-4 h-4" /> Analysis Complete
            </div>
            {parsedOutput && <ConfidenceBadge value={parsedOutput.confidence || 0.7} />}
          </div>

          {parsedOutput?.reasoningTrace && <ReasoningTrace lines={parsedOutput.reasoningTrace} />}
          {parsedOutput?.toolsCalled && <ToolsPanel tools={parsedOutput.toolsCalled} />}

          <div className="bg-white border border-amber-200 rounded-xl p-4 space-y-3">
            <div className="text-center">
              <div className="text-5xl font-black text-amber-600">{result.analysis.score}<span className="text-xl text-slate-400">/100</span></div>
              <div className="text-[11px] uppercase font-bold text-slate-500 mt-1">Traction Score</div>
            </div>

            {result.analysis.scoreBreakdown?.length > 0 && (
              <div className="bg-amber-50 rounded-lg p-3">
                <div className="text-[10px] uppercase font-bold text-slate-600 mb-2">Score Composition</div>
                <div className="space-y-1 font-mono text-[11px]">
                  {result.analysis.scoreBreakdown.map((line, i) => <div key={i} className="text-slate-700">{line}</div>)}
                </div>
              </div>
            )}

            {result.analysis.pitchDraft && (
              <div>
                <div className="text-xs font-bold text-slate-600 mb-1">Investor Pitch:</div>
                <div className="text-xs italic bg-amber-50 p-3 rounded-lg">"{result.analysis.pitchDraft}"</div>
              </div>
            )}
          </div>

          <div className="bg-white border border-amber-200 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="text-xs font-bold text-slate-600">Investor Matches ({result.analysis.investorMatches?.length || 0})</div>
              {result.analysis.rejectedCount > 0 && (
                <div className="text-[10px] text-slate-400">{result.analysis.rejectedCount} rejected (&lt;30%)</div>
              )}
            </div>
            {result.analysis.investorMatches?.map((inv, i) => (
              <div key={i} className="bg-white border border-amber-200 rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <div className="font-bold text-xs">{inv.Name || inv.name}</div>
                    <div className="text-[10px] text-slate-500">{inv.Company || inv.company} · {inv.Industry || inv.industry}</div>
                  </div>
                  <MatchBadge score={inv.matchScore} />
                </div>
                {inv.thesis?.length > 0 && (
                  <div className="text-[10px] text-slate-500 flex items-center gap-1 flex-wrap mb-1">
                    <span className="font-bold">Thesis:</span>
                    {inv.thesis.map((t, j) => <span key={j} className="bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded">{t}</span>)}
                  </div>
                )}
              </div>
            ))}
          </div>

          {onSuccess && (
            <button onClick={onSuccess} className="w-full py-2 text-xs font-bold text-amber-600 border border-amber-300 rounded-full hover:bg-amber-50">
              Next: Professor Agent →
            </button>
          )}
        </>
      )}
    </div>
  );
}
