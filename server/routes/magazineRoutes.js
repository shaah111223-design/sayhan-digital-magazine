import express from 'express';
import path from 'node:path';
import fs from 'node:fs';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../db.js';
import { authenticate, optionalAuth } from '../middleware/auth.js';
import { uploadMiddleware, removeSubmissionFolder } from '../storage.js';
import { sendSubmissionNotification } from '../email.js';

const router = express.Router();

function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '')
    .replace(/--+/g, '-')
    .substring(0, 80);
}

// -------------------------------------------------------------
// PUBLIC ENDPOINTS (No login required - Anyone can read published content)
// -------------------------------------------------------------

// GET /api/magazines/public
router.get('/public', (req, res) => {
  try {
    const { search, category, sort, featured } = req.query;

    let query = `
      SELECT 
        m.id, m.title, m.slug, m.description, m.cover_image, m.status,
        m.view_count, m.is_featured, m.published_at, m.created_at,
        c.name as category_name, c.slug as category_slug,
        u.full_name as author_name,
        (SELECT COUNT(*) FROM magazine_pages p WHERE p.magazine_id = m.id) as page_count
      FROM magazines m
      LEFT JOIN categories c ON m.category_id = c.id
      LEFT JOIN users u ON m.user_id = u.id
      WHERE m.status = 'PUBLISHED'
    `;

    const params = [];

    if (search && search.trim()) {
      query += ` AND (m.title LIKE ? OR m.description LIKE ?)`;
      params.push(`%${search.trim()}%`, `%${search.trim()}%`);
    }

    if (category && category !== 'all') {
      query += ` AND (c.slug = ? OR c.id = ?)`;
      params.push(category, category);
    }

    if (featured === 'true') {
      query += ` AND m.is_featured = 1`;
    }

    if (sort === 'popular') {
      query += ` ORDER BY m.view_count DESC, m.published_at DESC`;
    } else if (sort === 'oldest') {
      query += ` ORDER BY m.published_at ASC`;
    } else if (sort === 'title') {
      query += ` ORDER BY m.title ASC`;
    } else {
      query += ` ORDER BY m.published_at DESC`;
    }

    const magazines = db.prepare(query).all(...params);

    res.json({
      total: magazines.length,
      magazines
    });
  } catch (err) {
    console.error('[Magazines Public] Error:', err);
    res.status(500).json({ error: 'Failed to fetch published magazines.' });
  }
});

// GET /api/magazines/public/:idOrSlug
router.get('/public/:idOrSlug', (req, res) => {
  try {
    const { idOrSlug } = req.params;

    const magazine = db.prepare(`
      SELECT 
        m.*,
        c.name as category_name, c.slug as category_slug,
        u.full_name as author_name, u.email as author_email
      FROM magazines m
      LEFT JOIN categories c ON m.category_id = c.id
      LEFT JOIN users u ON m.user_id = u.id
      WHERE (m.id = ? OR m.slug = ?) AND m.status = 'PUBLISHED'
    `).get(idOrSlug, idOrSlug);

    if (!magazine) {
      return res.status(404).json({ error: 'Published magazine not found.' });
    }

    const pages = db.prepare(`
      SELECT id, page_number, file_path, original_filename, file_size, mime_type
      FROM magazine_pages
      WHERE magazine_id = ?
      ORDER BY page_number ASC
    `).all(magazine.id);

    res.json({
      magazine,
      pages
    });
  } catch (err) {
    console.error('[Magazine Detail] Error:', err);
    res.status(500).json({ error: 'Failed to retrieve magazine.' });
  }
});

// POST /api/magazines/public/:idOrSlug/view (Increment views)
router.post('/public/:idOrSlug/view', (req, res) => {
  try {
    const { idOrSlug } = req.params;
    db.prepare(`
      UPDATE magazines 
      SET view_count = view_count + 1 
      WHERE (id = ? OR slug = ?) AND status = 'PUBLISHED'
    `).run(idOrSlug, idOrSlug);

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to record view.' });
  }
});

// GET /api/magazines/categories
router.get('/categories', (req, res) => {
  try {
    const categories = db.prepare(`
      SELECT c.*, 
        (SELECT COUNT(*) FROM magazines m WHERE m.category_id = c.id AND m.status = 'PUBLISHED') as magazine_count
      FROM categories c
      ORDER BY c.display_order ASC, c.name ASC
    `).all();

    res.json(categories);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch categories.' });
  }
});

// -------------------------------------------------------------
// USER SUBMISSION ENDPOINTS (Requires authenticated user)
// -------------------------------------------------------------

// GET /api/magazines/user (List submissions for current user)
router.get('/user', authenticate, (req, res) => {
  try {
    const submissions = db.prepare(`
      SELECT 
        m.*,
        c.name as category_name,
        (SELECT COUNT(*) FROM magazine_pages p WHERE p.magazine_id = m.id) as page_count
      FROM magazines m
      LEFT JOIN categories c ON m.category_id = c.id
      WHERE m.user_id = ?
      ORDER BY m.updated_at DESC
    `).all(req.user.id);

    res.json(submissions);
  } catch (err) {
    console.error('[User Submissions] Error:', err);
    res.status(500).json({ error: 'Failed to fetch user submissions.' });
  }
});

// GET /api/magazines/user/:id (Get single submission for current user)
router.get('/user/:id', authenticate, (req, res) => {
  try {
    const magazine = db.prepare(`
      SELECT m.*, c.name as category_name
      FROM magazines m
      LEFT JOIN categories c ON m.category_id = c.id
      WHERE m.id = ? AND m.user_id = ?
    `).get(req.params.id, req.user.id);

    if (!magazine) {
      return res.status(404).json({ error: 'Submission not found or access denied.' });
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

// POST /api/magazines/user/submit (Create or update submission)
router.post(
  '/user/submit',
  authenticate,
  uploadMiddleware.fields([
    { name: 'coverImage', maxCount: 1 },
    { name: 'pages', maxCount: 100 }
  ]),
  async (req, res) => {
    try {
      const {
        id: existingId,
        title,
        description,
        categoryId,
        status: requestedStatus
      } = req.body;

      if (!title || !title.trim()) {
        return res.status(400).json({ error: 'Magazine title is required.' });
      }

      const now = new Date().toISOString();
      const status = requestedStatus === 'DRAFT' ? 'DRAFT' : 'PENDING_REVIEW';
      const magazineId = existingId || req.submissionId || `mag_${uuidv4().replace(/-/g, '').substring(0, 16)}`;

      let baseSlug = slugify(title);
      let uniqueSlug = `${baseSlug}-${magazineId.substring(4, 10)}`;

      // Check if updating existing submission
      if (existingId) {
        const existing = db.prepare('SELECT * FROM magazines WHERE id = ? AND user_id = ?').get(existingId, req.user.id);
        if (!existing) {
          return res.status(404).json({ error: 'Submission not found or you do not have permission to edit it.' });
        }
        if (existing.status === 'PUBLISHED') {
          return res.status(400).json({ error: 'Published magazines cannot be edited directly by users. Please contact Admin Sayhan.' });
        }
        uniqueSlug = existing.slug; // preserve existing slug
      }

      let coverPath = null;
      if (req.files && req.files.coverImage && req.files.coverImage[0]) {
        coverPath = req.files.coverImage[0].filename;
      }

      if (existingId) {
        // Update existing record
        db.prepare(`
          UPDATE magazines
          SET title = ?,
              description = ?,
              category_id = ?,
              status = ?,
              cover_image = COALESCE(?, cover_image),
              updated_at = ?
          WHERE id = ? AND user_id = ?
        `).run(
          title.trim(),
          description || '',
          categoryId || null,
          status,
          coverPath,
          now,
          existingId,
          req.user.id
        );
      } else {
        // Create new record
        db.prepare(`
          INSERT INTO magazines (
            id, title, slug, description, category_id, user_id, 
            cover_image, status, view_count, is_featured, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, 0, ?, ?)
        `).run(
          magazineId,
          title.trim(),
          uniqueSlug,
          description || '',
          categoryId || null,
          req.user.id,
          coverPath,
          status,
          now,
          now
        );
      }

      // Handle pages if uploaded
      if (req.files && req.files.pages && req.files.pages.length > 0) {
        const lastPage = db.prepare('SELECT MAX(page_number) as max_page FROM magazine_pages WHERE magazine_id = ?').get(magazineId);
        let startPageNumber = (lastPage && lastPage.max_page ? lastPage.max_page : 0) + 1;

        const insertPage = db.prepare(`
          INSERT INTO magazine_pages (id, magazine_id, page_number, file_path, original_filename, file_size, mime_type, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `);

        for (const file of req.files.pages) {
          const pageId = `page_${uuidv4().replace(/-/g, '').substring(0, 16)}`;
          insertPage.run(
            pageId,
            magazineId,
            startPageNumber++,
            file.filename,
            file.originalname,
            file.size,
            file.mimetype,
            now
          );
        }
      }

      // If user provided a custom page order JSON
      if (req.body.pageOrder) {
        try {
          const orderArray = JSON.parse(req.body.pageOrder);
          if (Array.isArray(orderArray)) {
            const updateOrder = db.prepare('UPDATE magazine_pages SET page_number = ? WHERE id = ? AND magazine_id = ?');
            orderArray.forEach((pId, idx) => {
              updateOrder.run(idx + 1, pId, magazineId);
            });
          }
        } catch (e) {
          console.warn('[Page Reorder] Failed parsing order:', e.message);
        }
      }

      // Query total pages
      const totalPagesRes = db.prepare('SELECT COUNT(*) as count FROM magazine_pages WHERE magazine_id = ?').get(magazineId);
      const totalPages = totalPagesRes.count || 0;

      // If submitted for review, send instant notification to Sayhan (yellowreignacademy@gmail.com)
      if (status === 'PENDING_REVIEW') {
        const cat = categoryId ? db.prepare('SELECT name FROM categories WHERE id = ?').get(categoryId) : null;
        const formattedDate = new Date().toLocaleString('en-US', {
          timeZone: 'Asia/Kolkata',
          dateStyle: 'full',
          timeStyle: 'long'
        });

        sendSubmissionNotification({
          submitterName: req.user.full_name,
          email: req.user.email,
          phone: req.user.phone,
          magazineTitle: title.trim(),
          description: description || '',
          category: cat ? cat.name : 'General',
          pageCount: totalPages,
          submittedAt: formattedDate,
          magazineId
        }).catch(err => console.error('[Magazine Submission] Notification email error:', err.message));
      }

      res.status(200).json({
        message: status === 'PENDING_REVIEW'
          ? 'Magazine submitted successfully! Admin Sayhan has been notified for review and publication.'
          : 'Draft saved successfully.',
        magazineId,
        status,
        totalPages
      });
    } catch (err) {
      console.error('[Magazine Submit] Error:', err);
      res.status(500).json({ error: 'Failed to save magazine submission: ' + err.message });
    }
  }
);

// DELETE /api/magazines/user/:id (Delete user submission)
router.delete('/user/:id', authenticate, (req, res) => {
  try {
    const submission = db.prepare('SELECT * FROM magazines WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
    if (!submission) {
      return res.status(404).json({ error: 'Submission not found or access denied.' });
    }

    if (submission.status === 'PUBLISHED') {
      return res.status(403).json({ error: 'Cannot delete a published magazine. Only Admin Sayhan can unpublish or remove public content.' });
    }

    // Delete files on disk
    removeSubmissionFolder(req.user.id, submission.id);

    // Delete records in database (foreign keys cascade pages)
    db.prepare('DELETE FROM magazines WHERE id = ?').run(submission.id);

    res.json({ message: 'Submission deleted successfully.' });
  } catch (err) {
    console.error('[Delete Submission] Error:', err);
    res.status(500).json({ error: 'Failed to delete submission.' });
  }
});

// DELETE /api/magazines/user/:magazineId/page/:pageId
router.delete('/user/:magazineId/page/:pageId', authenticate, (req, res) => {
  try {
    const { magazineId, pageId } = req.params;
    const submission = db.prepare('SELECT * FROM magazines WHERE id = ? AND user_id = ?').get(magazineId, req.user.id);

    if (!submission) {
      return res.status(404).json({ error: 'Submission not found.' });
    }
    if (submission.status === 'PUBLISHED') {
      return res.status(403).json({ error: 'Cannot modify pages of a published magazine.' });
    }

    const page = db.prepare('SELECT * FROM magazine_pages WHERE id = ? AND magazine_id = ?').get(pageId, magazineId);
    if (!page) {
      return res.status(404).json({ error: 'Page not found.' });
    }

    // Delete file if exists
    try {
      const filePath = path.join(process.cwd(), 'uploads', 'users', req.user.id, 'submissions', magazineId, page.file_path);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch (e) {
      console.warn('Could not delete page file:', e.message);
    }

    db.prepare('DELETE FROM magazine_pages WHERE id = ?').run(pageId);

    // Re-index remaining pages
    const remaining = db.prepare('SELECT id FROM magazine_pages WHERE magazine_id = ? ORDER BY page_number ASC').all(magazineId);
    const updateOrder = db.prepare('UPDATE magazine_pages SET page_number = ? WHERE id = ?');
    remaining.forEach((p, idx) => {
      updateOrder.run(idx + 1, p.id);
    });

    res.json({ message: 'Page deleted successfully.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete page.' });
  }
});

export default router;
