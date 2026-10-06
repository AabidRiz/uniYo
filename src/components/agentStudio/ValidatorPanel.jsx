import React, { useState } from "react";
import { ShieldCheck, Play, Loader, CheckCircle2, XCircle, AlertCircle, X } from "lucide-react";
import AgentOwnerBadge from "./AgentOwnerBadge";
import ReasoningTrace from "./ReasoningTrace";
import ToolsPanel from "./ToolsPanel";
import ConfidenceBadge from "./ConfidenceBadge";

const API = "http://localhost:5000/api";

export default function ValidatorPanel({ projectId, workflowId, setWorkflowId }) {
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState(null);
  const [steps, setSteps] = useState(null);
  const [error, setError] = useState("");
  const [approvalStatus, setApprovalStatus] = useState(null);

  const run = async () => {
    if (!workflowId) { setError("Run the Collaborator Agent first."); return; }
    setRunning(true); setError("");
    try {
      const res = await fetch(`${API}/agent/validator/run`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, initiatorId: "usr_std_01", workflowId, questionnaire: {} })
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
            setSteps(stepList.find(s => s.agentName === "validator"));
          }
        } catch {}
      }, 200);
    } catch (e) { setError(e.message); }
    finally { setRunning(false); }
  };

  const approve = async () => {
    if (!result) return;
    const res = await fetch(`${API}/agent/${result.workflowId}/approve`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ actorId: "usr_std_01" })
    });
    if (res.ok) setApprovalStatus("approved");
  };

  const reject = async () => {
    const reason = prompt("Reason for rejection?");
    if (!reason) return;
    const res = await fetch(`${API}/agent/${result.workflowId}/reject`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ actorId: "usr_std_01", reason })
    });
    if (res.ok) setApprovalStatus("rejected");
  };

  const parsedOutput = steps?.output ? (typeof steps.output === "string" ? JSON.parse(steps.output) : steps.output) : null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <ShieldCheck className="w-6 h-6 text-emerald-600" />
          <div>
            <h3 className="font-bold text-lg">Validator Agent</h3>
            <p className="text-xs text-slate-500">Deterministic compliance — 8 rules, no LLM</p>
          </div>
        </div>
        <AgentOwnerBadge name="Jayasooriya J.R.M" studentId="IT24102916" color="emerald" />
      </div>

      {!workflowId && (
        <div className="bg-yellow-50 border border-yellow-300 rounded-xl p-3 text-xs text-yellow-800 flex items-center gap-2">
          <AlertCircle className="w-4 h-4" /> Run all three previous agents first.
        </div>
      )}

      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 space-y-3">
        <div className="text-xs font-bold text-slate-700">Deterministic rules checked:</div>
        <div className="grid grid-cols-2 gap-1 text-[10px] text-slate-600">
          <div>1. Plan exists</div>
          <div>2. Plan ≥ 3 steps</div>
          <div>3. Has candidates</div>
          <div>4. Analysis exists</div>
          <div>5. Traction ≥ 50</div>
          <div>6. Investor matched</div>
          <div>7. Advisor assigned</div>
          <div>8. Endorsement drafted</div>
        </div>
        <button onClick={run} disabled={running || !workflowId}
          className="w-full py-2.5 text-sm font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-full disabled:opacity-50 flex items-center justify-center">
          {running ? <Loader className="w-4 h-4 mr-2 animate-spin" /> : <Play className="w-4 h-4 mr-2" />}
          {running ? "Checking…" : "Run Validator Agent"}
        </button>
      </div>

      {error && <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-xs text-red-700 font-mono">{error}</div>}

      {result && result.validation && (
        <>
          <div className="flex items-center justify-between">
            <div className={`flex items-center gap-2 font-bold text-sm ${result.validation.valid ? "text-emerald-700" : "text-red-700"}`}>
              {result.validation.valid ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
              {result.validation.valid ? "✓ ALL CHECKS PASSED" : "✗ VALIDATION FAILED"}
            </div>
            <ConfidenceBadge value={1.0} />
          </div>

          {parsedOutput?.reasoningTrace && <ReasoningTrace lines={parsedOutput.reasoningTrace} />}
          {parsedOutput?.toolsCalled && <ToolsPanel tools={parsedOutput.toolsCalled} />}

          {/* Check table */}
          <div className="bg-white border border-emerald-200 rounded-xl p-4 space-y-2">
            <div className="text-xs font-bold text-slate-700 mb-2">
              Compliance Report — {result.validation.passedCount}/{result.validation.checkCount} passed
            </div>
            <div className="space-y-1">
              {result.validation.checks?.map((c, i) => (
                <div key={i} className={`flex items-center justify-between px-3 py-1.5 rounded text-[11px] font-mono ${
                  c.passed ? "bg-emerald-50 border border-emerald-200" : "bg-red-50 border border-red-200"
                }`}>
                  <span className="flex items-center gap-2">
                    {c.passed ? <CheckCircle2 className="w-3 h-3 text-emerald-600" /> : <X className="w-3 h-3 text-red-600" />}
                    <span className={c.passed ? "text-emerald-800" : "text-red-800"}>{c.rule}</span>
                  </span>
                  <span className="text-slate-500">{c.detail}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Errors */}
          {result.validation.errors?.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-xs text-red-700">
              <b>Errors ({result.validation.errors.length}):</b>
              <ul className="list-disc list-inside mt-1 font-mono">
                {result.validation.errors.map((e, i) => <li key={i}>{e}</li>)}
              </ul>
            </div>
          )}

          {/* Approval gate */}
          {result.validation.requiresApproval && !approvalStatus && (
            <div className="bg-amber-50 border-2 border-amber-400 rounded-xl p-4 space-y-3">
              <div className="flex items-center gap-2 text-amber-900 font-bold text-sm">
                <AlertCircle className="w-5 h-5" /> ⏸ HIGH-IMPACT ACTION — AWAITING HUMAN APPROVAL
              </div>
              <div className="text-[10px] font-mono text-slate-600 bg-white rounded px-2 py-1">
                approvalId: {result.approvalId}
              </div>
              <div className="text-xs text-amber-800">
                The workflow has paused. An authorized user must approve before the project is published to investors.
              </div>
              <div className="flex gap-2">
                <button onClick={approve} className="flex-1 py-3 bg-emerald-600 text-white rounded-lg text-sm font-bold flex items-center justify-center">
                  <CheckCircle2 className="w-4 h-4 mr-1" /> Approve & Publish
                </button>
                <button onClick={reject} className="flex-1 py-3 bg-red-600 text-white rounded-lg text-sm font-bold flex items-center justify-center">
                  <XCircle className="w-4 h-4 mr-1" /> Reject
                </button>
              </div>
            </div>
          )}

          {approvalStatus && (
            <div className={`rounded-xl p-4 text-sm font-bold text-center ${approvalStatus === "approved" ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-800"}`}>
              {approvalStatus === "approved" ? "✅ Workflow APPROVED — Project published to investors" : "❌ Workflow REJECTED"}
            </div>
          )}
        </>
      )}
    </div>
  );
}
