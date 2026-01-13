const express = require('express');
const path = require('path');
const app = express();
const PORT = 3000;

// Set proper MIME types for static files
const mimeTypes = {
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.html': 'text/html',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf'
};

// Middleware to set correct MIME types
app.use((req, res, next) => {
  const ext = path.extname(req.path).toLowerCase();
  if (mimeTypes[ext]) {
    res.type(mimeTypes[ext]);
  }
  next();
});

// Remove overly restrictive CSP and set sensible defaults
app.use((req, res, next) => {
  res.setHeader('Content-Security-Policy', 
    "default-src 'self'; " +
    "script-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com; " +
    "style-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com; " +
    "img-src 'self' data: https:; " +
    "font-src 'self' https://cdnjs.cloudflare.com; " +
    "connect-src 'self'; " +
    "frame-ancestors 'none'"
  );
  next();
});

// Serve static files with correct MIME types
app.use(express.static(path.join(__dirname), {
  etag: false,
  setHeaders: (res, path) => {
    const ext = path.substring(path.lastIndexOf('.')).toLowerCase();
    if (mimeTypes[ext]) {
      res.setHeader('Content-Type', mimeTypes[ext]);
    }
  }
}));

// Root route
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// 404 handler - return 404 instead of HTML
app.use((req, res) => {
  res.status(404).json({ error: 'Not Found', path: req.path });
});

app.listen(PORT, () => {
  console.log(`✅ Site running at http://localhost:${PORT}`);
  console.log(`📁 Serving files from: ${__dirname}`);
});
