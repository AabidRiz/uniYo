import React, { useEffect, useState } from 'react';
import { Briefcase, CheckCircle2, DollarSign, MapPin, Send, X, Upload, FileText, GraduationCap, Phone, Mail } from 'lucide-react';
import { api } from '../../api/client';

export default function StudentJobsView({ currentUser }) {
  const [jobs, setJobs] = useState([]);
  const [applied, setApplied] = useState({});
  const [loading, setLoading] = useState(true);
  const [applyJob, setApplyJob] = useState(null);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    name: '', email: '', phone: '', university: '', degree: '', faculty: '',
    gpa: '', experience: '', cvBase64: '', cvName: ''
  });
  const [error, setError] = useState('');

  useEffect(() => {
    api.getInternships()
      .then(setJobs)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const openApply = (job) => {
    setApplyJob(job);
    setError('');
    setForm({
      name: currentUser?.name || '',
      email: currentUser?.email || '',
      phone: '',
      university: currentUser?.university || '',
      degree: currentUser?.degree || '',
      faculty: currentUser?.faculty || '',
      gpa: '',
      experience: '',
      cvBase64: '',
      cvName: ''
    });
  };

  const fileToBase64 = (file) => new Promise((res, rej) => {
    const r = new FileReader();
    r.onloadend = () => res(r.result);
    r.onerror = rej;
    r.readAsDataURL(file);
  });

  const handleCvUpload = async (e) => {
    const f = e.target.files[0];
    if (!f) return;
    if (f.type !== 'application/pdf') {
      setError('CV must be a PDF file.');
      e.target.value = '';
      return;
    }
    const b64 = await fileToBase64(f);
    setForm(prev => ({ ...prev, cvBase64: b64, cvName: f.name }));
    setError('');
    e.target.value = '';
  };

  const submitApplication = async (e) => {
    e.preventDefault();
    setError('');

    if (!form.name.trim() || !form.email.trim() || !form.phone.trim()) return setError('Name, email, and phone are required.');
    if (!form.degree.trim()) return setError('Degree / program is required.');
    if (!form.experience.trim()) return setError('Please describe your experience.');
    if (!form.cvBase64) return setError('Please attach your CV (PDF).');

    setBusy(true);
    try {
      await api.applyToInternship(applyJob.id, { userId: currentUser.id, ...form });
      setApplied(prev => ({ ...prev, [applyJob.id]: true }));
      setApplyJob(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <div className="max-w-5xl mx-auto px-4 py-16 text-center text-slate-400 text-sm">Loading jobs…</div>;

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
        <div className="flex items-center gap-2 text-amber-700 text-xs font-semibold"><Briefcase className="w-4 h-4" /> Student Jobs</div>
        <h1 className="text-xl font-bold text-slate-900 mt-2">Jobs & internships</h1>
        <p className="text-xs text-slate-500 mt-1">Opportunities posted by verified UniYO companies. Apply with your personal details, education, experience, and CV.</p>
      </div>

      {jobs.length === 0 ? (
        <div className="bg-white border rounded-xl p-12 text-center text-xs text-slate-400">No jobs are available yet.</div>
      ) : (
        <div className="space-y-4">
          {jobs.map(job => (
            <article key={job.id} className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="font-bold text-slate-900 text-sm">{job.title}</h2>
                  <p className="text-xs text-slate-500 mt-1">{job.company} · {job.type}</p>
                  <div className="flex gap-4 text-[11px] text-slate-500 mt-2">
                    <span><MapPin className="inline w-3 h-3 mr-1" />{job.location || 'Location not specified'}</span>
                    <span><DollarSign className="inline w-3 h-3 mr-1" />{job.stipend || 'Compensation discussed'}</span>
                  </div>
                </div>
                <button
                  onClick={() => openApply(job)}
                  disabled={applied[job.id]}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center ${applied[job.id] ? 'bg-emerald-100 text-emerald-800' : 'linkedin-btn-primary'}`}
                >
                  {applied[job.id] ? <><CheckCircle2 className="w-3.5 h-3.5 mr-1" />Applied</> : <><Send className="w-3.5 h-3.5 mr-1" />Apply</>}
                </button>
              </div>
              <p className="text-xs text-slate-700 mt-3 leading-relaxed">{job.description}</p>
            </article>
          ))}
        </div>
      )}

      {/* APPLICATION MODAL */}
      {applyJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-base font-bold text-slate-900">Apply — {applyJob.title}</h3>
              <button onClick={() => setApplyJob(null)} className="text-slate-400 hover:text-slate-700"><X className="w-5 h-5" /></button>
            </div>
            <p className="text-xs text-slate-500 mb-4">{applyJob.company}</p>

            {error && <div className="mb-3 p-2.5 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg">{error}</div>}

            <form onSubmit={submitApplication} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name *</label>
                <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1"><Mail className="inline w-3 h-3 mr-1" />Email *</label>
                  <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1"><Phone className="inline w-3 h-3 mr-1" />Phone *</label>
                  <input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })}
                    placeholder="+94 7X XXX XXXX"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none" />
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2 flex items-center"><GraduationCap className="w-3.5 h-3.5 mr-1" />Education</p>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">University</label>
                    <input value={form.university} onChange={e => setForm({ ...form, university: e.target.value })}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Degree / Program *</label>
                      <input value={form.degree} onChange={e => setForm({ ...form, degree: e.target.value })}
                        placeholder="B.Sc (Hons) Software Engineering"
                        className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Faculty</label>
                      <input value={form.faculty} onChange={e => setForm({ ...form, faculty: e.target.value })}
                        className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">GPA (optional)</label>
                    <input value={form.gpa} onChange={e => setForm({ ...form, gpa: e.target.value })}
                      placeholder="e.g. 3.85"
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none" />
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100">
                <label className="block text-xs font-semibold text-slate-700 mb-1">Experience *</label>
                <textarea rows={4} value={form.experience} onChange={e => setForm({ ...form, experience: e.target.value })}
                  placeholder="Projects, internships, relevant skills, achievements…"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none" />
              </div>

              <div className="pt-2 border-t border-slate-100">
                <label className="block text-xs font-semibold text-slate-700 mb-1">Attach CV (PDF) *</label>
                <div className="p-4 border border-dashed border-slate-300 rounded-lg bg-slate-50">
                  <input type="file" accept="application/pdf" onChange={handleCvUpload}
                    className="text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-[#0A66C2] hover:file:bg-blue-100" />
                  {form.cvName && (
                    <div className="mt-3 flex items-center text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
                      <FileText className="w-4 h-4 mr-2" />{form.cvName}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-3">
                <button type="button" onClick={() => setApplyJob(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900">Cancel</button>
                <button type="submit" disabled={busy}
                  className="linkedin-btn-primary py-2 px-5 text-xs flex items-center disabled:opacity-50">
                  <Upload className="w-3.5 h-3.5 mr-1.5" />{busy ? 'Submitting…' : 'Submit Application'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}