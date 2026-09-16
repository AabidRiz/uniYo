import React, { useState, useEffect } from 'react';
import { Users, Trash2, ShieldCheck, Search } from 'lucide-react';
import { api } from '../../../api/client';
import Badge from '../../common/Badge';

export default function AdminUsersView() {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const data = await api.getUsers();
      setUsers(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (id) => {
    if (!window.confirm('Delete this user account permanently from PostgreSQL?')) return;
    try {
      await api.deleteUser(id);
      setUsers(users.filter(u => u.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  const filtered = users.filter(u => 
    u.name.toLowerCase().includes(search.toLowerCase()) || 
    (u.email && u.email.toLowerCase().includes(search.toLowerCase())) ||
    (u.university && u.university.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-6 font-sans">
      
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-indigo-600 font-semibold text-xs mb-1">
            <Users className="w-4 h-4" />
            <span>PostgreSQL User Directory Administration</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900">Manage Registered Platform Users</h2>
          <p className="text-xs text-slate-500 mt-1">
            Inspect, verify, or remove registered Sri Lankan student, professor, and investor accounts.
          </p>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search users..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs bg-slate-100 border border-slate-200 rounded-full focus:outline-none focus:bg-white"
          />
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-3">
        <h3 className="font-bold text-slate-900 text-sm mb-4">PostgreSQL Accounts ({filtered.length})</h3>

        {filtered.map(u => (
          <div key={u.id} className="p-3.5 border border-slate-200 rounded-xl bg-slate-50 flex items-center justify-between hover:bg-white transition-colors">
            <div className="flex items-center space-x-3">
              <img src={u.avatar || u.avatar_base64} alt={u.name} className="w-10 h-10 rounded-full object-cover border border-slate-300" />
              <div>
                <div className="flex items-center space-x-1.5">
                  <h4 className="font-bold text-xs text-slate-900">{u.name}</h4>
                  <Badge type={u.role || 'student'} />
                  {u.verified && <Badge type="verified" />}
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">{u.email} • {u.university || u.company || 'Sri Lanka'}</p>
              </div>
            </div>

            <button
              onClick={() => handleDeleteUser(u.id)}
              className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
              title="Delete Account from PostgreSQL"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

    </div>
  );
}
