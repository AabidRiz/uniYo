import React, { useState, useEffect } from 'react';
import { Bot, Send, Terminal, X, Users, ShieldCheck, Sparkles, MessageSquare } from 'lucide-react';

const AGENT_BY_ROLE = {
  student: {
    key: 'collaborator',
    name: 'AI Collaborator',
    icon: Users,
    color: 'text-blue-500',
    greeting: 'Hi! I help you find cross-university project teammates, match skills, and draft collaboration invites. Ask me anything.'
  },
  professor: {
    key: 'mentor',
    name: 'AI Faculty Assistant',
    icon: MessageSquare,
    color: 'text-indigo-500',
    greeting: 'I help manage your office hours, draft advisement notes, and organize student Q&A sessions.'
  },
  business: {
    key: 'investment',
    name: 'AI Investment Agent',
    icon: Sparkles,
    color: 'text-amber-500',
    greeting: 'I evaluate student projects for investment suitability and generate pitch memos.'
  },
  admin: {
    key: 'verification',
    name: 'AI Verification Agent',
    icon: ShieldCheck,
    color: 'text-emerald-500',
    greeting: 'I inspect ID submissions, validate student ID formats, and flag suspicious registrations.'
  }
};

export default function AIAssistantDrawer({ isOpen, onClose, currentUser }) {
  const agent = AGENT_BY_ROLE[currentUser?.role] || AGENT_BY_ROLE.student;
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [thinking, setThinking] = useState(false);

  useEffect(() => {
    setMessages([{ sender: 'agent', text: agent.greeting, toolsCalled: [] }]);
  }, [agent.key]);

  if (!isOpen) return null;

  const send = (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    const userMsg = { sender: 'user', text: input.trim() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setThinking(true);

    setTimeout(() => {
      let reply, tools = [];
      if (agent.key === 'collaborator') {
        reply = `Scanning verified students from Sri Lankan universities matching your project needs…\n\nTop matches found:\n• Nethmi Silva (Moratuwa) — Robotics, PyTorch, ROS2\n• Dilshan Fernando (Colombo) — LLMs, NLP, FastAPI\n\nWould you like me to draft collaboration invites?`;
        tools = ['search_student_profiles', 'filter_verified_only', 'rank_skill_fit'];
      } else if (agent.key === 'mentor') {
        reply = `I can help you draft advisement notes or prepare office-hour summaries. What topic are you working on?`;
        tools = ['load_faculty_notes'];
      } else if (agent.key === 'investment') {
        reply = `Reviewing student projects seeking investment. Two stand out:\n• AgriSense LK — Traction 92/100, IoT + ML for tea estates\n• MedAssist AI — Traction 88/100, clinical decision support`;
        tools = ['calculate_traction_score', 'match_investor_thesis'];
      } else {
        reply = `Verification queue scan complete. 2 pending student IDs need manual review. ID card photos are attached to each queue row.`;
        tools = ['scan_verification_queue'];
      }
      setMessages(prev => [...prev, { sender: 'agent', text: reply, toolsCalled: tools }]);
      setThinking(false);
    }, 1100);
  };

  const Icon = agent.icon;

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full max-w-lg bg-white shadow-2xl border-l border-slate-200 flex flex-col">
      <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Bot className="w-5 h-5 text-blue-400" />
          <div>
            <h3 className="font-bold text-sm">{agent.name}</h3>
            <p className="text-[10px] text-slate-400">Role-scoped assistant</p>
          </div>
        </div>
        <button onClick={onClose} className="p-1 text-slate-400 hover:text-white rounded-full hover:bg-slate-800">
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="p-3 bg-blue-50 border-b border-blue-100 flex items-center space-x-2 text-xs">
        <Icon className={`w-4 h-4 ${agent.color}`} />
        <span className="font-bold text-slate-900">{agent.name}</span>
      </div>

      <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-slate-50/50">
        {messages.map((m, i) => (
          <div key={i} className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}>
            <div className={`p-3 rounded-2xl max-w-[85%] text-xs shadow-xs ${
              m.sender === 'user' ? 'bg-[#0A66C2] text-white rounded-br-none'
              : 'bg-white border border-slate-200 text-slate-900 rounded-bl-none'
            }`}>
              <p className="whitespace-pre-line">{m.text}</p>
            </div>
            {m.toolsCalled && m.toolsCalled.length > 0 && (
              <div className="mt-1.5 p-2 bg-slate-900 text-slate-200 rounded-lg text-[10px] font-mono max-w-[85%]">
                <span className="text-amber-400 font-bold">⚡ Tools:</span>
                <ul className="mt-1 space-y-0.5">
                  {m.toolsCalled.map((t, j) => (
                    <li key={j}><Terminal className="w-3 h-3 text-blue-400 mr-1 inline" />{t}()</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ))}
        {thinking && (
          <div className="flex items-center space-x-2 text-xs text-slate-400 italic">
            <Bot className="w-4 h-4 animate-spin text-blue-600" />
            <span>Agent reasoning…</span>
          </div>
        )}
      </div>

      <form onSubmit={send} className="p-3 bg-white border-t border-slate-200 flex items-center space-x-2">
        <input type="text" value={input} onChange={e => setInput(e.target.value)}
          placeholder={`Ask the ${agent.name}…`}
          className="flex-1 px-4 py-2 text-xs border border-slate-300 rounded-full focus:outline-none focus:border-blue-600" />
        <button type="submit" className="p-2 bg-[#0A66C2] text-white rounded-full hover:bg-blue-700">
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}