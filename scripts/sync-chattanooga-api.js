const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Chattanooga API credentials from environment variables
const API_SID = process.env.API_SID;
const API_TOKEN = process.env.API_TOKEN;
const API_BASE = 'https://api.chattanoogashooting.com/rest/v5';

// Category to Manufacturer ID mapping
const CATEGORY_MAPPING = {
  ammunition: 1,        // Ammunition
  magazines: 2,         // Magazines
  'gun-parts': 3,       // Gun Parts
  gear: 4,              // Tactical Gear
  optics: 5,            // Optics & Sights
  reloading: 6,         // Reloading
  survival: 7           // Survival Gear
};

/**
 * Generate MD5 hash for authentication
 */
function generateAuthHash(token) {
  return crypto.createHash('md5').update(token).digest('hex');
}

/**
 * Fetch products from Chattanooga API
 */
async function fetchProducts(manufacturerId) {
  try {
    const authHash = generateAuthHash(API_TOKEN);
    const url = `${API_BASE}/products?SID=${API_SID}&filter=manufacturerId:${manufacturerId}`;
    
    console.log(`Fetching products for manufacturer ${manufacturerId}...`);
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `Basic ${Buffer.from(`${API_SID}:${authHash}`).toString('base64')}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data.products || [];
  } catch (error) {
    console.error(`Error fetching products for manufacturer ${manufacturerId}:`, error.message);
    return [];
  }
}

/**
 * Transform API product to our format
 */
function transformProduct(apiProduct) {
  return {
    id: apiProduct.id || '',
    name: apiProduct.name || 'Unknown Product',
    brand: apiProduct.brand || 'Generic',
    category: apiProduct.category || '',
    description: apiProduct.description || '',
    image: apiProduct.image || '/images/products/placeholder.jpg',
    retailPrice: parseFloat(apiProduct.retailPrice || 0),
    customPrice: parseFloat(apiProduct.salePrice || apiProduct.retailPrice || 0),
    inventory: parseInt(apiProduct.inventory || 0),
    sku: apiProduct.sku || '',
    requiresFFL: apiProduct.requiresFFL === true || apiProduct.requiresFFL === 1,
    specs: apiProduct.specs || {}
  };
}

/**
 * Save products to JSON file
 */
function saveProducts(category, products) {
  const dir = path.join(__dirname, '../data/products');
  
  // Ensure directory exists
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const filepath = path.join(dir, `${category}.json`);
  const data = {
    category,
    lastUpdated: new Date().toISOString(),
    products: products.map(transformProduct)
  };

  fs.writeFileSync(filepath, JSON.stringify(data, null, 2));
  console.log(`✓ Saved ${products.length} products to ${category}.json`);
}

/**
 * Main sync function
 */
async function syncAllProducts() {
  console.log('Starting Chattanooga API sync...\n');
  
  if (!API_SID || !API_TOKEN) {
    console.error('❌ Error: API_SID and API_TOKEN environment variables are required');
    process.exit(1);
  }

  try {
    for (const [category, manufacturerId] of Object.entries(CATEGORY_MAPPING)) {
      const products = await fetchProducts(manufacturerId);
      saveProducts(category, products);
    }
    
    console.log('\n✓ Sync completed successfully!');
  } catch (error) {
    console.error('❌ Sync failed:', error);
    process.exit(1);
  }
}

// Run the sync
syncAllProducts();
