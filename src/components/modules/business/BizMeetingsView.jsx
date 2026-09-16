import React, { useState, useEffect } from 'react';
import { Calendar, CheckCircle2, Clock, Sparkles } from 'lucide-react';
import { api } from '../../../api/client';

export default function BizMeetingsView({ currentUser }) {
  const [investments, setInvestments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getInvestments().then(data => {
      setInvestments(data);
      setLoading(false);
    }).catch(console.error);
  }, []);

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
      
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
        <div className="flex items-center space-x-2 text-amber-600 font-semibold text-xs mb-1">
          <Calendar className="w-4 h-4" />
          <span>Dedicated Investor Pitch Calendar & Meeting Pipeline</span>
        </div>
        <h2 className="text-xl font-bold text-slate-900">Scheduled Student Pitch Meetings</h2>
        <p className="text-xs text-slate-500 mt-1">
          Manage pitch meeting invites sent to student project leads across Sri Lankan campuses.
        </p>
      </div>

      {/* Pipeline List */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
        <h3 className="font-bold text-slate-900 text-sm flex items-center">
          <Clock className="w-4 h-4 text-amber-600 mr-2" />
          <span>Active Investor Pitch Schedule ({investments.length})</span>
        </h3>

        {investments.length === 0 ? (
          <div className="text-center py-10 text-slate-400 text-xs">
            No pitch meetings scheduled yet. Discover student ideas and request a meeting!
          </div>
        ) : (
          <div className="space-y-3">
            {investments.map((inv) => (
              <div key={inv.id} className="p-4 border border-amber-200 bg-amber-50/40 rounded-xl flex items-center justify-between">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-xs text-slate-900">{inv.projectTitle}</span>
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-bold">{inv.status}</span>
                  </div>
                  <p className="text-xs text-slate-600 mt-1">Student Lead: <span className="font-semibold">{inv.studentLead}</span></p>
                  <p className="text-[11px] text-slate-500 mt-0.5 font-mono">🤖 AI Note: {inv.aiSummary}</p>
                </div>

                <span className="text-xs font-mono font-bold text-slate-800 bg-white px-3 py-1.5 border rounded-lg">
                  📅 {inv.meetingSlot}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
