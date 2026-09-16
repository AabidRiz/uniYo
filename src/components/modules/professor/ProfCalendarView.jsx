import React, { useState, useEffect } from 'react';
import { Calendar, Clock, CheckCircle2, Trash2, Plus, X } from 'lucide-react';
import { api } from '../../../api/client';

export default function ProfCalendarView({ currentUser }) {
  const [sessions, setSessions] = useState([]);
  const [availability, setAvailability] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAvailability, setShowAvailability] = useState(false);
  const [slot, setSlot] = useState({ day: 'Monday', time: '' });
  const [savingSlot, setSavingSlot] = useState(false);

  useEffect(() => {
    loadSessions();
    loadAvailability();
  }, [currentUser.id]);

  const loadSessions = async () => {
    try {
        const data = await api.getSessions({ profId: currentUser.id });
      setSessions(data);
    } catch (err) {
      console.error('Error loading sessions:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadAvailability = async () => {
    try {
      setAvailability(await api.getAvailability(currentUser.id));
    } catch (err) {
      console.error('Error loading availability:', err);
    }
  };

  const addSlot = async (event) => {
    event.preventDefault();
    if (!slot.time.trim()) return;
    setSavingSlot(true);
    try {
      await api.addAvailability(currentUser.id, {
        day: slot.day,
        time: slot.time.trim()
      });
      setSlot({ day: 'Monday', time: '' });
      await loadAvailability();
    } catch (err) {
      alert(err.message);
    } finally {
      setSavingSlot(false);
    }
  };

  const removeSlot = async (id) => {
    try {
      await api.deleteAvailability(currentUser.id, id);
      setAvailability(prev => prev.filter(item => item.id !== id));
    } catch (err) {
      alert(err.message);
    }
  };

  const handleCancelSession = async (id) => {
    if (!window.confirm('Cancel and delete this session booking from PostgreSQL?')) return;
    try {
      await api.deleteSession(id);
      setSessions(sessions.filter(s => s.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-6 font-sans">
      
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-indigo-600 font-semibold text-xs mb-1">
            <Calendar className="w-4 h-4" />
            <span>Dedicated Office Hours & Consultation Scheduler</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900">Faculty Session Calendar</h2>
          <p className="text-xs text-slate-500 mt-1">
            View booked student consultation slots, edit consultation topics, and cancel sessions.
          </p>
        </div>

        <button onClick={() => setShowAvailability(true)} className="linkedin-btn-primary py-2 px-4 text-xs flex items-center bg-indigo-600 hover:bg-indigo-700">
          <Plus className="w-4 h-4 mr-1.5" /> Configure Availability Slots
        </button>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
        <h3 className="font-bold text-slate-900 text-sm flex items-center mb-3">
          <Calendar className="w-4 h-4 text-indigo-600 mr-2" /> Public Availability
        </h3>
        {availability.length === 0 ? (
          <p className="text-xs text-slate-400">No availability slots configured yet.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {availability.map(item => (
              <div key={item.id} className="flex items-center gap-2 px-3 py-2 bg-indigo-50 border border-indigo-100 rounded-lg text-xs">
                <span className="font-semibold text-indigo-900">{item.day}</span>
                <span className="text-slate-600">{item.time}</span>
                <button onClick={() => removeSlot(item.id)} className="text-red-500 hover:text-red-700" title="Remove availability">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Booked Sessions Table / List */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4">
        <h3 className="font-bold text-slate-900 text-sm flex items-center">
          <Clock className="w-4 h-4 text-indigo-600 mr-2" />
          <span>Active Booked Consultation Slots ({sessions.length})</span>
        </h3>

        {sessions.length === 0 ? (
          <div className="text-center py-10 text-slate-400 text-xs">
            No student office hour sessions currently booked in database.
          </div>
        ) : (
          <div className="space-y-3">
            {sessions.map((s) => (
              <div key={s.id} className="p-4 border border-indigo-100 bg-indigo-50/40 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-xs text-slate-900">{s.studentName}</span>
                    <span className="text-[10px] bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded font-semibold">{s.type}</span>
                    <span className="text-xs font-semibold text-slate-500">({s.university})</span>
                  </div>
                  <p className="text-xs text-slate-700 mt-1">Topic: <span className="italic font-medium">{s.topic}</span></p>
                  <p className="text-[11px] text-slate-400 mt-0.5">📅 Date: {s.date} • Time: {s.time}</p>
                </div>

                <div className="flex items-center space-x-2">
                  <span className="px-3 py-1 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-full flex items-center">
                    <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> {s.status}
                  </span>
                  <button
                    onClick={() => handleCancelSession(s.id)}
                    className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                    title="Cancel Session"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showAvailability && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-900">Configure Availability</h3>
              <button onClick={() => setShowAvailability(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={addSlot} className="space-y-3">
              <label className="block text-xs font-semibold text-slate-700">
                Day
                <select value={slot.day} onChange={e => setSlot({ ...slot, day: e.target.value })} className="mt-1 w-full border border-slate-300 rounded-lg px-3 py-2 text-xs">
                  {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => <option key={day}>{day}</option>)}
                </select>
              </label>
              <label className="block text-xs font-semibold text-slate-700">
                Time range
                <input required value={slot.time} onChange={e => setSlot({ ...slot, time: e.target.value })} placeholder="10:00 AM - 11:00 AM" className="mt-1 w-full border border-slate-300 rounded-lg px-3 py-2 text-xs" />
              </label>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowAvailability(false)} className="px-4 py-2 text-xs font-semibold text-slate-600">Cancel</button>
                <button type="submit" disabled={savingSlot} className="linkedin-btn-primary px-4 py-2 text-xs disabled:opacity-50">
                  {savingSlot ? 'Saving...' : 'Add slot'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
