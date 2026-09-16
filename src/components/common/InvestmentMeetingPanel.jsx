import React, { useEffect, useState } from 'react';
import { Calendar, Link as LinkIcon, Clock, CheckCircle2, MessageSquare, X, Edit3, Save } from 'lucide-react';
import { api } from '../../api/client';

// role: 'investor' | 'student'
export default function InvestmentMeetingPanel({ investment, currentUser, role, onRefresh }) {
  const [meetings, setMeetings] = useState([]);
  const [creating, setCreating] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [draft, setDraft] = useState({ date: '', time: '', link: '', message: '' });
  const [changeReq, setChangeReq] = useState({ id: null, text: '' });

  const load = async () => {
    try { setMeetings(await api.getInvestmentMeetings(investment.id)); }
    catch (e) { console.error(e); }
  };

  useEffect(() => { load(); }, [investment.id]);

  const proposeMeeting = async (e) => {
    e.preventDefault();
    setError('');
    if (!draft.date.trim() || !draft.time.trim()) return setError('Date and time are required.');
    setBusy(true);
    try {
      await api.createInvestmentMeeting(investment.id, {
        investorId: currentUser.id,
        studentId: investment.studentId || null,
        date: draft.date, time: draft.time, link: draft.link, message: draft.message
      });
      setDraft({ date: '', time: '', link: '', message: '' });
      setCreating(false);
      await load();
      onRefresh && onRefresh();
    } catch (err) { setError(err.message); }
    finally { setBusy(false); }
  };

  const acceptMeeting = async (meeting) => {
    try {
      await api.updateInvestmentMeeting(meeting.id, {
        actorId: currentUser.id, action: 'accept'
      });
      await load();
    } catch (e) { alert(e.message); }
  };

  const requestChange = async (meeting) => {
    if (!changeReq.text.trim()) return alert('Please describe the change you want.');
    try {
      await api.updateInvestmentMeeting(meeting.id, {
        actorId: currentUser.id, action: 'change_request', changeRequest: changeReq.text.trim()
      });
      setChangeReq({ id: null, text: '' });
      await load();
    } catch (e) { alert(e.message); }
  };

  const updateMeeting = async (meeting) => {
    try {
      await api.updateInvestmentMeeting(meeting.id, {
        actorId: currentUser.id, date: meeting.date, time: meeting.time,
        link: meeting.link, message: meeting.message
      });
      await load();
    } catch (e) { alert(e.message); }
  };

  const setMtg = (id, field, value) =>
    setMeetings(prev => prev.map(m => m.id === id ? { ...m, [field]: value } : m));

  return (
    <div className="mt-4 pt-3 border-t border-amber-200">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-xs font-bold text-amber-900 flex items-center">
          <Calendar className="w-3.5 h-3.5 mr-1.5" />Pitch Meetings ({meetings.length})
        </h4>
        {role === 'investor' && investment.status === 'Approved' && (
          <button onClick={() => setCreating(v => !v)}
            className="text-[10px] px-2.5 py-1 rounded-full bg-amber-600 text-white font-bold">
            {creating ? 'Cancel' : '+ Propose Meeting'}
          </button>
        )}
      </div>

      {role === 'investor' && investment.status !== 'Approved' && (
        <p className="text-[11px] text-amber-700 bg-amber-50 border border-amber-200 rounded p-2">
          Meetings unlock once an admin approves this investment.
        </p>
      )}

      {creating && (
        <form onSubmit={proposeMeeting} className="mb-3 p-3 bg-white border border-amber-200 rounded-lg space-y-2">
          {error && <div className="p-2 bg-red-50 border border-red-200 text-red-700 text-[11px] rounded">{error}</div>}
          <div className="grid grid-cols-2 gap-2">
            <input required type="date" value={draft.date} onChange={e => setDraft({ ...draft, date: e.target.value })}
              className="px-2 py-1.5 text-xs border rounded-lg" />
            <input required placeholder="Time (e.g. 2:00 PM)" value={draft.time} onChange={e => setDraft({ ...draft, time: e.target.value })}
              className="px-2 py-1.5 text-xs border rounded-lg" />
          </div>
          <input placeholder="Meeting link (Zoom / Google Meet)" value={draft.link} onChange={e => setDraft({ ...draft, link: e.target.value })}
            className="w-full px-2 py-1.5 text-xs border rounded-lg" />
          <textarea rows={2} placeholder="Message to student" value={draft.message} onChange={e => setDraft({ ...draft, message: e.target.value })}
            className="w-full px-2 py-1.5 text-xs border rounded-lg resize-none" />
          <button type="submit" disabled={busy}
            className="w-full bg-amber-600 text-white rounded-lg py-1.5 text-xs font-bold disabled:opacity-50">
            {busy ? 'Sending…' : 'Send Meeting Invitation'}
          </button>
        </form>
      )}

      <div className="space-y-2">
        {meetings.length === 0 && (
          <p className="text-[11px] text-amber-700/80 italic py-2">No meetings proposed yet.</p>
        )}
        {meetings.map(m => {
          const isInvestor = role === 'investor';
          const editable = isInvestor && m.status !== 'Accepted';
          return (
            <div key={m.id} className="p-3 bg-white border border-amber-200 rounded-lg text-xs">
              <div className="flex items-center justify-between mb-1.5">
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  m.status === 'Accepted' ? 'bg-emerald-100 text-emerald-800'
                  : m.status === 'Change requested' ? 'bg-red-100 text-red-800'
                  : 'bg-amber-100 text-amber-800'
                }`}>{m.status}</span>
                {editable && <button onClick={() => updateMeeting(m)} className="text-blue-600 text-[10px] font-bold flex items-center"><Save className="w-3 h-3 mr-1" />Save changes</button>}
              </div>

              {editable ? (
                <div className="grid grid-cols-2 gap-2 mb-2">
                  <input value={m.date || ''} onChange={e => setMtg(m.id, 'date', e.target.value)} className="px-2 py-1 text-xs border rounded" />
                  <input value={m.time || ''} onChange={e => setMtg(m.id, 'time', e.target.value)} className="px-2 py-1 text-xs border rounded" />
                  <input value={m.link || ''} onChange={e => setMtg(m.id, 'link', e.target.value)} placeholder="Meeting link" className="col-span-2 px-2 py-1 text-xs border rounded" />
                </div>
              ) : (
                <div className="space-y-1 mb-2">
                  <p className="flex items-center text-slate-700"><Calendar className="w-3 h-3 mr-1 text-slate-400" />{m.date} · {m.time}</p>
                  {m.link && <a href={m.link} target="_blank" rel="noreferrer" className="flex items-center text-blue-600 font-semibold"><LinkIcon className="w-3 h-3 mr-1" />Join meeting</a>}
                </div>
              )}

              {m.message && <p className="text-[11px] text-slate-600 italic flex items-start"><MessageSquare className="w-3 h-3 mr-1 mt-0.5 flex-shrink-0" />"{m.message}"</p>}
              {m.change_request && (
                <p className="mt-1 text-[11px] text-red-700 bg-red-50 border border-red-200 rounded px-2 py-1">
                  Student requested change: {m.change_request}
                </p>
              )}

              {role === 'student' && m.status !== 'Accepted' && (
                <div className="mt-2 flex items-center gap-2">
                  <button onClick={() => acceptMeeting(m)}
                    className="px-3 py-1 rounded-lg bg-emerald-600 text-white text-[10px] font-bold flex items-center">
                    <CheckCircle2 className="w-3 h-3 mr-1" />Accept
                  </button>
                  {changeReq.id === m.id ? (
                    <div className="flex-1 flex gap-1">
                      <input value={changeReq.text} onChange={e => setChangeReq({ ...changeReq, text: e.target.value })}
                        placeholder="Describe change…" className="flex-1 px-2 py-1 text-[11px] border rounded" />
                      <button onClick={() => requestChange(m)} className="px-2 py-1 bg-red-600 text-white text-[10px] font-bold rounded">Send</button>
                      <button onClick={() => setChangeReq({ id: null, text: '' })} className="px-2 py-1 text-slate-500 text-[10px]">Cancel</button>
                    </div>
                  ) : (
                    <button onClick={() => setChangeReq({ id: m.id, text: '' })}
                      className="px-3 py-1 rounded-lg border border-red-300 text-red-700 text-[10px] font-bold flex items-center">
                      <Edit3 className="w-3 h-3 mr-1" />Request Change
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}