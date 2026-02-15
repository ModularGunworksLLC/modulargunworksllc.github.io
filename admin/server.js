/**
 * Admin server - product catalog management.
 * Deploy to Render: set Root Directory to "admin", Start Command "npm start".
 * Uses PORT from environment (Render sets this).
 */
require('dotenv').config();
const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Static files (admin UI)
const publicDir = path.join(__dirname, 'public');
app.use(express.json());
app.use(express.static(publicDir));

// Health check for Render
app.get('/api/health', (req, res) => {
  res.json({ ok: true, service: 'modular-gunworks-admin' });
});

// Placeholder: will be login, companies, merge, etc.
app.get('/api/status', (req, res) => {
  res.json({
    message: 'Admin API running',
    version: '1.0.0',
    features: ['login', 'companies', 'sources', 'merge', 'primary-listing'],
  });
});

// SPA fallback: serve index.html for admin routes
app.get('*', (req, res) => {
  if (!req.path.startsWith('/api')) {
    res.sendFile(path.join(publicDir, 'index.html'));
  } else {
    res.status(404).json({ error: 'Not found' });
  }
});

app.listen(PORT, () => {
  console.log(`Admin running at http://localhost:${PORT}`);
});
