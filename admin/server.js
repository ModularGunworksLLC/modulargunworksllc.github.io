/**
 * Admin server: serves admin UI and API for products + overrides.
 * Run: node admin/server.js  (or npm run admin from repo root)
 * Overrides: Neon Postgres when DATABASE_URL is set, else data/products/overrides.json
 */

const path = require('path');
const ROOT = path.join(__dirname, '..');
require('dotenv').config({ path: path.join(ROOT, '.env') });

const express = require('express');
const cors = require('cors');
const fs = require('fs');
const https = require('https');
const http = require('http');
const db = require('./db');

const app = express();
const PORT = process.env.ADMIN_PORT || 3001;

// Allow API calls from any origin (e.g. admin opened from main site or different port)
app.use(cors({ origin: true, credentials: true }));
const MAPPED_DIR = path.join(ROOT, 'data', 'products', 'mapped-products');
const ALL_PRODUCTS_PATH = path.join(ROOT, 'data', 'products', 'all-products.json');
const MAPPING_PATH = path.join(ROOT, 'data', 'products', 'category-mapping-template-cleaned.json');

// Strip quotes if .env added them; otherwise use env or this default
const raw = (process.env.ADMIN_PASSWORD || '').trim().replace(/^["']|["']$/g, '');
const ADMIN_PASSWORD = raw || 'Gunworks2026!';

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- Health check (no auth) ---
app.get('/api/health', async (req, res) => {
  if (!db.getPool()) {
    return res.json({ ok: true, db: 'file', message: 'Using data/products/overrides.json' });
  }
  try {
    const connected = await db.testConnection();
    if (connected) return res.json({ ok: true, db: 'neon', message: 'Neon Postgres connected' });
    return res.status(503).json({ ok: false, db: 'neon', message: 'Database connection failed' });
  } catch (e) {
    return res.status(503).json({ ok: false, db: 'neon', message: e.message || 'Database error' });
  }
});

// In-memory session for demo (use cookie/session in production)
const sessions = new Set();

function requireAuth(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '') || req.query.token;
  if (token && sessions.has(token)) return next();
  return res.status(401).json({ error: 'Login required' });
}

async function loadAllProducts() {
  const overrides = await db.loadOverrides();
  const products = [];

  // Prefer all-products.json so admin sees every product (mapped + unmapped)
  if (fs.existsSync(ALL_PRODUCTS_PATH)) {
    try {
      const data = JSON.parse(fs.readFileSync(ALL_PRODUCTS_PATH, 'utf8'));
      const list = Array.isArray(data) ? data : (data.products || data.items || []);
      list.forEach(p => {
        const sku = (p.SKU || p.sku || '').toString().trim();
        const o = overrides[sku] || {};
        const hidden = o.hidden === true;
        const forceShow = o.forceShow === true;
        const priceOverride = o.priceOverride != null ? Number(o.priceOverride) : null;
        const displayPrice = priceOverride != null ? priceOverride : (parseFloat(p.MSRP) || parseFloat(p.MAP)) || null;
        const mappedCategory = o.mapping && typeof o.mapping === 'object' && o.mapping.top
          ? { top: o.mapping.top, sub: o.mapping.sub || o.mapping.top }
          : (p.mappedCategory || null);
        const sourceCategory = (mappedCategory && mappedCategory.top) || (p.mappedCategory && p.mappedCategory.top) || null;
        const imageUrl = (o.imageUrl && String(o.imageUrl).trim()) || null;
        const rawImg = (p['Image Location'] || p.image || '').trim();
        const image = imageUrl || p.image || (rawImg ? rawImg.replace(/\?w=\d+&h=\d+/, '?w=500&h=500') : '');
        const fallbackImg = (!image && sku) ? 'https://media.chattanoogashooting.com/images/product/' + sku + '/' + sku + '.jpg?w=500&h=500' : '';
        products.push({
          ...p,
          vendor: 'chattanooga',
          mappedCategory: mappedCategory || p.mappedCategory || null,
          sourceCategory: sourceCategory ? sourceCategory.replace(/_/g, ' ') : null,
          priceOverride: priceOverride,
          hidden,
          forceShow,
          displayPrice,
          image: image || fallbackImg || p.image || p['Image Location'] || '',
          imageOverride: imageUrl,
        });
      });
      return { products, overrides };
    } catch (e) {
      console.warn('Failed to load all-products.json, falling back to mapped-products:', e.message);
    }
  }

  if (!fs.existsSync(MAPPED_DIR)) return { products: [], overrides };
  const files = fs.readdirSync(MAPPED_DIR).filter(f => f.endsWith('.json'));
  for (const file of files) {
    const top = file.replace(/\.json$/, '').replace(/_/g, ' ');
    try {
      const data = JSON.parse(fs.readFileSync(path.join(MAPPED_DIR, file), 'utf8'));
      const list = Array.isArray(data) ? data : (data.products || data.items || []);
      list.forEach(p => {
        const sku = (p.SKU || p.sku || '').toString().trim();
        const o = overrides[sku] || {};
        const hidden = o.hidden === true;
        const forceShow = o.forceShow === true;
        const priceOverride = o.priceOverride != null ? Number(o.priceOverride) : null;
        const displayPrice = priceOverride != null ? priceOverride : (parseFloat(p.MSRP) || parseFloat(p.MAP)) || null;
        const mappedCategory = o.mapping && typeof o.mapping === 'object' && o.mapping.top
          ? { top: o.mapping.top, sub: o.mapping.sub || o.mapping.top }
          : (p.mappedCategory || null);
        const imageUrl = (o.imageUrl && String(o.imageUrl).trim()) || null;
        const rawImg = (p['Image Location'] || p.image || '').trim();
        const image = imageUrl || p.image || (rawImg ? rawImg.replace(/\?w=\d+&h=\d+/, '?w=500&h=500') : '');
        const fallbackImg = (!image && sku) ? 'https://media.chattanoogashooting.com/images/product/' + sku + '/' + sku + '.jpg?w=500&h=500' : '';
        products.push({
          ...p,
          vendor: 'chattanooga',
          mappedCategory: mappedCategory || p.mappedCategory || null,
          sourceCategory: (mappedCategory && mappedCategory.top) ? mappedCategory.top.replace(/_/g, ' ') : top,
          priceOverride: priceOverride,
          hidden,
          forceShow,
          displayPrice,
          image: image || fallbackImg || p.image || p['Image Location'] || '',
          imageOverride: imageUrl,
        });
      });
    } catch (e) {
      console.warn('Skip', file, e.message);
    }
  }

  return { products, overrides };
}

// --- Auth ---
app.post('/api/login', (req, res) => {
  const password = (req.body && req.body.password) != null ? req.body.password : '';
  const submitted = String(password).trim();
  if (submitted !== ADMIN_PASSWORD) {
    console.log('[login] 401 – submitted length:', submitted.length, 'expected length:', ADMIN_PASSWORD.length);
    return res.status(401).json({ error: 'Invalid password' });
  }
  console.log('[login] OK');
  const token = 'admin-' + Date.now() + '-' + Math.random().toString(36).slice(2);
  sessions.add(token);
  res.json({ token });
});

app.post('/api/logout', (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (token) sessions.delete(token);
  res.json({ ok: true });
});

// --- Products: view=listed (default, only what's on live site) or view=chattanooga (full feed) ---
function isListed(p) {
  const hasMapping = p.mappedCategory && p.mappedCategory.top;
  const notHidden = !p.hidden;
  const hasDisplayPrice = p.displayPrice != null && Number(p.displayPrice) > 0;
  return !!(hasMapping && notHidden && hasDisplayPrice);
}

app.get('/api/products', requireAuth, async (req, res) => {
  try {
    const { products } = await loadAllProducts();
    const view = (req.query.view || 'listed').toLowerCase();
    const search = (req.query.search || '').trim().toLowerCase();
    const category = (req.query.category || '').trim();
    let list = products;
    if (view === 'listed') {
      list = list.filter(isListed);
    }
    if (search) {
      list = list.filter(p => {
        const name = (p['Item Name'] || p['Web Item Name'] || '').toLowerCase();
        const sku = (p.SKU || p.sku || '').toString().toLowerCase();
        const mfr = (p.Manufacturer || '').toLowerCase();
        return name.includes(search) || sku.includes(search) || mfr.includes(search);
      });
    }
    if (category) {
      list = list.filter(p => (p.mappedCategory && p.mappedCategory.top === category) || (p.sourceCategory || '').replace(/_/g, ' ') === category);
    }
    res.json({ products: list, total: list.length, view });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
});

// --- Categories list (for filter dropdown); optional view=listed so categories match current tab ---
app.get('/api/categories', requireAuth, async (req, res) => {
  try {
    const { products } = await loadAllProducts();
    const view = (req.query.view || 'listed').toLowerCase();
    let list = products;
    if (view === 'listed') list = list.filter(isListed);
    const set = new Set();
    list.forEach(p => {
      const top = (p.mappedCategory && p.mappedCategory.top) || p.sourceCategory || '';
      if (top) set.add(top.replace(/_/g, ' '));
    });
    res.json({ categories: [...set].sort() });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// --- Mapping options (top/sub from category-mapping for edit dropdown) ---
function getMappingOptions() {
  const options = [];
  const byTop = {};
  const seen = new Set();
  const add = (top, sub) => {
    const s = (sub && String(sub).trim()) || top;
    const key = top + '\0' + s;
    if (seen.has(key)) return;
    seen.add(key);
    options.push({ top, sub: s });
    if (!byTop[top]) byTop[top] = [];
    if (!byTop[top].includes(s)) byTop[top].push(s);
  };

  const mappingPath = path.resolve(ROOT, 'data', 'products', 'category-mapping-template-cleaned.json');
  if (fs.existsSync(mappingPath)) {
    try {
      const mapping = JSON.parse(fs.readFileSync(mappingPath, 'utf8'));
      Object.values(mapping).forEach(entry => {
        if (!entry || typeof entry.top !== 'string') return;
        add(entry.top, entry.sub);
      });
    } catch (e) {
      console.warn('[mapping-options] Error reading mapping file:', e.message);
    }
  }
  // Fallback: use top-level categories from mapped-products folder so dropdown is never empty
  if (options.length === 0 && fs.existsSync(MAPPED_DIR)) {
    const files = fs.readdirSync(MAPPED_DIR).filter(f => f.endsWith('.json'));
    files.forEach(file => {
      const top = file.replace(/\.json$/, '').replace(/_/g, ' ');
      if (top) add(top, top);
    });
  }
  options.sort((a, b) => (a.top !== b.top ? a.top.localeCompare(b.top) : a.sub.localeCompare(b.sub)));
  Object.keys(byTop).sort().forEach(t => { byTop[t].sort(); });
  return { options, byTop };
}

app.get('/api/mapping-options', requireAuth, (req, res) => {
  try {
    const { options, byTop } = getMappingOptions();
    res.json({ options, byTop });
  } catch (e) {
    console.error('[mapping-options]', e);
    res.json({ options: [], byTop: {} });
  }
});

// --- Image proxy (avoids CORS when admin loads CDN images from localhost) ---
const ALLOWED_IMAGE_HOST = 'media.chattanoogashooting.com';
app.get('/api/image-proxy', requireAuth, (req, res) => {
  let raw = (req.query.url || '').trim();
  if (!raw) return res.status(400).send('Missing url');
  if (raw.startsWith('//')) raw = 'https:' + raw;
  const allowed = raw.startsWith('https://' + ALLOWED_IMAGE_HOST + '/') || raw.startsWith('http://' + ALLOWED_IMAGE_HOST + '/');
  if (!allowed) return res.status(400).send('Invalid or disallowed image URL');
  const protocol = raw.startsWith('https:') ? https : http;
  const reqOpts = { headers: { Accept: 'image/*' } };
  protocol.get(raw, reqOpts, (proxyRes) => {
    if (proxyRes.statusCode !== 200) {
      res.status(proxyRes.statusCode).send('Upstream error');
      return;
    }
    const ct = proxyRes.headers['content-type'] || 'image/jpeg';
    res.setHeader('Content-Type', ct);
    res.setHeader('Cache-Control', 'private, max-age=3600');
    proxyRes.pipe(res);
  }).on('error', (err) => {
    res.status(502).send('Proxy error');
  });
});

// --- Overrides ---
app.get('/api/overrides', requireAuth, async (req, res) => {
  try {
    res.json(await db.loadOverrides());
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/overrides', requireAuth, async (req, res) => {
  try {
    const body = req.body || {};
    const sku = String(body.sku || '').trim();
    if (!sku) return res.status(400).json({ error: 'SKU required' });
    const { priceOverride, hidden, forceShow, mapping, imageUrl } = body;
    const overrides = await db.loadOverrides();
    const o = overrides[sku] || {};
    const next = { ...o };
    if (priceOverride !== undefined) next.priceOverride = priceOverride === '' || priceOverride == null ? null : Number(priceOverride);
    if (hidden !== undefined) next.hidden = !!hidden;
    if (forceShow !== undefined) next.forceShow = !!forceShow;
    if (imageUrl !== undefined) {
      const v = (imageUrl == null || imageUrl === '') ? null : String(imageUrl).trim();
      if (!v) delete next.imageUrl;
      else next.imageUrl = v;
    }
    if (mapping !== undefined) {
      if (mapping == null || (typeof mapping === 'object' && !mapping.top)) delete next.mapping;
      else next.mapping = { top: String(mapping.top || '').trim(), sub: String(mapping.sub != null ? mapping.sub : mapping.top || '').trim() };
    }
    await db.saveOverride(sku, next);
    const mappingApplied = !!(next.mapping && next.mapping.top);
    const mappingStr = mappingApplied ? (next.mapping.top + (next.mapping.sub && next.mapping.sub !== next.mapping.top ? ' / ' + next.mapping.sub : '')) : '(none)';
    console.log('[overrides] Saved sku=' + sku + ' mapping=' + mappingStr);
    res.json(next);
  } catch (e) {
    console.error('[overrides] Save error', e);
    res.status(500).json({ error: e.message });
  }
});

// Static files and SPA fallback only after all API routes (so /api/* never serves HTML)
app.use(express.static(path.join(__dirname, 'public'), { index: false }));
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

async function start() {
  if (db.getPool()) {
    const maxAttempts = 3;
    const delayMs = 2000;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        await db.runSchema();
        const ok = await db.testConnection();
        if (ok) {
          console.log('Neon Postgres connected (overrides stored in database).');
          break;
        }
      } catch (e) {
        console.warn('[start] DB attempt ' + attempt + '/' + maxAttempts + ':', e.message);
        if (attempt < maxAttempts) {
          console.log('Retrying in ' + delayMs / 1000 + 's (Neon may be waking from idle)...');
          await new Promise(r => setTimeout(r, delayMs));
        } else {
          console.error('Neon connection failed after ' + maxAttempts + ' attempts. Overrides will not persist until DB is reachable.');
        }
      }
    }
  } else {
    console.log('Using file overrides (data/products/overrides.json). Set DATABASE_URL in .env for Neon.');
  }
  app.listen(PORT, () => {
    console.log('Admin running at http://localhost:' + PORT);
    console.log('Health check: GET http://localhost:' + PORT + '/api/health');
    console.log('Login with ADMIN_PASSWORD from .env');
  });
}

start().catch((err) => {
  console.error('Failed to start:', err);
  process.exit(1);
});
