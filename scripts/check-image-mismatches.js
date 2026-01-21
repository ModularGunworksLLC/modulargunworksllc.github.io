const fs = require('fs');
const path = require('path');

const PRODUCTS_DIR = path.join(__dirname, '../data/products');
const THUMBNAILS_DIR = path.join(__dirname, '../public/images/thumbnails');
const PLACEHOLDER = '../images/placeholders/product-placeholder.png';

function getAllProductFiles() {
  return fs.readdirSync(PRODUCTS_DIR)
    .filter(f => f.endsWith('.json'))
    .map(f => path.join(PRODUCTS_DIR, f));
}

function loadAllProducts() {
  const files = getAllProductFiles();
  let all = [];
  for (const file of files) {
    try {
      const data = JSON.parse(fs.readFileSync(file, 'utf8'));
      if (Array.isArray(data.products)) {
        all = all.concat(data.products);
      }
    } catch (e) {
      console.warn(`Could not parse ${file}: ${e.message}`);
    }
  }
  return all;
}

function getAllThumbnails() {
  if (!fs.existsSync(THUMBNAILS_DIR)) return [];
  return fs.readdirSync(THUMBNAILS_DIR).filter(f => f.match(/\.(jpg|png|webp)$/i));
}

function isPlaceholder(img) {
  return !img || img === PLACEHOLDER;
}

function getBaseName(file) {
  return file.replace(/\.(jpg|png|webp)$/i, '');
}

function main() {
  const products = loadAllProducts();
  const thumbnails = getAllThumbnails();
  const thumbnailSet = new Set(thumbnails);
  const productIds = new Set(products.map(p => p.id));

  const missingFiles = [];
  const placeholderProducts = [];
  const extensionMismatches = [];
  const orphanedThumbnails = [];

  // Build a map of all thumbnail files by base name
  const thumbMap = {};
  for (const file of thumbnails) {
    const base = getBaseName(file);
    if (!thumbMap[base]) thumbMap[base] = [];
    thumbMap[base].push(file);
  }

  for (const product of products) {
    const img = product.image;
    const sku = product.id;
    if (isPlaceholder(img)) {
      placeholderProducts.push(product);
      continue;
    }
    if (!img || typeof img !== 'string') {
      missingFiles.push({ product, reason: 'No image property' });
      continue;
    }
    // Extract just the filename from the image path
    const imgFile = path.basename(img);
    if (!thumbnailSet.has(imgFile)) {
      missingFiles.push({ product, reason: `File not found: ${imgFile}` });
    } else {
      // Extension mismatch check
      const base = getBaseName(imgFile);
      const actualFiles = thumbMap[base] || [];
      if (actualFiles.length > 0 && !actualFiles.includes(imgFile)) {
        extensionMismatches.push({
          product,
          referenced: imgFile,
          actual: actualFiles
        });
      }
    }
  }

  // Orphaned thumbnails
  for (const file of thumbnails) {
    const base = getBaseName(file);
    if (!productIds.has(base)) {
      orphanedThumbnails.push(file);
    }
  }

  // Output report
  console.log('===== Missing Files =====');
  if (missingFiles.length === 0) {
    console.log('None');
  } else {
    for (const { product, reason } of missingFiles) {
      console.log(`SKU: ${product.id} | Name: ${product.name || ''} | Reason: ${reason}`);
    }
  }

  console.log('\n===== Placeholder Products =====');
  console.log(`Count: ${placeholderProducts.length}`);
  for (const product of placeholderProducts) {
    console.log(`SKU: ${product.id} | Name: ${product.name || ''}`);
  }

  console.log('\n===== Extension Mismatches =====');
  if (extensionMismatches.length === 0) {
    console.log('None');
  } else {
    for (const { product, referenced, actual } of extensionMismatches) {
      console.log(`SKU: ${product.id} | Name: ${product.name || ''} | Referenced: ${referenced} | Actual: ${actual.join(', ')}`);
    }
  }

  console.log('\n===== Orphaned Thumbnails =====');
  if (orphanedThumbnails.length === 0) {
    console.log('None');
  } else {
    for (const file of orphanedThumbnails) {
      console.log(file);
    }
  }
}

main();
