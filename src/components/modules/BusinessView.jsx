import React, { useState, useEffect } from 'react';
import { Briefcase, Sparkles, MapPin, DollarSign, Send, CheckCircle2 } from 'lucide-react';
import { api } from '../../api/client';

export default function BusinessView({ currentUser }) {
  const [jobs, setJobs] = useState([]);
  const [projects, setProjects] = useState([]);
  const [applied, setApplied] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [j, p] = await Promise.all([api.getInternships(), api.getProjects()]);
        setJobs(j);
        setProjects(p.filter(x => x.seekingInvestment));
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    })();
  }, []);

  const applyToJob = async (jobId) => {
    try {
      // For now we only display — add /api/internships/:id/apply if needed
      setApplied(prev => ({ ...prev, [jobId]: true }));
    } catch (e) { console.error(e); }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
        <div className="flex items-center space-x-2 text-amber-700 font-semibold text-xs mb-1">
          <Briefcase className="w-4 h-4" /><span>Jobs & Investor Discover</span>
        </div>
        <h2 className="text-xl font-bold text-slate-900">Internships & Funded Student Projects</h2>
        <p className="text-xs text-slate-500 mt-1">Apply for internships or explore projects that are actively raising capital.</p>
      </div>

      <div>
        <h3 className="text-base font-bold text-slate-900 mb-3">Internships ({jobs.length})</h3>
        <div className="space-y-4">
          {jobs.map(job => (
            <div key={job.id} className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-bold text-sm text-slate-900">{job.title}</h4>
                  <p className="text-xs text-slate-500 mt-0.5">{job.company}</p>
                  <div className="flex items-center space-x-3 text-[11px] text-slate-500 mt-1.5">
                    <span className="flex items-center"><MapPin className="w-3 h-3 mr-1" />{job.location}</span>
                    <span className="flex items-center"><DollarSign className="w-3 h-3 mr-1" />{job.stipend}</span>
                  </div>
                  <p className="text-xs text-slate-700 mt-2">{job.description}</p>
                </div>
                <button onClick={() => applyToJob(job.id)} disabled={applied[job.id]}
                  className={`py-1.5 px-4 text-xs rounded-full font-bold flex items-center ${
                    applied[job.id] ? 'bg-emerald-100 text-emerald-800' : 'linkedin-btn-primary'
                  }`}>
                  {applied[job.id] ? (<><CheckCircle2 className="w-3.5 h-3.5 mr-1" />Applied</>) :
                    (<><Send className="w-3.5 h-3.5 mr-1" />Apply</>)}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-base font-bold text-slate-900 mb-3 flex items-center">
          <Sparkles className="w-4 h-4 text-amber-500 mr-2" />Projects Seeking Investment ({projects.length})
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {projects.map(p => (
            <div key={p.id} className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
              <div className="flex items-start justify-between">
                <h4 className="font-bold text-sm text-slate-900">{p.title}</h4>
                <span className="text-xs font-mono font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
                  {p.tractionScore}/100
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">Lead: {p.owner?.name} — {p.owner?.university}</p>
              <p className="text-xs text-slate-700 mt-2 line-clamp-3">{p.description}</p>
              <div className="mt-3 flex items-center justify-between">
                <span className="text-xs font-bold text-amber-700">{p.investmentGoal}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}