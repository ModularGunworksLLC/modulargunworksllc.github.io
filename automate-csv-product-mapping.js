// Automate product mapping from CSV using the Category column
// Usage: node automate-csv-product-mapping.js

const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');


const mappingPath = path.join(__dirname, 'data/products/category-mapping-template-cleaned.json');
const csvPath = path.join(__dirname, 'data/products/chattanooga-product-feed.csv');
const outputDir = path.join(__dirname, 'data/products/mapped-products');

if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir);

const mapping = JSON.parse(fs.readFileSync(mappingPath, 'utf8'));

// Image URL comes from the CSV "Image Location" column (Chattanooga product feed).
const categorized = {};

fs.createReadStream(csvPath)
  .pipe(csv())
  .on('data', (row) => {
    const catKey = row['Category'];
    const map = mapping[catKey];
    if (!map) return; // skip unmapped
    const top = map.top;
    const sub = map.sub;
    const image = (row['Image Location'] || '').trim();
    if (!categorized[top]) categorized[top] = [];
    categorized[top].push({ ...row, mappedCategory: { top, sub }, image });
  })
  .on('end', () => {
    Object.entries(categorized).forEach(([top, items]) => {
      const outPath = path.join(outputDir, `${top.replace(/[^a-z0-9]/gi, '_')}.json`);
      fs.writeFileSync(outPath, JSON.stringify(items, null, 2));
    });
    console.log('Products mapped and written to:', outputDir);
  });
