import React, { useState, useEffect } from 'react';
import { Sparkles, ArrowUpRight, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { api } from '../../../api/client';

export default function BizDiscoverView({ currentUser, onOpenAiAgent }) {
  const [projects, setProjects] = useState([]);
  const [selectedProj, setSelectedProj] = useState(null);
  const [meetingDate, setMeetingDate] = useState('2026-09-28 @ 2:00 PM PST');
  const [sentSuccess, setSentSuccess] = useState(false);

  useEffect(() => {
    api.getProjects().then(data => {
      setProjects(data.filter(p => p.seekingInvestment || p.seeking_investment));
    }).catch(console.error);
  }, []);

  const handlePitchRequestSubmit = async (e) => {
    e.preventDefault();
    if (!selectedProj) return;

    try {
      await api.createInvestment({
        projectTitle: selectedProj.title,
        studentLead: `${selectedProj.owner?.name || 'Kusal Perera'} (${selectedProj.owner?.university || 'SLIIT'})`,
        investorName: currentUser?.company || 'Lanka Venture Partners',
        targetAmount: selectedProj.investmentGoal || 'LKR 2,500,000',
        aiSummary: `Matched with investor thesis. High traction score (${selectedProj.tractionScore || 92}/100).`,
        meetingSlot: meetingDate
      });

      setSentSuccess(true);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
      
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-amber-600 font-semibold text-xs mb-1">
            <Sparkles className="w-4 h-4" />
            <span>Dedicated Student Project Dealflow & Investment Discovery</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900">Discover Student Ideas Seeking Seed Investment</h2>
          <p className="text-xs text-slate-500 mt-1">
            Browse verified cross-university projects from SLIIT, Moratuwa, Colombo, and Peradeniya.
          </p>
        </div>

        <button
          onClick={() => onOpenAiAgent('investment')}
          className="linkedin-btn-primary py-2 px-4 text-xs bg-amber-600 hover:bg-amber-700"
        >
          Run AI Investment Agent
        </button>
      </div>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {projects.map((proj) => (
          <div key={proj.id} className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs card-hover flex flex-col justify-between">
            <div>
              <div className="h-32 bg-slate-800 relative">
                <img src={proj.banner || 'https://images.unsplash.com/photo-1497435334941-8c899ee9e8e9?auto=format&fit=crop&w=1000&q=80'} alt={proj.title} className="w-full h-full object-cover opacity-80" />
                <span className="absolute top-3 right-3 bg-amber-500 text-white font-bold text-xs px-2.5 py-1 rounded-full shadow-md">
                  {proj.investmentGoal || 'LKR 2,500,000'}
                </span>
              </div>

              <div className="p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-slate-900 text-sm">{proj.title}</h3>
                  <span className="text-xs font-mono font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
                    Traction {proj.tractionScore || 92}/100
                  </span>
                </div>

                <p className="text-xs text-slate-500">Lead Founder: <span className="font-bold text-slate-800">{proj.owner?.name} ({proj.owner?.university})</span></p>

                <p className="text-xs text-slate-700 leading-relaxed">
                  {proj.description}
                </p>

                <div className="flex flex-wrap gap-1.5">
                  {(proj.skillsNeeded || []).map((s, idx) => (
                    <span key={idx} className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-medium">
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[11px] text-slate-500">Human Approval Checkpoint</span>
              <button
                onClick={() => { setSelectedProj(proj); setSentSuccess(false); }}
                className="linkedin-btn-primary py-1.5 px-4 text-xs flex items-center space-x-1 bg-amber-600 hover:bg-amber-700"
              >
                <span>Request Pitch Meeting</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* PITCH MEETING MODAL */}
      {selectedProj && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-slate-200">
            {!sentSuccess ? (
              <>
                <div className="flex items-center space-x-2 text-amber-600 text-xs font-bold mb-1">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Human Investor Approval Checkpoint</span>
                </div>
                <h3 className="text-lg font-bold text-slate-900">Request Pitch Meeting</h3>
                <p className="text-xs text-slate-500 mb-4">
                  Project: <span className="font-bold text-slate-900">{selectedProj.title}</span> ({selectedProj.owner?.university})
                </p>

                <form onSubmit={handlePitchRequestSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Proposed Meeting Window</label>
                    <input
                      type="text"
                      value={meetingDate}
                      onChange={e => setMeetingDate(e.target.value)}
                      className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-600 focus:outline-none"
                    />
                  </div>

                  <div className="pt-2 flex justify-end space-x-3">
                    <button
                      type="button"
                      onClick={() => setSelectedProj(null)}
                      className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900"
                    >
                      Cancel
                    </button>
                    <button type="submit" className="linkedin-btn-primary py-2 px-5 text-xs bg-amber-600 hover:bg-amber-700">
                      Approve & Save to PostgreSQL
                    </button>
                  </div>
                </form>
              </>
            ) : (
              <div className="text-center py-6 space-y-4">
                <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">Pitch Invitation Saved to PostgreSQL!</h3>
                <p className="text-xs text-slate-600">
                  The student lead has been notified.
                </p>
                <button
                  onClick={() => setSelectedProj(null)}
                  className="linkedin-btn-primary py-2 px-6 text-xs bg-amber-600"
                >
                  Done
                </button>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
