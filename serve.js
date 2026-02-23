require('dotenv').config();
const express = require('express');
const path = require('path');
const fs = require('fs');
const cors = require('cors');
const nodemailer = require('nodemailer');
const app = express();
const PORT = process.env.PORT || 3000;

const GUNTAB_API_TOKEN = process.env.GUNTAB_API_TOKEN;
const GUNTAB_SELLER_EMAIL = process.env.GUNTAB_SELLER_EMAIL || 'modulargunworks@gmail.com';

const ORDERS_FILE = path.join(__dirname, 'data', 'orders.json');

function readOrders() {
  try {
    const data = fs.readFileSync(ORDERS_FILE, 'utf8');
    return JSON.parse(data);
  } catch (e) {
    if (e.code === 'ENOENT') return [];
    throw e;
  }
}

function writeOrders(orders) {
  const dir = path.dirname(ORDERS_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(ORDERS_FILE, JSON.stringify(orders, null, 2), 'utf8');
}

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

// Enable CORS
app.use(cors());

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
    "img-src 'self' data: https: http:; " +
    "font-src 'self' https://cdnjs.cloudflare.com https://fonts.googleapis.com https://fonts.gstatic.com; " +
    "connect-src 'self' http://localhost:3001 https://api.guntab.com https://www.paypal.com https://www.sandbox.paypal.com; " +
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
    const { orderId, productName, quantity, totalAmount, buyerEmail, category, orderSummary, ageVerified, stateRestrictionsAcknowledged, minAgeConfirmed, firearmTransferAcknowledged, federalStateFirearmRulesAcknowledged, minFirearmAgeConfirmed } = req.body;

    // Validate required fields
    if (!orderId || !totalAmount) {
      return res.status(400).json({ success: false, error: 'Missing required fields' });
    }

    const productSection = orderSummary
      ? `<p><strong>Order details:</strong></p><pre style="white-space:pre-wrap;font-size:12px;">${(orderSummary || '').replace(/</g, '&lt;')}</pre>`
      : `<p><strong>Product:</strong> ${productName || 'N/A'}</p><p><strong>Quantity:</strong> ${quantity || 'N/A'}</p>`;
    const ammoAuditSection = (ageVerified || stateRestrictionsAcknowledged || minAgeConfirmed) ? `
      <p><strong>Ammunition age verification (audit):</strong></p>
      <ul>
        <li>Age verified: ${ageVerified ? 'Yes' : 'No'}</li>
        <li>State restrictions acknowledged: ${stateRestrictionsAcknowledged ? 'Yes' : 'No'}</li>
        <li>Min age confirmed: ${minAgeConfirmed ? minAgeConfirmed + '+' : 'N/A'}</li>
      </ul>
    ` : '';
    const firearmAuditSection = (firearmTransferAcknowledged || federalStateFirearmRulesAcknowledged || minFirearmAgeConfirmed) ? `
      <p><strong>Firearm transfer verification (audit):</strong></p>
      <ul>
        <li>FFL transfer acknowledged: ${firearmTransferAcknowledged ? 'Yes' : 'No'}</li>
        <li>Federal/state firearm rules acknowledged: ${federalStateFirearmRulesAcknowledged ? 'Yes' : 'No'}</li>
        <li>Min firearm age confirmed: ${minFirearmAgeConfirmed ? minFirearmAgeConfirmed + '+' : 'N/A'}</li>
      </ul>
    ` : '';

    const emailContent = `
      <h2>New Order Received</h2>
      <p><strong>Order ID:</strong> ${orderId}</p>
      ${productSection}
      <p><strong>Category:</strong> ${category || 'General'}</p>
      <p><strong>Total Amount:</strong> $${parseFloat(totalAmount).toFixed(2)}</p>
      <p><strong>Buyer Email:</strong> ${buyerEmail || 'Not provided'}</p>
      <p><strong>Order Date:</strong> ${new Date().toLocaleString()}</p>
      ${ammoAuditSection}
      ${firearmAuditSection}
      <hr>
      <p>This order has been processed through PayPal.</p>
    `;

    await transporter.sendMail({
      from: 'modulargunworks@gmail.com',
      to: 'modulargunworks@gmail.com',
      subject: `New Order #${orderId} - ${productName}`,
      html: emailContent
    });

    // Save order for status lookup (orderId, buyerEmail, orderDate, status, trackingNumber, shippedDate)
    const orders = readOrders();
    orders.push({
      orderId: String(orderId).trim(),
      buyerEmail: (buyerEmail || '').trim().toLowerCase(),
      orderDate: new Date().toISOString(),
      status: 'Received',
      trackingNumber: null,
      shippedDate: null
    });
    writeOrders(orders);

    res.json({ success: true, message: 'Order email sent successfully' });
  } catch (error) {
    console.error('Email error:', error);
    res.status(500).json({ success: false, error: 'Failed to send email' });
  }
});

// Order status lookup (by order ID + email)
app.post('/api/order-status', (req, res) => {
  try {
    const { orderId, email } = req.body || {};
    const id = String(orderId || '').trim();
    const em = String(email || '').trim().toLowerCase();
    if (!id || !em) {
      return res.status(400).json({ success: false, found: false, error: 'Order ID and email are required.' });
    }
    const orders = readOrders();
    const order = orders.find(o => o.orderId === id && o.buyerEmail === em);
    if (!order) {
      return res.json({ success: true, found: false, message: 'No order found. Check your order ID and email.' });
    }
    res.json({
      success: true,
      found: true,
      orderId: order.orderId,
      status: order.status || 'Received',
      orderDate: order.orderDate,
      trackingNumber: order.trackingNumber || null,
      shippedDate: order.shippedDate || null
    });
  } catch (error) {
    console.error('Order status error:', error);
    res.status(500).json({ success: false, found: false, error: 'Lookup failed.' });
  }
});

// GunTab: map category to listing_type_id (GunTab API)
function categoryToListingTypeId(category) {
  const c = (category || '').toLowerCase();
  if (c === 'ammunition') return 'ammunition_and_flammables';
  if (c === 'magazines') return 'magazine';
  if (c === 'guns' || c === 'firearms') return 'long_gun'; // default; handgun if product-specific
  if (c === 'gun-parts' || c === 'gun parts') return 'other_non_regulated';
  return 'other_non_regulated';
}

// CORS preflight for API routes (some clients require explicit OPTIONS)
app.options('/api/guntab-create-invoice', (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.sendStatus(204);
});

// Create GunTab invoice and return response_url for redirect
app.post('/api/guntab-create-invoice', async (req, res) => {
  if (!GUNTAB_API_TOKEN) {
    return res.status(503).json({ success: false, error: 'GunTab is not configured. Contact support.' });
  }

  try {
    const { items, merchandise_amount_cents, shipping_amount_cents, buyer_email, redirect_url } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0 || merchandise_amount_cents == null) {
      return res.status(400).json({ success: false, error: 'Missing items or merchandise_amount_cents' });
    }

    const merchCents = Math.round(Number(merchandise_amount_cents) || 0);
    const shipCents = Math.round(Number(shipping_amount_cents) || 0);

    const baseUrl = `${req.protocol}://${req.get('host') || 'localhost:3000'}`;
    const listings = items.map(it => ({
      listing_type_id: categoryToListingTypeId(it.category),
      quantity: Math.max(1, parseInt(it.quantity, 10) || 1),
      title: (it.name || it.title || 'Item').substring(0, 200),
      url: it.url || (it.sku && it.category
        ? `${baseUrl}/product-detail.html?sku=${encodeURIComponent(it.sku)}&category=${encodeURIComponent(it.category)}`
        : null)
    }));

    const payload = {
      seller_email: GUNTAB_SELLER_EMAIL,
      merchandise_amount_cents: String(merchCents),
      shipping_amount_cents: String(shipCents),
      listings,
      service_fee_paid_by: 'seller',
      payment_method_convenience_fee_paid_by: 'buyer'
    };
    if (buyer_email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(buyer_email)) {
      payload.buyer_email = buyer_email;
    }
    if (redirect_url && typeof redirect_url === 'string' && redirect_url.startsWith('http')) {
      payload.redirect_url = redirect_url;
    } else {
      payload.redirect_url = `${baseUrl}/order-status.html`;
    }

    const apiRes = await fetch('https://api.guntab.com/v1/invoices', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Token ${GUNTAB_API_TOKEN}`
      },
      body: JSON.stringify(payload)
    });

    const data = await apiRes.json();

    if (!apiRes.ok) {
      const errMsg = (data.errors && Array.isArray(data.errors)) ? data.errors.join('; ') : (data.error || 'GunTab API error');
      return res.status(apiRes.status >= 500 ? 502 : 400).json({ success: false, error: errMsg });
    }

    if (!data.response_url) {
      return res.status(502).json({ success: false, error: 'No checkout URL from GunTab' });
    }

    res.json({ success: true, response_url: data.response_url, invoice_id: data.id });
  } catch (err) {
    console.error('GunTab create-invoice error:', err);
    res.status(500).json({ success: false, error: 'Failed to create checkout session' });
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
