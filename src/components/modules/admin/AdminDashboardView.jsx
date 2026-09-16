import React, { useEffect, useState } from 'react';
import { Check, FileCheck, Flag, FolderKanban, Landmark, Search, ShieldCheck, Trash2, Users, X } from 'lucide-react';
import { api } from '../../../api/client';

const tabs = [['verification', 'Verification'], ['investments', 'Investments'], ['content', 'Content'], ['complaints', 'Complaints'], ['accounts', 'Accounts']];

export default function AdminDashboardView() {
  const [active, setActive] = useState('verification');
  const [queue, setQueue] = useState([]);
  const [investments, setInvestments] = useState([]);
  const [content, setContent] = useState({ posts: [], projects: [], videos: [], complaints: [] });
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const [q, i, c, u] = await Promise.all([api.getAdminQueue(), api.getAdminInvestments(), api.getAdminContent(), api.getUsers()]);
      setQueue(q); setInvestments(i); setContent(c); setUsers(u);
    } catch (err) { alert(err.message); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const moderateUser = async (item, action) => {
    try {
      if (item.user_id && item.role !== 'student') await api.verifyUser(item.user_id, action);
      else await api.verifyStudent(item.id, action);
      await load();
    } catch (err) { alert(err.message); }
  };
  const moderateContent = async (type, id) => {
    if (!window.confirm('Delete this content permanently?')) return;
    try { await api.deleteAdminContent(type, id); await load(); } catch (err) { alert(err.message); }
  };
  const moderateComplaint = async (id, action) => {
    try { await api.moderateComplaint(id, action); await load(); } catch (err) { alert(err.message); }
  };

  if (loading) return <div className="max-w-7xl mx-auto p-10 text-center text-slate-400 text-sm">Loading admin control center…</div>;
  const filteredUsers = users.filter(u => `${u.name} ${u.email} ${u.company || ''}`.toLowerCase().includes(search.toLowerCase()));

  return <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
    <header className="bg-slate-950 text-white rounded-2xl p-6"><div className="flex items-center gap-3"><ShieldCheck className="w-8 h-8 text-emerald-400" /><div><h1 className="text-2xl font-black">UniYO Admin Control Center</h1><p className="text-xs text-slate-300 mt-1">Review, approve, remove, and audit platform activity.</p></div></div><nav className="mt-6 flex gap-1 overflow-x-auto">{tabs.map(([id, label]) => <button key={id} onClick={() => setActive(id)} className={`px-4 py-2 rounded-lg text-xs font-bold whitespace-nowrap ${active === id ? 'bg-emerald-500 text-slate-950' : 'text-slate-300 hover:bg-white/10'}`}>{label}<span className="ml-1.5 opacity-70">{id === 'verification' ? queue.filter(x => x.status === 'Pending').length : id === 'investments' ? investments.filter(x => x.status === 'Pending' || x.status === 'Screening').length : ''}</span></button>)}</nav></header>

    {active === 'verification' && <section className="bg-white border rounded-2xl p-6"><SectionTitle icon={FileCheck} title="Registration verification" desc="Review professor and enterprise documents before access is granted. Rejection permanently deletes the account." />{queue.filter(x => x.status === 'Pending').length === 0 ? <Empty text="No pending registrations." /> : <div className="space-y-3 mt-5">{queue.filter(x => x.status === 'Pending').map(item => <div key={item.id || item.user_id} className="border rounded-xl p-4 flex justify-between gap-4"><div><div className="flex gap-2 items-center"><b className="text-sm">{item.name}</b><span className="text-[10px] px-2 py-1 rounded-full bg-blue-50 text-blue-700">{item.role || 'student'}</span></div><p className="text-xs text-slate-500 mt-1">{item.email} · {item.company || item.university || '—'}</p><p className="text-xs text-slate-600 mt-2">{item.flag_reason || item.verification_reason || 'Pending admin review'}</p>{item.enterprise_profile && <p className="text-[11px] text-slate-500 mt-2">BRN: {item.enterprise_profile.brn || '—'} · TIN: {item.enterprise_profile.tin || '—'}</p>}</div><div className="flex gap-2 items-start"><button onClick={() => moderateUser(item, 'reject')} className="px-3 py-1.5 text-xs font-bold text-red-700 bg-red-50 rounded-lg"><X className="inline w-3.5 h-3.5 mr-1" />Reject & delete</button><button onClick={() => moderateUser(item, 'approve')} className="px-3 py-1.5 text-xs font-bold text-white bg-emerald-600 rounded-lg"><Check className="inline w-3.5 h-3.5 mr-1" />Approve</button></div></div>)}</div>}</section>}

    {active === 'investments' && <section className="bg-white border rounded-2xl p-6"><SectionTitle icon={Landmark} title="Investment approvals" desc="Admin approval is required before an investor pitch enters the approved pipeline." />{investments.length === 0 ? <Empty text="No investment requests." /> : <div className="space-y-3 mt-5">{investments.map(item => <div key={item.id} className="border rounded-xl p-4 flex justify-between"><div><b className="text-sm">{item.project_title}</b><p className="text-xs text-slate-500 mt-1">{item.investor_name} · {item.student_lead}</p><p className="text-xs mt-2">{item.target_amount} · {item.status}</p></div><div className="flex gap-2">{['Pending', 'Screening'].includes(item.status) && <><button onClick={async () => { await api.moderateInvestment(item.id, 'reject'); await load(); }} className="px-3 py-1.5 text-xs text-red-700 bg-red-50 rounded-lg">Reject</button><button onClick={async () => { await api.moderateInvestment(item.id, 'approve'); await load(); }} className="px-3 py-1.5 text-xs text-white bg-emerald-600 rounded-lg">Approve</button></>}</div></div>)}</div>}</section>}

    {active === 'content' && <section className="space-y-5"><ContentGroup title="Posts" icon={MessageIcon} items={content.posts} type="posts" label={x => `${x.author_name}: ${x.content}`} onDelete={moderateContent} /><ContentGroup title="Projects" icon={FolderKanban} items={content.projects} type="projects" label={x => `${x.title} · ${x.owner_name}`} onDelete={moderateContent} /><ContentGroup title="Professor videos" icon={FileCheck} items={content.videos} type="videos" label={x => `${x.title} · ${x.description || ''}`} onDelete={moderateContent} /></section>}

    {active === 'complaints' && <section className="bg-white border rounded-2xl p-6"><SectionTitle icon={Flag} title="Complaints and reported reviews" desc="Review professor complaints and remove content when appropriate." />{content.complaints.length === 0 ? <Empty text="No complaints submitted." /> : <div className="space-y-3 mt-5">{content.complaints.map(item => <div key={item.id} className="border rounded-xl p-4 flex justify-between"><div><b className="text-xs">{item.target_type}</b><p className="text-xs text-slate-600 mt-1">{item.reason}</p><span className="text-[10px] text-slate-400">{item.status}</span></div>{item.status === 'Pending' && <div className="flex gap-2"><button onClick={() => moderateComplaint(item.id, 'review')} className="px-3 py-1.5 text-xs bg-slate-100 rounded">Keep</button><button onClick={() => moderateComplaint(item.id, 'remove')} className="px-3 py-1.5 text-xs bg-red-600 text-white rounded">Remove content</button></div>}</div>)}</div>}</section>}

    {active === 'accounts' && <section className="bg-white border rounded-2xl p-6"><SectionTitle icon={Users} title="All accounts" desc="Administrators can remove any account from the platform." /><div className="relative mt-4"><Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search accounts" className="w-full border rounded-lg pl-9 py-2 text-xs" /></div><div className="space-y-2 mt-4">{filteredUsers.map(user => <div key={user.id} className="flex justify-between items-center border rounded-lg p-3"><div><b className="text-xs">{user.name}</b><p className="text-[11px] text-slate-500">{user.role} · {user.email} · {user.company || user.university || '—'}</p></div>{user.role !== 'admin' && <button onClick={() => moderateUser(user, 'reject')} className="text-red-600 p-1.5" title="Delete account"><Trash2 className="w-4 h-4" /></button>}</div>)}</div></section>}
  </div>;
}

function SectionTitle({ icon: Icon, title, desc }) { return <div className="flex gap-3"><Icon className="w-5 h-5 text-emerald-600" /><div><h2 className="text-xl font-bold text-slate-900">{title}</h2><p className="text-xs text-slate-500 mt-1">{desc}</p></div></div>; }
function ContentGroup({ title, icon: Icon, items, type, label, onDelete }) { return <div className="bg-white border rounded-2xl p-6"><h2 className="font-bold text-slate-900 flex items-center gap-2"><Icon className="w-4 h-4 text-emerald-600" />{title} ({items.length})</h2><div className="space-y-2 mt-4">{items.map(item => <div key={item.id} className="border rounded-lg p-3 flex justify-between gap-3"><p className="text-xs text-slate-700 line-clamp-2">{label(item)}</p><button onClick={() => onDelete(type, item.id)} className="text-red-600 shrink-0"><Trash2 className="w-4 h-4" /></button></div>)}</div>{items.length === 0 && <Empty text={`No ${title.toLowerCase()}.`} />}</div>; }
function MessageIcon() { return <MessageSquareIcon />; }
function MessageSquareIcon() { return <Flag className="w-4 h-4" />; }
function Empty({ text }) { return <p className="text-xs text-slate-400 text-center py-8">{text}</p>; }
