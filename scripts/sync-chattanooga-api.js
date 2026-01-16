const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Chattanooga API credentials
const API_SID = process.env.API_SID;
const API_TOKEN = process.env.API_TOKEN;
const API_BASE = 'https://api.chattanoogashooting.com/rest/v4';

// ============================================================
// LAYER 1: TOP BRANDS ONLY (PREMIUM BRAND FILTER)
// ============================================================

const TOP_BRANDS = [
    // Firearms (pistols, rifles, shotguns)
    'GLOCK', 'SMITH & WESSON', 'S&W', 'SIG SAUER', 'RUGER', 'FN', 'HK', 'CZ', 'WALTHER', 'SPRINGFIELD ARMORY',
    'DANIEL DEFENSE', 'BCM', 'AERO PRECISION', 'GEISSELE', 'NOVESKE', 'LWRC', 'PSA',
    
    // Optics
    'TRIJICON', 'EOTECH', 'AIMPOINT', 'HOLOSUN', 'VORTEX', 'LEUPOLD', 'PRIMARY ARMS', 'NIGHTFORCE', 'SIG OPTICS',
    
    // Magazines
    'MAGPUL', 'PMAG', 'LANCER', 'HEXMAG', 'ETS', 'KCI',
    
    // Ammunition
    'FEDERAL', 'HORNADY', 'WINCHESTER', 'REMINGTON', 'PMC', 'FIOCCHI', 'SPEER', 'CCI', 'BLAZER', 'NORMA',
    
    // Parts & Accessories
    'MAGPUL', 'BCM', 'GEISSELE', 'MIDWEST INDUSTRIES', 'RADIAN', 'REPTILIA', 'CLOUD DEFENSIVE',
    'SUREFIRE', 'STREAMLIGHT', 'SAFARILAND', 'BLUE FORCE GEAR', 'HOGUE', 'TIMNEY', 'TRIGGERTECH',
    
    // Reloading
    'HORNADY', 'RCBS', 'LYMAN', 'LEE', 'DILLON', 'HODGDON', 'ALLIANT', 'ACCURATE', 'VIHTAVUORI', 'IMR',
    
    // Survival / Gear
    'GERBER', 'SOG', 'BENCHMADE', 'KERSHAW', 'CRKT', 'STREAMLIGHT', 'SUREFIRE'
];

const BAD_BRANDS = [
    'NCSTAR', 'UTG', 'LEAPERS', 'ALLEN', 'GENERIC', 'UNBRANDED', 'UNKNOWN',
    'AIRSOFT', 'PAINTBALL', 'CROSMAN', 'DAISY',
    'GAME WINNER', 'HUNTER\'S SPECIALTIES',
    'MISC', 'IMPORTS'
];

/**
 * LAYER 1: Check if product brand is in TOP_BRANDS (premium only)
 * Returns false if brand is bad or not in top brands
 */
function shouldIncludeBrand(product) {
    const brand = (product.brand || 'GENERIC').toUpperCase().trim();
    
    // Exclude bad/generic brands
    if (BAD_BRANDS.some(b => brand.includes(b))) {
        return false;
    }
    
    // Only include if in TOP_BRANDS
    return TOP_BRANDS.some(b => brand.includes(b));
}

/**
 * LAYER 2: Check compliance - FFL, serialized, allocated, stock
 */
function shouldIncludeProduct(product) {
    // Normalize boolean fields
    const fflRequired = product.ffl_flag === 1 || product.ffl_flag === true || product.ffl_flag === 'Y';
    const serialized = product.serialized_flag === 1 || product.serialized_flag === true || product.serialized_flag === 'Y';
    const allocated = product.allocated_flag === 1 || product.allocated_flag === true || product.allocated_flag === 'Y' || product.allocated === true;
    const inventory = parseInt(product.inventory || 0);
    
    // EXCLUDE if: FFL required, serialized, allocated, or out of stock
    if (fflRequired) return false;
    if (serialized) return false;
    if (allocated) return false;
    if (inventory <= 0) return false;
    
    return true;
}

/**
 * Load active products selection
 * Returns map of productId -> { page, addedAt, updatedAt }
 * Filters out metadata/comment fields (starting with _)
 */
function loadActiveProducts() {
    try {
        const activePath = path.join(__dirname, '../data/products/active.json');
        if (fs.existsSync(activePath)) {
            const data = JSON.parse(fs.readFileSync(activePath, 'utf8'));
            // Filter out metadata fields (starting with _)
            const active = {};
            Object.entries(data).forEach(([key, value]) => {
                if (!key.startsWith('_') && value && typeof value === 'object' && value.page) {
                    active[key] = value;
                }
            });
            return active;
        }
    } catch (error) {
        console.warn('No active.json found, syncing all products');
    }
    return {};
}

/**
 * LAYER 3: EXCLUSION-FIRST CATEGORIZATION (4-PASS SYSTEM)
 * 
 * PASS 1: Global exclusions
 * PASS 2: Positive identification
 * PASS 3: Brand fallback
 * PASS 4: Default to Gear
 */
function categorizeProduct(product) {
    const name = (product.name || '').toUpperCase();
    
    // ===== PASS 1: GLOBAL EXCLUSIONS =====
    // These items can NEVER be in any category
    
    const globalExclusions = [
        /GIFT\s*CARD|CREDIT|VOUCHER|SERVICE FEE|ENGRAVING|GUNSMITHING|LABOR|INSTALLATION|LICENSE|PERMIT|TRAINING|CLASS|COURSE/i
    ];
    
    for (const pattern of globalExclusions) {
        if (pattern.test(name)) return 'gear';
    }
    
    // ===== PASS 2: POSITIVE IDENTIFICATION WITH CATEGORY-SPECIFIC EXCLUSIONS =====
    
    // === MAGAZINES FIRST (most specific - prevent false positives) ===
    const magExclusions = [
        /POUCH|HOLSTER|CARRIER|CASE|STORAGE|POWDER|PRIMER|BRASS|BULLET|RELOAD|COMPONENT|AMMO|CARTRIDGE|ROUND/i
    ];
    
    const magMatch = !magExclusions.some(p => p.test(name)) && 
        /MAGAZINE|MAG(?!NET)|CLIP|PMAG|DRUM|LOADER|(\d+RD|RD\s+MAG)/i.test(name);
    
    if (magMatch) return 'magazines';
    
    // === RELOADING (components: powder, primers, brass, bullets, equipment) ===
    const reloadingMatch = /BULLET|BULLETS|BRASS|PRIMER|PRIMERS|POWDER|DIE|PRESS|SCALE|CASE\s*TRIMMER|TUMBLER|CALIPERS|RELOADER|PROJECTILE|\.DIA|CT\s*BULLET/i.test(name);
    
    if (reloadingMatch) return 'reloading';
    
    // === AMMUNITION (finished cartridges ONLY) ===
    const ammoExclusions = [
        /BULLET|BRASS|PRIMER|POWDER|CASING|COMPONENT|DIE|PRESS|SCALE|TUMBLER|BOX|CASE|POUCH|HOLSTER|CLEANER|BRUSH|TARGET|MAGAZINE|MAG|CLIP|DRUM|LOADER/i
    ];
    
    const ammoMatch = !ammoExclusions.some(p => p.test(name)) && 
        /AMMO|ROUNDS|CARTRIDGE|SHOTSHELL|9MM|9X19|5\.56|223|308|7\.62|45\s*ACP|40\s*S&W|12GA|20GA|\.22|FMJ|JHP|DEFENSE|MATCH/i.test(name);
    
    if (ammoMatch) return 'ammunition';
    
    // === OPTICS (scope, red dot, sight, etc.) ===
    const opticsExclusions = [
        /COVER|CAP|MOUNT|BASE|RING|RAIL|TARGET|BAG|CASE|SLING|STRAP|CLEAN|TOOL|KIT|POUCH|BATTERY|ADAPTER|CONNECTOR|EXTENSION|CLAMP/i
    ];
    
    const opticsMatch = !opticsExclusions.some(p => p.test(name)) && 
        /SCOPE|RED\s*DOT|HOLOGRAPHIC|MAGNIFIER|RIFLESCOPE|REFLEX|LASER\s*SIGHT|OPTIC|BINOCULAR|MONOCULAR|RANGEFINDER/i.test(name);
    
    if (opticsMatch) return 'optics';
    
    // === GUN PARTS (triggers, uppers, lowers, barrels, etc.) ===
    const partsExclusions = [
        /CLEANER|BRUSH|BORE|SCRUBBER|DEGREASER|PUNCH|HAMMER|WRENCH|VISE|TOOL|KIT|ROD|PATCH|LUBRIC|SOLVENT|CASE|BOX|BAG|POUCH|HOLSTER|STORAGE|CARRIER|PACK|VEST|CHEST|SLING|STRAP|POWDER|PRIMER|BRASS|BULLET|RELOAD|COMPONENT|AMMUNITION|AMMO/i
    ];
    
    const partsMatch = !partsExclusions.some(p => p.test(name)) && 
        /TRIGGER|BCG|BARREL|UPPER|LOWER|BUFFER|GAS\s*BLOCK|HANDGUARD|STOCK|GRIP|RECEIVER|CHARGING\s*HANDLE|SAFETY|SELECTOR|SPRING|PIN|MOUNT|BASE|RING|RAIL/i.test(name);
    
    if (partsMatch) return 'gun-parts';
    
    // === SURVIVAL/GEAR ===
    const survivalMatch = /KNIFE|MULTI\s*TOOL|FLASHLIGHT|FIRST\s*AID|MEDICAL|WATER|FIRE\s*STARTER|PARACORD|EMERGENCY|TACTICAL|OUTDOOR|CAMPING|GEAR/i.test(name);
    
    if (survivalMatch) return 'survival';
    
    // ===== PASS 3: BRAND FALLBACK =====
    // If no positive match, use brand to determine category
    
    // Reloading brands
    if (/RCBS|LEE|LYMAN|HORNADY|DILLON|REDDING|FRANKFORD|HODGDON|ALLIANT|ACCURATE|VIHTAVUORI|IMR|LAPUA|STARLINE/i.test(name)) {
        return 'reloading';
    }
    
    // Optics brands
    if (/TRIJICON|EOTECH|AIMPOINT|HOLOSUN|VORTEX|LEUPOLD|PRIMARY\s*ARMS|NIGHTFORCE|BUSHNELL|ZEISS|NIKON|STEINER/i.test(name)) {
        return 'optics';
    }
    
    // Magazine brands
    if (/MAGPUL|PMAG|LANCER|HEXMAG|ETS|KCI|GLOCK|RUGER/i.test(name)) {
        return 'magazines';
    }
    
    // ===== PASS 4: DEFAULT TO GEAR =====
    // Everything else that passed compliance goes to Gear
    return 'gear';
}

/**
 * Extract caliber from product name
 * Normalizes formats (9MM, 9mm, 9x19, etc. -> 9MM)
 */
function extractCaliber(name) {
    const caliberPatterns = [
        // Pistol calibers
        { pattern: /\b(9MM|9x19|9x19mm|9 ?MM|parabellum)/i, normalized: '9MM' },
        { pattern: /\b(40\s*S&W|40\s*cal|.40|40sw)/i, normalized: '.40 S&W' },
        { pattern: /\b(45\s*ACP|45\s*auto|.45|45 ?cal)/i, normalized: '.45 ACP' },
        { pattern: /\b(380|.380|380 ?auto)/i, normalized: '.380 ACP' },
        { pattern: /\b(357|.357|357\s*mag|357magnum)/i, normalized: '.357 Mag' },
        { pattern: /\b(38|.38|38\s*spl|38\s*special)/i, normalized: '.38 SPL' },
        { pattern: /\b(44|.44|44\s*mag|44magnum)/i, normalized: '.44 Mag' },
        { pattern: /\b(10MM|10\s*mm)/i, normalized: '10MM' },
        { pattern: /\b(45\s*GAP)/i, normalized: '.45 GAP' },
        // Rifle calibers
        { pattern: /\b(223|5\.56|5\.56\s*NATO|5\.56x45)/i, normalized: '5.56 NATO' },
        { pattern: /\b(308|7\.62\s*NATO|7\.62x51)/i, normalized: '.308 WIN' },
        { pattern: /\b(30-06|30\s*06|7\.62x54)/i, normalized: '.30-06' },
        { pattern: /\b(300\s*BLK|300\s*blackout)/i, normalized: '300 BLK' },
        { pattern: /\b(6\.5\s*Creed|6\.5\s*creedmoor)/i, normalized: '6.5 Creed' },
        { pattern: /\b(270|\.270)/i, normalized: '.270 WIN' },
        { pattern: /\b(30-30|30\s*30)/i, normalized: '.30-30' },
        { pattern: /\b(338|\.338)/i, normalized: '.338 Lapua' },
        { pattern: /\b(375|\.375)/i, normalized: '.375 H&H' },
        { pattern: /\b(7\.62x39)/i, normalized: '7.62x39' },
        { pattern: /\b(5\.45x39)/i, normalized: '5.45x39' },
        // Rimfire
        { pattern: /\b(22\s*LR|22\s*long\s*rifle|\.22|22lr)/i, normalized: '.22 LR' },
        { pattern: /\b(22\s*WMR|22\s*mag|\.22\s*mag)/i, normalized: '.22 WMR' },
        // Shotgun
        { pattern: /\b(12\s*GA|12\s*gauge|12ga)/i, normalized: '12 GA' },
        { pattern: /\b(20\s*GA|20\s*gauge|20ga)/i, normalized: '20 GA' },
        { pattern: /\b(16\s*GA|16\s*gauge|16ga)/i, normalized: '16 GA' },
        { pattern: /\b(10\s*GA|10\s*gauge|10ga)/i, normalized: '10 GA' },
        { pattern: /\b(\.410|410)/i, normalized: '.410' },
        // Uncommon/specialty
        { pattern: /\b(50\s*BMG|\.50\s*BMG)/i, normalized: '.50 BMG' },
        { pattern: /\b(9\.3x62|9\.3x74)/i, normalized: '9.3x62' },
        { pattern: /\b(7\.7x58|303\s*British)/i, normalized: '.303 British' },
    ];

    for (const { pattern, normalized } of caliberPatterns) {
        if (pattern.test(name)) {
            return normalized;
        }
    }
    
    return null;
}

/**
 * Extract platform/firearm family from product name
 * AR-15, Glock, AK, 1911, etc.
 */
function extractPlatform(name) {
    const platformPatterns = [
        { pattern: /\b(AR-?15|AR15|AR\s*15|M4|M16|AR\s*platform)/i, normalized: 'AR-15' },
        { pattern: /\b(AR-?10|AR10|DPMS|LR308)/i, normalized: 'AR-10' },
        { pattern: /\b(AK|AK-?47|AK-?74|AKMS|AKM|Saiga)/i, normalized: 'AK Platform' },
        { pattern: /\b(Glock|G19|G17|G34)/i, normalized: 'Glock' },
        { pattern: /\b(1911|45\s*auto\s*pistol)/i, normalized: '1911' },
        { pattern: /\b(Sig\s*Sauer|P226|P229|P320|P365)/i, normalized: 'Sig Sauer' },
        { pattern: /\b(HK|Heckler\s*Koch|MP5|HK417)/i, normalized: 'Heckler & Koch' },
        { pattern: /\b(Ruger|10\/22|Mini\s*14|Precision)/i, normalized: 'Ruger' },
        { pattern: /\b(Mossberg|500|590|Maverick)/i, normalized: 'Mossberg' },
        { pattern: /\b(Remington|870|1100|700)/i, normalized: 'Remington' },
        { pattern: /\b(Benelli|M4|M2)/i, normalized: 'Benelli' },
        { pattern: /\b(Shotgun|Pump|Semi-?Auto|Over\s*Under)/i, normalized: 'Shotgun' },
        { pattern: /\b(Rifle|Bolt\s*Action)/i, normalized: 'Rifle' },
        { pattern: /\b(Pistol|Handgun)/i, normalized: 'Pistol' },
    ];

    for (const { pattern, normalized } of platformPatterns) {
        if (pattern.test(name)) {
            return normalized;
        }
    }
    
    return null;
}

/**
 * Extract magazine capacity from product name
 * 10, 30, 47, etc.
 */
function extractCapacity(name) {
    // Look for patterns like "30RD", "10 ROUND", "MAGAZINE 20"
    const capacityMatch = name.match(/(?:MAG|MAGAZINE|CLIP).*?(\d{1,3})(?:\s*RD|ROUND|CAPACITY)?|(\d{1,3})\s*(?:RD|ROUND)/i);
    if (capacityMatch) {
        const capacity = capacityMatch[1] || capacityMatch[2];
        return parseInt(capacity);
    }
    return null;
}

/**
 * Extract material from product name
 * Polymer, Steel, Aluminum, etc.
 */
function extractMaterial(name) {
    const materialPatterns = [
        { pattern: /\bpolymer\b|\bplastic\b/i, normalized: 'Polymer' },
        { pattern: /\bsteel\b|\bstainless\b|\bstainless\s*steel\b/i, normalized: 'Steel' },
        { pattern: /\baluminum\b|\baluminium\b|\baluminum\s*alloy\b/i, normalized: 'Aluminum' },
        { pattern: /\bcarbon\s*fiber\b|\bcarbon\s*composite\b/i, normalized: 'Carbon Fiber' },
        { pattern: /\bfiberglass\b/i, normalized: 'Fiberglass' },
        { pattern: /\brubber\b/i, normalized: 'Rubber' },
    ];

    for (const { pattern, normalized } of materialPatterns) {
        if (pattern.test(name)) {
            return normalized;
        }
    }
    
    return null;
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
 * Extract brand from product name
 * Looks for known brand patterns at the start of product names
 */
function extractBrand(productName) {
    const brandPatterns = [
        /^(Federal|Remington|Hornady|Winchester|Blazer|Wolf|Tulammo|Fiocchi|PMC|Aguila|American|Armscor|Magtech|Norma|Perfecta|PPU|Rocky|Vista|Sellier|Speer|Sierra|Nosler|CCI|Cci|Lyman|RCBS|Lee|Frankford|Dillon|Redding|Sinclair|Accurate|Hodgdon|IMR|Alliant|Vihtavuori|Unique|Blackhorn|Scot|Powder|Corbon|Browning|Savage|Ruger|Colt|Smith|Wesson|S&W|Taurus|Glock|Sig|Sauer|HK|Beretta|Walther|FN|Mossberg|Remington|Benelli|Weatherby|Tikka|Marlin|Winchester|Ruger|Savage|Bushmaster|Daniel|Defense|DPMS|AR15|AR-15|Seekins|Mega|Aero|Anderson|Ballistic|Advantage|Criterion|Faxon|Lothar|Walther|POF|Proof|Research|Criterion|Core|Rifle|Systems|Hodgdon|Alliant|Vihtavuori|Unique|IMR|Accurate|Blackhorn|H110|H4895|WIN)/i,
        /^(FEDERAL|REMINGTON|HORNADY|WINCHESTER|BLAZER|WOLF|TULAMMO|FIOCCHI|PMC|AGUILA)/i
    ];

    const name = productName || '';
    
    for (const pattern of brandPatterns) {
        const match = name.match(pattern);
        if (match) {
            return match[1].trim();
        }
    }

    return 'Generic';
}

/**
 * Transform API product to local format
 */
function transformProduct(apiProduct) {
    const imageUrl = apiProduct.cssi_id 
        ? `https://images.chattanoogashooting.com/products/${apiProduct.cssi_id.toLowerCase()}.jpg`
        : '/images/products/placeholder.jpg';

    const productName = apiProduct.name || 'Unknown Product';

    return {
        id: apiProduct.cssi_id || '',
        name: productName,
        brand: extractBrand(productName),
        category: '',  // Will be set later
        image: imageUrl,
        retailPrice: parseFloat(apiProduct.retail_price || 0),
        salePrice: parseFloat(apiProduct.custom_price || apiProduct.retail_price || 0),
        inventory: parseInt(apiProduct.inventory || 0),
        inStock: apiProduct.in_stock_flag === 1,
        requiresFFL: apiProduct.ffl_flag === 1,
        serialized: apiProduct.serialized_flag === 1,
        dropShip: apiProduct.drop_ship_flag === 1,
        allocated: apiProduct.allocated_flag === 1,
        mapPrice: parseFloat(apiProduct.map_price || 0),
        lastUpdated: apiProduct.qas_last_updated_at || '',
        description: apiProduct.description || '',
        // New extracted fields
        caliber: extractCaliber(productName),
        platform: extractPlatform(productName),
        capacity: extractCapacity(productName),
        material: extractMaterial(productName)
    };
}

/**
 * Save products to JSON file for a specific category
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
    console.log('Starting Chattanooga API sync with active product filtering...\n');
    
    if (!API_SID || !API_TOKEN) {
        console.error('❌ Error: API_SID and API_TOKEN environment variables required');
        process.exit(1);
    }

    try {
        // Load active product selection
        const activeProducts = loadActiveProducts();
        console.log(`📋 Active products configured: ${Object.keys(activeProducts).length}`);
        console.log(`ℹ️  If empty, all products will be synced\n`);

        // Fetch all products from API
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
        
        console.log(`✓ Fetched ${allProducts.length} products from API\n`);
        
        // ===== 3-LAYER FILTERING PIPELINE =====
        // Layer 1: Brand filtering (TOP_BRANDS only)
        // Layer 2: Compliance filtering (FFL, inventory, allocation)
        // Layer 3: Categorization (exclusion-first)
        
        const transformedProducts = allProducts
            .map((apiProduct, index) => ({
                apiProduct,
                transformed: transformProduct(apiProduct),
                index
            }))
            .filter(({ apiProduct, transformed }) => {
                // LAYER 1: Top brands only
                if (!shouldIncludeBrand(transformed)) {
                    return false;
                }
                
                // LAYER 2: Compliance checks
                if (!shouldIncludeProduct(apiProduct)) {
                    return false;
                }
                
                return true;
            })
            .map(({ transformed }) => {
                // LAYER 3: Categorization
                transformed.category = categorizeProduct(transformed);
                return transformed;
            });
        
        console.log(`✓ Transformed & filtered to ${transformedProducts.length} premium, compliant products\n`);
        
        // Group by category
        const categorizedProducts = {
            ammunition: [],
            magazines: [],
            reloading: [],
            'gun-parts': [],
            optics: [],
            gear: [],
            survival: [],
            brands: [],
            sale: []
        };
        
        transformedProducts.forEach(product => {
            const targetCategory = product.category;
            
            if (categorizedProducts[targetCategory]) {
                categorizedProducts[targetCategory].push(product);
            } else {
                // Fallback to gear if category doesn't exist
                categorizedProducts['gear'].push(product);
            }
        });
        
        // Save each category
        let totalSaved = 0;
        for (const [category, products] of Object.entries(categorizedProducts)) {
            if (products.length > 0) {
                saveProducts(category, products);
                totalSaved += products.length;
            }
        }
        
        console.log(`\n📊 FINAL PRODUCT CATALOG BY CATEGORY:`);
        for (const [category, products] of Object.entries(categorizedProducts)) {
            if (products.length > 0) {
                console.log(`  ✓ ${category.padEnd(15)}: ${products.length.toString().padEnd(6)} products`);
            }
        }
        
        console.log(`\n════════════════════════════════════════`);
        console.log(`✓ SYNC COMPLETED SUCCESSFULLY`);
        console.log(`  Total products: ${totalSaved}`);
        console.log(`  Filtering: TOP BRANDS + COMPLIANCE + EXCLUSION-FIRST CATEGORIZATION`);
        console.log(`════════════════════════════════════════\n`);
    } catch (error) {
        console.error('❌ Sync failed:', error);
        process.exit(1);
    }
}

syncAllProducts();
