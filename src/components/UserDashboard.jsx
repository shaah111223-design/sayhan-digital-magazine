import React, { useState, useEffect } from 'react';
import { 
  PlusCircle, BookOpen, Clock, CheckCircle2, AlertTriangle, 
  Trash2, Edit3, QrCode, FileText, Shield, Eye, Layers 
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function UserDashboard({ onNewSubmission, onEditSubmission, onReadMagazine, onShareMagazine }) {
  const { user, token } = useAuth();
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);

  const fetchSubmissions = () => {
    if (!token) return;
    setLoading(true);
    fetch('/api/magazines/user', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        setSubmissions(Array.isArray(data) ? data : []);
      })
      .catch(err => console.error('Failed to fetch user submissions:', err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchSubmissions();
  }, [token]);

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this pending submission? This action cannot be undone.')) {
      return;
    }

    setDeletingId(id);
    try {
      const res = await fetch(`/api/magazines/user/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setSubmissions(prev => prev.filter(s => s.id !== id));
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to delete submission');
      }
    } catch (e) {
      alert('Error deleting submission: ' + e.message);
    } finally {
      setDeletingId(null);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'PUBLISHED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-yellow-500/20 text-yellow-400 border border-yellow-500/50">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Published (Live in Public Library)
          </span>
        );
      case 'APPROVED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/50">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Approved (Awaiting Super Admin Publication)
          </span>
        );
      case 'PENDING_REVIEW':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/50 animate-pulse">
            <Clock className="w-3.5 h-3.5" />
            Pending Super Admin Review
          </span>
        );
      case 'REJECTED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-red-500/20 text-red-400 border border-red-500/50">
            <AlertTriangle className="w-3.5 h-3.5" />
            Revisions Requested
          </span>
        );
      case 'DRAFT':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-zinc-800 text-zinc-300 border border-zinc-700">
            <FileText className="w-3.5 h-3.5" />
            Draft (Private)
          </span>
        );
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      
      {/* Header Profile Bar */}
      <div className="bg-[#0e1014] border border-zinc-800/90 rounded-2xl p-6 sm:p-8 mb-8 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-xl">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-yellow-400 to-yellow-600 p-[2px] shadow-gold-glow">
            <div className="w-full h-full bg-[#08090b] rounded-[14px] flex items-center justify-center font-serif-luxury text-2xl font-black text-yellow-400">
              {user?.full_name ? user.full_name[0].toUpperCase() : 'U'}
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-serif-luxury text-2xl font-bold text-white">{user?.full_name}</h1>
              <span className="bg-yellow-500/10 text-yellow-400 border border-yellow-500/30 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                {user?.role === 'ADMIN' ? 'SUPER ADMIN' : 'AUTHOR ACCOUNT'}
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-1">
              {user?.email} • {user?.phone}
            </p>
          </div>
        </div>

        <button
          onClick={onNewSubmission}
          className="px-6 py-3 bg-yellow-500 hover:bg-yellow-400 text-black font-bold text-sm rounded-xl shadow-gold-glow transition-all flex items-center justify-center gap-2"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Submit New Magazine</span>
        </button>
      </div>

      {/* Isolation Notice Banner */}
      <div className="bg-[#12141a] border border-yellow-500/20 rounded-xl p-4 mb-8 flex items-start gap-3 text-xs text-zinc-300">
        <Shield className="w-5 h-5 text-yellow-500 shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          <strong className="text-yellow-400">Your Private Vault:</strong> All submissions shown below are isolated in your personal storage folder. No visitor or external user can access or view unapproved drafts. Super Admin Sayhan personally reviews each submission before authorizing publication to the public library.
        </p>
      </div>

      {/* Submissions Section */}
      <div className="space-y-6">
        <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
          <div>
            <h2 className="font-serif-luxury text-xl font-bold text-white tracking-wide">
              Your Submissions ({submissions.length})
            </h2>
            <p className="text-xs text-zinc-400">Track curation progress, editorial feedback, and live status</p>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-16">
            <div className="w-8 h-8 border-3 border-yellow-500/30 border-t-yellow-500 rounded-full animate-spin mx-auto mb-3"></div>
            <p className="text-xs text-zinc-500">Loading your private vault...</p>
          </div>
        ) : submissions.length === 0 ? (
          <div className="text-center py-20 bg-[#0d0f13] border border-dashed border-zinc-800 rounded-2xl p-8">
            <BookOpen className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
            <h3 className="font-serif-luxury text-lg font-bold text-white mb-1">No Submissions Yet</h3>
            <p className="text-xs text-zinc-400 max-w-sm mx-auto mb-6">
              You haven't submitted any magazines yet. Upload your PDF or image pages to have your work curated for the public library.
            </p>
            <button
              onClick={onNewSubmission}
              className="px-5 py-2.5 bg-yellow-500 text-black font-bold text-xs rounded-xl hover:bg-yellow-400 transition-colors"
            >
              Start First Submission
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {submissions.map((sub) => {
              const coverUrl = sub.cover_image
                ? sub.cover_image.includes('_cover.svg')
                  ? `/samples/${sub.cover_image}`
                  : `/api/files/magazine/${sub.id}/cover?token=${token}`
                : null;

              return (
                <div
                  key={sub.id}
                  className="bg-[#0e1014] border border-zinc-800/90 rounded-2xl p-5 hover:border-zinc-700 transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-6"
                >
                  {/* Left: Thumbnail & Info */}
                  <div className="flex items-start gap-4 flex-grow">
                    <div className="w-16 h-22 sm:w-20 sm:h-28 rounded-xl overflow-hidden bg-zinc-950 border border-zinc-800 shrink-0">
                      {coverUrl ? (
                        <img src={coverUrl} alt={sub.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-zinc-600 text-xs">
                          No Cover
                        </div>
                      )}
                    </div>

                    <div className="space-y-1.5 flex-grow">
                      <div className="flex flex-wrap items-center gap-2">
                        {getStatusBadge(sub.status)}
                        <span className="text-xs text-zinc-500">
                          {sub.category_name || 'Academy'}
                        </span>
                        <span className="text-xs text-zinc-600">•</span>
                        <span className="text-xs text-zinc-500 flex items-center gap-1">
                          <Layers className="w-3 h-3 text-yellow-500" />
                          {sub.page_count} pages
                        </span>
                      </div>

                      <h3 className="font-serif-luxury text-lg font-bold text-white line-clamp-1">
                        {sub.title}
                      </h3>

                      <p className="text-xs text-zinc-400 line-clamp-2 max-w-2xl leading-relaxed">
                        {sub.description || 'No description provided.'}
                      </p>

                      {/* Feedback from Admin if rejected or notes */}
                      {sub.admin_feedback && (
                        <div className="mt-2 p-2.5 bg-yellow-500/10 border border-yellow-500/30 rounded-lg text-xs text-yellow-300">
                          <strong>Admin Sayhan Feedback:</strong> {sub.admin_feedback}
                        </div>
                      )}

                      <p className="text-[11px] text-zinc-500">
                        Updated {new Date(sub.updated_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div className="flex items-center gap-2 self-end md:self-center shrink-0">
                    {sub.status === 'PUBLISHED' ? (
                      <>
                        <button
                          onClick={() => onShareMagazine(sub)}
                          className="px-3.5 py-2 bg-zinc-800 hover:bg-zinc-700 text-yellow-400 rounded-xl text-xs font-semibold flex items-center gap-1.5 border border-zinc-700"
                        >
                          <QrCode className="w-4 h-4" />
                          <span>QR & Share</span>
                        </button>
                        <button
                          onClick={() => onReadMagazine(sub)}
                          className="px-4 py-2 bg-yellow-500 text-black hover:bg-yellow-400 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm"
                        >
                          <BookOpen className="w-4 h-4" />
                          <span>Read Live</span>
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => onEditSubmission(sub)}
                          className="px-3.5 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 border border-zinc-700"
                          title="Edit Pending Submission"
                        >
                          <Edit3 className="w-3.5 h-3.5 text-yellow-500" />
                          <span>Edit</span>
                        </button>

                        <button
                          disabled={deletingId === sub.id}
                          onClick={() => handleDelete(sub.id)}
                          className="p-2 text-zinc-400 hover:text-red-400 hover:bg-zinc-800 rounded-xl transition-colors disabled:opacity-30"
                          title="Delete Submission"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>

                </div>
              );
            })}
          </div>
        )}

      </div>

    </div>
  );
}

