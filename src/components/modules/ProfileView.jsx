import React, { useEffect, useState } from 'react';
import { Edit3, LogOut, Save, X, Trash2, Upload, ThumbsUp, MessageSquare } from 'lucide-react';
import Badge from '../common/Badge';
import { api } from '../../api/client';

export default function ProfileView({ currentUser, onUserUpdate, onLogout }) {
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [posts, setPosts] = useState([]);
  const [editingPostId, setEditingPostId] = useState(null);
  const [postText, setPostText] = useState('');
  const [savingPost, setSavingPost] = useState(false);
  const [form, setForm] = useState({
    name: '',
    bio: '',
    degree: '',
    faculty: '',
    company: '',
    industry: '',
    title: '',
    skills: '',
    avatarBase64: undefined,
    coverBase64: undefined,
    removeAvatar: false,
    removeCover: false
  });

  useEffect(() => {
    let mounted = true;
    api.getUserPosts(currentUser.id)
      .then(result => { if (mounted) setPosts(result || []); })
      .catch(err => console.error('Failed to load profile posts:', err));
    return () => { mounted = false; };
  }, [currentUser.id]);

  const fileToBase64 = (f) =>
    new Promise((res, rej) => {
      const r = new FileReader();
      r.onloadend = () => res(r.result);
      r.onerror = rej;
      r.readAsDataURL(f);
    });

  const openEdit = () => {
    setForm({
      name: currentUser.name || '',
      bio: currentUser.bio || '',
      degree: currentUser.degree || '',
      faculty: currentUser.faculty || '',
      company: currentUser.company || '',
      industry: currentUser.industry || '',
      title: currentUser.title || '',
      skills: (currentUser.skills || []).join(', '),
      avatarBase64: undefined,
      coverBase64: undefined,
      removeAvatar: false,
      removeCover: false
    });
    setEditing(true);
  };

  const handleSave = async () => {
    setBusy(true);
    try {
      const payload = {
        name: form.name,
        bio: form.bio,
        degree: form.degree,
        faculty: form.faculty,
        company: form.company,
        industry: form.industry,
        title: form.title,
        skills: form.skills
      };

      if (form.removeAvatar) payload.avatarBase64 = null;
      else if (form.avatarBase64) payload.avatarBase64 = form.avatarBase64;

      if (form.removeCover) payload.coverBase64 = null;
      else if (form.coverBase64) payload.coverBase64 = form.coverBase64;

      const updated = await api.updateUser(currentUser.id, payload);
      onUserUpdate(updated);
      setEditing(false);
    } catch (e) {
      alert(e.message);
    } finally {
      setBusy(false);
    }
  };

  const savePost = async (postId) => {
    if (!postText.trim()) return;
    setSavingPost(true);
    try {
      const updated = await api.updatePost(postId, { content: postText.trim() });
      setPosts(prev => prev.map(post => post.id === postId ? { ...post, ...updated, content: postText.trim() } : post));
      setEditingPostId(null);
      setPostText('');
    } catch (err) {
      alert(err.message);
    } finally {
      setSavingPost(false);
    }
  };

  const deletePost = async (postId) => {
    if (!window.confirm('Delete this post permanently?')) return;
    try {
      await api.deletePost(postId);
      setPosts(prev => prev.filter(post => post.id !== postId));
    } catch (err) {
      alert(err.message);
    }
  };

  const previewAvatar = form.removeAvatar
    ? 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><circle cx="50" cy="50" r="50" fill="%23cbd5e1"/><text x="50" y="58" font-size="32" text-anchor="middle" fill="%23ffffff">?</text></svg>'
    : form.avatarBase64 || currentUser.avatar;

  const previewCover = form.removeCover ? null : form.coverBase64 || currentUser.cover;

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
        <div className="h-44 bg-gradient-to-r from-blue-700 to-indigo-800 relative">
          {currentUser.cover && (
            <img src={currentUser.cover} alt="" className="w-full h-full object-cover opacity-80" />
          )}
        </div>

        <div className="px-6 pb-6 pt-0 relative">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between -mt-16 mb-4">
            <img
              src={currentUser.avatar}
              alt=""
              className="w-28 h-28 rounded-full border-4 border-white shadow-lg object-cover"
            />
            <div className="mt-4 sm:mt-0 flex flex-wrap items-center gap-2">
              <button
                onClick={openEdit}
                className="linkedin-btn-outline text-xs py-1.5 px-4 flex items-center"
              >
                <Edit3 className="w-3.5 h-3.5 mr-1" /> Edit Profile
              </button>
              <button
                onClick={onLogout}
                className="py-1.5 px-4 text-xs font-semibold text-red-600 border border-red-300 rounded-full hover:bg-red-50 flex items-center"
              >
                <LogOut className="w-3.5 h-3.5 mr-1" /> Logout
              </button>
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <h2 className="text-xl font-bold text-slate-900">{currentUser.name}</h2>
              {currentUser.verified && <Badge type="verified" />}
            </div>
            <p className="text-xs text-slate-600 font-semibold">
              {currentUser.degree || currentUser.title || currentUser.company}
            </p>
            <p className="text-xs text-slate-500">
              {currentUser.university}
              {currentUser.faculty && ` • ${currentUser.faculty}`}
              {currentUser.industry && ` • ${currentUser.industry}`}
            </p>
            {(currentUser.studentId || currentUser.role) && (
              <p className="text-xs text-slate-500">
                {currentUser.studentId && `Student ID: ${currentUser.studentId}`}
                {currentUser.studentId && currentUser.role && ' • '}
                {currentUser.role && `Role: ${currentUser.role}`}
              </p>
            )}
          </div>

          <p className="mt-4 text-xs text-slate-700 leading-relaxed max-w-2xl">
            {currentUser.bio}
          </p>

          <div className="mt-6 pt-4 border-t border-slate-100 flex flex-wrap items-center gap-6 text-xs">
            <div>
              <span className="block font-bold text-slate-900 text-sm">
                {currentUser.stats?.connections ?? 0}
              </span>
              <span className="text-slate-500">Connections</span>
            </div>
            <div>
              <span className="block font-bold text-slate-900 text-sm">
                {currentUser.stats?.projects ?? 0}
              </span>
              <span className="text-slate-500">Projects</span>
            </div>
            <div>
              <span className="block font-bold text-slate-900 text-sm">
                {currentUser.stats?.posts ?? 0}
              </span>
              <span className="text-slate-500">Posts</span>
            </div>
            <div>
              <span
                className={`block border font-bold px-3 py-1 rounded-full text-[11px] ${
                  currentUser.verified
                    ? 'border-emerald-300 bg-emerald-50 text-emerald-800'
                    : 'border-amber-300 bg-amber-50 text-amber-800'
                }`}
              >
                {currentUser.verified ? '🛡️ Verified' : '⏳ Pending review'}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
        <h3 className="font-bold text-slate-900 text-sm mb-3">Skills</h3>
        <div className="flex flex-wrap gap-2">
          {(currentUser.skills || []).length === 0 ? (
            <span className="text-xs text-slate-400">
              No skills added yet. Click Edit Profile to add.
            </span>
          ) : (
            currentUser.skills.map((s, i) => (
              <span
                key={i}
                className="px-3 py-1 bg-blue-50 text-[#0A66C2] font-semibold text-xs rounded-full border border-blue-200"
              >
                {s}
              </span>
            ))
          )}
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
        <h3 className="font-bold text-slate-900 text-sm mb-3">Your Posts ({posts.length})</h3>
        {posts.length === 0 ? (
          <p className="text-xs text-slate-400 text-center py-8">You have not posted yet.</p>
        ) : (
          <div className="space-y-4">
            {posts.map(post => (
              <div key={post.id} className="border border-slate-200 rounded-xl p-4 bg-slate-50/50">
                {editingPostId === post.id ? (
                  <>
                    <textarea
                      value={postText}
                      onChange={e => setPostText(e.target.value)}
                      rows={3}
                      className="w-full bg-white rounded-lg px-3 py-2 text-sm border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    />
                    <div className="mt-2 flex justify-end gap-2">
                      <button
                        onClick={() => { setEditingPostId(null); setPostText(''); }}
                        className="px-3 py-1.5 text-xs font-semibold text-slate-600"
                      >Cancel</button>
                      <button
                        onClick={() => savePost(post.id)}
                        disabled={savingPost || !postText.trim()}
                        className="linkedin-btn-primary py-1.5 px-4 text-xs flex items-center disabled:opacity-50"
                      ><Save className="w-3.5 h-3.5 mr-1" />{savingPost ? 'Saving...' : 'Save'}</button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex items-start justify-between gap-3">
                      <p className="flex-1 text-sm text-slate-800 whitespace-pre-line leading-relaxed">{post.content}</p>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <button
                          onClick={() => { setEditingPostId(post.id); setPostText(post.content || ''); }}
                          className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                          title="Edit post"
                        ><Edit3 className="w-4 h-4" /></button>
                        <button
                          onClick={() => deletePost(post.id)}
                          className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg"
                          title="Delete post"
                        ><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </div>
                    {post.image && <img src={post.image} alt="" className="mt-3 rounded-lg max-h-80 object-cover border border-slate-200" />}
                    <div className="mt-3 pt-3 border-t border-slate-100 flex items-center gap-4 text-[11px] text-slate-500">
                      <span className="flex items-center"><ThumbsUp className="w-3.5 h-3.5 mr-1 text-blue-600" />{post.likes || 0}</span>
                      <span className="flex items-center"><MessageSquare className="w-3.5 h-3.5 mr-1 text-slate-400" />{post.commentsCount || 0}</span>
                      <span className="ml-auto">{post.timestamp || 'Recently'}</span>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold">Edit Profile</h3>
              <button
                onClick={() => setEditing(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Name</label>
                <input
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Bio</label>
                <textarea
                  rows={3}
                  value={form.bio}
                  onChange={e => setForm({ ...form, bio: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Degree</label>
                  <input
                    value={form.degree}
                    onChange={e => setForm({ ...form, degree: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Faculty</label>
                  <input
                    value={form.faculty}
                    onChange={e => setForm({ ...form, faculty: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              {currentUser.role === 'business' && (
                <div className="grid grid-cols-2 gap-3">
                  <input
                    placeholder="Company"
                    value={form.company}
                    onChange={e => setForm({ ...form, company: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                  />
                  <input
                    placeholder="Industry"
                    value={form.industry}
                    onChange={e => setForm({ ...form, industry: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Skills (comma separated)
                </label>
                <input
                  value={form.skills}
                  onChange={e => setForm({ ...form, skills: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                />
              </div>

              {/* Avatar section */}
              <div className="p-3 border border-slate-200 rounded-lg">
                <label className="block text-xs font-semibold text-slate-700 mb-2">
                  Profile Picture
                </label>
                <div className="flex items-center space-x-3 flex-wrap gap-2">
                  <img
                    src={previewAvatar}
                    alt=""
                    className="w-14 h-14 rounded-full object-cover border border-slate-300"
                  />
                  <label className="cursor-pointer linkedin-btn-outline py-1.5 px-3 text-xs flex items-center">
                    <Upload className="w-3.5 h-3.5 mr-1" /> Replace
                    <input
                      type="file"
                      accept="image/*"
                      hidden
                      onChange={async e => {
                        const f = e.target.files[0];
                        if (!f) return;
                        const b64 = await fileToBase64(f);
                        setForm(prev => ({ ...prev, avatarBase64: b64, removeAvatar: false }));
                      }}
                    />
                  </label>
                  <button
                    type="button"
                    onClick={() =>
                      setForm(prev => ({ ...prev, avatarBase64: undefined, removeAvatar: true }))
                    }
                    className="py-1.5 px-3 text-xs font-semibold text-red-600 border border-red-300 rounded-full hover:bg-red-50 flex items-center"
                  >
                    <Trash2 className="w-3.5 h-3.5 mr-1" /> Remove
                  </button>
                </div>
                {form.removeAvatar && (
                  <p className="text-[10px] text-red-500 mt-1">
                    Avatar will be removed on save.
                  </p>
                )}
              </div>

              {/* Cover section */}
              <div className="p-3 border border-slate-200 rounded-lg">
                <label className="block text-xs font-semibold text-slate-700 mb-2">
                  Cover Image
                </label>
                <div className="flex items-center space-x-3 flex-wrap gap-2">
                  {previewCover ? (
                    <img
                      src={previewCover}
                      alt=""
                      className="w-24 h-12 rounded object-cover border border-slate-300"
                    />
                  ) : (
                    <div className="w-24 h-12 rounded bg-slate-100 border border-dashed border-slate-300 flex items-center justify-center text-[10px] text-slate-400">
                      No cover
                    </div>
                  )}
                  <label className="cursor-pointer linkedin-btn-outline py-1.5 px-3 text-xs flex items-center">
                    <Upload className="w-3.5 h-3.5 mr-1" /> Replace
                    <input
                      type="file"
                      accept="image/*"
                      hidden
                      onChange={async e => {
                        const f = e.target.files[0];
                        if (!f) return;
                        const b64 = await fileToBase64(f);
                        setForm(prev => ({ ...prev, coverBase64: b64, removeCover: false }));
                      }}
                    />
                  </label>
                  <button
                    type="button"
                    onClick={() =>
                      setForm(prev => ({ ...prev, coverBase64: undefined, removeCover: true }))
                    }
                    className="py-1.5 px-3 text-xs font-semibold text-red-600 border border-red-300 rounded-full hover:bg-red-50 flex items-center"
                  >
                    <Trash2 className="w-3.5 h-3.5 mr-1" /> Remove
                  </button>
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-3">
                <button
                  onClick={() => setEditing(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={busy}
                  className="linkedin-btn-primary py-2 px-5 text-xs flex items-center disabled:opacity-50"
                >
                  <Save className="w-3.5 h-3.5 mr-1.5" />
                  {busy ? 'Saving…' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}