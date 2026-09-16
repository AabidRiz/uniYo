import React, { useState, useEffect } from 'react';
import { ShieldCheck, CheckCircle2, XCircle } from 'lucide-react';
import { api } from '../../../api/client';

export default function AdminQueueView() {
  const [queue, setQueue] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getVerificationQueue().then(data => {
      setQueue(data);
      setLoading(false);
    }).catch(console.error);
  }, []);

  const handleApprove = async (id) => {
    try {
      await api.verifyStudent(id, 'approve');
      setQueue(queue.map(q => q.id === id ? { ...q, status: 'Approved' } : q));
    } catch (err) {
      console.error(err);
    }
  };

  const handleReject = async (id) => {
    try {
      await api.verifyStudent(id, 'reject');
      setQueue(queue.map(q => q.id === id ? { ...q, status: 'Rejected' } : q));
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
      
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
        <div className="flex items-center space-x-2 text-blue-600 font-semibold text-xs mb-1">
          <ShieldCheck className="w-4 h-4" />
          <span>PostgreSQL Student Verification Queue</span>
        </div>
        <h2 className="text-xl font-bold text-slate-900">Student ID Verification Queue</h2>
        <p className="text-xs text-slate-500 mt-1">
          Review student registration requests flagged by the Verification Agent for manual admin approval.
        </p>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
        {queue.length === 0 ? (
          <div className="text-center py-10 text-slate-400 text-xs">
            No verification requests currently pending in database queue.
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
                <p className="text-xs text-slate-500 italic mt-1">Flag: {item.flag_reason}</p>
              </div>

              <div className="flex items-center space-x-2">
                {item.status === 'Pending' ? (
                  <>
                    <button onClick={() => handleReject(item.id)} className="px-3.5 py-1.5 border border-red-300 text-red-700 rounded-lg text-xs font-semibold hover:bg-red-50">
                      Reject
                    </button>
                    <button onClick={() => handleApprove(item.id)} className="linkedin-btn-primary py-1.5 px-4 text-xs bg-emerald-600 hover:bg-emerald-700 flex items-center">
                      <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Approve Badge
                    </button>
                  </>
                ) : (
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${item.status === 'Approved' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>
                    {item.status}
                  </span>
                )}
              </div>
            </div>
          ))
        )}
      </div>

    </div>
  );
}
