import React, { useState } from 'react';
import { X, QrCode, Download, Copy, Check, MessageSquare, Share2, Globe, ShieldCheck } from 'lucide-react';

export default function QrCodeModal({ magazine, isOpen, onClose }) {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !magazine) return null;

  const publicUrl = `${window.location.origin}/read/${magazine.slug || magazine.id}`;
  const qrImage = magazine.qr_code_data_url || '';

  const handleCopy = () => {
    navigator.clipboard.writeText(publicUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  const handleDownloadQr = () => {
    if (!qrImage) return;
    const a = document.createElement('a');
    a.href = qrImage;
    a.download = `YellowReign_${magazine.slug || magazine.id}_QR.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const shareText = `Read "${magazine.title}" on Yellow Reign Academy Digital Magazine: ${publicUrl}`;
  const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`;

  const handleNativeShare = () => {
    if (navigator.share) {
      navigator.share({
        title: magazine.title,
        text: `Read "${magazine.title}" on Yellow Reign Academy`,
        url: publicUrl
      }).catch(() => {});
    } else {
      handleCopy();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-md bg-[#0e1014] border border-yellow-500/40 rounded-2xl shadow-gold-glow-lg overflow-hidden">
        
        {/* Top gold bar */}
        <div className="h-2 bg-gradient-to-r from-yellow-500 via-amber-400 to-yellow-600"></div>

        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-zinc-400 hover:text-white p-1 rounded-lg transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-6 sm:p-8 text-center">
          
          <div className="w-12 h-12 rounded-xl bg-yellow-500/10 border border-yellow-500/30 flex items-center justify-center mx-auto mb-3">
            <QrCode className="w-6 h-6 text-yellow-500" />
          </div>

          <h3 className="font-serif-luxury text-xl font-bold text-white tracking-wide">
            Public QR & Permanent Link
          </h3>
          <p className="text-xs text-zinc-400 mt-1 line-clamp-1">
            {magazine.title}
          </p>

          {/* QR Code Container */}
          <div className="my-6 p-4 bg-white rounded-2xl max-w-[220px] mx-auto shadow-2xl relative border-4 border-[#14161b]">
            {qrImage ? (
              <img
                src={qrImage}
                alt={`QR Code for ${magazine.title}`}
                className="w-full h-auto aspect-square object-contain"
              />
            ) : (
              <div className="w-48 h-48 bg-zinc-200 flex items-center justify-center text-zinc-500 text-xs">
                Generating QR...
              </div>
            )}
            <div className="mt-2 text-[9px] font-bold text-black tracking-widest uppercase">
              YELLOW REIGN ACADEMY
            </div>
          </div>

          <p className="text-[11px] text-zinc-400 leading-relaxed mb-6 px-4">
            Scanning this cryptographic QR code opens the exact published magazine instantly on any phone or tablet without login.
          </p>

          {/* Permanent Link Input & Copy */}
          <div className="flex items-center gap-2 bg-[#14161c] border border-zinc-700/80 rounded-xl p-1.5 mb-5 text-left">
            <Globe className="w-4 h-4 text-yellow-500 ml-2 shrink-0" />
            <input
              type="text"
              readOnly
              value={publicUrl}
              className="bg-transparent text-xs text-zinc-300 w-full focus:outline-none truncate"
            />
            <button
              onClick={handleCopy}
              className="px-3 py-1.5 bg-yellow-500 hover:bg-yellow-400 text-black font-bold rounded-lg text-xs transition-colors shrink-0 flex items-center gap-1"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied!' : 'Copy'}</span>
            </button>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={handleDownloadQr}
              className="py-2.5 px-3 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 border border-zinc-700/60 transition-colors"
            >
              <Download className="w-4 h-4 text-yellow-500" />
              <span>Download QR</span>
            </button>

            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="py-2.5 px-3 bg-[#25D366]/20 hover:bg-[#25D366]/30 text-[#25D366] border border-[#25D366]/40 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
            >
              <MessageSquare className="w-4 h-4" />
              <span>Share WhatsApp</span>
            </a>
          </div>

        </div>
      </div>
    </div>
  );
}

