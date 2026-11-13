import jwt from 'jsonwebtoken';
import { db } from '../db.js';

const JWT_SECRET = process.env.JWT_SECRET || 'yellow_reign_academy_super_secret_jwt_key_2026';

export function generateToken(user) {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
      full_name: user.full_name,
      phone: user.phone || ''
    },
    JWT_SECRET,
    { expiresIn: '30d' }
  );
}

export function authenticate(req, res, next) {
  let token = null;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.query && req.query.token) {
    token = req.query.token;
  }

  if (!token) {
    return res.status(401).json({ error: 'Authentication required. Please log in.' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (!decoded || !decoded.id) {
      return res.status(401).json({ error: 'Invalid authentication session structure.' });
    }

    // 1. Primary lookup by user ID
    let user = db.prepare('SELECT id, full_name, email, phone, role, avatar_url, created_at FROM users WHERE id = ?').get(decoded.id);

    // 2. Secondary lookup by email if not found by ID (handling cross-instance/session discrepancies)
    if (!user && decoded.email) {
      user = db.prepare('SELECT id, full_name, email, phone, role, avatar_url, created_at FROM users WHERE email = ?').get(decoded.email.toLowerCase().trim());
    }

    // 3. Persistent Serverless Synchronization:
    // If the token was cryptographically signed by our JWT_SECRET (unexpired & authentic),
    // but the current serverless instance lacks the user record (e.g. cold start, multi-container on Vercel):
    if (!user && decoded.email) {
      const now = new Date().toISOString();
      const role = (decoded.role === 'ADMIN' && decoded.email.toLowerCase().trim() === 'yellowreignacademy@gmail.com') ? 'ADMIN' : 'USER';
      const phone = decoded.phone || '';
      const fullName = decoded.full_name || 'Registered Author';

      try {
        db.prepare(`
          INSERT INTO users (id, full_name, email, phone, password_hash, role, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          decoded.id,
          fullName,
          decoded.email.toLowerCase().trim(),
          phone,
          'SESSION_RESTORED',
          role,
          now,
          now
        );
        user = db.prepare('SELECT id, full_name, email, phone, role, avatar_url, created_at FROM users WHERE id = ?').get(decoded.id);
      } catch {
        // If email already exists under another ID, resolve that existing record
        user = db.prepare('SELECT id, full_name, email, phone, role, avatar_url, created_at FROM users WHERE email = ?').get(decoded.email.toLowerCase().trim());
      }
    }

    if (!user) {
      return res.status(401).json({ error: 'User account no longer exists.' });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired authentication session. Please log in again.' });
  }
}

export function optionalAuth(req, res, next) {
  let token = null;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.query && req.query.token) {
    token = req.query.token;
  }

  if (!token) {
    req.user = null;
    return next();
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (!decoded || !decoded.id) {
      req.user = null;
      return next();
    }

    let user = db.prepare('SELECT id, full_name, email, phone, role, avatar_url FROM users WHERE id = ?').get(decoded.id);
    if (!user && decoded.email) {
      user = db.prepare('SELECT id, full_name, email, phone, role, avatar_url FROM users WHERE email = ?').get(decoded.email.toLowerCase().trim());
    }

    if (!user && decoded.email) {
      const now = new Date().toISOString();
      const role = (decoded.role === 'ADMIN' && decoded.email.toLowerCase().trim() === 'yellowreignacademy@gmail.com') ? 'ADMIN' : 'USER';
      const phone = decoded.phone || '';
      const fullName = decoded.full_name || 'Registered Author';

      try {
        db.prepare(`
          INSERT INTO users (id, full_name, email, phone, password_hash, role, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          decoded.id,
          fullName,
          decoded.email.toLowerCase().trim(),
          phone,
          'SESSION_RESTORED',
          role,
          now,
          now
        );
        user = db.prepare('SELECT id, full_name, email, phone, role, avatar_url FROM users WHERE id = ?').get(decoded.id);
      } catch {
        user = db.prepare('SELECT id, full_name, email, phone, role, avatar_url FROM users WHERE email = ?').get(decoded.email.toLowerCase().trim());
      }
    }

    req.user = user || null;
  } catch {
    req.user = null;
  }
  next();
}

export function requireAdmin(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required.' });
  }

  if (req.user.role !== 'ADMIN') {
    return res.status(403).json({
      error: 'Access Denied: Only Super Admin Sayhan has authorization to access administrative functions and publish magazines.'
    });
  }

  next();
}

