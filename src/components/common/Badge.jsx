import React from 'react';
import { CheckCircle2, ShieldCheck, Award, Briefcase, GraduationCap } from 'lucide-react';

export default function Badge({ type = 'student', text = '', size = 'sm' }) {
  if (type === 'verified') {
    return (
      <span className="inline-flex items-center text-blue-600 font-semibold" title="University Verified User">
        <CheckCircle2 className="w-4 h-4 fill-blue-600 text-white inline-block ml-1" />
      </span>
    );
  }

  const styles = {
    student: 'bg-blue-50 text-blue-700 border-blue-200',
    professor: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    business: 'bg-amber-50 text-amber-800 border-amber-200',
    admin: 'bg-slate-800 text-white border-slate-700',
    tag: 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
  };

  const icons = {
    student: <GraduationCap className="w-3 h-3 mr-1" />,
    professor: <Award className="w-3 h-3 mr-1" />,
    business: <Briefcase className="w-3 h-3 mr-1" />,
    admin: <ShieldCheck className="w-3 h-3 mr-1 text-emerald-400" />
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${styles[type] || styles.tag}`}>
      {icons[type] || null}
      {text || type.toUpperCase()}
    </span>
  );
}
