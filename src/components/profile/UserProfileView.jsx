import React, { useEffect, useState } from 'react';
import {
  ArrowLeft, ThumbsUp, MessageSquare, MapPin, Briefcase,
  GraduationCap, UserPlus, UserCheck, UserMinus
} from 'lucide-react';
import Badge from '../common/Badge';
import { api } from '../../api/client';

export default function UserProfileView({ userId, currentUser, onBack, onOpenUser }) {
  const [user, setUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [connections, setConnections] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const [u, p, myConns] = await Promise.all([
        api.getUser(userId),
        api.getUserPosts(userId),
        api.getConnections(currentUser.id)
      ]);
      setUser(u);
      setPosts(p || []);
      setConnections(new Set(myConns.map(c => c.id)));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userId) load();
  }, [userId]);

  const toggleConnect = async () => {
    if (!user) return;
    setBusy(true);
    try {
      if (connections.has(user.id)) {
        await api.disconnectUser(currentUser.id, user.id);
        const next = new Set(connections);
        next.delete(user.id);
        setConnections(next);
      } else {
        await api.connectUser(currentUser.id, user.id);
        const next = new Set(connections);
        next.add(user.id);
        setConnections(next);
      }
    } catch (e) {
      alert(e.message);
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center text-slate-400 text-sm">
        Loading profile…
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <p className="text-red-500 text-sm">{error}</p>
        <button onClick={onBack} className="mt-4 linkedin-btn-outline py-2 px-4 text-xs">
          Go back
        </button>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center text-slate-400 text-sm">
        User not found.
      </div>
    );
  }

  const isSelf = user.id === currentUser.id;
  const isConnected = connections.has(user.id);

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      {/* Back header */}
      <div className="flex items-center space-x-3">
        <button
          onClick={onBack}
          className="flex items-center text-xs font-semibold text-slate-600 hover:text-slate-900 px-3 py-2 rounded-lg hover:bg-slate-100"
        >
          <ArrowLeft className="w-4 h-4 mr-1.5" />
          Back
        </button>
      </div>

      {/* Cover + avatar card */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
        <div className="h-48 bg-gradient-to-r from-blue-700 to-indigo-800 relative">
          {user.cover && (
            <img
              src={user.cover}
              alt=""
              className="w-full h-full object-cover opacity-90"
            />
          )}
        </div>

        <div className="px-6 pb-6 pt-0 relative">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between -mt-16 mb-4">
            <img
              src={user.avatar}
              alt=""
              className="w-32 h-32 rounded-full border-4 border-white shadow-lg object-cover"
            />

            <div className="mt-4 sm:mt-0 flex items-center space-x-2">
              {isSelf ? (
                <span className="text-xs font-semibold text-slate-500 italic">
                  This is you
                </span>
              ) : (
                <button
                  onClick={toggleConnect}
                  disabled={busy}
                  className={`py-2 px-5 text-xs font-bold rounded-full flex items-center disabled:opacity-50 ${
                    isConnected
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      : 'linkedin-btn-primary'
                  }`}
                >
                  {isConnected ? (
                    <>
                      <UserCheck className="w-4 h-4 mr-1.5" /> Connected
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4 mr-1.5" /> Connect
                    </>
                  )}
                </button>
              )}
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <h1 className="text-2xl font-bold text-slate-900">{user.name}</h1>
              {user.verified && <Badge type="verified" />}
            </div>

            <p className="text-sm text-slate-700 font-semibold">
              {user.degree || user.title || user.company || 'Member'}
            </p>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 mt-2">
              {user.university && (
                <span className="flex items-center">
                  <GraduationCap className="w-3.5 h-3.5 mr-1" />
                  {user.university}
                  {user.faculty && ` • ${user.faculty}`}
                </span>
              )}
              {user.company && (
                <span className="flex items-center">
                  <Briefcase className="w-3.5 h-3.5 mr-1" />
                  {user.company}
                </span>
              )}
              {user.studentId && (
                <span className="font-mono text-[11px]">ID: {user.studentId}</span>
              )}
              {user.industry && (
                <span className="flex items-center">
                  <MapPin className="w-3.5 h-3.5 mr-1" />
                  {user.industry}
                </span>
              )}
            </div>
          </div>

          {user.bio && (
            <p className="mt-4 text-sm text-slate-700 leading-relaxed max-w-2xl">
              {user.bio}
            </p>
          )}

          {/* Stats row */}
          <div className="mt-6 pt-4 border-t border-slate-100 grid grid-cols-3 text-center">
            <div>
              <span className="block font-bold text-slate-900 text-lg">
                {user.stats?.connections ?? 0}
              </span>
              <span className="text-xs text-slate-400">Connections</span>
            </div>
            <div>
              <span className="block font-bold text-slate-900 text-lg">
                {user.stats?.projects ?? 0}
              </span>
              <span className="text-xs text-slate-400">Projects</span>
            </div>
            <div>
              <span className="block font-bold text-slate-900 text-lg">
                {user.stats?.posts ?? 0}
              </span>
              <span className="text-xs text-slate-400">Posts</span>
            </div>
          </div>
        </div>
      </div>

      {/* Skills */}
      {(user.skills || []).length > 0 && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
          <h2 className="font-bold text-slate-900 text-sm mb-3">Skills & Competencies</h2>
          <div className="flex flex-wrap gap-2">
            {user.skills.map((s, i) => (
              <span
                key={i}
                className="px-3 py-1 bg-blue-50 text-[#0A66C2] font-semibold text-xs rounded-full border border-blue-200"
              >
                {s}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Posts */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
        <h2 className="font-bold text-slate-900 text-sm mb-4">
          Posts by {user.name} ({posts.length})
        </h2>

        {posts.length === 0 ? (
          <div className="text-center py-10 text-xs text-slate-400">
            {isSelf
              ? "You haven't posted yet. Share something on the Home feed!"
              : `${user.name} hasn't posted yet.`}
          </div>
        ) : (
          <div className="space-y-4">
            {posts.map(p => (
              <div
                key={p.id}
                className="p-4 border border-slate-200 rounded-xl bg-slate-50/50"
              >
                <p className="text-sm text-slate-800 whitespace-pre-line leading-relaxed">
                  {p.content}
                </p>

                {p.image && (
                  <img
                    src={p.image}
                    alt=""
                    className="mt-3 rounded-lg max-h-80 object-cover border border-slate-200"
                  />
                )}

                {p.attachment && (
                  <a
                    href={p.attachment.base64}
                    download={p.attachment.name}
                    className="mt-3 inline-flex items-center space-x-2 px-3 py-2 border border-slate-200 rounded-lg bg-white text-xs font-semibold text-slate-800 hover:bg-slate-100"
                  >
                    <span>{p.attachment.name}</span>
                  </a>
                )}

                <div className="mt-3 flex flex-wrap gap-1.5">
                  {p.tags?.map((t, i) => (
                    <span
                      key={i}
                      className="text-[10px] font-semibold text-[#0A66C2] bg-blue-50 px-2 py-0.5 rounded-full"
                    >
                      {t}
                    </span>
                  ))}
                </div>

                <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                  <div className="flex items-center space-x-3">
                    <span className="flex items-center">
                      <ThumbsUp className="w-3.5 h-3.5 mr-1 text-blue-600" />
                      {p.likes}
                    </span>
                    <span className="flex items-center">
                      <MessageSquare className="w-3.5 h-3.5 mr-1 text-slate-400" />
                      {p.commentsCount}
                    </span>
                  </div>
                  <span>{p.timestamp}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}