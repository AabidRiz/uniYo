import React, { useState, useRef } from 'react';
import {
  ThumbsUp, MessageSquare, Share2, Image as ImageIcon, Send,
  Sparkles, Paperclip, AtSign, X, Trash2, Edit3, Save
} from 'lucide-react';
import Badge from '../common/Badge';

function timeAgo(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const diff = (Date.now() - d.getTime()) / 1000;
  if (diff < 60) return 'Just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  return `${Math.floor(diff / 86400)}d`;
}

export default function FeedView({
  currentUser, posts, users,
  onAddPost, onDeletePost, onLikePost, onAddComment, onDeleteComment,
  onNavigateTab, onOpenUser
}) {
  const [text, setText] = useState('');
  const [imageBase64, setImageBase64] = useState(null);
  const [attachment, setAttachment] = useState(null);
  const [tagged, setTagged] = useState([]);
  const [showTagPicker, setShowTagPicker] = useState(false);
  const [tagQuery, setTagQuery] = useState('');
  const [commentDraft, setCommentDraft] = useState({});
  const [busy, setBusy] = useState(false);
  const [likedPosts, setLikedPosts] = useState(new Set());

  const imgInputRef = useRef(null);
  const fileInputRef = useRef(null);

  const fileToBase64 = (file) =>
    new Promise((res, rej) => {
      const r = new FileReader();
      r.onloadend = () => res(r.result);
      r.onerror = rej;
      r.readAsDataURL(file);
    });

  const tagCandidates = users
    .filter(u => u.id !== currentUser.id && u.role !== 'admin')
    .filter(
      u =>
        !tagQuery.trim() ||
        u.name.toLowerCase().includes(tagQuery.toLowerCase()) ||
        (u.university || '').toLowerCase().includes(tagQuery.toLowerCase())
    );

  const extractTags = (str) => {
    const matches = str.match(/#[\w-]+/g);
    return matches && matches.length ? matches : ['#UniYO'];
  };

  const handlePost = async () => {
    if (!text.trim() && !imageBase64 && !attachment) return;
    setBusy(true);
    try {
      await onAddPost({
        authorId: currentUser.id,
        authorName: currentUser.name,
        authorUniversity: currentUser.university || currentUser.university_name || 'Sri Lanka University',
        authorAvatarBase64: currentUser.avatar || currentUser.avatar_base64,
        authorRole: currentUser.role,
        authorVerified: currentUser.verified,
        content: text.trim(),
        imageBase64,
        attachmentBase64: attachment?.base64,
        attachmentName: attachment?.name,
        tags: extractTags(text),
        taggedUserIds: tagged.map(t => t.id)
      });
      setText('');
      setImageBase64(null);
      setAttachment(null);
      setTagged([]);
    } catch (err) {
      alert('Failed to post: ' + err.message);
    } finally {
      setBusy(false);
    }
  };

  const toggleLike = (postId) => {
    setLikedPosts(prev => {
      const next = new Set(prev);
      if (next.has(postId)) {
        next.delete(postId);
      } else {
        next.add(postId);
      }
      return next;
    });
    onLikePost(postId);
  };

  const handleShare = async (post) => {
    const url = `${window.location.origin}/#post-${post.id}`;
    try {
      await navigator.clipboard.writeText(url);
      alert('Post link copied to clipboard.');
    } catch {
      prompt('Copy this link:', url);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="space-y-4">
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
          <div className="h-16 bg-gradient-to-r from-blue-600 to-indigo-700" />
          <div className="px-4 pb-4 pt-0 text-center relative">
            <img
              src={currentUser?.avatar || currentUser?.avatar_base64}
              alt={currentUser?.name}
              className="w-16 h-16 rounded-full border-4 border-white shadow-md mx-auto -mt-8 object-cover"
            />
            <div className="mt-2 flex items-center justify-center space-x-1">
              <button
                onClick={() => onOpenUser(currentUser.id)}
                className="font-bold text-slate-900 text-sm hover:text-blue-600 hover:underline"
              >
                {currentUser?.name}
              </button>
              {currentUser?.verified && <Badge type="verified" />}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">{currentUser?.university || currentUser?.university_name}</p>
            <p className="text-[11px] text-slate-600 italic mt-2 line-clamp-3">
              {currentUser?.bio}
            </p>

            <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-3 text-center text-xs">
              <div>
                <span className="block font-bold text-slate-900">
                  {currentUser?.stats?.connections ?? (currentUser?.verified ? 12 : 0)}
                </span>
                <span className="text-[10px] text-slate-400">Network</span>
              </div>
              <div>
                <span className="block font-bold text-slate-900">
                  {currentUser?.stats?.projects ?? 0}
                </span>
                <span className="text-[10px] text-slate-400">Projects</span>
              </div>
              <div>
                <span className="block font-bold text-slate-900">
                  {currentUser?.stats?.posts ?? posts.filter(p => p.author?.id === currentUser.id).length}
                </span>
                <span className="text-[10px] text-slate-400">Posts</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="lg:col-span-2 space-y-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="flex items-start space-x-3">
            <img
              src={currentUser?.avatar || currentUser?.avatar_base64}
              alt=""
              className="w-10 h-10 rounded-full object-cover border"
            />
            <div className="flex-1">
              <textarea
                value={text}
                onChange={e => setText(e.target.value)}
                placeholder="Share research, ask for project partners, or announce news..."
                rows={3}
                className="w-full bg-slate-100 rounded-xl px-4 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-500 resize-none"
              />

              {imageBase64 && (
                <div className="relative mt-2 rounded-lg overflow-hidden border border-slate-200 max-h-48">
                  <img src={imageBase64} alt="Preview" className="w-full h-full object-cover" />
                  <button
                    onClick={() => setImageBase64(null)}
                    className="absolute top-2 right-2 bg-slate-900/70 text-white p-1 rounded-full hover:bg-slate-900"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              {attachment && (
                <div className="mt-2 flex items-center justify-between p-2 border border-slate-200 rounded-lg bg-slate-50 text-xs">
                  <div className="flex items-center space-x-2">
                    <Paperclip className="w-4 h-4 text-amber-600" />
                    <span className="font-semibold text-slate-800">{attachment.name}</span>
                  </div>
                  <button
                    onClick={() => setAttachment(null)}
                    className="text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              {tagged.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {tagged.map(t => (
                    <span
                      key={t.id}
                      className="inline-flex items-center text-[10px] font-semibold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full"
                    >
                      @{t.name}
                      <button
                        onClick={() => setTagged(tagged.filter(x => x.id !== t.id))}
                        className="ml-1 text-blue-500 hover:text-blue-700"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <button
                onClick={() => imgInputRef.current?.click()}
                className="flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs text-slate-600 hover:bg-slate-100"
              >
                <ImageIcon className="w-4 h-4 text-blue-600" />
                <span>Media</span>
              </button>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs text-slate-600 hover:bg-slate-100"
              >
                <Paperclip className="w-4 h-4 text-emerald-600" />
                <span>File</span>
              </button>
            </div>

            <button
              onClick={handlePost}
              disabled={busy || (!text.trim() && !imageBase64 && !attachment)}
              className="linkedin-btn-primary px-4 py-1.5 text-xs font-semibold flex items-center space-x-1 disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{busy ? 'Posting…' : 'Post'}</span>
            </button>
          </div>

          <input
            ref={imgInputRef}
            type="file"
            accept="image/*"
            hidden
            onChange={async e => {
              const f = e.target.files[0];
              if (!f) return;
              const b64 = await fileToBase64(f);
              setImageBase64(b64);
              e.target.value = '';
            }}
          />
          <input
            ref={fileInputRef}
            type="file"
            hidden
            onChange={async e => {
              const f = e.target.files[0];
              if (!f) return;
              const b64 = await fileToBase64(f);
              setAttachment({ base64: b64, name: f.name });
              e.target.value = '';
            }}
          />
        </div>

        {posts.map(post => (
          <PostCard
            key={post.id}
            post={post}
            currentUser={currentUser}
            isLiked={likedPosts.has(post.id)}
            commentDraft={commentDraft[post.id] || ''}
            setCommentDraft={v => setCommentDraft({ ...commentDraft, [post.id]: v })}
            onLike={() => toggleLike(post.id)}
            onDelete={() => onDeletePost(post.id)}
            onAddComment={c => onAddComment(post.id, c)}
            onDeleteComment={cid => onDeleteComment(post.id, cid)}
            onShare={() => handleShare(post)}
            onOpenUser={onOpenUser}
          />
        ))}
      </div>
    </div>
  );
}

function PostCard({
  post,
  currentUser,
  isLiked,
  commentDraft,
  setCommentDraft,
  onLike,
  onDelete,
  onAddComment,
  onDeleteComment,
  onShare,
  onOpenUser
}) {
  const [showComments, setShowComments] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState(post.content);
  const [saving, setSaving] = useState(false);

  const isOwner = post.author?.id === currentUser.id;

  const saveEdit = async () => {
    if (!editText.trim()) return;
    setSaving(true);
    try {
      const res = await fetch(`http://localhost:5000/api/posts/${post.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: editText.trim() })
      });
      if (!res.ok) throw new Error('Update failed');
      post.content = editText.trim();
      setEditing(false);
    } catch (e) {
      alert(e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = () => {
    if (!window.confirm('Delete this post permanently?')) return;
    onDelete();
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
      <div className="flex items-start justify-between">
        <div className="flex items-center space-x-3">
          <button onClick={() => onOpenUser(post.author?.id)}>
            <img
              src={post.author?.avatar}
              alt=""
              className="w-10 h-10 rounded-full object-cover border hover:ring-2 hover:ring-blue-500"
            />
          </button>
          <div>
            <div className="flex items-center space-x-1">
              <button
                onClick={() => onOpenUser(post.author?.id)}
                className="font-bold text-slate-900 text-xs hover:text-blue-600 hover:underline"
              >
                {post.author?.name || 'Student Member'}
              </button>
              {post.author?.verified && <Badge type="verified" />}
            </div>
            <p className="text-[11px] text-slate-500">
              {post.author?.university || 'Sri Lanka University'} • {timeAgo(post.createdAt)}
              {editing && <span className="ml-2 italic text-blue-600">editing…</span>}
            </p>
          </div>
        </div>

        {isOwner && !editing && (
          <div className="flex items-center space-x-1">
            <button
              onClick={() => { setEditing(true); setEditText(post.content); }}
              className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
              title="Edit post"
            >
              <Edit3 className="w-4 h-4" />
            </button>
            <button
              onClick={handleDelete}
              className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg"
              title="Delete post"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {editing ? (
        <div className="mt-3">
          <textarea
            value={editText}
            onChange={e => setEditText(e.target.value)}
            rows={3}
            className="w-full bg-slate-100 rounded-xl px-4 py-2 text-xs text-slate-900 focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-500 resize-none"
          />
          <div className="mt-2 flex items-center justify-end space-x-2">
            <button
              onClick={() => setEditing(false)}
              className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900"
            >
              Cancel
            </button>
            <button
              onClick={saveEdit}
              disabled={saving || !editText.trim()}
              className="linkedin-btn-primary py-1.5 px-4 text-xs flex items-center disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5 mr-1" />
              {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </div>
      ) : (
        <>
          {post.content && (
            <p className="mt-3 text-xs text-slate-800 leading-relaxed whitespace-pre-line">
              {post.content}
            </p>
          )}

          {post.image && (
            <div className="mt-3 rounded-lg overflow-hidden border border-slate-100 max-h-96">
              <img src={post.image} alt="" className="w-full h-full object-cover" />
            </div>
          )}

          {post.attachment && (
            <a
              href={post.attachment.base64}
              download={post.attachment.name}
              className="mt-3 flex items-center space-x-2 p-2 border border-slate-200 rounded-lg bg-slate-50 hover:bg-slate-100 text-xs"
            >
              <Paperclip className="w-4 h-4 text-amber-600" />
              <span className="font-semibold text-slate-800">{post.attachment.name}</span>
            </a>
          )}

          <div className="mt-3 flex flex-wrap gap-1.5">
            {post.tags?.map((t, i) => (
              <span
                key={i}
                className="text-[10px] font-semibold text-[#0A66C2] bg-blue-50 px-2 py-0.5 rounded-full"
              >
                {t}
              </span>
            ))}
          </div>
        </>
      )}

      <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
        <span>{post.likes + (isLiked ? 1 : 0)} likes</span>
        <button
          onClick={() => setShowComments(v => !v)}
          className="hover:underline"
        >
          {post.commentsCount} comments
        </button>
      </div>

      <div className="mt-2 pt-2 border-t border-slate-100 grid grid-cols-3 text-center text-xs font-semibold text-slate-600">
        <button
          onClick={onLike}
          className={`flex items-center justify-center space-x-1.5 py-1.5 rounded-lg transition-colors ${
            isLiked ? 'text-[#0A66C2] bg-blue-50 font-bold' : 'hover:bg-slate-50'
          }`}
        >
          <ThumbsUp className={`w-4 h-4 ${isLiked ? 'fill-[#0A66C2]' : ''}`} />
          <span>Like</span>
        </button>
        <button
          onClick={() => setShowComments(v => !v)}
          className="flex items-center justify-center space-x-1.5 py-1.5 rounded-lg hover:bg-slate-50"
        >
          <MessageSquare className="w-4 h-4" />
          <span>Comment</span>
        </button>
        <button
          onClick={onShare}
          className="flex items-center justify-center space-x-1.5 py-1.5 rounded-lg hover:bg-slate-50"
        >
          <Share2 className="w-4 h-4" />
          <span>Share</span>
        </button>
      </div>

      {showComments && (
        <div className="mt-3 pt-3 border-t border-slate-100 space-y-2">
          {(post.comments || []).map(c => (
            <div key={c.id} className="flex items-start space-x-2">
              <button onClick={() => onOpenUser(c.authorId)}>
                <img
                  src={c.authorAvatar || 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40"><circle cx="20" cy="20" r="20" fill="%230A66C2"/><circle cx="20" cy="15" r="8" fill="%23ffffff"/><path d="M8,35 C8,27 14,24 20,24 C26,24 32,27 32,35 Z" fill="%23ffffff"/></svg>'}
                  alt=""
                  className="w-7 h-7 rounded-full object-cover border hover:ring-2 hover:ring-blue-500"
                />
              </button>
              <div className="flex-1 bg-slate-50 p-2 rounded-lg">
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => onOpenUser(c.authorId)}
                    className="text-[11px] font-bold text-slate-900 hover:text-blue-600 hover:underline"
                  >
                    {c.authorName || 'Student Member'}
                  </button>
                  {c.authorId === currentUser.id && (
                    <button
                      onClick={() => onDeleteComment(c.id)}
                      className="text-[10px] text-red-500 hover:underline"
                    >
                      Delete
                    </button>
                  )}
                </div>
                <p className="text-xs text-slate-700 mt-0.5">{c.content}</p>
              </div>
            </div>
          ))}

          <div className="flex items-center space-x-2 pt-1">
            <img
              src={currentUser.avatar || currentUser.avatar_base64}
              alt=""
              className="w-7 h-7 rounded-full object-cover border"
            />
            <input
              value={commentDraft}
              onChange={e => setCommentDraft(e.target.value)}
              placeholder="Write a comment…"
              className="flex-1 bg-slate-100 rounded-full px-3 py-1.5 text-xs focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={() => {
                if (commentDraft.trim()) {
                  onAddComment(commentDraft.trim());
                  setCommentDraft('');
                }
              }}
              className="p-1.5 bg-[#0A66C2] text-white rounded-full hover:bg-blue-700"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}