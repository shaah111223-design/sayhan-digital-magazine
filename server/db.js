import fs from 'node:fs';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import bcrypt from 'bcryptjs';

const isVercel = !!process.env.VERCEL;
const DATA_DIR = isVercel ? '/tmp' : path.resolve(process.cwd(), 'data');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const DB_PATH = path.join(DATA_DIR, 'yellow_reign.sqlite');

// On Vercel, copy the pre-seeded repository SQLite database to /tmp if not already present
if (isVercel && !fs.existsSync(DB_PATH)) {
  const seedDbPath = path.resolve(process.cwd(), 'data', 'yellow_reign.sqlite');
  if (fs.existsSync(seedDbPath)) {
    try {
      fs.copyFileSync(seedDbPath, DB_PATH);
    } catch (e) {
      console.warn('[Database] Seed copy warning:', e.message);
    }
  }
}

export const db = new DatabaseSync(DB_PATH);

// Enable WAL mode and foreign keys for high performance and integrity
db.exec(`
  PRAGMA journal_mode = WAL;
  PRAGMA foreign_keys = ON;

  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    full_name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'USER',
    avatar_url TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS categories (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    icon TEXT,
    display_order INTEGER DEFAULT 0,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS magazines (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    category_id TEXT,
    user_id TEXT NOT NULL,
    cover_image TEXT,
    status TEXT NOT NULL DEFAULT 'PENDING_REVIEW', -- 'DRAFT', 'PENDING_REVIEW', 'APPROVED', 'PUBLISHED', 'REJECTED'
    admin_feedback TEXT,
    qr_code_svg TEXT,
    qr_code_data_url TEXT,
    view_count INTEGER DEFAULT 0,
    is_featured INTEGER DEFAULT 0,
    published_at TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY(category_id) REFERENCES categories(id) ON DELETE SET NULL
  );

  CREATE TABLE IF NOT EXISTS magazine_pages (
    id TEXT PRIMARY KEY,
    magazine_id TEXT NOT NULL,
    page_number INTEGER NOT NULL,
    file_path TEXT NOT NULL,
    original_filename TEXT,
    file_size INTEGER,
    mime_type TEXT,
    created_at TEXT NOT NULL,
    FOREIGN KEY(magazine_id) REFERENCES magazines(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS email_logs (
    id TEXT PRIMARY KEY,
    recipient TEXT NOT NULL,
    subject TEXT NOT NULL,
    type TEXT NOT NULL, -- 'REGISTRATION', 'SUBMISSION', 'STATUS_CHANGE', 'TEST'
    status TEXT NOT NULL, -- 'SENT', 'SIMULATED_PENDING_SMTP', 'FAILED'
    details_json TEXT,
    error_message TEXT,
    created_at TEXT NOT NULL
  );
`);

// Pre-seed categories if empty
const catCount = db.prepare('SELECT COUNT(*) as count FROM categories').get();
if (catCount.count === 0) {
  const insertCat = db.prepare(`
    INSERT INTO categories (id, name, slug, description, icon, display_order, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const initialCategories = [
    { id: 'cat-tech', name: 'Technology & AI', slug: 'tech-ai', description: 'Cutting-edge innovations, computing, and intelligence', icon: 'Cpu', order: 1 },
    { id: 'cat-biz', name: 'Business & Leadership', slug: 'business-leadership', description: 'Executive insights, startup stories, and finance', icon: 'Briefcase', order: 2 },
    { id: 'cat-art', name: 'Art & Design', slug: 'art-design', description: 'Visual arts, graphic design, and architectural trends', icon: 'Palette', order: 3 },
    { id: 'cat-edu', name: 'Academy & Education', slug: 'academy-education', description: 'Academic papers, scholarly journals, and tutorials', icon: 'GraduationCap', order: 4 },
    { id: 'cat-life', name: 'Culture & Lifestyle', slug: 'culture-lifestyle', description: 'Modern living, literature, travel, and perspectives', icon: 'Globe', order: 5 },
    { id: 'cat-sci', name: 'Science & Discovery', slug: 'science-discovery', description: 'Cosmology, biology, quantum physics, and nature', icon: 'Sparkles', order: 6 },
  ];

  const now = new Date().toISOString();
  for (const c of initialCategories) {
    insertCat.run(c.id, c.name, c.slug, c.description, c.icon, c.order, now);
  }
}

// Pre-seed Super Admin Sayhan if not exists
const adminEmail = 'yellowreignacademy@gmail.com';
const existingAdmin = db.prepare('SELECT * FROM users WHERE email = ?').get(adminEmail);
if (!existingAdmin) {
  const now = new Date().toISOString();
  const passwordHash = bcrypt.hashSync('Sayhan@2026', 10);
  db.prepare(`
    INSERT INTO users (id, full_name, email, phone, password_hash, role, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, 'ADMIN', ?, ?)
  `).run('user-admin-sayhan', 'Sayhan', adminEmail, '9544498843', passwordHash, now, now);
  console.log(`[Database] Initialized Super Admin Sayhan (${adminEmail})`);
}

