import express from 'express';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../db.js';
import { generateToken, authenticate } from '../middleware/auth.js';
import { sendRegistrationNotification } from '../email.js';

const router = express.Router();

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { full_name, email, phone, password } = req.body;

    if (!full_name || !email || !phone || !password) {
      return res.status(400).json({ error: 'All fields (full_name, email, phone, password) are required.' });
    }

    const trimmedEmail = email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      return res.status(400).json({ error: 'Please provide a valid email address.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
    }

    // Check if user already exists
    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(trimmedEmail);
    if (existing) {
      return res.status(400).json({ error: 'An account with this email address already exists.' });
    }

    const userId = `usr_${uuidv4().replace(/-/g, '').substring(0, 16)}`;
    const now = new Date().toISOString();
    const passwordHash = bcrypt.hashSync(password, 10);

    // Default role is USER. If registering with yellowreignacademy@gmail.com, grant ADMIN
    const role = trimmedEmail === 'yellowreignacademy@gmail.com' ? 'ADMIN' : 'USER';

    db.prepare(`
      INSERT INTO users (id, full_name, email, phone, password_hash, role, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(userId, full_name.trim(), trimmedEmail, phone.trim(), passwordHash, role, now, now);

    const user = {
      id: userId,
      full_name: full_name.trim(),
      email: trimmedEmail,
      phone: phone.trim(),
      role,
      created_at: now
    };

    const token = generateToken(user);

    // Send real email notification to yellowreignacademy@gmail.com
    // Handled asynchronously so user registration response is instant, while email is dispatched & logged
    const formattedDate = new Date().toLocaleString('en-US', {
      timeZone: 'Asia/Kolkata',
      dateStyle: 'full',
      timeStyle: 'long'
    });

    sendRegistrationNotification({
      name: user.full_name,
      email: user.email,
      phone: user.phone,
      registeredAt: formattedDate
    }).catch(err => console.error('[Auth] Registration email notification error:', err.message));

    res.status(201).json({
      message: 'Registration successful! Welcome to Yellow Reign Academy.',
      user,
      token
    });
  } catch (err) {
    console.error('[Auth] Register error:', err);
    res.status(500).json({ error: 'Internal server error during registration.' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const trimmedEmail = email.trim().toLowerCase();
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(trimmedEmail);

    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const isValidPassword = bcrypt.compareSync(password, user.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const sanitizedUser = {
      id: user.id,
      full_name: user.full_name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      avatar_url: user.avatar_url,
      created_at: user.created_at
    };

    const token = generateToken(sanitizedUser);

    res.json({
      message: `Welcome back, ${user.full_name}!`,
      user: sanitizedUser,
      token
    });
  } catch (err) {
    console.error('[Auth] Login error:', err);
    res.status(500).json({ error: 'Internal server error during login.' });
  }
});

// GET /api/auth/me
router.get('/me', authenticate, (req, res) => {
  // Fetch user submission counts
  const stats = db.prepare(`
    SELECT
      COUNT(*) as total_submissions,
      SUM(CASE WHEN status = 'PUBLISHED' THEN 1 ELSE 0 END) as published_count,
      SUM(CASE WHEN status = 'PENDING_REVIEW' THEN 1 ELSE 0 END) as pending_count,
      SUM(CASE WHEN status = 'APPROVED' THEN 1 ELSE 0 END) as approved_count,
      SUM(CASE WHEN status = 'REJECTED' THEN 1 ELSE 0 END) as rejected_count,
      SUM(CASE WHEN status = 'DRAFT' THEN 1 ELSE 0 END) as draft_count
    FROM magazines WHERE user_id = ?
  `).get(req.user.id);

  res.json({
    user: req.user,
    stats: {
      total_submissions: stats.total_submissions || 0,
      published_count: stats.published_count || 0,
      pending_count: stats.pending_count || 0,
      approved_count: stats.approved_count || 0,
      rejected_count: stats.rejected_count || 0,
      draft_count: stats.draft_count || 0,
    }
  });
});

export default router;

