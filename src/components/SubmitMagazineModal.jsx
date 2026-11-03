import React, { useState, useEffect } from 'react';
import { 
  X, UploadCloud, Image, FileText, ArrowUp, ArrowDown, Trash2, 
  CheckCircle, AlertCircle, Shield, Plus, FilePlus, Layers 
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function SubmitMagazineModal({ isOpen, onClose, onSuccess, editMagazine = null }) {
  const { token, user } = useAuth();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [categories, setCategories] = useState([]);

  const [coverFile, setCoverFile] = useState(null);
  const [coverPreview, setCoverPreview] = useState(null);

  // New files to upload: array of { id, file, preview, name, size }
  const [newPages, setNewPages] = useState([]);
  // Existing pages if editing: array of { id, page_number, file_path, original_filename }
  const [existingPages, setExistingPages] = useState([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Fetch categories
  useEffect(() => {
    fetch('/api/magazines/categories')
      .then(res => res.json())
      .then(data => {
        setCategories(data || []);
        if (data && data.length > 0 && !categoryId) {
          setCategoryId(data[0].id);
        }
      })
      .catch(() => {});
  }, []);

  // Pre-fill if editing
  useEffect(() => {
    if (editMagazine) {
      setTitle(editMagazine.title || '');
      setDescription(editMagazine.description || '');
      setCategoryId(editMagazine.category_id || '');
      if (editMagazine.cover_image) {
        setCoverPreview(`/api/files/magazine/${editMagazine.id}/cover?token=${token}`);
      }
      // fetch existing pages
      fetch(`/api/magazines/user/${editMagazine.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(res => res.json())
        .then(data => {
          if (data.pages) setExistingPages(data.pages);
        })
        .catch(() => {});
    } else {
      setTitle('');
      setDescription('');
      setCoverFile(null);
      setCoverPreview(null);
      setNewPages([]);
      setExistingPages([]);
    }
    setError('');
    setSuccessMessage('');
  }, [editMagazine, isOpen]);

  if (!isOpen) return null;

  const handleCoverSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setCoverFile(file);
      setCoverPreview(URL.createObjectURL(file));
    }
  };

  const handlePagesSelect = (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    const formatted = files.map((file, idx) => ({
      id: `new_${Date.now()}_${idx}`,
      file,
      name: file.name,
      size: (file.size / 1024).toFixed(1) + ' KB',
      preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : null,
      isPdf: file.type === 'application/pdf'
    }));

    setNewPages(prev => [...prev, ...formatted]);
  };

  const movePage = (index, direction) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= newPages.length) return;
    const copy = [...newPages];
    const item = copy.splice(index, 1)[0];
    copy.splice(targetIndex, 0, item);
    setNewPages(copy);
  };

  const removeNewPage = (id) => {
    setNewPages(prev => prev.filter(p => p.id !== id));
  };

  const deleteExistingPage = async (pageId) => {
    if (!editMagazine) return;
    try {
      const res = await fetch(`/api/magazines/user/${editMagazine.id}/page/${pageId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setExistingPages(prev => prev.filter(p => p.id !== pageId));
      }
    } catch (e) {
      console.warn('Failed to delete page:', e);
    }
  };

  const handleSubmit = async (targetStatus) => {
    if (!title.trim()) {
      setError('Magazine title is required.');
      return;
    }

    if (!editMagazine && !coverFile) {
      setError('Please upload a cover image for your magazine.');
      return;
    }

    if (!editMagazine && newPages.length === 0) {
      setError('Please upload at least one page for your magazine.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const formData = new FormData();
      if (editMagazine) {
        formData.append('id', editMagazine.id);
      }
      formData.append('title', title.trim());
      formData.append('description', description);
      formData.append('categoryId', categoryId);
      formData.append('status', targetStatus);

      if (coverFile) {
        formData.append('coverImage', coverFile);
      }

      newPages.forEach(p => {
        formData.append('pages', p.file);
      });

      const res = await fetch('/api/magazines/user/submit', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: formData
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit magazine');
      }

      setSuccessMessage(data.message);
      setTimeout(() => {
        onSuccess?.();
        onClose();
      }, 1500);
    } catch (err) {
      setError(err.message || 'Submission failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-[#0e1014] border border-yellow-500/40 rounded-2xl shadow-gold-glow-lg overflow-hidden my-8">
        
        {/* Gold top stripe */}
        <div className="h-2 bg-gradient-to-r from-yellow-500 via-amber-400 to-yellow-600"></div>

        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-zinc-400 hover:text-white p-1 rounded-lg transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-6 sm:p-8 max-h-[85vh] overflow-y-auto">
          
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-yellow-500/10 border border-yellow-500/30 flex items-center justify-center">
              <UploadCloud className="w-5 h-5 text-yellow-500" />
            </div>
            <div>
              <h2 className="font-serif-luxury text-xl sm:text-2xl font-bold text-white tracking-wide">
                {editMagazine ? 'Edit Submission' : 'Submit New Magazine'}
              </h2>
              <p className="text-xs text-zinc-400">
                Author: <strong className="text-white">{user?.full_name}</strong> • Phone: <strong className="text-white">{user?.phone}</strong>
              </p>
            </div>
          </div>

          {/* Privacy Guarantee Notice */}
          <div className="my-4 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-xl flex items-start gap-2.5 text-xs text-yellow-300">
            <Shield className="w-4 h-4 text-yellow-500 shrink-0 mt-0.5" />
            <span>
              <strong>Private Content Guarantee:</strong> Submissions are stored exclusively in your private folder. Content will <strong>never appear publicly</strong> until Super Admin Sayhan inspects, approves, and publishes it.
            </span>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-950/60 border border-red-800/80 rounded-xl flex items-start gap-2.5 text-xs text-red-200">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {successMessage && (
            <div className="mb-4 p-3 bg-emerald-950/60 border border-emerald-800/80 rounded-xl flex items-start gap-2.5 text-xs text-emerald-200">
              <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>{successMessage}</span>
            </div>
          )}

          <div className="space-y-4">
            
            {/* Title */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-300 mb-1.5">
                Magazine Title *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Horizons of Architecture & Typography"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-[#14161c] border border-zinc-700/80 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-yellow-500"
              />
            </div>

            {/* Category */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-300 mb-1.5">
                Category *
              </label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full bg-[#14161c] border border-zinc-700/80 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-yellow-500"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-300 mb-1.5">
                Synopsis / Description
              </label>
              <textarea
                rows={3}
                placeholder="Brief summary of the magazine, themes covered, and editorial highlights..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full bg-[#14161c] border border-zinc-700/80 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-yellow-500 resize-none"
              />
            </div>

            {/* Cover Image Upload */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-300 mb-1.5">
                Cover Image (JPG, JPEG, PNG, WEBP) *
              </label>
              <div className="flex items-center gap-4">
                {coverPreview ? (
                  <div className="relative w-20 h-28 rounded-lg overflow-hidden border border-yellow-500/50 shrink-0">
                    <img src={coverPreview} alt="Cover Preview" className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <div className="w-20 h-28 rounded-lg border border-dashed border-zinc-700 flex flex-col items-center justify-center text-zinc-500 shrink-0">
                    <Image className="w-6 h-6 mb-1 text-zinc-600" />
                    <span className="text-[10px]">No Cover</span>
                  </div>
                )}
                <div className="flex-grow">
                  <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold rounded-xl border border-zinc-700 transition-colors">
                    <UploadCloud className="w-4 h-4 text-yellow-500" />
                    <span>Choose Cover File</span>
                    <input
                      type="file"
                      accept="image/jpeg,image/jpg,image/png,image/webp"
                      onChange={handleCoverSelect}
                      className="hidden"
                    />
                  </label>
                  <p className="text-[11px] text-zinc-500 mt-1">Recommended ratio: 3:4 portrait (e.g. 1200 x 1600)</p>
                </div>
              </div>
            </div>

            {/* Existing Pages (if editing) */}
            {existingPages.length > 0 && (
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-300 mb-1.5">
                  Currently Saved Pages ({existingPages.length})
                </label>
                <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                  {existingPages.map((ep, idx) => (
                    <div key={ep.id} className="flex items-center justify-between p-2 bg-[#121418] border border-zinc-800 rounded-lg text-xs">
                      <span className="font-semibold text-yellow-500">Page {idx + 1}</span>
                      <span className="text-zinc-400 truncate max-w-xs">{ep.original_filename || ep.file_path}</span>
                      <button
                        type="button"
                        onClick={() => deleteExistingPage(ep.id)}
                        className="text-red-400 hover:text-red-300 p-1"
                        title="Delete Page"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Upload Pages / Batch Upload */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-zinc-300">
                  Magazine Pages (PDF, JPG, JPEG, PNG)
                </label>
                <span className="text-xs text-yellow-500 font-semibold">
                  {newPages.length + existingPages.length} total pages
                </span>
              </div>

              <div className="p-4 border-2 border-dashed border-zinc-700/80 hover:border-yellow-500/60 rounded-xl bg-[#121418] text-center transition-colors">
                <label className="cursor-pointer flex flex-col items-center justify-center">
                  <FilePlus className="w-8 h-8 text-yellow-500 mb-2" />
                  <span className="text-xs font-semibold text-zinc-200">Click to upload pages one-by-one or in batches</span>
                  <span className="text-[10px] text-zinc-500 mt-1">Supports PDF or individual JPG/PNG page scans (up to 50MB per file)</span>
                  <input
                    type="file"
                    multiple
                    accept="image/jpeg,image/jpg,image/png,image/webp,application/pdf"
                    onChange={handlePagesSelect}
                    className="hidden"
                  />
                </label>
              </div>

              {/* Page Ordering & List */}
              {newPages.length > 0 && (
                <div className="mt-3 space-y-2 max-h-52 overflow-y-auto pr-1">
                  <p className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                    New Pages to Upload (Use arrows to reorder):
                  </p>
                  {newPages.map((p, idx) => (
                    <div
                      key={p.id}
                      className="flex items-center justify-between p-2.5 bg-[#14161d] border border-zinc-800 rounded-xl text-xs"
                    >
                      <div className="flex items-center gap-2.5 overflow-hidden">
                        <span className="w-6 h-6 rounded-md bg-yellow-500/20 text-yellow-400 flex items-center justify-center font-bold text-[11px] shrink-0">
                          {existingPages.length + idx + 1}
                        </span>
                        {p.preview ? (
                          <img src={p.preview} alt="Thumb" className="w-8 h-10 object-cover rounded shrink-0 border border-zinc-700" />
                        ) : (
                          <FileText className="w-5 h-5 text-yellow-500 shrink-0" />
                        )}
                        <div className="truncate">
                          <p className="text-zinc-200 font-medium truncate">{p.name}</p>
                          <p className="text-[10px] text-zinc-500">{p.size}</p>
                        </div>
                      </div>

                      {/* Reordering Controls */}
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => movePage(idx, -1)}
                          disabled={idx === 0}
                          className="p-1 text-zinc-400 hover:text-white disabled:opacity-20 rounded"
                          title="Move Page Up"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => movePage(idx, 1)}
                          disabled={idx === newPages.length - 1}
                          className="p-1 text-zinc-400 hover:text-white disabled:opacity-20 rounded"
                          title="Move Page Down"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => removeNewPage(p.id)}
                          className="p-1 text-red-400 hover:text-red-300 rounded ml-1"
                          title="Remove Page"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>

          {/* Action Buttons */}
          <div className="mt-8 pt-5 border-t border-zinc-800/80 flex flex-col sm:flex-row items-center justify-between gap-3">
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto px-5 py-2.5 text-zinc-400 hover:text-white text-xs font-semibold rounded-xl"
            >
              Cancel
            </button>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <button
                type="button"
                disabled={loading}
                onClick={() => handleSubmit('DRAFT')}
                className="w-full sm:w-auto px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold rounded-xl border border-zinc-700 transition-colors disabled:opacity-50"
              >
                Save as Draft
              </button>

              <button
                type="button"
                disabled={loading}
                onClick={() => handleSubmit('PENDING_REVIEW')}
                className="w-full sm:w-auto px-6 py-2.5 bg-yellow-500 hover:bg-yellow-400 text-black text-xs font-bold rounded-xl shadow-md hover:shadow-gold-glow transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <>
                    <UploadCloud className="w-4 h-4" />
                    <span>Submit for Admin Review</span>
                  </>
                )}
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

