import React, { useState, useEffect } from 'react';
import { MessageSquare, Send, Trash2, CheckCircle2, Clock, Edit3, Save } from 'lucide-react';
import { api } from '../../../api/client';

export default function ProfQuestionsView({ currentUser, onOpenUser }) {
  const [questions, setQuestions] = useState([]);
  const [drafts, setDrafts] = useState({});
  const [filter, setFilter] = useState('all');
  const [editingAnswer, setEditingAnswer] = useState(null);

  const load = async () => {
    try { setQuestions(await api.getProfessorQuestions(currentUser.id)); }
    catch (e) { console.error(e); }
  };

  useEffect(() => { load(); }, [currentUser.id]);

  const answer = async (qid) => {
    const text = (drafts[qid] || '').trim();
    if (!text) return;
    try {
      await api.answerProfessorQuestion(currentUser.id, qid, text);
      setDrafts({ ...drafts, [qid]: '' });
      await load();
    } catch (e) { alert(e.message); }
  };

  const del = async (qid) => {
    if (!window.confirm('Delete this question?')) return;
    try { await api.deleteProfessorQuestion(currentUser.id, qid); await load(); }
    catch (e) { alert(e.message); }
  };

  const updateAnswer = async (qid) => {
    const text = (drafts[qid] || '').trim();
    if (!text) return;
    try { await api.updateProfessorAnswer(currentUser.id, qid, text); setEditingAnswer(null); await load(); }
    catch (e) { alert(e.message); }
  };

  const deleteAnswer = async (qid) => {
    if (!window.confirm('Delete your answer?')) return;
    try { await api.deleteProfessorAnswer(currentUser.id, qid); await load(); }
    catch (e) { alert(e.message); }
  };

  const filtered = questions.filter(q => {
    if (filter === 'unanswered') return !q.answer;
    if (filter === 'answered') return !!q.answer;
    return true;
  });

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
        <div className="flex items-center space-x-2 text-amber-600 font-semibold text-xs mb-1">
          <MessageSquare className="w-4 h-4" /><span>Student Q&A Board</span>
        </div>
        <h2 className="text-xl font-bold text-slate-900">Questions from Students</h2>
        <p className="text-xs text-slate-500 mt-1">Answer publicly — all students who visit your profile will see your replies.</p>

        <div className="mt-4 flex items-center space-x-2 text-xs">
          {[
            { k: 'all', label: 'All' },
            { k: 'unanswered', label: `Unanswered (${questions.filter(q => !q.answer).length})` },
            { k: 'answered', label: 'Answered' }
          ].map(f => (
            <button key={f.k} onClick={() => setFilter(f.k)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold ${
                filter === f.k ? 'bg-[#0A66C2] text-white' : 'bg-slate-100 text-slate-600'
              }`}>{f.label}</button>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        {filtered.length === 0 ? (
          <div className="text-center py-12 text-xs text-slate-400">No questions in this filter.</div>
        ) : filtered.map(q => (
          <div key={q.id} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-3 flex-1">
                <img src={q.studentAvatar} alt="" className="w-10 h-10 rounded-full object-cover border" />
                <div className="flex-1">
                  <button onClick={() => q.studentId && onOpenUser(q.studentId)}
                    className="font-bold text-sm text-slate-900 hover:text-blue-600">{q.studentName}</button>
                  <p className="text-[11px] text-slate-400 mt-0.5">{new Date(q.createdAt).toLocaleString()}</p>
                  <p className="text-sm text-slate-800 mt-2 leading-relaxed">{q.question}</p>
                </div>
              </div>
              <button onClick={() => del(q.id)} className="text-red-400 hover:text-red-600 p-1.5 rounded">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            {q.answer ? (
              <div className="mt-3 pl-14">
                <div className="p-3 bg-emerald-50 border-l-4 border-emerald-400 rounded">
                  <div className="flex items-center space-x-1 text-[11px] font-bold text-emerald-800 mb-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Your Answer · {new Date(q.answeredAt).toLocaleString()}
                  </div>
                  {editingAnswer === q.id ? <textarea rows={3} value={drafts[q.id] || ''} onChange={e => setDrafts({ ...drafts, [q.id]: e.target.value })} className="w-full px-2 py-1 text-xs border rounded" /> : <p className="text-xs text-emerald-900 leading-relaxed">{q.answer}</p>}
                  <div className="mt-2 flex justify-end gap-2">
                    {editingAnswer === q.id ? <button onClick={() => updateAnswer(q.id)} className="text-blue-700 text-xs font-semibold flex items-center"><Save className="w-3 h-3 mr-1" />Save</button> : <button onClick={() => { setEditingAnswer(q.id); setDrafts({ ...drafts, [q.id]: q.answer }); }} className="text-blue-700 text-xs font-semibold flex items-center"><Edit3 className="w-3 h-3 mr-1" />Edit</button>}
                    <button onClick={() => deleteAnswer(q.id)} className="text-red-600 text-xs font-semibold flex items-center"><Trash2 className="w-3 h-3 mr-1" />Delete reply</button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="mt-3 pl-14">
                <div className="flex items-center space-x-1 text-[10px] font-semibold text-amber-600 mb-1">
                  <Clock className="w-3 h-3" /> Awaiting your answer
                </div>
                <textarea rows={3} value={drafts[q.id] || ''}
                  onChange={e => setDrafts({ ...drafts, [q.id]: e.target.value })}
                  placeholder="Write your answer…"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg" />
                <div className="flex justify-end mt-2">
                  <button onClick={() => answer(q.id)}
                    className="linkedin-btn-primary py-1.5 px-4 text-xs flex items-center">
                    <Send className="w-3.5 h-3.5 mr-1" /> Post Answer
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}