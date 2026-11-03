import React, { useState, useEffect } from 'react';
import { 
  Shield, Users, BookOpen, Clock, CheckCircle2, AlertTriangle, 
  Trash2, Globe, Mail, Phone, Plus, Layers, Search, RefreshCw, 
  Send, ExternalLink, QrCode, UploadCloud, Tag, Check, Eye 
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import AdminReviewModal from './AdminReviewModal';

export default function AdminDashboard({ onReadMagazine, onShareMagazine }) {
  const { token, user } = useAuth();

  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'submissions' | 'users' | 'upload' | 'categories' | 'emails'
  const [stats, setStats] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [usersList, setUsersList] = useState([]);
  const [categories, setCategories] = useState([]);
  const [emailLogs, setEmailLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filter states
  const [submissionFilter, setSubmissionFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Selected submission for review modal
  const [reviewSubmissionId, setReviewSubmissionId] = useState(null);

  // Official upload state
  const [offTitle, setOffTitle] = useState('');
  const [offDesc, setOffDesc] = useState('');
  const [offCategory, setOffCategory] = useState('');
  const [offCover, setOffCover] = useState(null);
  const [offPages, setOffPages] = useState([]);
  const [offAutoPublish, setOffAutoPublish] = useState(true);
  const [offLoading, setOffLoading] = useState(false);
  const [offMessage, setOffMessage] = useState('');

  // New category state
  const [newCatName, setNewCatName] = useState('');
  const [newCatDesc, setNewCatDesc] = useState('');

  // SMTP Test state
  const [testingSmtp, setTestingSmtp] = useState(false);
  const [smtpTestResult, setSmtpTestResult] = useState(null);

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/admin/stats', { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      setStats(data);
    } catch (e) {
      console.warn('Failed to fetch stats:', e);
    }
  };

  const fetchSubmissions = async () => {
    try {
      const url = submissionFilter === 'ALL' 
        ? '/api/admin/submissions' 
        : `/api/admin/submissions?status=${submissionFilter}`;
      const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      setSubmissions(Array.isArray(data) ? data : []);
    } catch (e) {
      console.warn('Failed to fetch submissions:', e);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/admin/users', { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      setUsersList(Array.isArray(data) ? data : []);
    } catch (e) {
      console.warn('Failed to fetch users:', e);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/admin/categories', { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      setCategories(Array.isArray(data) ? data : []);
      if (data && data.length > 0 && !offCategory) {
        setOffCategory(data[0].id);
      }
    } catch (e) {
      console.warn('Failed to fetch categories:', e);
    }
  };

  const fetchEmailLogs = async () => {
    try {
      const res = await fetch('/api/admin/email-logs', { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      setEmailLogs(Array.isArray(data) ? data : []);
    } catch (e) {
      console.warn('Failed to fetch email logs:', e);
    }
  };

  const reloadAll = async () => {
    setLoading(true);
    await Promise.all([
      fetchStats(),
      fetchSubmissions(),
      fetchUsers(),
      fetchCategories(),
      fetchEmailLogs()
    ]);
    setLoading(false);
  };

  useEffect(() => {
    if (token) reloadAll();
  }, [token, submissionFilter]);

  // Publish submission
  const handleQuickPublish = async (id) => {
    try {
      const res = await fetch(`/api/admin/submissions/${id}/review`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ action: 'PUBLISH' })
      });
      const data = await res.json();
      if (res.ok) {
        alert(data.message);
        reloadAll();
      } else {
        alert(data.error);
      }
    } catch (e) {
      alert('Error publishing: ' + e.message);
    }
  };

  // Delete submission
  const handleDeleteSubmission = async (id) => {
    if (!window.confirm('Are you sure you want to permanently delete this submission?')) return;
    try {
      const res = await fetch(`/api/admin/submissions/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        reloadAll();
      }
    } catch (e) {
      alert('Error deleting: ' + e.message);
    }
  };

  // Add Category
  const handleAddCategory = async (e) => {
    e.preventDefault();
    if (!newCatName.trim()) return;

    try {
      const res = await fetch('/api/admin/categories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ name: newCatName.trim(), description: newCatDesc.trim() })
      });
      if (res.ok) {
        setNewCatName('');
        setNewCatDesc('');
        fetchCategories();
      }
    } catch (e) {
      console.warn(e);
    }
  };

  // Delete Category
  const handleDeleteCategory = async (id) => {
    if (!window.confirm('Delete category?')) return;
    try {
      const res = await fetch(`/api/admin/categories/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) fetchCategories();
    } catch (e) {
      console.warn(e);
    }
  };

  // Official Upload Handler
  const handleOfficialUpload = async (e) => {
    e.preventDefault();
    if (!offTitle.trim()) {
      alert('Title is required');
      return;
    }

    setOffLoading(true);
    setOffMessage('');

    try {
      const formData = new FormData();
      formData.append('title', offTitle.trim());
      formData.append('description', offDesc);
      formData.append('categoryId', offCategory);
      formData.append('autoPublish', offAutoPublish);
      formData.append('isOfficial', 'true');

      if (offCover) {
        formData.append('coverImage', offCover);
      }

      for (let i = 0; i < offPages.length; i++) {
        formData.append('pages', offPages[i]);
      }

      const res = await fetch('/api/admin/upload-official', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setOffMessage(data.message);
      setOffTitle('');
      setOffDesc('');
      setOffCover(null);
      setOffPages([]);
      reloadAll();
    } catch (err) {
      alert('Upload error: ' + err.message);
    } finally {
      setOffLoading(false);
    }
  };

  // Test SMTP connection
  const handleTestSmtp = async () => {
    setTestingSmtp(true);
    setSmtpTestResult(null);

    try {
      const res = await fetch('/api/admin/email-test', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setSmtpTestResult(data);
      fetchEmailLogs();
    } catch (e) {
      setSmtpTestResult({ success: false, message: e.message });
    } finally {
      setTestingSmtp(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      
      {/* Super Admin Top Header */}
      <div className="bg-[#0e1014] border border-yellow-500/40 rounded-2xl p-6 sm:p-8 mb-8 shadow-gold-glow flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-yellow-500 text-black flex items-center justify-center font-serif-luxury text-3xl font-black shadow-gold-glow shrink-0">
            👑
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-serif-luxury text-2xl font-bold text-white">
                Sayhan's Super Admin Desk
              </h1>
              <span className="bg-yellow-500 text-black text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                SOLE PUBLISHER
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-1">
              Admin Notifications: <strong className="text-yellow-400">yellowreignacademy@gmail.com</strong> • Phone: <strong className="text-white">9544498843</strong>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={reloadAll}
            className="p-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl transition-colors border border-zinc-700"
            title="Refresh All Data"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => setActiveTab('upload')}
            className="px-5 py-2.5 bg-yellow-500 hover:bg-yellow-400 text-black font-bold text-xs rounded-xl shadow-sm transition-all flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Upload Official Issue</span>
          </button>
        </div>
      </div>

      {/* Metric Cards */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          
          <div className="bg-[#0e1014] border border-zinc-800/80 rounded-xl p-4">
            <div className="flex items-center justify-between text-zinc-400 mb-1">
              <span className="text-xs font-semibold uppercase">Registered Users</span>
              <Users className="w-4 h-4 text-yellow-500" />
            </div>
            <div className="text-2xl font-bold text-white">{stats.users?.total_all || 0}</div>
            <span className="text-[10px] text-zinc-500">{stats.users?.total_regular || 0} authors registered</span>
          </div>

          <div className="bg-[#0e1014] border border-amber-500/40 rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between text-amber-300 mb-1">
              <span className="text-xs font-bold uppercase">Pending Review</span>
              <Clock className="w-4 h-4 text-amber-400 animate-pulse" />
            </div>
            <div className="text-2xl font-bold text-amber-400">{stats.magazines?.pending || 0}</div>
            <span className="text-[10px] text-zinc-400">Needs your review</span>
          </div>

          <div className="bg-[#0e1014] border border-emerald-500/40 rounded-xl p-4">
            <div className="flex items-center justify-between text-emerald-400 mb-1">
              <span className="text-xs font-semibold uppercase">Approved</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-bold text-white">{stats.magazines?.approved || 0}</div>
            <span className="text-[10px] text-zinc-500">Ready to publish</span>
          </div>

          <div className="bg-[#0e1014] border border-yellow-500/40 rounded-xl p-4 shadow-gold-glow">
            <div className="flex items-center justify-between text-yellow-400 mb-1">
              <span className="text-xs font-bold uppercase">Public Library</span>
              <Globe className="w-4 h-4 text-yellow-400" />
            </div>
            <div className="text-2xl font-bold text-yellow-400">{stats.magazines?.published || 0}</div>
            <span className="text-[10px] text-zinc-400">Live with QR codes</span>
          </div>

          <div className="bg-[#0e1014] border border-zinc-800/80 rounded-xl p-4">
            <div className="flex items-center justify-between text-zinc-400 mb-1">
              <span className="text-xs font-semibold uppercase">Total Views</span>
              <Eye className="w-4 h-4 text-zinc-400" />
            </div>
            <div className="text-2xl font-bold text-white">{stats.magazines?.total_views || 0}</div>
            <span className="text-[10px] text-zinc-500">Global readership</span>
          </div>

        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-zinc-800 pb-3 mb-8 overflow-x-auto text-xs font-bold">
        {[
          { id: 'overview', label: 'Overview & Activity', icon: Shield },
          { id: 'submissions', label: `Submissions (${submissions.length})`, icon: BookOpen },
          { id: 'users', label: `Users (${usersList.length})`, icon: Users },
          { id: 'upload', label: 'Upload Official', icon: UploadCloud },
          { id: 'categories', label: `Categories (${categories.length})`, icon: Tag },
          { id: 'emails', label: `Email Dispatch Center (${emailLogs.length})`, icon: Mail },
        ].map(t => {
          const Icon = t.icon;
          const isActive = activeTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 shrink-0 ${
                isActive
                  ? 'bg-yellow-500 text-black shadow-md'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-800/60'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab 1: Overview */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Recent Submissions */}
          <div className="bg-[#0e1014] border border-zinc-800 rounded-2xl p-6">
            <h3 className="font-serif-luxury text-base font-bold text-white mb-4 flex items-center justify-between">
              <span>Recent Submissions Awaiting Action</span>
              <button onClick={() => setActiveTab('submissions')} className="text-xs text-yellow-500 hover:underline">
                View All
              </button>
            </h3>

            <div className="space-y-3">
              {stats?.recentSubmissions?.length === 0 ? (
                <p className="text-xs text-zinc-500 py-6 text-center">No recent submissions</p>
              ) : (
                stats?.recentSubmissions?.map(sub => (
                  <div key={sub.id} className="p-3 bg-[#121419] border border-zinc-800 rounded-xl flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-white">{sub.title}</p>
                      <p className="text-xs text-zinc-400">{sub.submitter_name} ({sub.submitter_email})</p>
                    </div>
                    <button
                      onClick={() => setReviewSubmissionId(sub.id)}
                      className="px-3 py-1.5 bg-yellow-500/10 hover:bg-yellow-500 text-yellow-400 hover:text-black rounded-lg text-xs font-bold transition-colors"
                    >
                      Review
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Recent Registered Users */}
          <div className="bg-[#0e1014] border border-zinc-800 rounded-2xl p-6">
            <h3 className="font-serif-luxury text-base font-bold text-white mb-4 flex items-center justify-between">
              <span>Recently Registered Users</span>
              <button onClick={() => setActiveTab('users')} className="text-xs text-yellow-500 hover:underline">
                View Directory
              </button>
            </h3>

            <div className="space-y-3">
              {stats?.recentUsers?.map(u => (
                <div key={u.id} className="p-3 bg-[#121419] border border-zinc-800 rounded-xl flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-white">{u.full_name}</p>
                      {u.role === 'ADMIN' && (
                        <span className="text-[10px] bg-yellow-500 text-black px-1.5 rounded font-bold">ADMIN</span>
                      )}
                    </div>
                    <p className="text-xs text-zinc-400">{u.email} • {u.phone}</p>
                  </div>
                  <span className="text-[11px] text-zinc-500">
                    {new Date(u.created_at).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

      {/* Tab 2: Submissions Manager */}
      {activeTab === 'submissions' && (
        <div className="space-y-6">
          
          {/* Filter Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 bg-[#0e1014] p-4 rounded-2xl border border-zinc-800">
            <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
              {['ALL', 'PENDING_REVIEW', 'APPROVED', 'PUBLISHED', 'REJECTED', 'DRAFT'].map(st => (
                <button
                  key={st}
                  onClick={() => setSubmissionFilter(st)}
                  className={`px-3 py-1.5 rounded-lg transition-colors ${
                    submissionFilter === st
                      ? 'bg-yellow-500 text-black font-bold'
                      : 'bg-zinc-800 text-zinc-400 hover:text-white'
                  }`}
                >
                  {st.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>

          {/* Submissions Table */}
          <div className="bg-[#0e1014] border border-zinc-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#14161c] text-zinc-400 font-semibold uppercase tracking-wider border-b border-zinc-800">
                  <tr>
                    <th className="py-3.5 px-4">Magazine</th>
                    <th className="py-3.5 px-4">Submitter & Phone</th>
                    <th className="py-3.5 px-4">Category</th>
                    <th className="py-3.5 px-4">Pages</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4 text-right">Sayhan Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60 text-zinc-300">
                  {submissions.map((sub) => {
                    const coverUrl = sub.cover_image
                      ? sub.cover_image.includes('_cover.svg')
                        ? `/samples/${sub.cover_image}`
                        : `/api/files/magazine/${sub.id}/cover?token=${token}`
                      : null;

                    return (
                      <tr key={sub.id} className="hover:bg-zinc-800/30 transition-colors">
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-14 rounded bg-zinc-900 border border-zinc-800 overflow-hidden shrink-0">
                              {coverUrl ? (
                                <img src={coverUrl} alt="Cover" className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-[9px] text-zinc-600">Cover</div>
                              )}
                            </div>
                            <div>
                              <p className="font-semibold text-white text-sm line-clamp-1">{sub.title}</p>
                              <p className="text-[11px] text-zinc-500">Submitted {new Date(sub.created_at).toLocaleDateString()}</p>
                            </div>
                          </div>
                        </td>

                        <td className="py-4 px-4">
                          <p className="font-medium text-white">{sub.submitter_name || 'Sayhan (Super Admin)'}</p>
                          <p className="text-zinc-400">{sub.submitter_email}</p>
                          <p className="text-yellow-500 font-mono text-[11px]">{sub.submitter_phone}</p>
                        </td>

                        <td className="py-4 px-4 text-zinc-300">
                          {sub.category_name || 'General'}
                        </td>

                        <td className="py-4 px-4 font-mono">
                          {sub.page_count}
                        </td>

                        <td className="py-4 px-4">
                          {sub.status === 'PUBLISHED' && (
                            <span className="px-2.5 py-1 rounded-md text-[10px] font-bold bg-yellow-500/20 text-yellow-400 border border-yellow-500/40">
                              PUBLISHED
                            </span>
                          )}
                          {sub.status === 'PENDING_REVIEW' && (
                            <span className="px-2.5 py-1 rounded-md text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse">
                              PENDING REVIEW
                            </span>
                          )}
                          {sub.status === 'APPROVED' && (
                            <span className="px-2.5 py-1 rounded-md text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                              APPROVED
                            </span>
                          )}
                          {sub.status === 'REJECTED' && (
                            <span className="px-2.5 py-1 rounded-md text-[10px] font-bold bg-red-500/20 text-red-400 border border-red-500/40">
                              REJECTED
                            </span>
                          )}
                          {sub.status === 'DRAFT' && (
                            <span className="px-2.5 py-1 rounded-md text-[10px] font-semibold bg-zinc-800 text-zinc-400">
                              DRAFT
                            </span>
                          )}
                        </td>

                        <td className="py-4 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            
                            {/* Inspect & Review Button */}
                            <button
                              onClick={() => setReviewSubmissionId(sub.id)}
                              className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-lg text-xs font-semibold transition-colors"
                              title="Full Inspection & Decision Deck"
                            >
                              Review
                            </button>

                            {/* Quick Publish if not yet published */}
                            {sub.status !== 'PUBLISHED' ? (
                              <button
                                onClick={() => handleQuickPublish(sub.id)}
                                className="px-3 py-1.5 bg-yellow-500 hover:bg-yellow-400 text-black rounded-lg text-xs font-bold transition-all shadow-sm"
                                title="Publish to Public Library & Generate QR"
                              >
                                Publish
                              </button>
                            ) : (
                              <button
                                onClick={() => onShareMagazine(sub)}
                                className="p-1.5 bg-yellow-500/10 text-yellow-400 hover:bg-yellow-500 hover:text-black rounded-lg transition-colors"
                                title="QR Code & Direct Link"
                              >
                                <QrCode className="w-4 h-4" />
                              </button>
                            )}

                            {/* Delete */}
                            <button
                              onClick={() => handleDeleteSubmission(sub.id)}
                              className="p-1.5 text-zinc-400 hover:text-red-400 rounded-lg transition-colors"
                              title="Delete Submission"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>

                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* Tab 3: Registered Users */}
      {activeTab === 'users' && (
        <div className="bg-[#0e1014] border border-zinc-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="p-5 border-b border-zinc-800 flex items-center justify-between">
            <h3 className="font-serif-luxury text-base font-bold text-white">
              Registered Author Directory ({usersList.length})
            </h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#14161c] text-zinc-400 font-semibold uppercase tracking-wider border-b border-zinc-800">
                <tr>
                  <th className="py-3 px-4">Author</th>
                  <th className="py-3 px-4">Email</th>
                  <th className="py-3 px-4">Phone Number</th>
                  <th className="py-3 px-4">Submissions</th>
                  <th className="py-3 px-4">Registered Date</th>
                  <th className="py-3 px-4 text-right">Quick Contact</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60 text-zinc-300">
                {usersList.map((u) => (
                  <tr key={u.id} className="hover:bg-zinc-800/30">
                    <td className="py-3.5 px-4 font-semibold text-white">
                      <div className="flex items-center gap-2">
                        <span>{u.full_name}</span>
                        {u.role === 'ADMIN' && (
                          <span className="text-[10px] bg-yellow-500 text-black px-1.5 py-0.5 rounded font-black">
                            SUPER ADMIN
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-zinc-400">{u.email}</td>
                    <td className="py-3.5 px-4 font-mono text-yellow-500 font-semibold">{u.phone}</td>
                    <td className="py-3.5 px-4 font-mono">{u.total_submissions || 0}</td>
                    <td className="py-3.5 px-4 text-zinc-500">{new Date(u.created_at).toLocaleDateString()}</td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <a
                          href={`tel:${u.phone}`}
                          className="p-1.5 bg-zinc-800 hover:bg-zinc-700 text-yellow-400 rounded-lg"
                          title="Call Submitter"
                        >
                          <Phone className="w-3.5 h-3.5" />
                        </a>
                        <a
                          href={`mailto:${u.email}`}
                          className="p-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg"
                          title="Email Submitter"
                        >
                          <Mail className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 4: Upload Official Content */}
      {activeTab === 'upload' && (
        <div className="bg-[#0e1014] border border-zinc-800 rounded-2xl p-6 sm:p-8 max-w-2xl mx-auto shadow-xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-xl bg-yellow-500/10 border border-yellow-500/30 flex items-center justify-center">
              <UploadCloud className="w-6 h-6 text-yellow-500" />
            </div>
            <div>
              <h3 className="font-serif-luxury text-xl font-bold text-white">
                Upload Official Academy Magazine
              </h3>
              <p className="text-xs text-zinc-400">Directly published under Sayhan's Super Admin Authority</p>
            </div>
          </div>

          {offMessage && (
            <div className="mb-6 p-4 bg-emerald-950/60 border border-emerald-800 rounded-xl text-xs text-emerald-200 flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{offMessage}</span>
            </div>
          )}

          <form onSubmit={handleOfficialUpload} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase text-zinc-300 mb-1.5">
                Magazine Title *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Yellow Reign Academy Executive Quarterly"
                value={offTitle}
                onChange={e => setOffTitle(e.target.value)}
                className="w-full bg-[#14161c] border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-yellow-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-zinc-300 mb-1.5">
                Category
              </label>
              <select
                value={offCategory}
                onChange={e => setOffCategory(e.target.value)}
                className="w-full bg-[#14161c] border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-yellow-500"
              >
                {categories.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-zinc-300 mb-1.5">
                Synopsis
              </label>
              <textarea
                rows={3}
                placeholder="Executive summary..."
                value={offDesc}
                onChange={e => setOffDesc(e.target.value)}
                className="w-full bg-[#14161c] border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-yellow-500 resize-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-zinc-300 mb-1.5">
                  Cover Image (JPG/PNG)
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={e => setOffCover(e.target.files[0])}
                  className="w-full text-xs text-zinc-400 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-zinc-800 file:text-zinc-200 hover:file:bg-zinc-700 cursor-pointer"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-zinc-300 mb-1.5">
                  Pages (Batch/PDF/Images)
                </label>
                <input
                  type="file"
                  multiple
                  accept="image/*,application/pdf"
                  onChange={e => setOffPages(Array.from(e.target.files))}
                  className="w-full text-xs text-zinc-400 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-zinc-800 file:text-zinc-200 hover:file:bg-zinc-700 cursor-pointer"
                />
              </div>
            </div>

            <div className="pt-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={offAutoPublish}
                  onChange={e => setOffAutoPublish(e.target.checked)}
                  className="rounded text-yellow-500 focus:ring-yellow-500 w-4 h-4 bg-zinc-900 border-zinc-700"
                />
                <span className="text-xs text-zinc-300 font-semibold">
                  Publish to Public Library Immediately (Generate QR & Permanent Link)
                </span>
              </label>
            </div>

            <button
              type="submit"
              disabled={offLoading}
              className="w-full py-3 bg-yellow-500 hover:bg-yellow-400 text-black font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-md hover:shadow-gold-glow flex items-center justify-center gap-2 mt-4 disabled:opacity-50"
            >
              {offLoading ? 'Uploading...' : 'Publish Official Magazine'}
            </button>
          </form>
        </div>
      )}

      {/* Tab 5: Categories Management */}
      {activeTab === 'categories' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          <div className="bg-[#0e1014] border border-zinc-800 rounded-2xl p-6 h-fit">
            <h3 className="font-serif-luxury text-base font-bold text-white mb-4">
              Add New Category
            </h3>
            <form onSubmit={handleAddCategory} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-zinc-300 mb-1.5">Category Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Design & Typography"
                  value={newCatName}
                  onChange={e => setNewCatName(e.target.value)}
                  className="w-full bg-[#14161c] border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-yellow-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase text-zinc-300 mb-1.5">Description</label>
                <input
                  type="text"
                  placeholder="Brief description..."
                  value={newCatDesc}
                  onChange={e => setNewCatDesc(e.target.value)}
                  className="w-full bg-[#14161c] border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-yellow-500"
                />
              </div>
              <button
                type="submit"
                className="w-full py-2.5 bg-yellow-500 hover:bg-yellow-400 text-black font-bold text-xs rounded-xl transition-all"
              >
                Create Category
              </button>
            </form>
          </div>

          <div className="md:col-span-2 bg-[#0e1014] border border-zinc-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="p-5 border-b border-zinc-800">
              <h3 className="font-serif-luxury text-base font-bold text-white">
                Active Categories ({categories.length})
              </h3>
            </div>
            <div className="divide-y divide-zinc-800">
              {categories.map(c => (
                <div key={c.id} className="p-4 flex items-center justify-between hover:bg-zinc-800/20">
                  <div>
                    <h4 className="text-sm font-bold text-white">{c.name}</h4>
                    <p className="text-xs text-zinc-400">{c.description || 'No description'}</p>
                    <span className="text-[10px] text-zinc-500 font-mono">Slug: {c.slug}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-yellow-500 font-semibold">{c.total_magazines || 0} magazines</span>
                    <button
                      onClick={() => handleDeleteCategory(c.id)}
                      className="p-1.5 text-zinc-500 hover:text-red-400"
                      title="Delete Category"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

      {/* Tab 6: Email Dispatch Center & SMTP Diagnostics */}
      {activeTab === 'emails' && (
        <div className="space-y-6">
          
          {/* SMTP Diagnostics Toolbar */}
          <div className="bg-[#0e1014] border border-yellow-500/30 rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-xl">
            <div>
              <div className="flex items-center gap-2">
                <Mail className="w-5 h-5 text-yellow-500" />
                <h3 className="font-serif-luxury text-lg font-bold text-white">
                  Admin Notification Dispatch Engine
                </h3>
              </div>
              <p className="text-xs text-zinc-400 mt-1 max-w-xl">
                Every user registration and magazine submission triggers an automated email notification dispatched directly to <strong className="text-yellow-400">yellowreignacademy@gmail.com</strong>.
              </p>
            </div>

            <button
              onClick={handleTestSmtp}
              disabled={testingSmtp}
              className="px-5 py-2.5 bg-yellow-500 hover:bg-yellow-400 text-black font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50 shrink-0"
            >
              {testingSmtp ? (
                <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Test SMTP Connection</span>
                </>
              )}
            </button>
          </div>

          {smtpTestResult && (
            <div className={`p-4 rounded-xl text-xs flex items-start gap-2.5 ${
              smtpTestResult.success 
                ? 'bg-emerald-950/60 border border-emerald-800 text-emerald-200' 
                : 'bg-amber-950/60 border border-amber-800 text-amber-200'
            }`}>
              <Shield className="w-4 h-4 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">{smtpTestResult.success ? 'SMTP Connected' : 'Notice'}</p>
                <p>{smtpTestResult.message}</p>
              </div>
            </div>
          )}

          {/* Email Logs Table */}
          <div className="bg-[#0e1014] border border-zinc-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="p-5 border-b border-zinc-800">
              <h4 className="font-serif-luxury text-base font-bold text-white">
                Dispatched Email Audit Trail ({emailLogs.length})
              </h4>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#14161c] text-zinc-400 font-semibold uppercase tracking-wider border-b border-zinc-800">
                  <tr>
                    <th className="py-3 px-4">Subject</th>
                    <th className="py-3 px-4">Event Type</th>
                    <th className="py-3 px-4">Recipient</th>
                    <th className="py-3 px-4">Timestamp</th>
                    <th className="py-3 px-4">Delivery Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60 text-zinc-300">
                  {emailLogs.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-zinc-500">
                        No email events recorded yet. Register a user or submit a magazine to test!
                      </td>
                    </tr>
                  ) : (
                    emailLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-zinc-800/30">
                        <td className="py-3.5 px-4 font-semibold text-white">
                          {log.subject}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-zinc-800 text-yellow-400">
                            {log.type}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-zinc-400">{log.recipient}</td>
                        <td className="py-3.5 px-4 text-zinc-500">
                          {new Date(log.created_at).toLocaleString()}
                        </td>
                        <td className="py-3.5 px-4">
                          {log.status === 'SENT' ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                              SENT VIA SMTP
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30" title={log.error_message}>
                              LOGGED (PENDING SMTP CREDS)
                            </span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* Review Modal */}
      {reviewSubmissionId && (
        <AdminReviewModal
          submissionId={reviewSubmissionId}
          isOpen={!!reviewSubmissionId}
          onClose={() => setReviewSubmissionId(null)}
          onActionComplete={reloadAll}
        />
      )}

    </div>
  );
}

