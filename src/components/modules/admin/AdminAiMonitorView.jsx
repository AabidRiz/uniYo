import React from 'react';
import { Terminal, Bot, CheckCircle2 } from 'lucide-react';
import { INITIAL_AGENT_WORKFLOW_LOGS } from '../../../data/mockData';

export default function AdminAiMonitorView() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
      
      {/* Header */}
      <div className="bg-slate-950 text-slate-100 rounded-2xl p-6 shadow-xl border border-slate-800 flex items-center justify-between">
        <div className="flex items-center space-x-2 text-blue-400">
          <Terminal className="w-6 h-6" />
          <div>
            <h2 className="font-mono font-bold text-lg text-white">Agentic AI Execution Trace & PostgreSQL Audit Log</h2>
            <p className="text-xs text-slate-400">Step-by-step tool calls, structured JSON outputs, and confidence metrics</p>
          </div>
        </div>

        <span className="text-xs font-mono text-emerald-400 bg-emerald-950/80 px-3 py-1 rounded-full border border-emerald-800">
          Orchestrator Online • 4 Agents Active
        </span>
      </div>

      <div className="space-y-4">
        {INITIAL_AGENT_WORKFLOW_LOGS.map((log) => (
          <div key={log.id} className="border border-slate-800 bg-slate-900 rounded-2xl p-5 font-mono text-xs shadow-md">
            <div className="flex items-center justify-between text-xs border-b border-slate-800 pb-2 mb-3">
              <span className="font-bold text-amber-400 flex items-center">
                <Bot className="w-4 h-4 mr-1.5 text-blue-400" />
                {log.agentName}
              </span>
              <span className="text-slate-400">{log.timestamp}</span>
            </div>

            <div className="text-slate-300 mb-3">
              <span className="text-slate-500">Trigger Goal:</span> <span className="text-white font-semibold">{log.trigger}</span>
            </div>

            <div className="space-y-2">
              {log.steps.map((step, idx) => (
                <div key={idx} className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                  <div className="flex items-center justify-between text-blue-400 font-bold text-[11px]">
                    <span>Step {step.step}: tool_call --&gt; {step.action}()</span>
                    <span className="text-emerald-400">EXECUTED</span>
                  </div>
                  <div className="text-slate-400 text-[11px]">Input: <span className="text-slate-200">{step.input}</span></div>
                  <div className="text-slate-400 text-[11px]">Output: <span className="text-amber-300">{step.result}</span></div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

    </div>
  );
}
