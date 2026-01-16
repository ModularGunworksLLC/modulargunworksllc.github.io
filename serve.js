const express = require('express');
const path = require('path');
const nodemailer = require('nodemailer');
const app = express();
const PORT = 3000;

// Gmail configuration
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'modulargunworks@gmail.com',
    pass: 'xygt wwgk fnbp qkps'
  }
});

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

// Middleware to parse JSON
app.use(express.json());

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
    "script-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com https://www.paypal.com https://www.sandbox.paypal.com; " +
    "style-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com; " +
    "img-src 'self' data: https:; " +
    "font-src 'self' https://cdnjs.cloudflare.com https://fonts.googleapis.com https://fonts.gstatic.com; " +
    "connect-src 'self' http://localhost:3001 https://www.paypal.com https://www.sandbox.paypal.com; " +
    "frame-src https://www.paypal.com https://www.sandbox.paypal.com; " +
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

// Order email endpoint
app.post('/api/send-order-email', async (req, res) => {
  try {
    const { orderId, productName, quantity, totalAmount, buyerEmail, category } = req.body;

    // Validate required fields
    if (!orderId || !productName || !quantity || !totalAmount) {
      return res.status(400).json({ success: false, error: 'Missing required fields' });
    }

    const emailContent = `
      <h2>New Order Received</h2>
      <p><strong>Order ID:</strong> ${orderId}</p>
      <p><strong>Product:</strong> ${productName}</p>
      <p><strong>Category:</strong> ${category || 'Ammunition'}</p>
      <p><strong>Quantity:</strong> ${quantity}</p>
      <p><strong>Total Amount:</strong> $${parseFloat(totalAmount).toFixed(2)}</p>
      <p><strong>Buyer Email:</strong> ${buyerEmail || 'Not provided'}</p>
      <p><strong>Order Date:</strong> ${new Date().toLocaleString()}</p>
      <hr>
      <p>This order has been processed through PayPal.</p>
    `;

    await transporter.sendMail({
      from: 'modulargunworks@gmail.com',
      to: 'modulargunworks@gmail.com',
      subject: `New Order #${orderId} - ${productName}`,
      html: emailContent
    });

    res.json({ success: true, message: 'Order email sent successfully' });
  } catch (error) {
    console.error('Email error:', error);
    res.status(500).json({ success: false, error: 'Failed to send email' });
  }
});

// 404 handler - return 404 instead of HTML
app.use((req, res) => {
  res.status(404).json({ error: 'Not Found', path: req.path });
});

app.listen(PORT, () => {
  console.log(`✅ Site running at http://localhost:${PORT}`);
  console.log(`📁 Serving files from: ${__dirname}`);
});
