import React, { useState, useEffect, useRef } from 'react';
import { 
  ChevronLeft, ChevronRight, X, ZoomIn, ZoomOut, RotateCcw, 
  Maximize, Minimize, QrCode, Share2, BookOpen, Layers, 
  Grid, Compass, CheckCircle2 
} from 'lucide-react';

export default function MagazineReader({ magazineIdOrSlug, onClose, onOpenShare }) {
  const [magazine, setMagazine] = useState(null);
  const [pages, setPages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Reader state
  const [currentPage, setCurrentPage] = useState(1);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [viewMode, setViewMode] = useState('flip'); // 'flip' | 'single' | 'scroll'
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showThumbnails, setShowThumbnails] = useState(false);
  const [flipDirection, setFlipDirection] = useState('next'); // for 3D flip animation

  const containerRef = useRef(null);

  // Fetch published magazine & ordered pages
  useEffect(() => {
    setLoading(true);
    fetch(`/api/magazines/public/${magazineIdOrSlug}`)
      .then(res => {
        if (!res.ok) throw new Error('Could not load published magazine.');
        return res.json();
      })
      .then(data => {
        setMagazine(data.magazine);
        setPages(data.pages || []);

        // Record view increment
        fetch(`/api/magazines/public/${magazineIdOrSlug}/view`, { method: 'POST' }).catch(() => {});
      })
      .catch(err => {
        setError(err.message);
      })
      .finally(() => setLoading(false));
  }, [magazineIdOrSlug]);

  const totalPages = pages.length;

  const getPageUrl = (page) => {
    if (!page) return '';
    if (page.file_path?.includes('_p') && page.file_path?.endsWith('.svg')) {
      return `/samples/${page.file_path}`;
    }
    return `/api/files/magazine/${magazine.id}/page/${page.id}`;
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowRight' || e.key === 'PageDown' || e.key === ' ') {
        e.preventDefault();
        goToNext();
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        e.preventDefault();
        goToPrev();
      } else if (e.key === 'Escape') {
        if (isFullscreen) {
          exitFullscreen();
        } else {
          onClose();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentPage, totalPages, isFullscreen]);

  const goToNext = () => {
    if (currentPage < totalPages) {
      setFlipDirection('next');
      setCurrentPage(prev => prev + 1);
    }
  };

  const goToPrev = () => {
    if (currentPage > 1) {
      setFlipDirection('prev');
      setCurrentPage(prev => prev - 1);
    }
  };

  const handleZoomIn = () => setZoomLevel(prev => Math.min(prev + 0.25, 2.5));
  const handleZoomOut = () => setZoomLevel(prev => Math.max(prev - 0.25, 0.75));
  const handleResetZoom = () => setZoomLevel(1);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen?.().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen?.().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  const exitFullscreen = () => {
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    }
    setIsFullscreen(false);
  };

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 bg-[#07080a] flex flex-col items-center justify-center p-4">
        <div className="w-12 h-12 border-4 border-yellow-500/20 border-t-yellow-500 rounded-full animate-spin mb-4"></div>
        <p className="font-serif-luxury text-lg text-yellow-400 font-bold tracking-widest uppercase">Opening Sovereign Reader</p>
        <p className="text-xs text-zinc-500 mt-1">Yellow Reign Academy High-Resolution Engine</p>
      </div>
    );
  }

  if (error || !magazine) {
    return (
      <div className="fixed inset-0 z-50 bg-[#07080a] flex flex-col items-center justify-center p-4 text-center">
        <div className="p-6 bg-red-950/40 border border-red-800 rounded-2xl max-w-md">
          <h3 className="font-serif-luxury text-xl font-bold text-red-400 mb-2">Unavailable</h3>
          <p className="text-sm text-zinc-300 mb-6">{error || 'Magazine not found or awaiting publication.'}</p>
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-yellow-500 text-black font-bold rounded-xl text-sm hover:bg-yellow-400"
          >
            Return to Library
          </button>
        </div>
      </div>
    );
  }

  const activePageObj = pages[currentPage - 1];

  return (
    <div 
      ref={containerRef}
      className="fixed inset-0 z-50 bg-[#07080a] text-zinc-100 flex flex-col select-none overflow-hidden"
    >
      
      {/* Top Header Controls Bar */}
      <div className="h-16 px-4 sm:px-6 bg-[#0c0d10] border-b border-zinc-800/90 flex items-center justify-between z-20 shrink-0">
        
        {/* Left: Magazine Title & Status */}
        <div className="flex items-center gap-3 overflow-hidden">
          <button
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors shrink-0"
            title="Close Reader (Esc)"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="overflow-hidden">
            <h2 className="font-serif-luxury text-sm sm:text-base font-bold text-white truncate max-w-xs sm:max-w-md">
              {magazine.title}
            </h2>
            <div className="flex items-center gap-2 text-[11px] text-zinc-400">
              <span className="text-yellow-500 font-semibold uppercase">{magazine.category_name}</span>
              <span>•</span>
              <span>{magazine.author_name}</span>
            </div>
          </div>
        </div>

        {/* Center: Page Navigation & Mode Switcher */}
        <div className="hidden md:flex items-center gap-3">
          {/* Mode Switcher */}
          <div className="flex items-center bg-zinc-900 border border-zinc-800 rounded-lg p-1 text-xs font-semibold">
            <button
              onClick={() => setViewMode('flip')}
              className={`px-3 py-1 rounded-md transition-colors ${
                viewMode === 'flip' ? 'bg-yellow-500 text-black shadow-sm' : 'text-zinc-400 hover:text-white'
              }`}
              title="3D Flipbook Page Turning Mode"
            >
              3D Flipbook
            </button>
            <button
              onClick={() => setViewMode('single')}
              className={`px-3 py-1 rounded-md transition-colors ${
                viewMode === 'single' ? 'bg-yellow-500 text-black shadow-sm' : 'text-zinc-400 hover:text-white'
              }`}
              title="Single Slide Mode"
            >
              Single Slide
            </button>
            <button
              onClick={() => setViewMode('scroll')}
              className={`px-3 py-1 rounded-md transition-colors ${
                viewMode === 'scroll' ? 'bg-yellow-500 text-black shadow-sm' : 'text-zinc-400 hover:text-white'
              }`}
              title="Vertical Scroll Mode"
            >
              Scroll
            </button>
          </div>

          {/* Page Counter */}
          {viewMode !== 'scroll' && (
            <div className="flex items-center gap-2 bg-[#121418] border border-zinc-800 px-3 py-1.5 rounded-lg text-xs font-semibold">
              <span className="text-yellow-400">Page {currentPage}</span>
              <span className="text-zinc-500">/</span>
              <span className="text-zinc-400">{totalPages}</span>
            </div>
          )}
        </div>

        {/* Right: Zoom, Thumbnails, QR, Fullscreen */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          
          {/* Zoom controls */}
          <div className="hidden sm:flex items-center bg-zinc-900/80 border border-zinc-800 rounded-lg p-0.5">
            <button
              onClick={handleZoomOut}
              className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded"
              title="Zoom Out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="text-[11px] font-mono px-2 text-zinc-400">{Math.round(zoomLevel * 100)}%</span>
            <button
              onClick={handleZoomIn}
              className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded"
              title="Zoom In"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            {zoomLevel !== 1 && (
              <button
                onClick={handleResetZoom}
                className="p-1.5 text-yellow-500 hover:bg-zinc-800 rounded"
                title="Reset Zoom"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Thumbnails Toggle */}
          <button
            onClick={() => setShowThumbnails(!showThumbnails)}
            className={`p-2 rounded-lg border transition-colors ${
              showThumbnails
                ? 'bg-yellow-500 text-black border-yellow-500'
                : 'text-zinc-300 border-zinc-800 hover:bg-zinc-800'
            }`}
            title="Page Thumbnails"
          >
            <Grid className="w-4 h-4" />
          </button>

          {/* QR & Share */}
          <button
            onClick={() => onOpenShare(magazine)}
            className="p-2 text-yellow-400 hover:text-black hover:bg-yellow-500 border border-yellow-500/40 rounded-lg transition-all"
            title="View QR Code & WhatsApp Share"
          >
            <QrCode className="w-4 h-4" />
          </button>

          {/* Fullscreen */}
          <button
            onClick={toggleFullscreen}
            className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors hidden sm:block"
            title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
          >
            {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
          </button>
        </div>

      </div>

      {/* Main Reader Viewport */}
      <div className="relative flex-grow flex items-center justify-center p-2 sm:p-6 overflow-hidden bg-gradient-to-b from-[#07080a] via-[#090b0e] to-[#050608]">
        
        {/* Previous Page Button (Float) */}
        {viewMode !== 'scroll' && (
          <button
            onClick={goToPrev}
            disabled={currentPage === 1}
            className="absolute left-4 z-30 w-12 h-12 rounded-full bg-black/70 hover:bg-yellow-500 text-white hover:text-black border border-yellow-500/40 backdrop-blur-md flex items-center justify-center transition-all disabled:opacity-20 disabled:hover:bg-black/70 disabled:hover:text-white shadow-xl"
            title="Previous Page (Left Arrow)"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
        )}

        {/* Next Page Button (Float) */}
        {viewMode !== 'scroll' && (
          <button
            onClick={goToNext}
            disabled={currentPage === totalPages}
            className="absolute right-4 z-30 w-12 h-12 rounded-full bg-black/70 hover:bg-yellow-500 text-white hover:text-black border border-yellow-500/40 backdrop-blur-md flex items-center justify-center transition-all disabled:opacity-20 disabled:hover:bg-black/70 disabled:hover:text-white shadow-xl"
            title="Next Page (Right Arrow)"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        )}

        {/* Content Renderers */}
        {viewMode === 'scroll' ? (
          // Continuous Vertical Scroll
          <div className="w-full h-full overflow-y-auto space-y-8 flex flex-col items-center px-4 py-8">
            {pages.map((p, idx) => (
              <div 
                key={p.id}
                className="max-w-3xl w-full bg-[#111317] rounded-xl overflow-hidden border border-zinc-800 shadow-2xl relative"
              >
                <div className="absolute top-3 left-3 bg-black/80 px-2 py-1 rounded text-[10px] font-mono text-yellow-400 border border-yellow-500/30">
                  Page {idx + 1}
                </div>
                <img
                  src={getPageUrl(p)}
                  alt={`Page ${idx + 1}`}
                  className="w-full h-auto object-contain"
                />
              </div>
            ))}
          </div>
        ) : (
          // Page View with optional 3D Flip Perspective
          <div 
            className="w-full h-full flex items-center justify-center flipbook-container"
            style={{
              transform: `scale(${zoomLevel})`,
              transition: 'transform 0.2s ease-out'
            }}
          >
            {activePageObj && (
              <div 
                key={activePageObj.id}
                className={`relative max-w-2xl max-h-[85vh] aspect-[1/1.414] bg-[#0f1115] rounded-xl overflow-hidden border border-yellow-500/30 shadow-2xl ${
                  viewMode === 'flip' ? 'flip-page' : ''
                }`}
              >
                <img
                  src={getPageUrl(activePageObj)}
                  alt={`Page ${currentPage}`}
                  className="w-full h-full object-contain"
                />

                {/* Subtle Magazine Spine Shadow on Left Edge */}
                <div className="absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-black/60 to-transparent pointer-events-none"></div>
                {/* Subtle Edge Highlight on Right Edge */}
                <div className="absolute inset-y-0 right-0 w-3 bg-gradient-to-l from-white/10 to-transparent pointer-events-none"></div>
              </div>
            )}
          </div>
        )}

      </div>

      {/* Bottom Thumbnail Scrubber Drawer */}
      {showThumbnails && (
        <div className="h-32 bg-[#0c0e12] border-t border-zinc-800/90 px-4 py-3 flex items-center gap-3 overflow-x-auto shrink-0 z-20">
          {pages.map((p, idx) => {
            const pageNum = idx + 1;
            const isCurrent = pageNum === currentPage;
            return (
              <div
                key={p.id}
                onClick={() => {
                  setCurrentPage(pageNum);
                }}
                className={`relative aspect-[1/1.4] h-24 rounded-lg overflow-hidden shrink-0 cursor-pointer border-2 transition-all ${
                  isCurrent 
                    ? 'border-yellow-500 scale-105 shadow-gold-glow' 
                    : 'border-zinc-800 hover:border-zinc-600 opacity-70 hover:opacity-100'
                }`}
              >
                <img
                  src={getPageUrl(p)}
                  alt={`Thumb ${pageNum}`}
                  className="w-full h-full object-cover"
                />
                <span className="absolute bottom-1 right-1 bg-black/80 text-[10px] font-mono text-white px-1.5 py-0.5 rounded">
                  {pageNum}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* Mobile Footer Scrubber */}
      {viewMode !== 'scroll' && (
        <div className="md:hidden h-12 bg-[#0c0e12] border-t border-zinc-800/80 px-4 flex items-center justify-between text-xs text-zinc-400">
          <button onClick={goToPrev} disabled={currentPage === 1} className="disabled:opacity-30 text-yellow-500">
            Previous
          </button>
          <span className="font-semibold text-white">
            Page {currentPage} of {totalPages}
          </span>
          <button onClick={goToNext} disabled={currentPage === totalPages} className="disabled:opacity-30 text-yellow-500">
            Next
          </button>
        </div>
      )}

    </div>
  );
}

