// Test the new categorization logic
const fs = require('fs');
const path = require('path');

// Read and extract the sync script to get the categorizeProduct function
const syncScript = fs.readFileSync(path.join(__dirname, 'scripts/sync-chattanooga-api.js'), 'utf8');

// Simple mock for the function
function categorizeProduct(product) {
    const name = (product.name || '').toUpperCase();
    
    // ===== UNIVERSAL EXCLUSIONS - Items that should NEVER be in any category =====
    // These are non-product items or things we don't want to sell
    const exclusionPatterns = [
        /GIFT\s*CARD|CREDIT|VOUCHER|SERVICE FEE/i,
        /ENGRAVING|GUNSMITHING|LABOR|INSTALLATION/i,
        /LICENSE|PERMIT|TRAINING|CLASS|COURSE/i
    ];
    
    for (const pattern of exclusionPatterns) {
        if (pattern.test(name)) {
            return 'gear';  // Put in gear but should be filtered separately
        }
    }
    
    // ===== RELOADING (HIGHEST PRIORITY - must come before ammunition) =====
    // This is components, not finished ammo
    
    // EXCLUSIONS from reloading: Don't include ammo boxes, pouches, or finished ammo
    const reloadingExclusions = [
        /AMMO\s*BOX|AMMUNITION\s*BOX|AMMUNITION\s*CASE|CASE\s*STORAGE|STORAGE\s*BOX|AMMUNITION\s*POUCH/i,
        /AMMO\s*POUCH|AMMUNITION\s*POUCH|AMMO\s*BELT|AMMO\s*CARRIER|MAGAZINE\s*POUCH|MAG\s*POUCH/i,
        /SLING|STRAP|CARRYING\s*CASE|HOLSTER|GUN\s*CASE|CARRYING\s*BAG/i
    ];
    
    // Powder brands and patterns - COMPONENT
    if (/^(BLACKHORN|ACCURATE|SCOT\s*POWDER|HODGDON|IMR|ALLIANT|VIHTAVUORI|UNIQUE|2400|BLUE\s*DOT|CFE|H110|H4895|3031|4064|4350|WIN\s*RELOADING|LYMAN|RCBS|LEE|FRANKFORD|DILLON|REDDING|SINCLAIR|CORBON|DPX|LOAD\s*MASTER)/i.test(name)) {
        if (!reloadingExclusions.some(p => p.test(name))) {
            return 'reloading';
        }
    }
    
    // Powder keywords
    if (/(RELOADING\s*POWDER|SMOKELESS\s*POWDER|BLACKPOWDER|MUZZLELOADING\s*POWDER|HANDLOAD\s*POWDER|POWDER\s*CHARGE|POWDER\s*\d+LB|POWDER\s*\d+OZ)/i.test(name)) {
        if (!reloadingExclusions.some(p => p.test(name))) {
            return 'reloading';
        }
    }
    
    // Primers - these are COMPONENTS not finished ammo
    if (/(PRIMER|PRIMERS).*(?:SMALL|LARGE|RIFLE|PISTOL|MAGNUM|SHOTGUN|BOXER|BERDAN)/i.test(name) || 
        /CCI\s*#\d+.*PRIMER/i.test(name) ||
        /FEDERAL\s*\d+.*PRIMER/i.test(name) ||
        /REMINGTON.*PRIMER/i.test(name) ||
        /WINCHESTER.*PRIMER/i.test(name)) {
        if (!reloadingExclusions.some(p => p.test(name))) {
            return 'reloading';
        }
    }
    
    // Component bullets (NOT finished ammo) - look for .DIA format
    if (/\.(?:224|243|257|264|277|284|308|311|323|338|355|357|375|401|429|452|458|474|510)\s*DIA/i.test(name)) {
        if (!reloadingExclusions.some(p => p.test(name))) {
            return 'reloading';
        }
    }
    
    // Component bullets with count or grain weight but NOT finished ammo indicators
    // Patterns: "BULLET 115GR", "BULLETS .357 158 SJHP", "44-200-RNFP 500ct bullets"
    if (/(?:BULLET|BULLETS|PROJECTILE|COMPONENT\s*BULLET)|\d+\s*CT\s*(?:BULLET|PROJECTILE)/i.test(name) && 
        !/AMMO|AMMUNITION|ROUND|ROUNDS|BOX|CASE|LOADED|CARTRIDGE|FMJ|JHP|HOLLOW\s*POINT|DEFENSE|MATCH|CRITICAL/i.test(name)) {
        if (!reloadingExclusions.some(p => p.test(name))) {
            return 'reloading';
        }
    }
    
    // Brass - new, fired, unprimed (COMPONENT)
    if (/(UNPRIMED\s*BRASS|FIRED\s*BRASS|NEW\s*BRASS|ONCE\s*FIRED|RANGE\s*BRASS|RELOADER\s*BRASS|BRASS\s*\d+\s*CT)/i.test(name)) {
        if (!reloadingExclusions.some(p => p.test(name))) {
            return 'reloading';
        }
    }
    
    // Reloading EQUIPMENT
    if (/(CASE\s*PREP|CASE\s*TRIMMER|TRIMMER|CALIPER|CALIPERS|SCALE|BALANCE|TUMBLER|MEDIA|POLISH|RELOADING\s*PRESS|PROGRESSIVE|TURRET|SINGLE\s*STAGE|DEPRIMING|DECAPPING|BULLET\s*PULLER|PRESS\s*DIE|RELOADING\s*DIE)/i.test(name)) {
        if (!reloadingExclusions.some(p => p.test(name))) {
            return 'reloading';
        }
    }
    
    // Reloading equipment brands
    const reloadingBrands = ['RCBS', 'LEE', 'LYMAN', 'HORNADY', 'DILLON', 'REDDING', 'FRANKFORD\s*ARSENAL', 'SINCLAIR', 'LAPUA', 'STARLINE'];
    for (let brand of reloadingBrands) {
        if (new RegExp(brand, 'i').test(name)) {
            if (/(?:POWDER|PRIMER|BRASS|BULLET|PRESS|SCALE|TRIMMER|DIE|EQUIPMENT|COMPONENT|EQUIPMENT)/i.test(name)) {
                if (!reloadingExclusions.some(p => p.test(name))) {
                    return 'reloading';
                }
            }
        }
    }
    
    // ===== AMMUNITION (finished cartridges ONLY) =====
    // EXCLUSIONS from ammunition: Don't include components, storage, or cleaning items
    // Special case: "100RD BULLET" should be ammunition not reloading (BAG suggests pre-packaged ammo)
    const ammoExclusions = [
        /(?<!ROUND|RD|100)\s*BULLET(?!S)|PROJECTILE|COMPONENT\s*BULLET|\.DIA|POWDER|PRIMER|BRASS|RELOAD/i,
        /AMMO\s*BOX|AMMUNITION\s*BOX|AMMUNITION\s*CASE|CASE\s*STORAGE|STORAGE\s*BOX/i,
        /AMMO\s*POUCH|AMMUNITION\s*POUCH|AMMO\s*BELT|AMMO\s*CARRIER|MAGAZINE\s*POUCH|MAG\s*POUCH/i,
        /CLEANER|BRUSH|BORE|SCRUBBER|DEGREASER|OIL|LUBRIC|CLOTH|WIPE|GUN\s*STOCK|BLUE|COMPOUND|SEALER/i,
        /SIGHT\s*SPOT|BULLSEYE|PASTER|TARGET|VISION\s*AID|SIGHT-IN/i
    ];
    
    // Check if product should be excluded from ammunition
    let isAmmoExcluded = false;
    for (const pattern of ammoExclusions) {
        if (pattern.test(name)) {
            isAmmoExcluded = true;
            break;
        }
    }
    
    if (!isAmmoExcluded) {
        // ===== PISTOL AMMO - WHITELIST BRANDS =====
        const pistolBrands = ['FEDERAL', 'REMINGTON', 'HORNADY', 'WINCHESTER', 'BLAZER', 'WOLF', 'FIOCCHI', 'PMC', 'AGUILA', 'AMERICAN\s*EAGLE', 'SPEER', 'CCI', 'MAGTECH', 'ARMSCOR', 'NORMA'];
        const pistolCalibers = ['9MM', '9X19', '40\\s*S&W', '45\\s*ACP', '380', '357', '38\\s*SPL', '44\\s*MAG', '10MM', '45\\s*GAP'];
        
        for (let brand of pistolBrands) {
            if (new RegExp(brand, 'i').test(name)) {
                if (/(?:ROUND|ROUNDS|RD|BOX|BOXES|AMMO|AMMUNITION|CARTRIDGE|FMJ|JHP|HP|SHP|DEFENSE|MATCH|CRITICAL)/i.test(name)) {
                    if (new RegExp(pistolCalibers.join('|'), 'i').test(name)) {
                        return 'ammunition';
                    }
                }
            }
        }
        
        // ===== RIFLE AMMO - WHITELIST BRANDS =====
        const rifleBrands = ['FEDERAL', 'REMINGTON', 'HORNADY', 'WINCHESTER', 'WOLF', 'FIOCCHI', 'PMC', 'NORMA', 'SELLIER', 'MATCH\s*GRADE', 'CRITICAL\s*DUTY'];
        const rifleCalibers = ['223', '5\\.56', '308', '7\\.62', '30-06', '300\\s*BLK', '6\\.5', '270', '30-30', '338', '375'];
        
        for (let brand of rifleBrands) {
            if (new RegExp(brand, 'i').test(name)) {
                if (/(?:ROUND|ROUNDS|RD|BOX|BOXES|AMMO|AMMUNITION|CARTRIDGE|FMJ|JHP|MATCH|LOAD)/i.test(name)) {
                    if (new RegExp(rifleCalibers.join('|'), 'i').test(name)) {
                        return 'ammunition';
                    }
                }
            }
        }
        
        // ===== SHOTGUN AMMO - WHITELIST BRANDS =====
        const shotgunBrands = ['FEDERAL', 'REMINGTON', 'WINCHESTER', 'HORNADY', 'FIOCCHI', 'MAGTECH', 'AGUILA'];
        for (let brand of shotgunBrands) {
            if (new RegExp(brand, 'i').test(name)) {
                if (/(?:12GA|20GA|16GA|10GA|\.410).*(?:SHOT|SHELL|SHELLS|AMMO|SLUG|BUCKSHOT)/i.test(name)) {
                    return 'ammunition';
                }
            }
        }
        
        // ===== RIMFIRE AMMO - .22 LR, .22 WMR =====
        if (/(?:22\s*LR|22\s*LONG|22\s*WMR|22\s*MAG).*(?:ROUND|ROUNDS|RD|BOX|AMMO)/i.test(name)) {
            const rimfireBrands = ['FEDERAL', 'REMINGTON', 'WINCHESTER', 'CCI', 'AGUILA', 'MAGTECH'];
            if (rimfireBrands.some(b => new RegExp(b, 'i').test(name))) {
                return 'ammunition';
            }
        }
    }
    
    // ===== MAGAZINES =====
    // EXCLUSIONS: Don't include magazine pouches (separate category), but SLEEVES on magazines are OK
    const magExclusions = [
        /MAGAZINE\s*POUCH|MAG\s*POUCH|MAGAZINE\s*CARRIER|POUCH|HOLSTER|CARRYING\s*CASE|SOFT\s*CASE|HARD\s*CASE/i,  // Magazine storage items
        /POWDER|PRIMER|BRASS|BULLET|RELOAD|COMPONENT/i  // Not magazine components
    ];
    
    let isMagExcluded = false;
    for (const pattern of magExclusions) {
        if (pattern.test(name)) {
            isMagExcluded = true;
            break;
        }
    }
    
    if (!isMagExcluded) {
        const magBrands = ['MAGPUL', 'PMAG', 'OKAY', 'ETS', 'KCI', 'GLOCK', 'SIG', 'SMITH\s*&\s*WESSON', 'SPRINGFIELD', 'RUGER', 'COLT', 'TAURUS', 'US\s*PALM', 'LANCER', 'TROY', 'SURFIRE', 'BERETTA', 'WALTHER'];
        
        for (let brand of magBrands) {
            if (new RegExp(brand, 'i').test(name)) {
                if (/(?:MAGAZINE|MAG(?!NET)|CLIP).*(?:\d+|RD|ROUND|SLEEVE|RND)/i.test(name)) {
                    return 'magazines';
                }
            }
        }
    }
    
    // ===== OPTICS (actual optical devices ONLY) =====
    // EXCLUSIONS: Covers, mounts, targets, cleaning products, batteries, slings, straps, cases, etc.
    const opticsExclusions = [
        /COVER|CAP|FLIP\s*OPEN|LENS\s*CAP/i,  // Scope covers and caps
        /MOUNT|BASE|RING|RAIL|PICATINNY|WEAVER/i,  // Mounts - these are parts not optics
        /TARGET|SIGHT-IN|SIGHT\s*SPOT|BULLSEYE|PASTER/i,  // Range aids
        /CLEAN|BRUSH|CLOTH|WIPE|LENS\s*CLOTH|LUBRIC|OIL|SOLVENT/i,  // Cleaning
        /SLING|STRAP|CORD|CARRYING|CASE|HOLSTER|BAG|PACK/i,  // Carrying/storage
        /BATTERY|BATTERIES|POWER/i,  // Batteries
        /ADAPTER|CONNECTOR|EXTENSION|CLAMP|SPACER|TOOL/i  // Accessories
    ];
    
    let isOpticsExcluded = false;
    for (const pattern of opticsExclusions) {
        if (pattern.test(name)) {
            isOpticsExcluded = true;
            break;
        }
    }
    
    if (!isOpticsExcluded) {
        const opticsBrands = ['VORTEX', 'LEUPOLD', 'BUSHNELL', 'ZEISS', 'TRIJICON', 'EOTECH', 'ACOG', 'HOLOSUN', 'PRIMARY\s*ARMS', 'SWAMPFOX', 'SIG\s*SAUER', 'NIKON', 'STEINER'];
        
        for (let brand of opticsBrands) {
            if (new RegExp(brand, 'i').test(name)) {
                // ONLY scopes, sights, red dots, lasers, thermal - NOT mounts, covers, or targets
                if (/(?:SCOPE|RED\s*DOT|SIGHT|LASER|THERMAL|MAGNIFIER|OPTIC|BINOCULAR|MONOCULAR|RANGEFINDER).*(?!MOUNT|COVER|TARGET|BASE)/i.test(name)) {
                    return 'optics';
                }
            }
        }
    }
    
    // ===== GUN PARTS (actual firearm components) =====
    // EXCLUSIONS: Cleaning tools, cases/storage, general tools
    const partsExclusions = [
        /CLEANER|BRUSH|BORE|SCRUBBER|DEGREASER|PUNCH|HAMMER|WRENCH|VISE|TOOL|KIT|ROD|PATCH|LUBRIC|SOLVENT/i,
        /CASE|BOX|BAG|POUCH|HOLSTER|STORAGE|CARRIER|PACK|VEST|CHEST|SLING|STRAP/i,
        /POWDER|PRIMER|BRASS|BULLET|RELOAD|COMPONENT|AMMUNITION|AMMO/i
    ];
    
    let isPartsExcluded = false;
    for (const pattern of partsExclusions) {
        if (pattern.test(name)) {
            isPartsExcluded = true;
            break;
        }
    }
    
    if (!isPartsExcluded) {
        const partsBrands = ['AERO\s*PRECISION', 'MIDWEST\s*INDUSTRIES', 'MAGPUL', 'RADIAN', 'GEISSELE', 'ANDERSON', 'RISE\s*ARMAMENT', 'TIMBER\s*CREEK', 'SPIKE\s*TACTICAL', 'DANIEL\s*DEFENSE', 'BCMGUNFIGHTER', 'FAXON', 'WILSON\s*COMBAT'];
        
        for (let brand of partsBrands) {
            if (new RegExp(brand, 'i').test(name)) {
                if (/(?:UPPER|LOWER|BARREL|BOLT|HANDGUARD|CHARGING\s*HANDLE|TRIGGER|SAFETY|SELECTOR|STOCK|GRIP|RECEIVER|BUFFER|SPRING)/i.test(name)) {
                    return 'gun-parts';
                }
            }
        }
    }
    
    // ===== SURVIVAL/TACTICAL =====
    // Quality outdoor/tactical items from known brands
    const survivalBrands = ['BENCHMADE', 'SPYDERCO', 'GERBER', 'LEATHERMAN', 'SOG', 'STREAMLIGHT', 'MAGPUL', 'CONDOR', 'MAXPEDITION', 'VERTX', 'MYSTERY\s*RANCH'];
    
    for (let brand of survivalBrands) {
        if (new RegExp(brand, 'i').test(name)) {
            if (/(?:KNIFE|BLADE|TOOL|FLASHLIGHT|LIGHT|PACK|BAG|POUCH|GEAR|TACTICAL|OUTDOOR|CAMPING|PARACORD|ROPE|MULTI)/i.test(name)) {
                // Make sure it's not a gun part or ammunition related
                if (!/UPPER|LOWER|BARREL|TRIGGER|POWDER|PRIMER|BRASS|BULLET|AMMUNITION|AMMO/i.test(name)) {
                    return 'survival';
                }
            }
        }
    }
    
    // DEFAULT: Everything else goes to GEAR (the catch-all category)
    // This includes: misc tools, cleaning products, storage, targets, etc.
    return 'gear';
}

// Test cases
const testCases = [
    { name: "BUTLER CREEK FLIP-OPEN SCOPE COVER #01 EYE #20010", expected: 'gear', reason: 'Scope cover - EXCLUDED' },
    { name: "FEDERAL 9MM 115GR FMJRN 100RD AMMO", expected: 'ammunition', reason: 'Finished ammo' },
    { name: "9MM 115GR FMJRN 100RD BAG BULLET", expected: 'gear', reason: 'Loose bullets without brand (ambiguous)' },
    { name: "VORTEX VIPER HD 4-12x40 SCOPE", expected: 'optics', reason: 'Actual scope' },
    { name: "ACCURATE MAG PRO 1LB POWDER", expected: 'reloading', reason: 'Powder' },
    { name: "CCI #41 PRIMER FOR 5.56MM 1000CT", expected: 'reloading', reason: 'Primers' },
    { name: "MAGPUL PMAG 30 MAGAZINE AR15", expected: 'magazines', reason: 'Magazine' },
    { name: "BENCHMADE INFIDEL KNIFE", expected: 'survival', reason: 'Tactical knife' },
    { name: "KleenBore 410 Gauge Shotgun Brush", expected: 'gear', reason: 'Cleaning brush - EXCLUDED' },
    { name: "BIRCHWOOD CASEY BORE CLEANING COMPOUND", expected: 'gear', reason: 'Cleaning product - EXCLUDED' },
    { name: "MTM AMMO BOX 20 RD BELT STYLE", expected: 'gear', reason: 'Ammo box - EXCLUDED from ammo' },
    { name: "SPRINGFIELD XD MOD.2 MAGAZINE .45 ACP 13-RD W/BLACK MOD.2 SLEEVE", expected: 'magazines', reason: 'Magazine with sleeve' },
    { name: "44/40-200-RNFP 500ct bullets", expected: 'reloading', reason: 'Component bullets' }
];

console.log('\n=== TESTING NEW CATEGORIZATION LOGIC ===\n');
let passed = 0;
let failed = 0;

testCases.forEach((test, i) => {
    const result = categorizeProduct({ name: test.name });
    const status = result === test.expected ? '✓ PASS' : '✗ FAIL';
    if (result === test.expected) passed++;
    else failed++;
    
    console.log(`${status} ${i+1}. ${test.name.substring(0, 65)}`);
    if (result !== test.expected) {
        console.log(`     Expected: ${test.expected}, Got: ${result}`);
    }
    console.log(`     (${test.reason})\n`);
});

console.log(`\n=== RESULTS: ${passed} passed, ${failed} failed ===\n`);
