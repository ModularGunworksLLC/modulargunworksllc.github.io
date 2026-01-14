#!/usr/bin/env node

/**
 * Chattanooga Shooting API Sync Script
 * Syncs product inventory and pricing to local JSON files
 */

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// API credentials from environment
const SID = process.env.CHATTANOOGA_SID || process.env.API_SID;
const TOKEN = process.env.CHATTANOOGA_TOKEN || process.env.API_TOKEN;

if (!SID || !TOKEN) {
  console.error('❌ Error: CHATTANOOGA_SID and CHATTANOOGA_TOKEN environment variables are required');
  process.exit(1);
}

// API Configuration
const API_BASE_URL = 'https://api.chattanoogashooting.com/rest/v5';

// Category to Manufacturer ID mapping
const CATEGORIES = {
  'ammunition': ['FC', 'WIN', 'REM', 'SPR', 'CCI', 'PMC', 'HSM', 'LAP', 'GFL'], // Common ammo brands
  'magazines': ['MAG', 'ETS', 'PMAG'], // Magazine manufacturers
  'gun-parts': ['BCM', 'DD', 'LMT', 'CMMG', 'FAL', 'AR15'], // Parts manufacturers
  'gear': ['CRYE', 'ESSTAC', 'HSGI', 'FERRO'], // Gear manufacturers
  'optics': ['EOTECH', 'ACOG', 'LEUP', 'SIG', 'STEYR'], // Optics manufacturers
  'reloading': ['LYMAN', 'RCBS', 'LEE', 'DILLON'], // Reloading manufacturers
  'survival': ['YETI', 'BENCHMADE', 'CONDOR', 'SPEC'] // Survival gear manufacturers
};

/**
 * Generate MD5 hash of token for authorization
 */
function generateAuthHash(token) {
  return crypto.createHash('md5').update(token).digest('hex');
}

/**
 * Build Authorization header
 */
function getAuthHeader() {
  const tokenHash = generateAuthHash(TOKEN);
  const credentials = `${SID}:${tokenHash}`;
  return 'Basic ' + Buffer.from(credentials).toString('base64');
}

/**
 * Fetch products from Chattanooga API
 */
async function fetchProducts(manufacturerIds) {
  try {
    const url = new URL(`${API_BASE_URL}/items`);
    url.searchParams.append('manufacturer_ids', manufacturerIds.join(','));
    url.searchParams.append('per_page', '50');

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Authorization': getAuthHeader(),
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data.items || [];
  } catch (error) {
    console.error(`❌ Error fetching products for manufacturers ${manufacturerIds}:`, error.message);
    return [];
  }
}

/**
 * Transform API response to our product format
 */
function transformProduct(item) {
  return {
    id: item.cssi_id,
    name: item.name,
    retailPrice: parseFloat(item.retail_price) || 0,
    customPrice: parseFloat(item.custom_price) || 0,
    mapPrice: item.map_price ? parseFloat(item.map_price) : null,
    inventory: item.inventory,
    inStock: item.in_stock_flag === 1,
    serialized: item.serialized_flag === 1,
    requiresFfl: item.ffl_flag === 1,
    dropShip: item.drop_ship_flag === 1,
    dropShipPrice: item.drop_ship_price ? parseFloat(item.drop_ship_price) : null,
    lastUpdated: new Date().toISOString()
  };
}

/**
 * Sync products for a category
 */
async function syncCategory(category, manufacturerIds) {
  console.log(`📦 Syncing ${category}...`);
  
  const products = await fetchProducts(manufacturerIds);
  
  if (products.length === 0) {
    console.log(`⚠️  No products found for ${category}`);
    return null;
  }

  const transformed = products.map(transformProduct);
  
  return {
    category,
    lastSynced: new Date().toISOString(),
    count: transformed.length,
    products: transformed
  };
}

/**
 * Save category data to JSON file
 */
function saveCategory(category, data) {
  const dataDir = path.join(__dirname, '..', 'data', 'products');
  
  // Create directory if it doesn't exist
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  const filePath = path.join(dataDir, `${category}.json`);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  console.log(`✅ Saved ${data.count} products to data/products/${category}.json`);
}

/**
 * Main sync function
 */
async function main() {
  console.log('🚀 Starting Chattanooga API sync...\n');

  for (const [category, manufacturerIds] of Object.entries(CATEGORIES)) {
    const data = await syncCategory(category, manufacturerIds);
    if (data) {
      saveCategory(category, data);
    }
  }

  console.log('\n✨ Sync complete!');
}

// Polyfill for fetch if needed
if (typeof fetch === 'undefined') {
  global.fetch = require('node-fetch');
}

main().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
