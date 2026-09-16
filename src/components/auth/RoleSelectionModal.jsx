import React, { useState, useEffect } from 'react';
import { GraduationCap, Users, Briefcase, ShieldCheck, CheckCircle2, AlertCircle, ArrowRight, X, Upload } from 'lucide-react';
import UniYOLogo from '../common/UniYOLogo';
import { api } from '../../api/client';

export default function RoleSelectionModal({ isOpen, onClose, onSelectRole, onRegisterUser }) {
  const [step, setStep] = useState('select'); // 'select' | 'form' | 'verifying' | 'success'
  const [selectedRole, setSelectedRole] = useState(null);
  const [universities, setUniversities] = useState([]);
  const [loadingUnis, setLoadingUnis] = useState(true);

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    university: '',
    studentId: '',
    faculty: 'Computing & Software Engineering',
    degree: 'B.Sc (Hons) Software Engineering',
    company: '',
    industry: '',
    avatarBase64: ''
  });

  const [aiAnalysis, setAiAnalysis] = useState(null);

  useEffect(() => {
    // Fetch live Sri Lankan universities from PostgreSQL backend
    api.getUniversities()
      .then(unis => {
        setUniversities(unis);
        if (unis.length > 0) {
          setFormData(prev => ({
            ...prev,
            university: unis[0].name,
            studentId: unis[0].code ? `${unis[0].code}-202601` : 'UOC-202601'
          }));
        }
        setLoadingUnis(false);
      })
      .catch(err => {
        console.error('Error loading universities from PostgreSQL:', err);
        setLoadingUnis(false);
      });
  }, []);

  if (!isOpen) return null;

  const handleRoleClick = (role) => {
    setSelectedRole(role);
    setStep('form');
  };

  const handleUniSelectChange = (uniName) => {
    const selectedUni = universities.find(u => u.name === uniName);
    const defaultCode = selectedUni?.code || 'UNI';
    setFormData(prev => ({
      ...prev,
      university: uniName,
      studentId: `${defaultCode}-2026${Math.floor(1000 + Math.random() * 9000)}`
    }));
  };

  // Convert uploaded image file to Base64
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setFormData(prev => ({ ...prev, avatarBase64: reader.result }));
    };
    reader.readAsDataURL(file);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setStep('verifying');

    try {
      // Register user in PostgreSQL database via Express API
      const registeredUser = await api.registerUser({
        role: selectedRole,
        name: formData.name,
        email: formData.email,
        studentId: formData.studentId,
        university: formData.university,
        faculty: formData.faculty,
        degree: formData.degree,
        company: formData.company,
        industry: formData.industry,
        avatarBase64: formData.avatarBase64
      });

      setTimeout(() => {
        if (registeredUser.verified) {
          setAiAnalysis({
            status: 'verified',
            confidence: '99%',
            reason: registeredUser.verification_reason || `Auto-verified in PostgreSQL for ${formData.university}.`
          });
        } else {
          setAiAnalysis({
            status: 'pending',
            confidence: '82%',
            reason: registeredUser.verification_reason || 'Student ID format flag. Stored in PostgreSQL Admin Verification Queue.'
          });
        }

        if (onRegisterUser) onRegisterUser(registeredUser);
        setStep('success');
      }, 1200);

    } catch (err) {
      console.error('PostgreSQL Registration Error:', err);
      setStep('form');
      alert('Error connecting to PostgreSQL server. Please verify Express server is running on port 5000.');
    }
  };

  const handleFinish = () => {
    onSelectRole(selectedRole);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden relative">
        
        {/* Close button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1.5 rounded-full hover:bg-slate-100 transition-all z-10"
        >
          <X className="w-5 h-5" />
        </button>

        {/* STEP 1: WHO ARE YOU ROLE SELECTION */}
        {step === 'select' && (
          <div className="p-8 text-center">
            <div className="flex justify-center mb-4">
              <UniYOLogo size="lg" showTagline={true} />
            </div>

            <h2 className="text-2xl font-bold text-slate-900 mt-2">Who are you?</h2>
            <p className="text-sm text-slate-500 mt-1 mb-8">
              Select your primary identity on UniYO to register with PostgreSQL
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Option 1: Student */}
              <button
                onClick={() => handleRoleClick('student')}
                className="flex flex-col items-center p-6 border-2 border-slate-200 rounded-xl hover:border-[#0A66C2] hover:bg-blue-50/50 transition-all group text-center"
              >
                <div className="w-14 h-14 rounded-full bg-blue-100 text-[#0A66C2] flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                  <GraduationCap className="w-8 h-8" />
                </div>
                <span className="font-bold text-slate-900 text-sm">Student</span>
                <span className="text-[11px] text-slate-500 mt-1">Collab, Find Gigs & Pitch Ideas</span>
              </button>

              {/* Option 2: Professor */}
              <button
                onClick={() => handleRoleClick('professor')}
                className="flex flex-col items-center p-6 border-2 border-slate-200 rounded-xl hover:border-indigo-600 hover:bg-indigo-50/50 transition-all group text-center"
              >
                <div className="w-14 h-14 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                  <Users className="w-8 h-8" />
                </div>
                <span className="font-bold text-slate-900 text-sm">Professor</span>
                <span className="text-[11px] text-slate-500 mt-1">Consult, Teach & Office Hours</span>
              </button>

              {/* Option 3: Business / Investor */}
              <button
                onClick={() => handleRoleClick('business')}
                className="flex flex-col items-center p-6 border-2 border-slate-200 rounded-xl hover:border-amber-600 hover:bg-amber-50/50 transition-all group text-center"
              >
                <div className="w-14 h-14 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                  <Briefcase className="w-8 h-8" />
                </div>
                <span className="font-bold text-slate-900 text-sm">Business / Investor</span>
                <span className="text-[11px] text-slate-500 mt-1">Hire Interns & Fund Projects</span>
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: REGISTRATION FORM & ID SUBMISSION */}
        {step === 'form' && (
          <form onSubmit={handleFormSubmit} className="p-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-6">
              <div className="flex items-center space-x-2">
                <span className="text-xl capitalize font-bold text-slate-900">
                  {selectedRole} Registration (PostgreSQL)
                </span>
              </div>
              <button 
                type="button" 
                onClick={() => setStep('select')}
                className="text-xs text-[#0A66C2] font-semibold hover:underline"
              >
                Change Role
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Kusal Perera"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">University Email</label>
                  <input
                    type="email"
                    required
                    placeholder="student@sliit.lk"
                    value={formData.email}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Select University (PostgreSQL)</label>
                  <select
                    value={formData.university}
                    onChange={e => handleUniSelectChange(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:outline-none bg-white"
                  >
                    {loadingUnis ? (
                      <option>Loading universities from PostgreSQL...</option>
                    ) : (
                      universities.map(u => (
                        <option key={u.id} value={u.name}>{u.name}</option>
                      ))
                    )}
                  </select>
                </div>
              </div>

              {selectedRole === 'student' && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Student ID Format</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. IT-20269812"
                      value={formData.studentId}
                      onChange={e => setFormData({ ...formData, studentId: e.target.value })}
                      className="w-full px-3.5 py-2 text-xs font-mono border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:outline-none"
                    />
                    <span className="text-[10px] text-slate-400">Pattern validated in PostgreSQL</span>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Faculty / Major</label>
                    <input
                      type="text"
                      placeholder="Computing & AI"
                      value={formData.faculty}
                      onChange={e => setFormData({ ...formData, faculty: e.target.value })}
                      className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:outline-none"
                    />
                  </div>
                </div>
              )}

              {/* Profile Picture Upload -> Convert to Base64 in PostgreSQL */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Upload Profile Avatar (Stored as Base64 in PostgreSQL)
                </label>
                <div className="flex items-center space-x-3">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-[#0A66C2] hover:file:bg-blue-100"
                  />
                  {formData.avatarBase64 && (
                    <img src={formData.avatarBase64} alt="Preview" className="w-8 h-8 rounded-full object-cover border border-slate-300" />
                  )}
                </div>
              </div>

            </div>

            <div className="mt-8 flex items-center justify-end space-x-3">
              <button
                type="button"
                onClick={() => setStep('select')}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900"
              >
                Back
              </button>
              <button
                type="submit"
                className="linkedin-btn-primary flex items-center text-xs"
              >
                <span>Save to PostgreSQL & Verify</span>
                <ArrowRight className="w-4 h-4 ml-1.5" />
              </button>
            </div>
          </form>
        )}

        {/* STEP 3: AI VERIFICATION IN PROGRESS */}
        {step === 'verifying' && (
          <div className="p-12 text-center">
            <div className="w-16 h-16 rounded-full bg-blue-100 text-[#0A66C2] mx-auto flex items-center justify-center animate-spin mb-4">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Writing to PostgreSQL Database...</h3>
            <p className="text-xs text-slate-500 mt-1">
              Saving Base64 profile data & running student ID regex verification.
            </p>
          </div>
        )}

        {/* STEP 4: VERIFICATION RESULT */}
        {step === 'success' && (
          <div className="p-8 text-center">
            {aiAnalysis?.status === 'verified' ? (
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-10 h-10" />
              </div>
            ) : (
              <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-10 h-10" />
              </div>
            )}

            <h3 className="text-xl font-bold text-slate-900">
              {aiAnalysis?.status === 'verified' ? 'Account Stored & Verified in PostgreSQL!' : 'Account Stored in PostgreSQL Admin Queue'}
            </h3>

            <div className="mt-4 p-4 bg-slate-50 rounded-xl border border-slate-200 text-left text-xs">
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-slate-700">Database Record:</span>
                <span className="font-mono font-bold text-blue-600">PostgreSQL (uniyo_db)</span>
              </div>
              <p className="text-slate-600 leading-relaxed">
                {aiAnalysis?.reason}
              </p>
            </div>

            <button
              onClick={handleFinish}
              className="mt-6 w-full linkedin-btn-primary py-2.5 text-sm"
            >
              Enter UniYO Workspace
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
