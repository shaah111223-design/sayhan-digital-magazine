import React, { useState, useEffect } from 'react';
import { 
  Search, BookOpen, Crown, Layers, Sparkles, Shield, 
  ArrowRight, Compass, Filter, RefreshCw, QrCode 
} from 'lucide-react';
import { useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import MagazineCard from './components/MagazineCard';
import MagazineReader from './components/MagazineReader';
import QrCodeModal from './components/QrCodeModal';
import SubmitMagazineModal from './components/SubmitMagazineModal';
import AuthModal from './components/AuthModal';
import UserDashboard from './components/UserDashboard';
import AdminDashboard from './components/AdminDashboard';

export default function App() {
  const { user, isAuthenticated, isAdmin } = useAuth();

  const [currentView, setCurrentView] = useState('library'); // 'library' | 'user_dashboard' | 'admin_dashboard'
  
  // Public Library State
  const [magazines, setMagazines] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [loadingMagazines, setLoadingMagazines] = useState(true);

  // Modal States
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [authInitialTab, setAuthInitialTab] = useState('login');
  
  const [isSubmitOpen, setIsSubmitOpen] = useState(false);
  const [editMagazineTarget, setEditMagazineTarget] = useState(null);

  const [activeShareMagazine, setActiveShareMagazine] = useState(null);
  const [activeReaderId, setActiveReaderId] = useState(null);

  // Check URL pathname for direct reading link (/read/:slug)
  useEffect(() => {
    const path = window.location.pathname;
    if (path.startsWith('/read/')) {
      const slug = path.replace('/read/', '').trim();
      if (slug) {
        setActiveReaderId(slug);
      }
    }
  }, []);

  // Route access guard: Ensure non-admins cannot stay on admin_dashboard
  useEffect(() => {
    if (currentView === 'admin_dashboard' && !isAdmin) {
      setCurrentView('library');
    } else if (currentView === 'user_dashboard' && !isAuthenticated) {
      setCurrentView('library');
    }
  }, [currentView, isAuthenticated, isAdmin]);

  // Fetch Public Categories
  useEffect(() => {
    fetch('/api/magazines/categories')
      .then(res => res.json())
      .then(data => setCategories(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, []);

  // Fetch Published Public Magazines
  const fetchPublicMagazines = () => {
    setLoadingMagazines(true);
    let url = `/api/magazines/public?category=${selectedCategory}`;
    if (searchQuery.trim()) {
      url += `&search=${encodeURIComponent(searchQuery.trim())}`;
    }

    fetch(url)
      .then(res => res.json())
      .then(data => {
        setMagazines(data.magazines || []);
      })
      .catch(err => console.error('Failed to fetch public magazines:', err))
      .finally(() => setLoadingMagazines(false));
  };

  useEffect(() => {
    fetchPublicMagazines();
  }, [selectedCategory]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchPublicMagazines();
  };

  const handleOpenAuth = (tab = 'login') => {
    setAuthInitialTab(tab);
    setIsAuthOpen(true);
  };

  const handleOpenSubmit = (magazineToEdit = null) => {
    setEditMagazineTarget(magazineToEdit);
    setIsSubmitOpen(true);
  };

  const handleOpenReader = (magazine) => {
    setActiveReaderId(magazine.slug || magazine.id);
    window.history.pushState({}, '', `/read/${magazine.slug || magazine.id}`);
  };

  const handleCloseReader = () => {
    setActiveReaderId(null);
    window.history.pushState({}, '', '/');
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#08090b] text-zinc-100 selection:bg-yellow-500 selection:text-black">
      
      {/* Navigation */}
      <Navbar
        currentView={currentView}
        setCurrentView={setCurrentView}
        onOpenAuth={handleOpenAuth}
        onOpenSubmit={() => handleOpenSubmit()}
      />

      {/* Main Content Area */}
      <main className="flex-grow">
        
        {/* VIEW 1: USER DASHBOARD */}
        {currentView === 'user_dashboard' && isAuthenticated && (
          <UserDashboard
            onNewSubmission={() => handleOpenSubmit()}
            onEditSubmission={(mag) => handleOpenSubmit(mag)}
            onReadMagazine={handleOpenReader}
            onShareMagazine={(mag) => setActiveShareMagazine(mag)}
          />
        )}

        {/* VIEW 2: ADMIN DASHBOARD (Sayhan only) */}
        {currentView === 'admin_dashboard' && isAdmin && (
          <AdminDashboard
            onReadMagazine={handleOpenReader}
            onShareMagazine={(mag) => setActiveShareMagazine(mag)}
          />
        )}

        {/* VIEW 3: PUBLIC LIBRARY (Accessible by anyone without login) */}
        {currentView === 'library' && (
          <div>
            
            {/* Hero Section */}
            <section className="relative overflow-hidden py-16 sm:py-24 border-b border-zinc-800/80">
              
              {/* Subtle Background Glows */}
              <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-yellow-500/10 blur-[130px] rounded-full pointer-events-none"></div>

              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
                
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 text-xs font-bold uppercase tracking-widest mb-6 shadow-sm">
                  <Crown className="w-4 h-4" />
                  <span>Curated & Published Exclusively by Super Admin Sayhan</span>
                </div>

                <h1 className="font-serif-luxury text-4xl sm:text-6xl font-black tracking-tight text-white max-w-4xl mx-auto leading-tight sm:leading-none">
                  THE SOVEREIGN ARCHIVE OF <span className="gold-gradient-text">DIGITAL KNOWLEDGE</span>
                </h1>

                <p className="mt-6 text-sm sm:text-base text-zinc-400 max-w-2xl mx-auto leading-relaxed">
                  Anyone can submit high-caliber magazine publications. All works remain completely private in author vaults until Super Admin Sayhan inspects and authorizes publication to the public library.
                </p>

                {/* Hero CTA & Search */}
                <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4 max-w-xl mx-auto">
                  <form onSubmit={handleSearchSubmit} className="relative w-full">
                    <Search className="w-4 h-4 text-zinc-500 absolute left-4 top-3.5" />
                    <input
                      type="text"
                      placeholder="Search published magazines, topics, or authors..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-[#111317] border border-zinc-700/80 rounded-xl pl-11 pr-24 py-3 text-xs sm:text-sm text-white focus:outline-none focus:border-yellow-500 shadow-inner"
                    />
                    <button
                      type="submit"
                      className="absolute right-2 top-2 px-4 py-1.5 bg-yellow-500 hover:bg-yellow-400 text-black font-bold text-xs rounded-lg transition-colors"
                    >
                      Search
                    </button>
                  </form>
                </div>

                {/* Submissions Action Badge */}
                <div className="mt-8 flex flex-wrap items-center justify-center gap-3 text-xs">
                  <button
                    onClick={() => {
                      if (!isAuthenticated) handleOpenAuth('register');
                      else handleOpenSubmit();
                    }}
                    className="px-5 py-2.5 bg-yellow-500 hover:bg-yellow-400 text-black font-bold rounded-xl shadow-gold-glow flex items-center gap-2 transition-all"
                  >
                    <span>Submit Your Magazine</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>

                  <a
                    href="#library-grid"
                    className="px-5 py-2.5 bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 font-semibold rounded-xl border border-zinc-700 transition-colors"
                  >
                    Browse Public Library
                  </a>
                </div>

              </div>
            </section>

            {/* Public Magazine Gallery Section */}
            <section id="library-grid" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
              
              {/* Category Filter Chips */}
              <div className="flex items-center justify-between gap-4 mb-8 flex-wrap border-b border-zinc-800 pb-5">
                <div className="flex items-center gap-2 overflow-x-auto py-1 max-w-full">
                  <button
                    onClick={() => setSelectedCategory('all')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
                      selectedCategory === 'all'
                        ? 'bg-yellow-500 text-black shadow-md'
                        : 'bg-[#111317] text-zinc-400 hover:text-white border border-zinc-800'
                    }`}
                  >
                    All Publications ({magazines.length})
                  </button>
                  {categories.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => setSelectedCategory(c.slug)}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
                        selectedCategory === c.slug
                          ? 'bg-yellow-500 text-black shadow-md'
                          : 'bg-[#111317] text-zinc-400 hover:text-white border border-zinc-800'
                      }`}
                    >
                      {c.name}
                    </button>
                  ))}
                </div>

                <div className="text-xs text-zinc-400 font-medium">
                  Showing <strong className="text-yellow-400">{magazines.length}</strong> published magazines
                </div>
              </div>

              {/* Grid of Magazines */}
              {loadingMagazines ? (
                <div className="text-center py-20">
                  <div className="w-10 h-10 border-3 border-yellow-500/20 border-t-yellow-500 rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-xs text-zinc-400 font-serif-luxury tracking-wider uppercase">Loading Public Archive...</p>
                </div>
              ) : magazines.length === 0 ? (
                <div className="text-center py-24 bg-[#0d0f13] border border-zinc-800/80 rounded-2xl p-8">
                  <BookOpen className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
                  <h3 className="font-serif-luxury text-lg font-bold text-white mb-2">No Published Magazines Found</h3>
                  <p className="text-xs text-zinc-400 max-w-md mx-auto mb-6">
                    {searchQuery 
                      ? `No publications match "${searchQuery}". Try a different keyword or category.`
                      : 'Be the first to submit a digital magazine for Super Admin Sayhan’s curation!'}
                  </p>
                  <button
                    onClick={() => {
                      if (!isAuthenticated) handleOpenAuth('register');
                      else handleOpenSubmit();
                    }}
                    className="px-5 py-2.5 bg-yellow-500 text-black font-bold text-xs rounded-xl hover:bg-yellow-400"
                  >
                    Submit a Magazine
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
                  {magazines.map((mag) => (
                    <MagazineCard
                      key={mag.id}
                      magazine={mag}
                      onRead={handleOpenReader}
                      onShare={(m) => setActiveShareMagazine(m)}
                    />
                  ))}
                </div>
              )}

            </section>

          </div>
        )}

      </main>

      {/* Footer */}
      <Footer onOpenAdminAuth={() => handleOpenAuth('login')} />

      {/* MODAL: Auth (Login / Register) */}
      <AuthModal
        isOpen={isAuthOpen}
        initialTab={authInitialTab}
        onClose={() => setIsAuthOpen(false)}
        onSuccess={(destination, loggedInUser) => {
          fetchPublicMagazines();
          if (destination) {
            setCurrentView(destination);
          } else if (loggedInUser?.role === 'ADMIN') {
            setCurrentView('admin_dashboard');
          } else {
            setCurrentView('user_dashboard');
          }
        }}
      />

      {/* MODAL: Submit / Edit Magazine */}
      <SubmitMagazineModal
        isOpen={isSubmitOpen}
        editMagazine={editMagazineTarget}
        onClose={() => {
          setIsSubmitOpen(false);
          setEditMagazineTarget(null);
        }}
        onSuccess={() => {
          if (currentView === 'user_dashboard') {
            window.location.reload();
          }
        }}
      />

      {/* MODAL: QR Code & Share */}
      {activeShareMagazine && (
        <QrCodeModal
          magazine={activeShareMagazine}
          isOpen={!!activeShareMagazine}
          onClose={() => setActiveShareMagazine(null)}
        />
      )}

      {/* MODAL / VIEWPORT: Magazine Reader */}
      {activeReaderId && (
        <MagazineReader
          magazineIdOrSlug={activeReaderId}
          onClose={handleCloseReader}
          onOpenShare={(mag) => setActiveShareMagazine(mag)}
        />
      )}

    </div>
  );
}

