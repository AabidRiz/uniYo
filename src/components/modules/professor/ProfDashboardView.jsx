import React, { useEffect, useState } from 'react';
import { GraduationCap, Calendar, Clock, Video, Users, Star, ArrowUpRight } from 'lucide-react';
import Badge from '../../common/Badge';
import { api } from '../../../api/client';

export default function ProfDashboardView({ currentUser, onNavigate }) {
  const [sessions, setSessions] = useState([]);
  const [videos, setVideos] = useState([]);
  const [reviews, setReviews] = useState({ avgRating: 0, count: 0 });

  useEffect(() => {
    let mounted = true;
    Promise.all([
      api.getSessions({ profId: currentUser.id }),
      api.getProfessorVideos(currentUser.id),
      api.getProfessorReviews(currentUser.id)
    ]).then(([sessionData, videoData, reviewData]) => {
      if (!mounted) return;
      setSessions(sessionData);
      setVideos(videoData);
      setReviews(reviewData);
    }).catch(err => console.error('Failed to load professor dashboard data:', err));
    return () => { mounted = false; };
  }, [currentUser.id]);

  const totalViews = videos.reduce((sum, video) => sum + (Number(video.views) || 0), 0);
  const ratedSessions = sessions.filter(session => session.rating);
  const rating = reviews.count > 0
    ? reviews.avgRating
    : (ratedSessions.length
      ? (ratedSessions.reduce((sum, session) => sum + session.rating, 0) / ratedSessions.length).toFixed(1)
      : '—');

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      
      {/* Professor Hero Card */}
      <div className="bg-gradient-to-r from-indigo-900 to-blue-900 text-white rounded-2xl p-6 shadow-lg flex flex-col md:flex-row md:items-center justify-between">
        <div className="flex items-center space-x-4">
          <img
            src={currentUser?.avatar}
            alt={currentUser?.name}
            className="w-16 h-16 rounded-full border-2 border-indigo-300 object-cover shadow-md"
          />
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-xl font-bold">{currentUser?.name}</h2>
              <Badge type="verified" />
            </div>
            <p className="text-xs text-indigo-200">{currentUser?.title} • {currentUser?.university}</p>
            <p className="text-xs text-indigo-300 mt-1 italic">"{currentUser?.bio}"</p>
          </div>
        </div>

        <div className="mt-4 md:mt-0 flex items-center space-x-3 text-xs font-semibold">
          <button
            onClick={() => onNavigate('prof_calendar')}
            className="px-4 py-2 bg-white text-indigo-900 rounded-full font-bold hover:bg-indigo-50 transition-all"
          >
            Manage Calendar Slots
          </button>
        </div>
      </div>

      {/* Stats Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-xs">
          <span className="text-xs font-semibold text-slate-500 block">Total Consultation Sessions</span>
          <span className="text-2xl font-black text-indigo-600 font-mono mt-1 block">{sessions.length}</span>
          <span className="text-[10px] text-slate-400 font-semibold mt-1 inline-block">From your sessions</span>
        </div>

        <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-xs">
          <span className="text-xs font-semibold text-slate-500 block">Faculty Review Rating</span>
          <div className="flex items-center space-x-1 mt-1">
            <span className="text-2xl font-black text-amber-500 font-mono">{rating}</span>
            <Star className="w-5 h-5 fill-amber-400 text-amber-500" />
          </div>
          <span className="text-[10px] text-slate-400 mt-1 block">From {reviews.count} student reviews</span>
        </div>

        <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-xs">
          <span className="text-xs font-semibold text-slate-500 block">Published Video Courses</span>
          <span className="text-2xl font-black text-blue-600 font-mono mt-1 block">{videos.length}</span>
          <span className="text-[10px] text-blue-600 font-semibold mt-1 inline-block">{totalViews.toLocaleString()} student views</span>
        </div>

        <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-xs">
          <span className="text-xs font-semibold text-slate-500 block">Consultation Mode</span>
          <span className="text-sm font-bold text-slate-900 mt-2 block">{currentUser?.consultationType === 'both' ? 'Volunteer & Paid' : 'Volunteer'}</span>
          <span className="text-[10px] text-slate-400 mt-1 block">{currentUser?.hourlyRate}</span>
        </div>
      </div>

      {/* Quick Navigation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <button
          onClick={() => onNavigate('prof_calendar')}
          className="bg-white border border-slate-200 p-6 rounded-xl shadow-xs card-hover text-left space-y-2 group"
        >
          <Calendar className="w-8 h-8 text-indigo-600 group-hover:scale-110 transition-transform" />
          <h3 className="font-bold text-sm text-slate-900">Office Hours & Calendar</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Configure weekly availability, confirm Q&A sessions, and edit consultation topics.
          </p>
        </button>

        <button
          onClick={() => onNavigate('prof_courses')}
          className="bg-white border border-slate-200 p-6 rounded-xl shadow-xs card-hover text-left space-y-2 group"
        >
          <Video className="w-8 h-8 text-blue-600 group-hover:scale-110 transition-transform" />
          <h3 className="font-bold text-sm text-slate-900">Teaching Videos & Mini-Courses</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Publish educational lecture modules and thesis advisement video content for students.
          </p>
        </button>

        <button
          onClick={() => onNavigate('prof_impressions')}
          className="bg-white border border-slate-200 p-6 rounded-xl shadow-xs card-hover text-left space-y-2 group"
        >
          <Users className="w-8 h-8 text-amber-500 group-hover:scale-110 transition-transform" />
          <h3 className="font-bold text-sm text-slate-900">Student Impressions & Ratings</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Review student feedback ratings, thesis comments, and advisory survey analytics.
          </p>
        </button>
      </div>

    </div>
  );
}
