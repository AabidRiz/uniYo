import React, { useState, useEffect } from 'react';
import { Target, Users, TrendingUp, Globe, Lock } from 'lucide-react';
import { api } from '../../../api/client';

export default function ProfAdvisedProjectsView({ currentUser, onOpenProject }) {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try { setProjects(await api.getAdvisedProjects(currentUser.id)); }
    catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [currentUser.id]);

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
        <div className="flex items-center space-x-2 text-emerald-600 font-semibold text-xs mb-1">
          <Target className="w-4 h-4" /><span>Faculty Advisor</span>
        </div>
        <h2 className="text-xl font-bold text-slate-900">Projects You Advise</h2>
        <p className="text-xs text-slate-500 mt-1">You have read-only access to tasks, meetings and repos. You can post in project chat.</p>
      </div>

      {loading ? (
        <div className="text-center py-12 text-slate-400 text-xs">Loading…</div>
      ) : projects.length === 0 ? (
        <div className="text-center py-16 text-slate-400 text-xs">
          You aren't advising any projects yet.<br />
          Students will send you advisement requests from the Collaborate tab.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {projects.map(p => (
            <div key={p.id} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs card-hover">
              <div className="flex items-start justify-between">
                <h3 className="font-bold text-sm text-slate-900 flex-1">{p.title}</h3>
                {p.visibility === 'private'
                  ? <Lock className="w-4 h-4 text-slate-400" />
                  : <Globe className="w-4 h-4 text-emerald-500" />}
              </div>
              <p className="text-xs text-slate-600 mt-2 line-clamp-2">{p.description}</p>
              <div className="mt-3 flex items-center space-x-2">
                <img src={p.ownerAvatar} alt="" className="w-6 h-6 rounded-full border" />
                <span className="text-[11px] text-slate-600">Led by <span className="font-semibold">{p.ownerName}</span></span>
              </div>
              <div className="mt-3 pt-3 border-t border-slate-100 grid grid-cols-2 gap-2 text-xs">
                <div className="flex items-center text-slate-600">
                  <Users className="w-3.5 h-3.5 mr-1 text-slate-400" />
                  {p.memberCount} member{p.memberCount === 1 ? '' : 's'}
                </div>
                <div className="flex items-center text-emerald-600 font-mono">
                  <TrendingUp className="w-3.5 h-3.5 mr-1" />
                  {p.tractionScore}/100
                </div>
              </div>
              <button onClick={() => onOpenProject && onOpenProject(p.id)}
                className="mt-4 w-full linkedin-btn-outline py-2 text-xs font-semibold">
                Open Project
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}