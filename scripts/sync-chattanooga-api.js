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
    
    // OPTICS (Top 25 Brands)
    'TRIJICON', 'EOTECH', 'LEUPOLD', 'SIG SAUER', 'NIGHT FISION', 'MEPROLIGHT', 'XS SIGHT SYSTEMS',
    'VIRIDIAN', 'PULSAR', 'INFIRAY', 'GERMAN PRECISION OPTICS', 'ATHLON OPTICS', 'BURRIS', 'BUSHNELL',
    'RITON', 'SWAMPFOX OPTICS', 'ZEROTECH', 'SIGHTMARK', 'HI-VIZ', 'HIVIZ', 'BUTLER CREEK',
    'WEAVER', 'WARNE', 'TALLEY', 'DNZ', 'AREA 419',
    
    // Magazines
    'MAGPUL', 'PMAG', 'LANCER', 'HEXMAG', 'ETS', 'KCI',
    
    // Ammunition (Top 41 Brands)
    'FEDERAL', 'HORNADY', 'WINCHESTER', 'REMINGTON', 'PMC', 'FIOCCHI', 'SPEER', 'CCI', 'BLAZER', 'NORMA',
    'AGUILA', 'AMMO INC', 'ARMSCOR', 'ATLANTA ARMS', 'BARNES', 'BARRETT', 'BASCHIERI & PELLAGRI',
    'BERGER AMMUNITION', 'BROWNING', 'COR-BON', 'DOUBLE TAP', 'ESTATE CARTRIDGE', 'FN USA', 'FRONTIER',
    'G2 RESEARCH', 'HEVI-SHOT', 'HSM', 'KENT CARTRIDGE', 'LAPUA', 'LIBERTY AMMUNITION', 'MAGTECH',
    'MIGRA', 'NOBELSPOT', 'NOSLER', 'PPU', 'RIO', 'SELLIER & BELLOT', 'SIERRA', 'SIG SAUER',
    'SK', 'SWIFT', 'UNDERWOOD', 'WEATHERBY', 'WILSON COMBAT',
    
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
 * LAYER 1: Check if product brand should be excluded
 * Returns false only for bad/generic brands; allows all legitimate brands
 */
function shouldIncludeBrand(product) {
    const brand = (product.brand || 'GENERIC').toUpperCase().trim();
    
    // Exclude bad/generic brands ONLY
    if (BAD_BRANDS.some(b => brand.includes(b))) {
        return false;
    }
    
    // Include everything else
    return true;
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
 * LAYER 3: EXCLUSION-FIRST CATEGORIZATION (8-PASS SYSTEM)
 * 
 * CRITICAL: Process in this exact order with proper exclusions
 * PASS 1: Exclude Tools & Non-Products
 * PASS 2: Reloading components (powder, primers, brass, bullets, dies, presses)
 * PASS 3: Ammunition (finished cartridges ONLY)
 * PASS 4: Magazines (actual magazines ONLY)
 * PASS 5: Optics (scopes, red dots, sights)
 * PASS 6: Gun Parts (triggers, barrels, uppers, lowers, stocks, grips)
 * PASS 7: Holsters & Tactical Accessories
 * PASS 8: Survival/Gear (knives, flashlights, outdoor gear)
 * PASS 9: Default to Gear
 */
function categorizeProduct(product) {
    const name = (product.name || '').toUpperCase();
    const brand = (product.brand || '').toUpperCase();
    
    // ===== PASS 0: EXCLUDE NON-PRODUCTS & TOOLS =====
    // These should NEVER reach shop pages
    const exclusions = [
        /GIFT\s*CARD|CREDIT|VOUCHER|SERVICE\s*FEE|ENGRAVING|GUNSMITHING|LABOR|INSTALLATION|LICENSE|PERMIT|TRAINING|CLASS|COURSE|MAGLOADER|SPEEDLOADER|MAG\s*LOADER|LOADING\s*TOOL|PRESS\s*TOOL|CASE\s*FEEDER|DEPRIMER/i
    ];
    
    for (const pattern of exclusions) {
        if (pattern.test(name)) return null; // Exclude entirely
    }
    
    // ===== PASS 1: RELOADING COMPONENTS (MOST SPECIFIC) =====
    // Powder, primers, brass, projectiles, dies, presses, scales, tools
    // KEY: Be specific to avoid catching ammunition with "round" or "cartridge"
    const reloadingMatch = /\bPOWDER\b|\bPRIMER(?!Y)\b|\bPRIMERS\b|\bBRASS\b|\bBULLET\b|\bBULLETS\b|\bBULLETED\b|\bPROJECTILE\b|\bSLUG\b|\bSLUGS\b|\bPELLET\b|\bPELLETS\b|\bDIE\b(?!T)|\bDIES\b|\bPRESS\b(?!URE)|\bPRESSES\b|\bSCALE\b|\bCALIPER\b|\bTUMBLER\b|\bCASE\s*TRIMMER\b|\bCASE\s*SORTER\b|\bRELOADER\b|\bRELOADING\b|\bCHARGE\s*WEIGHT\b|\bLOADING\s*BLOCK\b|\bBULLET\s*PULLER\b|\bBULLET\s*MOLD\b/i.test(name);
    
    // Also check brand + keywords for ambiguous names like "ACCURATE MAG PRO"
    const reloadingBrandMatch = (brand === 'ACCURATE' || brand === 'HORNADY' || brand === 'RCBS' || 
                                 brand === 'LEE' || brand === 'LYMAN' || brand === 'DILLON' || 
                                 brand === 'REDDING' || brand === 'FRANKFORD') && 
                                /MAG|PRO|POWDER|PRIMER|BULLET|PRESS|SCALE/i.test(name);
    
    if (reloadingMatch || reloadingBrandMatch) return 'reloading';
    
    // ===== PASS 2: AMMUNITION (FINISHED CARTRIDGES ONLY) =====
    // Must be actual finished ammunition, not components
    // Exclude: Reloading components, magazines, tools, cases
    const ammoExclusions = [
        /COMPONENT|RELOAD|PRESS|CASE(?!\s*ONLY)|DIE|POWDER|PRIMER|BRASS|PROJECTILE|BULLET|SLUG|PELLET|MAGAZINE|PMAG|CLIP|DRUM(?!FIRE)|HOLSTER|POUCH|CARRIER|BELT|BAG|CASE\s*ONLY|BOX\s*ONLY|STORAGE/i
    ];
    
    // Ammunition is recognized by: caliber patterns, ammo keywords, or finished round type
    const ammoMatch = !ammoExclusions.some(p => p.test(name)) && /\bAMMO\b|\bCARTRIDGE\b|\bROUND\b(?!UP|ER)|\bSHOTSHELL\b|\bSHOTGUN\s*SHELL\b|\b9MM\b|\b9X19\b|\b5\.56\b|\b223\b|\b308\b|\b7\.62\b|\b45\s*ACP\b|\b40\s*S&W\b|\b12GA\b|\b20GA\b|\b\.22\b|\b22LR\b|\bFMJ\b|\bJHP\b|\bHP\b|\bSP\b|\bFEDERAL\b|\bHORNADY\b|\bWINCHESTER\b|\bREMINGTON\b|\bBLAZER\b|\bCCI\b|\bAGUILA\b|\bPMC\b|\bFIOCCHI\b|\bSPEER\b|\bNORMA\b|\bMAGTECH\b|\bARMSCOR\b|\bPPU\b|\bRIO\b|\bSELLIER\b|\bHSM\b|\bFRONTIER\b|\bAMMO\s*INC\b|\bCORBON\b|\bUNDERWOOD\b|\bLIBERTY\b|\bWOLF\b|\bTULAMMO\b|\bWINGSAM\b|\bGOLDEN\s*TIGER\b|\bSKBY\b|\bSIMMON\b/i.test(name);
    
    if (ammoMatch) return 'ammunition';
    
    // ===== PASS 3: MAGAZINES (ACTUAL MAGAZINES ONLY) =====
    // Real magazines: contain words like MAGAZINE, PMAG, or are brand-specific magazines
    // Exclude: Ammunition, reloading, tools, loaders, holsters, CASES, gun parts
    const magExclusions = [
        /AMMO|CARTRIDGE|ROUND(?!UP|ER)|SHOTSHELL|POWDER|PRIMER|BRASS|BULLET|SLUG|PELLET|LOADER|TOOL|LOADER(?:TOOL)?|POUCH|HOLSTER|CARRIER|BELT|BAG|(?<!HAND)CASE|STORAGE|CLEANING|BRUSH|GRIPER|DECELE|ADAPTER|BASE|RING|RAIL|SIGHT|SIGHT|SCOPE|OPTIC|TRIGGER|STOCK|GRIP|SAFETY|SCREW|SPRING|BUFFER|BARREL|UPPER|LOWER|RECEIVER|EXTRACTOR|EJECTOR|HAMMER|PIN|WASHER|FASTENER|TOOL/i
    ];
    
    // Only match actual magazine products
    const magMatch = !magExclusions.some(p => p.test(name)) && /\bMAGAZINE\b|\bMAGS\b|\bPMAG\b(?!\s*PARTS)|\bCLIP\b|\b(\d+)\s*(?:RD|ROUND|CAPACITY)\b.*(?:MAGAZINE|MAG|CLIP)\b|(?:MAGAZINE|MAG)\s*(\d+)\b|\bRUGER\s*MAGAZINE\b|\bGLOCK\s*MAGAZINE\b|\bSIG\s*MAGAZINE\b|\bHK\s*MAGAZINE\b|\bS&W\s*MAGAZINE\b|\bLANCER\b|\bHEXMAG\b|\bETS\b|\bKCI\b/i.test(name);
    
    if (magMatch) return 'magazines';
    
    // ===== PASS 4: OPTICS (SCOPES, RED DOTS, SIGHTS) =====
    // Exclude: Ammunition, mounts, bases, rings, rails, cleaning supplies, tools, boresights, laser products that aren't actual optics
    const opticsExclusions = [
        /MOUNT|BASE|RING|RAIL(?!WAY)|SCOPE\s*RING|SCOPE\s*BASE|PICATINNY|DOVETAIL|COVER|CAP|LENS|BATTERY|LENS\s*CLEANER|BRUSH|CLOTH|CLEANING|TOOL|REPAIR|ADJUSTMENT|SCREW|SPRING|PIN|WASHER|SPACER|RISER|HOLSTER|POUCH|CASE|BAG|STORAGE|SLING|STRAP|AMMUNITION|AMMO|ROUND|CARTRIDGE|POWDER|PRIMER|BORESIGHT|BORE\s*SIGHT|LASER\s*SIGHT(?!\s*(?:SCOPE|RED|DOT))|SIGHT\s*(?:TOOL|ADJUSTMENT|ADJ)|CARTRIDGE|BALLISTIC/i
    ];
    
    const opticsMatch = !opticsExclusions.some(p => p.test(name)) && /\bSCOPE\b|\bRED\s*DOT\b|\bHOLOGRAPHIC\b|\bMAGNIFIER\b|\bRIFLESCOPE\b|\bREFLEX\b|\bOPTIC\b(?!S\s*READY|AL\s*ADAPTER)|\bOPTICS\b(?!\s*READY)|\bBINOCULAR\b|\bMONOCULAR\b|\bRANGEFINDER\b|\bTHERMAL\b(?!\s*IMAGING)|\bNIGHT\s*VISION\b|\bTACTICAL\s*(?:SIGHT|SCOPE)\b|\bIRON\s*SIGHT\b(?!S|S\s*TOOL)|\bTRIJICON\b|\bEOTECH\b|\bAIMPOINT\b|\bHOLOSUN\b|\bVORTEX\b|\bLEUPOLD\b|\bPRIMARY\s*ARMS\b|\bNIGHTFORCE\b|\bBUSHNELL\b|\bZEISS\b|\bNIKON\b|\bSTEINER\b|\bSWAROVSKI\b|\bPULSAR\b|\bATHLON\b|\bBURRIS\b|\bRITON\b|\bSWAMPFOX\b/i.test(name);
    
    if (opticsMatch) return 'optics';
    
    // ===== PASS 5: GUN PARTS (Triggers, Barrels, Uppers, Lowers, Stocks, Grips, etc.) =====
    // Exclude: Ammunition, reloading, holsters, cleaning supplies, tools
    const partsExclusions = [
        /CLEANER|BRUSH|BORE|SCRUBBER|DEGREASER|PUNCH|HAMMER|WRENCH|VISE|CLEANING|LUBRIC|SOLVENT|OIL|HOLSTER|POUCH|SLING|STRAP|BAG|CASE|STORAGE|AMMUNITION|AMMO|CARTRIDGE|ROUND|POWDER|PRIMER|BRASS|BULLET|CLEANING\s*MAT|TOOL|TOOL\s*KIT|REPAIR|SPRING|PIN|WASHER|SCREW|NUT|BOLT|FASTENER|CORD|ROPE/i
    ];
    
    const partsMatch = !partsExclusions.some(p => p.test(name)) && /\bTRIGGER\b|\bBCG\b|\bBOLT\s*CARRIER\b|\bBARREL\b|\bUPPER\b(?!\s*EXTREME)|\bLOWER\b(?!\s*EXTREME)|\bBUFFER\b|\bGAS\s*BLOCK\b|\bHANDGUARD\b|\bRAIL\b(?!\s*SYSTEM)|\bSTOCK\b(?!ING|ADE)|\bGRIP\b(?!TAPE)|\bRECEIVER\b|\bCHARGING\s*HANDLE\b|\bSAFETY\b(?!\s*HARNESS)|\bSELECTOR\b|\bAR-?15|AR-?10|\bAK|1911|\bAKM|\bMOD\b|\bFLOAT\b|\bFWD\s*ASSIST\b|\bEJECTOR\b|\bMUZZLE\s*(?:BRAKE|FLASH|DEVICE|COMP|BOOSTER)\b|\bSUPPRESSOR\b|\bSILENCER\b|\bFORE\s*GRIP\b|\bVERTICAL\s*GRIP\b|\bPICAT\b|\bWEAVER\b|\bMOUNT\s*PLATE\b|\bMODULE\b|\bCOMPONENT\b|\bASSEMBLY\b|\bKIT\b(?!\s*BAG)|MAGPUL|BCM|GEISSELE|MIDWEST|RADIAN|REPTILIA|CLOUD|SUREFIRE(?!\s*LIGHT)|STREAMLIGHT(?!\s*LIGHT)|SAFARILAND|BLUE\s*FORCE|HOGUE|TIMNEY|TRIGGERTECH|LARUE|BALLISTIC/i.test(name);
    
    if (partsMatch) return 'gun-parts';
    
    // ===== PASS 6: HOLSTERS & TACTICAL ACCESSORIES =====
    // Holsters, slings, chest rigs, plate carriers, ammo carriers
    const holsterMatch = /\bHOLSTER\b|\bCHEST\s*RIG\b|\bPLATE\s*CARRIER\b|\bAMMO\s*POUCH\b|\bAMMO\s*CARRIER\b|\bMAG\s*POUCH\b|\bMAG\s*CARRIER\b|\bMULTI\s*MAG\b|\bSLING\b(?!PACK)|\bTACTICAL\s*BELT\b|\bWEAPON\s*SLING\b|\bSHOULDER\s*HOLSTER\b|\bIWB\b|\bOWB\b|SAFARILAND|BLACKHAWK|GALCO|ALIEN|CROSSBREED|RAVEN|STEALTHGEAR|G-Code/i.test(name);
    
    if (holsterMatch && !/\bGUN\b|\bFIREARM\b|\bPISTOL\b|\bRIFLE\b/.test(name)) return 'gear';
    
    // ===== PASS 7: SURVIVAL & OUTDOOR GEAR (Knives, Lights, Emergency Gear) =====
    // Knives, multi-tools, flashlights, water filters, fire starters, camping gear
    const survivalMatch = /\bKNIFE\b|\bKNIVES\b|\bMULTI\s*TOOL\b|\bMULTI-TOOL\b|\bFLASHLIGHT\b|\bFLASH\s*LIGHT\b|\bFIRST\s*AID\b|\bMEDICAL\s*(?:KIT|BAG|POUCH)\b|\bWATER\s*(?:FILTER|BOTTLE|CANTEEN)\b|\bFIRE\s*(?:STARTER|STEEL|FLINT)\b|\bPARACORD\b|\bPARA\s*CORD\b|\bEMERGENCY\b|\bOUTDOOR\s*GEAR\b|\bCAMPING\b|\bBACKPACK\b|\bRUCKSACK\b|\bTENT\b|\bSLEEPING\s*BAG\b|\bBIVOUAC\b|\bSHELTER\b|\bFORT\s*KNOX\b|\bTORCH\b|GERBER|SOG|BENCHMADE|KERSHAW|CRKT|SPYDERCO|VICTORINOX|LEATHERMAN|COLDSTEEL|ESEE/i.test(name);
    
    if (survivalMatch) return 'survival';
    
    // ===== PASS 8: BRAND FALLBACK (Secondary Check for Edge Cases) =====
    // Use brand to disambiguate if keywords don't match
    // Reloading brands - check FIRST (powder producers)
    if (/ACCURATE|HODGDON|ALLIANT|VIHTAVUORI|IMR|LAPUA|POWDER\s*VALLEY|H110|H4895|WIN|4831|H335|2400|UNIQUE|INTERNATIONAL/.test(brand)) {
        return 'reloading';
    }
    
    // Ammunition brands
    if (/FEDERAL|HORNADY|WINCHESTER|REMINGTON|BLAZER|CCI|AGUILA|PMC|FIOCCHI|SPEER|NORMA|MAGTECH|ARMSCOR|PPU|RIO|SELLIER|HSM|FRONTIER|AMMO\s*INC|CORBON|UNDERWOOD|LIBERTY|BROWNING|WILSON\s*COMBAT|BARNAUL|SILVER|BEAR|GOLDEN|TULA|WOLF|MONARCH|GECO/i.test(brand)) {
        return 'ammunition';
    }
    
    // Gun parts brands (BEFORE magazine brands to avoid MAGPUL confusion)
    if (/MAGPUL|BCM|GEISSELE|MIDWEST|RADIAN|REPTILIA|CLOUD|AERO|ANDERSON|BALLISTIC|CRITERION|FAXON|CRITERION|CORE|LWRC|DANIEL\s*DEFENSE|NOVESKE|PSA|SPIKES|ARMASPEC|V^|VLTOR|YOUNG|PATRIOTS|ODIN|FORTIS|STRIKE|IRON|RISE|TIMNEY|TRIGGERTECH|HIPERFIRE|FRANKLIN|BATTLE|CMMG|BUSMASTER|ROCK/i.test(brand)) {
        return 'gun-parts';
    }
    
    // Optics brands
    if (/TRIJICON|EOTECH|AIMPOINT|HOLOSUN|VORTEX|LEUPOLD|PRIMARY|NIGHTFORCE|BUSHNELL|ZEISS|NIKON|STEINER|SWAROVSKI|SIG|BURRIS|MEOPTA|SWAMPFOX|RITON|GERMAN\s*PRECISION|ATHLON|STEYR|HAWKE|VANGUARD|WEAVER|WARNE|TALLEY|DNZ|AREA\s*419|SWIFT|OPTICS|THERMAL|FLIR|PULSAR/i.test(brand)) {
        return 'optics';
    }
    
    // Magazine brands - ONLY actual magazine manufacturers, not firearms brands
    if (/LANCER|HEXMAG|ETS|KCI|DURAMAG|ASC|CHECKMATE|D&H|KRIEGER|DAKIN/i.test(brand)) {
        return 'magazines';
    }
    
    // Survival/Outdoor brands
    if (/GERBER|SOG|BENCHMADE|KERSHAW|CRKT|SPYDERCO|STREAMLIGHT|SUREFIRE|VICTORINOX|LEATHERMAN|COLDSTEEL|ESEE|CONDOR|OPINEL|MORA|VICTORINOX|BROWNING|CAMILLUS|FALLKNIVEN|KA-BAR|RANDALL|BOWIE|BUCK|KERSHAW|CASE|REMINGTON|EXPLORER|MORAKNIV|ONTARIO/i.test(brand)) {
        return 'survival';
    }
    
    // ===== PASS 9: DEFAULT TO GEAR =====
    // Everything else that passed brand filtering goes to gear
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
