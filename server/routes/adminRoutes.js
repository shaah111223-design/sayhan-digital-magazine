import express from 'express';
import path from 'node:path';
import fs from 'node:fs';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../db.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';
import { uploadMiddleware, removeSubmissionFolder } from '../storage.js';
import { generateMagazineQrCode } from '../utils/qr.js';
import { testSmtpConnection } from '../email.js';

const router = express.Router();

// Strict security: all routes require authentication and ADMIN role (Sayhan)
router.use(authenticate, requireAdmin);

const APP_URL = process.env.APP_URL || 'http://localhost:5000';

// 1. GET /api/admin/stats
router.get('/stats', (req, res) => {
  try {
    const userCount = db.prepare("SELECT COUNT(*) as count FROM users WHERE role != 'ADMIN'").get().count;
    const allUsersCount = db.prepare("SELECT COUNT(*) as count FROM users").get().count;
    
    const magStats = db.prepare(`
      SELECT 
        COUNT(*) as total_magazines,
        SUM(CASE WHEN status = 'PENDING_REVIEW' THEN 1 ELSE 0 END) as pending_review,
        SUM(CASE WHEN status = 'APPROVED' THEN 1 ELSE 0 END) as approved,
        SUM(CASE WHEN status = 'PUBLISHED' THEN 1 ELSE 0 END) as published,
        SUM(CASE WHEN status = 'REJECTED' THEN 1 ELSE 0 END) as rejected,
        SUM(CASE WHEN status = 'DRAFT' THEN 1 ELSE 0 END) as draft,
        SUM(view_count) as total_views
      FROM magazines
    `).get();

    const recentSubmissions = db.prepare(`
      SELECT m.id, m.title, m.status, m.created_at, u.full_name as submitter_name, u.email as submitter_email
      FROM magazines m
      LEFT JOIN users u ON m.user_id = u.id
      ORDER BY m.created_at DESC
      LIMIT 6
    `).all();

    const recentUsers = db.prepare(`
      SELECT id, full_name, email, phone, role, created_at
      FROM users
      ORDER BY created_at DESC
      LIMIT 6
    `).all();

    const emailStats = db.prepare(`
      SELECT 
        COUNT(*) as total_emails,
        SUM(CASE WHEN status = 'SENT' THEN 1 ELSE 0 END) as sent_emails,
        SUM(CASE WHEN status = 'PENDING_CONFIG' THEN 1 ELSE 0 END) as pending_config
      FROM email_logs
    `).get();

    res.json({
      users: {
        total_regular: userCount,
        total_all: allUsersCount
      },
      magazines: {
        total: magStats.total_magazines || 0,
        pending: magStats.pending_review || 0,
        approved: magStats.approved || 0,
        published: magStats.published || 0,
        rejected: magStats.rejected || 0,
        draft: magStats.draft || 0,
        total_views: magStats.total_views || 0,
      },
      emails: {
        total: emailStats.total_emails || 0,
        sent: emailStats.sent_emails || 0,
        pending: emailStats.pending_config || 0
      },
      recentSubmissions,
      recentUsers
    });
  } catch (err) {
    console.error('[Admin Stats] Error:', err);
    res.status(500).json({ error: 'Failed to fetch admin statistics.' });
  }
});

// 2. GET /api/admin/users
router.get('/users', (req, res) => {
  try {
    const users = db.prepare(`
      SELECT 
        u.id, u.full_name, u.email, u.phone, u.role, u.created_at,
        (SELECT COUNT(*) FROM magazines m WHERE m.user_id = u.id) as total_submissions,
        (SELECT COUNT(*) FROM magazines m WHERE m.user_id = u.id AND m.status = 'PUBLISHED') as published_submissions
      FROM users u
      ORDER BY u.created_at DESC
    `).all();

    res.json(users);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch registered users.' });
  }
});

// 3. GET /api/admin/submissions
router.get('/submissions', (req, res) => {
  try {
    const { status } = req.query;

    let query = `
      SELECT 
        m.*,
        c.name as category_name,
        u.full_name as submitter_name, u.email as submitter_email, u.phone as submitter_phone,
        (SELECT COUNT(*) FROM magazine_pages p WHERE p.magazine_id = m.id) as page_count
      FROM magazines m
      LEFT JOIN categories c ON m.category_id = c.id
      LEFT JOIN users u ON m.user_id = u.id
    `;

    const params = [];
    if (status && status !== 'ALL') {
      query += ` WHERE m.status = ?`;
      params.push(status);
    }

    query += ` ORDER BY 
      CASE m.status 
        WHEN 'PENDING_REVIEW' THEN 1 
        WHEN 'APPROVED' THEN 2 
        WHEN 'PUBLISHED' THEN 3 
        ELSE 4 
      END, 
      m.created_at DESC`;

    const submissions = db.prepare(query).all(...params);
    res.json(submissions);
  } catch (err) {
    console.error('[Admin Submissions] Error:', err);
    res.status(500).json({ error: 'Failed to fetch submissions.' });
  }
});

// 4. GET /api/admin/submissions/:id
router.get('/submissions/:id', (req, res) => {
  try {
    const magazine = db.prepare(`
      SELECT 
        m.*,
        c.name as category_name,
        u.full_name as submitter_name, u.email as submitter_email, u.phone as submitter_phone
      FROM magazines m
      LEFT JOIN categories c ON m.category_id = c.id
      LEFT JOIN users u ON m.user_id = u.id
      WHERE m.id = ?
    `).get(req.params.id);

    if (!magazine) {
      return res.status(404).json({ error: 'Submission not found.' });
    }

    const pages = db.prepare(`
      SELECT id, page_number, file_path, original_filename, file_size, mime_type
      FROM magazine_pages
      WHERE magazine_id = ?
      ORDER BY page_number ASC
    `).all(magazine.id);

    res.json({ magazine, pages });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch submission details.' });
  }
});

// 5. POST /api/admin/submissions/:id/review (Approve, Reject, or Publish)
router.post('/submissions/:id/review', async (req, res) => {
  try {
    const { id } = req.params;
    const { action, feedback } = req.body; // action: 'APPROVE', 'REJECT', 'PUBLISH', 'UNPUBLISH'

    const magazine = db.prepare('SELECT * FROM magazines WHERE id = ?').get(id);
    if (!magazine) {
      return res.status(404).json({ error: 'Magazine not found.' });
    }

    const now = new Date().toISOString();

    if (action === 'PUBLISH') {
      // Generate unique QR code and permanent public URL
      const publicUrl = `${APP_URL}/read/${magazine.slug || magazine.id}`;
      const qrData = await generateMagazineQrCode(publicUrl);

      db.prepare(`
        UPDATE magazines
        SET status = 'PUBLISHED',
            published_at = COALESCE(published_at, ?),
            admin_feedback = ?,
            qr_code_svg = ?,
            qr_code_data_url = ?,
            updated_at = ?
        WHERE id = ?
      `).run(now, feedback || null, qrData.svg, qrData.dataUrl, now, id);

      return res.json({
        message: `Magazine "${magazine.title}" has been successfully published to the public library!`,
        status: 'PUBLISHED',
        publicUrl,
        qrCode: qrData.dataUrl
      });
    }

    if (action === 'APPROVE') {
      db.prepare(`
        UPDATE magazines
        SET status = 'APPROVED',
            admin_feedback = ?,
            updated_at = ?
        WHERE id = ?
      `).run(feedback || null, now, id);

      return res.json({
        message: `Magazine "${magazine.title}" is approved and ready for publishing.`,
        status: 'APPROVED'
      });
    }

    if (action === 'REJECT') {
      db.prepare(`
        UPDATE magazines
        SET status = 'REJECTED',
            admin_feedback = ?,
            updated_at = ?
        WHERE id = ?
      `).run(feedback || 'Submission requires revisions.', now, id);

      return res.json({
        message: `Submission marked as rejected with feedback.`,
        status: 'REJECTED'
      });
    }

    if (action === 'UNPUBLISH') {
      db.prepare(`
        UPDATE magazines
        SET status = 'APPROVED',
            updated_at = ?
        WHERE id = ?
      `).run(now, id);

      return res.json({
        message: `Magazine moved back to Approved (unpublished from public library).`,
        status: 'APPROVED'
      });
    }

    res.status(400).json({ error: 'Invalid action. Supported: APPROVE, REJECT, PUBLISH, UNPUBLISH' });
  } catch (err) {
    console.error('[Admin Review] Error:', err);
    res.status(500).json({ error: 'Failed to process submission review.' });
  }
});

// 6. PUT /api/admin/submissions/:id (Edit details)
router.put('/submissions/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, category_id, is_featured, admin_feedback } = req.body;

    const existing = db.prepare('SELECT * FROM magazines WHERE id = ?').get(id);
    if (!existing) {
      return res.status(404).json({ error: 'Magazine not found.' });
    }

    const now = new Date().toISOString();
    db.prepare(`
      UPDATE magazines
      SET title = COALESCE(?, title),
          description = COALESCE(?, description),
          category_id = COALESCE(?, category_id),
          is_featured = COALESCE(?, is_featured),
          admin_feedback = COALESCE(?, admin_feedback),
          updated_at = ?
      WHERE id = ?
    `).run(
      title,
      description,
      category_id,
      is_featured !== undefined ? (is_featured ? 1 : 0) : null,
      admin_feedback,
      now,
      id
    );

    res.json({ message: 'Magazine details updated successfully.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update magazine.' });
  }
});

// 7. DELETE /api/admin/submissions/:id (Delete content)
router.delete('/submissions/:id', (req, res) => {
  try {
    const { id } = req.params;
    const existing = db.prepare('SELECT * FROM magazines WHERE id = ?').get(id);
    if (!existing) {
      return res.status(404).json({ error: 'Magazine not found.' });
    }

    removeSubmissionFolder(existing.user_id, existing.id);
    db.prepare('DELETE FROM magazines WHERE id = ?').run(id);

    res.json({ message: 'Magazine deleted permanently.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete magazine.' });
  }
});

// 8. POST /api/admin/upload-official (Sayhan direct official upload)
router.post(
  '/upload-official',
  uploadMiddleware.fields([
    { name: 'coverImage', maxCount: 1 },
    { name: 'pages', maxCount: 100 }
  ]),
  async (req, res) => {
    try {
      const { title, description, categoryId, autoPublish } = req.body;
      if (!title || !title.trim()) {
        return res.status(400).json({ error: 'Magazine title is required.' });
      }

      const magazineId = req.submissionId || `mag_official_${uuidv4().replace(/-/g, '').substring(0, 12)}`;
      const baseSlug = title.toString().toLowerCase().trim().replace(/[^\w-]+/g, '-');
      const uniqueSlug = `${baseSlug}-${magazineId.substring(13, 19)}`;
      const now = new Date().toISOString();

      const coverPath = req.files && req.files.coverImage && req.files.coverImage[0]
        ? req.files.coverImage[0].filename
        : null;

      const shouldPublish = autoPublish === 'true' || autoPublish === true;
      const initialStatus = shouldPublish ? 'PUBLISHED' : 'APPROVED';

      let qrData = { svg: null, dataUrl: null };
      if (shouldPublish) {
        const publicUrl = `${APP_URL}/read/${uniqueSlug}`;
        qrData = await generateMagazineQrCode(publicUrl);
      }

      db.prepare(`
        INSERT INTO magazines (
          id, title, slug, description, category_id, user_id, 
          cover_image, status, qr_code_svg, qr_code_data_url,
          view_count, is_featured, published_at, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 1, ?, ?, ?)
      `).run(
        magazineId,
        title.trim(),
        uniqueSlug,
        description || '',
        categoryId || null,
        req.user.id,
        coverPath,
        initialStatus,
        qrData.svg,
        qrData.dataUrl,
        shouldPublish ? now : null,
        now,
        now
      );

      // Insert pages
      if (req.files && req.files.pages && req.files.pages.length > 0) {
        const insertPage = db.prepare(`
          INSERT INTO magazine_pages (id, magazine_id, page_number, file_path, original_filename, file_size, mime_type, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `);

        let pNum = 1;
        for (const file of req.files.pages) {
          const pageId = `page_${uuidv4().replace(/-/g, '').substring(0, 16)}`;
          insertPage.run(
            pageId,
            magazineId,
            pNum++,
            file.filename,
            file.originalname,
            file.size,
            file.mimetype,
            now
          );
        }
      }

      res.status(201).json({
        message: shouldPublish 
          ? 'Official magazine uploaded and published to the public library!' 
          : 'Official magazine uploaded and saved to drafts.',
        magazineId,
        slug: uniqueSlug,
        status: initialStatus
      });
    } catch (err) {
      console.error('[Official Upload] Error:', err);
      res.status(500).json({ error: 'Failed to upload official magazine: ' + err.message });
    }
  }
);

// 9. Categories Management
router.get('/categories', (req, res) => {
  try {
    const categories = db.prepare(`
      SELECT c.*, 
        (SELECT COUNT(*) FROM magazines m WHERE m.category_id = c.id) as total_magazines
      FROM categories c
      ORDER BY c.display_order ASC, c.name ASC
    `).all();
    res.json(categories);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch categories.' });
  }
});

router.post('/categories', (req, res) => {
  try {
    const { name, description, icon, display_order } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Category name is required.' });
    }

    const catId = `cat_${uuidv4().replace(/-/g, '').substring(0, 12)}`;
    const slug = name.toString().toLowerCase().trim().replace(/[^\w-]+/g, '-');
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO categories (id, name, slug, description, icon, display_order, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(catId, name.trim(), slug, description || '', icon || 'BookOpen', display_order || 0, now);

    res.status(201).json({ message: 'Category created successfully.', id: catId });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create category: ' + err.message });
  }
});

router.delete('/categories/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM categories WHERE id = ?').run(req.params.id);
    res.json({ message: 'Category removed.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete category.' });
  }
});

// 10. Email Logs & SMTP Diagnostics
router.get('/email-logs', (req, res) => {
  try {
    const logs = db.prepare(`
      SELECT * FROM email_logs
      ORDER BY created_at DESC
      LIMIT 100
    `).all();
    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch email logs.' });
  }
});

router.post('/email-test', async (req, res) => {
  try {
    const result = await testSmtpConnection();
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: 'SMTP test failed: ' + err.message });
  }
});

export default router;
