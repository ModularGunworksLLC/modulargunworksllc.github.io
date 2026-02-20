#!/usr/bin/env node
/**
 * Single script: pull products from Chattanooga API, map to your categories, write shop JSON.
 * No chain of scripts — one run does everything so products (and stock) stay in sync.
 *
 * Usage:
 *   node scripts/sync-products.js           # Run once
 *   node scripts/sync-products.js --schedule # Run now, then every 4 hours
 *
 * Requires .env: API_SID, API_TOKEN
 *
 * Optional .env: FALLBACK_UNMAPPED_TOP=Gear
 *   When set, feed categories not in the template (and no override) are mapped to this
 *   top category so products still appear on the site. Use admin to recategorize later.
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');
const crypto = require('crypto');
const csv = require('csv-parser');
const { normalizeCategoryKey } = require('./lib/category-utils');

const API_BASE = 'https://api.chattanoogashooting.com/rest/v5';
const API_SID = process.env.API_SID;
const API_TOKEN = process.env.API_TOKEN;

const ROOT = path.join(__dirname, '..');
const MAPPING_PATH = path.join(ROOT, 'data/products/category-mapping-template-cleaned.json');
const OUTPUT_DIR = path.join(ROOT, 'data/products/mapped-products');
const db = require('../admin/db');
const ALL_PRODUCTS_PATH = path.join(ROOT, 'data/products/all-products.json');
// Per‑wholesaler raw feed output (Step 1A): normalized Chattanooga feed
const VENDOR_DIR = path.join(ROOT, 'data/vendors/chattanooga');
const VENDOR_ALL_PRODUCTS_PATH = path.join(VENDOR_DIR, 'all-products.json');
const MAPPING_REPORT_PATH = path.join(ROOT, 'data/products/last-sync-mapping-report.json');

/** If set (e.g. FALLBACK_UNMAPPED_TOP=Gear), unmapped feed categories go to this top category so products still appear. */
const FALLBACK_UNMAPPED_TOP = (process.env.FALLBACK_UNMAPPED_TOP || '').trim();

/** Request larger image size from CDN so images stay crisp (feed often gives ?w=110&h=110). */
function toHighResImageUrl(url, size = 500) {
  if (!url || typeof url !== 'string') return url;
  return url.replace(/\?w=\d+&h=\d+/, '?w=' + size + '&h=' + size);
}

// Run every 4 hours in --schedule mode. Change to 6 if you prefer 6-hour updates.
const INTERVAL_HOURS = 4;
const INTERVAL_MS = INTERVAL_HOURS * 60 * 60 * 1000;

if (!API_SID || !API_TOKEN) {
  console.error('❌ Set API_SID and API_TOKEN in .env (or environment).');
  process.exit(1);
}

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
    const opts = {
      method: 'GET',
      headers: { Authorization: getAuthHeader(), Accept: 'application/json' },
    };
    https.get(url, opts, (res) => {
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

function downloadStream(urlString) {
  const url = new URL(urlString);
  const mod = url.protocol === 'https:' ? https : http;
  return new Promise((resolve, reject) => {
    const req = mod.get(url, { headers: { Accept: '*/*' } }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return downloadStream(res.headers.location).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) {
        let body = '';
        res.on('data', (c) => (body += c));
        res.on('end', () => reject(new Error('Feed download ' + res.statusCode + ': ' + body)));
        return;
      }
      resolve(res);
    });
    req.on('error', reject);
  });
}

async function runSync() {
  const start = Date.now();
  console.log('[sync-products] Starting…');

  if (!fs.existsSync(MAPPING_PATH)) {
    throw new Error('Category mapping not found: ' + MAPPING_PATH);
  }
  const mapping = JSON.parse(fs.readFileSync(MAPPING_PATH, 'utf8'));

  /** True if product has a list price we can show (override, MSRP, or MAP — only exclude when both MSRP and MAP are missing). */
  function hasListPrice(row, override) {
    const o = override || {};
    const ov = o.priceOverride != null ? Number(o.priceOverride) : null;
    if (ov != null && !isNaN(ov) && ov > 0) return true;
    const msrp = parseFloat(row['MSRP']);
    const map = parseFloat(row['MAP']);
    return (msrp != null && !isNaN(msrp) && msrp > 0) || (map != null && !isNaN(map) && map > 0);
  }

  let overrides = {};
  if (process.env.DATABASE_URL) {
    const tryDb = async () => {
      await db.runSchema();
      return await db.loadOverrides();
    };
    try {
      overrides = await tryDb();
    } catch (e) {
      if (e.message && e.message.includes('does not exist')) {
        try {
          overrides = await tryDb();
        } catch (e2) {
          console.warn('[sync-products] Could not load overrides from DB:', e2.message);
        }
      } else {
        console.warn('[sync-products] DB first attempt failed (Neon may be idle):', e.message);
        try {
          await new Promise(r => setTimeout(r, 4000));
          overrides = await tryDb();
          console.log('[sync-products] DB connected on retry.');
        } catch (e2) {
          console.warn('[sync-products] Could not load overrides from DB:', e2.message);
        }
      }
    }
  } else {
    const overridesPath = path.join(ROOT, 'data/products/overrides.json');
    try {
      if (fs.existsSync(overridesPath)) {
        overrides = JSON.parse(fs.readFileSync(overridesPath, 'utf8'));
      }
    } catch (e) {
      console.warn('[sync-products] Could not load overrides from file:', e.message);
    }
  }

  const data = await fetchChattanooga('/items/product-feed');
  const feedUrl = data.product_feed && data.product_feed.url;
  if (!feedUrl) {
    throw new Error('API did not return a product feed URL.');
  }
  console.log('[sync-products] Product feed URL received, downloading CSV…');

  const stream = await downloadStream(feedUrl);
  const categorized = {};
  const allProducts = [];
  /** Unmapped feed categories -> product count (for report). */
  const unmappedByCategory = {};

  await new Promise((resolve, reject) => {
    stream
      .pipe(csv())
      .on('data', (row) => {
        const catKey = normalizeCategoryKey(row['Category']);
        const sku = (row['SKU'] || '').toString().trim();
        const overrideMapping = overrides[sku] && overrides[sku].mapping && typeof overrides[sku].mapping === 'object'
          ? { top: overrides[sku].mapping.top, sub: overrides[sku].mapping.sub }
          : null;
        let map = mapping[catKey] || overrideMapping;
        if (!map && FALLBACK_UNMAPPED_TOP) {
          map = { top: FALLBACK_UNMAPPED_TOP, sub: (catKey && catKey.length < 80) ? catKey : 'Other' };
        }
        if (!map && catKey) {
          unmappedByCategory[catKey] = (unmappedByCategory[catKey] || 0) + 1;
        }
        const rawImage = (row['Image Location'] || '').trim();
        const mappedCategory = map ? { top: map.top, sub: map.sub } : null;
        const o = overrides[sku] || {};
        const overrideImage = (o.imageUrl && String(o.imageUrl).trim()) || null;
        const imageUrl = overrideImage || toHighResImageUrl(rawImage, 500);
        const hidden = o.hidden === true;
        const priceOverride = o.priceOverride != null ? Number(o.priceOverride) : undefined;
        const productRow = { ...row, mappedCategory, image: imageUrl, hidden, ...(priceOverride != null && !isNaN(priceOverride) ? { priceOverride } : {}) };
        allProducts.push(productRow);
        if (!map) return;
        // Only include in category files (live site) if not hidden and has a list price (override, MSRP, or MAP)
        if (hidden) return;
        if (!hasListPrice(row, o)) return;
        const top = map.top;
        const sub = map.sub;
        if (!categorized[top]) categorized[top] = [];
        categorized[top].push(productRow);
      })
      .on('end', resolve)
      .on('error', reject);
  });

  if (!fs.existsSync(path.dirname(OUTPUT_DIR))) {
    fs.mkdirSync(path.dirname(OUTPUT_DIR), { recursive: true });
  }
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  let total = 0;
  for (const [top, items] of Object.entries(categorized)) {
    const filename = top.replace(/[^a-z0-9]/gi, '_') + '.json';
    const outPath = path.join(OUTPUT_DIR, filename);
    fs.writeFileSync(outPath, JSON.stringify(items, null, 2), 'utf8');
    total += items.length;
    console.log('[sync-products] ' + filename + ': ' + items.length + ' products');
  }

  const allProductsDir = path.dirname(ALL_PRODUCTS_PATH);
  if (!fs.existsSync(allProductsDir)) fs.mkdirSync(allProductsDir, { recursive: true });
  fs.writeFileSync(ALL_PRODUCTS_PATH, JSON.stringify(allProducts, null, 2), 'utf8');
  console.log('[sync-products] all-products.json: ' + allProducts.length + ' products');

  // Step 1A: also write the full Chattanooga feed to a vendor-specific location
  if (!fs.existsSync(VENDOR_DIR)) {
    fs.mkdirSync(VENDOR_DIR, { recursive: true });
  }
  fs.writeFileSync(VENDOR_ALL_PRODUCTS_PATH, JSON.stringify(allProducts, null, 2), 'utf8');
  console.log('[sync-products] vendor feed written:', VENDOR_ALL_PRODUCTS_PATH);

  const unmappedCategories = Object.entries(unmappedByCategory).sort((a, b) => b[1] - a[1]);
  const unmappedProductCount = unmappedCategories.reduce((s, [, c]) => s + c, 0);
  const report = {
    generated: new Date().toISOString(),
    totalProducts: allProducts.length,
    mappedToCategoryFiles: total,
    unmappedCategoryCount: unmappedCategories.length,
    unmappedProductCount,
    fallbackUsed: !!FALLBACK_UNMAPPED_TOP,
    unmappedCategories: unmappedCategories.map(([cat, count]) => ({ category: cat, count })),
  };
  const reportDir = path.dirname(MAPPING_REPORT_PATH);
  if (!fs.existsSync(reportDir)) fs.mkdirSync(reportDir, { recursive: true });
  fs.writeFileSync(MAPPING_REPORT_PATH, JSON.stringify(report, null, 2), 'utf8');
  if (unmappedCategories.length > 0) {
    console.log('[sync-products] Unmapped: ' + unmappedCategories.length + ' feed categories, ' + unmappedProductCount + ' products. Report: ' + MAPPING_REPORT_PATH);
  }
  if (FALLBACK_UNMAPPED_TOP && unmappedProductCount > 0) {
    console.log('[sync-products] Fallback "' + FALLBACK_UNMAPPED_TOP + '" used for unmapped so they still appear on site.');
  }

  const elapsed = ((Date.now() - start) / 1000).toFixed(1);
  console.log('[sync-products] Done. ' + total + ' mapped, ' + allProducts.length + ' total (' + elapsed + 's)');
}

function main() {
  const schedule = process.argv.includes('--schedule');

  function run() {
    runSync().catch((err) => {
      console.error('[sync-products] Error:', err.message);
      if (!schedule) process.exit(1);
    });
  }

  if (schedule) {
    console.log('[sync-products] Schedule mode: run every ' + INTERVAL_HOURS + ' hours. (Stop with Ctrl+C.)');
    run();
    setInterval(run, INTERVAL_MS);
  } else {
    run();
  }
}

main();
