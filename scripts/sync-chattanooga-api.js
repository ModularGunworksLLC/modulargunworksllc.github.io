const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Chattanooga API credentials from environment variables
const API_SID = process.env.API_SID;
const API_TOKEN = process.env.API_TOKEN;
const API_BASE = 'https://api.chattanoogashooting.com/rest/v4';

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
 * Get authentication header for Chattanooga API
 * Format: Authorization: Basic SID:MD5HASH (no base64 encoding)
 */
function getAuthHeader(token) {
  // Always MD5 hash the token
  const tokenHash = crypto.createHash('md5').update(token).digest('hex');
  
  // Format: Basic SID:MD5HASH (no base64 encoding as per API v4 requirements)
  const authValue = `${API_SID}:${tokenHash}`;
  return `Basic ${authValue}`;
}

/**
 * Fetch products from Chattanooga API - without manufacturer filtering
 */
async function fetchAllProducts(page = 1) {
  try {
    const url = `${API_BASE}/items?page=${page}&per_page=50`;
    const authHeader = getAuthHeader(API_TOKEN);
    
    console.log(`Fetching products (page ${page})...`);
    console.log(`  URL: ${url}`);
    
    const response = await fetch(url, {
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json'
      }
    });

    console.log(`  Response Status: ${response.status}`);
    
    if (!response.ok) {
      const responseText = await response.text();
      console.log(`  Response Body: ${responseText.substring(0, 300)}`);
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log(`  Items Count: ${data.items ? data.items.length : 0}`);
    console.log(`  Total Pages: ${data.pagination ? data.pagination.page_count : 'unknown'}`);
    if (data.items && data.items.length > 0) {
      console.log(`  First item:`, JSON.stringify(data.items[0]).substring(0, 200));
    }
    return data;
  } catch (error) {
    console.error(`Error fetching products:`, error.message);
    return { items: [], pagination: {} };
  }
}

/**
 * Transform API product to our format
 */
function transformProduct(apiProduct) {
  // Build image URL from product ID
  const imageUrl = apiProduct.cssi_id 
    ? `https://images.chattanoogashooting.com/products/${apiProduct.cssi_id.toLowerCase()}.jpg`
    : '/images/products/placeholder.jpg';

  return {
    id: apiProduct.cssi_id || '',
    name: apiProduct.name || 'Unknown Product',
    brand: apiProduct.brand || 'Generic',
    category: apiProduct.category || '',
    description: apiProduct.description || '',
    image: imageUrl,
    price: parseFloat(apiProduct.retail_price || 0),
    salePrice: parseFloat(apiProduct.custom_price || apiProduct.retail_price || 0),
    retailPrice: parseFloat(apiProduct.retail_price || 0),
    customPrice: parseFloat(apiProduct.custom_price || apiProduct.retail_price || 0),
    inventory: parseInt(apiProduct.inventory || 0),
    sku: apiProduct.sku || '',
    requiresFFL: apiProduct.ffl_flag === 1 || apiProduct.ffl_flag === true,
    specs: apiProduct.specs || {},
    inStock: apiProduct.in_stock_flag === 1,
    mapPrice: apiProduct.map_price || ''
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
 * Main sync function - fetch all products and distribute by category
 */
async function syncAllProducts() {
  console.log('Starting Chattanooga API sync...\n');
  
  if (!API_SID || !API_TOKEN) {
    console.error('❌ Error: API_SID and API_TOKEN environment variables are required');
    process.exit(1);
  }

  try {
    // Fetch all products from API
    let allProducts = [];
    let page = 1;
    let hasMore = true;
    
    while (hasMore) {
      const response = await fetchAllProducts(page);
      if (response.items && response.items.length > 0) {
        allProducts = allProducts.concat(response.items);
        page++;
        // Check if there are more pages
        const pagination = response.pagination || {};
        hasMore = page <= (pagination.page_count || 0);
      } else {
        hasMore = false;
      }
    }
    
    console.log(`\nTotal products fetched: ${allProducts.length}\n`);
    
    if (allProducts.length === 0) {
      console.log('⚠️  No products found in API. Saving empty files.');
      for (const category of Object.keys(CATEGORY_MAPPING)) {
        saveProducts(category, []);
      }
    } else {
      // For now, save all products to each category file for testing
      // In production, you'd distribute by category/manufacturer
      for (const category of Object.keys(CATEGORY_MAPPING)) {
        saveProducts(category, allProducts);
      }
    }
    
    console.log('\n✓ Sync completed successfully!');
  } catch (error) {
    console.error('❌ Sync failed:', error);
    process.exit(1);
  }
}

// Run the sync
syncAllProducts();
