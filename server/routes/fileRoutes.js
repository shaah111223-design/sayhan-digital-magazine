import express from 'express';
import path from 'node:path';
import fs from 'node:fs';
import jwt from 'jsonwebtoken';
import { db } from '../db.js';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'yellow_reign_academy_super_secret_jwt_key_2026';

function verifyAccess(req, magazine) {
  // If published, anyone can view
  if (magazine.status === 'PUBLISHED') {
    return true;
  }

  // Otherwise, user must be logged in and must be the owner OR Super Admin
  let token = null;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.query && req.query.token) {
    token = req.query.token;
  }

  if (!token) return false;

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded.role === 'ADMIN') return true;
    if (decoded.id === magazine.user_id) return true;
  } catch {
    return false;
  }

  return false;
}

function resolveFilePath(magazine, filename) {
  // Check user submission folder
  const userPath = path.resolve(process.cwd(), 'uploads', 'users', magazine.user_id, 'submissions', magazine.id, filename);
  if (fs.existsSync(userPath)) {
    return userPath;
  }

  // Check official uploads folder
  const officialPath = path.resolve(process.cwd(), 'uploads', 'official', magazine.id, filename);
  if (fs.existsSync(officialPath)) {
    return officialPath;
  }

  // Check static assets / sample covers folder
  const samplePath = path.resolve(process.cwd(), 'public', 'samples', filename);
  if (fs.existsSync(samplePath)) {
    return samplePath;
  }

  return null;
}

// 1. GET /api/files/magazine/:id/cover
router.get('/magazine/:id/cover', (req, res) => {
  try {
    const magazine = db.prepare('SELECT id, user_id, status, cover_image FROM magazines WHERE id = ? OR slug = ?').get(req.params.id, req.params.id);

    if (!magazine) {
      return res.status(404).json({ error: 'Magazine not found.' });
    }

    if (!verifyAccess(req, magazine)) {
      return res.status(403).json({ error: 'Access Denied: This magazine submission is private and awaiting admin publication.' });
    }

    if (!magazine.cover_image) {
      return res.status(404).json({ error: 'No cover image specified.' });
    }

    const filePath = resolveFilePath(magazine, magazine.cover_image);
    if (!filePath) {
      return res.status(404).json({ error: 'Cover image file not found on server storage.' });
    }

    res.sendFile(filePath);
  } catch (err) {
    console.error('[File Serve Cover] Error:', err);
    res.status(500).json({ error: 'Failed to serve cover file.' });
  }
});

// 2. GET /api/files/magazine/:id/page/:pageId
router.get('/magazine/:id/page/:pageId', (req, res) => {
  try {
    const magazine = db.prepare('SELECT id, user_id, status FROM magazines WHERE id = ? OR slug = ?').get(req.params.id, req.params.id);

    if (!magazine) {
      return res.status(404).json({ error: 'Magazine not found.' });
    }

    if (!verifyAccess(req, magazine)) {
      return res.status(403).json({ error: 'Access Denied: This magazine submission is private and awaiting admin publication.' });
    }

    const page = db.prepare('SELECT * FROM magazine_pages WHERE (id = ? OR page_number = ?) AND magazine_id = ?').get(req.params.pageId, req.params.pageId, magazine.id);

    if (!page) {
      return res.status(404).json({ error: 'Magazine page not found.' });
    }

    const filePath = resolveFilePath(magazine, page.file_path);
    if (!filePath) {
      return res.status(404).json({ error: 'Page file not found on server storage.' });
    }

    res.sendFile(filePath);
  } catch (err) {
    console.error('[File Serve Page] Error:', err);
    res.status(500).json({ error: 'Failed to serve page file.' });
  }
});

export default router;

