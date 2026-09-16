import React, { useState, useEffect } from 'react';
import {
  Home, Users, Briefcase, GraduationCap,
  Bot, LogOut, ShieldCheck, Network, Bell,
  Calendar, Video, MessageSquare, Target, Star
} from 'lucide-react';
import UniYOLogo from '../common/UniYOLogo';
import { api } from '../../api/client';

export default function Navbar({
  currentRole, activeTab, setActiveTab, currentUser, onOpenAiDrawer, onLogout, onOpenProfile
}) {
  const [invites, setInvites] = useState([]);
  const [advisorReqs, setAdvisorReqs] = useState([]);
  const [notifications, setNotifications] = useState({ calendar: 0, questions: 0, projects: 0, invites: 0 });
  const [showBell, setShowBell] = useState(false);

  const load = async () => {
    if (!currentUser?.id) return;
    try {
      const invitesList = await api.getMyInvites(currentUser.id);
      setInvites(invitesList);
      setNotifications(await api.getNotifications(currentUser.id));
      if (currentUser.role === 'professor') {
        const reqs = await api.getAdvisorRequests(currentUser.id);
        setAdvisorReqs(reqs);
      }
    } catch (e) { /* silent */ }
  };

  useEffect(() => {
    load();
    const t = setInterval(load, 20000);
    return () => clearInterval(t);
  }, [currentUser?.id]);

  const respondInvite = async (invite, status) => {
    try {
      await api.respondInvite(invite.projectId, invite.id, status, currentUser.id);
      setInvites(invites.filter(i => i.id !== invite.id));
      setShowBell(false);
      setActiveTab('collaborate');
    } catch (e) { alert(e.message); }
  };

  const respondAdvisor = async (projectId, status) => {
    try {
      await api.respondAdvisor(projectId, currentUser.id, status);
      setAdvisorReqs(advisorReqs.filter(r => r.projectId !== projectId));
      setShowBell(false);
      setActiveTab('prof_advised');
    } catch (e) { alert(e.message); }
  };

  const getTabsForRole = (role) => {
    if (role === 'student') return [
      { id: 'feed', label: 'Home', icon: Home },
      { id: 'collaborate', label: 'Collaborate', icon: Users },
      { id: 'professors', label: 'Professors', icon: GraduationCap },
      { id: 'business', label: 'Jobs', icon: Briefcase },
      { id: 'network', label: 'Network', icon: Network },
      { id: 'profile', label: 'Profile', icon: ShieldCheck }
    ];
    if (role === 'professor') return [
      { id: 'feed', label: 'Home', icon: Home },
      { id: 'prof_dashboard', label: 'Dashboard', icon: Home },
      { id: 'prof_calendar', label: 'Office Hours', icon: Calendar },
      { id: 'prof_courses', label: 'Videos', icon: Video },
      { id: 'prof_questions', label: 'Q&A', icon: MessageSquare },
      { id: 'prof_advised', label: 'Advised', icon: Target },
      { id: 'prof_impressions', label: 'Reviews', icon: Star },
      { id: 'profile', label: 'Profile', icon: ShieldCheck }
    ];
    if (role === 'business') return [
      { id: 'feed', label: 'Home', icon: Home },
      { id: 'business', label: 'Enterprise', icon: Briefcase },
      { id: 'profile', label: 'Profile', icon: ShieldCheck }
    ];
    return [{ id: 'admin_dashboard', label: 'Control Center', icon: ShieldCheck }];
  };

  const tabs = getTabsForRole(currentRole);
  const aiLabelByRole = {
    student: 'AI Collaborator',
    professor: 'AI Faculty Assistant',
    business: 'AI Investment Agent',
    admin: 'AI Verification Agent'
  };

  const bellCount = invites.length + (currentRole === 'professor' ? advisorReqs.length : 0) + notifications.calendar + notifications.questions;

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <button onClick={() => setActiveTab(tabs[0]?.id || 'feed')} className="focus:outline-none">
            <UniYOLogo size="md" />
          </button>

          <nav className="hidden md:flex items-center space-x-1">
            {tabs.map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                    isActive ? 'text-[#0A66C2] bg-blue-50'
                             : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}>
                  <Icon className="w-4 h-4" />
                  <span className="whitespace-nowrap">{tab.label}</span>
                  {((tab.id === 'prof_calendar' && notifications.calendar > 0) || (tab.id === 'prof_questions' && notifications.questions > 0) || (tab.id === 'prof_advised' && notifications.projects > 0) || (tab.id === 'professors' && (notifications.calendar > 0 || notifications.questions > 0))) && <span className="w-2 h-2 rounded-full bg-red-500" />}
                </button>
              );
            })}
          </nav>

          <div className="flex items-center space-x-2">
            <div className="relative">
              <button onClick={() => setShowBell(v => !v)}
                className="relative p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg"
                title="Notifications">
                <Bell className="w-4 h-4" />
                {bellCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                    {bellCount}
                  </span>
                )}
              </button>

              {showBell && (
                <div className="absolute right-0 mt-2 w-80 bg-white border border-slate-200 rounded-xl shadow-2xl z-50 max-h-96 overflow-y-auto">
                  {currentRole === 'professor' && advisorReqs.length > 0 && (
                    <>
                      <div className="px-3 py-2 border-b border-slate-100 text-[11px] font-semibold text-slate-500 uppercase">
                        Advisement Requests ({advisorReqs.length})
                      </div>
                      {advisorReqs.map(r => (
                        <div key={r.projectId} className="p-3 border-b border-slate-100">
                          <div className="flex items-start space-x-2">
                            <img src={r.ownerAvatar} alt="" className="w-8 h-8 rounded-full object-cover border" />
                            <div className="flex-1">
                              <p className="text-xs font-semibold text-slate-900">{r.projectTitle}</p>
                              <p className="text-[10px] text-slate-500">by {r.ownerName}</p>
                              {r.pitch && <p className="text-[10px] text-slate-500 italic mt-1">"{r.pitch}"</p>}
                              <div className="mt-2 flex items-center space-x-2">
                                <button onClick={() => respondAdvisor(r.projectId, 'Active')}
                                  className="px-3 py-1 bg-emerald-600 text-white text-[10px] font-bold rounded-full">
                                  Accept
                                </button>
                                <button onClick={() => respondAdvisor(r.projectId, 'Declined')}
                                  className="px-3 py-1 bg-slate-200 text-slate-700 text-[10px] font-bold rounded-full">
                                  Decline
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </>
                  )}

                  {invites.length > 0 && (
                    <>
                      <div className="px-3 py-2 border-b border-slate-100 text-[11px] font-semibold text-slate-500 uppercase">
                        Project Invites ({invites.length})
                      </div>
                      {invites.map(inv => (
                        <div key={inv.id} className="p-3 border-b border-slate-100 last:border-0">
                          <div className="flex items-start space-x-2">
                            <img src={inv.ownerAvatar} alt="" className="w-8 h-8 rounded-full object-cover border" />
                            <div className="flex-1">
                              <p className="text-xs font-semibold text-slate-900">{inv.projectTitle}</p>
                              <p className="text-[10px] text-slate-500">by {inv.ownerName}</p>
                              <div className="mt-2 flex items-center space-x-2">
                                <button onClick={() => respondInvite(inv, 'Accepted')}
                                  className="px-3 py-1 bg-emerald-600 text-white text-[10px] font-bold rounded-full">
                                  Accept
                                </button>
                                <button onClick={() => respondInvite(inv, 'Declined')}
                                  className="px-3 py-1 bg-slate-200 text-slate-700 text-[10px] font-bold rounded-full">
                                  Decline
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </>
                  )}

                  {bellCount === 0 && (
                    <div className="p-4 text-xs text-slate-400 text-center">No pending notifications.</div>
                  )}
                </div>
              )}
            </div>

            <button onClick={onOpenAiDrawer}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-gradient-to-r from-indigo-600 to-blue-600 text-white rounded-full text-xs font-semibold">
              <Bot className="w-4 h-4" />
              <span className="hidden sm:inline">{aiLabelByRole[currentRole] || 'AI'}</span>
            </button>

            <button onClick={onOpenProfile} className="pl-2 border-l border-slate-200" title="View profile">
              <img src={currentUser?.avatar} alt=""
                className="w-8 h-8 rounded-full border border-slate-300 object-cover hover:ring-2 hover:ring-blue-500" />
            </button>

            <button onClick={onLogout}
              className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg" title="Logout">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="md:hidden flex items-center overflow-x-auto pb-2 space-x-1">
          {tabs.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-1 px-3 py-1.5 rounded-full text-[11px] font-semibold whitespace-nowrap ${
                  isActive ? 'bg-[#0A66C2] text-white' : 'bg-slate-100 text-slate-700'
                }`}>
                <Icon className="w-3.5 h-3.5" /><span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
}