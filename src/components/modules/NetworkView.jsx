import React, { useState, useEffect } from 'react';
import { Search, UserCheck, UserPlus, Users, UserMinus, Eye } from 'lucide-react';
import { api } from '../../api/client';
import Badge from '../common/Badge';

export default function NetworkView({ currentUser, onOpenUser }) {
  const [tab, setTab] = useState('discover');
  const [all, setAll] = useState([]);
  const [connections, setConnections] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const [users, conns] = await Promise.all([
        api.getUsers('student'),
        api.getConnections(currentUser.id)
      ]);
      setAll(users.filter(u => u.id !== currentUser.id));
      setConnections(conns);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [currentUser.id]);

  const connIds = new Set(connections.map(c => c.id));

  const handleConnect = async (other) => {
    setBusyId(other.id);
    try {
      if (connIds.has(other.id)) {
        await api.disconnectUser(currentUser.id, other.id);
      } else {
        await api.connectUser(currentUser.id, other.id);
      }
      await load();
    } catch (e) {
      alert(e.message);
    } finally {
      setBusyId(null);
    }
  };

  const q = search.trim().toLowerCase();
  const sourceList = tab === 'discover' ? all : connections;
  const filtered = q
    ? sourceList.filter(
        p =>
          p.name.toLowerCase().includes(q) ||
          (p.university || '').toLowerCase().includes(q) ||
          (p.degree || '').toLowerCase().includes(q) ||
          (p.skills || []).some(s => s.toLowerCase().includes(q))
      )
    : sourceList;

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-[#0A66C2] font-semibold text-xs mb-1">
            <Users className="w-4 h-4" />
            <span>Sri Lankan Student Network</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900">Discover & Manage Network</h2>
          <p className="text-xs text-slate-500 mt-1">
            Click any name to view their full profile and posts.
          </p>
        </div>

        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name, university, or skill…"
            className="w-full pl-9 pr-4 py-2 bg-slate-100 border border-slate-200 rounded-full text-xs focus:outline-none focus:bg-white focus:border-blue-600"
          />
        </div>
      </div>

      <div className="flex items-center space-x-2 bg-slate-100 p-1.5 rounded-full border border-slate-200 text-xs font-semibold w-fit">
        <button
          onClick={() => setTab('discover')}
          className={`px-4 py-1.5 rounded-full transition-all ${
            tab === 'discover' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600'
          }`}
        >
          Discover ({all.length})
        </button>
        <button
          onClick={() => setTab('connections')}
          className={`px-4 py-1.5 rounded-full transition-all ${
            tab === 'connections' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600'
          }`}
        >
          My Network ({connections.length})
        </button>
      </div>

      {loading ? (
        <div className="text-center text-slate-400 text-xs py-10">Loading…</div>
      ) : filtered.length === 0 ? (
        <div className="text-center text-slate-400 text-xs py-10">
          {tab === 'connections'
            ? 'You have no connections yet. Go to Discover and connect with peers!'
            : 'No students match your search.'}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map(p => {
            const isConn = connIds.has(p.id);
            return (
              <div
                key={p.id}
                className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs card-hover flex flex-col justify-between"
              >
                <div>
                  <div className="h-16 bg-gradient-to-r from-blue-600 to-indigo-700" />
                  <div className="px-5 pb-4 pt-0 text-center relative">
                    <img
                      src={p.avatar}
                      alt=""
                      className="w-16 h-16 rounded-full border-4 border-white shadow-md mx-auto -mt-8 object-cover"
                    />
                    <div className="mt-2 flex items-center justify-center space-x-1">
                      <button
                        onClick={() => onOpenUser(p.id)}
                        className="font-bold text-slate-900 text-sm hover:text-blue-600 hover:underline"
                      >
                        {p.name}
                      </button>
                      {p.verified && <Badge type="verified" />}
                    </div>
                    <p className="text-xs text-blue-600 font-semibold mt-0.5 line-clamp-1">
                      {p.degree}
                    </p>
                    <p className="text-[11px] text-slate-500 line-clamp-1">
                      {p.university}
                    </p>
                    <p className="mt-3 text-xs text-slate-600 italic line-clamp-3">
                      "{p.bio}"
                    </p>

                    {(p.skills || []).length > 0 && (
                      <div className="mt-3 flex flex-wrap justify-center gap-1">
                        {p.skills.slice(0, 4).map((s, i) => (
                          <span
                            key={i}
                            className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full"
                          >
                            {s}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center space-x-2">
                  <button
                    onClick={() => onOpenUser(p.id)}
                    className="flex-1 py-2 text-xs font-bold rounded-xl border border-slate-300 text-slate-700 hover:bg-white flex items-center justify-center"
                  >
                    <Eye className="w-3.5 h-3.5 mr-1" /> View
                  </button>

                  {tab === 'discover' ? (
                    <button
                      onClick={() => handleConnect(p)}
                      disabled={busyId === p.id}
                      className={`flex-1 py-2 rounded-xl text-xs font-bold flex items-center justify-center space-x-1 ${
                        isConn
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          : 'linkedin-btn-outline hover:bg-blue-50'
                      } disabled:opacity-50`}
                    >
                      {isConn ? (
                        <>
                          <UserCheck className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                          Connected
                        </>
                      ) : (
                        <>
                          <UserPlus className="w-3.5 h-3.5 mr-1" />
                          Connect
                        </>
                      )}
                    </button>
                  ) : (
                    <button
                      onClick={() => handleConnect(p)}
                      disabled={busyId === p.id}
                      className="flex-1 py-2 text-xs font-bold rounded-xl border border-red-300 text-red-600 hover:bg-red-50 flex items-center justify-center disabled:opacity-50"
                    >
                      <UserMinus className="w-3.5 h-3.5 mr-1" />
                      Disconnect
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}