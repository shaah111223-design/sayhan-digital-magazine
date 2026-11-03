import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import path from 'node:path';
import fs from 'node:fs';

// Database & Seeder
import './db.js';
import { seedSampleMagazines } from './seeder.js';

// Route Handlers
import authRoutes from './routes/authRoutes.js';
import magazineRoutes from './routes/magazineRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import fileRoutes from './routes/fileRoutes.js';

export const app = express();

// Enable CORS
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '60mb' }));
app.use(express.urlencoded({ extended: true, limit: '60mb' }));

// Serve static sample files
const publicDir = path.resolve(process.cwd(), 'public');
if (fs.existsSync(publicDir)) {
  app.use('/samples', express.static(path.join(publicDir, 'samples')));
}

// Mount routes with /api prefix (and fallback without /api for Vercel serverless functions)
app.use('/api/auth', authRoutes);
app.use('/auth', authRoutes);

app.use('/api/magazines', magazineRoutes);
app.use('/magazines', magazineRoutes);

app.use('/api/admin', adminRoutes);
app.use('/admin', adminRoutes);

app.use('/api/files', fileRoutes);
app.use('/files', fileRoutes);

// Health check endpoint
const healthHandler = (req, res) => {
  res.json({
    status: 'ONLINE',
    service: 'Yellow Reign Academy Publishing Engine',
    superAdmin: 'Sayhan',
    notificationEmail: 'yellowreignacademy@gmail.com',
    environment: process.env.VERCEL ? 'VERCEL_SERVERLESS' : 'LOCAL_NODE',
    timestamp: new Date().toISOString()
  });
};
app.get('/api/health', healthHandler);
app.get('/health', healthHandler);

// Explicit API 404 handler to guarantee valid JSON on unknown API requests
app.all(['/api/*', '/auth/*', '/magazines/*', '/admin/*', '/files/*'], (req, res) => {
  res.status(404).json({
    error: `API endpoint ${req.method} ${req.originalUrl} not found`
  });
});

// Serve frontend in production when dist/ exists (local node execution)
const distDir = path.resolve(process.cwd(), 'dist');
if (fs.existsSync(distDir)) {
  app.use(express.static(distDir));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/samples')) {
      return next();
    }
    res.sendFile(path.join(distDir, 'index.html'));
  });
}

// Global error handler (always returns JSON)
app.use((err, req, res, next) => {
  console.error('[Server Error Handler]:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error'
  });
});

export async function initDatabaseAndSeed() {
  try {
    await seedSampleMagazines();
  } catch (err) {
    console.warn('[App Init] Seeder warning:', err.message);
  }
}

export default app;
