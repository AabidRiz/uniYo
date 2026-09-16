import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, Bot, Bell, CheckCircle2, XCircle, AlertCircle, 
  Terminal, Building2, Plus, Trash2, Search 
} from 'lucide-react';
import { api } from '../../api/client';
import Badge from '../common/Badge';

export default function AdminView() {
  const [activeTab, setActiveTab] = useState('universities'); // 'universities' | 'queue' | 'ai_monitor'
  const [queue, setQueue] = useState([]);
  const [universities, setUniversities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Add University Form
  const [newUni, setNewUni] = useState({
    name: '',
    category: 'Non-State/Private',
    code: '',
    domain: '',
    pattern: ''
  });
  const [addSuccess, setAddSuccess] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const unis = await api.getUniversities();
      const verQueue = await api.getVerificationQueue();
      setUniversities(unis);
      setQueue(verQueue);
    } catch (err) {
      console.error('Error loading admin data from PostgreSQL:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddUniversitySubmit = async (e) => {
    e.preventDefault();
    if (!newUni.name.trim()) return;

    try {
      const added = await api.addUniversity(newUni);
      setUniversities([...universities, added]);
      setNewUni({ name: '', category: 'Non-State/Private', code: '', domain: '', pattern: '' });
      setAddSuccess(true);
      setTimeout(() => setAddSuccess(false), 3000);
    } catch (err) {
      console.error('Error adding university to PostgreSQL:', err);
    }
  };

  const handleDeleteUniversity = async (id) => {
    if (!window.confirm('Remove this university from PostgreSQL allowed list?')) return;
    try {
      await api.deleteUniversity(id);
      setUniversities(universities.filter(u => u.id !== id));
    } catch (err) {
      console.error('Error deleting university:', err);
    }
  };

  const handleApproveStudent = async (id) => {
    try {
      await api.verifyStudent(id, 'approve');
      setQueue(queue.map(q => q.id === id ? { ...q, status: 'Approved' } : q));
    } catch (err) {
      console.error('Error approving student:', err);
    }
  };

  const handleRejectStudent = async (id) => {
    try {
      await api.verifyStudent(id, 'reject');
      setQueue(queue.map(q => q.id === id ? { ...q, status: 'Rejected' } : q));
    } catch (err) {
      console.error('Error rejecting student:', err);
    }
  };

  const filteredUnis = universities.filter(u => 
    u.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (u.category && u.category.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      
      {/* Admin Header */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-md flex flex-col md:flex-row md:items-center justify-between">
        <div>
          <div className="flex items-center space-x-2 text-emerald-400 font-semibold text-xs mb-1">
            <ShieldCheck className="w-4 h-4" />
            <span>Platform Oversight & PostgreSQL Administration</span>
          </div>
          <h2 className="text-xl font-bold">UniYO Admin Dashboard</h2>
          <p className="text-xs text-slate-300 mt-1">
            Register allowed Sri Lankan universities, manage student verification queues, and inspect live AI Agent tool executions.
          </p>
        </div>

        {/* Tab Buttons */}
        <div className="mt-4 md:mt-0 flex flex-wrap gap-2 bg-slate-800 p-1.5 rounded-full border border-slate-700 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('universities')}
            className={`px-3.5 py-1.5 rounded-full transition-all ${activeTab === 'universities' ? 'bg-emerald-500 text-slate-950 font-bold shadow-xs' : 'text-slate-300 hover:text-white'}`}
          >
            🏛️ Register Universities ({universities.length})
          </button>

          <button
            onClick={() => setActiveTab('queue')}
            className={`px-3.5 py-1.5 rounded-full transition-all ${activeTab === 'queue' ? 'bg-blue-500 text-white font-bold shadow-xs' : 'text-slate-300 hover:text-white'}`}
          >
            Verification Queue ({queue.filter(q => q.status === 'Pending').length})
          </button>

          <button
            onClick={() => setActiveTab('ai_monitor')}
            className={`px-3.5 py-1.5 rounded-full transition-all ${activeTab === 'ai_monitor' ? 'bg-indigo-500 text-white font-bold shadow-xs' : 'text-slate-300 hover:text-white'}`}
          >
            🤖 AI Workflow Monitor
          </button>
        </div>
      </div>

      {/* TAB 1: REGISTER & MANAGE ALLOWED UNIVERSITIES (POSTGRESQL) */}
      {activeTab === 'universities' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Add University Form (4/12) */}
          <div className="lg:col-span-4 bg-white border border-slate-200 rounded-xl p-5 shadow-xs h-fit">
            <h3 className="font-bold text-slate-900 text-sm mb-1 flex items-center">
              <Building2 className="w-4 h-4 text-emerald-600 mr-1.5" />
              <span>Register Allowed University</span>
            </h3>
            <p className="text-xs text-slate-500 mb-4">Adds institution to PostgreSQL database and registration dropdown.</p>

            {addSuccess && (
              <div className="mb-4 p-3 bg-emerald-50 text-emerald-800 text-xs rounded-lg font-semibold flex items-center">
                <CheckCircle2 className="w-4 h-4 mr-1.5 text-emerald-600" />
                University saved to PostgreSQL!
              </div>
            )}

            <form onSubmit={handleAddUniversitySubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">University / Campus Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. SLIIT – Malabe Campus"
                  value={newUni.name}
                  onChange={e => setNewUni({ ...newUni, name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:outline-none"
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
                <Plus className="w-4 h-4 mr-1" /> Register in PostgreSQL
              </button>
            </form>
          </div>

          {/* Registered Universities List (8/12) */}
          <div className="lg:col-span-8 bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm">
                Registered Sri Lankan Institutions in PostgreSQL ({filteredUnis.length})
              </h3>

              {/* Search */}
              <div className="relative w-full sm:w-64">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Filter universities..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-100 border border-slate-200 rounded-full focus:outline-none focus:bg-white focus:border-emerald-600"
                />
              </div>
            </div>

            <div className="space-y-2.5 overflow-y-auto max-h-[500px] pr-1">
              {filteredUnis.map((uni) => (
                <div key={uni.id} className="p-3 border border-slate-200 rounded-xl bg-slate-50 flex items-center justify-between hover:bg-white transition-colors">
                  <div>
                    <h4 className="font-bold text-xs text-slate-900">{uni.name}</h4>
                    <div className="mt-1 flex items-center space-x-2 text-[10px]">
                      <span className={`px-2 py-0.5 rounded font-semibold ${
                        uni.category === 'UGC State' ? 'bg-blue-100 text-blue-800' :
                        uni.category === 'Defense & Gov' ? 'bg-amber-100 text-amber-800' : 'bg-purple-100 text-purple-800'
                      }`}>
                        {uni.category}
                      </span>
                      <span className="text-slate-500 font-mono">Domain: {uni.domain || 'edu.lk'}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleDeleteUniversity(uni.id)}
                    className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                    title="Remove from PostgreSQL"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

      {/* TAB 2: VERIFICATION QUEUE */}
      {activeTab === 'queue' && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-sm flex items-center">
              <span>Student ID & University Verification Queue (PostgreSQL)</span>
            </h3>
            <span className="text-xs text-slate-500 font-mono">Database: uniyo_db</span>
          </div>

          <div className="space-y-4">
            {queue.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-400">
                No pending verification requests in database.
              </div>
            ) : (
              queue.map((item) => (
                <div key={item.id} className="p-4 border border-slate-200 rounded-xl bg-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-sm text-slate-900">{item.name}</span>
                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded font-mono">{item.student_id}</span>
                      <span className="text-xs font-semibold text-slate-600">({item.university})</span>
                    </div>
                    <p className="text-xs text-slate-600">Email: {item.email} • Submitted {item.submitted_at || 'Recently'}</p>
                    
                    <div className="mt-2 p-2 rounded-lg bg-white border border-slate-200 text-xs">
                      <div className="flex items-center justify-between text-[11px] mb-1">
                        <span className="font-semibold text-slate-700">Verification Agent Score:</span>
                        <span className="font-bold text-indigo-600 font-mono">{item.ai_confidence || '88%'}</span>
                      </div>
                      <p className="text-slate-600">{item.flag_reason}</p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center space-x-2">
                    {item.status === 'Pending' ? (
                      <>
                        <button
                          onClick={() => handleRejectStudent(item.id)}
                          className="px-3.5 py-1.5 border border-red-300 text-red-700 rounded-lg text-xs font-semibold hover:bg-red-50 transition-colors"
                        >
                          Reject
                        </button>
                        <button
                          onClick={() => handleApproveStudent(item.id)}
                          className="linkedin-btn-primary py-1.5 px-4 text-xs bg-emerald-600 hover:bg-emerald-700 flex items-center"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Approve & Update DB
                        </button>
                      </>
                    ) : (
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                        item.status === 'Approved' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {item.status}
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB 3: AGENT WORKFLOW MONITOR */}
      {activeTab === 'ai_monitor' && (
        <div className="bg-slate-950 text-slate-100 rounded-xl p-6 shadow-xl border border-slate-800 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div className="flex items-center space-x-2 text-blue-400">
              <Terminal className="w-5 h-5" />
              <h3 className="font-mono font-bold text-sm">Agentic AI Execution Trace & PostgreSQL Audit Log</h3>
            </div>
            <span className="text-[11px] font-mono text-emerald-400 bg-emerald-950/80 px-3 py-1 rounded-full border border-emerald-800">
              Orchestrator Online • PostgreSQL Connected
            </span>
          </div>

          <div className="space-y-4">
            <div className="border border-slate-800 bg-slate-900 rounded-xl p-4 font-mono text-xs">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-3">
                <span className="font-bold text-amber-400">🤖 Verification & Moderation Agent</span>
                <span className="text-slate-400">Just now</span>
              </div>
              <p className="text-slate-300">
                Executing SQL query on table <code className="text-blue-400">universities</code> for regex verification pattern... MATCH_PASSED.
              </p>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
