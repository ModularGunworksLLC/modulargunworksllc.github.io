#!/usr/bin/env node

/**
 * Chattanooga Shooting API Sync Script
 * Fetches live product data and syncs to local JSON files
 * 
 * Usage: node scripts/api-sync.js [category]
 * Example: node scripts/api-sync.js ammunition
 *          node scripts/api-sync.js all
 */

const https = require('https');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execSync } = require('child_process');

// API Configuration
// Can be overridden with environment variables: CHATTANOOGA_API_SID, CHATTANOOGA_API_TOKEN
const API_CONFIG = {
  baseUrl: 'api.chattanoogashooting.com',
  version: 'v4',
  sid: process.env.CHATTANOOGA_API_SID || '3E5B1B51AB84E327E32E0CE4478B84AD',
  token: process.env.CHATTANOOGA_API_TOKEN || '3E5B1B52C8F5F75446E38A1BBA9706B3',
};

// Category to API filter mappings
const CATEGORY_MAPPINGS = {
  ammunition: { apiFilter: 'Ammunition', path: 'data/products/ammunition.json' },
  guns: { apiFilter: 'Firearms', path: 'data/products/guns.json' },
  optics: { apiFilter: 'Optics & Sights', path: 'data/products/optics.json' },
  gear: { apiFilter: 'Tactical Gear', path: 'data/products/gear.json' },
  magazines: { apiFilter: 'Magazines', path: 'data/products/magazines.json' },
  reloading: { apiFilter: 'Reloading Supplies', path: 'data/products/reloading.json' },
  'gun-parts': { apiFilter: 'Gun Parts', path: 'data/products/gun-parts.json' },
};

// Initialize logger
const log = {
  info: (msg) => console.log(`[INFO] ${msg}`),
  success: (msg) => console.log(`✅ ${msg}`),
  error: (msg) => console.error(`❌ ${msg}`),
  warn: (msg) => console.warn(`⚠️  ${msg}`),
};

/**
 * Generate HTTP Basic Auth header
 * Format: Basic SID:MD5(token) - NO Base64 encoding
 */
function getAuthHeader() {
  const md5Token = crypto.createHash('md5').update(API_CONFIG.token).digest('hex');
  return `Basic ${API_CONFIG.sid}:${md5Token}`;
}

/**
 * Make HTTPS request to Chattanooga API
 */
function apiRequest(endpoint, options = {}) {
  return new Promise((resolve, reject) => {
    const url = `/rest/${API_CONFIG.version}${endpoint}`;
    
    const requestOptions = {
      hostname: API_CONFIG.baseUrl,
      path: url,
      method: 'GET',
      headers: {
        'Authorization': getAuthHeader(),
        'User-Agent': 'ModularGunworks/1.0',
      },
      ...options,
    };

    const req = https.request(requestOptions, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          if (res.statusCode === 200) {
            resolve(JSON.parse(data));
          } else {
            reject(new Error(`API returned status ${res.statusCode}: ${data}`));
          }
        } catch (e) {
          reject(new Error(`Failed to parse API response: ${e.message}`));
        }
      });
    });

    req.on('error', reject);
    req.end();
  });
}

/**
 * Extract caliber from product name/specs
 */
function extractCaliber(product) {
  const name = (product.name || '').toLowerCase();
  const specs = (product.specs || '').toLowerCase();
  const searchStr = name + ' ' + specs;

  // Shotgun gauges
  if (/12\s*gauge|12ga|\.410/i.test(searchStr)) return '12 Gauge';
  if (/20\s*gauge|20ga/i.test(searchStr)) return '20 Gauge';
  if (/28\s*gauge|28ga/i.test(searchStr)) return '28 Gauge';
  if (/\.410/i.test(searchStr)) return '.410';

  // Rifle calibers
  if (/\.338\s*lapua|338\s*lapua/i.test(searchStr)) return '.338 Lapua Magnum';
  if (/\.338\s*win|338\s*win/i.test(searchStr)) return '.338 Winchester';
  if (/\.308\s*win|308\s*win|7\.62x51/i.test(searchStr)) return '.308 Winchester';
  if (/\.300\s*win|300\s*win|300\s*magnum/i.test(searchStr)) return '.300 Winchester Magnum';
  if (/\.300\s*aac|300\s*aac/i.test(searchStr)) return '.300 AAC Blackout';
  if (/\.270\s*win|270\s*win/i.test(searchStr)) return '.270 Winchester';
  if (/\.243\s*win|243\s*win/i.test(searchStr)) return '.243 Winchester';
  if (/7\.62x39|7\.62x54|7\.62x45/i.test(searchStr)) return '7.62x39';
  if (/5\.56|5\.56x45|5\.56\s*nato/i.test(searchStr)) return '5.56 NATO';
  if (/\.223|223\s*rem/i.test(searchStr)) return '.223 Remington';
  if (/\.22-250|22-250/i.test(searchStr)) return '.22-250 Remington';
  if (/\.17\s*hmr|17\s*hmr/i.test(searchStr)) return '.17 HMR';
  if (/\.22\s*lr|22\s*lr/i.test(searchStr)) return '.22 LR';

  // Handgun calibers
  if (/\.45\s*acp|45\s*acp/i.test(searchStr)) return '.45 ACP';
  if (/\.40\s*s&w|40\s*s&w|40\s*sw/i.test(searchStr)) return '.40 S&W';
  if (/9\s*mm|9mm/i.test(searchStr)) return '9mm';
  if (/10\s*mm|10mm/i.test(searchStr)) return '10mm';
  if (/\.38\s*special|38\s*special|\.38\s*spl/i.test(searchStr)) return '.38 Special';
  if (/\.357\s*magnum|357\s*magnum|\.357\s*mag/i.test(searchStr)) return '.357 Magnum';
  if (/\.44\s*magnum|44\s*magnum|\.44\s*mag/i.test(searchStr)) return '.44 Magnum';
  if (/\.32\s*acp|32\s*acp/i.test(searchStr)) return '.32 ACP';
  if (/\.380\s*acp|380\s*acp/i.test(searchStr)) return '.380 ACP';

  return null;
}

/**
 * Extract bullet type from product info
 */
function extractBulletType(product) {
  const name = (product.name || '').toUpperCase();
  const specs = (product.specs || '').toUpperCase();
  const searchStr = name + ' ' + specs;

  if (/JHP|JACKETED HOLLOW/i.test(searchStr)) return 'Hollow Point';
  if (/HP(?!\w)/i.test(searchStr)) return 'Hollow Point';
  if (/FMJ|FULL METAL|FULL METAL JACKET/i.test(searchStr)) return 'FMJ';
  if (/SOFT\s*POINT|SOFT NOSE/i.test(searchStr)) return 'Soft Point';
  if (/TRAINING|RANGE|PRACTICE/i.test(searchStr)) return 'Training';
  if (/HUNTING|GAME/i.test(searchStr)) return 'Hunting';
  if (/PLATED|BRASS\s*PLATED/i.test(searchStr)) return 'Plated';
  if (/BONDED/i.test(searchStr)) return 'Bonded';

  return null;
}

/**
 * Extract casing type
 */
function extractCasingType(product) {
  const name = (product.name || '').toUpperCase();
  const specs = (product.specs || '').toUpperCase();
  const searchStr = name + ' ' + specs;

  if (/BRASS/i.test(searchStr)) return 'Brass';
  if (/STEEL|STEEL\s*CASE/i.test(searchStr)) return 'Steel';
  if (/ALUMINUM/i.test(searchStr)) return 'Aluminum';
  if (/PLASTIC|POLYMER|NICKEL/i.test(searchStr)) return 'Plastic';

  return null;
}

/**
 * Extract round count from product name
 */
function extractRoundCount(product) {
  const name = product.name || '';
  const match = name.match(/(\d+)\s*(?:round|rd|ct|count|pk)/i);
  return match ? parseInt(match[1]) : null;
}

/**
 * Determine ammo type
 */
function extractAmmoType(product) {
  const name = (product.name || '').toUpperCase();
  const specs = (product.specs || '').toUpperCase();
  const searchStr = name + ' ' + specs;

  if (/SHOTGUN|12GA|20GA|28GA|\.410/i.test(searchStr)) return 'Shotgun';
  if (/RIFLE|\.223|5\.56|\.308|7\.62|\.30-06|\.270|\.243/i.test(searchStr)) return 'Rifle';
  if (/HANDGUN|9MM|\.40|\.45|10MM|\.38|\.357/i.test(searchStr)) return 'Handgun';
  if (/RIMFIRE|\.22\s*LR|\.17\s*HMR|22LR/i.test(searchStr)) return 'Rimfire';
  if (/HUNTING|GAME|DEER/i.test(searchStr)) return 'Hunting';

  return null;
}

/**
 * Transform API product to our schema for display only
 * Only includes products suitable for web listing
 */
function transformProduct(apiProduct, category) {
  // Skip serialized items and FFL-required items for now
  if (apiProduct.serialized_flag === 1 || apiProduct.ffl_flag === 1) {
    return null;
  }

  // Skip items with no inventory or not in stock
  if (!apiProduct.in_stock_flag || apiProduct.inventory === 0) {
    return null;
  }

  const caliber = extractCaliber(apiProduct);
  const bulletType = extractBulletType(apiProduct);
  const casingType = extractCasingType(apiProduct);
  const roundCount = extractRoundCount(apiProduct);
  const ammoType = extractAmmoType(apiProduct);

  return {
    id: apiProduct.cssi_id,
    itemNumber: apiProduct.cssi_id,
    name: apiProduct.name,
    price: parseFloat(apiProduct.custom_price || apiProduct.retail_price || 0),
    mapPrice: parseFloat(apiProduct.map_price || 0),
    retailPrice: parseFloat(apiProduct.retail_price || 0),
    inventory: parseInt(apiProduct.inventory || 0),
    inStock: apiProduct.in_stock_flag === 1,
    category: category,
    caliber,
    bulletType,
    casingType,
    roundCount,
    ammoType,
    lastUpdated: new Date().toISOString(),
  };
}

/**
 * Fetch products from API with pagination
 */
async function fetchProductsByCategory(category, categoryConfig) {
  log.info(`Fetching ${category} from Chattanooga API...`);

  let allProducts = [];
  let page = 1;
  const pageSize = 100;
  let hasMore = true;
  let displayItems = 0;
  let skippedItems = 0;

  try {
    while (hasMore) {
      log.info(`  Loading page ${page}...`);

      // API accepts page and per_page parameters
      const endpoint = `/items?page=${page}&per_page=${pageSize}`;
      const response = await apiRequest(endpoint);

      if (response.items && response.items.length > 0) {
        const transformed = response.items
          .map(item => transformProduct(item, category))
          .filter(item => {
            if (item === null) {
              skippedItems++;
              return false;
            }
            displayItems++;
            return true;
          });
        
        allProducts = allProducts.concat(transformed);
        log.success(`  Loaded ${transformed.length} displayable items (${response.items.length} total, ${skippedItems} skipped)`);

        // Check if we have more pages
        if (response.pagination && response.pagination.page < response.pagination.page_count) {
          hasMore = true;
          page++;
        } else {
          hasMore = false;
        }
      } else {
        hasMore = false;
      }

      // Rate limiting - wait 500ms between requests
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    log.info(`Summary: ${displayItems} displayable products, ${skippedItems} items filtered (FFL/serialized/out-of-stock)`);
    return allProducts;
  } catch (error) {
    log.error(`Failed to fetch ${category}: ${error.message}`);
    return [];
  }
}

/**
 * Save products to JSON file
 */
function saveProducts(category, products, filePath) {
  try {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    const data = {
      category,
      lastUpdated: new Date().toISOString(),
      totalProducts: products.length,
      filters: {
        enabled: ['ammoType', 'caliber', 'brand', 'bulletType', 'casingType', 'roundCount', 'price', 'stock'],
        definitions: {
          ammoType: {
            label: 'Ammo Type',
            type: 'checkbox',
            searchable: false,
            showCount: 8,
            collapsible: true,
          },
          caliber: {
            label: 'Caliber',
            type: 'checkbox',
            searchable: true,
            showCount: 5,
            collapsible: true,
          },
          brand: {
            label: 'Brand',
            type: 'checkbox',
            searchable: true,
            showCount: 5,
            collapsible: true,
          },
          bulletType: {
            label: 'Bullet Type',
            type: 'checkbox',
            searchable: true,
            showCount: 6,
            collapsible: true,
          },
          casingType: {
            label: 'Casing Type',
            type: 'checkbox',
            searchable: false,
            showCount: 4,
            collapsible: true,
          },
          roundCount: {
            label: 'Round Count',
            type: 'checkbox',
            searchable: false,
            showCount: 8,
            collapsible: true,
          },
          price: {
            label: 'Price',
            type: 'range',
            searchable: false,
            min: 0,
            max: 10000,
            collapsible: true,
          },
          stock: {
            label: 'Stock Status',
            type: 'checkbox',
            searchable: false,
            showCount: 2,
            collapsible: true,
          },
        },
      },
      products,
    };

    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    log.success(`Saved ${products.length} products to ${filePath}`);
  } catch (error) {
    log.error(`Failed to save products: ${error.message}`);
  }
}

/**
 * Commit changes to git
 */
function commitChanges(filePath, category) {
  try {
    const repoPath = path.dirname(path.dirname(__dirname));
    
    // Add file
    execSync(`git -C "${repoPath}" add "${filePath}"`, { stdio: 'pipe' });
    
    // Commit
    const message = `chore: Sync ${category} products from Chattanooga API`;
    execSync(`git -C "${repoPath}" commit -m "${message}"`, { stdio: 'pipe' });
    
    log.success(`Committed ${category} changes to git`);
  } catch (error) {
    // Commit may fail if there are no changes - that's okay
    log.warn(`Git commit skipped for ${category} (no changes or error): ${error.message}`);
  }
}

/**
 * Main sync function
 */
async function syncProducts(categoryArg = 'all') {
  log.info('Starting Chattanooga Shooting API sync...\n');

  const categoriesToSync = categoryArg === 'all' 
    ? Object.keys(CATEGORY_MAPPINGS)
    : [categoryArg];

  for (const category of categoriesToSync) {
    if (!CATEGORY_MAPPINGS[category]) {
      log.error(`Unknown category: ${category}`);
      continue;
    }

    const categoryConfig = CATEGORY_MAPPINGS[category];
    const products = await fetchProductsByCategory(category, categoryConfig);

    if (products.length > 0) {
      const filePath = path.join(__dirname, '..', categoryConfig.path);
      saveProducts(category, products, filePath);
      commitChanges(filePath, category);
      log.info('');
    } else {
      log.warn(`No products found for category: ${category}`);
    }
  }

  log.success('API sync completed!');
}

// CLI argument handling
const args = process.argv.slice(2);
const category = args[0] || 'all';

syncProducts(category).catch(error => {
  log.error(`Fatal error: ${error.message}`);
  process.exit(1);
});
