import fs from 'node:fs';
import path from 'node:path';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';

export const UPLOADS_ROOT = path.resolve(process.cwd(), 'uploads');
export const USERS_UPLOADS = path.join(UPLOADS_ROOT, 'users');
export const OFFICIAL_UPLOADS = path.join(UPLOADS_ROOT, 'official');

// Ensure root directories exist
[UPLOADS_ROOT, USERS_UPLOADS, OFFICIAL_UPLOADS].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Get or create private directory for a user submission
export function getSubmissionFolder(userId, submissionId) {
  const dir = path.join(USERS_UPLOADS, userId, 'submissions', submissionId);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return dir;
}

// Multer storage engine routing files to the user's private submission folder
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const userId = req.user ? req.user.id : 'temp';
    const submissionId = req.submissionId || (req.body && req.body.id) || `mag_${uuidv4().replace(/-/g, '').substring(0, 16)}`;
    req.submissionId = submissionId;

    let targetDir = '';
    if (req.user && req.user.role === 'ADMIN' && req.body && req.body.isOfficial === 'true') {
      targetDir = path.join(OFFICIAL_UPLOADS, submissionId);
    } else {
      targetDir = getSubmissionFolder(userId, submissionId);
    }

    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }
    cb(null, targetDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const cleanBase = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9_-]/g, '_');
    const uniqueSuffix = `${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    cb(null, `${cleanBase}_${uniqueSuffix}${ext}`);
  }
});

// File filter: accept PDF, JPG, JPEG, PNG, WEBP
const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/svg+xml', 'application/pdf'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Unsupported file type: ${file.mimetype}. Only PDF, JPG, JPEG, PNG, WEBP, and SVG are supported.`));
  }
};

export const uploadMiddleware = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 60 * 1024 * 1024, // 60MB per file
    files: 100 // up to 100 pages in one batch
  }
});

// Helper to remove submission folder completely
export function removeSubmissionFolder(userId, submissionId) {
  try {
    const userDir = path.join(USERS_UPLOADS, userId, 'submissions', submissionId);
    if (fs.existsSync(userDir)) {
      fs.rmSync(userDir, { recursive: true, force: true });
    }
    const officialDir = path.join(OFFICIAL_UPLOADS, submissionId);
    if (fs.existsSync(officialDir)) {
      fs.rmSync(officialDir, { recursive: true, force: true });
    }
  } catch (err) {
    console.error(`[Storage] Failed to remove folder:`, err.message);
  }
}
