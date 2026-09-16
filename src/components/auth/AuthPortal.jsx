import React, { useState, useEffect } from 'react';
import {
  GraduationCap, Users, Briefcase, CheckCircle2, AlertCircle,
  ArrowRight, ArrowLeft, Key, X, Clock
} from 'lucide-react';
import UniYOLogo from '../common/UniYOLogo';
import { api } from '../../api/client';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PW_RE = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;

export default function AuthPortal({ onAuthenticate }) {
  const [authMode, setAuthMode] = useState('login');
  const [role, setRole] = useState('student');
  const [step, setStep] = useState(1);

  const [universities, setUniversities] = useState([]);
  const [loginEmail, setLoginEmail] = useState('kusal.p@sliit.lk');
  const [loginPassword, setLoginPassword] = useState('1234');
  const [loginError, setLoginError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [adminError, setAdminError] = useState('');

  const [form, setForm] = useState({
    name: '', email: '', password: '', confirmPassword: '',
    university: '', studentId: '', faculty: '', degree: '',
    company: '', industry: '', title: '',
    bio: '', skills: '', avatarBase64: '', idCardBase64: ''
  });
  const [formError, setFormError] = useState('');
  const [result, setResult] = useState(null);

  useEffect(() => {
    api.getUniversities().then(u => {
      setUniversities(u);
      if (u.length) setForm(prev => ({ ...prev, university: u[0].name }));
    }).catch(console.error);
  }, []);

  const fileToBase64 = (file) => new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onloadend = () => resolve(r.result);
    r.onerror = reject;
    r.readAsDataURL(file);
  });

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError('');
    setSubmitting(true);
    try {
      const res = await api.login({ email: loginEmail, password: loginPassword, role });
      if (res?.success && res.user) onAuthenticate(res.user);
      else setLoginError(res?.error || 'Invalid credentials');
    } catch (err) {
      setLoginError(err.message || 'Connection error');
    } finally { setSubmitting(false); }
  };

  const handleAdminSubmit = async (e) => {
    e.preventDefault();
    setAdminError('');
    try {
      const res = await api.login({ email: 'admin@uniyo.lk', password: adminPassword, role: 'admin' });
      if (res?.success) { setIsAdminModalOpen(false); onAuthenticate(res.user); }
      else setAdminError('Incorrect admin password.');
    } catch (err) { setAdminError(err.message); }
  };

  const validateStep = () => {
    setFormError('');
    if (step === 1) {
      if (!form.name.trim() || form.name.trim().length < 3) return 'Full name must be at least 3 characters.';
      if (!EMAIL_RE.test(form.email)) return 'Please enter a valid email address.';
      if (!PW_RE.test(form.password)) return 'Password must be 8+ characters with at least one letter and one number.';
      if (form.password !== form.confirmPassword) return 'Passwords do not match.';
      return true;
    }
    if (step === 2) {
      if (role === 'student') {
        if (!form.university) return 'Please select your university.';
        if (!form.studentId.trim()) return 'Student ID is required.';
      }
      if (role === 'professor') {
        if (!form.university) return 'Please select your university.';
        if (!form.title.trim()) return 'Academic title is required.';
      }
      if (role === 'business') {
        if (!form.company.trim()) return 'Company name is required.';
        if (!form.industry.trim()) return 'Industry is required.';
      }
      return true;
    }
    return true;
  };

  const next = () => { const v = validateStep(); if (v === true) setStep(step + 1); else setFormError(v); };
  const back = () => { setFormError(''); setStep(step - 1); };

  const submit = async () => {
    setFormError('');
    setSubmitting(true);
    try {
      const created = await api.registerUser({
        role,
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        password: form.password,
        studentId: form.studentId.trim() || null,
        university: form.university || null,
        faculty: form.faculty || null,
        degree: form.degree || null,
        company: form.company || null,
        industry: form.industry || null,
        title: form.title || null,
        bio: form.bio || null,
        skills: form.skills || null,
        avatarBase64: form.avatarBase64 || null,
        idCardBase64: form.idCardBase64 || null
      });
      setResult(created);
      setStep(4);
    } catch (err) {
      setFormError(err.message || 'Registration failed');
    } finally { setSubmitting(false); }
  };

  const finish = () => onAuthenticate(result);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/40 via-slate-950 to-slate-950 pointer-events-none" />

      <header className="relative z-20 max-w-7xl mx-auto w-full px-6 py-6 flex items-center justify-between">
        <UniYOLogo size="lg" showTagline />
        <div className="flex items-center space-x-3">
          <div className="bg-slate-900/80 backdrop-blur-md p-1 rounded-full border border-slate-800 text-xs font-semibold flex">
            <button onClick={() => { setAuthMode('login'); setStep(1); setFormError(''); }}
              className={`px-4 py-1.5 rounded-full ${authMode === 'login' ? 'bg-[#0A66C2] text-white' : 'text-slate-400'}`}>Sign In</button>
            <button onClick={() => { setAuthMode('register'); setStep(1); setFormError(''); }}
              className={`px-4 py-1.5 rounded-full ${authMode === 'register' ? 'bg-[#0A66C2] text-white' : 'text-slate-400'}`}>Register</button>
          </div>
          <button onClick={() => setIsAdminModalOpen(true)}
            className="w-7 h-7 rounded-full bg-slate-900 hover:bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-500 hover:text-emerald-400"
            title="Admin">
            <span className="w-2 h-2 rounded-full bg-emerald-500/40" />
          </button>
        </div>
      </header>

      <main className="relative z-10 max-w-3xl mx-auto w-full px-4 py-8 flex-1">
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl shadow-2xl p-6 sm:p-10 backdrop-blur-xl">

          {authMode === 'login' && (
            <form onSubmit={handleLogin} className="max-w-md mx-auto space-y-4">
              <div className="text-center mb-4">
                <h2 className="text-xl font-bold">Welcome to UniYO</h2>
                <p className="text-xs text-slate-400 mt-1">Sign in with your university email</p>
              </div>

              {loginError && (
                <div className="p-3 bg-red-950/80 border border-red-800 text-red-300 text-xs rounded-xl text-center">{loginError}</div>
              )}

              <div className="flex items-center justify-center space-x-2 mb-2">
                {['student', 'professor', 'business'].map(r => (
                  <button key={r} type="button" onClick={() => setRole(r)}
                    className={`px-3 py-1.5 rounded-lg text-[11px] font-bold capitalize transition-all border ${
                      role === r ? 'bg-blue-600/20 border-blue-500 text-blue-300' : 'bg-slate-950/60 border-slate-800 text-slate-400'
                    }`}>{r}</button>
                ))}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Email</label>
                <input type="email" required value={loginEmail} onChange={e => setLoginEmail(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Password</label>
                <input type="password" required value={loginPassword} onChange={e => setLoginPassword(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500" />
              </div>

              <button type="submit" disabled={submitting}
                className="w-full linkedin-btn-primary py-3 text-xs font-bold mt-2 disabled:opacity-50">
                {submitting ? 'Signing in…' : 'Sign In'}
              </button>

              <p className="text-[11px] text-slate-500 text-center">
                Seed accounts: <code className="text-blue-400">kusal.p@sliit.lk</code> / <code className="text-blue-400">1234</code>
              </p>
            </form>
          )}

          {authMode === 'register' && (
            <div>
              <div className="max-w-lg mx-auto mb-6">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-400 mb-2">
                  <span>Step {step} of 4</span>
                  <span className="text-blue-400 font-bold">
                    {step === 1 && '1. Account'}
                    {step === 2 && '2. Identity'}
                    {step === 3 && '3. Profile'}
                    {step === 4 && '4. Review'}
                  </span>
                </div>
                <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-[#0A66C2] transition-all" style={{ width: `${(step / 4) * 100}%` }} />
                </div>
              </div>

              <div className="flex items-center justify-center space-x-2 mb-6">
                {[
                  { k: 'student', icon: GraduationCap, label: 'Student' },
                  { k: 'professor', icon: Users, label: 'Professor' },
                  { k: 'business', icon: Briefcase, label: 'Business' }
                ].map(r => (
                  <button key={r.k} type="button" onClick={() => { setRole(r.k); setStep(1); setFormError(''); }}
                    className={`flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
                      role === r.k ? 'bg-blue-600/20 border-blue-500 text-blue-300' : 'bg-slate-950/60 border-slate-800 text-slate-400'
                    }`}>
                    <r.icon className="w-4 h-4" /><span>{r.label}</span>
                  </button>
                ))}
              </div>

              {formError && (
                <div className="mb-4 p-3 bg-red-950/80 border border-red-800 text-red-300 text-xs rounded-xl text-center flex items-center justify-center">
                  <AlertCircle className="w-4 h-4 mr-2" /> {formError}
                </div>
              )}

              {step === 1 && (
                <div className="max-w-md mx-auto space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Full Name *</label>
                    <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                      className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Email *</label>
                    <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
                      className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">Password *</label>
                      <input type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })}
                        className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">Confirm *</label>
                      <input type="password" value={form.confirmPassword} onChange={e => setForm({ ...form, confirmPassword: e.target.value })}
                        className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500" />
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-500">8+ characters, must contain letters and numbers.</p>

                  <button onClick={next} className="w-full linkedin-btn-primary py-3 text-xs font-bold mt-2 flex items-center justify-center">
                    Next <ArrowRight className="w-4 h-4 ml-1.5" />
                  </button>
                </div>
              )}

              {step === 2 && (
                <div className="max-w-md mx-auto space-y-3">
                  {role !== 'business' && (
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">University *</label>
                      <select value={form.university} onChange={e => setForm({ ...form, university: e.target.value })}
                        className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500">
                        {universities.map(u => <option key={u.id} value={u.name}>{u.name}</option>)}
                      </select>
                    </div>
                  )}

                  {role === 'student' && (
                    <>
                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1">Student ID *</label>
                        <input type="text" value={form.studentId} onChange={e => setForm({ ...form, studentId: e.target.value })}
                          placeholder="e.g. IT-20249812"
                          className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-white focus:outline-none focus:border-blue-500" />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <input type="text" placeholder="Faculty" value={form.faculty} onChange={e => setForm({ ...form, faculty: e.target.value })}
                          className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500" />
                        <input type="text" placeholder="Degree" value={form.degree} onChange={e => setForm({ ...form, degree: e.target.value })}
                          className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500" />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1">Student ID Card Photo *</label>
                        <div className="p-4 border border-dashed border-slate-800 rounded-xl bg-slate-950">
                          <input type="file" accept="image/*"
                            onChange={async e => {
                              const f = e.target.files[0]; if (!f) return;
                              const b64 = await fileToBase64(f);
                              setForm(prev => ({ ...prev, idCardBase64: b64 }));
                            }}
                            className="text-xs text-slate-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-blue-600 file:text-white" />
                          {form.idCardBase64 && <img src={form.idCardBase64} alt="ID" className="mt-3 h-20 rounded border border-blue-500" />}
                        </div>
                        <p className="text-[10px] text-slate-500 mt-1">Reviewed by admin within 1–3 hours.</p>
                      </div>
                    </>
                  )}

                  {role === 'professor' && (
                    <>
                      <input type="text" placeholder="Academic Title (e.g. Senior Lecturer)" value={form.title}
                        onChange={e => setForm({ ...form, title: e.target.value })}
                        className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500" />
                      <input type="text" placeholder="Faculty" value={form.faculty} onChange={e => setForm({ ...form, faculty: e.target.value })}
                        className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500" />
                    </>
                  )}

                  {role === 'business' && (
                    <>
                      <input type="text" placeholder="Company *" value={form.company} onChange={e => setForm({ ...form, company: e.target.value })}
                        className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500" />
                      <input type="text" placeholder="Industry *" value={form.industry} onChange={e => setForm({ ...form, industry: e.target.value })}
                        className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500" />
                      <input type="text" placeholder="Title (e.g. Managing Director)" value={form.title}
                        onChange={e => setForm({ ...form, title: e.target.value })}
                        className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500" />
                    </>
                  )}

                  <div className="flex items-center justify-between pt-2">
                    <button onClick={back} className="px-3 py-2 text-xs font-semibold text-slate-400 hover:text-white flex items-center">
                      <ArrowLeft className="w-4 h-4 mr-1" /> Back
                    </button>
                    <button onClick={next} className="linkedin-btn-primary py-2.5 px-6 text-xs font-bold flex items-center">
                      Next <ArrowRight className="w-4 h-4 ml-1.5" />
                    </button>
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="max-w-md mx-auto space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Avatar</label>
                    <input type="file" accept="image/*"
                      onChange={async e => { const f = e.target.files[0]; if (!f) return;
                        const b64 = await fileToBase64(f); setForm(prev => ({ ...prev, avatarBase64: b64 })); }}
                      className="text-xs text-slate-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-blue-600 file:text-white" />
                    {form.avatarBase64 && <img src={form.avatarBase64} alt="Avatar" className="mt-3 w-14 h-14 rounded-full border border-blue-500 object-cover" />}
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Bio</label>
                    <textarea rows={3} value={form.bio} onChange={e => setForm({ ...form, bio: e.target.value })}
                      className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Skills (comma separated)</label>
                    <input type="text" value={form.skills} onChange={e => setForm({ ...form, skills: e.target.value })}
                      placeholder="React, Python, PostgreSQL"
                      className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500" />
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <button onClick={back} className="px-3 py-2 text-xs font-semibold text-slate-400 hover:text-white flex items-center">
                      <ArrowLeft className="w-4 h-4 mr-1" /> Back
                    </button>
                    <button onClick={submit} disabled={submitting} className="linkedin-btn-primary py-2.5 px-6 text-xs font-bold disabled:opacity-50">
                      {submitting ? 'Saving…' : 'Save & Verify'}
                    </button>
                  </div>
                </div>
              )}

              {step === 4 && result && (
                <div className="max-w-md mx-auto text-center space-y-4">
                  {result.verified ? (
                    <CheckCircle2 className="w-14 h-14 text-emerald-500 mx-auto" />
                  ) : (
                    <Clock className="w-14 h-14 text-amber-500 mx-auto" />
                  )}
                  <h3 className="text-lg font-bold">
                    {result.verified ? 'Welcome to UniYO!' : 'Account Submitted for Review'}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {result.verified
                      ? result.verificationReason
                      : 'Your student ID card is being reviewed. Expected approval within 1–3 hours.'}
                  </p>
                  <button onClick={finish} className="linkedin-btn-primary py-3 px-6 text-xs font-bold w-full">
                    Enter Workspace
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      <footer className="relative z-20 text-center text-[11px] text-slate-600 py-4">
        © 2026 UniYO — Sri Lankan University Application Engine
      </footer>

      {isAdminModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-sm w-full space-y-4 relative">
            <button onClick={() => setIsAdminModalOpen(false)} className="absolute top-3 right-3 text-slate-500 hover:text-white">
              <X className="w-4 h-4" />
            </button>
            <div className="flex items-center space-x-2 text-emerald-400 font-bold text-sm">
              <Key className="w-5 h-5" /><span>Admin Portal</span>
            </div>
            <p className="text-xs text-slate-400">Default password: <code className="text-emerald-400">1234</code></p>
            {adminError && <div className="p-2 bg-red-950 border border-red-800 text-red-400 text-xs rounded">{adminError}</div>}
            <form onSubmit={handleAdminSubmit} className="space-y-3">
              <input type="password" value={adminPassword} onChange={e => setAdminPassword(e.target.value)}
                placeholder="Password" required
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white font-mono" />
              <button type="submit" className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl">
                Authenticate
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}