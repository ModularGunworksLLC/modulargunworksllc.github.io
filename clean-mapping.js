const fs = require('fs');
const inputPath = 'data/products/category-mapping-template.json';
const outputPath = 'data/products/category-mapping-template-cleaned.json';

// Remove comments
let raw = fs.readFileSync(inputPath, 'utf8');
raw = raw.split('\n').filter(line => !line.trim().startsWith('//')).join('\n');

// Parse JSON (fix trailing commas if needed)
let obj;
try {
  obj = JSON.parse(raw);
} catch (e) {
  raw = raw.replace(/,(\s*[}\]])/g, '$1');
  obj = JSON.parse(raw);
}

// Remove duplicate keys (keep first occurrence)
const seen = new Set();
const cleaned = {};
for (const key of Object.keys(obj)) {
  if (!seen.has(key)) {
    cleaned[key] = obj[key];
    seen.add(key);
  }
}

// Write cleaned JSON
fs.writeFileSync(outputPath, JSON.stringify(cleaned, null, 2));
console.log('Cleaned mapping written to', outputPath);
