// Extract unique categories and image URLs from the large CSV
// Usage: node scripts/extract-categories-images.js

const fs = require('fs');
const path = require('path');
const readline = require('readline');
const csvFile = path.join(__dirname, '../data/products/chattanooga-product-feed.csv');
const outCategories = path.join(__dirname, '../data/products/chattanooga-categories.json');
const outImages = path.join(__dirname, '../data/products/chattanooga-images.json');

const categoriesSet = new Set();
const imagesSet = new Set();
let header = [];
let categoryIdx = -1;
let imageIdx = -1;

async function extract() {
  const rl = readline.createInterface({
    input: fs.createReadStream(csvFile),
    crlfDelay: Infinity
  });
  let lineCount = 0;
  for await (const line of rl) {
    lineCount++;
    if (lineCount === 1) {
      header = line.split(',');
      categoryIdx = header.findIndex(h => h.toLowerCase().includes('category'));
      imageIdx = header.findIndex(h => h.toLowerCase().includes('image'));
      continue;
    }
    const cols = line.split(',');
    if (categoryIdx !== -1 && cols[categoryIdx]) {
      categoriesSet.add(cols[categoryIdx].trim());
    }
    if (imageIdx !== -1 && cols[imageIdx]) {
      imagesSet.add(cols[imageIdx].trim());
    }
  }
  fs.writeFileSync(outCategories, JSON.stringify(Array.from(categoriesSet).sort(), null, 2));
  fs.writeFileSync(outImages, JSON.stringify(Array.from(imagesSet).sort(), null, 2));
  console.log(`Extracted ${categoriesSet.size} unique categories and ${imagesSet.size} unique image URLs.`);
  console.log(`Review categories in ${outCategories}`);
}

extract();
