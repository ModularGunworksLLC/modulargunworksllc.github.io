const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Chattanooga API credentials
const API_SID = process.env.API_SID;
const API_TOKEN = process.env.API_TOKEN;
const API_BASE = 'https://api.chattanoogashooting.com/rest/v4';

/**
 * Smart category detection with exclusion logic
 * Prioritizes most specific categories first to prevent misclassification
 */
function categorizeProduct(product) {
  const name = (product.name || '').toUpperCase();
  
  // ===== RELOADING (highest priority) =====
  
  // Reloading powder brands
  if (/^(BLACKHORN|ACCURATE|SCOT POWDER|HODGDON|IMR|ALLIANT|VIHTAVUORI|UNIQUE|2400|BLUE DOT|CFE|H110|H4895|3031|4064|4350|WIN RELOADING|LYMAN|RCBS|LEE|FRANKFORD|DILLON|REDDING|SINCLAIR|CORBON DPX|LOAD MASTER)/i.test(name)) {
    return 'reloading';
  }
  
  // Reloading powder keywords
  if (/(RELOADING POWDER|SMOKELESS POWDER|BLACKPOWDER|MUZZLELOADING POWDER|HANDLOAD POWDER)/i.test(name)) {
    return 'reloading';
  }
  
  // Reloading PRIMERS - has priority over magazine "MAG" pattern
  if (/(PRIMER|PRIMERS).*(?:SMALL|LARGE|RIFLE|PISTOL|MAGNUM|SHOTGUN)/i.test(name) || 
      /CCI\s*#\d+.*PRIMER/i.test(name) ||
      /FEDERAL\s*\d+.*PRIMER/i.test(name)) {
    return 'reloading';
  }
  
  // Reloading bullets with .XXX DIA format (component bullets, not ammunition)
  if (/\.(?:224|243|257|264|277|284|308|311|323|338|355|357|375|401|429|452|458|474|510).*DIA.*(?:GR|GRAIN)/i.test(name) ||
      /JACKETED.*BULLET/i.test(name) ||
      /^(?:SPEER|HORNADY|SIERRA|NOSLER).*(?:BULLET|PROJECTILE)/i.test(name)) {
    return 'reloading';
  }
  
  // Brass - new or fired
  if (/(BRASS|UNPRIMED|FIRED BRASS|NEW BRASS|ONCE FIRED|RELOADER)/i.test(name)) {
    return 'reloading';
  }
  
  // Reloading equipment
  if (/(CASE PREP|CASE TRIMMER|TRIMMER|CALIPER|CALIPERS|SCALE|BALANCE|TUMBLER|MEDIA|POLISH|RELOADING PRESS|PROGRESSIVE|TURRET|SINGLE STAGE)/i.test(name)) {
    return 'reloading';
  }
  
  // ===== AMMUNITION (finished cartridges only) =====
  // Must NOT match .XXX DIA or component patterns
  if (!/\.(?:224|243|257|264|277|284|308|311|323|338|355|357|375|401|429|452|458|474|510).*DIA|JACKETED.*BULLET/i.test(name)) {
    
    // Specific finished ammo caliber patterns
    if (/(?:9MM|9X19|40\s*S&W|45\s*ACP|380|357|38\s*SPL|44\s*MAG|10MM|45\s*GAP|22\s*LR|22\s*WMR|5\.56|223|308|30-06|300|7\.62|338|375|7\.7|303|7\.5|9\.3|6\.5|270|30-30|3006).*(?:GRAIN|GR|AMMO|ROUND|LOAD|BOX|CASE|SHOT|SHELL|FMJ|JHP|POINT|HOLLOW|DEFENSE|HOLLOW POINT)/i.test(name)) {
      return 'ammunition';
    }
    
    // Shotgun ammunition
    if (/(?:12GA|20GA|16GA|10GA|.410|3IN|3\.5IN|2\.75IN).*(?:SHOT|SHELL|AMMO|SLUG|BUCKSHOT|OZ|GRAIN)/i.test(name)) {
      return 'ammunition';
    }
    
    // Major ammo brands with clear ammo keywords (exclude PRIMERS)
    if (!(/ PRIMER/i.test(name))) {
      if (/(FEDERAL|REMINGTON|HORNADY|WINCHESTER|BLAZER|WOLF|TULAMMO|FIOCCHI|PMC|AGUILA|AMERICAN|ARMSCOR|MAGTECH|NORMA|PERFECTA|PPU|ROCKY|VISTA|SELLIER|MATCH GRADE|CRITICAL|HYDROSHOCK|EXPANSION|HYDRA-SHOK|AMERICAN EAGLE)/i.test(name) &&
          /(?:AMMO|AMMUNITION|ROUND|ROUNDS|BOX|LOAD|CARTRIDGE|SHELL|SHELLS|9MM|40|45|308|223|556|380|357|38|44|50BMG|12GA|20GA|16GA|10GA)/i.test(name)) {
        return 'ammunition';
      }
    }
  }
  
  // ===== MAGAZINES (exclude items with PRIMER in name) =====
  if (!/PRIMER/i.test(name)) {
    // Magazine with round capacity
    if (/MAGAZINE.*\d+(?:RD|ROUND)/i.test(name) || /(?:^|\s)MAG\s*\d+/i.test(name)) {
      return 'magazines';
    }
    
    // Magazine brands
    if (/(MAGPUL|PMAG|OKAY|ETS|KCI|GLOCK|SIG|SMITH|RUGER|COLT|TAURUS|SPRINGFIELD|CHECKMATE|US PALM|LANCER|TROY|SURFIRE|BERETTA|WALTHER|CZ).*(?:MAGAZINE|MAG|CLIP)/i.test(name)) {
      return 'magazines';
    }
  }
  
  // ===== OPTICS =====
  if (/(SCOPE|SIGHT|OPTIC|RED DOT|LASER|HOLOGRAPHIC|THERMAL|NIGHT VISION|NV|ACOG|EOTECH|TRIJICON|VORTEX|LEUPOLD|BUSHNELL|ZEISS|SWAMPFOX|HOLOSUN|PRIMARY ARMS|VISIONKING|SIGHTMARK)/i.test(name)) {
    return 'optics';
  }
  
  // ===== GUN PARTS =====
  if (/(SLIDE|RECEIVER|BARREL|CHARGING HANDLE|HANDGUARD|TRIGGER|SAFETY|SELECTOR|MUZZLE BRAKE|SUPPRESSOR|FLASH HIDER|BUFFER|BCG|BOLT CARRIER|LOWER|UPPER|FRAME|HAMMER|SEAR|RECOIL SPRING|EXTRACTOR|EJECTOR)/i.test(name)) {
    return 'gun-parts';
  }
  
  // ===== SURVIVAL =====
  if (/(KNIFE|BLADE|PARACORD|ROPE|FLASHLIGHT|FIRE|STARTER|COMPASS|EMERGENCY|SURVIVAL|CAMPING|MULTI.?TOOL|AXE|HATCHET|SAW)/i.test(name)) {
    return 'survival';
  }
  
  // GEAR - everything else by default
  return 'gear';
}

/**
 * Get authentication header for API
 */
function getAuthHeader(token) {
  const tokenHash = crypto.createHash('md5').update(token).digest('hex');
  return `Basic ${API_SID}:${tokenHash}`;
}

/**
 * Fetch products from Chattanooga API
 */
async function fetchAllProducts(page = 1) {
  try {
    const url = `${API_BASE}/items?page=${page}&per_page=50`;
    const authHeader = getAuthHeader(API_TOKEN);
    
    const response = await fetch(url, {
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`Error fetching page ${page}:`, error.message);
    return { items: [], pagination: {} };
  }
}

/**
 * Transform API product to local format
 */
function transformProduct(apiProduct) {
  const imageUrl = apiProduct.cssi_id 
    ? `https://images.chattanoogashooting.com/products/${apiProduct.cssi_id.toLowerCase()}.jpg`
    : '/images/products/placeholder.jpg';

  return {
    id: apiProduct.cssi_id || '',
    name: apiProduct.name || 'Unknown Product',
    brand: apiProduct.brand || 'Generic',
    category: '',  // Will be set later
    image: imageUrl,
    retailPrice: parseFloat(apiProduct.retail_price || 0),
    salePrice: parseFloat(apiProduct.custom_price || apiProduct.retail_price || 0),
    inventory: parseInt(apiProduct.inventory || 0),
    inStock: apiProduct.in_stock_flag === 1,
    requiresFFL: apiProduct.ffl_flag === 1
  };
}

/**
 * Save products to JSON file
 */
function saveProducts(category, products) {
  const dir = path.join(__dirname, '../data/products');
  
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const filepath = path.join(dir, `${category}.json`);
  const data = {
    category,
    lastUpdated: new Date().toISOString(),
    products: products
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
    console.error('❌ Error: API_SID and API_TOKEN environment variables required');
    process.exit(1);
  }

  try {
    // Fetch all products
    let allProducts = [];
    let page = 1;
    let hasMore = true;
    
    while (hasMore) {
      const response = await fetchAllProducts(page);
      if (response.items && response.items.length > 0) {
        allProducts = allProducts.concat(response.items);
        page++;
        const pagination = response.pagination || {};
        hasMore = page <= (pagination.page_count || 0);
      } else {
        hasMore = false;
      }
    }
    
    console.log(`\nTotal products fetched: ${allProducts.length}\n`);
    
    // Transform and categorize products
    const transformedProducts = allProducts.map(apiProduct => {
      const product = transformProduct(apiProduct);
      product.category = categorizeProduct(apiProduct);
      return product;
    });
    
    // Group by category
    const categorizedProducts = {
      ammunition: [],
      magazines: [],
      reloading: [],
      'gun-parts': [],
      optics: [],
      gear: [],
      survival: []
    };
    
    transformedProducts.forEach(product => {
      if (categorizedProducts[product.category]) {
        categorizedProducts[product.category].push(product);
      } else {
        categorizedProducts['gear'].push(product);
      }
    });
    
    // Save each category
    let totalSaved = 0;
    for (const [category, products] of Object.entries(categorizedProducts)) {
      saveProducts(category, products);
      totalSaved += products.length;
    }
    
    console.log(`\nCategory breakdown:`);
    for (const [category, products] of Object.entries(categorizedProducts)) {
      console.log(`  ${category.padEnd(15)}: ${products.length} products`);
    }
    
    console.log(`\n✓ Sync completed! Total: ${totalSaved} products`);
  } catch (error) {
    console.error('❌ Sync failed:', error);
    process.exit(1);
  }
}

syncAllProducts();
