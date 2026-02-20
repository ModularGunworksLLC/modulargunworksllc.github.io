/**
 * Overrides storage: Neon Postgres when DATABASE_URL is set, else data/products/overrides.json.
 * Used by admin server and sync-products.js.
 */

const path = require('path');
const fs = require('fs');

const ROOT = path.join(__dirname, '..');
const OVERRIDES_PATH = path.join(ROOT, 'data', 'products', 'overrides.json');

let pool = null;

function getPool() {
  const url = (process.env.DATABASE_URL || '').trim();
  if (!url) return null;
  if (pool) return pool;
  const { Pool } = require('pg');
  pool = new Pool({
    connectionString: url,
    ssl: url.includes('neon.tech') ? { rejectUnauthorized: true } : undefined,
    connectionTimeoutMillis: 10000,
  });
  return pool;
}

/** Test DB connectivity (e.g. after Neon cold start). Returns true if SELECT 1 succeeds. */
async function testConnection() {
  const p = getPool();
  if (!p) return false;
  const client = await p.connect();
  try {
    await client.query('SELECT 1');
    return true;
  } catch (e) {
    return false;
  } finally {
    client.release();
  }
}

/** Create product_overrides table if it doesn't exist. */
async function runSchema() {
  const p = getPool();
  if (!p) return;
  const client = await p.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS product_overrides (
        sku TEXT PRIMARY KEY,
        price_override NUMERIC,
        hidden BOOLEAN NOT NULL DEFAULT false,
        force_show BOOLEAN NOT NULL DEFAULT false,
        image_url TEXT,
        mapping_top TEXT,
        mapping_sub TEXT,
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);
  } finally {
    client.release();
  }
}

/**
 * Load all overrides. Returns { sku: { priceOverride?, hidden?, forceShow?, imageUrl?, mapping?: { top, sub } }, ... }.
 * Resolves when using file; async when using DB.
 */
async function loadOverrides() {
  const p = getPool();
  if (!p) {
    try {
      const data = fs.readFileSync(OVERRIDES_PATH, 'utf8');
      return JSON.parse(data);
    } catch (e) {
      if (e.code === 'ENOENT') return {};
      throw e;
    }
  }
  const client = await p.connect();
  try {
    const res = await client.query(
      'SELECT sku, price_override, hidden, force_show, image_url, mapping_top, mapping_sub FROM product_overrides'
    );
    const out = {};
    for (const row of res.rows) {
      const o = {};
      if (row.price_override != null) o.priceOverride = Number(row.price_override);
      o.hidden = !!row.hidden;
      o.forceShow = !!row.force_show;
      if (row.image_url) o.imageUrl = row.image_url;
      if (row.mapping_top) {
        o.mapping = { top: row.mapping_top, sub: row.mapping_sub || row.mapping_top };
      }
      out[row.sku] = o;
    }
    return out;
  } finally {
    client.release();
  }
}

/**
 * Save one product override. Merges with existing; null/undefined values clear fields.
 */
async function saveOverride(sku, data) {
  if (!sku) return;
  const p = getPool();
  if (!p) {
    let overrides = {};
    try {
      overrides = JSON.parse(fs.readFileSync(OVERRIDES_PATH, 'utf8'));
    } catch (e) {
      if (e.code !== 'ENOENT') throw e;
    }
    if (!overrides[sku]) overrides[sku] = {};
    if (data.priceOverride !== undefined) overrides[sku].priceOverride = data.priceOverride === '' || data.priceOverride == null ? null : Number(data.priceOverride);
    if (data.hidden !== undefined) overrides[sku].hidden = !!data.hidden;
    if (data.forceShow !== undefined) overrides[sku].forceShow = !!data.forceShow;
    if (data.imageUrl !== undefined) {
      const v = (data.imageUrl == null || data.imageUrl === '') ? null : String(data.imageUrl).trim();
      if (!v) delete overrides[sku].imageUrl;
      else overrides[sku].imageUrl = v;
    }
    if (data.mapping !== undefined) {
      if (data.mapping == null || (typeof data.mapping === 'object' && !data.mapping.top)) delete overrides[sku].mapping;
      else overrides[sku].mapping = { top: String(data.mapping.top || '').trim(), sub: String((data.mapping.sub != null ? data.mapping.sub : data.mapping.top) || '').trim() };
    }
    const dir = path.dirname(OVERRIDES_PATH);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(OVERRIDES_PATH, JSON.stringify(overrides, null, 2), 'utf8');
    return;
  }
  const client = await p.connect();
  try {
    const priceOverride = data.priceOverride === '' || data.priceOverride == null ? null : Number(data.priceOverride);
    const hidden = !!data.hidden;
    const forceShow = !!data.forceShow;
    const imageUrl = (data.imageUrl != null && data.imageUrl !== '') ? String(data.imageUrl).trim() : null;
    const mappingTop = (data.mapping && data.mapping.top) ? String(data.mapping.top).trim() : null;
    const mappingSub = (data.mapping && (data.mapping.sub != null ? data.mapping.sub : data.mapping.top)) ? String(data.mapping.sub).trim() : null;
    await client.query(
      `INSERT INTO product_overrides (sku, price_override, hidden, force_show, image_url, mapping_top, mapping_sub, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
       ON CONFLICT (sku) DO UPDATE SET
         price_override = EXCLUDED.price_override,
         hidden = EXCLUDED.hidden,
         force_show = EXCLUDED.force_show,
         image_url = EXCLUDED.image_url,
         mapping_top = EXCLUDED.mapping_top,
         mapping_sub = EXCLUDED.mapping_sub,
         updated_at = NOW()`,
      [sku, priceOverride, hidden, forceShow, imageUrl, mappingTop, mappingSub]
    );
  } finally {
    client.release();
  }
}

/** One-time: load overrides.json and insert/update into Postgres. */
async function migrateFromFile() {
  const p = getPool();
  if (!p) {
    console.log('No DATABASE_URL; nothing to migrate.');
    return;
  }
  let overrides = {};
  try {
    overrides = JSON.parse(fs.readFileSync(OVERRIDES_PATH, 'utf8'));
  } catch (e) {
    if (e.code === 'ENOENT') {
      console.log('No overrides.json found.');
      return;
    }
    throw e;
  }
  await runSchema();
  let n = 0;
  for (const [sku, o] of Object.entries(overrides)) {
    await saveOverride(sku, o);
    n++;
  }
  console.log('Migrated', n, 'overrides to database.');
}

module.exports = {
  getPool,
  runSchema,
  loadOverrides,
  saveOverride,
  migrateFromFile,
  testConnection,
};
