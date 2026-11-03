import React from 'react';
import { Crown, Mail, Phone, ShieldCheck, Heart } from 'lucide-react';

export default function Footer({ onOpenAdminAuth }) {
  return (
    <footer className="bg-[#060708] border-t border-zinc-800/80 mt-20 pt-16 pb-12 text-zinc-400">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 pb-12 border-b border-zinc-800/60">
          
          {/* Brand Info */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-yellow-500/20 border border-yellow-500/40 flex items-center justify-center">
                <Crown className="w-5 h-5 text-yellow-500" />
              </div>
              <span className="font-serif-luxury text-xl font-bold tracking-wider text-white">
                YELLOW <span className="text-yellow-500">REIGN</span> ACADEMY
              </span>
            </div>
            <p className="text-sm text-zinc-400 leading-relaxed max-w-md">
              A high-caliber digital magazine submission and publishing sanctuary. All registered works undergo meticulous editorial review and cryptographic verification before being elevated into the permanent public library.
            </p>
            <div className="inline-flex items-center gap-2 bg-[#101216] border border-yellow-500/30 px-3.5 py-1.5 rounded-full text-xs text-yellow-400">
              <ShieldCheck className="w-4 h-4" />
              <span>Super Admin Publishing Protocol Active</span>
            </div>
          </div>

          {/* Super Admin Direct Contacts */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-widest text-zinc-200 mb-4">
              Super Admin Authority
            </h4>
            <ul className="space-y-3 text-sm">
              <li className="flex items-center gap-2.5 text-zinc-300">
                <span className="w-2 h-2 rounded-full bg-yellow-500"></span>
                <span>Curator: <strong className="text-white">Sayhan</strong></span>
              </li>
              <li className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-yellow-500 shrink-0" />
                <a href="tel:9544498843" className="hover:text-yellow-400 transition-colors">
                  +91 9544498843
                </a>
              </li>
              <li className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-yellow-500 shrink-0" />
                <a href="mailto:yellowreignacademy@gmail.com" className="hover:text-yellow-400 transition-colors break-all">
                  yellowreignacademy@gmail.com
                </a>
              </li>
            </ul>
          </div>

          {/* Publishing Policy */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-widest text-zinc-200 mb-4">
              Editorial Standards
            </h4>
            <ul className="space-y-2 text-sm text-zinc-400">
              <li>• Private Author Folders</li>
              <li>• Zero Pre-Publication Leaks</li>
              <li>• Multi-Format Support (PDF/Images)</li>
              <li>• Cryptographic QR Verification</li>
              <li>• Permanent Public Slugs</li>
            </ul>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-zinc-500 gap-4">
          <p>© {new Date().getFullYear()} Yellow Reign Academy. All Rights Reserved. Super Admin: Sayhan.</p>
          <div className="flex items-center gap-4">
            <span>Powered by Sovereign Digital Publishing Engine</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

