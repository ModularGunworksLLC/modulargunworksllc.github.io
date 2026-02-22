/**
 * Product API + Admin API on port 3001.
 * Serves products from Neon for the front end and admin dashboard.
 */
require('dotenv').config();
const path = require('path');
const crypto = require('crypto');
const { Readable } = require('stream');
const express = require('express');
const cors = require('cors');
const csv = require('csv-parser');
const { Pool } = require('pg');

require('dotenv').config({ path: path.join(__dirname, '../.env') });

const app = express();
const PORT = process.env.API_PORT || 3001;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin';
const ADMIN_TOKEN = crypto.createHash('sha256').update(ADMIN_PASSWORD + 'mgw').digest('hex');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL && process.env.DATABASE_URL.includes('neon.tech') ? { rejectUnauthorized: true } : false,
});

app.use(cors());
app.use(express.json({ limit: '10mb' }));

function adminAuth(req, res, next) {
  const auth = req.headers.authorization;
  const token = auth && auth.startsWith('Bearer ') ? auth.slice(7) : '';
  if (token !== ADMIN_TOKEN) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
}

function rowToProduct(row) {
  const dp = row.display_price != null ? Number(row.display_price) : 0;
  const salePrice = row.sale_price != null ? Number(row.sale_price) : null;
  const discountPct = row.discount_pct != null ? Number(row.discount_pct) : 0;
  const effectivePrice = salePrice != null ? salePrice : (discountPct > 0 ? dp * (1 - discountPct / 100) : dp);
  return {
    id: row.vendor_sku,
    sku: row.vendor_sku,
    name: row.product_name,
    webName: row.product_name,
    description: row.description,
    price: row.cost,
    msrp: row.msrp != null ? Number(row.msrp) : null,
    map: row.map_price != null ? Number(row.map_price) : null,
    displayPrice: effectivePrice,
    regularPrice: dp,
    upc: row.upc,
    inventory: row.quantity_in_stock ?? 0,
    inStock: (row.quantity_in_stock ?? 0) > 0,
    dropShip: row.fulfillment_type === 'drop_ship',
    category: row.category_slug,
    subcategory: row.type,
    rawCategory: row.type,
    image: row.image_url,
    imageLocation: row.image_url,
    manufacturer: row.brand,
    brand: row.brand,
    manufacturerItemNumber: row.manufacturer_part_number,
    type: row.type,
    caliber: row.caliber,
    bulletType: row.bullet_type,
    grainWeight: row.grain_weight,
    capacity: row.capacity,
    ammoType: row.ammo_type,
    isFirearm: row.is_firearm,
    minFirearmAge: row.min_age,
    sourceCategorySlug: row.category_slug,
    offerId: row.offer_id,
  };
}

app.get('/', (req, res) => {
  res.json({
    ok: true,
    message: 'Modular Gunworks API',
    endpoints: {
      products: '/api/products?category=...&type=...&brand=...&caliber=...&q=...',
      bySku: '/api/products/by-sku?sku=...&category=...',
      filterOptions: '/api/products/filter-options?category=...',
      admin: {
        auth: 'POST /api/admin/auth',
        search: 'GET /api/admin/search',
        filterOptions: 'GET /api/admin/filter-options',
        vendors: 'GET/POST/PATCH /api/admin/vendors',
        'vendors/:id/orders': 'GET /api/admin/vendors/:id/orders?format=csv',
        'vendors/:id/sync': 'POST /api/admin/vendors/:id/sync',
        'data-quality': 'GET /api/admin/data-quality',
        'products/merge': 'POST /api/admin/products/merge',
        'recompute-primary': 'POST /api/admin/recompute-primary',
        activate: 'POST /api/admin/activate',
        'batch-activate': 'POST /api/admin/batch-activate',
        deactivate: 'POST /api/admin/deactivate',
        'import-csv': 'POST /api/admin/import-csv',
        'offers/:sku': 'PATCH /api/admin/offers/:sku',
      },
    },
  });
});

// GET /api/products?category=reloading|sale&type=...&brand=...&caliber=...&minPrice=...&maxPrice=...&inStock=1&q=...
app.get('/api/products', async (req, res) => {
  try {
    const category = (req.query.category || '').trim();
    const type = (req.query.type || '').trim();
    const brand = (req.query.brand || '').trim();
    const caliber = (req.query.caliber || '').trim();
    const minPrice = parseFloat(req.query.minPrice);
    const maxPrice = parseFloat(req.query.maxPrice);
    const inStock = req.query.inStock === '1' || req.query.inStock === 'true';
    const q = (req.query.q || '').trim().toLowerCase();
    const isSale = category === 'sale';

    let sql;
    if (isSale) {
      sql = `
      SELECT o.id AS offer_id, o.vendor_sku, o.cost, o.msrp, o.map_price, o.display_price, o.quantity_in_stock, o.fulfillment_type,
             so.sale_price, so.discount_pct,
             p.id AS product_id, p.name AS product_name, p.description, p.brand, p.image_url, p.type, p.caliber, p.bullet_type, p.grain_weight, p.capacity, p.ammo_type, p.upc, p.manufacturer_part_number, p.is_firearm, p.min_age, c.slug AS category_slug
      FROM offers o
      JOIN sale_offers so ON so.offer_id = o.id
      JOIN products p ON p.id = o.product_id
      JOIN categories c ON c.id = p.category_id
      WHERE o.is_live = TRUE
      `;
    } else {
      sql = `
      SELECT o.id AS offer_id, o.vendor_sku, o.cost, o.msrp, o.map_price, o.display_price, o.quantity_in_stock, o.fulfillment_type,
             p.id AS product_id, p.name AS product_name, p.description, p.brand, p.image_url, p.type, p.caliber, p.bullet_type, p.grain_weight, p.capacity, p.ammo_type, p.upc, p.manufacturer_part_number, p.is_firearm, p.min_age, c.slug AS category_slug
      FROM offers o
      JOIN products p ON p.id = o.product_id
      JOIN categories c ON c.id = p.category_id
      WHERE o.is_live = TRUE AND (o.is_primary = TRUE OR NOT EXISTS (SELECT 1 FROM offers o2 WHERE o2.product_id = o.product_id AND o2.is_primary = TRUE AND o2.is_live = TRUE))
      `;
    }
    const params = [];
    let n = 0;

    if (category && !isSale) {
      n++;
      sql += ` AND c.slug = $${n}`;
      params.push(category);
    }
    if (type) {
      n++;
      sql += ` AND p.type = $${n}`;
      params.push(type);
    }
    if (brand) {
      n++;
      sql += ` AND p.brand = $${n}`;
      params.push(brand);
    }
    if (caliber) {
      n++;
      sql += ` AND (p.caliber = $${n} OR p.caliber ILIKE $${n + 1})`;
      params.push(caliber, '%' + caliber + '%');
      n++;
    }
    if (Number.isFinite(minPrice) && minPrice >= 0) {
      n++;
      sql += ` AND o.display_price >= $${n}`;
      params.push(minPrice);
    }
    if (Number.isFinite(maxPrice) && maxPrice >= 0) {
      n++;
      sql += ` AND o.display_price <= $${n}`;
      params.push(maxPrice);
    }
    if (inStock) {
      sql += ` AND o.quantity_in_stock > 0`;
    }
    if (q) {
      n++;
      sql += ` AND (p.name ILIKE $${n} OR p.description ILIKE $${n} OR p.brand ILIKE $${n} OR o.vendor_sku ILIKE $${n})`;
      params.push('%' + q + '%');
    }

    sql += ` ORDER BY p.brand, p.name`;

    const result = await pool.query(sql, params);
    const rows = result.rows;
    const withCategory = rows.map((r) => ({ ...r, category_slug: category || null }));
    const products = withCategory.map(rowToProduct);

    res.json(products);
  } catch (err) {
    console.error('GET /api/products', err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/products/by-sku?sku=...&category=... (for PDP)
app.get('/api/products/by-sku', async (req, res) => {
  try {
    const sku = (req.query.sku || '').trim();
    const category = (req.query.category || '').trim();
    if (!sku) {
      return res.status(400).json({ error: 'sku required' });
    }

    let sql = `
      SELECT o.id AS offer_id, o.vendor_sku, o.cost, o.msrp, o.map_price, o.display_price, o.quantity_in_stock, o.fulfillment_type,
             so.sale_price, so.discount_pct,
             p.id AS product_id, p.name AS product_name, p.description, p.brand, p.image_url, p.type, p.caliber, p.upc, p.manufacturer_part_number, p.is_firearm, p.min_age, c.slug AS category_slug
      FROM offers o
      JOIN products p ON p.id = o.product_id
      JOIN categories c ON c.id = p.category_id
      LEFT JOIN sale_offers so ON so.offer_id = o.id
      WHERE o.is_live = TRUE AND o.vendor_sku = $1
    `;
    const params = [sku];
    if (category) {
      params.push(category);
      sql += ` AND c.slug = $2`;
    }
    sql += ` LIMIT 1`;

    const result = await pool.query(sql, params);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }
    const row = result.rows[0];
    const product = rowToProduct({ ...row, category_slug: row.category_slug });
    res.json(product);
  } catch (err) {
    console.error('GET /api/products/by-sku', err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/products/filter-options?category=reloading
app.get('/api/products/filter-options', async (req, res) => {
  try {
    const category = (req.query.category || '').trim();

    let where = 'o.is_live = TRUE';
    const params = [];
    if (category) {
      params.push(category);
      where += ` AND c.slug = $1`;
    }

    const baseSql = `
      FROM offers o
      JOIN products p ON p.id = o.product_id
      JOIN categories c ON c.id = p.category_id
      WHERE ${where}
    `;

    const [categories, types, brands, calibers] = await Promise.all([
      pool.query(`SELECT DISTINCT c.slug, c.name ${baseSql} ORDER BY c.name`, params),
      pool.query(`SELECT DISTINCT p.type ${baseSql} AND p.type IS NOT NULL AND p.type != '' ORDER BY p.type`, params.slice()),
      pool.query(`SELECT DISTINCT p.brand ${baseSql} AND p.brand IS NOT NULL AND p.brand != '' ORDER BY p.brand`, params.slice()),
      pool.query(`SELECT DISTINCT p.caliber ${baseSql} AND p.caliber IS NOT NULL AND p.caliber != '' ORDER BY p.caliber`, params.slice()),
    ]);

    res.json({
      categories: categories.rows.map((r) => r.slug),
      types: types.rows.map((r) => r.type).filter(Boolean),
      brands: brands.rows.map((r) => r.brand).filter(Boolean),
      calibers: calibers.rows.map((r) => r.caliber).filter(Boolean),
    });
  } catch (err) {
    console.error('GET /api/products/filter-options', err);
    res.status(500).json({ error: err.message });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  pool.query('SELECT 1').then(() => res.json({ ok: true })).catch((e) => res.status(500).json({ ok: false, error: e.message }));
});

// --- Admin API (all under /api/admin, auth required except auth) ---

app.post('/api/admin/auth', (req, res) => {
  const password = (req.body && req.body.password) || '';
  if (password === ADMIN_PASSWORD) {
    return res.json({ token: ADMIN_TOKEN });
  }
  res.status(401).json({ error: 'Invalid password' });
});

app.get('/api/admin/search', adminAuth, async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit, 10) || 5000, 10000);
    const offset = parseInt(req.query.offset, 10) || 0;
    const category = (req.query.category || '').trim();
    const brand = (req.query.brand || '').trim();
    const q = (req.query.q || '').trim().toLowerCase();
    const inStock = req.query.inStock === '1' || req.query.inStock === 'true';
    const outOfStockOnly = req.query.stock === 'out-of-stock';
    const caliber = (req.query.caliber || '').trim();
    const type = (req.query.type || req.query.platform || '').trim();
    const capacity = (req.query.capacity || '').trim();
    const minPrice = parseFloat(req.query.minPrice);
    const maxPrice = parseFloat(req.query.maxPrice);
    const serializedOnly = req.query.serialized === '1' || req.query.serialized === 'true';
    const dropShipOnly = req.query.dropShip === '1' || req.query.dropShip === 'true';

    let sql;
    const params = [];
    let n = 0;

    if (category === 'sale') {
      sql = `
      SELECT o.id AS offer_id, o.vendor_sku, o.cost, o.msrp, o.map_price, o.display_price, o.quantity_in_stock, o.fulfillment_type, c.slug AS category_slug,
             p.id AS product_id, p.name AS product_name, p.description, p.brand, p.image_url, p.type, p.caliber, p.capacity, p.upc, p.manufacturer_part_number, p.is_firearm, p.min_age
      FROM sale_offers so
      JOIN offers o ON o.id = so.offer_id
      JOIN products p ON p.id = o.product_id
      JOIN categories c ON c.id = p.category_id
      WHERE o.is_live = TRUE
      `;
    } else {
      sql = `
      SELECT o.id AS offer_id, o.vendor_sku, o.cost, o.msrp, o.map_price, o.display_price, o.quantity_in_stock, o.fulfillment_type, c.slug AS category_slug,
             p.id AS product_id, p.name AS product_name, p.description, p.brand, p.image_url, p.type, p.caliber, p.capacity, p.upc, p.manufacturer_part_number, p.is_firearm, p.min_age
      FROM offers o
      JOIN products p ON p.id = o.product_id
      JOIN categories c ON c.id = p.category_id
      WHERE o.is_live = TRUE
      `;
    }
    if (category && category !== 'sale') {
      n++;
      sql += ` AND c.slug = $${n}`;
      params.push(category);
    }
    if (brand) {
      n++;
      sql += ` AND p.brand = $${n}`;
      params.push(brand);
    }
    if (inStock) {
      sql += ` AND o.quantity_in_stock > 0`;
    }
    if (outOfStockOnly) {
      sql += ` AND o.quantity_in_stock = 0`;
    }
    if (caliber) {
      n++;
      sql += ` AND p.caliber = $${n}`;
      params.push(caliber);
    }
    if (type) {
      n++;
      sql += ` AND p.type = $${n}`;
      params.push(type);
    }
    if (capacity) {
      n++;
      sql += ` AND p.capacity = $${n}`;
      params.push(capacity);
    }
    if (Number.isFinite(minPrice) && minPrice > 0) {
      n++;
      sql += ` AND o.display_price >= $${n}`;
      params.push(minPrice);
    }
    if (Number.isFinite(maxPrice) && maxPrice > 0) {
      n++;
      sql += ` AND o.display_price <= $${n}`;
      params.push(maxPrice);
    }
    if (serializedOnly) {
      sql += ` AND p.is_firearm = TRUE`;
    }
    if (dropShipOnly) {
      sql += ` AND o.fulfillment_type = 'drop_ship'`;
    }
    if (q) {
      n++;
      sql += ` AND (p.name ILIKE $${n} OR p.brand ILIKE $${n} OR o.vendor_sku ILIKE $${n})`;
      params.push('%' + q + '%');
    }
    sql += ` ORDER BY o.quantity_in_stock DESC NULLS LAST, p.name LIMIT $${n + 1} OFFSET $${n + 2}`;
    params.push(limit, offset);

    const result = await pool.query(sql, params);
    const products = result.rows.map((r) => rowToProduct(r));
    res.json({ products });
  } catch (err) {
    console.error('GET /api/admin/search', err);
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/admin/filter-options', adminAuth, async (req, res) => {
  try {
    const [result, catCounts, saleCount, capRes, priceRes] = await Promise.all([
      pool.query(`
        SELECT DISTINCT c.slug AS categories, p.type AS types, p.brand AS brands, p.caliber AS calibers
        FROM offers o
        JOIN products p ON p.id = o.product_id
        JOIN categories c ON c.id = p.category_id
        WHERE o.is_live = TRUE
      `),
      pool.query(`
        SELECT c.slug, c.name, COUNT(*)::int AS count
        FROM offers o
        JOIN products p ON p.id = o.product_id
        JOIN categories c ON c.id = p.category_id
        WHERE o.is_live = TRUE
        GROUP BY c.slug, c.name, c.sort_order
        ORDER BY c.sort_order, c.name
      `),
      pool.query(`SELECT COUNT(*)::int FROM sale_offers`),
      pool.query(`
        SELECT DISTINCT p.capacity FROM offers o
        JOIN products p ON p.id = o.product_id
        WHERE o.is_live = TRUE AND p.capacity IS NOT NULL AND p.capacity != ''
        ORDER BY p.capacity
      `),
      pool.query(`SELECT MIN(o.display_price)::numeric as min, MAX(o.display_price)::numeric as max FROM offers o WHERE o.is_live = TRUE`)
    ]);
    const categories = [...new Set(result.rows.map((r) => r.categories).filter(Boolean))].sort();
    if (!categories.includes('sale')) categories.push('sale');
    categories.sort();
    const types = [...new Set(result.rows.map((r) => r.types).filter(Boolean))].sort();
    const brands = [...new Set(result.rows.map((r) => r.brands).filter(Boolean))].sort();
    const calibers = [...new Set(result.rows.map((r) => r.calibers).filter(Boolean))].sort();
    const capacities = capRes.rows.map((r) => String(r.capacity).trim()).filter(Boolean);
    const priceMin = Number(priceRes.rows[0]?.min) || 0;
    const priceMax = Number(priceRes.rows[0]?.max) || 1000;
    const byCategory = {};
    catCounts.rows.forEach((r) => { byCategory[r.slug] = { name: r.name, count: r.count }; });
    res.json({
      categories,
      types,
      brands,
      calibers,
      platforms: types,
      capacities,
      materials: [],
      priceRange: { min: priceMin, max: Math.ceil(priceMax) || 1000 },
      liveOverview: { byCategory, saleCount: saleCount.rows[0]?.count || 0 }
    });
  } catch (err) {
    console.error('GET /api/admin/filter-options', err);
    res.status(500).json({ error: err.message });
  }
});

// Live overview: counts per category of what's on the site (master hub view)
app.get('/api/admin/live-overview', adminAuth, async (req, res) => {
  try {
    const [catCounts, saleCount, vendors] = await Promise.all([
      pool.query(`
        SELECT c.slug, c.name, COUNT(*)::int AS count
        FROM offers o
        JOIN products p ON p.id = o.product_id
        JOIN categories c ON c.id = p.category_id
        WHERE o.is_live = TRUE
        GROUP BY c.slug, c.name, c.sort_order
        ORDER BY c.sort_order, c.name
      `),
      pool.query(`SELECT COUNT(*)::int FROM sale_offers`),
      pool.query(`SELECT id, name, type FROM vendors ORDER BY name`)
    ]);
    const byCategory = {};
    catCounts.rows.forEach((r) => { byCategory[r.slug] = { name: r.name, count: r.count }; });
    res.json({
      byCategory,
      saleCount: saleCount.rows[0]?.count || 0,
      vendors: vendors.rows
    });
  } catch (err) {
    console.error('GET /api/admin/live-overview', err);
    res.status(500).json({ error: err.message });
  }
});

// Update offer: category, cost, MSRP, MAP, is_live
app.patch('/api/admin/offers/:sku', adminAuth, async (req, res) => {
  try {
    const sku = decodeURIComponent(req.params.sku || '');
    if (!sku) return res.status(400).json({ error: 'sku required' });
    const { category: catSlug, cost, msrp, map, isLive } = req.body || {};

    const offerRes = await pool.query(
      `SELECT o.id, o.product_id FROM offers o WHERE o.vendor_sku = $1 LIMIT 1`,
      [sku]
    );
    if (offerRes.rows.length === 0) return res.status(404).json({ error: 'Offer not found' });
    const { id: offerId, product_id: productId } = offerRes.rows[0];

    if (catSlug !== undefined && String(catSlug).trim()) {
      const catRes = await pool.query('SELECT id FROM categories WHERE slug = $1', [catSlug.trim()]);
      if (catRes.rows.length === 0) return res.status(400).json({ error: 'Invalid category' });
      await pool.query('UPDATE products SET category_id = $1, updated_at = NOW() WHERE id = $2', [catRes.rows[0].id, productId]);
    }

    const offerUpdates = [];
    const offerParams = [offerId];
    let pn = 1;
    if (cost !== undefined) { offerUpdates.push(`cost = $${++pn}`); offerParams.push(cost == null ? 0 : parseFloat(cost)); }
    if (msrp !== undefined) { offerUpdates.push(`msrp = $${++pn}`); offerParams.push(msrp == null ? null : parseFloat(msrp)); }
    if (map !== undefined) { offerUpdates.push(`map_price = $${++pn}`); offerParams.push(map == null ? null : parseFloat(map)); }
    if (isLive !== undefined) { offerUpdates.push(`is_live = $${++pn}`); offerParams.push(!!isLive); }
    if (msrp !== undefined || map !== undefined) {
      offerUpdates.push(`display_price = COALESCE(msrp, map_price, cost)`);
    }
    if (offerUpdates.length) {
      offerUpdates.push(`updated_at = NOW()`);
      await pool.query(`UPDATE offers SET ${offerUpdates.join(', ')} WHERE id = $1`, offerParams);
    }
    await recomputePrimaryOffers(pool);
    res.json({ success: true });
  } catch (err) {
    console.error('PATCH /api/admin/offers/:sku', err);
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/admin/vendors', adminAuth, async (req, res) => {
  try {
    const result = await pool.query('SELECT id, name, type, config, created_at FROM vendors ORDER BY name');
    res.json(result.rows);
  } catch (err) {
    console.error('GET /api/admin/vendors', err);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/admin/vendors', adminAuth, async (req, res) => {
  try {
    const { name, type = 'csv', config = {} } = req.body || {};
    if (!name || !String(name).trim()) return res.status(400).json({ error: 'name required' });
    const result = await pool.query(
      'INSERT INTO vendors (name, type, config) VALUES ($1, $2, $3) RETURNING id, name, type',
      [String(name).trim(), type, JSON.stringify(config)]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('POST /api/admin/vendors', err);
    res.status(500).json({ error: err.message });
  }
});

app.patch('/api/admin/vendors/:id', adminAuth, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (!Number.isFinite(id)) return res.status(400).json({ error: 'invalid id' });
    const { name, type, config } = req.body || {};
    const updates = [];
    const values = [];
    let i = 1;
    if (name !== undefined) {
      if (!String(name).trim()) return res.status(400).json({ error: 'name required' });
      updates.push(`name = $${i++}`);
      values.push(String(name).trim());
    }
    if (type !== undefined) {
      updates.push(`type = $${i++}`);
      values.push(type);
    }
    if (config !== undefined) {
      updates.push(`config = $${i++}`);
      values.push(JSON.stringify(config));
    }
    updates.push(`updated_at = NOW()`);
    values.push(id);
    const result = await pool.query(
      `UPDATE vendors SET ${updates.join(', ')} WHERE id = $${i} RETURNING id, name, type`,
      values
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'vendor not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('PATCH /api/admin/vendors/:id', err);
    res.status(500).json({ error: err.message });
  }
});

// Min margin (e.g. 10%) for offer selection and pricing
const MIN_MARGIN_PCT = parseFloat(process.env.MIN_MARGIN_PCT || '10');

// Fallback category mapping when category_mappings table has no entry
const VENDOR_CAT_TO_SLUG = {
  ammunition: 'ammunition',
  magazines: 'magazines',
  firearms: 'guns',
  guns: 'guns',
  'gun parts': 'gun-parts',
  'chassis & stocks': 'gun-parts',
  'chassis and stocks': 'gun-parts',
  optics: 'optics',
  reloading: 'reloading',
  gear: 'gear',
  outdoors: 'outdoors',
  knives: 'outdoors',
  clothing: 'gear',
  footwear: 'gear',
  'clothing & footwear': 'gear',
};

// Build category map for vendor (category_mappings + fallback)
async function buildCategoryMap(pool, vendorId) {
  const rows = await pool.query(
    'SELECT LOWER(TRIM(their_value)) AS k, c.slug FROM category_mappings cm JOIN categories c ON c.id = cm.our_category_id WHERE vendor_id = $1',
    [vendorId]
  );
  const map = {};
  rows.rows.forEach((r) => { map[r.k] = r.slug; });
  return (vendorCategory) => {
    const key = String(vendorCategory || '').trim().toLowerCase();
    if (!key) return 'gear';
    return map[key] || VENDOR_CAT_TO_SLUG[key] || VENDOR_CAT_TO_SLUG[key.replace(/[^a-z0-9\s&]/g, '')] || 'gear';
  };
}

// Find existing product by UPC or MPN+brand (for cross-vendor dedup)
async function findExistingProduct(pool, upc, mpn, brand) {
  if (upc && String(upc).replace(/\s/g, '').length >= 6) {
    const u = String(upc).replace(/\s/g, '').trim();
    const byUpc = await pool.query('SELECT id FROM products WHERE upc IS NOT NULL AND LENGTH(TRIM(upc)) >= 6 AND REPLACE(TRIM(upc), \' \', \'\') = $1 LIMIT 1', [u]);
    if (byUpc.rows.length) return byUpc.rows[0].id;
  }
  if (mpn && brand) {
    const byMpn = await pool.query('SELECT id FROM products WHERE manufacturer_part_number = $1 AND brand IS NOT NULL AND LOWER(TRIM(brand)) = LOWER(TRIM($2)) LIMIT 1', [String(mpn).trim(), String(brand).trim()]);
    if (byMpn.rows.length) return byMpn.rows[0].id;
  }
  return null;
}

// Recompute which offer is primary per product: lowest display_price with margin >= min, prefer in-stock
async function recomputePrimaryOffers(pool) {
  const minMargin = MIN_MARGIN_PCT / 100;
  await pool.query(`
    WITH ranked AS (
      SELECT o.id, o.product_id,
        ROW_NUMBER() OVER (PARTITION BY o.product_id ORDER BY
          CASE WHEN o.quantity_in_stock > 0 THEN 0 ELSE 1 END,
          o.display_price ASC
        ) AS rn
      FROM offers o
      WHERE o.is_live = TRUE
    )
    UPDATE offers SET is_primary = (id IN (SELECT id FROM ranked WHERE rn = 1))
  `);
}

function mapCategoryToSlug(v) {
  if (!v || typeof v !== 'string') return 'gear';
  const key = String(v).trim().toLowerCase();
  return VENDOR_CAT_TO_SLUG[key] || VENDOR_CAT_TO_SLUG[key.replace(/[^a-z0-9\s&]/g, '')] || 'gear';
}

function toNum(v) {
  if (v === undefined || v === null || v === '') return null;
  const n = Number(String(v).trim());
  return Number.isFinite(n) ? n : null;
}

function priceOrNull(v) {
  if (v == null || v === '') return null;
  const s = String(v).trim().toLowerCase();
  if (s === 'custom' || s === 'call' || s === 'quote') return null;
  const n = toNum(v);
  return n != null && n > 0 ? n : null;
}

function displayPriceFromRow(row) {
  const msrp = priceOrNull(row.MSRP ?? row.msrp);
  const map = priceOrNull(row.MAP ?? row.map);
  return msrp ?? map ?? null;
}

app.post('/api/admin/import-csv', adminAuth, async (req, res) => {
  try {
    const { vendorId, csv: csvText } = req.body || {};
    if (!vendorId || !csvText || typeof csvText !== 'string') {
      return res.status(400).json({ error: 'vendorId and csv required' });
    }
    const vendorCheck = await pool.query('SELECT id FROM vendors WHERE id = $1', [vendorId]);
    if (vendorCheck.rows.length === 0) return res.status(404).json({ error: 'Vendor not found' });

    const rows = await new Promise((resolve, reject) => {
      const out = [];
      Readable.from([csvText])
        .pipe(csv())
        .on('data', (row) => out.push(row))
        .on('end', () => resolve(out))
        .on('error', reject);
    });

    const catRows = await pool.query('SELECT id, slug FROM categories');
    const slugToCatId = {};
    catRows.rows.forEach((r) => { slugToCatId[r.slug] = r.id; });
    const categoryMap = await buildCategoryMap(pool, vendorId);

    let imported = 0;
    let merged = 0;
    const BATCH = 500;

    for (let i = 0; i < rows.length; i += BATCH) {
      const batch = rows.slice(i, i + BATCH);
      for (const row of batch) {
        const sku = (row.SKU ?? row.sku ?? '').toString().trim();
        if (!sku) continue;
        const dp = displayPriceFromRow(row);
        if (dp == null || dp <= 0) continue;

        const catSlug = categoryMap(row.Category ?? row.category ?? '');
        const categoryId = slugToCatId[catSlug] || slugToCatId.gear;
        const name = (row['Item Name'] ?? row['Web Item Name'] ?? row.name ?? '').toString().trim();
        const description = (row['Web Item Description'] ?? row.description ?? '').toString().trim();
        const brand = (row.Manufacturer ?? row.manufacturer ?? '').toString().trim();
        const imageUrl = (row['Image Location'] ?? row.image ?? '').toString().trim();
        const upc = (row.UPC ?? row.upc ?? '').toString().trim() || null;
        const mpn = (row['Manufacturer Item Number'] ?? row['Manufacturer Part Number'] ?? '').toString().trim() || null;
        const cost = toNum(row.Price ?? row.price) ?? 0;
        const msrp = priceOrNull(row.MSRP ?? row.msrp);
        const mapPrice = priceOrNull(row.MAP ?? row.map);
        const qty = toNum(row['Quantity In Stock'] ?? row.quantity ?? row.qty) ?? 0;
        const dropShip = String(row['Drop Ship Flag'] ?? row['Dropship'] ?? '').trim() === '1';
        const fulfillmentType = dropShip ? 'drop_ship' : 'order_then_ship';
        const sub = (row.Category ?? row.type ?? row.subcategory ?? '').toString().trim() || null;
        const isFirearm = (row.Category ?? row.type ?? '').toString().toLowerCase().includes('firearm');
        const minAge = isFirearm ? 21 : null;

        const existingOffer = await pool.query(
          'SELECT id, product_id FROM offers WHERE vendor_id = $1 AND vendor_sku = $2',
          [vendorId, sku]
        );

        if (existingOffer.rows.length) {
          await pool.query(
            `UPDATE products SET name = $1, description = $2, category_id = $3, brand = $4, image_url = COALESCE(NULLIF(TRIM($5),''), image_url), type = $6, upc = COALESCE($7, upc), manufacturer_part_number = COALESCE($8, manufacturer_part_number), is_firearm = $9, min_age = $10, updated_at = NOW() WHERE id = $11`,
            [name, description || null, categoryId, brand || null, imageUrl || null, sub, upc, mpn, isFirearm, minAge, existingOffer.rows[0].product_id]
          );
          await pool.query(
            `UPDATE offers SET cost = $1, msrp = $2, map_price = $3, display_price = $4, quantity_in_stock = $5, fulfillment_type = $6, updated_at = NOW() WHERE id = $7`,
            [cost, msrp, mapPrice, dp, qty, fulfillmentType, existingOffer.rows[0].id]
          );
        } else {
          let productId = await findExistingProduct(pool, upc, mpn, brand);
          if (productId) {
            merged++;
            await pool.query(
              `UPDATE products SET name = $1, description = COALESCE($2, description), category_id = $3, brand = COALESCE($4, brand), image_url = COALESCE(NULLIF(TRIM($5),''), image_url), type = COALESCE($6, type), upc = COALESCE($7, upc), manufacturer_part_number = COALESCE($8, manufacturer_part_number), is_firearm = COALESCE($9, is_firearm), min_age = COALESCE($10, min_age), updated_at = NOW() WHERE id = $11`,
              [name, description || null, categoryId, brand || null, imageUrl || null, sub, upc, mpn, isFirearm, minAge, productId]
            );
          } else {
            const prod = await pool.query(
              `INSERT INTO products (name, description, category_id, brand, image_url, type, upc, manufacturer_part_number, is_firearm, min_age)
               VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING id`,
              [name, description || null, categoryId, brand || null, imageUrl || null, sub, upc, mpn, isFirearm, minAge]
            );
            productId = prod.rows[0].id;
          }
          await pool.query(
            `INSERT INTO offers (product_id, vendor_id, vendor_sku, cost, msrp, map_price, display_price, quantity_in_stock, fulfillment_type, is_primary, is_live)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, FALSE, TRUE)
             ON CONFLICT (vendor_id, vendor_sku) DO UPDATE SET cost = $4, msrp = $5, map_price = $6, display_price = $7, quantity_in_stock = $8, fulfillment_type = $9, updated_at = NOW()`,
            [productId, vendorId, sku, cost, msrp, mapPrice, dp, qty, fulfillmentType]
          );
        }
        imported++;
      }
    }

    await recomputePrimaryOffers(pool);
    res.json({ success: true, imported, merged });
  } catch (err) {
    console.error('POST /api/admin/import-csv', err);
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/admin/active', adminAuth, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT so.offer_id, o.vendor_sku, c.slug AS category_slug
      FROM sale_offers so
      JOIN offers o ON o.id = so.offer_id
      JOIN products p ON p.id = o.product_id
      JOIN categories c ON c.id = p.category_id
    `);
    const active = {};
    result.rows.forEach((r) => {
      active[r.vendor_sku] = { page: r.category_slug };
    });
    res.json(active);
  } catch (err) {
    console.error('GET /api/admin/active', err);
    res.status(500).json({});
  }
});

app.post('/api/admin/activate', adminAuth, async (req, res) => {
  try {
    const sku = (req.body && (req.body.sku || req.body.productId)) || '';
    const catSlugParam = (req.body && (req.body.category || req.body.page)) || '';
    const salePrice = req.body && req.body.salePrice != null ? parseFloat(req.body.salePrice) : null;
    const discountPct = req.body && req.body.discountPct != null ? parseInt(req.body.discountPct, 10) : null;
    if (!sku) return res.status(400).json({ error: 'sku required' });
    const catSlug = (catSlugParam || '').trim() || 'sale';
    const offer = await pool.query(
      `SELECT o.id FROM offers o JOIN products p ON p.id = o.product_id JOIN categories c ON c.id = p.category_id WHERE o.vendor_sku = $1 AND o.is_live = TRUE ${catSlug ? 'AND c.slug = $2' : ''} LIMIT 1`,
      catSlug ? [sku, catSlug] : [sku]
    );
    if (offer.rows.length === 0) return res.status(404).json({ error: 'Offer not found' });
    const offerId = offer.rows[0].id;
    if (salePrice != null && !isNaN(salePrice)) {
      await pool.query('INSERT INTO sale_offers (offer_id, discount_pct, sale_price) VALUES ($1, 0, $2) ON CONFLICT (offer_id) DO UPDATE SET sale_price = $2', [offerId, salePrice]);
    } else if (discountPct != null && !isNaN(discountPct)) {
      await pool.query('INSERT INTO sale_offers (offer_id, discount_pct) VALUES ($1, $2) ON CONFLICT (offer_id) DO UPDATE SET discount_pct = $2', [offerId, discountPct]);
    } else {
      await pool.query('INSERT INTO sale_offers (offer_id, discount_pct) VALUES ($1, 0) ON CONFLICT (offer_id) DO NOTHING', [offerId]);
    }
    res.json({ success: true });
  } catch (err) {
    console.error('POST /api/admin/activate', err);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/admin/deactivate', adminAuth, async (req, res) => {
  try {
    const sku = (req.body && (req.body.sku || req.body.productId)) || '';
    if (!sku) return res.status(400).json({ error: 'sku required' });
    await pool.query('DELETE FROM sale_offers WHERE offer_id IN (SELECT id FROM offers WHERE vendor_sku = $1)', [sku]);
    res.json({ success: true });
  } catch (err) {
    console.error('POST /api/admin/deactivate', err);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/admin/batch-activate', adminAuth, async (req, res) => {
  try {
    const list = Array.isArray(req.body?.skus) ? req.body.skus
      : Array.isArray(req.body?.productIds) ? req.body.productIds : [];
    const catSlugParam = (req.body && (req.body.category || req.body.page)) || '';
    const catSlug = (catSlugParam || '').trim() || 'sale';
    const salePrice = req.body && req.body.salePrice != null ? parseFloat(req.body.salePrice) : null;
    let count = 0;
    for (const sku of list) {
      const offer = await pool.query(
        `SELECT o.id FROM offers o JOIN products p ON p.id = o.product_id JOIN categories c ON c.id = p.category_id WHERE o.vendor_sku = $1 AND o.is_live = TRUE ${catSlug ? 'AND c.slug = $2' : ''} LIMIT 1`,
        catSlug ? [sku, catSlug] : [sku]
      );
      if (offer.rows.length) {
        if (salePrice != null && !isNaN(salePrice)) {
          await pool.query('INSERT INTO sale_offers (offer_id, discount_pct, sale_price) VALUES ($1, 0, $2) ON CONFLICT (offer_id) DO UPDATE SET sale_price = $2', [offer.rows[0].id, salePrice]);
        } else {
          await pool.query('INSERT INTO sale_offers (offer_id, discount_pct) VALUES ($1, 0) ON CONFLICT (offer_id) DO NOTHING', [offer.rows[0].id]);
        }
        count++;
      }
    }
    res.json({ success: true, count });
  } catch (err) {
    console.error('POST /api/admin/batch-activate', err);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/admin/sync', adminAuth, (req, res) => {
  res.json({ success: true, message: 'Run node scripts/db/import-from-json.js to sync from JSON' });
});

// Data quality report
app.get('/api/admin/data-quality', adminAuth, async (req, res) => {
  try {
    const [missingImage, missingCost, noStock, duplicates] = await Promise.all([
      pool.query(`SELECT COUNT(*)::int FROM products p JOIN offers o ON o.product_id = p.id WHERE (p.image_url IS NULL OR TRIM(p.image_url) = '') AND o.is_live = TRUE`),
      pool.query(`SELECT COUNT(*)::int FROM offers WHERE is_live = TRUE AND (cost IS NULL OR cost = 0)`),
      pool.query(`SELECT COUNT(*)::int FROM offers o WHERE o.is_primary = TRUE AND o.is_live = TRUE AND o.quantity_in_stock = 0`),
      pool.query(`SELECT COUNT(*)::int FROM (SELECT upc, COUNT(*) c FROM products WHERE upc IS NOT NULL AND TRIM(upc) != '' GROUP BY upc HAVING COUNT(*) > 1) x`),
    ]);
    res.json({
      missingImage: missingImage.rows[0].count,
      missingCost: missingCost.rows[0].count,
      noStock: noStock.rows[0].count,
      duplicateUpc: duplicates.rows[0].count,
    });
  } catch (err) {
    console.error('GET /api/admin/data-quality', err);
    res.status(500).json({ error: err.message });
  }
});

// Merge product (move all offers from source to target, delete source)
app.post('/api/admin/products/merge', adminAuth, async (req, res) => {
  try {
    const { sourceProductId, targetProductId } = req.body || {};
    if (!sourceProductId || !targetProductId || sourceProductId === targetProductId) {
      return res.status(400).json({ error: 'sourceProductId and targetProductId required, must differ' });
    }
    const src = parseInt(sourceProductId, 10);
    const tgt = parseInt(targetProductId, 10);
    if (!Number.isFinite(src) || !Number.isFinite(tgt)) return res.status(400).json({ error: 'invalid ids' });

    const prodCheck = await pool.query('SELECT id FROM products WHERE id = $1 OR id = $2', [src, tgt]);
    if (prodCheck.rows.length !== 2) return res.status(404).json({ error: 'One or both products not found' });

    await pool.query('UPDATE offers SET product_id = $1 WHERE product_id = $2', [tgt, src]);
    await pool.query('DELETE FROM products WHERE id = $1', [src]);
    await recomputePrimaryOffers(pool);
    res.json({ success: true });
  } catch (err) {
    console.error('POST /api/admin/products/merge', err);
    res.status(500).json({ error: err.message });
  }
});

// Recompute primary offers (admin-triggerable)
app.post('/api/admin/recompute-primary', adminAuth, async (req, res) => {
  try {
    await recomputePrimaryOffers(pool);
    res.json({ success: true });
  } catch (err) {
    console.error('POST /api/admin/recompute-primary', err);
    res.status(500).json({ error: err.message });
  }
});

// Vendor sync (placeholder - implement per-vendor connector)
app.post('/api/admin/vendors/:id/sync', adminAuth, async (req, res) => {
  try {
    const vendorId = parseInt(req.params.id, 10);
    const vendor = await pool.query('SELECT id, name, type, config FROM vendors WHERE id = $1', [vendorId]);
    if (vendor.rows.length === 0) return res.status(404).json({ error: 'Vendor not found' });
    const v = vendor.rows[0];
    if (v.type !== 'api') return res.status(400).json({ error: 'Vendor is not API type; use CSV import' });
    const cfg = v.config || {};
    if (!cfg.apiUrl || !cfg.apiKey) return res.status(400).json({ error: 'Vendor missing apiUrl or apiKey in config' });
    res.status(501).json({ error: 'Vendor API sync not yet implemented for this connector. Add connector in scripts/api-server.js' });
  } catch (err) {
    console.error('POST /api/admin/vendors/:id/sync', err);
    res.status(500).json({ error: err.message });
  }
});

// Vendor order export (orders that need fulfillment by this vendor)
app.get('/api/admin/vendors/:id/orders', adminAuth, async (req, res) => {
  try {
    const vendorId = parseInt(req.params.id, 10);
    if (!Number.isFinite(vendorId)) return res.status(400).json({ error: 'invalid vendor id' });
    const result = await pool.query(`
      SELECT ord.order_id, ol.product_name, ol.quantity, ol.unit_price, ol.total, off.vendor_sku, ord.status, ord.buyer_email
      FROM order_lines ol
      JOIN offers off ON off.id = ol.offer_id
      JOIN orders ord ON ord.id = ol.order_id
      WHERE off.vendor_id = $1 AND ol.offer_id IS NOT NULL AND ord.status != 'Shipped'
      ORDER BY ord.created_at DESC
    `, [vendorId]);
    if (req.query.format === 'csv') {
      const header = 'order_id,product_name,quantity,unit_price,total,vendor_sku,status,buyer_email';
      const rows = result.rows.map((r) => [r.order_id, `"${(r.product_name || '').replace(/"/g, '""')}"`, r.quantity, r.unit_price, r.total, r.vendor_sku, r.status, r.buyer_email].join(','));
      res.type('text/csv').send([header, ...rows].join('\n'));
      return;
    }
    res.json(result.rows);
  } catch (err) {
    console.error('GET /api/admin/vendors/:id/orders', err);
    res.status(500).json({ error: err.message });
  }
});

async function start() {
  try {
    await pool.query('SELECT 1');
  } catch (e) {
    console.error('DB connection failed:', e.message);
    process.exit(1);
  }
  app.listen(PORT, () => {
    console.log('API server on http://localhost:' + PORT);
  });
}

start();
