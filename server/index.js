import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import path from 'node:path';
import fs from 'node:fs';

// Initialize Database & Seeder
import './db.js';
import { seedSampleMagazines } from './seeder.js';

// Route Handlers
import authRoutes from './routes/authRoutes.js';
import magazineRoutes from './routes/magazineRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import fileRoutes from './routes/fileRoutes.js';

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS for development frontend
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '60mb' }));
app.use(express.urlencoded({ extended: true, limit: '60mb' }));

// Serve static sample files (covers and pre-rendered vector pages)
const publicDir = path.resolve(process.cwd(), 'public');
app.use('/samples', express.static(path.join(publicDir, 'samples')));

// API Route Mounts
app.use('/api/auth', authRoutes);
app.use('/api/magazines', magazineRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/files', fileRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ONLINE',
    service: 'Yellow Reign Academy Publishing Engine',
    superAdmin: 'Sayhan',
    notificationEmail: 'yellowreignacademy@gmail.com',
    timestamp: new Date().toISOString()
  });
});

// Serve frontend in production (dist directory)
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

// Global error handler
app.use((err, req, res, next) => {
  console.error('[Server Error Handler]:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error'
  });
});

// Start Server
async function startServer() {
  try {
    await seedSampleMagazines();
    app.listen(PORT, () => {
      console.log(`=======================================================`);
      console.log(` 👑 YELLOW REIGN ACADEMY - MAGAZINE PUBLISHING PORTAL`);
      console.log(`=======================================================`);
      console.log(` • Server Running: http://localhost:${PORT}`);
      console.log(` • Super Admin: Sayhan`);
      console.log(` • Admin Notification Email: yellowreignacademy@gmail.com`);
      console.log(` • Admin Phone: 9544498843`);
      console.log(` • Database: SQLite (WAL Mode & Foreign Keys Active)`);
      console.log(` • Secure File Storage: uploads/users/:id/submissions/`);
      console.log(`=======================================================`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
  }
}

startServer();

