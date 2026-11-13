import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import fs from 'node:fs';
import bcrypt from 'bcryptjs';

const ADMIN_EMAIL = 'yellowreignacademy@gmail.com';

const newPassword = process.argv[2];

if (!newPassword) {
  console.error('\n❌ Usage Error: Please provide the new password as an argument.');
  console.error('Example: node scripts/reset-admin-password.js "MyNewSecurePass2026!"\n');
  process.exit(1);
}

if (newPassword.length < 8) {
  console.error('\n❌ Security Error: New password must be at least 8 characters long.\n');
  process.exit(1);
}

// Resolve SQLite Database
const DB_PATH = path.resolve(process.cwd(), 'data', 'yellow_reign.sqlite');

if (!fs.existsSync(DB_PATH)) {
  console.error(`\n❌ Database not found at: ${DB_PATH}\n`);
  process.exit(1);
}

const db = new DatabaseSync(DB_PATH);

// 1. Identify the existing Super Admin account
const admin = db.prepare('SELECT id, full_name, email, phone, role FROM users WHERE email = ?').get(ADMIN_EMAIL);

if (!admin) {
  console.error(`\n❌ Error: Super Admin account with email "${ADMIN_EMAIL}" was not found in the database.\n`);
  process.exit(1);
}

if (admin.role !== 'ADMIN') {
  console.error(`\n❌ Security Error: Account "${ADMIN_EMAIL}" does not have ADMIN privileges.\n`);
  process.exit(1);
}

// 2. Hash the new password securely using bcrypt
const newHash = bcrypt.hashSync(newPassword, 10);
const now = new Date().toISOString();

// 3. Update the existing admin account password without touching other users or records
db.prepare(`
  UPDATE users
  SET password_hash = ?,
      updated_at = ?
  WHERE id = ? AND email = ?
`).run(newHash, now, admin.id, ADMIN_EMAIL);

console.log('========================================================');
console.log('✅ SUPER ADMIN PASSWORD RESET SUCCESSFUL');
console.log('========================================================');
console.log(` • Account ID:      ${admin.id}`);
console.log(` • Super Admin:     ${admin.full_name}`);
console.log(` • Verified Email:  ${admin.email}`);
console.log(` • Phone:           ${admin.phone}`);
console.log(` • Role:            ${admin.role}`);
console.log(` • Updated At:      ${now}`);
console.log(' • Password Status: Securely hashed with bcrypt (Cost Factor: 10)');
console.log(' • Existing Records: All magazines, pages & users preserved intact');
console.log('========================================================\n');

