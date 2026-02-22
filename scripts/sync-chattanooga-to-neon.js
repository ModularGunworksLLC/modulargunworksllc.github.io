#!/usr/bin/env node
/**
 * Sync Chattanooga products directly into Neon (raw layer only).
 * Uses paginated /items API for FULL catalog (~48k), NOT product-feed CSV (subset ~27k).
 * Each item stored with vendor's native columns as-is. No filtering, no mapping.
 *
 * Usage: node scripts/sync-chattanooga-to-neon.js
 *
 * Requires .env: DATABASE_URL, API_SID, API_TOKEN
 */
require('dotenv').config();
const path = require('path');
const https = require('https');
const crypto = require('crypto');
const { Pool } = require('pg');

const PER_PAGE = 50; // API max

require('dotenv').config({ path: path.join(__dirname, '../.env') });

const API_BASE = 'https://api.chattanoogashooting.com/rest/v5';
// Same env vars as sync-products.js (live site); fallback to GitHub Action secret names
const API_SID = process.env.API_SID || process.env.CHATTANOOGA_SID;
const API_TOKEN = process.env.API_TOKEN || process.env.CHATTANOOGA_TOKEN;
const DATABASE_URL = process.env.DATABASE_URL;

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: DATABASE_URL && DATABASE_URL.includes('neon.tech') ? { rejectUnauthorized: true } : false,
});

function md5(str) {
  return crypto.createHash('md5').update(str).digest('hex');
}

function getAuthHeader() {
  const tokenHash = md5(API_TOKEN);
  return `Basic ${API_SID}:${tokenHash}`;
}

function fetchChattanooga(endpoint, params = {}) {
  const url = new URL(API_BASE + endpoint);
  Object.entries(params).forEach(([k, v]) => url.searchParams.append(k, v));
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { Authorization: getAuthHeader(), Accept: 'application/json' } }, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            resolve(JSON.parse(data));
          } catch (e) {
            reject(new Error('API response not JSON: ' + e.message));
          }
        } else {
          reject(new Error('API ' + res.statusCode + ': ' + data));
        }
      });
    }).on('error', reject);
  });
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function ensureChattanoogaVendor(client) {
  let res = await client.query(`SELECT id FROM vendors WHERE name = 'Chattanooga'`);
  if (res.rows.length) return res.rows[0].id;
  res = await client.query(`INSERT INTO vendors (name, type) VALUES ('Chattanooga', 'api') RETURNING id`);
  if (res.rows.length) return res.rows[0].id;
  throw new Error('Could not get or create Chattanooga vendor');
}

async function run() {
  if (!API_SID || !API_TOKEN) {
    console.error('❌ Set API_SID and API_TOKEN in .env');
    process.exit(1);
  }
  if (!DATABASE_URL) {
    console.error('❌ Set DATABASE_URL in .env');
    process.exit(1);
  }

  const start = Date.now();
  console.log('[sync-chattanooga-to-neon] Starting…');

  const client = await pool.connect();
  let vendorId;
  try {
    vendorId = await ensureChattanoogaVendor(client);
    console.log('[sync-chattanooga-to-neon] Vendor Chattanooga id:', vendorId);
  } catch (e) {
    console.error('Vendor lookup failed:', e.message);
    process.exit(1);
  }

  // Fetch full catalog via paginated /items API (not product-feed CSV which is a subset)
  const allItems = [];
  let page = 1;
  let hasMore = true;

  while (hasMore) {
    const data = await fetchChattanooga('/items', { page, per_page: PER_PAGE });
    const items = data.items || [];
    allItems.push(...items);
    if (page % 100 === 0) {
      console.log('[sync-chattanooga-to-neon] Fetched page', page, '| total so far:', allItems.length);
    }
    hasMore = data.pagination && data.pagination.page < data.pagination.page_count;
    if (hasMore) {
      page++;
      await sleep(150); // Rate-limit friendly
    }
  }

  // Dedupe by vendor_sku (last wins) - avoids loading duplicate SKUs from any source
  const bySku = new Map();
  for (const item of allItems) {
    const sku = (item.cssi_id || item.item_number || item.SKU || '').toString().trim();
    if (sku) bySku.set(sku, item);
  }
  const uniqueItems = Array.from(bySku.values());
  if (uniqueItems.length < allItems.length) {
    console.log('[sync-chattanooga-to-neon] Deduped:', allItems.length, '→', uniqueItems.length, 'unique SKUs');
  }
  console.log('[sync-chattanooga-to-neon] Upserting', uniqueItems.length, 'items…');

  const BATCH_SIZE = 500;
  let upserted = 0;

  for (let i = 0; i < uniqueItems.length; i += BATCH_SIZE) {
    const batch = uniqueItems.slice(i, i + BATCH_SIZE);
    const values = [];
    const placeholders = [];
    let paramIndex = 1;

    for (const item of batch) {
      const sku = (item.cssi_id || item.item_number || item.SKU || '').toString().trim();
      if (!sku) continue;

      placeholders.push(`($${paramIndex}, $${paramIndex + 1}, $${paramIndex + 2}::jsonb, NOW())`);
      values.push(vendorId, sku, JSON.stringify(item));
      paramIndex += 3;
    }

    if (placeholders.length === 0) continue;

    const sql = `
      INSERT INTO vendor_product_raw (vendor_id, vendor_sku, raw_data, synced_at)
      VALUES ${placeholders.join(', ')}
      ON CONFLICT (vendor_id, vendor_sku) DO UPDATE SET
        raw_data = EXCLUDED.raw_data,
        synced_at = NOW()
    `;

    await client.query(sql, values.flat());
    upserted += placeholders.length;
  }

  client.release();
  await pool.end();

  const elapsed = ((Date.now() - start) / 1000).toFixed(1);
  console.log('[sync-chattanooga-to-neon] Done. Upserted', upserted, 'rows in', elapsed + 's');
}

run().catch((err) => {
  console.error('[sync-chattanooga-to-neon] Error:', err.message);
  process.exit(1);
});
