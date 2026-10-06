import React, { useEffect, useState } from 'react';
import {
  Briefcase, Building2, CheckCircle2, ChevronRight, DollarSign, FileText,
  KanbanSquare, MessageSquare, Plus, Search, ShieldCheck, Target, Users,
  Wallet, X
} from 'lucide-react';
import { api } from '../../api/client';
import InvestmentMeetingPanel from '../common/InvestmentMeetingPanel';

const tabs = [
  ['overview', 'Overview'], ['portfolio', 'Portfolio'], ['jobs', 'Jobs'],
  ['dealflow', 'Deal Flow'], ['founders', 'Founders'], ['compliance', 'Compliance']
];

export default function BusinessView({ currentUser }) {
  const [active, setActive] = useState('overview');
  const [projects, setProjects] = useState([]);
  const [investments, setInvestments] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showJobForm, setShowJobForm] = useState(false);
  const [job, setJob] = useState({ title: '', type: 'Internship', location: '', stipend: '', description: '' });
  const [search, setSearch] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const [p, i, j, feed] = await Promise.all([
        api.getProjects(currentUser.id),
        api.getInvestments(currentUser.id),
        api.getInternships({ ownerId: currentUser.id }),
        api.getPosts()
      ]);
      setProjects(p.filter(project => project.seekingInvestment || project.seeking_investment));
      setInvestments(i);
      setJobs(j);
      setPosts(feed.slice(0, 6));
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [currentUser.id]);

  const createJob = async event => {
    event.preventDefault();
    try {
      await api.createInternship({ ...job, company: currentUser.company || currentUser.name, ownerId: currentUser.id });
      setShowJobForm(false);
      setJob({ title: '', type: 'Internship', location: '', stipend: '', description: '' });
      await load();
    } catch (err) { alert(err.message); }
  };

  const requestPitch = async project => {
    try {
      await api.createInvestment({
        projectId: project.id,
        projectTitle: project.title,
        studentLead: `${project.owner?.name || 'Student founder'} (${project.owner?.university || 'University'})`,
        investorId: currentUser.id,
        investorName: currentUser.company || currentUser.name,
        targetAmount: project.investmentGoal || project.investment_goal || 'To be discussed',
        status: 'Screening',
        aiSummary: 'Inbound pitch from UniYO project discovery.'
      });
      await load();
    } catch (err) { alert(err.message); }
  };

  if (loading) return <div className="max-w-7xl mx-auto px-4 py-16 text-center text-slate-400 text-sm">Loading enterprise workspace…</div>;

  if (!currentUser.verified) return <PendingReview currentUser={currentUser} />;

  const activeInvestments = investments.filter(item => !['Passed', 'Exited', 'Written off'].includes(item.status));
  const totalTarget = investments.reduce((sum, item) => sum + parseAmount(item.targetAmount), 0);
  const filteredProjects = projects.filter(project => `${project.title} ${project.description}`.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      <header className="bg-slate-950 text-white rounded-2xl p-6 shadow-lg">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="flex items-center gap-4"><div className="w-14 h-14 rounded-xl bg-amber-500 flex items-center justify-center"><Building2 className="w-7 h-7 text-slate-950" /></div><div><div className="flex items-center gap-2"><h1 className="text-2xl font-black">{currentUser.company || currentUser.name}</h1><ShieldCheck className="w-4 h-4 text-emerald-400" /></div><p className="text-xs text-slate-300 mt-1">Verified enterprise workspace · {currentUser.industry || 'Investor / hiring partner'}</p></div></div>
          <div className="flex items-center gap-2 text-xs text-slate-300"><CheckCircle2 className="w-4 h-4 text-emerald-400" />Connected to UniYO student and faculty network</div>
        </div>
        <nav className="mt-6 flex gap-1 overflow-x-auto">{tabs.map(([id, label]) => <button key={id} onClick={() => setActive(id)} className={`px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap ${active === id ? 'bg-amber-500 text-slate-950' : 'text-slate-300 hover:bg-white/10'}`}>{label}</button>)}</nav>
      </header>

      {active === 'overview' && <Overview currentUser={currentUser} investments={investments} activeInvestments={activeInvestments} totalTarget={totalTarget} jobs={jobs} posts={posts} onNavigate={setActive} />}
      {active === 'portfolio' && <Portfolio investments={investments} currentUser={currentUser} />}
      {active === 'jobs' && <Jobs jobs={jobs} onCreate={() => setShowJobForm(true)} onReload={load} />}
      {active === 'dealflow' && <Dealflow projects={filteredProjects} investments={investments} search={search} setSearch={setSearch} onPitch={requestPitch} />}
      {active === 'founders' && <Founders projects={projects} />}
      {active === 'compliance' && <Compliance currentUser={currentUser} />}

      {showJobForm && <Modal title="Create job posting" onClose={() => setShowJobForm(false)}><form onSubmit={createJob} className="space-y-3"><input required placeholder="Job title" value={job.title} onChange={e => setJob({ ...job, title: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-xs" /><div className="grid grid-cols-2 gap-2"><select value={job.type} onChange={e => setJob({ ...job, type: e.target.value })} className="border rounded-lg px-3 py-2 text-xs"><option>Internship</option><option>Full-time</option><option>Part-time</option><option>Contract</option><option>Graduate</option></select><input placeholder="Location" value={job.location} onChange={e => setJob({ ...job, location: e.target.value })} className="border rounded-lg px-3 py-2 text-xs" /></div><input placeholder="Stipend / salary" value={job.stipend} onChange={e => setJob({ ...job, stipend: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-xs" /><textarea required rows={4} placeholder="Description and required skills" value={job.description} onChange={e => setJob({ ...job, description: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-xs" /><button className="w-full bg-amber-600 text-white rounded-lg py-2 text-xs font-bold">Publish to students</button></form></Modal>}
    </div>
  );
}

function PendingReview({ currentUser }) { return <div className="max-w-5xl mx-auto px-4 py-10"><div className="bg-white border border-amber-200 rounded-2xl p-8 text-center shadow-xs"><ShieldCheck className="w-12 h-12 text-amber-500 mx-auto" /><h1 className="text-2xl font-black text-slate-900 mt-4">Enterprise verification pending</h1><p className="text-sm text-slate-600 max-w-xl mx-auto mt-2">Your company submission is being reviewed by the UniYO admin team. You can browse student projects in read-only mode while verification is pending.</p><div className="mt-6 inline-flex items-center gap-2 bg-amber-50 text-amber-800 px-4 py-2 rounded-full text-xs font-bold">Expected review: 24–48 hours</div><div className="mt-8 text-left max-w-md mx-auto border-t pt-4 text-xs text-slate-600"><b>Submitted identity</b><p className="mt-2">{currentUser.company || currentUser.name}</p><p>{currentUser.enterpriseProfile?.brn ? `BRN: ${currentUser.enterpriseProfile.brn}` : 'Registration documents submitted for review'}</p></div></div></div>; }

function Overview({ currentUser, investments, activeInvestments, totalTarget, jobs, posts, onNavigate }) { return <div className="space-y-6"><div className="grid grid-cols-2 lg:grid-cols-5 gap-4"><Kpi label="Capital tracked" value={formatLkr(totalTarget)} icon={Wallet} /><Kpi label="Active investments" value={activeInvestments.length} icon={Target} /><Kpi label="Founders backed" value={new Set(investments.map(i => i.studentLead)).size} icon={Users} /><Kpi label="Jobs posted" value={jobs.length} icon={Briefcase} /><Kpi label="Portfolio return" value="—" icon={DollarSign} /></div><div className="grid grid-cols-1 lg:grid-cols-3 gap-6"><div className="lg:col-span-2 bg-white border rounded-2xl p-6"><div className="flex justify-between"><div><h2 className="font-bold text-slate-900">Capital deployment plan</h2><p className="text-xs text-slate-500 mt-1">Track commitments against your enterprise mandate.</p></div><button onClick={() => onNavigate('portfolio')} className="text-xs text-amber-700 font-bold">View portfolio <ChevronRight className="inline w-3 h-3" /></button></div><div className="mt-6 h-3 bg-slate-100 rounded-full overflow-hidden"><div className="h-full bg-amber-500" style={{ width: `${Math.min(100, investments.length * 12)}%` }} /></div><div className="flex justify-between text-xs text-slate-500 mt-2"><span>{formatLkr(totalTarget)} tracked</span><span>{investments.length} opportunities</span></div><div className="mt-6 grid grid-cols-3 gap-3">{[['AI / ML', 42], ['AgriTech', 28], ['SaaS', 30]].map(([label, value]) => <div key={label}><div className="flex justify-between text-[11px] mb-1"><span>{label}</span><b>{value}%</b></div><div className="h-2 bg-slate-100 rounded"><div className="h-full bg-blue-500 rounded" style={{ width: `${value}%` }} /></div></div>)}</div></div><div className="bg-white border rounded-2xl p-6"><h2 className="font-bold text-slate-900">Recent activity</h2><div className="mt-3 space-y-3">{posts.slice(0, 4).map(post => <div key={post.id} className="text-xs border-b pb-3"><b>{post.author?.name}</b> shared an update<p className="text-slate-500 mt-1 line-clamp-2">{post.content}</p></div>)}{posts.length === 0 && <p className="text-xs text-slate-400">No activity yet.</p>}</div></div></div></div>; }

function Portfolio({ investments, currentUser }) {
  return (
    <section className="bg-white border rounded-2xl p-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Investment portfolio</h2>
          <p className="text-xs text-slate-500 mt-1">Every pitch and investment linked to this enterprise account. Approved deals let you schedule pitch meetings.</p>
        </div>
        <span className="text-xs font-bold text-amber-700">{investments.length} records</span>
      </div>
      {investments.length === 0 ? (
        <Empty text="No investments yet. Open Deal Flow to screen student projects." />
      ) : (
        <div className="mt-5 overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b text-slate-500">
                <th className="py-3">Project</th><th>Founder</th><th>Target</th><th>Status</th><th>Meeting</th>
              </tr>
            </thead>
            <tbody>
              {investments.map(item => (
                <React.Fragment key={item.id}>
                  <tr className="border-b last:border-0">
                    <td className="py-3 font-bold text-slate-900">{item.projectTitle}</td>
                    <td>{item.studentLead}</td>
                    <td>{item.targetAmount || '—'}</td>
                    <td><span className="px-2 py-1 rounded-full bg-amber-50 text-amber-800 font-bold">{item.status}</span></td>
                    <td>{item.meetingSlot || (item.status === 'Approved' ? 'Manage below ↓' : 'Not scheduled')}</td>
                  </tr>
                  {item.status === 'Approved' && (
                    <tr>
                      <td colSpan={5} className="bg-amber-50/40 px-4 pb-4 rounded-b-lg">
                        <InvestmentMeetingPanel
                          investment={item}
                          currentUser={currentUser}
                          role="investor"
                        />
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function Jobs({ jobs, onCreate, onReload }) { return <section className="space-y-4"><div className="bg-white border rounded-2xl p-6 flex justify-between items-center"><div><h2 className="text-xl font-bold text-slate-900">Jobs & hiring</h2><p className="text-xs text-slate-500 mt-1">Post opportunities that students see in the Jobs tab.</p></div><button onClick={onCreate} className="bg-amber-600 text-white rounded-lg px-4 py-2 text-xs font-bold"><Plus className="inline w-4 h-4 mr-1" />Create job</button></div>{jobs.map(job => <div key={job.id} className="bg-white border rounded-xl p-5"><div className="flex justify-between"><div><h3 className="font-bold text-sm">{job.title}</h3><p className="text-xs text-slate-500 mt-1">{job.type} · {job.location} · {job.stipend}</p></div><span className="text-xs text-emerald-700 font-bold">{(job.applicants || []).length} applicants</span></div><p className="text-xs text-slate-700 mt-3">{job.description}</p></div>)}{jobs.length === 0 && <Empty text="No company jobs posted yet." />}</section>; }

function Dealflow({ projects, investments, search, setSearch, onPitch }) { const ids = new Set(investments.map(i => i.projectId)); return <section className="space-y-4"><div className="bg-white border rounded-2xl p-6"><div className="flex items-center gap-2"><KanbanSquare className="w-5 h-5 text-amber-600" /><div><h2 className="text-xl font-bold">Student deal flow</h2><p className="text-xs text-slate-500">Screen projects, request pitch meetings, and move opportunities into your portfolio.</p></div></div><div className="mt-4 relative"><Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search projects and founders" className="w-full border rounded-lg pl-9 py-2 text-xs" /></div></div><div className="grid md:grid-cols-2 gap-4">{projects.map(project => <div key={project.id} className="bg-white border rounded-xl p-5"><div className="flex justify-between"><h3 className="font-bold text-sm">{project.title}</h3><span className="text-xs text-emerald-700 font-bold">{project.tractionScore}/100</span></div><p className="text-xs text-slate-500 mt-1">{project.owner?.name} · {project.owner?.university}</p><p className="text-xs text-slate-700 mt-3 line-clamp-3">{project.description}</p><button disabled={ids.has(project.id)} onClick={() => onPitch(project)} className="mt-4 w-full bg-amber-600 disabled:bg-emerald-100 disabled:text-emerald-800 text-white rounded-lg py-2 text-xs font-bold">{ids.has(project.id) ? 'Already in pipeline' : 'Request pitch meeting'}</button></div>)}</div>{projects.length === 0 && <Empty text="No student projects currently seeking investment." />}</section>; }

function Founders({ projects }) { return <section className="bg-white border rounded-2xl p-6"><h2 className="text-xl font-bold">Student founders</h2><p className="text-xs text-slate-500 mt-1">Founders connected to projects in your discovery network.</p><div className="mt-5 grid md:grid-cols-2 gap-3">{projects.map(project => <div key={project.id} className="border rounded-xl p-4 flex gap-3"><img src={project.owner?.avatar} alt="" className="w-10 h-10 rounded-full" /><div><b className="text-xs">{project.owner?.name}</b><p className="text-[11px] text-slate-500">{project.owner?.university}</p><p className="text-xs mt-1">{project.title}</p></div></div>)}</div></section>; }

function Compliance({ currentUser }) { return <section className="bg-white border rounded-2xl p-6 max-w-3xl"><h2 className="text-xl font-bold">Settings & compliance</h2><p className="text-xs text-slate-500 mt-1">Enterprise verification records and account controls.</p><div className="mt-5 space-y-3 text-xs"><Row label="Verification status" value={currentUser.verificationStatus || 'verified'} /><Row label="Company" value={currentUser.company || '—'} /><Row label="Industry" value={currentUser.industry || '—'} /><Row label="BRN" value={currentUser.enterpriseProfile?.brn || 'Not supplied'} /><Row label="TIN / VAT" value={currentUser.enterpriseProfile?.tin || 'Not supplied'} /></div></section>; }

function Row({ label, value }) { return <div className="flex justify-between border-b pb-2"><span className="text-slate-500">{label}</span><b>{value}</b></div>; }
function Kpi({ label, value, icon: Icon }) { return <div className="bg-white border rounded-xl p-4"><Icon className="w-4 h-4 text-amber-600" /><span className="block text-[11px] text-slate-500 mt-3">{label}</span><b className="block text-xl text-slate-900 mt-1">{value}</b></div>; }
function Empty({ text }) { return <div className="bg-white border rounded-xl p-10 text-center text-xs text-slate-400">{text}</div>; }
function Modal({ title, onClose, children }) { return <div className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4"><div className="bg-white rounded-2xl p-6 max-w-md w-full"><div className="flex justify-between mb-4"><h3 className="font-bold">{title}</h3><button onClick={onClose}><X className="w-5 h-5 text-slate-400" /></button></div>{children}</div></div>; }
function parseAmount(value) { const number = Number(String(value || '').replace(/[^0-9.]/g, '')); return Number.isFinite(number) ? number : 0; }
function formatLkr(value) { return value ? `LKR ${value.toLocaleString()}` : 'LKR 0'; }