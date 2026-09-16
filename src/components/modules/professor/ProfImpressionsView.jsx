import React, { useState, useEffect } from 'react';
import { Award, Star, Users, MessageSquare } from 'lucide-react';
import { api } from '../../../api/client';

export default function ProfImpressionsView({ currentUser }) {
  const [sessions, setSessions] = useState([]);
  const [videos, setVideos] = useState([]);
  const [professorReviews, setProfessorReviews] = useState({ reviews: [], avgRating: 0, count: 0 });
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const [s, v, r] = await Promise.all([
        api.getSessions({ profId: currentUser.id }),
        api.getProfessorVideos(currentUser.id),
        api.getProfessorReviews(currentUser.id)
      ]);
      setSessions(s);
      setVideos(v);
      setProfessorReviews(r);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [currentUser.id]);

  const ratedSessions = sessions.filter(s => s.rating);
  const avgSessionRating = ratedSessions.length
    ? (ratedSessions.reduce((sum, s) => sum + s.rating, 0) / ratedSessions.length).toFixed(2)
    : '—';

  const allImpressions = videos.flatMap(v =>
    (v.impressions || []).map(i => ({ ...i, videoTitle: v.title }))
  );
  const avgVideoRating = allImpressions.filter(i => i.rating).length
    ? (allImpressions.filter(i => i.rating).reduce((s, i) => s + i.rating, 0) / allImpressions.filter(i => i.rating).length).toFixed(2)
    : '—';

  const totalImpressions = ratedSessions.length + allImpressions.length + professorReviews.count;

  const complain = async (targetType, targetId) => {
    const reason = window.prompt('Why should admin review this content?');
    if (!reason?.trim()) return;
    try {
      await api.submitComplaint({ reporterId: currentUser.id, targetType, targetId, reason });
      alert('Complaint sent to admin for review.');
    } catch (e) { alert(e.message); }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
        <div className="flex items-center space-x-2 text-amber-600 font-semibold text-xs mb-1">
          <Award className="w-4 h-4" /><span>Faculty Feedback Analytics</span>
        </div>
        <h2 className="text-xl font-bold text-slate-900">Student Impressions & Ratings</h2>
        <p className="text-xs text-slate-500 mt-1">Real feedback from completed sessions and video impressions.</p>
      </div>

      {loading ? (
        <div className="text-center py-10 text-slate-400 text-xs">Loading…</div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <StatCard label="Professor Rating" value={professorReviews.count ? professorReviews.avgRating.toFixed(2) : '—'} hint={`${professorReviews.count} general review${professorReviews.count === 1 ? '' : 's'}`} />
            <StatCard label="Video Rating" value={avgVideoRating} hint={`${allImpressions.length} impression${allImpressions.length === 1 ? '' : 's'}`} />
            <StatCard label="Total Reviews" value={totalImpressions} hint="Professor + Sessions + Videos" />
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
            <h3 className="font-bold text-slate-900 text-sm mb-3 flex items-center">
              <Star className="w-4 h-4 text-amber-500 fill-amber-400 mr-2" />Professor Reviews
            </h3>
            {professorReviews.reviews.filter(review => !review.sessionId).length === 0 ? (
              <p className="text-xs text-slate-400 py-4">No student professor reviews yet.</p>
            ) : (
              <div className="space-y-2">
                {professorReviews.reviews.filter(review => !review.sessionId).map(review => (
                  <div key={review.id} className="p-3 border border-slate-200 rounded-lg bg-slate-50">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-slate-900">{review.studentName}</span>
                      <span className="text-amber-600 text-xs">{'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}</span>
                    </div>
                    <p className="text-xs text-slate-700 italic mt-1">"{review.comment}"</p>
                    <button onClick={() => complain('professor_review', review.id)} className="mt-2 text-[10px] text-red-600 font-semibold">Report to admin</button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
            <h3 className="font-bold text-slate-900 text-sm mb-3 flex items-center">
              <Users className="w-4 h-4 text-indigo-600 mr-2" />Session Reviews
            </h3>
            {ratedSessions.length === 0 ? (
              <p className="text-xs text-slate-400 py-4">No session ratings yet.</p>
            ) : (
              <div className="space-y-2">
                {ratedSessions.map(s => (
                  <div key={s.id} className="p-3 border border-slate-200 rounded-lg bg-slate-50">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-slate-900">{s.studentName}</span>
                      <div className="flex items-center text-amber-500 text-xs font-bold">
                        <Star className="w-3.5 h-3.5 fill-amber-400 mr-0.5" />{s.rating}.0
                      </div>
                    </div>
                    {s.ratingComment && <p className="text-xs text-slate-700 italic mt-1">"{s.ratingComment}"</p>}
                    <p className="text-[10px] text-slate-400 mt-1">{s.topic} · {s.date}</p>
                    {s.rating && <button onClick={() => complain('session_review', s.id)} className="mt-2 text-[10px] text-red-600 font-semibold">Report to admin</button>}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
            <h3 className="font-bold text-slate-900 text-sm mb-3 flex items-center">
              <MessageSquare className="w-4 h-4 text-blue-600 mr-2" />Video Impressions
            </h3>
            {allImpressions.length === 0 ? (
              <p className="text-xs text-slate-400 py-4">No video feedback yet.</p>
            ) : (
              <div className="space-y-2">
                {allImpressions.map(i => (
                  <div key={i.id} className="p-3 border border-slate-200 rounded-lg bg-slate-50">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-slate-900">{i.studentName}</span>
                      {i.rating && (
                        <div className="flex items-center text-amber-500 text-xs font-bold">
                          <Star className="w-3.5 h-3.5 fill-amber-400 mr-0.5" />{i.rating}.0
                        </div>
                      )}
                    </div>
                    <p className="text-[10px] text-slate-500 mt-0.5">on "{i.videoTitle}"</p>
                    {i.comment && <p className="text-xs text-slate-700 italic mt-1">"{i.comment}"</p>}
                    {i.comment && <button onClick={() => complain('video_review', i.id)} className="mt-2 text-[10px] text-red-600 font-semibold">Report to admin</button>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function StatCard({ label, value, hint }) {
  return (
    <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-xs text-center">
      <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{label}</span>
      <div className="flex items-center justify-center space-x-2 mt-2">
        <span className="text-4xl font-black text-amber-500 font-mono">{value}</span>
        {value !== '—' && <Star className="w-6 h-6 fill-amber-400 text-amber-500" />}
      </div>
      <span className="text-xs text-slate-400 mt-1 block">{hint}</span>
    </div>
  );
}