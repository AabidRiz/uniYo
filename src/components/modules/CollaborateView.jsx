import React, { useState, useEffect } from 'react';
import {
  Users, Plus, MessageSquare, FileText, GitBranch, Star, Send,
  Paperclip, FolderPlus, CheckCircle2, XCircle, Trash2, Calendar,
  Link as LinkIcon, Lock, Globe, Bell, LogOut, UserPlus,
  ListChecks, Clock, Target, Check, Edit3, GraduationCap, Award
} from 'lucide-react';
import { api } from '../../api/client';

const STATUSES = ['todo', 'in_progress', 'review', 'done'];
const PRIORITIES = ['low', 'medium', 'high', 'urgent'];

export default function CollaborateView({ currentUser, projects, onCreateProject, onRefresh, onOpenUser, initialProjectId }) {
  const [selectedId, setSelectedId] = useState(initialProjectId || null);
  const [tab, setTab] = useState('overview');
  const [creating, setCreating] = useState(false);
  const [busy, setBusy] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const [universities, setUniversities] = useState([]);
  const [newProj, setNewProj] = useState({
    title: '', description: '', skillsNeeded: '',
    openMode: 'all', openUniversities: [],
    seekingInvestment: false, investmentGoal: 'LKR 1,000,000', visibility: 'public'
  });

  const [editingProject, setEditingProject] = useState(false);
  const [editDraft, setEditDraft] = useState({
    title: '', description: '', skillsNeeded: '',
    visibility: 'public', seekingInvestment: false, investmentGoal: ''
  });

  const [chatInput, setChatInput] = useState('');
  const [taskDraft, setTaskDraft] = useState({
    title: '', description: '', status: 'todo', priority: 'medium',
    assigneeId: '', dueDate: ''
  });
  const [meetingDraft, setMeetingDraft] = useState({
    title: '', description: '', date: '', time: '', durationMinutes: 60,
    link: '', attendeeIds: []
  });
  const [inviteOpen, setInviteOpen] = useState(false);
  const [availableInvitees, setAvailableInvitees] = useState([]);
  const [inviteSearch, setInviteSearch] = useState('');
  const [repoDraft, setRepoDraft] = useState({ name: '', url: '' });
  const [docDraft, setDocDraft] = useState({ title: '', size: '', url: '' });
  const [joinPitch, setJoinPitch] = useState('');

  // Advisor picker
  const [advisorPickerOpen, setAdvisorPickerOpen] = useState(false);
  const [professors, setProfessors] = useState([]);
  const [advisorSearch, setAdvisorSearch] = useState('');
  const [advisorPitch, setAdvisorPitch] = useState('');
  const [selectedProf, setSelectedProf] = useState(null);

  useEffect(() => {
    api.getUniversities().then(setUniversities).catch(console.error);
    api.getProfessors().then(setProfessors).catch(console.error);
  }, []);

  useEffect(() => {
    if (projects.length && !selectedId) setSelectedId(projects[0].id);
  }, [projects, selectedId]);

  useEffect(() => {
    if (initialProjectId && projects.some(p => p.id === initialProjectId)) {
      setSelectedId(initialProjectId);
    }
  }, [initialProjectId, projects]);

  const project = projects.find(p => p.id === selectedId);
  const isMember = project?.isMember;
  const isOwner = project?.isOwner;
  const isAdvisor = project?.isAdvisor;
  const hasAdvisor = !!project?.advisor;
  const pendingAdvisorReq = project?.pendingAdvisorRequest;

  const myProjects = projects.filter(p => p.isMember);
  const advisedProjects = projects.filter(p => p.isAdvisor);
  const discoverable = projects.filter(p => !p.isMember && !p.isAdvisor);
  const q = searchQuery.trim().toLowerCase();
  const filterList = (list) => q
    ? list.filter(p =>
        p.title.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        (p.skillsNeeded || []).some(s => s.toLowerCase().includes(q)))
    : list;

  const buildOpenList = () => newProj.openMode === 'all' ? ['ALL'] : newProj.openUniversities;

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newProj.title.trim() || !newProj.description.trim()) return;
    if (newProj.openMode === 'custom' && newProj.openUniversities.length === 0) {
      alert('Select at least one university or choose "All universities".');
      return;
    }
    setBusy(true);
    try {
      const created = await onCreateProject({
        title: newProj.title,
        description: newProj.description,
        skillsNeeded: newProj.skillsNeeded.split(',').map(s => s.trim()).filter(Boolean),
        openUniversities: buildOpenList(),
        seekingInvestment: newProj.seekingInvestment,
        investmentGoal: newProj.seekingInvestment ? newProj.investmentGoal : null,
        visibility: newProj.visibility
      });
      setSelectedId(created.id);
      setCreating(false);
      setNewProj({
        title: '', description: '', skillsNeeded: '',
        openMode: 'all', openUniversities: [],
        seekingInvestment: false, investmentGoal: 'LKR 1,000,000', visibility: 'public'
      });
    } catch (err) { alert(err.message); }
    finally { setBusy(false); }
  };

  const openEditProject = () => {
    if (!project) return;
    setEditDraft({
      title: project.title,
      description: project.description,
      skillsNeeded: (project.skillsNeeded || []).join(', '),
      visibility: project.visibility || 'public',
      seekingInvestment: project.seekingInvestment || false,
      investmentGoal: project.investmentGoal || ''
    });
    setEditingProject(true);
  };

  const saveEditProject = async (e) => {
    e.preventDefault();
    try {
      await api.updateProject(project.id, {
        title: editDraft.title,
        description: editDraft.description,
        skillsNeeded: editDraft.skillsNeeded.split(',').map(s => s.trim()).filter(Boolean),
        visibility: editDraft.visibility,
        seekingInvestment: editDraft.seekingInvestment,
        investmentGoal: editDraft.seekingInvestment ? editDraft.investmentGoal : null,
        userId: currentUser.id
      });
      setEditingProject(false);
      await onRefresh();
    } catch (err) { alert(err.message); }
  };

  const deleteProject = async () => {
    if (!window.confirm(`Delete "${project.title}" permanently?`)) return;
    try {
      await api.deleteProject(project.id);
      setSelectedId(null);
      await onRefresh();
    } catch (err) { alert(err.message); }
  };

  const submitAdvisorRequest = async () => {
    if (!selectedProf) return;
    setBusy(true);
    try {
      await api.requestAdvisor(project.id, {
        profId: selectedProf.id,
        ownerId: currentUser.id,
        pitch: advisorPitch.trim() || `We'd love your guidance on ${project.title}.`
      });
      setAdvisorPickerOpen(false);
      setSelectedProf(null);
      setAdvisorPitch('');
      await onRefresh();
    } catch (e) { alert(e.message); }
    finally { setBusy(false); }
  };

  const removeAdvisor = async () => {
    if (!project.advisor) return;
    if (!window.confirm(`Remove ${project.advisor.name} as advisor?`)) return;
    try {
      await api.removeAdvisor(project.id, project.advisor.id, currentUser.id);
      await onRefresh();
    } catch (e) { alert(e.message); }
  };

  const requestJoin = async () => {
    if (!project) return;
    setBusy(true);
    try {
      await api.requestJoin(project.id, {
        applicantId: currentUser.id, skill: 'General',
        pitch: joinPitch || `I'd like to collaborate on ${project.title}.`
      });
      await onRefresh();
      setJoinPitch('');
      alert('Request sent. The owner will review your application.');
    } catch (e) { alert(e.message); }
    finally { setBusy(false); }
  };

  const respondRequest = async (reqId, status) => {
    try { await api.respondRequest(project.id, reqId, status, currentUser.id); await onRefresh(); }
    catch (e) { alert(e.message); }
  };

  const removeMember = async (memberId, memberName) => {
    if (!window.confirm(`Remove ${memberName} from project?`)) return;
    try { await api.removeMember(project.id, memberId, currentUser.id); await onRefresh(); }
    catch (e) { alert(e.message); }
  };

  const leaveProject = async () => {
    if (!window.confirm('Leave this project?')) return;
    try {
      await api.removeMember(project.id, currentUser.id, currentUser.id);
      setSelectedId(null);
      await onRefresh();
    } catch (e) { alert(e.message); }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    try {
      await api.sendProjectMessage(project.id, { senderId: currentUser.id, text: chatInput.trim() });
      setChatInput('');
      await onRefresh();
    } catch (e) { alert(e.message); }
  };

  const addTask = async (e) => {
    e.preventDefault();
    if (!taskDraft.title.trim()) return;
    try {
      await api.createTask(project.id, { ...taskDraft, userId: currentUser.id });
      setTaskDraft({ title: '', description: '', status: 'todo', priority: 'medium', assigneeId: '', dueDate: '' });
      await onRefresh();
    } catch (e) { alert(e.message); }
  };

  const moveTask = async (taskId, newStatus) => {
    try {
      await api.updateTask(project.id, taskId, { status: newStatus, userId: currentUser.id });
      await onRefresh();
    } catch (e) { alert(e.message); }
  };

  const deleteTask = async (taskId) => {
    if (!window.confirm('Delete this task?')) return;
    try { await api.deleteTask(project.id, taskId); await onRefresh(); }
    catch (e) { alert(e.message); }
  };

  const addMeeting = async (e) => {
    e.preventDefault();
    if (!meetingDraft.title.trim()) return;
    try {
      await api.createMeeting(project.id, { ...meetingDraft, userId: currentUser.id });
      setMeetingDraft({ title: '', description: '', date: '', time: '', durationMinutes: 60, link: '', attendeeIds: [] });
      await onRefresh();
    } catch (e) { alert(e.message); }
  };

  const deleteMeeting = async (mid) => {
    if (!window.confirm('Cancel this meeting?')) return;
    try { await api.deleteMeeting(project.id, mid); await onRefresh(); }
    catch (e) { alert(e.message); }
  };

  const addRepo = async () => {
    if (!repoDraft.name.trim() || !repoDraft.url.trim()) return;
    try { await api.addRepo(project.id, { ...repoDraft, userId: currentUser.id }); setRepoDraft({ name: '', url: '' }); await onRefresh(); }
    catch (e) { alert(e.message); }
  };
  const delRepo = async (rid) => { try { await api.deleteRepo(project.id, rid); await onRefresh(); } catch (e) { alert(e.message); } };

  const addDoc = async () => {
    if (!docDraft.title.trim()) return;
    try { await api.addDoc(project.id, { ...docDraft, userId: currentUser.id }); setDocDraft({ title: '', size: '', url: '' }); await onRefresh(); }
    catch (e) { alert(e.message); }
  };
  const delDoc = async (did) => { try { await api.deleteDoc(project.id, did); await onRefresh(); } catch (e) { alert(e.message); } };

  const openInviteModal = async () => {
    setInviteOpen(true);
    try { setAvailableInvitees(await api.getAvailableInvitees(project.id)); }
    catch (e) { setAvailableInvitees([]); }
  };

  const sendInvite = async (userId) => {
    try {
      await api.inviteUser(project.id, {
        invitedUserId: userId, ownerId: currentUser.id,
        pitch: `You're invited to collaborate on ${project.title}.`
      });
      setAvailableInvitees(availableInvitees.filter(u => u.id !== userId));
      await onRefresh();
    } catch (e) { alert(e.message); }
  };

  const toggleUni = (name) => {
    setNewProj(prev => ({
      ...prev,
      openUniversities: prev.openUniversities.includes(name)
        ? prev.openUniversities.filter(x => x !== name)
        : [...prev.openUniversities, name]
    }));
  };

  const filteredProfs = professors.filter(p =>
    !advisorSearch.trim() ||
    p.name.toLowerCase().includes(advisorSearch.toLowerCase()) ||
    (p.university || '').toLowerCase().includes(advisorSearch.toLowerCase()) ||
    (p.faculty || '').toLowerCase().includes(advisorSearch.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 bg-white border border-slate-200 p-6 rounded-2xl">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Collaboration Workspace</h2>
          <p className="text-xs text-slate-500 mt-1">
            Create cross-university projects, invite teammates and faculty advisors, and coordinate tasks.
          </p>
        </div>
        <button onClick={() => setCreating(true)}
          className="linkedin-btn-primary py-2 px-4 text-xs flex items-center mt-3 md:mt-0">
          <Plus className="w-4 h-4 mr-1.5" />New Project
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
            <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search projects…"
              className="w-full px-3 py-2 text-xs bg-slate-100 border border-slate-200 rounded-lg focus:outline-none focus:bg-white focus:border-blue-600 mb-3" />

            {myProjects.length > 0 && (
              <>
                <h3 className="font-bold text-[10px] uppercase tracking-wider text-slate-500 mb-2">
                  My Projects ({filterList(myProjects).length})
                </h3>
                <div className="space-y-2 mb-4">
                  {filterList(myProjects).map(p => (
                    <ProjectSidebarItem key={p.id} project={p} selected={selectedId === p.id} onClick={() => setSelectedId(p.id)} />
                  ))}
                </div>
              </>
            )}

            {advisedProjects.length > 0 && (
              <>
                <h3 className="font-bold text-[10px] uppercase tracking-wider text-emerald-600 mb-2">
                  Advising ({filterList(advisedProjects).length})
                </h3>
                <div className="space-y-2 mb-4">
                  {filterList(advisedProjects).map(p => (
                    <ProjectSidebarItem key={p.id} project={p} selected={selectedId === p.id} onClick={() => setSelectedId(p.id)} />
                  ))}
                </div>
              </>
            )}

            <h3 className="font-bold text-[10px] uppercase tracking-wider text-slate-500 mb-2">
              Discover ({filterList(discoverable).length})
            </h3>
            <div className="space-y-2">
              {filterList(discoverable).length === 0 ? (
                <p className="text-xs text-slate-400 py-2">No other projects to explore.</p>
              ) : filterList(discoverable).map(p => (
                <ProjectSidebarItem key={p.id} project={p} selected={selectedId === p.id} onClick={() => setSelectedId(p.id)} />
              ))}
            </div>
          </div>
        </div>

        <div className="lg:col-span-8 bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden flex flex-col min-h-[600px]">
          {!project ? (
            <div className="flex-1 flex items-center justify-center text-slate-400 text-xs">
              Select or create a project
            </div>
          ) : (
            <>
              <div className="p-5 border-b border-slate-200 bg-slate-50/50">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center flex-wrap gap-2 mb-1">
                      {project.visibility === 'private'
                        ? <span className="flex items-center text-[10px] bg-slate-800 text-white px-2 py-0.5 rounded-full font-bold"><Lock className="w-2.5 h-2.5 mr-1" />PRIVATE</span>
                        : <span className="flex items-center text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold"><Globe className="w-2.5 h-2.5 mr-1" />PUBLIC</span>}
                      {project.seekingInvestment && (
                        <span className="text-[10px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-bold">INVEST · {project.investmentGoal}</span>
                      )}
                      {isOwner && (
                        <>
                          <span className="text-[10px] bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full font-bold">OWNER</span>
                          <button onClick={openEditProject}
                            className="text-[10px] flex items-center px-2 py-1 rounded-full border border-slate-300 text-slate-700 hover:bg-slate-100 font-semibold">
                            <Edit3 className="w-3 h-3 mr-1" /> Edit
                          </button>
                          <button onClick={deleteProject}
                            className="text-[10px] flex items-center px-2 py-1 rounded-full border border-red-300 text-red-600 hover:bg-red-50 font-semibold">
                            <Trash2 className="w-3 h-3 mr-1" /> Delete
                          </button>
                        </>
                      )}
                      {isAdvisor && (
                        <span className="text-[10px] bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded-full font-bold">ADVISOR</span>
                      )}
                    </div>
                    <h3 className="text-lg font-bold text-slate-900">{project.title}</h3>
                    <p className="text-xs text-slate-600 mt-1">{project.description}</p>
                  </div>
                  <div className="text-right ml-3">
                    <span className="text-[10px] text-slate-400">Traction</span>
                    <div className="text-sm font-black text-emerald-600 font-mono">{project.tractionScore}/100</div>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-200/60">
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-semibold text-slate-700">Team ({project.members.length}):</span>
                      <div className="flex -space-x-2">
                        {project.members.map((m, i) => (
                          <button key={m.id || i} onClick={() => onOpenUser(m.id)} title={`${m.name} (${m.uni})`}>
                            <img src={m.avatar} alt="" className="w-7 h-7 rounded-full border-2 border-white object-cover hover:ring-2 hover:ring-blue-500" />
                          </button>
                        ))}
                      </div>
                      {isOwner && (
                        <button onClick={openInviteModal}
                          className="text-[10px] flex items-center px-2 py-1 rounded-full border border-blue-500 text-blue-600 font-semibold hover:bg-blue-50">
                          <UserPlus className="w-3 h-3 mr-1" />Invite
                        </button>
                      )}
                    </div>

                    {/* Advisor badge / request button */}
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-semibold text-slate-700">Advisor:</span>
                      {hasAdvisor ? (
                        <div className="flex items-center space-x-1.5">
                          <button onClick={() => onOpenUser(project.advisor.id)} title={project.advisor.title} className="flex items-center space-x-1.5 px-2 py-1 rounded-full bg-indigo-50 border border-indigo-200 hover:bg-indigo-100">
                            <img src={project.advisor.avatar} alt="" className="w-5 h-5 rounded-full object-cover border" />
                            <span className="text-[10px] font-bold text-indigo-800">{project.advisor.name}</span>
                            <Award className="w-3 h-3 text-indigo-600" />
                          </button>
                          {isOwner && (
                            <button onClick={removeAdvisor}
                              className="text-[10px] text-red-500 hover:text-red-700 font-semibold">Remove</button>
                          )}
                        </div>
                      ) : pendingAdvisorReq ? (
                        <span className="text-[10px] bg-amber-100 text-amber-800 px-2 py-1 rounded-full font-bold flex items-center">
                          <Clock className="w-3 h-3 mr-1" />Pending with {pendingAdvisorReq.profName}
                        </span>
                      ) : isOwner ? (
                        <button onClick={() => setAdvisorPickerOpen(true)}
                          className="text-[10px] flex items-center px-2 py-1 rounded-full border border-indigo-500 text-indigo-600 font-semibold hover:bg-indigo-50">
                          <GraduationCap className="w-3 h-3 mr-1" />Request Faculty Advisor
                        </button>
                      ) : (
                        <span className="text-[10px] text-slate-400 italic">None yet</span>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {(project.skillsNeeded || []).map((s, i) => (
                      <span key={i} className="text-[10px] bg-blue-100 text-[#0A66C2] font-semibold px-2 py-0.5 rounded-full">{s}</span>
                    ))}
                  </div>
                </div>
              </div>

              {(isMember || isAdvisor) ? (
                <>
                  <div className="px-5 border-b border-slate-200 bg-white flex items-center space-x-4 text-xs font-semibold overflow-x-auto">
                    {[
                      { id: 'overview', label: 'Overview', icon: Target },
                      { id: 'chat', label: 'Chat', icon: MessageSquare },
                      { id: 'team', label: 'Team', icon: Users },
                      { id: 'tasks', label: 'Tasks', icon: ListChecks },
                      { id: 'meetings', label: 'Meetings', icon: Calendar },
                      { id: 'repos', label: 'Repos', icon: GitBranch },
                      { id: 'docs', label: 'Docs', icon: FileText },
                      { id: 'activity', label: 'Activity', icon: Clock }
                    ].map(t => {
                      const Icon = t.icon;
                      return (
                        <button key={t.id} onClick={() => setTab(t.id)}
                          className={`flex items-center space-x-1.5 py-3 whitespace-nowrap ${
                            tab === t.id ? 'text-[#0A66C2] border-b-2 border-[#0A66C2]' : 'text-slate-500 hover:text-slate-900'
                          }`}>
                          <Icon className="w-3.5 h-3.5" />{t.label}
                        </button>
                      );
                    })}
                  </div>

                  {isAdvisor && !isMember && (
                    <div className="px-5 py-2 bg-indigo-50 border-b border-indigo-100 text-[11px] text-indigo-800 flex items-center">
                      <Award className="w-3.5 h-3.5 mr-1.5" />
                      You are advising this project — read-only on tasks, meetings and repos. You can post in chat.
                    </div>
                  )}

                  <div className="flex-1 overflow-y-auto">
                    {tab === 'overview' && <OverviewTab project={project} onOpenUser={onOpenUser} />}
                    {tab === 'chat' && <ChatTab project={project} currentUser={currentUser} chatInput={chatInput} setChatInput={setChatInput} sendMessage={sendMessage} onOpenUser={onOpenUser} />}
                    {tab === 'team' && <TeamTab project={project} currentUser={currentUser} isOwner={isOwner} isAdvisor={isAdvisor} onRemove={removeMember} onLeave={leaveProject} onOpenUser={onOpenUser} />}
                    {tab === 'tasks' && <TasksTab project={project} isAdvisor={isAdvisor} taskDraft={taskDraft} setTaskDraft={setTaskDraft} addTask={addTask} moveTask={moveTask} deleteTask={deleteTask} onOpenUser={onOpenUser} />}
                    {tab === 'meetings' && <MeetingsTab project={project} isAdvisor={isAdvisor} meetingDraft={meetingDraft} setMeetingDraft={setMeetingDraft} addMeeting={addMeeting} deleteMeeting={deleteMeeting} onOpenUser={onOpenUser} />}
                    {tab === 'repos' && <ReposTab project={project} isOwner={isOwner} repoDraft={repoDraft} setRepoDraft={setRepoDraft} addRepo={addRepo} delRepo={delRepo} />}
                    {tab === 'docs' && <DocsTab project={project} isOwner={isOwner} docDraft={docDraft} setDocDraft={setDocDraft} addDoc={addDoc} delDoc={delDoc} />}
                    {tab === 'activity' && <ActivityTab project={project} onOpenUser={onOpenUser} />}
                  </div>

                  {isOwner && project.incomingRequests.length > 0 && tab === 'overview' && (
                    <div className="border-t border-slate-200 bg-amber-50 p-4">
                      <h4 className="text-xs font-bold text-amber-900 mb-2 flex items-center">
                        <Bell className="w-3.5 h-3.5 mr-1" />Pending Join Requests ({project.incomingRequests.length})
                      </h4>
                      <div className="space-y-2">
                        {project.incomingRequests.map(r => (
                          <div key={r.id} className="bg-white p-3 rounded-lg border border-amber-200 flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-2">
                                <button onClick={() => onOpenUser(r.applicantId)} className="font-bold text-xs text-slate-900 hover:text-blue-600">{r.applicantName}</button>
                                <span className="text-[10px] bg-blue-100 text-blue-800 px-2 py-0.5 rounded">{r.uni}</span>
                              </div>
                              <p className="text-[11px] text-slate-600 mt-1 italic">"{r.pitch}"</p>
                            </div>
                            <div className="flex items-center space-x-1.5 ml-3">
                              <button onClick={() => respondRequest(r.id, 'Accepted')}
                                className="px-2.5 py-1 bg-emerald-600 text-white rounded text-[10px] font-bold">Accept</button>
                              <button onClick={() => respondRequest(r.id, 'Rejected')}
                                className="px-2.5 py-1 bg-slate-200 text-slate-700 rounded text-[10px] font-bold">Reject</button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <NonMemberView project={project} currentUser={currentUser} requestJoin={requestJoin} joinPitch={joinPitch} setJoinPitch={setJoinPitch} busy={busy} onOpenUser={onOpenUser} />
              )}
            </>
          )}
        </div>
      </div>

      {/* Create Project Modal */}
      {creating && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full shadow-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold mb-1">Create Project</h3>
            <p className="text-xs text-slate-500 mb-4">Open to students across Sri Lankan campuses.</p>
            <form onSubmit={handleCreate} className="space-y-3">
              <input required placeholder="Project title" value={newProj.title}
                onChange={e => setNewProj({ ...newProj, title: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg" />
              <textarea required rows={3} placeholder="Description" value={newProj.description}
                onChange={e => setNewProj({ ...newProj, description: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg" />
              <input placeholder="Skills needed (comma separated)" value={newProj.skillsNeeded}
                onChange={e => setNewProj({ ...newProj, skillsNeeded: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg" />

              <div className="border border-slate-200 rounded-lg p-3 bg-slate-50">
                <label className="block text-xs font-semibold text-slate-700 mb-2">Who can join?</label>
                <div className="flex items-center space-x-4 text-xs mb-3">
                  <label className="flex items-center space-x-1.5 cursor-pointer">
                    <input type="radio" name="openMode" checked={newProj.openMode === 'all'}
                      onChange={() => setNewProj({ ...newProj, openMode: 'all', openUniversities: [] })} />
                    <Globe className="w-3.5 h-3.5" /><span>All universities</span>
                  </label>
                  <label className="flex items-center space-x-1.5 cursor-pointer">
                    <input type="radio" name="openMode" checked={newProj.openMode === 'custom'}
                      onChange={() => setNewProj({ ...newProj, openMode: 'custom' })} />
                    <Users className="w-3.5 h-3.5" /><span>Custom selection</span>
                  </label>
                </div>
                {newProj.openMode === 'custom' && (
                  <div className="max-h-48 overflow-y-auto border border-slate-200 rounded-lg bg-white">
                    {universities.map(u => (
                      <label key={u.id}
                        className={`flex items-center space-x-2 p-2 cursor-pointer border-b border-slate-100 last:border-0 text-xs ${
                          newProj.openUniversities.includes(u.name) ? 'bg-blue-50' : 'hover:bg-slate-50'
                        }`}>
                        <input type="checkbox"
                          checked={newProj.openUniversities.includes(u.name)}
                          onChange={() => toggleUni(u.name)} />
                        <span className="flex-1">{u.name}</span>
                        <span className="text-[10px] text-slate-400">{u.code}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Visibility</label>
                <div className="flex items-center space-x-3 text-xs">
                  <label className="flex items-center space-x-1.5 cursor-pointer">
                    <input type="radio" checked={newProj.visibility === 'public'} onChange={() => setNewProj({ ...newProj, visibility: 'public' })} />
                    <Globe className="w-3.5 h-3.5" /><span>Public</span>
                  </label>
                  <label className="flex items-center space-x-1.5 cursor-pointer">
                    <input type="radio" checked={newProj.visibility === 'private'} onChange={() => setNewProj({ ...newProj, visibility: 'private' })} />
                    <Lock className="w-3.5 h-3.5" /><span>Private</span>
                  </label>
                </div>
              </div>

              <label className="flex items-center space-x-2 text-xs">
                <input type="checkbox" checked={newProj.seekingInvestment}
                  onChange={e => setNewProj({ ...newProj, seekingInvestment: e.target.checked })} />
                <span>Seeking investment</span>
              </label>
              {newProj.seekingInvestment && (
                <input placeholder="Investment goal" value={newProj.investmentGoal}
                  onChange={e => setNewProj({ ...newProj, investmentGoal: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg" />
              )}

              <div className="flex justify-end space-x-3 pt-2">
                <button type="button" onClick={() => setCreating(false)} className="px-4 py-2 text-xs font-semibold text-slate-600">Cancel</button>
                <button type="submit" disabled={busy} className="linkedin-btn-primary py-2 px-5 text-xs disabled:opacity-50">
                  {busy ? 'Creating…' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Project Modal */}
      {editingProject && project && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full shadow-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold mb-1">Edit Project</h3>
            <p className="text-xs text-slate-500 mb-4">Only the owner can edit.</p>
            <form onSubmit={saveEditProject} className="space-y-3">
              <input required value={editDraft.title} onChange={e => setEditDraft({ ...editDraft, title: e.target.value })}
                placeholder="Title"
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg" />
              <textarea required rows={3} value={editDraft.description} onChange={e => setEditDraft({ ...editDraft, description: e.target.value })}
                placeholder="Description"
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg" />
              <input value={editDraft.skillsNeeded} onChange={e => setEditDraft({ ...editDraft, skillsNeeded: e.target.value })}
                placeholder="Skills (comma separated)"
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg" />

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Visibility</label>
                <div className="flex items-center space-x-3 text-xs">
                  <label className="flex items-center space-x-1.5 cursor-pointer">
                    <input type="radio" checked={editDraft.visibility === 'public'} onChange={() => setEditDraft({ ...editDraft, visibility: 'public' })} />
                    <Globe className="w-3.5 h-3.5" /><span>Public</span>
                  </label>
                  <label className="flex items-center space-x-1.5 cursor-pointer">
                    <input type="radio" checked={editDraft.visibility === 'private'} onChange={() => setEditDraft({ ...editDraft, visibility: 'private' })} />
                    <Lock className="w-3.5 h-3.5" /><span>Private</span>
                  </label>
                </div>
              </div>

              <label className="flex items-center space-x-2 text-xs">
                <input type="checkbox" checked={editDraft.seekingInvestment}
                  onChange={e => setEditDraft({ ...editDraft, seekingInvestment: e.target.checked })} />
                <span>Seeking investment</span>
              </label>
              {editDraft.seekingInvestment && (
                <input placeholder="Investment goal" value={editDraft.investmentGoal}
                  onChange={e => setEditDraft({ ...editDraft, investmentGoal: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg" />
              )}

              <div className="flex justify-end space-x-3 pt-2">
                <button type="button" onClick={() => setEditingProject(false)} className="px-4 py-2 text-xs font-semibold text-slate-600">Cancel</button>
                <button type="submit" className="linkedin-btn-primary py-2 px-5 text-xs">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Advisor Picker Modal */}
      {advisorPickerOpen && project && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full shadow-2xl max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold">Request Faculty Advisor</h3>
              <button onClick={() => { setAdvisorPickerOpen(false); setSelectedProf(null); setAdvisorPitch(''); }}
                className="text-slate-400 hover:text-slate-700">
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <input value={advisorSearch} onChange={e => setAdvisorSearch(e.target.value)}
              placeholder="Search professors by name, university, or faculty…"
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg mb-3" />

            <div className="space-y-2 max-h-72 overflow-y-auto mb-3">
              {filteredProfs.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-4">No matching professors.</p>
              ) : filteredProfs.map(p => (
                <button key={p.id} onClick={() => setSelectedProf(p)}
                  className={`w-full text-left p-3 rounded-lg border transition-all flex items-center space-x-3 ${
                    selectedProf?.id === p.id ? 'border-indigo-500 bg-indigo-50' : 'border-slate-200 hover:bg-slate-50'
                  }`}>
                  <img src={p.avatar} alt="" className="w-10 h-10 rounded-full object-cover border" />
                  <div className="flex-1">
                    <div className="flex items-center space-x-1.5">
                      <span className="font-bold text-xs text-slate-900">{p.name}</span>
                      {p.verified && <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />}
                    </div>
                    <p className="text-[10px] text-indigo-600 font-semibold">{p.title}</p>
                    <p className="text-[10px] text-slate-500">{p.university} • {p.faculty}</p>
                  </div>
                </button>
              ))}
            </div>

            {selectedProf && (
              <>
                <label className="block text-xs font-semibold text-slate-700 mb-1 mt-3">
                  Personal note to {selectedProf.name} (optional)
                </label>
                <textarea rows={3} value={advisorPitch} onChange={e => setAdvisorPitch(e.target.value)}
                  placeholder={`We'd love your guidance on ${project.title}…`}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg mb-3" />
                <div className="flex justify-end space-x-2">
                  <button onClick={() => { setAdvisorPickerOpen(false); setSelectedProf(null); setAdvisorPitch(''); }}
                    className="px-4 py-2 text-xs font-semibold text-slate-600">Cancel</button>
                  <button onClick={submitAdvisorRequest} disabled={busy}
                    className="linkedin-btn-primary py-2 px-5 text-xs disabled:opacity-50">
                    {busy ? 'Sending…' : 'Send Request'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Invite Modal */}
      {inviteOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full shadow-2xl max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold">Invite Students</h3>
              <button onClick={() => setInviteOpen(false)} className="text-slate-400 hover:text-slate-700">
                <XCircle className="w-5 h-5" />
              </button>
            </div>
            <input value={inviteSearch} onChange={e => setInviteSearch(e.target.value)}
              placeholder="Search students…"
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg mb-3" />
            <div className="space-y-2">
              {availableInvitees
                .filter(u => !inviteSearch.trim() ||
                  u.name.toLowerCase().includes(inviteSearch.toLowerCase()) ||
                  (u.university || '').toLowerCase().includes(inviteSearch.toLowerCase()))
                .map(u => (
                  <div key={u.id} className="p-3 border border-slate-200 rounded-lg flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <img src={u.avatar} alt="" className="w-9 h-9 rounded-full object-cover border" />
                      <div>
                        <p className="text-xs font-bold text-slate-900">{u.name}</p>
                        <p className="text-[10px] text-slate-500">{u.university}</p>
                      </div>
                    </div>
                    <button onClick={() => sendInvite(u.id)}
                      className="px-3 py-1.5 bg-[#0A66C2] text-white text-[10px] font-bold rounded-full hover:bg-blue-700">
                      Send Invite
                    </button>
                  </div>
                ))}
              {availableInvitees.length === 0 && (
                <p className="text-xs text-slate-400 text-center py-4">No students available to invite.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ProjectSidebarItem({ project, selected, onClick }) {
  return (
    <button onClick={onClick}
      className={`w-full text-left p-3 rounded-xl border transition-all ${
        selected ? 'border-[#0A66C2] bg-blue-50/60' : 'border-slate-200 hover:bg-slate-50'
      }`}>
      <div className="flex items-center justify-between">
        <h4 className="font-bold text-xs text-slate-900 line-clamp-1">{project.title}</h4>
        {project.visibility === 'private'
          ? <Lock className="w-3 h-3 text-slate-400" />
          : project.seekingInvestment && <span className="text-[9px] bg-amber-100 text-amber-800 px-1.5 rounded font-semibold">Invest</span>}
      </div>
      <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">{project.description}</p>
      <div className="mt-2 flex items-center justify-between text-[10px] text-slate-400">
        <span>{project.members.length} member{project.members.length !== 1 ? 's' : ''}</span>
        {project.isMember && <span className="text-emerald-600 font-bold">● Member</span>}
        {project.isAdvisor && <span className="text-indigo-600 font-bold">● Advisor</span>}
      </div>
    </button>
  );
}

function NonMemberView({ project, currentUser, requestJoin, joinPitch, setJoinPitch, busy, onOpenUser }) {
  const isPrivate = project.visibility === 'private';
  const hasRequested = project.myRequest;
  const openList = project.openToUniversities || [];
  const isAllUnis = openList.includes('ALL') || openList.length === 0;
  const uniAllowed = isAllUnis || openList.includes(currentUser.university);

  return (
    <div className="p-6 space-y-4">
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
        <div className="flex items-center space-x-2 mb-3">
          {isPrivate ? <Lock className="w-4 h-4 text-slate-600" /> : <Globe className="w-4 h-4 text-emerald-600" />}
          <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            {isPrivate ? 'Private Project — Invite Only' : 'Public Project'}
          </span>
        </div>

        <h3 className="text-base font-bold text-slate-900">{project.title}</h3>
        <p className="text-sm text-slate-700 mt-2 leading-relaxed">{project.description}</p>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <div>
            <span className="text-[10px] font-semibold text-slate-500 uppercase">Owner</span>
            <div className="flex items-center space-x-2 mt-1">
              <img src={project.owner.avatar} alt="" className="w-7 h-7 rounded-full border" />
              <button onClick={() => onOpenUser(project.owner.id)}
                className="text-xs font-bold text-slate-900 hover:text-blue-600 hover:underline">{project.owner.name}</button>
            </div>
          </div>
          <div>
            <span className="text-[10px] font-semibold text-slate-500 uppercase">Traction</span>
            <div className="text-sm font-black text-emerald-600 font-mono mt-1">{project.tractionScore}/100</div>
          </div>
        </div>

        {project.advisor && (
          <div className="mt-4">
            <span className="text-[10px] font-semibold text-slate-500 uppercase">Faculty Advisor</span>
            <div className="flex items-center space-x-2 mt-1">
              <img src={project.advisor.avatar} alt="" className="w-7 h-7 rounded-full border" />
              <button onClick={() => onOpenUser(project.advisor.id)}
                className="text-xs font-bold text-indigo-800 hover:text-indigo-600 hover:underline">{project.advisor.name}</button>
            </div>
          </div>
        )}
      </div>

      {project.myInvite ? (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-center">
          <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
          <p className="text-sm font-bold text-emerald-900">You've been invited!</p>
          <p className="text-xs text-emerald-700 mt-1">Accept the invite from the bell in the navbar to join.</p>
        </div>
      ) : isPrivate ? (
        <div className="p-4 bg-slate-100 border border-slate-300 rounded-xl text-center">
          <Lock className="w-8 h-8 text-slate-500 mx-auto mb-2" />
          <p className="text-sm font-bold text-slate-900">This project is invitation-only</p>
        </div>
      ) : !uniAllowed ? (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-center">
          <Users className="w-8 h-8 text-amber-600 mx-auto mb-2" />
          <p className="text-sm font-bold text-amber-900">Not open to your university</p>
        </div>
      ) : hasRequested ? (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-center">
          <Clock className="w-8 h-8 text-amber-600 mx-auto mb-2" />
          <p className="text-sm font-bold text-amber-900">Request Pending</p>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <h4 className="text-sm font-bold text-slate-900 mb-2">Request to Join</h4>
          <textarea rows={2} value={joinPitch} onChange={e => setJoinPitch(e.target.value)}
            placeholder="Why do you want to join?"
            className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg mb-3" />
          <button onClick={requestJoin} disabled={busy}
            className="w-full linkedin-btn-primary py-2 text-xs font-bold disabled:opacity-50">
            {busy ? 'Sending…' : 'Send Join Request'}
          </button>
        </div>
      )}
    </div>
  );
}

function OverviewTab({ project, onOpenUser }) {
  const openList = project.openToUniversities || [];
  const isAllUnis = openList.includes('ALL');
  return (
    <div className="p-6 space-y-4">
      <div>
        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">About</h4>
        <p className="text-sm text-slate-700 leading-relaxed">{project.description}</p>
      </div>

      {project.advisor && (
        <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-xl">
          <h4 className="text-xs font-bold text-indigo-700 uppercase tracking-wider mb-2 flex items-center">
            <Award className="w-3.5 h-3.5 mr-1" />Faculty Advisor
          </h4>
          <div className="flex items-center space-x-3">
            <img src={project.advisor.avatar} alt="" className="w-10 h-10 rounded-full object-cover border" />
            <div>
              <button onClick={() => onOpenUser(project.advisor.id)}
                className="font-bold text-xs text-indigo-900 hover:underline">{project.advisor.name}</button>
              <p className="text-[10px] text-indigo-700">{project.advisor.title}</p>
              <p className="text-[10px] text-indigo-600">{project.advisor.university}</p>
            </div>
          </div>
        </div>
      )}

      <div>
        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Open to Universities</h4>
        {isAllUnis ? (
          <p className="text-xs text-slate-700">All universities</p>
        ) : openList.length === 0 ? (
          <p className="text-xs text-slate-400">Not specified</p>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {openList.map((u, i) => (
              <span key={i} className="text-[11px] bg-slate-100 text-slate-700 px-2 py-1 rounded-md">🏫 {u}</span>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="bg-blue-50 rounded-lg p-3">
          <span className="text-[10px] text-blue-700 font-semibold uppercase">Tasks</span>
          <div className="text-lg font-black text-blue-900">{project.tasks?.length || 0}</div>
        </div>
        <div className="bg-emerald-50 rounded-lg p-3">
          <span className="text-[10px] text-emerald-700 font-semibold uppercase">Meetings</span>
          <div className="text-lg font-black text-emerald-900">{project.meetings?.length || 0}</div>
        </div>
        <div className="bg-amber-50 rounded-lg p-3">
          <span className="text-[10px] text-amber-700 font-semibold uppercase">Members</span>
          <div className="text-lg font-black text-amber-900">{project.members.length}</div>
        </div>
      </div>
    </div>
  );
}

function ChatTab({ project, currentUser, chatInput, setChatInput, sendMessage, onOpenUser }) {
  return (
    <div className="flex flex-col h-full p-4 bg-slate-50/30" style={{ minHeight: 400 }}>
      <div className="space-y-3 flex-1 overflow-y-auto pr-2">
        {project.chatMessages.map((msg, i) => {
          const isSystem = msg.messageType === 'system' || msg.sender === 'System';
          if (isSystem) {
            return (
              <div key={msg.id || i} className="text-center">
                <span className="text-[10px] bg-slate-200 text-slate-600 px-3 py-1 rounded-full font-medium">
                  {msg.text}
                </span>
              </div>
            );
          }
          return (
            <div key={msg.id || i} className="flex items-start space-x-2">
              {msg.avatar ? (
                <button onClick={() => onOpenUser(msg.senderId)}>
                  <img src={msg.avatar} alt="" className="w-8 h-8 rounded-full object-cover border hover:ring-2 hover:ring-blue-500" />
                </button>
              ) : (
                <div className="w-8 h-8 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center">SY</div>
              )}
              <div className="bg-white p-3 rounded-2xl border border-slate-200 max-w-lg">
                <div className="flex items-center justify-between mb-1">
                  <button onClick={() => onOpenUser(msg.senderId)} className="font-bold text-xs text-slate-900 hover:text-blue-600">{msg.sender}</button>
                  <span className="text-[10px] text-slate-400 ml-3">{msg.time}</span>
                </div>
                <p className="text-xs text-slate-800">{msg.text}</p>
              </div>
            </div>
          );
        })}
      </div>

      <form onSubmit={sendMessage} className="mt-4 pt-3 border-t border-slate-200 flex items-center space-x-2">
        <input value={chatInput} onChange={e => setChatInput(e.target.value)}
          placeholder="Message the team…"
          className="flex-1 px-4 py-2 border border-slate-300 rounded-full text-xs focus:outline-none focus:border-blue-600" />
        <button type="submit" className="p-2 bg-[#0A66C2] text-white rounded-full"><Send className="w-4 h-4" /></button>
      </form>
    </div>
  );
}

function TeamTab({ project, currentUser, isOwner, isAdvisor, onRemove, onLeave, onOpenUser }) {
  return (
    <div className="p-6 space-y-3">
      <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Team Members ({project.members.length})</h4>
      {project.members.map(m => (
        <div key={m.id} className="p-3 border border-slate-200 rounded-xl bg-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <img src={m.avatar} alt="" className="w-10 h-10 rounded-full object-cover border" />
            <div>
              <button onClick={() => onOpenUser(m.id)} className="font-bold text-xs text-slate-900 hover:text-blue-600">{m.name}</button>
              <p className="text-[11px] text-slate-500">{m.uni}</p>
              <span className="text-[10px] bg-blue-100 text-blue-800 px-2 py-0.5 rounded font-semibold">{m.role}</span>
            </div>
          </div>
          {isOwner && m.id !== currentUser.id && (
            <button onClick={() => onRemove(m.id, m.name)} className="text-red-500 hover:bg-red-50 p-1.5 rounded-lg">
              <Trash2 className="w-4 h-4" />
            </button>
          )}
          {m.id === currentUser.id && !isOwner && (
            <button onClick={onLeave} className="text-[10px] text-red-600 font-semibold flex items-center px-2 py-1 rounded border border-red-300 hover:bg-red-50">
              <LogOut className="w-3 h-3 mr-1" /> Leave
            </button>
          )}
        </div>
      ))}

      {project.advisor && (
        <div className="p-3 border border-indigo-200 rounded-xl bg-indigo-50 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <img src={project.advisor.avatar} alt="" className="w-10 h-10 rounded-full object-cover border" />
            <div>
              <button onClick={() => onOpenUser(project.advisor.id)} className="font-bold text-xs text-indigo-900 hover:underline">{project.advisor.name}</button>
              <p className="text-[11px] text-indigo-700">{project.advisor.title}</p>
              <span className="text-[10px] bg-indigo-200 text-indigo-900 px-2 py-0.5 rounded font-semibold flex items-center w-fit mt-0.5">
                <Award className="w-3 h-3 mr-1" /> Faculty Advisor
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function TasksTab({ project, isAdvisor, taskDraft, setTaskDraft, addTask, moveTask, deleteTask, onOpenUser }) {
  const grouped = { todo: [], in_progress: [], review: [], done: [] };
  (project.tasks || []).forEach(t => { if (grouped[t.status]) grouped[t.status].push(t); });
  const labels = { todo: 'To Do', in_progress: 'In Progress', review: 'In Review', done: 'Done' };
  const colors = { todo: 'bg-slate-100 text-slate-700', in_progress: 'bg-blue-100 text-blue-800', review: 'bg-amber-100 text-amber-800', done: 'bg-emerald-100 text-emerald-800' };

  return (
    <div className="p-6 space-y-4">
      {!isAdvisor && (
        <form onSubmit={addTask} className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-2">
          <div className="grid grid-cols-4 gap-2">
            <input placeholder="Task title" required value={taskDraft.title}
              onChange={e => setTaskDraft({ ...taskDraft, title: e.target.value })}
              className="col-span-3 px-3 py-2 text-xs border border-slate-300 rounded-lg" />
            <select value={taskDraft.priority} onChange={e => setTaskDraft({ ...taskDraft, priority: e.target.value })}
              className="px-2 py-2 text-xs border border-slate-300 rounded-lg bg-white">
              {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <select value={taskDraft.assigneeId} onChange={e => setTaskDraft({ ...taskDraft, assigneeId: e.target.value })}
              className="px-2 py-2 text-xs border border-slate-300 rounded-lg bg-white">
              <option value="">Unassigned</option>
              {project.members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
            <input type="date" value={taskDraft.dueDate} onChange={e => setTaskDraft({ ...taskDraft, dueDate: e.target.value })}
              className="px-2 py-2 text-xs border border-slate-300 rounded-lg" />
            <button type="submit" className="linkedin-btn-primary py-2 text-xs">Add Task</button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        {STATUSES.map(status => (
          <div key={status} className="bg-slate-50 rounded-xl p-3">
            <h4 className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded ${colors[status]}`}>
              {labels[status]} ({grouped[status].length})
            </h4>
            <div className="mt-2 space-y-2">
              {grouped[status].map(t => (
                <div key={t.id} className="bg-white border border-slate-200 rounded-lg p-2.5 text-xs">
                  <div className="flex items-start justify-between">
                    <p className="font-bold text-slate-900 flex-1">{t.title}</p>
                    {!isAdvisor && (
                      <button onClick={() => deleteTask(t.id)} className="text-red-400 hover:text-red-600 ml-1">
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                  {t.description && <p className="text-[10px] text-slate-500 mt-1">{t.description}</p>}
                  <div className="mt-2 flex items-center justify-between">
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase ${
                      t.priority === 'urgent' ? 'bg-red-100 text-red-700' :
                      t.priority === 'high' ? 'bg-orange-100 text-orange-700' :
                      t.priority === 'medium' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'
                    }`}>{t.priority}</span>
                    {t.dueDate && <span className="text-[9px] text-slate-500 font-mono">{t.dueDate}</span>}
                  </div>
                  {t.assigneeName && (
                    <button onClick={() => onOpenUser(t.assigneeId)} className="mt-2 flex items-center text-[10px] text-slate-600 hover:text-blue-600">
                      <Check className="w-3 h-3 mr-1" />{t.assigneeName}
                    </button>
                  )}
                  {!isAdvisor && (
                    <select value={t.status} onChange={e => moveTask(t.id, e.target.value)}
                      className="mt-2 w-full text-[10px] border border-slate-200 rounded px-1.5 py-1 bg-white">
                      {STATUSES.map(s => <option key={s} value={s}>{labels[s]}</option>)}
                    </select>
                  )}
                </div>
              ))}
              {grouped[status].length === 0 && (
                <p className="text-[10px] text-slate-400 text-center py-3">No tasks</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function MeetingsTab({ project, isAdvisor, meetingDraft, setMeetingDraft, addMeeting, deleteMeeting, onOpenUser }) {
  const upcoming = (project.meetings || []).filter(m => m.status === 'Scheduled');
  const past = (project.meetings || []).filter(m => m.status !== 'Scheduled');

  return (
    <div className="p-6 space-y-4">
      {!isAdvisor && (
        <form onSubmit={addMeeting} className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-2">
          <input placeholder="Meeting title" required value={meetingDraft.title}
            onChange={e => setMeetingDraft({ ...meetingDraft, title: e.target.value })}
            className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg" />
          <div className="grid grid-cols-3 gap-2">
            <input type="date" value={meetingDraft.date} onChange={e => setMeetingDraft({ ...meetingDraft, date: e.target.value })}
              className="px-2 py-2 text-xs border border-slate-300 rounded-lg" />
            <input type="time" value={meetingDraft.time} onChange={e => setMeetingDraft({ ...meetingDraft, time: e.target.value })}
              className="px-2 py-2 text-xs border border-slate-300 rounded-lg" />
            <input type="number" placeholder="Minutes" value={meetingDraft.durationMinutes}
              onChange={e => setMeetingDraft({ ...meetingDraft, durationMinutes: parseInt(e.target.value) || 60 })}
              className="px-2 py-2 text-xs border border-slate-300 rounded-lg" />
          </div>
          <input placeholder="Meeting link (Zoom / Google Meet / Teams)" value={meetingDraft.link}
            onChange={e => setMeetingDraft({ ...meetingDraft, link: e.target.value })}
            className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg" />
          <div>
            <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">Attendees</label>
            <div className="flex flex-wrap gap-1.5">
              {project.members.map(m => (
                <label key={m.id} className="flex items-center space-x-1 text-[10px] bg-white border border-slate-200 rounded-full px-2 py-1 cursor-pointer">
                  <input type="checkbox"
                    checked={meetingDraft.attendeeIds.includes(m.id)}
                    onChange={e => {
                      const ids = e.target.checked
                        ? [...meetingDraft.attendeeIds, m.id]
                        : meetingDraft.attendeeIds.filter(id => id !== m.id);
                      setMeetingDraft({ ...meetingDraft, attendeeIds: ids });
                    }} />
                  <span>{m.name}</span>
                </label>
              ))}
            </div>
          </div>
          <button type="submit" className="linkedin-btn-primary py-2 px-4 text-xs">Schedule Meeting</button>
        </form>
      )}

      <div>
        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Upcoming ({upcoming.length})</h4>
        {upcoming.length === 0 ? <p className="text-xs text-slate-400 py-2">No upcoming meetings.</p> :
          upcoming.map(m => (
            <div key={m.id} className="p-3 border border-emerald-200 bg-emerald-50/40 rounded-xl mb-2">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h5 className="font-bold text-xs text-slate-900">{m.title}</h5>
                  {m.description && <p className="text-[11px] text-slate-600 mt-0.5">{m.description}</p>}
                  <p className="text-[11px] text-slate-600 mt-1">📅 {m.date} · 🕐 {m.time} · {m.durationMinutes} min</p>
                  {m.link && (
                    <a href={m.link} target="_blank" rel="noreferrer"
                      className="inline-flex items-center mt-2 text-[11px] text-blue-600 hover:underline font-semibold">
                      <LinkIcon className="w-3 h-3 mr-1" />Join Meeting
                    </a>
                  )}
                  {m.attendees?.length > 0 && (
                    <div className="mt-2 flex items-center space-x-1">
                      <span className="text-[10px] text-slate-500">Attendees:</span>
                      {m.attendees.map((a, i) => (
                        <img key={i} src={a.avatar} alt={a.name} title={a.name}
                          className="w-5 h-5 rounded-full border-2 border-white -ml-1" />
                      ))}
                    </div>
                  )}
                </div>
                {!isAdvisor && (
                  <button onClick={() => deleteMeeting(m.id)} className="text-red-500 hover:bg-red-50 p-1.5 rounded-lg">
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
      </div>

      {past.length > 0 && (
        <div>
          <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Past</h4>
          {past.map(m => (
            <div key={m.id} className="p-3 border border-slate-200 bg-slate-50 rounded-xl mb-2 opacity-70">
              <p className="font-bold text-xs text-slate-900">{m.title}</p>
              <p className="text-[10px] text-slate-500">{m.date} — {m.status}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ReposTab({ project, isOwner, repoDraft, setRepoDraft, addRepo, delRepo }) {
  return (
    <div className="p-6 space-y-3">
      {isOwner && (
        <div className="grid grid-cols-3 gap-2">
          <input placeholder="Repo name" value={repoDraft.name} onChange={e => setRepoDraft({ ...repoDraft, name: e.target.value })}
            className="px-3 py-2 text-xs border border-slate-300 rounded-lg" />
          <input placeholder="https://github.com/…" value={repoDraft.url} onChange={e => setRepoDraft({ ...repoDraft, url: e.target.value })}
            className="col-span-2 px-3 py-2 text-xs border border-slate-300 rounded-lg" />
        </div>
      )}
      {isOwner && <button onClick={addRepo} className="linkedin-btn-primary py-1.5 px-3 text-xs flex items-center"><FolderPlus className="w-3.5 h-3.5 mr-1" />Add Repo</button>}
      {(project.repositories || []).map(repo => (
        <div key={repo.id} className="p-3 border border-slate-200 rounded-xl bg-slate-50 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <GitBranch className="w-5 h-5 text-slate-600" />
            <div>
              <a href={repo.url} target="_blank" rel="noreferrer" className="font-mono font-bold text-xs text-blue-600 hover:underline">{repo.name}</a>
              <p className="text-[10px] text-slate-400">{repo.url}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <span className="flex items-center text-xs font-semibold text-amber-600 bg-amber-50 px-2 py-1 rounded-full">
              <Star className="w-3.5 h-3.5 mr-1 fill-amber-500" /> {repo.stars}
            </span>
            {isOwner && <button onClick={() => delRepo(repo.id)} className="text-red-500 p-1"><Trash2 className="w-4 h-4" /></button>}
          </div>
        </div>
      ))}
      {(project.repositories || []).length === 0 && <p className="text-xs text-slate-400 text-center py-6">No repos yet.</p>}
    </div>
  );
}

function DocsTab({ project, isOwner, docDraft, setDocDraft, addDoc, delDoc }) {
  return (
    <div className="p-6 space-y-3">
      {isOwner && (
        <>
          <div className="grid grid-cols-3 gap-2">
            <input placeholder="Document title" value={docDraft.title} onChange={e => setDocDraft({ ...docDraft, title: e.target.value })}
              className="px-3 py-2 text-xs border border-slate-300 rounded-lg" />
            <input placeholder="Size" value={docDraft.size} onChange={e => setDocDraft({ ...docDraft, size: e.target.value })}
              className="px-3 py-2 text-xs border border-slate-300 rounded-lg" />
            <input placeholder="URL" value={docDraft.url} onChange={e => setDocDraft({ ...docDraft, url: e.target.value })}
              className="px-3 py-2 text-xs border border-slate-300 rounded-lg" />
          </div>
          <button onClick={addDoc} className="linkedin-btn-primary py-1.5 px-3 text-xs flex items-center"><Paperclip className="w-3.5 h-3.5 mr-1" />Add Document</button>
        </>
      )}
      {(project.documents || []).map(doc => (
        <div key={doc.id} className="p-3 border border-slate-200 rounded-xl bg-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <FileText className="w-5 h-5 text-blue-600" />
            <div>
              <span className="font-bold text-xs text-slate-900">{doc.title}</span>
              {doc.size && <span className="text-[10px] text-slate-400 ml-2">({doc.size})</span>}
            </div>
          </div>
          {isOwner && <button onClick={() => delDoc(doc.id)} className="text-red-500 p-1"><Trash2 className="w-4 h-4" /></button>}
        </div>
      ))}
      {(project.documents || []).length === 0 && <p className="text-xs text-slate-400 text-center py-6">No documents yet.</p>}
    </div>
  );
}

function ActivityTab({ project, onOpenUser }) {
  const acts = project.activity || [];
  return (
    <div className="p-6">
      <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Recent Activity</h4>
      {acts.length === 0 ? <p className="text-xs text-slate-400 text-center py-6">No activity yet.</p> :
        <div className="space-y-3">
          {acts.map(a => (
            <div key={a.id} className="flex items-start space-x-3">
              <div className="w-2 h-2 rounded-full bg-blue-600 mt-1.5 flex-shrink-0" />
              <div className="flex-1">
                <button onClick={() => a.actorId && onOpenUser(a.actorId)}
                  className="text-xs font-bold text-slate-900 hover:text-blue-600">{a.actorName}</button>
                <span className="text-xs text-slate-600 ml-2">{a.message || a.action}</span>
                <p className="text-[10px] text-slate-400 mt-0.5">{new Date(a.createdAt).toLocaleString()}</p>
              </div>
            </div>
          ))}
        </div>
      }
    </div>
  );
}