import React, { useState, useEffect } from 'react';
import { X, Lock, Mail, User, Phone, ShieldCheck, AlertCircle, Eye, EyeOff, ShieldAlert } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function AuthModal({ isOpen, onClose, initialTab = 'user_login', onSuccess }) {
  const { login, adminLogin, register } = useAuth();

  // Mode: 'user_login' | 'admin_login' | 'register'
  const [tab, setTab] = useState(initialTab);

  // Form states - strictly empty, manual entry only
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setTab(initialTab);
      setError('');
      // Always reset inputs when modal opens
      setEmail('');
      setPassword('');
      setFullName('');
      setPhone('');
      setShowPassword(false);
    }
  }, [isOpen, initialTab]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      let result;
      if (tab === 'admin_login') {
        // Dedicated Super Admin Login
        result = await adminLogin(email.trim(), password);
        onSuccess?.('admin_dashboard', result.user);
      } else if (tab === 'user_login') {
        // Standard User Login
        result = await login(email.trim(), password);
        const destination = result.user?.role === 'ADMIN' ? 'admin_dashboard' : 'user_dashboard';
        onSuccess?.(destination, result.user);
      } else {
        // User Registration
        result = await register(fullName.trim(), email.trim(), phone.trim(), password);
        onSuccess?.('user_dashboard', result.user);
      }
      onClose();
    } catch (err) {
      setError(err.message || 'Authentication failed. Please verify your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-md bg-[#0d0f13] border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden">
        
        {/* Accent Bar */}
        <div className={`h-1.5 w-full ${tab === 'admin_login' ? 'bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600' : 'bg-gradient-to-r from-yellow-500 to-zinc-600'}`}></div>

        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-zinc-400 hover:text-white p-1 rounded-lg transition-colors"
          title="Close dialog"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-6 sm:p-8">
          
          {/* Header */}
          <div className="text-center mb-6">
            {tab === 'admin_login' ? (
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 text-xs font-bold uppercase tracking-wider mb-2">
                <ShieldCheck className="w-4 h-4 text-yellow-500" />
                <span>Super Admin Portal</span>
              </div>
            ) : null}

            <h2 className="font-serif-luxury text-2xl font-bold text-white tracking-wide">
              {tab === 'admin_login'
                ? 'Super Admin Authentication'
                : tab === 'user_login'
                ? 'User Sign In'
                : 'Create Author Account'}
            </h2>
            <p className="text-xs text-zinc-400 mt-1">
              {tab === 'admin_login'
                ? 'Restricted to Super Admin Sayhan. Manual credentials required.'
                : tab === 'user_login'
                ? 'Enter your credentials to access your personal dashboard.'
                : 'Register as an author to submit magazines for curation.'}
            </p>
          </div>

          {/* Tab Switcher: User Login vs Admin Login */}
          <div className="grid grid-cols-2 p-1 bg-zinc-900 border border-zinc-800 rounded-xl mb-6 text-xs font-semibold">
            <button
              type="button"
              onClick={() => { setTab('user_login'); setError(''); }}
              className={`py-2 rounded-lg transition-all ${
                tab === 'user_login' || tab === 'register'
                  ? 'bg-zinc-800 text-white shadow-sm'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              User Login
            </button>
            <button
              type="button"
              onClick={() => { setTab('admin_login'); setError(''); }}
              className={`py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                tab === 'admin_login'
                  ? 'bg-yellow-500 text-black font-bold shadow-gold-glow'
                  : 'text-zinc-400 hover:text-yellow-400'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Admin Login</span>
            </button>
          </div>

          {/* Sub-toggle for normal users: Sign In vs Register */}
          {tab !== 'admin_login' && (
            <div className="flex items-center justify-center gap-4 mb-5 text-xs">
              <button
                type="button"
                onClick={() => { setTab('user_login'); setError(''); }}
                className={`pb-1 font-semibold transition-colors border-b-2 ${
                  tab === 'user_login'
                    ? 'border-yellow-500 text-yellow-400'
                    : 'border-transparent text-zinc-400 hover:text-white'
                }`}
              >
                Sign In
              </button>
              <span className="text-zinc-600">•</span>
              <button
                type="button"
                onClick={() => { setTab('register'); setError(''); }}
                className={`pb-1 font-semibold transition-colors border-b-2 ${
                  tab === 'register'
                    ? 'border-yellow-500 text-yellow-400'
                    : 'border-transparent text-zinc-400 hover:text-white'
                }`}
              >
                Register New Account
              </button>
            </div>
          )}

          {/* Error Banner */}
          {error && (
            <div className="mb-5 p-3.5 bg-red-950/70 border border-red-800 rounded-xl flex items-start gap-2.5 text-xs text-red-200 animate-fadeIn">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <div className="flex-grow">
                <span className="font-semibold block text-red-300">Authentication Error</span>
                <span>{error}</span>
              </div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4" autoComplete="off">
            {tab === 'register' && (
              <>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-300 mb-1.5">
                    Full Name *
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3" />
                    <input
                      type="text"
                      required
                      autoComplete="off"
                      placeholder="Your Full Name"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full bg-[#14161b] border border-zinc-700/80 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-yellow-500 transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-300 mb-1.5">
                    Phone Number *
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3" />
                    <input
                      type="tel"
                      required
                      autoComplete="off"
                      placeholder="e.g. +91 9876543210"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full bg-[#14161b] border border-zinc-700/80 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-yellow-500 transition-colors"
                    />
                  </div>
                </div>
              </>
            )}

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-300 mb-1.5">
                {tab === 'admin_login' ? 'Admin Email Address *' : 'Email Address *'}
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3" />
                <input
                  type="email"
                  required
                  autoComplete="off"
                  placeholder={tab === 'admin_login' ? 'Enter administrator email' : 'name@example.com'}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-[#14161b] border border-zinc-700/80 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-yellow-500 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-300 mb-1.5">
                {tab === 'admin_login' ? 'Admin Password *' : 'Password *'}
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="new-password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-[#14161b] border border-zinc-700/80 rounded-xl pl-10 pr-10 py-2.5 text-sm text-white focus:outline-none focus:border-yellow-500 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-zinc-500 hover:text-zinc-300"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {tab === 'register' && (
              <p className="text-[11px] text-zinc-400 italic">
                * Note: Registration will trigger an automated alert to Super Admin Sayhan.
              </p>
            )}

            {tab === 'admin_login' && (
              <div className="p-3 bg-yellow-500/5 border border-yellow-500/20 rounded-xl text-[11px] text-zinc-400 flex items-start gap-2">
                <ShieldAlert className="w-4 h-4 text-yellow-500 shrink-0 mt-0.5" />
                <span>
                  Admin authorization is strictly verified on the backend. Only Sayhan's verified account has publishing and administrative privileges.
                </span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3 px-4 font-bold rounded-xl transition-all shadow-md flex items-center justify-center gap-2 text-sm mt-3 disabled:opacity-50 ${
                tab === 'admin_login'
                  ? 'bg-yellow-500 hover:bg-yellow-400 text-black shadow-gold-glow'
                  : 'bg-yellow-500 hover:bg-yellow-400 text-black'
              }`}
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
              ) : tab === 'admin_login' ? (
                'Authenticate Admin Access'
              ) : tab === 'user_login' ? (
                'Sign In'
              ) : (
                'Complete Registration'
              )}
            </button>
          </form>

        </div>
      </div>
    </div>
  );
}
