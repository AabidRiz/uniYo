import React from 'react';
import { DollarSign, Award, CheckCircle2, Sparkles } from 'lucide-react';

export default function BizSponsorshipsView({ currentUser }) {
  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-6 font-sans">
      
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
        <div className="flex items-center space-x-2 text-amber-600 font-semibold text-xs mb-1">
          <Award className="w-4 h-4" />
          <span>Dedicated Campus Event Sponsorship Portal</span>
        </div>
        <h2 className="text-xl font-bold text-slate-900">Sponsor Sri Lankan Hackathons & Symposia</h2>
        <p className="text-xs text-slate-500 mt-1">
          Promote your enterprise brand and offer prizes at SLIIT, Moratuwa, and Colombo campus hackathons.
        </p>
      </div>

      {/* Packages Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4 text-center">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Silver Sponsor</span>
          <div className="text-2xl font-black text-slate-900 font-mono">LKR 100,000</div>
          <ul className="text-xs text-slate-600 space-y-2 text-left pt-2 border-t border-slate-100">
            <li className="flex items-center"><CheckCircle2 className="w-4 h-4 text-emerald-600 mr-2" /> Logo on campus event feed</li>
            <li className="flex items-center"><CheckCircle2 className="w-4 h-4 text-emerald-600 mr-2" /> Mention in hackathon emails</li>
          </ul>
          <button className="w-full linkedin-btn-primary py-2 text-xs bg-amber-600 hover:bg-amber-700">
            Sponsor Silver Tier
          </button>
        </div>

        <div className="bg-white border-2 border-amber-500 rounded-2xl p-6 shadow-md space-y-4 text-center relative">
          <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-500 text-white font-bold text-[10px] px-3 py-0.5 rounded-full uppercase">
            Most Popular
          </span>
          <span className="text-xs font-bold text-amber-700 uppercase tracking-wider block">Gold Sponsor</span>
          <div className="text-2xl font-black text-slate-900 font-mono">LKR 250,000</div>
          <ul className="text-xs text-slate-600 space-y-2 text-left pt-2 border-t border-slate-100">
            <li className="flex items-center"><CheckCircle2 className="w-4 h-4 text-emerald-600 mr-2" /> Featured banner on all student feeds</li>
            <li className="flex items-center"><CheckCircle2 className="w-4 h-4 text-emerald-600 mr-2" /> Keynote judge slot at hackathons</li>
            <li className="flex items-center"><CheckCircle2 className="w-4 h-4 text-emerald-600 mr-2" /> Direct access to intern applicants</li>
          </ul>
          <button className="w-full linkedin-btn-primary py-2 text-xs bg-amber-600 hover:bg-amber-700">
            Sponsor Gold Tier
          </button>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4 text-center">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Platinum Title Sponsor</span>
          <div className="text-2xl font-black text-slate-900 font-mono">LKR 500,000</div>
          <ul className="text-xs text-slate-600 space-y-2 text-left pt-2 border-t border-slate-100">
            <li className="flex items-center"><CheckCircle2 className="w-4 h-4 text-emerald-600 mr-2" /> Title Naming Rights on Hackathon</li>
            <li className="flex items-center"><CheckCircle2 className="w-4 h-4 text-emerald-600 mr-2" /> Exclusive campus recruiting booth</li>
          </ul>
          <button className="w-full linkedin-btn-primary py-2 text-xs bg-amber-600 hover:bg-amber-700">
            Sponsor Title Tier
          </button>
        </div>
      </div>

    </div>
  );
}
