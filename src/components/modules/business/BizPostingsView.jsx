import React, { useState, useEffect } from 'react';
import { Briefcase, Plus, Users, Trash2, Edit3, CheckCircle2, DollarSign } from 'lucide-react';
import { api } from '../../../api/client';
import Badge from '../../common/Badge';

export default function BizPostingsView({ currentUser }) {
  const [internships, setInternships] = useState([]);
  const [isPosting, setIsPosting] = useState(false);
  const [loading, setLoading] = useState(true);

  // New Internship Form
  const [newJob, setNewJob] = useState({
    title: '',
    company: currentUser?.company || 'Lanka Venture Labs',
    location: 'Colombo 03 (Hybrid)',
    stipend: 'LKR 75,000 / month',
    type: 'Summer Internship',
    description: ''
  });

  useEffect(() => {
    loadInternships();
  }, []);

  const loadInternships = async () => {
    try {
      const data = await api.getInternships();
      setInternships(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    try {
      const created = await api.createInternship(newJob);
      setInternships([created, ...internships]);
      setIsPosting(false);
      setNewJob({ title: '', company: currentUser?.company || 'Lanka Venture Labs', location: 'Colombo 03 (Hybrid)', stipend: 'LKR 75,000 / month', type: 'Summer Internship', description: '' });
    } catch (err) {
      console.error('Error creating job in PostgreSQL:', err);
    }
  };

  const handleDeleteJob = async (id) => {
    if (!window.confirm('Delete this internship posting from PostgreSQL?')) return;
    try {
      await api.deleteInternship(id);
      setInternships(internships.filter(j => j.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  const handleApplicantStatusChange = async (jobId, appId, newStatus) => {
    try {
      await api.updateApplicantStatus(jobId, appId, newStatus);
      const updated = internships.map(j => {
        if (j.id === jobId) {
          return {
            ...j,
            applicants: (j.applicants || []).map(a => a.id === appId ? { ...a, status: newStatus } : a)
          };
        }
        return j;
      });
      setInternships(updated);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
      
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-amber-700 font-semibold text-xs mb-1">
            <Briefcase className="w-4 h-4" />
            <span>Dedicated Campus Internship & Hiring Management Portal</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900">Internship Postings & Applicants</h2>
          <p className="text-xs text-slate-500 mt-1">
            Recruit top undergraduates from Moratuwa, Colombo, SLIIT, and Peradeniya. Manage pipeline status.
          </p>
        </div>

        <button
          onClick={() => setIsPosting(true)}
          className="linkedin-btn-primary py-2 px-4 text-xs flex items-center bg-amber-600 hover:bg-amber-700"
        >
          <Plus className="w-4 h-4 mr-1.5" /> Post New Internship
        </button>
      </div>

      {/* Internships List */}
      <div className="space-y-6">
        {internships.map((job) => (
          <div key={job.id} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-bold text-base text-slate-900">{job.title}</h3>
                <p className="text-xs text-slate-500 mt-0.5">{job.company} • {job.location} • <span className="font-bold text-emerald-600">{job.stipend}</span></p>
                <p className="text-xs text-slate-700 mt-2">{job.description}</p>
              </div>

              <div className="flex items-center space-x-2">
                <span className="text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
                  {job.type}
                </span>
                <button
                  onClick={() => handleDeleteJob(job.id)}
                  className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                  title="Delete Internship"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Applicant Pipeline */}
            <div className="pt-4 border-t border-slate-100">
              <h4 className="font-bold text-xs text-slate-800 mb-3 flex items-center">
                <Users className="w-4 h-4 text-slate-500 mr-1.5" />
                <span>Student Applicants Pipeline ({(job.applicants || []).length})</span>
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {(job.applicants || []).map((app) => (
                  <div key={app.id} className="p-3 border border-slate-200 rounded-xl bg-slate-50 flex items-center justify-between">
                    <div>
                      <div className="flex items-center space-x-1">
                        <span className="font-bold text-xs text-slate-900">{app.name}</span>
                        <Badge type="verified" />
                      </div>
                      <p className="text-[11px] text-slate-500">{app.university} • GPA: {app.gpa || '3.9'}</p>
                    </div>

                    <select
                      value={app.status}
                      onChange={(e) => handleApplicantStatusChange(job.id, app.id, e.target.value)}
                      className="text-xs border border-slate-300 rounded px-2 py-1 bg-white font-semibold focus:outline-none"
                    >
                      <option value="Applied">Applied</option>
                      <option value="Shortlisted">Shortlisted</option>
                      <option value="Hired">Hired</option>
                      <option value="Rejected">Rejected</option>
                    </select>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* CREATE INTERNSHIP MODAL */}
      {isPosting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full shadow-2xl border border-slate-200">
            <h3 className="text-lg font-bold text-slate-900 mb-1">Post Campus Internship</h3>
            <p className="text-xs text-slate-500 mb-4">Saved to PostgreSQL database.</p>

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Job Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. AI Systems & Full-Stack Engineering Intern"
                  value={newJob.title}
                  onChange={e => setNewJob({ ...newJob, title: e.target.value })}
                  className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-600 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Monthly Stipend</label>
                  <input
                    type="text"
                    value={newJob.stipend}
                    onChange={e => setNewJob({ ...newJob, stipend: e.target.value })}
                    className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Location</label>
                  <input
                    type="text"
                    value={newJob.location}
                    onChange={e => setNewJob({ ...newJob, location: e.target.value })}
                    className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-600 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Description & Requirements</label>
                <textarea
                  rows="3"
                  required
                  placeholder="Detail responsibilities and technical skills required..."
                  value={newJob.description}
                  onChange={e => setNewJob({ ...newJob, description: e.target.value })}
                  className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-600 focus:outline-none"
                />
              </div>

              <div className="pt-2 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsPosting(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900"
                >
                  Cancel
                </button>
                <button type="submit" className="linkedin-btn-primary py-2 px-5 text-xs bg-amber-600 hover:bg-amber-700">
                  Publish to PostgreSQL
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
