#!/usr/bin/env node
/**
 * Count how many products in the product-feed CSV are skipped due to missing
 * category mapping in category-mapping-template-cleaned.json
 * Run: node scripts/count-feed-skipped.js
 */
require('dotenv').config();
const path = require('path');
const https = require('https');
const http = require('http');
const crypto = require('crypto');
const csv = require('csv-parser');
const fs = require('fs');

const API_BASE = 'https://api.chattanoogashooting.com/rest/v5';
const API_SID = process.env.API_SID || process.env.CHATTANOOGA_SID;
const API_TOKEN = process.env.API_TOKEN || process.env.CHATTANOOGA_TOKEN;
const MAPPING_PATH = path.join(__dirname, '../data/products/category-mapping-template-cleaned.json');

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

async function run() {
  if (!API_SID || !API_TOKEN) {
    console.error('Set API_SID and API_TOKEN in .env');
    process.exit(1);
  }
  const mapping = JSON.parse(fs.readFileSync(MAPPING_PATH, 'utf8'));

  const data = await fetchChattanooga('/items/product-feed');
  const feedUrl = data.product_feed && data.product_feed.url;
  if (!feedUrl) {
    throw new Error('API did not return a product feed URL.');
  }

  const stream = await downloadStream(feedUrl);
  let total = 0;
  let included = 0;
  let skipped = 0;
  const skippedByCategory = {};

  await new Promise((resolve, reject) => {
    stream
      .pipe(csv())
      .on('data', (row) => {
        total++;
        const catKey = row['Category'];
        const map = mapping[catKey];
        if (!map) {
          skipped++;
          const key = catKey || '(empty)';
          skippedByCategory[key] = (skippedByCategory[key] || 0) + 1;
        } else {
          included++;
        }
      })
      .on('end', resolve)
      .on('error', reject);
  });

  console.log('--- Product feed category mapping report ---');
  console.log('Total rows in CSV:', total);
  console.log('Included (mapped):', included);
  console.log('Skipped (no mapping):', skipped);
  console.log('');
  if (skipped > 0) {
    const sorted = Object.entries(skippedByCategory).sort((a, b) => b[1] - a[1]);
    console.log('Skipped categories (category -> count):');
    sorted.slice(0, 50).forEach(([cat, n]) => console.log('  ', cat, ':', n));
    if (sorted.length > 50) {
      console.log('  ... and', sorted.length - 50, 'more categories');
    }
  }
}

run().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
