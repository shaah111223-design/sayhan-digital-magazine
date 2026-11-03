import React from 'react';
import { BookOpen, Crown, PlusCircle, LayoutDashboard, ShieldCheck, LogIn, LogOut, User as UserIcon } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Navbar({ currentView, setCurrentView, onOpenAuth, onOpenSubmit }) {
  const { user, isAuthenticated, isAdmin, logout } = useAuth();

  return (
    <header className="sticky top-0 z-40 bg-[#08090b]/90 backdrop-blur-md border-b border-zinc-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        
        {/* Brand Logo */}
        <div 
          onClick={() => setCurrentView('library')} 
          className="flex items-center gap-3 cursor-pointer group"
        >
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-yellow-400 via-yellow-500 to-yellow-600 p-[2px] shadow-gold-glow transition-transform duration-300 group-hover:scale-105">
            <div className="w-full h-full bg-[#0c0d0e] rounded-[10px] flex items-center justify-center">
              <Crown className="w-6 h-6 text-yellow-500 group-hover:rotate-12 transition-transform duration-300" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-serif-luxury text-xl sm:text-2xl font-black tracking-wider text-white">
                YELLOW <span className="text-yellow-500">REIGN</span>
              </span>
            </div>
            <p className="text-[10px] tracking-[0.25em] text-zinc-400 uppercase font-semibold">
              Academy Digital Publishing
            </p>
          </div>
        </div>

        {/* Center / Navigation Links */}
        <nav className="hidden md:flex items-center gap-1">
          <button
            onClick={() => setCurrentView('library')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
              currentView === 'library' 
                ? 'bg-zinc-800/80 text-yellow-400 border border-yellow-500/30' 
                : 'text-zinc-300 hover:text-white hover:bg-zinc-800/40'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            Public Library
          </button>

          <button
            onClick={() => {
              if (!isAuthenticated) {
                onOpenAuth('login');
              } else {
                onOpenSubmit();
              }
            }}
            className="px-4 py-2 rounded-lg text-sm font-medium text-zinc-300 hover:text-white hover:bg-zinc-800/40 transition-colors flex items-center gap-2"
          >
            <PlusCircle className="w-4 h-4 text-yellow-500" />
            Submit Magazine
          </button>

          {isAuthenticated && (
            <button
              onClick={() => setCurrentView('user_dashboard')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                currentView === 'user_dashboard'
                  ? 'bg-zinc-800/80 text-yellow-400 border border-yellow-500/30'
                  : 'text-zinc-300 hover:text-white hover:bg-zinc-800/40'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              My Submissions
            </button>
          )}

          {isAdmin && (
            <button
              onClick={() => setCurrentView('admin_dashboard')}
              className={`ml-2 px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${
                currentView === 'admin_dashboard'
                  ? 'bg-yellow-500 text-black shadow-gold-glow'
                  : 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/40 hover:bg-yellow-500/20'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              Sayhan Admin Desk
            </button>
          )}
        </nav>

        {/* Right Section (User Auth State) */}
        <div className="flex items-center gap-3">
          {isAuthenticated ? (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2.5 bg-[#121418] border border-zinc-800 px-3 py-1.5 rounded-full">
                <div className="w-7 h-7 rounded-full bg-yellow-500/20 border border-yellow-500/50 flex items-center justify-center text-yellow-400 text-xs font-bold">
                  {user.full_name ? user.full_name[0].toUpperCase() : 'U'}
                </div>
                <div className="hidden sm:block text-left">
                  <p className="text-xs font-semibold text-white leading-tight">{user.full_name}</p>
                  <p className="text-[10px] text-yellow-500 uppercase tracking-wider font-bold">
                    {user.role === 'ADMIN' ? 'SUPER ADMIN' : 'AUTHOR'}
                  </p>
                </div>
              </div>

              <button
                onClick={logout}
                title="Log Out"
                className="p-2 text-zinc-400 hover:text-red-400 hover:bg-zinc-800/60 rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => onOpenAuth('login')}
                className="px-3.5 py-1.5 text-sm font-medium text-zinc-300 hover:text-white transition-colors flex items-center gap-1.5"
              >
                <LogIn className="w-4 h-4" />
                Sign In
              </button>
              <button
                onClick={() => onOpenAuth('register')}
                className="px-4 py-2 text-sm font-bold text-black bg-yellow-500 hover:bg-yellow-400 rounded-lg shadow-sm transition-all hover:shadow-gold-glow"
              >
                Register
              </button>
            </div>
          )}
        </div>

      </div>
    </header>
  );
}

