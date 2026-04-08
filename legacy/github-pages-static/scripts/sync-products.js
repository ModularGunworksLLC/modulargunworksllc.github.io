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
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');
const crypto = require('crypto');
const csv = require('csv-parser');

const API_BASE = 'https://api.chattanoogashooting.com/rest/v5';
const API_SID = process.env.API_SID;
const API_TOKEN = process.env.API_TOKEN;

const ROOT = path.join(__dirname, '..');
const MAPPING_PATH = path.join(ROOT, 'data/products/category-mapping-template-cleaned.json');
const OUTPUT_DIR = path.join(ROOT, 'data/products/mapped-products');

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

  const data = await fetchChattanooga('/items/product-feed');
  const feedUrl = data.product_feed && data.product_feed.url;
  if (!feedUrl) {
    throw new Error('API did not return a product feed URL.');
  }
  console.log('[sync-products] Product feed URL received, downloading CSV…');

  const stream = await downloadStream(feedUrl);
  const categorized = {};

  await new Promise((resolve, reject) => {
    stream
      .pipe(csv())
      .on('data', (row) => {
        const catKey = row['Category'];
        const map = mapping[catKey];
        if (!map) return;
        const top = map.top;
        const sub = map.sub;
        const rawImage = (row['Image Location'] || '').trim();
        const imageUrl = toHighResImageUrl(rawImage, 500);
        if (!categorized[top]) categorized[top] = [];
        categorized[top].push({ ...row, mappedCategory: { top, sub }, image: imageUrl });
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

  const elapsed = ((Date.now() - start) / 1000).toFixed(1);
  console.log('[sync-products] Done. ' + total + ' products in ' + Object.keys(categorized).length + ' categories (' + elapsed + 's)');
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
