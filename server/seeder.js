import fs from 'node:fs';
import path from 'node:path';
import { db } from './db.js';
import { generateMagazineQrCode } from './utils/qr.js';

const SAMPLES_DIR = path.resolve(process.cwd(), 'public', 'samples');
if (!fs.existsSync(SAMPLES_DIR)) {
  fs.mkdirSync(SAMPLES_DIR, { recursive: true });
}

// Generate beautiful magazine page SVG
function createSvgMagazinePage({ title, pageNumber, subtitle, mainText, highlight, themeColor = '#EAB308', bgDark = '#0e1013' }) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 1130" width="100%" height="100%">
    <defs>
      <linearGradient id="bgGrad_${pageNumber}" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${bgDark}" />
        <stop offset="100%" stop-color="#14171c" />
      </linearGradient>
      <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="#EAB308" />
        <stop offset="100%" stop-color="#FDE047" />
      </linearGradient>
    </defs>
    
    <!-- Background Canvas -->
    <rect width="800" height="1130" fill="url(#bgGrad_${pageNumber})" />
    
    <!-- Outer Elegant Border -->
    <rect x="25" y="25" width="750" height="1080" fill="none" stroke="#27272a" stroke-width="1.5" />
    <rect x="35" y="35" width="730" height="1060" fill="none" stroke="${themeColor}" stroke-opacity="0.25" stroke-width="1" />
    
    <!-- Header Banner -->
    <text x="50" y="70" fill="${themeColor}" font-family="system-ui, -apple-system, sans-serif" font-size="13" font-weight="900" letter-spacing="4">YELLOW REIGN ACADEMY EDITORIAL</text>
    <text x="750" y="70" text-anchor="end" fill="#71717a" font-family="system-ui, sans-serif" font-size="12" letter-spacing="1">VOL. IV • EDITION 2026</text>
    <line x1="50" y1="85" x2="750" y2="85" stroke="#27272a" stroke-width="1" />

    <!-- Top Badge -->
    <rect x="50" y="120" width="110" height="26" rx="4" fill="${themeColor}" />
    <text x="105" y="137" text-anchor="middle" fill="#000000" font-family="system-ui, sans-serif" font-size="11" font-weight="bold" letter-spacing="1.5">${highlight}</text>

    <!-- Page Title & Subtitle -->
    <text x="50" y="195" fill="#FFFFFF" font-family="Georgia, serif" font-size="34" font-weight="bold">${title}</text>
    <text x="50" y="230" fill="${themeColor}" font-family="system-ui, sans-serif" font-size="16" font-weight="600" letter-spacing="1">${subtitle}</text>

    <!-- Visual Feature Block -->
    <g transform="translate(50, 270)">
      <rect width="700" height="380" rx="10" fill="#181a20" stroke="#27272a" />
      <circle cx="350" cy="190" r="130" fill="none" stroke="${themeColor}" stroke-opacity="0.15" stroke-width="2" />
      <circle cx="350" cy="190" r="90" fill="none" stroke="${themeColor}" stroke-opacity="0.3" stroke-width="1.5" stroke-dasharray="6,6" />
      <polygon points="350,90 420,240 280,240" fill="none" stroke="url(#goldGrad)" stroke-width="2" />
      <text x="350" y="295" text-anchor="middle" fill="#f4f4f5" font-family="Georgia, serif" font-size="18" font-style="italic">"Where ambition meets institutional mastery."</text>
      <text x="350" y="325" text-anchor="middle" fill="#a1a1aa" font-family="system-ui, sans-serif" font-size="12" letter-spacing="2">ACADEMY CURATED EXHIBIT</text>
    </g>

    <!-- Columns of Text -->
    <g transform="translate(50, 680)">
      <rect width="335" height="340" rx="8" fill="#121418" stroke="#27272a" />
      <text x="25" y="40" fill="${themeColor}" font-family="system-ui, sans-serif" font-size="14" font-weight="bold" letter-spacing="1">SECTION I: SYNTHESIS</text>
      <foreignObject x="25" y="55" width="285" height="260">
        <div xmlns="http://www.w3.org/1999/xhtml" style="color: #d4d4d8; font-family: system-ui, sans-serif; font-size: 13px; line-height: 1.7; text-align: justify;">
          ${mainText}
        </div>
      </foreignObject>
    </g>

    <g transform="translate(415, 680)">
      <rect width="335" height="340" rx="8" fill="#121418" stroke="#27272a" />
      <text x="25" y="40" fill="${themeColor}" font-family="system-ui, sans-serif" font-size="14" font-weight="bold" letter-spacing="1">SECTION II: EXECUTIVE PERSPECTIVE</text>
      <foreignObject x="25" y="55" width="285" height="260">
        <div xmlns="http://www.w3.org/1999/xhtml" style="color: #d4d4d8; font-family: system-ui, sans-serif; font-size: 13px; line-height: 1.7; text-align: justify;">
          The transformation of modern digital publishing demands absolute clarity of intent, unyielding artistic standard, and robust architectural permanence. Each submission undergoes comprehensive peer evaluation before publication into our permanent repository.
        </div>
      </foreignObject>
    </g>

    <!-- Footer & Page Number -->
    <line x1="50" y1="1050" x2="750" y2="1050" stroke="#27272a" stroke-width="1" />
    <text x="50" y="1075" fill="#71717a" font-family="system-ui, sans-serif" font-size="11">SUPER ADMIN CURATION • SAYHAN</text>
    <text x="400" y="1075" text-anchor="middle" fill="${themeColor}" font-family="system-ui, sans-serif" font-size="14" font-weight="bold">— PAGE ${pageNumber} —</text>
    <text x="750" y="1075" text-anchor="end" fill="#71717a" font-family="system-ui, sans-serif" font-size="11">YELLOW REIGN ARCHIVE</text>
  </svg>`;
}

// Generate Cover Image SVG
function createSvgCover({ title, subtitle, issue, date, category, author }) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 1130" width="100%" height="100%">
    <defs>
      <radialGradient id="coverGlow" cx="50%" cy="35%" r="60%">
        <stop offset="0%" stop-color="#3a2f05" />
        <stop offset="60%" stop-color="#111317" />
        <stop offset="100%" stop-color="#0a0b0e" />
      </radialGradient>
      <linearGradient id="goldText" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#FBBF24" />
        <stop offset="50%" stop-color="#F59E0B" />
        <stop offset="100%" stop-color="#D97706" />
      </linearGradient>
    </defs>
    
    <rect width="800" height="1130" fill="url(#coverGlow)" />
    
    <!-- Accent Border Frame -->
    <rect x="25" y="25" width="750" height="1080" fill="none" stroke="#EAB308" stroke-width="2.5" />
    <rect x="35" y="35" width="730" height="1060" fill="none" stroke="#3f3f46" stroke-width="1" />

    <!-- Top Masthead -->
    <g transform="translate(50, 75)">
      <text x="0" y="20" fill="#EAB308" font-family="system-ui, sans-serif" font-size="12" font-weight="bold" letter-spacing="3">ACADEMY EDITION</text>
      <text x="700" y="20" text-anchor="end" fill="#a1a1aa" font-family="system-ui, sans-serif" font-size="12" letter-spacing="2">${date}</text>
      <line x1="0" y1="35" x2="700" y2="35" stroke="#EAB308" stroke-width="1.5" />
    </g>

    <!-- Main Title Branding -->
    <g transform="translate(400, 200)" text-anchor="middle">
      <text x="0" y="0" fill="url(#goldText)" font-family="Georgia, serif" font-size="64" font-weight="bold" letter-spacing="6">YELLOW REIGN</text>
      <text x="0" y="35" fill="#FFFFFF" font-family="system-ui, sans-serif" font-size="18" font-weight="600" letter-spacing="8">DIGITAL MAGAZINE</text>
      <line x1="-120" y1="55" x2="120" y2="55" stroke="#EAB308" stroke-width="2" />
    </g>

    <!-- Geometric Center Artwork -->
    <g transform="translate(400, 520)">
      <circle cx="0" cy="0" r="160" fill="#14171d" stroke="#EAB308" stroke-opacity="0.3" stroke-width="3" />
      <circle cx="0" cy="0" r="130" fill="none" stroke="#EAB308" stroke-width="1" stroke-dasharray="8,6" />
      <polygon points="0,-100 86,50 -86,50" fill="none" stroke="url(#goldText)" stroke-width="3" />
      <polygon points="0,100 86,-50 -86,-50" fill="none" stroke="#FFFFFF" stroke-opacity="0.7" stroke-width="2" />
      <circle cx="0" cy="0" r="24" fill="#EAB308" />
      <text x="0" y="7" text-anchor="middle" fill="#000000" font-family="system-ui, sans-serif" font-size="16" font-weight="bold">YR</text>
    </g>

    <!-- Cover Story -->
    <g transform="translate(50, 780)">
      <rect x="0" y="0" width="140" height="28" rx="4" fill="#EAB308" />
      <text x="70" y="19" text-anchor="middle" fill="#000000" font-family="system-ui, sans-serif" font-size="12" font-weight="bold" letter-spacing="1.5">${category}</text>
      <text x="0" y="75" fill="#FFFFFF" font-family="Georgia, serif" font-size="38" font-weight="bold">${title}</text>
      <text x="0" y="115" fill="#d4d4d8" font-family="system-ui, sans-serif" font-size="18" font-weight="400">${subtitle}</text>
    </g>

    <!-- Bottom Features & Super Admin Stamp -->
    <g transform="translate(50, 980)">
      <line x1="0" y1="0" x2="700" y2="0" stroke="#3f3f46" stroke-width="1" />
      <text x="0" y="35" fill="#EAB308" font-family="system-ui, sans-serif" font-size="13" font-weight="bold">CURATED BY SUPER ADMIN SAYHAN</text>
      <text x="0" y="55" fill="#a1a1aa" font-family="system-ui, sans-serif" font-size="12">Verified & Approved for Global Public Distribution</text>
      <text x="700" y="35" text-anchor="end" fill="#FFFFFF" font-family="system-ui, sans-serif" font-size="14" font-weight="bold">ISSUE #${issue}</text>
      <text x="700" y="55" text-anchor="end" fill="#EAB308" font-family="system-ui, sans-serif" font-size="12">Author: ${author}</text>
    </g>
  </svg>`;
}

export async function seedSampleMagazines() {
  const count = db.prepare('SELECT COUNT(*) as count FROM magazines').get().count;
  if (count > 0) {
    return; // Already seeded
  }

  console.log('[Seeder] Seeding initial published magazines and pages for Yellow Reign Academy...');

  const APP_URL = process.env.APP_URL || 'http://localhost:5000';
  const now = new Date().toISOString();

  const samples = [
    {
      id: 'mag_sample_01',
      title: 'The Renaissance of Autonomous Innovation',
      slug: 'the-renaissance-of-autonomous-innovation',
      description: 'An executive exploration into next-generation intelligent systems, decentralized publication architecture, and the future of creative craftsmanship.',
      categoryId: 'cat-tech',
      author: 'Sayhan (Super Admin)',
      isFeatured: 1,
      pageCount: 6,
      pagesData: [
        { title: 'The Paradigm Shift', highlight: 'INTELLIGENCE', subtitle: 'Architecting the Future', text: 'Autonomous technologies have graduated from experimental paradigms into foundational infrastructure. The modern creative ecosystem requires resilient verification protocols and rapid global distribution.' },
        { title: 'The Velocity of Synthesis', highlight: 'ACCELERATION', subtitle: 'From Ideation to Execution', text: 'Accelerated innovation allows organizations to iterate rapidly while maintaining aesthetic and editorial uncompromising rigors. Systems engineered today become tomorrow’s institutional cornerstones.' },
        { title: 'Decentralized Sovereignty', highlight: 'RESILIENCE', subtitle: 'Persistent Data Integrity', text: 'Storage and distribution models must withstand structural disruptions. By implementing zero-loss persistence and immutable permission verification, publishing integrity is permanently guaranteed.' },
        { title: 'Design Philosophy: Black & Gold', highlight: 'AESTHETICS', subtitle: 'The Visual Grammar of Mastery', text: 'The yellow and black palette commands attention, conveys decisive executive presence, and emphasizes high-contrast legibility across desktop and mobile displays.' },
        { title: 'Institutional Governance', highlight: 'CURATION', subtitle: 'The Role of Super Admin Oversight', text: 'Unlike uncurated feeds, Yellow Reign Academy operates on meticulous gatekeeping. Submissions remain private until verified and formally stamped with permanent cryptographic QR identifiers.' },
        { title: 'The Road Ahead', highlight: 'HORIZONS', subtitle: 'Next Century Publishing', text: 'We invite thinkers, builders, researchers, and visionaries across continents to submit their works for permanent inclusion in the Yellow Reign Academy global library.' }
      ]
    },
    {
      id: 'mag_sample_02',
      title: 'Apex Architecture & Modern Typography',
      slug: 'apex-architecture-modern-typography',
      description: 'A visual celebration of minimalist spatial form, brutalist geometries, and modern typographic hierarchies curated for the discerning digital reader.',
      categoryId: 'cat-art',
      author: 'Elena Vance',
      isFeatured: 1,
      pageCount: 4,
      pagesData: [
        { title: 'Pure Geometry', highlight: 'MINIMALISM', subtitle: 'The Power of Spatial Restraint', text: 'Space is not emptiness; it is deliberate composition. When typographic forms align with structural geometry, content achieves timeless visual impact.' },
        { title: 'Brutalist Precision', highlight: 'STRUCTURE', subtitle: 'Unadorned Authenticity', text: 'Exposing structural honesty yields remarkable elegance. Raw lines, unapologetic contrast, and bold yellow highlights reflect modern executive strength.' },
        { title: 'Digital Grid Systems', highlight: 'LAYOUT', subtitle: 'Responsive Fluid Harmonies', text: 'The modern reader expects seamless transition from ultra-wide displays down to mobile pocket screens without sacrificing editorial grandeur.' },
        { title: 'The Living Archive', highlight: 'EPILOGUE', subtitle: 'Permanent Digital Heritage', text: 'Every edition archived in Yellow Reign Academy stands as a monument to visual precision and intellectual dedication.' }
      ]
    },
    {
      id: 'mag_sample_03',
      title: 'Global Leadership: The Executive Frontier',
      slug: 'global-leadership-executive-frontier',
      description: 'Strategic frameworks, leadership psychology, and high-impact decision modeling for academy directors, founders, and transformative pioneers.',
      categoryId: 'cat-biz',
      author: 'Marcus Sterling',
      isFeatured: 1,
      pageCount: 4,
      pagesData: [
        { title: 'Decisive Command', highlight: 'STRATEGY', subtitle: 'Navigating Volatile Horizons', text: 'Leadership in the contemporary era demands uncompromised clarity, immediate accountability, and the courage to establish elevated standards.' },
        { title: 'Organizational Cadence', highlight: 'EXECUTION', subtitle: 'Synchronizing High-Output Teams', text: 'A team operating in total alignment outpaces larger competitors through streamlined decision protocols and unequivocal focus.' },
        { title: 'The Art of Gatekeeping', highlight: 'STANDARDS', subtitle: 'Why Quality Must Precede Volume', text: 'Platforms that automate publishing without human curation drown in mediocrity. High-value repositories maintain strict quality gates.' },
        { title: 'The Sovereign Legacy', highlight: 'IMPACT', subtitle: 'Building Enduring Value', text: 'True influence is measured not by transient views, but by the generational durability of the knowledge distributed.' }
      ]
    }
  ];

  for (let idx = 0; idx < samples.length; idx++) {
    const s = samples[idx];
    const coverFilename = `${s.id}_cover.svg`;
    const coverPath = path.join(SAMPLES_DIR, coverFilename);
    const coverSvg = createSvgCover({
      title: s.title,
      subtitle: s.description.substring(0, 75) + '...',
      issue: (idx + 1).toString().padStart(2, '0'),
      date: 'NOVEMBER 2026',
      category: s.categoryId.replace('cat-', '').toUpperCase(),
      author: s.author
    });
    fs.writeFileSync(coverPath, coverSvg, 'utf8');

    // Generate QR code for this published magazine
    const publicUrl = `${APP_URL}/read/${s.slug}`;
    const qrData = await generateMagazineQrCode(publicUrl);

    db.prepare(`
      INSERT INTO magazines (
        id, title, slug, description, category_id, user_id,
        cover_image, status, admin_feedback, qr_code_svg, qr_code_data_url,
        view_count, is_featured, published_at, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 'PUBLISHED', 'Approved and published by Super Admin Sayhan', ?, ?, ?, ?, ?, ?, ?)
    `).run(
      s.id,
      s.title,
      s.slug,
      s.description,
      s.categoryId,
      'user-admin-sayhan',
      coverFilename,
      qrData.svg,
      qrData.dataUrl,
      Math.floor(Math.random() * 240) + 45,
      s.isFeatured,
      now,
      now,
      now
    );

    // Generate Pages
    const insertPage = db.prepare(`
      INSERT INTO magazine_pages (id, magazine_id, page_number, file_path, original_filename, file_size, mime_type, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (let pIdx = 0; pIdx < s.pagesData.length; pIdx++) {
      const p = s.pagesData[pIdx];
      const pageNum = pIdx + 1;
      const pageFilename = `${s.id}_p${pageNum}.svg`;
      const pagePath = path.join(SAMPLES_DIR, pageFilename);
      const pageSvg = createSvgMagazinePage({
        title: p.title,
        pageNumber: pageNum,
        subtitle: p.subtitle,
        mainText: p.text,
        highlight: p.highlight
      });
      fs.writeFileSync(pagePath, pageSvg, 'utf8');

      insertPage.run(
        `page_${s.id}_${pageNum}`,
        s.id,
        pageNum,
        pageFilename,
        `Page_${pageNum}.svg`,
        Buffer.byteLength(pageSvg),
        'image/svg+xml',
        now
      );
    }
  }

  console.log('[Seeder] Sample magazines successfully seeded with vector pages and QR codes!');
}

