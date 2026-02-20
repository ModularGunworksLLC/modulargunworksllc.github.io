#!/usr/bin/env node
/**
 * Analyze feed categories vs mapping using existing vendor JSON (no API call).
 * Usage: node scripts/analyze-feed-vs-mapping.js
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const mappingPath = path.join(ROOT, 'data/products/category-mapping-template-cleaned.json');
const feedPath = path.join(ROOT, 'data/vendors/chattanooga/all-products.json');

function normalizeCategoryKey(cat) {
  if (!cat || typeof cat !== 'string') return cat || '';
  return cat
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}

const mapping = JSON.parse(fs.readFileSync(mappingPath, 'utf8'));
const mappedKeys = new Set(Object.keys(mapping));
const products = JSON.parse(fs.readFileSync(feedPath, 'utf8'));

const byCat = {};
products.forEach((p) => {
  const cat = normalizeCategoryKey((p.Category || '').trim());
  if (!cat) return;
  byCat[cat] = (byCat[cat] || 0) + 1;
});

const missing = [];
let missingCount = 0;
for (const [cat, count] of Object.entries(byCat)) {
  if (!mappedKeys.has(cat)) {
    missing.push({ category: cat, count });
    missingCount += count;
  }
}
missing.sort((a, b) => b.count - a.count);

const total = products.length;
const mappedCount = total - missingCount;

console.log('--- Summary (from data/vendors/chattanooga/all-products.json) ---');
console.log('Total product rows:      ', total.toLocaleString());
console.log('Mapped (in template):   ', mappedCount.toLocaleString());
console.log('Unmapped (no key match):', missingCount.toLocaleString());
console.log('Unmapped category names:', missing.length);
console.log('');
console.log('--- Top 80 feed categories NOT in mapping (by product count) ---');
missing.slice(0, 80).forEach((m) => console.log(m.count.toString().padStart(6) + '  ' + m.category));

// Also list mapping "top" values (site categories) vs what sync writes
const topValues = new Set();
Object.values(mapping).forEach((v) => v && topValues.add(v.top));
console.log('');
console.log('--- Your site category files (mapping "top" values) ---');
[...topValues].sort().forEach((t) => console.log('  ' + t + '  ->  ' + (t.replace(/[^a-z0-9]/gi, '_') + '.json')));
