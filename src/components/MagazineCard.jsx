import React from 'react';
import { BookOpen, QrCode, Calendar, Layers, Eye, Share2 } from 'lucide-react';

export default function MagazineCard({ magazine, onRead, onShare }) {
  const coverUrl = magazine.cover_image?.startsWith('http')
    ? magazine.cover_image
    : magazine.cover_image?.includes('_cover.svg')
    ? `/samples/${magazine.cover_image}`
    : `/api/files/magazine/${magazine.id}/cover`;

  const formattedDate = magazine.published_at
    ? new Date(magazine.published_at).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      })
    : 'Recently';

  return (
    <div className="group relative bg-[#0d0f13] border border-zinc-800/90 rounded-2xl overflow-hidden hover:border-yellow-500/50 transition-all duration-300 hover:shadow-gold-glow flex flex-col h-full">
      
      {/* Cover Image Container */}
      <div 
        onClick={() => onRead(magazine)}
        className="relative aspect-[3/4] w-full overflow-hidden bg-zinc-950 cursor-pointer"
      >
        <img
          src={coverUrl}
          alt={magazine.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          onError={(e) => {
            // Fallback placeholder
            e.currentTarget.src = `data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 600 800' fill='%230e1014'><rect width='600' height='800'/><text x='300' y='400' fill='%23eab308' font-size='28' text-anchor='middle' font-family='sans-serif'>${encodeURIComponent(magazine.title)}</text></svg>`;
          }}
        />

        {/* Hover Read Overlay */}
        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center p-4">
          <div className="transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300 flex items-center gap-2 bg-yellow-500 text-black px-5 py-2.5 rounded-full font-bold text-sm shadow-gold-glow">
            <BookOpen className="w-4 h-4" />
            <span>Open Magazine</span>
          </div>
        </div>

        {/* Category & Page Count Badges */}
        <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
          <span className="bg-black/80 backdrop-blur-md text-yellow-400 border border-yellow-500/40 text-[11px] font-bold px-2.5 py-1 rounded-md uppercase tracking-wider">
            {magazine.category_name || 'Academy'}
          </span>
        </div>

        <div className="absolute top-3 right-3 bg-black/80 backdrop-blur-md text-zinc-300 text-[11px] font-semibold px-2.5 py-1 rounded-md flex items-center gap-1 border border-zinc-700/60">
          <Layers className="w-3 h-3 text-yellow-500" />
          <span>{magazine.page_count || 1} pgs</span>
        </div>
      </div>

      {/* Content Meta */}
      <div className="p-5 flex flex-col flex-grow">
        
        <div className="flex items-center justify-between text-xs text-zinc-500 mb-2">
          <span className="flex items-center gap-1.5 text-zinc-400">
            <Calendar className="w-3.5 h-3.5 text-yellow-500" />
            {formattedDate}
          </span>
          <span className="flex items-center gap-1 text-zinc-400">
            <Eye className="w-3.5 h-3.5 text-zinc-500" />
            {magazine.view_count || 0} reads
          </span>
        </div>

        <h3 
          onClick={() => onRead(magazine)}
          className="font-serif-luxury text-lg font-bold text-white group-hover:text-yellow-400 transition-colors line-clamp-1 cursor-pointer mb-2"
        >
          {magazine.title}
        </h3>

        <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed flex-grow mb-4">
          {magazine.description || 'Exclusive curated publication from Yellow Reign Academy.'}
        </p>

        {/* Action Bar */}
        <div className="pt-3 border-t border-zinc-800/80 flex items-center justify-between gap-2 mt-auto">
          <div className="text-[11px] text-zinc-400">
            By <span className="text-zinc-200 font-semibold">{magazine.author_name || 'Sayhan (Super Admin)'}</span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => onShare(magazine)}
              title="View QR Code & Share"
              className="p-2 bg-zinc-800/60 hover:bg-yellow-500/20 text-zinc-300 hover:text-yellow-400 border border-zinc-700/60 hover:border-yellow-500/40 rounded-lg transition-colors text-xs font-semibold flex items-center gap-1"
            >
              <QrCode className="w-3.5 h-3.5 text-yellow-500" />
              <span className="hidden sm:inline">QR</span>
            </button>

            <button
              onClick={() => onRead(magazine)}
              className="px-3.5 py-1.5 bg-yellow-500/10 hover:bg-yellow-500 text-yellow-400 hover:text-black border border-yellow-500/30 hover:border-transparent rounded-lg font-bold text-xs transition-all flex items-center gap-1.5"
            >
              <span>Read</span>
              <BookOpen className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

      </div>

    </div>
  );
}

