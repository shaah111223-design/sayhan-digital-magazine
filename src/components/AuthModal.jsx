import React, { useState } from 'react';
import { X, Lock, Mail, User, Phone, Sparkles, Shield, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function AuthModal({ isOpen, onClose, initialTab = 'login', onSuccess }) {
  const { login, register } = useAuth();
  const [tab, setTab] = useState(initialTab); // 'login' | 'register'

  // Form states
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (tab === 'login') {
        await login(email, password);
      } else {
        await register(fullName, email, phone, password);
      }
      onSuccess?.();
      onClose();
    } catch (err) {
      setError(err.message || 'Authentication error');
    } finally {
      setLoading(false);
    }
  };

  const fillAdminCredentials = () => {
    setTab('login');
    setEmail('yellowreignacademy@gmail.com');
    setPassword('Sayhan@2026');
    setError('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-md bg-[#0e1014] border border-yellow-500/40 rounded-2xl shadow-gold-glow-lg overflow-hidden">
        
        {/* Header Decor */}
        <div className="h-2 bg-gradient-to-r from-yellow-500 via-amber-400 to-yellow-600"></div>

        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-zinc-400 hover:text-white p-1 rounded-lg transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-6 sm:p-8">
          <div className="text-center mb-6">
            <h2 className="font-serif-luxury text-2xl font-bold text-white tracking-wide">
              {tab === 'login' ? 'Welcome Back' : 'Create Your Author Account'}
            </h2>
            <p className="text-xs text-zinc-400 mt-1">
              {tab === 'login'
                ? 'Sign in to access your personal dashboard and private submissions'
                : 'Register to submit magazines for Super Admin Sayhan’s curation'}
            </p>
          </div>

          {/* Tab Switcher */}
          <div className="grid grid-cols-2 p-1 bg-zinc-900 border border-zinc-800 rounded-xl mb-6 text-sm font-semibold">
            <button
              type="button"
              onClick={() => { setTab('login'); setError(''); }}
              className={`py-2 rounded-lg transition-all ${
                tab === 'login'
                  ? 'bg-yellow-500 text-black shadow-md'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => { setTab('register'); setError(''); }}
              className={`py-2 rounded-lg transition-all ${
                tab === 'register'
                  ? 'bg-yellow-500 text-black shadow-md'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Register
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-950/60 border border-red-800/80 rounded-xl flex items-start gap-2.5 text-xs text-red-200">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {tab === 'register' && (
              <>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-300 mb-1.5">
                    Full Name
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3" />
                    <input
                      type="text"
                      required
                      placeholder="Sayhan / Your Full Name"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full bg-[#14161b] border border-zinc-700/80 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-yellow-500 transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-300 mb-1.5">
                    Phone Number
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3" />
                    <input
                      type="tel"
                      required
                      placeholder="e.g. 9544498843"
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
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3" />
                <input
                  type="email"
                  required
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-[#14161b] border border-zinc-700/80 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-yellow-500 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-300 mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-[#14161b] border border-zinc-700/80 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-yellow-500 transition-colors"
                />
              </div>
            </div>

            {tab === 'register' && (
              <p className="text-[11px] text-zinc-400 italic">
                * Note: An automated registration alert will be dispatched to Super Admin Sayhan at <strong className="text-yellow-500">yellowreignacademy@gmail.com</strong>.
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-yellow-500 hover:bg-yellow-400 text-black font-bold rounded-xl transition-all shadow-md hover:shadow-gold-glow flex items-center justify-center gap-2 text-sm mt-2 disabled:opacity-50"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
              ) : tab === 'login' ? (
                'Sign In'
              ) : (
                'Complete Registration'
              )}
            </button>
          </form>

          {/* Quick Demo Login Pill for Sayhan */}
          <div className="mt-6 pt-5 border-t border-zinc-800 text-center">
            <button
              type="button"
              onClick={fillAdminCredentials}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold bg-yellow-500/10 text-yellow-400 border border-yellow-500/30 hover:bg-yellow-500/20 transition-all"
            >
              <Shield className="w-3.5 h-3.5" />
              Quick Fill: Super Admin Sayhan (yellowreignacademy@gmail.com)
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}

