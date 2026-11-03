import React, { useState, useEffect } from 'react';
import { 
  X, CheckCircle, XCircle, Globe, Shield, Phone, Mail, 
  Layers, User, Calendar, MessageSquare, AlertCircle, Eye 
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function AdminReviewModal({ submissionId, isOpen, onClose, onActionComplete }) {
  const { token } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activePageIndex, setActivePageIndex] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [processing, setProcessing] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (submissionId && isOpen) {
      setLoading(true);
      fetch(`/api/admin/submissions/${submissionId}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(res => res.json())
        .then(resData => {
          setData(resData);
          setFeedback(resData.magazine?.admin_feedback || '');
        })
        .catch(err => setError(err.message))
        .finally(() => setLoading(false));
    }
  }, [submissionId, isOpen, token]);

  if (!isOpen) return null;

  const handleAction = async (action) => {
    setProcessing(true);
    setError('');
    setMessage('');

    try {
      const res = await fetch(`/api/admin/submissions/${submissionId}/review`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ action, feedback })
      });

      const resJson = await res.json();
      if (!res.ok) throw new Error(resJson.error || 'Failed to perform action');

      setMessage(resJson.message);
      setTimeout(() => {
        onActionComplete?.();
        onClose();
      }, 1500);
    } catch (err) {
      setError(err.message);
    } finally {
      setProcessing(false);
    }
  };

  const mag = data?.magazine;
  const pages = data?.pages || [];
  const activePage = pages[activePageIndex];

  const getPageUrl = (page) => {
    if (!page) return '';
    if (page.file_path?.includes('_p') && page.file_path?.endsWith('.svg')) {
      return `/samples/${page.file_path}`;
    }
    return `/api/files/magazine/${mag.id}/page/${page.id}?token=${token}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-5xl bg-[#0c0e12] border border-yellow-500/50 rounded-2xl shadow-gold-glow-lg overflow-hidden my-6">
        
        {/* Top gold bar */}
        <div className="h-2 bg-gradient-to-r from-yellow-500 via-amber-400 to-yellow-600"></div>

        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-zinc-400 hover:text-white p-1 rounded-lg transition-colors z-10"
        >
          <X className="w-5 h-5" />
        </button>

        {loading ? (
          <div className="p-16 text-center">
            <div className="w-10 h-10 border-3 border-yellow-500/30 border-t-yellow-500 rounded-full animate-spin mx-auto mb-3"></div>
            <p className="text-xs text-zinc-400">Loading submission for Super Admin Sayhan review...</p>
          </div>
        ) : !mag ? (
          <div className="p-8 text-center text-zinc-400">
            <p>Submission details unavailable.</p>
          </div>
        ) : (
          <div className="flex flex-col lg:flex-row h-full max-h-[85vh]">
            
            {/* Left Column: High-Res Page Inspector */}
            <div className="lg:w-3/5 bg-[#07080a] p-6 flex flex-col items-center justify-between border-b lg:border-b-0 lg:border-r border-zinc-800">
              
              <div className="w-full flex items-center justify-between text-xs text-zinc-400 mb-3">
                <span className="font-semibold text-yellow-500 flex items-center gap-1.5">
                  <Layers className="w-4 h-4" />
                  Inspecting Page {activePageIndex + 1} of {pages.length}
                </span>
                <span className="text-[11px] text-zinc-500">{activePage?.original_filename}</span>
              </div>

              {/* Page Display */}
              <div className="relative max-h-[55vh] aspect-[1/1.414] bg-[#121418] rounded-xl overflow-hidden border border-zinc-800 shadow-2xl flex items-center justify-center">
                {activePage ? (
                  <img
                    src={getPageUrl(activePage)}
                    alt={`Page ${activePageIndex + 1}`}
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div className="p-8 text-center text-zinc-500 text-xs">No pages uploaded yet</div>
                )}
              </div>

              {/* Page Thumbnails Selector */}
              {pages.length > 1 && (
                <div className="w-full mt-4 flex items-center gap-2 overflow-x-auto py-2">
                  {pages.map((p, idx) => (
                    <button
                      key={p.id}
                      onClick={() => setActivePageIndex(idx)}
                      className={`h-14 aspect-[1/1.4] rounded-md overflow-hidden border-2 shrink-0 transition-all ${
                        idx === activePageIndex ? 'border-yellow-500 scale-105 shadow-md' : 'border-zinc-800 opacity-60'
                      }`}
                    >
                      <img src={getPageUrl(p)} alt="Thumb" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Right Column: Submission Details & Super Admin Decision Deck */}
            <div className="lg:w-2/5 p-6 sm:p-8 flex flex-col justify-between overflow-y-auto">
              
              <div className="space-y-5">
                <div>
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-yellow-500/10 text-yellow-400 border border-yellow-500/30 mb-2 uppercase">
                    <Shield className="w-3.5 h-3.5" />
                    Super Admin Curation
                  </div>
                  <h2 className="font-serif-luxury text-xl font-bold text-white leading-snug">
                    {mag.title}
                  </h2>
                  <p className="text-xs text-zinc-400 mt-1 line-clamp-2">
                    {mag.description || 'No description provided by author.'}
                  </p>
                </div>

                {/* Submitter Contact Card */}
                <div className="p-4 bg-[#14161c] border border-zinc-800 rounded-xl space-y-2">
                  <h4 className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-1">
                    Submitter Credentials
                  </h4>
                  <div className="flex items-center gap-2 text-xs text-white">
                    <User className="w-3.5 h-3.5 text-yellow-500" />
                    <span className="font-semibold">{mag.submitter_name}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-zinc-300">
                    <Mail className="w-3.5 h-3.5 text-yellow-500" />
                    <a href={`mailto:${mag.submitter_email}`} className="hover:text-yellow-400">{mag.submitter_email}</a>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-zinc-300">
                    <Phone className="w-3.5 h-3.5 text-yellow-500" />
                    <a href={`tel:${mag.submitter_phone}`} className="hover:text-yellow-400 font-mono">{mag.submitter_phone}</a>
                  </div>
                </div>

                {/* Feedback / Review Notes */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-300 mb-1.5">
                    Admin Feedback / Editorial Notes
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Enter approval notes or requested revisions for the author..."
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    className="w-full bg-[#14161c] border border-zinc-700/80 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-yellow-500 resize-none"
                  />
                </div>

                {error && (
                  <div className="p-3 bg-red-950/60 border border-red-800 rounded-xl text-xs text-red-200 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                {message && (
                  <div className="p-3 bg-emerald-950/60 border border-emerald-800 rounded-xl text-xs text-emerald-200 flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>{message}</span>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="pt-6 border-t border-zinc-800 mt-6 space-y-2.5">
                
                {/* Publish Button (Only Sayhan) */}
                <button
                  type="button"
                  disabled={processing}
                  onClick={() => handleAction('PUBLISH')}
                  className="w-full py-3 bg-yellow-500 hover:bg-yellow-400 text-black font-black text-xs uppercase tracking-wider rounded-xl shadow-gold-glow transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <Globe className="w-4 h-4" />
                  <span>Publish to Public Library (Generate QR)</span>
                </button>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    disabled={processing}
                    onClick={() => handleAction('APPROVE')}
                    className="py-2.5 px-3 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-600/40 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
                  >
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>Approve</span>
                  </button>

                  <button
                    type="button"
                    disabled={processing}
                    onClick={() => handleAction('REJECT')}
                    className="py-2.5 px-3 bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-600/40 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    <span>Reject</span>
                  </button>
                </div>

                {mag.status === 'PUBLISHED' && (
                  <button
                    type="button"
                    disabled={processing}
                    onClick={() => handleAction('UNPUBLISH')}
                    className="w-full py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-xs font-semibold transition-colors"
                  >
                    Unpublish from Library
                  </button>
                )}

              </div>

            </div>

          </div>
        )}

      </div>
    </div>
  );
}

