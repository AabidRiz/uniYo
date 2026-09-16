import React, { useState, useEffect, useCallback } from 'react';
import Navbar from './components/layout/Navbar';
import AuthPortal from './components/auth/AuthPortal';
import FeedView from './components/modules/FeedView';
import CollaborateView from './components/modules/CollaborateView';
import ProfessorsView from './components/modules/ProfessorsView';
import BusinessView from './components/modules/BusinessView';
import StudentJobsView from './components/modules/StudentJobsView';
import NetworkView from './components/modules/NetworkView';
import ProfileView from './components/modules/ProfileView';
import AIAssistantDrawer from './components/ai/AIAssistantDrawer';
import UserProfileView from './components/profile/UserProfileView';

// Professor views
import ProfDashboardView from './components/modules/professor/ProfDashboardView';
import ProfCalendarView from './components/modules/professor/ProfCalendarView';
import ProfCoursesView from './components/modules/professor/ProfCoursesView';
import ProfQuestionsView from './components/modules/professor/ProfQuestionsView';
import ProfAdvisedProjectsView from './components/modules/professor/ProfAdvisedProjectsView';
import ProfImpressionsView from './components/modules/professor/ProfImpressionsView';
import AdminDashboardView from './components/modules/admin/AdminDashboardView';

import { api } from './api/client';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeUser, setActiveUser] = useState(null);
  const [activeTab, setActiveTab] = useState('feed');

  const [users, setUsers] = useState([]);
  const [posts, setPosts] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  const [isAiDrawerOpen, setIsAiDrawerOpen] = useState(false);
  const [viewUserId, setViewUserId] = useState(null);
  const [previousTab, setPreviousTab] = useState('feed');
  const [selectedProjectId, setSelectedProjectId] = useState(null);

  const openUserProfile = (id) => {
    if (!id) return;
    setPreviousTab(activeTab);
    setViewUserId(id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  const closeUserProfile = () => {
    setViewUserId(null);
    setActiveTab(previousTab || 'feed');
  };

  const loadAll = useCallback(async (userId) => {
    setLoading(true);
    try {
      const [u, p] = await Promise.all([api.getUsers(), api.getPosts()]);
      setUsers(u);
      setPosts(p);
      if (userId) {
        const pr = await api.getProjects(userId);
        setProjects(pr);
      }
    } catch (err) {
      console.error('Backend load failed:', err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  // Force activeTab to be valid for the current user's role.
  // This prevents stale tabs like 'prof_dashboard' from showing when a student logs in.
  useEffect(() => {
    if (!activeUser) return;
    const validTabs = {
      student: ['feed', 'collaborate', 'professors', 'business', 'network', 'profile'],
      professor: ['feed', 'prof_dashboard', 'prof_calendar', 'prof_courses', 'prof_questions', 'prof_advised', 'prof_impressions', 'collaborate', 'profile'],
      business: ['feed', 'business', 'profile'],
      admin: ['admin_dashboard']
    };
    const allowed = validTabs[activeUser.role] || ['feed'];
    if (!allowed.includes(activeTab)) {
      setActiveTab(allowed[0]);
    }
  }, [activeUser?.id, activeUser?.role, activeTab]);

  const refreshUser = async (userId) => {
    try {
      const fresh = await api.getUser(userId);
      setActiveUser(fresh);
      setUsers(prev => prev.map(x => (x.id === fresh.id ? fresh : x)));
      return fresh;
    } catch (err) {
      console.error(err);
    }
  };

  const refreshProjects = async () => {
    if (!activeUser) return;
    try {
      setProjects(await api.getProjects(activeUser.id));
    } catch (e) {
      console.error(e);
    }
  };

  const handleAuthenticated = async (userObj) => {
    setActiveUser(userObj);
    setIsAuthenticated(true);
    const firstTab =
      userObj.role === 'student' ? 'feed'
      : userObj.role === 'professor' ? 'prof_dashboard'
      : userObj.role === 'business' ? 'business'
      : 'admin_dashboard';
    setActiveTab(firstTab);
    setViewUserId(null);
    await loadAll(userObj.id);
    if (userObj?.id) refreshUser(userObj.id);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setActiveUser(null);
    setActiveTab('feed');
    setViewUserId(null);
    setUsers([]);
    setPosts([]);
    setProjects([]);
    setSelectedProjectId(null);
  };

  const handleAddPost = async (payload) => {
    const created = await api.createPost({ authorId: activeUser.id, ...payload });
    setPosts(prev => [created, ...prev]);
    refreshUser(activeUser.id);
    return created;
  };
  const handleDeletePost = async (id) => {
    await api.deletePost(id);
    setPosts(prev => prev.filter(p => p.id !== id));
    refreshUser(activeUser.id);
  };
  const handleLikePost = async (id) => {
    const updated = await api.likePost(id, activeUser.id);
    setPosts(prev => prev.map(p => (p.id === id ? updated : p)));
  };
  const handleAddComment = async (postId, content) => {
    await api.addComment(postId, { authorId: activeUser.id, content });
    setPosts(await api.getPosts());
  };
  const handleDeleteComment = async (postId, commentId) => {
    await api.deleteComment(postId, commentId);
    setPosts(await api.getPosts());
  };

  const handleCreateProject = async (data) => {
    const created = await api.createProject({ ownerId: activeUser.id, ...data });
    setProjects(prev => [created, ...prev]);
    refreshUser(activeUser.id);
    return created;
  };

  if (loading && !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100">
        <div className="text-slate-500 text-sm font-mono">Connecting to PostgreSQL…</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <AuthPortal onAuthenticate={handleAuthenticated} />;
  }

  const viewingOther = viewUserId !== null;

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans">
      <Navbar
        currentRole={activeUser?.role}
        activeTab={activeTab}
        setActiveTab={(tab) => { setViewUserId(null); setActiveTab(tab); }}
        currentUser={activeUser}
        onOpenAiDrawer={() => setIsAiDrawerOpen(true)}
        onLogout={handleLogout}
        onOpenProfile={() => openUserProfile(activeUser.id)}
      />

      <main className="flex-1 pb-16">
        {viewingOther ? (
          <UserProfileView
            userId={viewUserId}
            currentUser={activeUser}
            onBack={closeUserProfile}
          />
        ) : (
          <>
            {/* STUDENT VIEWS */}
            {activeTab === 'feed' && activeUser?.role === 'student' && (
              <FeedView
                currentUser={activeUser}
                posts={posts}
                users={users}
                onAddPost={handleAddPost}
                onDeletePost={handleDeletePost}
                onLikePost={handleLikePost}
                onAddComment={handleAddComment}
                onDeleteComment={handleDeleteComment}
                onNavigateTab={setActiveTab}
                onOpenUser={openUserProfile}
              />
            )}
            {activeTab === 'feed' && activeUser?.role === 'professor' && (
              <FeedView
                currentUser={activeUser}
                posts={posts}
                users={users}
                onAddPost={handleAddPost}
                onDeletePost={handleDeletePost}
                onLikePost={handleLikePost}
                onAddComment={handleAddComment}
                onDeleteComment={handleDeleteComment}
                onNavigateTab={setActiveTab}
                onOpenUser={openUserProfile}
              />
            )}
            {activeTab === 'feed' && activeUser?.role === 'business' && (
              <FeedView
                currentUser={activeUser}
                posts={posts}
                users={users}
                onAddPost={handleAddPost}
                onDeletePost={handleDeletePost}
                onLikePost={handleLikePost}
                onAddComment={handleAddComment}
                onDeleteComment={handleDeleteComment}
                onNavigateTab={setActiveTab}
                onOpenUser={openUserProfile}
              />
            )}
            {activeTab === 'collaborate' && (activeUser?.role === 'student' || activeUser?.role === 'professor') && (
              <CollaborateView
                currentUser={activeUser}
                projects={projects}
                onCreateProject={handleCreateProject}
                onRefresh={refreshProjects}
                onOpenUser={openUserProfile}
                initialProjectId={selectedProjectId}
              />
            )}
            {activeTab === 'professors' && activeUser?.role === 'student' && (
              <ProfessorsView currentUser={activeUser} onOpenUser={openUserProfile} />
            )}
            {activeTab === 'business' && activeUser?.role === 'student' && (
              <StudentJobsView currentUser={activeUser} />
            )}
            {activeTab === 'network' && activeUser?.role === 'student' && (
              <NetworkView currentUser={activeUser} users={users} onOpenUser={openUserProfile} />
            )}

            {/* PROFESSOR VIEWS */}
            {activeTab === 'prof_dashboard' && activeUser?.role === 'professor' && (
              <ProfDashboardView currentUser={activeUser} onNavigate={setActiveTab} />
            )}
            {activeTab === 'prof_calendar' && activeUser?.role === 'professor' && (
              <ProfCalendarView currentUser={activeUser} />
            )}
            {activeTab === 'prof_courses' && activeUser?.role === 'professor' && (
              <ProfCoursesView currentUser={activeUser} />
            )}
            {activeTab === 'prof_questions' && activeUser?.role === 'professor' && (
              <ProfQuestionsView currentUser={activeUser} onOpenUser={openUserProfile} />
            )}
            {activeTab === 'prof_advised' && activeUser?.role === 'professor' && (
              <ProfAdvisedProjectsView
                currentUser={activeUser}
                onOpenProject={(projectId) => {
                  setSelectedProjectId(projectId);
                  setActiveTab('collaborate');
                }}
              />
            )}
            {activeTab === 'prof_impressions' && activeUser?.role === 'professor' && (
              <ProfImpressionsView currentUser={activeUser} />
            )}

            {/* BUSINESS */}
            {activeTab === 'business' && activeUser?.role === 'business' && (
              <BusinessView currentUser={activeUser} onOpenUser={openUserProfile} />
            )}

            {activeTab === 'admin_dashboard' && activeUser?.role === 'admin' && (
              <AdminDashboardView />
            )}

            {/* SHARED */}
            {activeTab === 'profile' && (
              <ProfileView
                currentUser={activeUser}
                onUserUpdate={(updated) => {
                  setActiveUser(updated);
                  setUsers(prev => prev.map(u => (u.id === updated.id ? updated : u)));
                }}
                onLogout={handleLogout}
              />
            )}
          </>
        )}
      </main>

      <footer className="bg-white border-t border-slate-200 py-4 text-center text-xs text-slate-500">
        © 2026 UniYO — Integrated Sri Lankan University Application Engine.
      </footer>

      <AIAssistantDrawer
        isOpen={isAiDrawerOpen}
        onClose={() => setIsAiDrawerOpen(false)}
        currentUser={activeUser}
      />
    </div>
  );
}