#!/usr/bin/env node
/**
 * Lists Chattanooga feed categories that are NOT in the category mapping.
 * Use this to see why you have ~19k products instead of ~48k — unmapped categories
 * are skipped during sync.
 *
 * Usage: node scripts/list-missing-categories.js
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

if (!API_SID || !API_TOKEN) {
  console.error('❌ Set API_SID and API_TOKEN in .env');
  process.exit(1);
}

function md5(str) {
  return crypto.createHash('md5').update(str).digest('hex');
}

function getAuthHeader() {
  return `Basic ${API_SID}:${md5(API_TOKEN)}`;
}

function fetchChattanooga(endpoint, params = {}) {
  const url = new URL(API_BASE + endpoint);
  Object.entries(params).forEach(([k, v]) => url.searchParams.append(k, v));
  return new Promise((resolve, reject) => {
    https.get(url, {
      method: 'GET',
      headers: { Authorization: getAuthHeader(), Accept: 'application/json' },
    }, (res) => {
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

async function main() {
  console.log('Loading category mapping…');
  if (!fs.existsSync(MAPPING_PATH)) {
    console.error('Mapping not found:', MAPPING_PATH);
    process.exit(1);
  }
  const mapping = JSON.parse(fs.readFileSync(MAPPING_PATH, 'utf8'));
  const mappedCategories = new Set(Object.keys(mapping));
  console.log('Mapped categories in file:', mappedCategories.size);

  /** Normalize feed category to match mapping keys (e.g. "Chassis &amp; Stocks" -> "Chassis & Stocks"). */
  function normalizeCategoryKey(cat) {
    if (!cat || typeof cat !== 'string') return cat || '';
    return cat
      .replace(/&amp;/g, '&')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>');
  }

  console.log('Fetching product feed URL from API…');
  const data = await fetchChattanooga('/items/product-feed');
  const feedUrl = data.product_feed && data.product_feed.url;
  if (!feedUrl) {
    console.error('API did not return a product feed URL.');
    process.exit(1);
  }

  console.log('Downloading CSV and counting by Category…');
  const stream = await downloadStream(feedUrl);
  /** @type {Record<string, number>} category -> product count */
  const categoryCounts = {};
  let totalRows = 0;

  await new Promise((resolve, reject) => {
    stream
      .pipe(csv())
      .on('data', (row) => {
        totalRows++;
        const cat = normalizeCategoryKey((row['Category'] || '').trim());
        if (!cat) return;
        categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
      })
      .on('end', resolve)
      .on('error', reject);
  });

  const missing = [];
  let missingProductCount = 0;
  for (const [cat, count] of Object.entries(categoryCounts)) {
    if (!mappedCategories.has(cat)) {
      missing.push({ category: cat, count });
      missingProductCount += count;
    }
  }

  // Sort by count descending
  missing.sort((a, b) => b.count - a.count);

  const mappedProductCount = totalRows - missingProductCount;
  console.log('\n--- Summary ---');
  console.log('Total rows in feed:     ', totalRows.toLocaleString());
  console.log('Mapped (in sync):       ', mappedProductCount.toLocaleString());
  console.log('Unmapped (skipped):     ', missingProductCount.toLocaleString());
  console.log('Unmapped category names:', missing.length);

  console.log('\n--- Categories in feed but NOT in mapping (top 100 by product count) ---\n');
  const toShow = missing.slice(0, 100);
  const maxCatLen = Math.max(10, ...toShow.map((m) => m.category.length));
  const header = 'Category'.padEnd(maxCatLen) + '  Product count';
  console.log(header);
  console.log('-'.repeat(header.length));
  for (const { category, count } of toShow) {
    console.log(category.padEnd(maxCatLen) + '  ' + count.toLocaleString());
  }

  if (missing.length > 100) {
    console.log('\n... and', missing.length - 100, 'more unmapped categories.');
  }

  const outPath = path.join(ROOT, 'data/products/missing-categories-report.json');
  fs.writeFileSync(
    outPath,
    JSON.stringify(
      {
        generated: new Date().toISOString(),
        totalRowsInFeed: totalRows,
        mappedProductCount,
        missingProductCount,
        unmappedCategoryCount: missing.length,
        unmappedCategories: missing,
      },
      null,
      2
    ),
    'utf8'
  );
  console.log('\nFull list written to:', outPath);
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
