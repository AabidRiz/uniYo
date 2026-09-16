import React, { useState, useEffect } from 'react';
import { Video, Plus, Star, Eye, Trash2, Edit3, X, Save, ExternalLink } from 'lucide-react';
import { api } from '../../../api/client';

export default function ProfCoursesView({ currentUser }) {
  const [videos, setVideos] = useState([]);
  const [editing, setEditing] = useState(null);
  const [draft, setDraft] = useState({ title: '', description: '', videoUrl: '', thumbnailUrl: '', durationMinutes: 30, tags: '', price: 0 });
  const [busy, setBusy] = useState(false);

  const load = async () => {
    try { setVideos(await api.getProfessorVideos(currentUser.id)); }
    catch (e) { console.error(e); }
  };

  useEffect(() => { load(); }, [currentUser.id]);

  const openCreate = () => {
    setEditing('new');
    setDraft({ title: '', description: '', videoUrl: '', thumbnailUrl: '', durationMinutes: 30, tags: '', price: 0 });
  };

  const openEdit = (v) => {
    setEditing(v.id);
    setDraft({
      title: v.title, description: v.description || '',
      videoUrl: v.videoUrl, thumbnailUrl: v.thumbnailUrl || '',
      durationMinutes: v.durationMinutes || 30,
      tags: (v.tags || []).join(', '),
      price: v.price || 0
    });
  };

  const save = async () => {
    if (!draft.title.trim() || !draft.videoUrl.trim()) return alert('Title and video URL required');
    setBusy(true);
    try {
      const payload = {
        title: draft.title.trim(),
        description: draft.description,
        videoUrl: draft.videoUrl.trim(),
        thumbnailUrl: draft.thumbnailUrl.trim() || null,
        durationMinutes: parseInt(draft.durationMinutes, 10) || null,
        tags: draft.tags.split(',').map(t => t.trim()).filter(Boolean),
        price: Math.max(0, parseInt(draft.price, 10) || 0)
      };
      if (editing === 'new') await api.createProfessorVideo(currentUser.id, payload);
      else await api.updateProfessorVideo(currentUser.id, editing, payload);
      setEditing(null);
      await load();
    } catch (e) { alert(e.message); }
    finally { setBusy(false); }
  };

  const del = async (id) => {
    if (!window.confirm('Delete this video?')) return;
    try { await api.deleteProfessorVideo(currentUser.id, id); await load(); }
    catch (e) { alert(e.message); }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex items-center justify-between">
        <div>
          <div className="flex items-center space-x-2 text-blue-600 font-semibold text-xs mb-1">
            <Video className="w-4 h-4" /><span>Teaching Videos & Mini-Courses</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900">Your Published Content</h2>
          <p className="text-xs text-slate-500 mt-1">Publish mini-courses and lecture modules visible to all verified students.</p>
        </div>
        <button onClick={openCreate} className="linkedin-btn-primary py-2 px-4 text-xs flex items-center bg-blue-600 hover:bg-blue-700">
          <Plus className="w-4 h-4 mr-1.5" />Publish Video
        </button>
      </div>

      {videos.length === 0 ? (
        <div className="text-center py-16 text-slate-400 text-xs">No videos published yet.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {videos.map(v => (
            <div key={v.id} className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
              <div className="relative h-48 bg-slate-900">
                {v.thumbnailUrl ? (
                  <img src={v.thumbnailUrl} alt="" className="w-full h-full object-cover opacity-80" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-white/30 text-xs">No thumbnail</div>
                )}
                <a href={v.videoUrl} target="_blank" rel="noreferrer"
                  className="absolute inset-0 flex items-center justify-center">
                  <div className="w-12 h-12 rounded-full bg-white/90 text-blue-600 flex items-center justify-center shadow-lg hover:scale-110 transition-transform">
                    <ExternalLink className="w-5 h-5" />
                  </div>
                </a>
                {v.durationMinutes && (
                  <span className="absolute bottom-2 right-2 bg-slate-900/80 text-white text-[10px] font-mono px-2 py-0.5 rounded">
                    {v.durationMinutes} min
                  </span>
                )}
              </div>
              <div className="p-5">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-bold text-sm text-slate-900 line-clamp-2">{v.title}</h3>
                    <p className="text-xs text-slate-600 mt-1 line-clamp-2">{v.description}</p>
                  </div>
                  <div className="flex items-center space-x-1 ml-2">
                    <button onClick={() => openEdit(v)} className="text-slate-500 hover:text-blue-600 p-1.5"><Edit3 className="w-4 h-4" /></button>
                    <button onClick={() => del(v.id)} className="text-red-500 hover:bg-red-50 p-1.5 rounded"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {(v.tags || []).map((t, i) => (
                    <span key={i} className="text-[10px] bg-blue-50 text-blue-700 font-semibold px-2 py-0.5 rounded-full">{t}</span>
                  ))}
                </div>
                <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-slate-500">
                  <span className="flex items-center"><Eye className="w-4 h-4 mr-1 text-slate-400" />{v.views} views</span>
                  <span className="flex items-center text-amber-500">
                    <Star className="w-3.5 h-3.5 fill-amber-400 mr-1" />{v.avgRating || 0}
                    <span className="text-slate-400 ml-1 font-normal">({v.impressions.length})</span>
                  </span>
                </div>
                {v.impressions.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-slate-100 space-y-1.5">
                    <span className="text-[10px] font-semibold text-slate-500 uppercase">Student Impressions</span>
                    {v.impressions.slice(0, 3).map(imp => (
                      <div key={imp.id} className="bg-slate-50 p-2 rounded-lg text-[10px] text-slate-700">
                        <span className="font-bold">{imp.studentName}:</span> "{imp.comment}"
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold">{editing === 'new' ? 'Publish New Video' : 'Edit Video'}</h3>
              <button onClick={() => setEditing(null)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-3">
              <input placeholder="Title" value={draft.title} onChange={e => setDraft({ ...draft, title: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg" />
              <textarea placeholder="Description" rows={3} value={draft.description} onChange={e => setDraft({ ...draft, description: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg" />
              <input placeholder="Video URL (YouTube, Vimeo, Drive…)" value={draft.videoUrl} onChange={e => setDraft({ ...draft, videoUrl: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg" />
              <input placeholder="Thumbnail URL (optional)" value={draft.thumbnailUrl} onChange={e => setDraft({ ...draft, thumbnailUrl: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg" />
              <div className="grid grid-cols-2 gap-3">
                <input type="number" placeholder="Duration (min)" value={draft.durationMinutes} onChange={e => setDraft({ ...draft, durationMinutes: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg" />
                <input type="number" min="0" placeholder="Price (LKR, 0 = free)" value={draft.price} onChange={e => setDraft({ ...draft, price: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg" />
              </div>
              <input placeholder="Tags, comma sep" value={draft.tags} onChange={e => setDraft({ ...draft, tags: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg" />
              <div className="flex justify-end space-x-2 pt-3">
                <button onClick={() => setEditing(null)} className="px-4 py-2 text-xs font-semibold text-slate-600">Cancel</button>
                <button onClick={save} disabled={busy} className="linkedin-btn-primary py-2 px-5 text-xs flex items-center disabled:opacity-50">
                  <Save className="w-3.5 h-3.5 mr-1.5" />{busy ? 'Saving…' : 'Save'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}