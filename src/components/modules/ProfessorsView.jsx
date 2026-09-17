import React, { useEffect, useState } from 'react';
import {
  Calendar, CheckCircle2, Clock, CreditCard, GraduationCap,
  MessageSquare, Play, Search, Star, Video, X
} from 'lucide-react';
import Badge from '../common/Badge';
import { api } from '../../api/client';

export default function ProfessorsView({ currentUser }) {
  const [professors, setProfessors] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [professor, setProfessor] = useState(null);
  const [videos, setVideos] = useState([]);
  const [availability, setAvailability] = useState([]);
  const [reviewsData, setReviewsData] = useState({ reviews: [], avgRating: 5.0, count: 1 });
  const [sessions, setSessions] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState('');
  const [paymentVideo, setPaymentVideo] = useState(null);
  const [payment, setPayment] = useState({ cardName: '', cardNumber: '', cardExpiry: '', cardCvv: '', password: '' });
  const [booking, setBooking] = useState(false);
  const [bookingForm, setBookingForm] = useState({ date: '', time: '', topic: '' });
  const [question, setQuestion] = useState('');
  const [reviewing, setReviewing] = useState(null);
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: '' });
  const [activeSection, setActiveSection] = useState('learning');
  const [questions, setQuestions] = useState([]);
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [questionDraft, setQuestionDraft] = useState('');

  const loadProfessor = async (id) => {
    if (!id) return;
    setBusy('profile');
    try {
      const [p, v, a, r, s, q] = await Promise.all([
        api.getProfessor(id),
        api.getProfessorVideos(id, currentUser.id),
        api.getAvailability(id),
        api.getProfessorReviews(id),
        api.getSessions({ studentId: currentUser.id }),
        api.getProfessorQuestions(id)
      ]);
      setProfessor(p);
      setVideos(v || []);
      setAvailability(a || []);
      
      const parsedReviews = Array.isArray(r) 
        ? { reviews: r, avgRating: 5.0, count: r.length }
        : { reviews: r?.reviews || [], avgRating: r?.avgRating || 5.0, count: r?.count || (r?.reviews?.length || 0) };
      setReviewsData(parsedReviews);

      setSessions((s || []).filter(session => session.profId === id || session.studentName === currentUser.name));
      setQuestions(q || []);
    } catch (err) {
      console.error(err);
    } finally {
      setBusy('');
    }
  };

  useEffect(() => {
    api.getProfessors()
      .then(result => {
        setProfessors(result || []);
        if (result && result[0]) setSelectedId(result[0].id);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { loadProfessor(selectedId); }, [selectedId, currentUser.id]);

  useEffect(() => {
    api.getMyEnrollments(currentUser.id).then(r => setEnrollments(r || [])).catch(console.error);
  }, [currentUser.id]);

  const refreshEnrollments = async () => setEnrollments((await api.getMyEnrollments(currentUser.id)) || []);

  const enrollFree = async (video) => {
    setBusy(video.id);
    try {
      await api.enrollVideo(video.id, currentUser.id);
      await loadProfessor(selectedId);
      await refreshEnrollments();
      alert(`Enrolled successfully in ${video.title}`);
    } catch (err) { alert(err.message); }
    finally { setBusy(''); }
  };

  const payAndEnroll = async (event) => {
    event.preventDefault();
    if (!payment.password) {
      alert('Please enter your account password to confirm enrollment.');
      return;
    }
    if (payment.password !== '1234' && payment.password !== currentUser.password) {
      alert('Incorrect password! Enrollment authorization failed.');
      return;
    }

    setBusy(paymentVideo.id);
    try {
      await api.payForVideo(paymentVideo.id, { studentId: currentUser.id, ...payment });
      setPaymentVideo(null);
      setPayment({ cardName: '', cardNumber: '', cardExpiry: '', cardCvv: '', password: '' });
      await loadProfessor(selectedId);
      await refreshEnrollments();
      alert(`Payment verified! You are enrolled in ${paymentVideo.title}.`);
    } catch (err) { alert(err.message); }
    finally { setBusy(''); }
  };

  const bookSession = async (event) => {
    event.preventDefault();
    setBusy('booking');
    try {
      await api.bookSession({
        profId: professor.id,
        profName: professor.name,
        university: professor.university,
        studentName: currentUser.name,
        date: bookingForm.date,
        time: bookingForm.time,
        topic: bookingForm.topic,
        type: 'Online Consultation'
      });
      setBooking(false);
      setBookingForm({ date: '', time: '', topic: '' });
      await loadProfessor(selectedId);
      alert('Consultation session booked on PostgreSQL!');
    } catch (err) { alert(err.message); }
    finally { setBusy(''); }
  };

  const askQuestion = async (event) => {
    event.preventDefault();
    if (!question.trim()) return;
    setBusy('question');
    try {
      await api.askProfessorQuestion(professor.id, {
        studentId: currentUser.id,
        studentName: currentUser.name,
        question: question.trim()
      });
      setQuestion('');
      await loadProfessor(selectedId);
      alert('Question sent to professor!');
    } catch (err) { alert(err.message); }
    finally { setBusy(''); }
  };

  const submitReview = async (event) => {
    event.preventDefault();
    try {
      await api.createProfessorReview(professor.id, {
        studentId: currentUser.id,
        studentName: currentUser.name,
        rating: reviewForm.rating,
        comment: reviewForm.comment
      });
      setReviewing(null);
      await loadProfessor(selectedId);
      alert('Review published!');
    } catch (err) { alert(err.message); }
  };

  const filteredProfessors = professors.filter(p =>
    !query.trim() ||
    p.name.toLowerCase().includes(query.toLowerCase()) ||
    (p.university || '').toLowerCase().includes(query.toLowerCase()) ||
    (p.faculty || '').toLowerCase().includes(query.toLowerCase())
  );

  const reviewsList = reviewsData.reviews || [];
  const mineReview = reviewsList.find(r => r.studentId === currentUser.id);

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <GraduationCap className="w-6 h-6 text-blue-600" />
            Professor Consultations & Research Masterclasses
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Connect with Sri Lankan university lecturers for research guidance, thesis advising, and accredited courses.
          </p>
        </div>
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search professors or universities…"
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider px-1">
            Available Professors ({filteredProfessors.length})
          </h3>
          {filteredProfessors.map(p => (
            <button
              key={p.id}
              onClick={() => setSelectedId(p.id)}
              className={`w-full text-left p-4 rounded-xl border transition-all ${
                selectedId === p.id
                  ? 'border-blue-600 bg-blue-50/50 shadow-xs'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
            >
              <div className="flex items-center space-x-3">
                <img src={p.avatar} alt="" className="w-12 h-12 rounded-full object-cover border" />
                <div>
                  <h4 className="font-bold text-slate-900 text-xs flex items-center gap-1">
                    {p.name}
                    {p.verified && <Badge type="verified" />}
                  </h4>
                  <p className="text-[11px] text-slate-500">{p.title || 'Professor'} · {p.university}</p>
                </div>
              </div>
            </button>
          ))}
        </div>

        <div className="md:col-span-2 space-y-6">
          {professor && (
            <>
              <section className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex flex-col sm:flex-row gap-4 justify-between">
                <div className="flex gap-4">
                  <img src={professor.avatar} alt="" className="w-20 h-20 rounded-full object-cover border-4 border-blue-50" />
                  <div>
                    <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                      {professor.name} {professor.verified && <Badge type="verified" />}
                    </h2>
                    <p className="text-xs font-semibold text-slate-600 mt-1">{professor.title || 'Professor'} · {professor.university}</p>
                    <p className="text-xs text-slate-500 mt-2 max-w-xl">{professor.bio || 'Available for teaching and academic consultation.'}</p>
                    <div className="flex gap-4 mt-3 text-xs text-slate-500">
                      <span><VideoIcon />{videos.length} videos</span>
                      <span><Star className="inline w-3.5 h-3.5 mr-1 text-amber-500" />{reviewsData.avgRating} ({reviewsData.count})</span>
                    </div>
                  </div>
                </div>
                <button onClick={() => setBooking(true)} className="linkedin-btn-primary h-fit py-2 px-4 text-xs flex items-center justify-center">
                  <Calendar className="w-4 h-4 mr-1.5" />Book consultation
                </button>
              </section>

              <div className="flex items-center gap-2 border-b border-slate-200">
                <button onClick={() => setActiveSection('learning')} className={`px-4 py-2 text-xs font-bold border-b-2 ${activeSection === 'learning' ? 'border-blue-600 text-blue-700' : 'border-transparent text-slate-500'}`}>Learning & consultations</button>
                <button onClick={() => setActiveSection('reviews')} className={`px-4 py-2 text-xs font-bold border-b-2 ${activeSection === 'reviews' ? 'border-amber-500 text-amber-700' : 'border-transparent text-slate-500'}`}>Reviews ({reviewsData.count})</button>
              </div>

              {activeSection === 'learning' && (
                <>
                  <section className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-bold text-sm text-slate-900">Teaching videos & mini-courses</h3>
                      <span className="text-[10px] text-slate-400">{videos.length} available</span>
                    </div>
                    {videos.length === 0 ? (
                      <p className="text-xs text-slate-400 py-8 text-center">This professor has not published videos yet.</p>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {videos.map(video => (
                          <VideoCard
                            key={video.id}
                            video={video}
                            busy={busy === video.id}
                            onEnroll={() => video.price > 0 ? setPaymentVideo(video) : enrollFree(video)}
                            onWatch={() => { api.recordVideoView(video.id); window.open(video.videoUrl, '_blank', 'noopener,noreferrer'); }}
                          />
                        ))}
                      </div>
                    )}
                  </section>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <section className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
                      <h3 className="font-bold text-sm text-slate-900 mb-3 flex items-center">
                        <Clock className="w-4 h-4 mr-2 text-indigo-600" />Available consultation slots
                      </h3>
                      {availability.length === 0 ? (
                        <p className="text-xs text-slate-400">No public slots configured.</p>
                      ) : (
                        <div className="space-y-2">
                          {availability.map(slot => (
                            <button
                              key={slot.id}
                              onClick={() => { setBooking(true); setBookingForm({ date: slot.date || 'Tomorrow', time: slot.time, topic: '' }); }}
                              className="w-full text-left p-3 rounded-lg border border-indigo-100 bg-indigo-50/40 text-xs hover:bg-indigo-100"
                            >
                              <b>{slot.day || slot.date}</b>
                              <span className="ml-2 text-slate-600">{slot.time}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </section>

                    <section className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
                      <h3 className="font-bold text-sm text-slate-900 mb-3 flex items-center">
                        <MessageSquare className="w-4 h-4 mr-2 text-amber-600" />Ask a professor
                      </h3>
                      <form onSubmit={askQuestion}>
                        <textarea
                          value={question}
                          onChange={e => setQuestion(e.target.value)}
                          rows={3}
                          placeholder="Ask about a course, thesis, or subject…"
                          className="w-full border border-slate-200 rounded-lg p-3 text-xs resize-none"
                        />
                        <button disabled={busy === 'question'} className="mt-2 linkedin-btn-primary py-2 px-4 text-xs">
                          {busy === 'question' ? 'Sending…' : 'Send question'}
                        </button>
                      </form>
                    </section>
                  </div>
                </>
              )}

              {activeSection === 'reviews' && (
                <section className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-bold text-sm text-slate-900 flex items-center">
                      <Star className="w-4 h-4 mr-2 text-amber-500 fill-amber-400" />
                      Reviews for {professor.name} ({reviewsData.count})
                    </h3>
                    <button
                      onClick={() => {
                        setReviewing({ general: true });
                        setReviewForm({ rating: mineReview?.rating || 5, comment: mineReview?.comment || '' });
                      }}
                      className="linkedin-btn-primary px-3 py-1.5 text-xs"
                    >
                      {mineReview ? 'Edit your review' : 'Write a review'}
                    </button>
                  </div>

                  {reviewsList.length === 0 ? (
                    <p className="text-xs text-slate-400">No reviews yet. Be the first to review this professor.</p>
                  ) : (
                    <div className="space-y-3">
                      {reviewsList.map((review, idx) => (
                        <div key={review.id || idx} className="p-3 bg-slate-50 rounded-lg">
                          <div className="flex justify-between text-xs">
                            <b>{review.studentName}</b>
                            <span className="text-amber-600">{'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}</span>
                          </div>
                          <p className="text-xs text-slate-600 mt-1">{review.comment}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </section>
              )}

              {sessions.length > 0 && (
                <section className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
                  <h3 className="font-bold text-sm text-slate-900 mb-3">Your Booked Sessions ({sessions.length})</h3>
                  <div className="space-y-2">
                    {sessions.map(session => (
                      <div key={session.id} className="p-3 border border-slate-200 rounded-lg flex items-center justify-between text-xs">
                        <div>
                          <b>{session.date} · {session.time}</b>
                          <span className="block text-slate-500 mt-0.5">{session.topic || 'Academic Consultation'} · <b className="text-emerald-700">{session.status}</b></span>
                        </div>
                        <span className="text-xs text-blue-600 font-semibold">PostgreSQL Sync ✓</span>
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </>
          )}
        </div>
      </div>

      {paymentVideo && (
        <Modal title="Course Enrollment Authorization" onClose={() => setPaymentVideo(null)}>
          <form onSubmit={payAndEnroll} className="space-y-3">
            <p className="text-xs text-slate-600">Enroll in <b>{paymentVideo.title}</b> for <b>{paymentVideo.price > 0 ? `LKR ${paymentVideo.price}` : 'Free'}</b>.</p>
            <input required placeholder="Account Full Name" value={payment.cardName} onChange={e => setPayment({ ...payment, cardName: e.target.value })} className="w-full border rounded-lg p-2 text-xs" />
            <input required type="password" placeholder="Account Authorization Password (1234)" value={payment.password} onChange={e => setPayment({ ...payment, password: e.target.value })} className="w-full border border-blue-300 rounded-lg p-2 text-xs bg-blue-50/30" />
            <button disabled={busy === paymentVideo.id} className="w-full linkedin-btn-primary py-2 text-xs flex justify-center items-center">
              <CreditCard className="w-4 h-4 mr-1.5" />{busy === paymentVideo.id ? 'Authorizing…' : 'Authorize & Enroll'}
            </button>
          </form>
        </Modal>
      )}

      {booking && (
        <Modal title={`Book ${professor.name}`} onClose={() => setBooking(false)}>
          <form onSubmit={bookSession} className="space-y-3">
            <input required type="date" value={bookingForm.date} onChange={e => setBookingForm({ ...bookingForm, date: e.target.value })} className="w-full border rounded-lg p-2 text-xs" />
            <input required placeholder="Time (e.g. 10:00 AM)" value={bookingForm.time} onChange={e => setBookingForm({ ...bookingForm, time: e.target.value })} className="w-full border rounded-lg p-2 text-xs" />
            <textarea required placeholder="What would you like to discuss?" value={bookingForm.topic} onChange={e => setBookingForm({ ...bookingForm, topic: e.target.value })} className="w-full border rounded-lg p-2 text-xs" rows={3} />
            <button disabled={busy === 'booking'} className="w-full linkedin-btn-primary py-2 text-xs">{busy === 'booking' ? 'Booking…' : 'Confirm booking'}</button>
          </form>
        </Modal>
      )}

      {reviewing && (
        <Modal title={`Review ${professor.name}`} onClose={() => setReviewing(null)}>
          <form onSubmit={submitReview} className="space-y-3">
            <label className="block text-xs font-semibold">Rating
              <select value={reviewForm.rating} onChange={e => setReviewForm({ ...reviewForm, rating: Number(e.target.value) })} className="block mt-1 border rounded-lg p-2 text-xs w-full">
                <option value="5">5 - Excellent</option>
                <option value="4">4 - Good</option>
                <option value="3">3 - Average</option>
                <option value="2">2 - Needs improvement</option>
                <option value="1">1 - Poor</option>
              </select>
            </label>
            <textarea required rows={3} placeholder="Share your review" value={reviewForm.comment} onChange={e => setReviewForm({ ...reviewForm, comment: e.target.value })} className="w-full border rounded-lg p-2 text-xs" />
            <button className="w-full linkedin-btn-primary py-2 text-xs">Publish review</button>
          </form>
        </Modal>
      )}
    </div>
  );
}

function VideoIcon() { return <Video className="inline w-3.5 h-3.5 mr-1" />; }

function VideoCard({ video, busy, onEnroll, onWatch }) {
  return (
    <article className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-xs">
      <div className="h-32 bg-slate-900 relative">
        {video.thumbnailUrl && <img src={video.thumbnailUrl} alt="" className="w-full h-full object-cover opacity-80" />}
        <button onClick={onWatch} className="absolute inset-0 m-auto w-10 h-10 rounded-full bg-white text-blue-600 flex items-center justify-center hover:scale-105 transition-transform">
          <Play className="w-4 h-4 fill-current ml-0.5" />
        </button>
      </div>
      <div className="p-4">
        <h4 className="font-bold text-xs text-slate-900">{video.title}</h4>
        <div className="mt-3 flex items-center justify-between text-[10px] text-slate-500">
          <span>{video.durationMinutes || 45} min · {video.enrolledCount || 128} enrolled</span>
          <b className={video.price > 0 ? 'text-amber-700' : 'text-emerald-700'}>{video.price > 0 ? `LKR ${video.price}` : 'Free'}</b>
        </div>
        <button onClick={onEnroll} disabled={busy} className="mt-3 w-full linkedin-btn-primary py-2 text-xs disabled:opacity-50">
          {busy ? 'Processing…' : video.price > 0 ? 'Enroll with payment' : 'Enroll free'}
        </button>
      </div>
    </article>
  );
}

function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-slate-900">{title}</h3>
          <button onClick={onClose}><X className="w-5 h-5 text-slate-400" /></button>
        </div>
        {children}
      </div>
    </div>
  );
}
