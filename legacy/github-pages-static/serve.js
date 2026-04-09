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
const SHIPPING_FLAT_RATE_CENTS = 1299;
const FREE_SHIPPING_THRESHOLD_CENTS = 9900;
// Public store URL for redirects, etc.
const PUBLIC_STORE_URL = (process.env.PUBLIC_STORE_URL || 'https://modulargunworksllc.github.io').replace(/\/$/, '');
// URL for GunTab listing validation: must return server-rendered product HTML (not JS-dependent).
// If modulargunworks.com is on GitHub Pages (static), use Northflank URL here so GunTab sees product content.
const GUNTAB_LISTING_BASE = (process.env.GUNTAB_LISTING_BASE || process.env.PUBLIC_STORE_URL || 'https://modulargunworksllc.github.io').replace(/\/$/, '');

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
const GMAIL_USER = process.env.GMAIL_USER || '';
const GMAIL_APP_PASSWORD = process.env.GMAIL_APP_PASSWORD || '';
const MAIL_ENABLED = !!(GMAIL_USER && GMAIL_APP_PASSWORD);
const transporter = MAIL_ENABLED ? nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: GMAIL_USER,
    pass: GMAIL_APP_PASSWORD
  }
}) : null;

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
    "connect-src 'self' http://localhost:3001 https://api.guntab.com https://modulargunworks.com https://www.paypal.com https://www.sandbox.paypal.com; " +
    "frame-src https://www.paypal.com https://www.sandbox.paypal.com; " +
    "frame-ancestors 'none'"
  );
  next();
});

// Helper: load product from JSON by sku + category
function loadProductFromJson(sku, category) {
  const SLUG_TO_FILE = {
    ammunition: 'Ammunition.json',
    magazines: 'Magazines.json',
    'gun-parts': 'Gun_Parts.json',
    gear: 'Gear.json',
    optics: 'Optics.json',
    reloading: 'Reloading.json',
    outdoors: 'Outdoors.json',
    guns: 'Firearms.json',
    knives: 'Knives.json',
    clothing___footwear: 'Clothing___Footwear.json'
  };
  const catKey = String(category || '').toLowerCase();
  const fileName = SLUG_TO_FILE[catKey] || (category ? (category.charAt(0).toUpperCase() + category.slice(1).replace(/-/g, '_') + '.json') : 'Gear.json');
  const jsonPath = path.join(__dirname, 'data', 'products', 'mapped-products', fileName);
  try {
    const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
    const list = Array.isArray(data) ? data : (data.products || data.items || []);
    const match = list.find((p) => (p.SKU || p.sku || '').toString() === String(sku || ''));
    if (!match) return null;
    const toNum = (v) => (v != null && v !== '' && !isNaN(Number(v))) ? Number(v) : null;
    const msrp = toNum(match.MSRP), map = toNum(match.MAP), price = toNum(match.Price);
    const displayPrice = (msrp ?? map ?? price) || 0;
    return {
      name: match['Item Name'] || match['Web Item Name'] || match.name || 'Item',
      sku: match.SKU || match.sku,
      displayPrice,
      image: (match['Image Location'] || match.image || '').replace(/\?w=\d+&h=\d+/, '?w=500&h=500'),
      brand: match.Manufacturer || match.manufacturer || '',
      inventory: parseInt(match['Quantity In Stock'], 10) || 0
    };
  } catch (e) {
    return null;
  }
}

function computeTrustedMerchandiseCents(items) {
  if (!Array.isArray(items)) return 0;
  let total = 0;
  for (const it of items) {
    const qty = Math.max(1, parseInt((it && it.quantity) || 1, 10) || 1);
    const product = loadProductFromJson(it && it.sku, it && it.category);
    if (!product || !(product.displayPrice > 0)) {
      throw new Error(`Invalid item in cart payload (sku=${(it && it.sku) || 'unknown'})`);
    }
    total += Math.round(Number(product.displayPrice) * 100) * qty;
  }
  return total;
}

function expectedShippingCents(merchandiseCents) {
  return merchandiseCents >= FREE_SHIPPING_THRESHOLD_CENTS ? 0 : SHIPPING_FLAT_RATE_CENTS;
}

// Dedicated minimal product page for GunTab crawler - no regex, no JS dependency (fixes "Url does not exist")
function handleProductView(req, res) {
  const sku = req.query.sku;
  const category = req.query.category || 'gear';
  if (!sku) {
    res.setHeader('Cache-Control', 'no-store');
    return res.status(400).type('text/html').send('<html><body><h1>Product not specified</h1></body></html>');
  }
  const product = loadProductFromJson(sku, category);
  res.setHeader('Cache-Control', 'no-store');
  if (!product || product.displayPrice <= 0) {
    return res.type('text/html').send(`<html><head><title>Product - Modular Gunworks LLC</title></head><body><h1>Product not found</h1><p>SKU: ${String(sku)}</p></body></html>`);
  }
  const esc = (s) => String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const html = `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><title>${esc(product.name)} - Modular Gunworks LLC</title><meta name="description" content="${esc(product.name)} - $${product.displayPrice.toFixed(2)} - Modular Gunworks LLC"></head><body>
<h1>${esc(product.name)}</h1>
<p><strong>Price:</strong> $${product.displayPrice.toFixed(2)}</p>
<p><strong>SKU:</strong> ${esc(product.sku)}</p>
<p><strong>Brand:</strong> ${esc(product.brand) || 'Modular Gunworks'}</p>
<p><strong>Stock:</strong> ${product.inventory > 0 ? 'In Stock (' + product.inventory + ' available)' : 'Out of Stock'}</p>
${product.image ? `<p><img src="${esc(product.image)}" alt="${esc(product.name)}"></p>` : ''}
<p>Modular Gunworks LLC – quality firearms, ammunition, and gear.</p>
</body></html>`;
  res.type('text/html').send(html);
}
app.get('/product-view', handleProductView);
app.get('/product-view.html', handleProductView);

// Product detail with server-rendered content for GunTab crawler (requires public page with merchandise details)
app.get('/product-detail.html', (req, res) => {
  const sku = req.query.sku;
  const category = req.query.category || 'ammunition';
  if (!sku || !category) {
    return res.sendFile(path.join(__dirname, 'product-detail.html'));
  }
  const product = loadProductFromJson(sku, category);
  const htmlPath = path.join(__dirname, 'product-detail.html');
  let html = fs.readFileSync(htmlPath, 'utf8');
  if (product && product.displayPrice > 0) {
    const escaped = (s) => String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    const preload = { sku: product.sku, name: product.name, displayPrice: product.displayPrice, image: product.image || '', brand: product.brand || '', inventory: product.inventory, category };
    const merchBlock = `
      <script>window.__PRELOADED_PRODUCT__=${JSON.stringify(preload)};<\/script>
      <div class="product-detail-container" data-server-rendered="true">
        <div class="product-image-section">
          <div class="product-main-image">${product.image ? `<img src="${escaped(product.image)}" alt="${escaped(product.name)}">` : '<div class="product-main-image-placeholder"><i class="fas fa-box"></i></div>'}</div>
        </div>
        <div class="product-info-section">
          <div class="product-breadcrumb-category">${escaped(category.toUpperCase())}</div>
          <h1 class="product-detail-title">${escaped(product.name)}</h1>
          <div class="product-detail-brand">${escaped(product.brand) || 'Modular Gunworks'}</div>
          <div class="product-detail-price">$${product.displayPrice.toFixed(2)}</div>
          <div class="product-detail-stock ${product.inventory > 0 ? 'stock-in' : 'stock-out'}">
            <i class="fas ${product.inventory > 0 ? 'fa-check-circle' : 'fa-times-circle'}"></i>
            ${product.inventory > 0 ? `In Stock (${product.inventory} available)` : 'Out of Stock'}
          </div>
          <div class="detail-value">SKU: ${escaped(product.sku)}</div>
        </div>
      </div>
      <noscript><p><strong>${escaped(product.name)}</strong> – $${product.displayPrice.toFixed(2)}. SKU: ${escaped(product.sku)}. Modular Gunworks LLC – quality firearms, ammunition, and gear.</p></noscript>
    `;
    // Replace loading placeholder – flexible regex for different formatting
    const productContentRegex = /<div id="product-content">[\s\S]*?<div[^>]*class="loading"[^>]*>[\s\S]*?<\/div>\s*<\/div>/;
    const beforeLen = html.length;
    html = html.replace(productContentRegex, `<div id="product-content">${merchBlock}</div>`);
    if (html.length === beforeLen) {
      // Regex didn't match – try simpler fallback: replace loading text block
      html = html.replace(
        /<div id="product-content">[\s\S]*?Loading product details[\s\S]*?<\/div>\s*<\/div>/,
        `<div id="product-content">${merchBlock}</div>`
      );
    }
  }
  res.setHeader('Cache-Control', 'no-store');
  res.type('text/html').send(html);
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
  if (!MAIL_ENABLED || !transporter) {
    return res.status(503).json({ success: false, error: 'Email service is not configured' });
  }
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
      from: GMAIL_USER,
      to: GMAIL_USER,
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

    if (!items || !Array.isArray(items) || items.length === 0 || merchandise_amount_cents == null || shipping_amount_cents == null) {
      return res.status(400).json({ success: false, error: 'Missing items, merchandise_amount_cents, or shipping_amount_cents' });
    }

    const merchCentsClient = Math.round(Number(merchandise_amount_cents) || 0);
    const shipCentsClient = Math.round(Number(shipping_amount_cents) || 0);
    const merchCentsTrusted = computeTrustedMerchandiseCents(items);
    if (Math.abs(merchCentsTrusted - merchCentsClient) > 1) {
      return res.status(400).json({
        success: false,
        error: `Invalid merchandise amount. Expected ${merchCentsTrusted}, got ${merchCentsClient}.`
      });
    }
    const shipExpected = expectedShippingCents(merchCentsTrusted);
    if (shipCentsClient !== shipExpected) {
      return res.status(400).json({
        success: false,
        error: `Invalid shipping amount. Expected ${shipExpected}, got ${shipCentsClient}.`
      });
    }

    // Use PUBLIC_STORE_URL for listing URLs - GunTab requires public product pages, not the API host
    const listings = items.map(it => ({
      listing_type_id: categoryToListingTypeId(it.category),
      quantity: Math.max(1, parseInt(it.quantity, 10) || 1),
      title: (it.name || it.title || 'Item').substring(0, 200),
      url: it.url || (it.sku && it.category
        ? `${GUNTAB_LISTING_BASE}/product-view.html?sku=${encodeURIComponent(it.sku)}&category=${encodeURIComponent(it.category)}`
        : null)
    }));

    const payload = {
      seller_email: GUNTAB_SELLER_EMAIL,
      merchandise_amount_cents: String(merchCentsTrusted),
      shipping_amount_cents: String(shipExpected),
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
      payload.redirect_url = `${PUBLIC_STORE_URL}/order-status.html`;
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
