import React, { useState, useEffect } from 'react';
import { Building2, Plus, Trash2, Search, CheckCircle2 } from 'lucide-react';
import { api } from '../../../api/client';

export default function AdminUniversitiesView() {
  const [universities, setUniversities] = useState([]);
  const [search, setSearch] = useState('');
  const [newUni, setNewUni] = useState({ name: '', category: 'Non-State/Private', code: '', domain: '', pattern: '' });
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    loadUnis();
  }, []);

  const loadUnis = async () => {
    try {
      const data = await api.getUniversities();
      setUniversities(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    if (!newUni.name.trim()) return;

    try {
      const added = await api.addUniversity(newUni);
      setUniversities([...universities, added]);
      setNewUni({ name: '', category: 'Non-State/Private', code: '', domain: '', pattern: '' });
      setSuccessMsg('University registered in PostgreSQL!');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this university from PostgreSQL?')) return;
    try {
      await api.deleteUniversity(id);
      setUniversities(universities.filter(u => u.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  const filtered = universities.filter(u => u.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
      
      {/* Header */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-emerald-400 font-semibold text-xs mb-1">
            <Building2 className="w-4 h-4" />
            <span>PostgreSQL Database Administration</span>
          </div>
          <h2 className="text-xl font-bold">Allowed Sri Lankan Universities Manager</h2>
          <p className="text-xs text-slate-300 mt-1">
            Register, edit, or remove Sri Lankan higher education institutions available for student registration.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Form (4/12) */}
        <div className="lg:col-span-4 bg-white border border-slate-200 rounded-2xl p-5 shadow-xs h-fit space-y-4">
          <h3 className="font-bold text-slate-900 text-sm">Register University</h3>

          {successMsg && (
            <div className="p-2.5 bg-emerald-50 text-emerald-800 text-xs rounded-lg font-semibold flex items-center">
              <CheckCircle2 className="w-4 h-4 mr-1.5 text-emerald-600" /> {successMsg}
            </div>
          )}

          <form onSubmit={handleAddSubmit} className="space-y-3 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Campus Name</label>
              <input
                type="text"
                required
                placeholder="e.g. SLIIT – Malabe Campus"
                value={newUni.name}
                onChange={e => setNewUni({ ...newUni, name: e.target.value })}
                className="w-full px-3.5 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Category</label>
              <select
                value={newUni.category}
                onChange={e => setNewUni({ ...newUni, category: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:outline-none bg-white"
              >
                <option value="UGC State">UGC State University</option>
                <option value="Defense & Gov">Defense & Government Academy</option>
                <option value="Non-State/Private">Major Non-State (Private)</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Code</label>
                <input
                  type="text"
                  placeholder="SLIIT"
                  value={newUni.code}
                  onChange={e => setNewUni({ ...newUni, code: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Domain</label>
                <input
                  type="text"
                  placeholder="sliit.lk"
                  value={newUni.domain}
                  onChange={e => setNewUni({ ...newUni, domain: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                />
              </div>
            </div>

            <button type="submit" className="w-full linkedin-btn-primary bg-emerald-600 hover:bg-emerald-700 py-2 text-xs flex items-center justify-center">
              <Plus className="w-4 h-4 mr-1" /> Add to PostgreSQL
            </button>
          </form>
        </div>

        {/* List (8/12) */}
        <div className="lg:col-span-8 bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="font-bold text-slate-900 text-sm">PostgreSQL University Records ({filtered.length})</h3>
            <div className="relative w-64">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-100 border border-slate-200 rounded-full"
              />
            </div>
          </div>

          <div className="space-y-2 overflow-y-auto max-h-[480px] pr-1">
            {filtered.map(uni => (
              <div key={uni.id} className="p-3 border border-slate-200 rounded-xl bg-slate-50 flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-xs text-slate-900">{uni.name}</h4>
                  <p className="text-[10px] text-slate-500 font-mono mt-0.5">{uni.category} • {uni.domain || 'edu.lk'}</p>
                </div>
                <button onClick={() => handleDelete(uni.id)} className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

    </div>
  );
}
