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
  const [reviews, setReviews] = useState({ reviews: [], avgRating: 0, count: 0 });
  const [sessions, setSessions] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState('');
  const [paymentVideo, setPaymentVideo] = useState(null);
  const [payment, setPayment] = useState({ cardName: '', cardNumber: '', cardExpiry: '', cardCvv: '' });
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
      setVideos(v);
      setAvailability(a);
      setReviews(r);
      setSessions(s.filter(session => session.profId === id));
      setQuestions(q);
    } catch (err) {
      alert(err.message);
    } finally {
      setBusy('');
    }
  };

  useEffect(() => {
    api.getProfessors()
      .then(result => {
        setProfessors(result);
        if (result[0]) setSelectedId(result[0].id);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { loadProfessor(selectedId); }, [selectedId, currentUser.id]);

  useEffect(() => {
    api.getMyEnrollments(currentUser.id).then(setEnrollments).catch(console.error);
  }, [currentUser.id]);

  const refreshEnrollments = async () => setEnrollments(await api.getMyEnrollments(currentUser.id));

  const enrollFree = async (video) => {
    setBusy(video.id);
    try {
      await api.enrollVideo(video.id, currentUser.id);
      await loadProfessor(selectedId);
      await refreshEnrollments();
    } catch (err) { alert(err.message); }
    finally { setBusy(''); }
  };

  const payAndEnroll = async (event) => {
    event.preventDefault();
    setBusy(paymentVideo.id);
    try {
      await api.payForVideo(paymentVideo.id, { studentId: currentUser.id, ...payment });
      setPaymentVideo(null);
      setPayment({ cardName: '', cardNumber: '', cardExpiry: '', cardCvv: '' });
      await loadProfessor(selectedId);
      await refreshEnrollments();
      alert('Mock payment successful. You are enrolled.');
    } catch (err) { alert(err.message); }
    finally { setBusy(''); }
  };

  const bookSession = async (event) => {
    event.preventDefault();
    setBusy('booking');
    try {
      await api.bookSession({ profId: professor.id, studentId: currentUser.id, type: 'Consultation', ...bookingForm });
      setBooking(false);
      setBookingForm({ date: '', time: '', topic: '' });
      await loadProfessor(selectedId);
      alert('Session booked in the mock scheduler.');
    } catch (err) { alert(err.message); }
    finally { setBusy(''); }
  };

  const askQuestion = async (event) => {
    event.preventDefault();
    if (!question.trim()) return;
    setBusy('question');
    try {
      await api.askProfessorQuestion(professor.id, { studentId: currentUser.id, question: question.trim() });
      setQuestion('');
      alert('Question sent to the professor.');
    } catch (err) { alert(err.message); }
    finally { setBusy(''); }
  };

  const submitReview = async (event) => {
    event.preventDefault();
    setBusy(reviewing.id);
    try {
      if (reviewing.general) {
        if (reviewing.id) await api.updateProfessorReview(reviewing.id, { studentId: currentUser.id, ...reviewForm });
        else await api.createProfessorReview(selectedId, { studentId: currentUser.id, ...reviewForm });
      } else {
        await api.reviewSession(reviewing.id, { studentId: currentUser.id, ...reviewForm });
      }
      setReviewing(null);
      await loadProfessor(selectedId);
    } catch (err) { alert(err.message); }
    finally { setBusy(''); }
  };

  const deleteGeneralReview = async (reviewId) => {
    if (!window.confirm('Delete your professor review?')) return;
    try {
      await api.deleteProfessorReview(reviewId, currentUser.id);
      await loadProfessor(selectedId);
    } catch (err) { alert(err.message); }
  };

  const deleteReview = async (sessionId) => {
    if (!window.confirm('Delete your review?')) return;
    try {
      await api.deleteReview(sessionId, currentUser.id);
      await loadProfessor(selectedId);
    } catch (err) { alert(err.message); }
  };

  const saveQuestion = async (questionId) => {
    if (!questionDraft.trim()) return;
    try {
      await api.updateStudentQuestion(questionId, { studentId: currentUser.id, question: questionDraft.trim() });
      setEditingQuestion(null);
      await loadProfessor(selectedId);
    } catch (err) { alert(err.message); }
  };

  const deleteQuestion = async (questionId) => {
    if (!window.confirm('Delete this question?')) return;
    try {
      await api.deleteStudentQuestion(questionId, currentUser.id);
      await loadProfessor(selectedId);
    } catch (err) { alert(err.message); }
  };

  const filtered = professors.filter(p =>
    !query.trim() || `${p.name} ${p.university} ${p.faculty} ${p.title}`.toLowerCase().includes(query.toLowerCase())
  );

  if (loading) return <div className="max-w-6xl mx-auto px-4 py-16 text-center text-slate-400 text-sm">Loading professors…</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      <div className="bg-gradient-to-r from-indigo-950 via-blue-900 to-slate-900 rounded-2xl p-6 text-white">
        <div className="flex items-center gap-2 text-blue-200 text-xs font-semibold mb-2"><GraduationCap className="w-4 h-4" /> Faculty Learning Hub</div>
        <h1 className="text-2xl font-black">Learn directly from Sri Lankan professors</h1>
        <p className="text-sm text-blue-100 mt-2 max-w-2xl">Enroll in lecture videos, book consultation time, ask questions, and leave verified reviews in one place.</p>
        <div className="mt-4 relative max-w-md">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
          <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search professors, universities, subjects…" className="w-full bg-white text-slate-900 rounded-lg pl-9 pr-3 py-2 text-xs outline-none" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">
        <div className="space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-wide text-slate-500">Professors ({filtered.length})</h2>
          {filtered.map(p => (
            <button key={p.id} onClick={() => setSelectedId(p.id)} className={`w-full text-left bg-white border rounded-xl p-3 flex items-center gap-3 ${selectedId === p.id ? 'border-blue-500 ring-2 ring-blue-100' : 'border-slate-200'}`}>
              <img src={p.avatar} alt="" className="w-11 h-11 rounded-full object-cover border" />
              <span className="min-w-0"><span className="flex items-center gap-1 font-bold text-xs text-slate-900 truncate">{p.name} {p.verified && <Badge type="verified" />}</span><span className="block text-[10px] text-slate-500 truncate">{p.title || 'Professor'} · {p.university}</span><span className="flex items-center text-[10px] text-amber-600 mt-1"><Star className="w-3 h-3 fill-amber-400 mr-1" />{p.profStats?.avgRating || 0} ({p.profStats?.reviewCount || 0})</span></span>
            </button>
          ))}
        </div>

        {professor && <div className="space-y-6">
          <section className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex flex-col sm:flex-row gap-4 justify-between">
            <div className="flex gap-4"><img src={professor.avatar} alt="" className="w-20 h-20 rounded-full object-cover border-4 border-blue-50" /><div><h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">{professor.name} {professor.verified && <Badge type="verified" />}</h2><p className="text-xs font-semibold text-slate-600 mt-1">{professor.title || 'Professor'} · {professor.university}</p><p className="text-xs text-slate-500 mt-2 max-w-xl">{professor.bio || 'Available for teaching and academic consultation.'}</p><div className="flex gap-4 mt-3 text-xs text-slate-500"><span><VideoIcon />{professor.profStats?.videos || 0} videos</span><span><Star className="inline w-3.5 h-3.5 mr-1 text-amber-500" />{reviews.avgRating || 0} ({reviews.count})</span></div></div></div>
            <button onClick={() => setBooking(true)} className="linkedin-btn-primary h-fit py-2 px-4 text-xs flex items-center justify-center"><Calendar className="w-4 h-4 mr-1.5" />Book consultation</button>
          </section>

          <div className="flex items-center gap-2 border-b border-slate-200">
            <button onClick={() => setActiveSection('learning')} className={`px-4 py-2 text-xs font-bold border-b-2 ${activeSection === 'learning' ? 'border-blue-600 text-blue-700' : 'border-transparent text-slate-500'}`}>Learning & consultations</button>
            <button onClick={() => setActiveSection('reviews')} className={`px-4 py-2 text-xs font-bold border-b-2 ${activeSection === 'reviews' ? 'border-amber-500 text-amber-700' : 'border-transparent text-slate-500'}`}>Reviews ({reviews.count})</button>
          </div>

          {activeSection === 'learning' && <><section className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs"><div className="flex items-center justify-between mb-4"><h3 className="font-bold text-sm text-slate-900">Teaching videos & mini-courses</h3><span className="text-[10px] text-slate-400">{videos.length} available</span></div>{videos.length === 0 ? <p className="text-xs text-slate-400 py-8 text-center">This professor has not published videos yet.</p> : <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{videos.map(video => <VideoCard key={video.id} video={video} busy={busy === video.id} onEnroll={() => video.price > 0 ? setPaymentVideo(video) : enrollFree(video)} onWatch={() => { api.recordVideoView(video.id); window.open(video.videoUrl, '_blank', 'noopener,noreferrer'); }} />)}</div>}</section>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <section className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs"><h3 className="font-bold text-sm text-slate-900 mb-3 flex items-center"><Clock className="w-4 h-4 mr-2 text-indigo-600" />Available consultation slots</h3>{availability.length === 0 ? <p className="text-xs text-slate-400">No public slots configured.</p> : <div className="space-y-2">{availability.map(slot => <button key={slot.id} onClick={() => { setBooking(true); setBookingForm({ date: '', time: slot.time, topic: '' }); }} className="w-full text-left p-3 rounded-lg border border-indigo-100 bg-indigo-50/40 text-xs hover:bg-indigo-100"><b>{slot.day}</b><span className="ml-2 text-slate-600">{slot.time}</span></button>)}</div>}</section>
            <section className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs"><h3 className="font-bold text-sm text-slate-900 mb-3 flex items-center"><MessageSquare className="w-4 h-4 mr-2 text-amber-600" />Ask a professor</h3><form onSubmit={askQuestion}><textarea value={question} onChange={e => setQuestion(e.target.value)} rows={3} placeholder="Ask about a course, thesis, or subject…" className="w-full border border-slate-200 rounded-lg p-3 text-xs resize-none" /><button disabled={busy === 'question'} className="mt-2 linkedin-btn-primary py-2 px-4 text-xs">{busy === 'question' ? 'Sending…' : 'Send question'}</button></form></section>
          </div></>}

          {activeSection === 'reviews' && <section className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs"><div className="flex items-center justify-between mb-3"><h3 className="font-bold text-sm text-slate-900 flex items-center"><Star className="w-4 h-4 mr-2 text-amber-500 fill-amber-400" />Reviews for {professor.name} ({reviews.count})</h3>{(() => { const mine = reviews.reviews.find(review => review.studentId === currentUser.id && !review.sessionId); return <button onClick={() => { setReviewing({ general: true, id: mine?.id }); setReviewForm({ rating: mine?.rating || 5, comment: mine?.comment || '' }); }} className="linkedin-btn-primary px-3 py-1.5 text-xs">{mine ? 'Edit your review' : 'Write a review'}</button>; })()}</div>{reviews.reviews.length === 0 ? <p className="text-xs text-slate-400">No reviews yet. Be the first to review this professor.</p> : <div className="space-y-3">{reviews.reviews.map(review => <div key={review.id} className="p-3 bg-slate-50 rounded-lg"><div className="flex justify-between text-xs"><b>{review.studentName}</b><span className="text-amber-600">{'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}</span></div><p className="text-xs text-slate-600 mt-1">{review.comment}</p>{review.studentId === currentUser.id && !review.sessionId && <button onClick={() => deleteGeneralReview(review.id)} className="mt-2 text-[10px] text-red-600 font-semibold">Delete your review</button>}</div>)}</div>}</section>}

          {sessions.length > 0 && <section className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs"><h3 className="font-bold text-sm text-slate-900 mb-3">Your sessions</h3><div className="space-y-2">{sessions.map(session => <div key={session.id} className="p-3 border rounded-lg flex items-center justify-between text-xs"><span><b>{session.date} · {session.time}</b><span className="block text-slate-500">{session.topic || 'Consultation'} · {session.status}</span>{session.meetingLink && <a href={session.meetingLink} target="_blank" rel="noreferrer" className="block text-blue-600 mt-1">Join meeting</a>}{session.responseMessage && <span className="block text-slate-600 mt-1">{session.responseMessage}</span>}{session.rejectionReason && <span className="block text-red-600 mt-1">Rejected: {session.rejectionReason}</span>}</span>{session.status === 'Completed' && <span className="flex gap-2"><button onClick={() => { setReviewing(session); setReviewForm({ rating: session.rating || 5, comment: session.ratingComment || '' }); }} className="text-amber-600 font-bold">{session.rating ? 'Edit review' : 'Rate session'}</button>{session.rating && <button onClick={() => deleteReview(session.id)} className="text-red-600 font-bold">Delete</button>}</span>}</div>)}</div></section>}

          {questions.length > 0 && <section className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs"><h3 className="font-bold text-sm text-slate-900 mb-3">Your questions</h3><div className="space-y-3">{questions.filter(q => q.studentId === currentUser.id).map(q => <div key={q.id} className="p-3 border rounded-lg"><div className="flex justify-between gap-3">{editingQuestion === q.id ? <textarea value={questionDraft} onChange={e => setQuestionDraft(e.target.value)} className="flex-1 border rounded p-2 text-xs" /> : <p className="text-xs text-slate-800 flex-1">{q.question}</p>}<span className="flex gap-1">{editingQuestion === q.id ? <button onClick={() => saveQuestion(q.id)} className="text-blue-600 text-xs">Save</button> : <button onClick={() => { setEditingQuestion(q.id); setQuestionDraft(q.question); }} className="text-blue-600 text-xs">Edit</button>}<button onClick={() => deleteQuestion(q.id)} className="text-red-600 text-xs">Delete</button></span></div>{q.answer && <p className="mt-2 bg-emerald-50 p-2 text-xs text-emerald-800">{q.answer}</p>}</div>)}</div></section>}
        </div>}
      </div>

      {enrollments.length > 0 && <section className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs"><h3 className="font-bold text-sm text-slate-900 mb-3">My enrolled courses ({enrollments.length})</h3><div className="flex flex-wrap gap-3">{enrollments.map(enrollment => <a key={enrollment.id} href={enrollment.videoUrl} target="_blank" rel="noreferrer" className="border border-emerald-200 bg-emerald-50 rounded-lg px-3 py-2 text-xs"><b>{enrollment.videoTitle}</b><span className="block text-emerald-700 mt-1"><CheckCircle2 className="inline w-3.5 h-3.5 mr-1" />{enrollment.isPaid ? 'Paid enrollment' : 'Enrolled'}</span></a>)}</div></section>}

      {paymentVideo && <Modal title="Mock payment gateway" onClose={() => setPaymentVideo(null)}><form onSubmit={payAndEnroll} className="space-y-3"><p className="text-xs text-slate-600">Enroll in <b>{paymentVideo.title}</b> for <b>{paymentVideo.currency || 'LKR'} {paymentVideo.price}</b>.</p><input required placeholder="Name on card" value={payment.cardName} onChange={e => setPayment({ ...payment, cardName: e.target.value })} className="w-full border rounded-lg p-2 text-xs" /><input required placeholder="Card number" value={payment.cardNumber} onChange={e => setPayment({ ...payment, cardNumber: e.target.value })} className="w-full border rounded-lg p-2 text-xs" /><div className="grid grid-cols-2 gap-2"><input required placeholder="MM/YY" value={payment.cardExpiry} onChange={e => setPayment({ ...payment, cardExpiry: e.target.value })} className="border rounded-lg p-2 text-xs" /><input required placeholder="CVV" value={payment.cardCvv} onChange={e => setPayment({ ...payment, cardCvv: e.target.value })} className="border rounded-lg p-2 text-xs" /></div><button disabled={busy === paymentVideo.id} className="w-full linkedin-btn-primary py-2 text-xs flex justify-center items-center"><CreditCard className="w-4 h-4 mr-1.5" />{busy === paymentVideo.id ? 'Processing…' : 'Pay & enroll'}</button></form></Modal>}
      {booking && <Modal title={`Book ${professor.name}`} onClose={() => setBooking(false)}><form onSubmit={bookSession} className="space-y-3"><input required type="date" value={bookingForm.date} onChange={e => setBookingForm({ ...bookingForm, date: e.target.value })} className="w-full border rounded-lg p-2 text-xs" /><input required placeholder="Time" value={bookingForm.time} onChange={e => setBookingForm({ ...bookingForm, time: e.target.value })} className="w-full border rounded-lg p-2 text-xs" /><textarea required placeholder="What would you like to discuss?" value={bookingForm.topic} onChange={e => setBookingForm({ ...bookingForm, topic: e.target.value })} className="w-full border rounded-lg p-2 text-xs" rows={3} /><button disabled={busy === 'booking'} className="w-full linkedin-btn-primary py-2 text-xs">{busy === 'booking' ? 'Booking…' : 'Confirm booking'}</button></form></Modal>}
      {reviewing && <Modal title={reviewing.general ? `Review ${professor.name}` : 'Review your session'} onClose={() => setReviewing(null)}><form onSubmit={submitReview} className="space-y-3"><label className="block text-xs font-semibold">Rating<select value={reviewForm.rating} onChange={e => setReviewForm({ ...reviewForm, rating: Number(e.target.value) })} className="block mt-1 border rounded-lg p-2 text-xs w-full"><option value="5">5 - Excellent</option><option value="4">4 - Good</option><option value="3">3 - Average</option><option value="2">2 - Needs improvement</option><option value="1">1 - Poor</option></select></label><textarea required rows={3} placeholder="Share your review" value={reviewForm.comment} onChange={e => setReviewForm({ ...reviewForm, comment: e.target.value })} className="w-full border rounded-lg p-2 text-xs" /><button className="w-full linkedin-btn-primary py-2 text-xs">{reviewing.general && reviewing.id ? 'Save changes' : 'Submit review'}</button></form></Modal>}
    </div>
  );
}

function VideoIcon() { return <Video className="inline w-3.5 h-3.5 mr-1" />; }

function VideoCard({ video, busy, onEnroll, onWatch }) {
  return <article className="border border-slate-200 rounded-xl overflow-hidden"><div className="h-32 bg-slate-900 relative">{video.thumbnailUrl && <img src={video.thumbnailUrl} alt="" className="w-full h-full object-cover opacity-80" />}<button onClick={onWatch} className="absolute inset-0 m-auto w-10 h-10 rounded-full bg-white text-blue-600 flex items-center justify-center"><Play className="w-4 h-4 fill-current" /></button></div><div className="p-4"><h4 className="font-bold text-xs text-slate-900">{video.title}</h4><p className="text-[11px] text-slate-500 mt-1 line-clamp-2">{video.description}</p><div className="mt-3 flex items-center justify-between text-[10px] text-slate-500"><span>{video.durationMinutes || '—'} min · {video.enrolledCount || 0} enrolled</span><b className={video.price > 0 ? 'text-amber-700' : 'text-emerald-700'}>{video.price > 0 ? `${video.currency || 'LKR'} ${video.price}` : 'Free'}</b></div>{video.isEnrolled ? <div className="mt-3 text-xs text-emerald-700 font-bold flex items-center"><CheckCircle2 className="w-4 h-4 mr-1" />Enrolled</div> : <button onClick={onEnroll} disabled={busy} className="mt-3 w-full linkedin-btn-primary py-2 text-xs disabled:opacity-50">{busy ? 'Processing…' : video.price > 0 ? 'Enroll with payment' : 'Enroll free'}</button>}</div></article>;
}

function Modal({ title, onClose, children }) {
  return <div className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4"><div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl"><div className="flex justify-between items-center mb-4"><h3 className="font-bold text-slate-900">{title}</h3><button onClick={onClose}><X className="w-5 h-5 text-slate-400" /></button></div>{children}</div></div>;
}
