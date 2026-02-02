// Automate product categorization and page assignment
// Usage: node automate-product-mapping.js

const fs = require('fs');
const path = require('path');

const mappingPath = path.join(__dirname, 'data/products/category-mapping-template-cleaned.json');
const productsPath = path.join(__dirname, 'data/products/chattanooga-items.json');
const outputDir = path.join(__dirname, 'data/products/mapped-products');

if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir);

const mapping = JSON.parse(fs.readFileSync(mappingPath, 'utf8'));
const productsData = JSON.parse(fs.readFileSync(productsPath, 'utf8'));
const products = productsData.items;

// Organize products by top-level category
const categorized = {};
products.forEach(product => {
  const catKey = product.category;
  const map = mapping[catKey];
  if (!map) return; // skip unmapped
  const top = map.top;
  const sub = map.sub;
  if (!categorized[top]) categorized[top] = [];
  categorized[top].push({ ...product, mappedCategory: { top, sub } });
});

// Write one file per top-level category
Object.entries(categorized).forEach(([top, items]) => {
  const outPath = path.join(outputDir, `${top.replace(/[^a-z0-9]/gi, '_')}.json`);
  fs.writeFileSync(outPath, JSON.stringify(items, null, 2));
});

console.log('Products mapped and written to:', outputDir);
