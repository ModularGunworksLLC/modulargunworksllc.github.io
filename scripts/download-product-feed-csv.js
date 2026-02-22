#!/usr/bin/env node
/**
 * Download the full Chattanooga product-feed CSV and save it locally.
 * Run: node scripts/download-product-feed-csv.js
 * Output: data/products/chattanooga-product-feed.csv
 *
 * Requires .env: API_SID, API_TOKEN
 */
require('dotenv').config();
const path = require('path');
const fs = require('fs');
const https = require('https');
const http = require('http');
const crypto = require('crypto');

const API_BASE = 'https://api.chattanoogashooting.com/rest/v5';
const API_SID = process.env.API_SID || process.env.CHATTANOOGA_SID;
const API_TOKEN = process.env.API_TOKEN || process.env.CHATTANOOGA_TOKEN;
const OUTPUT = path.join(__dirname, '../data/products/chattanooga-product-feed.csv');

function md5(str) {
  return crypto.createHash('md5').update(str).digest('hex');
}

function getAuthHeader() {
  const tokenHash = md5(API_TOKEN);
  return `Basic ${API_SID}:${tokenHash}`;
}

function fetchChattanooga(endpoint) {
  const url = new URL(API_BASE + endpoint);
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { Authorization: getAuthHeader(), Accept: 'application/json' } }, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            resolve(JSON.parse(data));
          } catch (e) {
            reject(new Error('API response not JSON'));
          }
        } else {
          const err = new Error('API ' + res.statusCode);
          err.statusCode = res.statusCode;
          reject(err);
        }
      });
    }).on('error', reject);
  });
}

function downloadToFile(urlString, destPath) {
  const url = new URL(urlString);
  const mod = url.protocol === 'https:' ? https : http;
  return new Promise((resolve, reject) => {
    const req = mod.get(url, { headers: { Accept: '*/*' } }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return downloadToFile(res.headers.location, destPath).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) {
        reject(new Error('Download failed: ' + res.statusCode));
        return;
      }
      const dir = path.dirname(destPath);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      const file = fs.createWriteStream(destPath);
      res.pipe(file);
      file.on('finish', () => {
        file.close();
        resolve();
      });
      file.on('error', reject);
    });
    req.on('error', reject);
  });
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function run() {
  if (!API_SID || !API_TOKEN) {
    console.error('Set API_SID and API_TOKEN in .env');
    process.exit(1);
  }
  const maxRetries = 5;
  const retryDelayMs = 60000; // 1 minute - rate limits often reset by then

  let data;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    console.log('Fetching product-feed URL from Chattanooga API...' + (attempt > 1 ? ` (attempt ${attempt}/${maxRetries})` : ''));
    try {
      data = await fetchChattanooga('/items/product-feed');
      break;
    } catch (e) {
      if (e.statusCode === 429 && attempt < maxRetries) {
        console.log('Rate limited (429). Waiting', retryDelayMs / 1000, 'seconds before retry...');
        await sleep(retryDelayMs);
      } else {
        throw e;
      }
    }
  }
  const feedUrl = data.product_feed?.url;
  if (!feedUrl) {
    throw new Error('API did not return a product feed URL.');
  }
  console.log('Downloading CSV...');
  await downloadToFile(feedUrl, OUTPUT);
  const stats = fs.statSync(OUTPUT);
  console.log('Done. Saved to:', path.resolve(OUTPUT));
  console.log('Size:', (stats.size / 1024).toFixed(1), 'KB');
}

run().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
