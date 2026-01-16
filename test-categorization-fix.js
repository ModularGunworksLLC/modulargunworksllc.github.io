// Quick test of the fixed categorization logic
// Copy the categorizeProduct function and test with sample products

function categorizeProduct(product) {
    const name = (product.name || '').toUpperCase();
    
    // ===== GLOBAL EXCLUSIONS =====
    const globalExclusions = [
        /GIFT\s*CARD|CREDIT|VOUCHER|SERVICE FEE|ENGRAVING|GUNSMITHING|LABOR|INSTALLATION|LICENSE|PERMIT|TRAINING|CLASS|COURSE/i
    ];
    
    for (const pattern of globalExclusions) {
        if (pattern.test(name)) return 'gear';
    }
    
    // ===== PASS 1: RELOADING FIRST (Most Specific) =====
    const reloadingMatch = /BULLET(?!PROOF)|BULLETS|BRASS|PRIMER(?!Y)|PRIMERS|POWDER|DIE(?!T)|PRESS(?!URE)?|SCALE|CASE\s*TRIMMER|TUMBLER|CALIPERS|RELOADER|PROJECTILE|\.DIA(?!L)|CT\s*BULLET|POWDER\s*CHARGE|LOADING\s*BLOCK|BULLET\s*PULLER/i.test(name);
    
    if (reloadingMatch) return 'reloading';
    
    // ===== PASS 2: AMMUNITION (Finished Cartridges - Exclude Magazine Keywords) =====
    const ammoExclusions = [
        /MAGAZINE|MAG(?!NET|AZINE)|CLIP(?!BOARD)|DRUM(?!STICK|FIRE)|POUCH|HOLSTER|CASE\s*ONLY|BOX\s*ONLY|CARRIER|STORAGE|ROUNDS\s*ONLY|EMPTY\s*BOX/i
    ];
    
    const ammoMatch = !ammoExclusions.some(p => p.test(name)) && 
        /AMMO|ROUND(?!UP|ER)|CARTRIDGE|SHOTSHELL|9MM|9X19|5\.56|223|308|7\.62|45\s*ACP|40\s*S&W|12GA|20GA|\.22|FMJ|JHP|FEDERAL|HORNADY|WINCHESTER|REMINGTON|BLAZER|CCI|AGUILA|PMC|FIOCCHI|SPEER|NORMA|MAGTECH|ARMSCOR|PPU|RIO|SELLIER|HSM|FRONTIER|AMMO\s*INC|CORBON|UNDERWOOD|LIBERTY|LIBERTY\s*AMMUNITION/i.test(name);
    
    if (ammoMatch) return 'ammunition';
    
    // ===== PASS 3: MAGAZINES (Most Specific After Ammo/Reloading) =====
    const magExclusions = [
        /POWDER|PRIMER|BRASS|BULLET|RELOAD|COMPONENT|AMMO|CARTRIDGE|ROUND(?!UP|ER)|POUCH|HOLSTER|CARRIER|CASE\s*ONLY|BOX\s*ONLY/i
    ];
    
    const magMatch = !magExclusions.some(p => p.test(name)) && 
        /\bMAGAZINE\b|\bMAG\s|\bPMAG\b|\bCLIP\b|\bDRUM\b|\bLOADER\b|(\d+RD(?:\s+MAG)?)|RD\s+(?:MAGAZINE|MAG|DRUM)|\bMAGAZINE\s*EXTENSION\b/i.test(name);
    
    if (magMatch) return 'magazines';
    
    // ===== PASS 4: OPTICS =====
    const opticsExclusions = [
        /COVER|CAP|MOUNT|BASE|RING|RAIL|TARGET|BAG|CASE|SLING|STRAP|CLEAN|TOOL|KIT|POUCH|BATTERY|ADAPTER|CONNECTOR|EXTENSION|CLAMP|RISER|SPACER/i
    ];
    
    const opticsMatch = !opticsExclusions.some(p => p.test(name)) && 
        /SCOPE|RED\s*DOT|HOLOGRAPHIC|MAGNIFIER|RIFLESCOPE|REFLEX|LASER\s*SIGHT|OPTIC(?!S\s*READY)?|BINOCULAR|MONOCULAR|RANGEFINDER|THERMAL|NIGHT\s*VISION/i.test(name);
    
    if (opticsMatch) return 'optics';
    
    // ===== PASS 5: GUN PARTS =====
    const partsExclusions = [
        /CLEANER|BRUSH|BORE|SCRUBBER|DEGREASER|PUNCH|HAMMER|WRENCH|VISE|TOOL|KIT|ROD|PATCH|LUBRIC|SOLVENT|POUCH|HOLSTER|STORAGE|CARRIER|PACK|VEST|CHEST|SLING|STRAP|POWDER|PRIMER|BRASS|BULLET|RELOAD|COMPONENT|AMMUNITION|AMMO|CARTRIDGE|ROUND/i
    ];
    
    const partsMatch = !partsExclusions.some(p => p.test(name)) && 
        /TRIGGER|BCG|BOLT\s*CARRIER|BARREL|UPPER|LOWER|BUFFER|GAS\s*BLOCK|HANDGUARD|STOCK|GRIP|RECEIVER|CHARGING\s*HANDLE|SAFETY|SELECTOR|SPRING|PIN|MOUNT|BASE|RING|RAIL|FOREGRIP|MUZZLE|BRAKE|FLASH\s*HIDER|SUPPRESSOR|BOLT|CARRIER\s*GROUP|CHARGING\s*HANDLE/i.test(name);
    
    if (partsMatch) return 'gun-parts';
    
    // ===== PASS 6: SURVIVAL/GEAR =====
    const survivalMatch = /KNIFE|MULTI\s*TOOL|MULTI-TOOL|FLASHLIGHT|FIRST\s*AID|MEDICAL|WATER|FIRE\s*STARTER|PARACORD|EMERGENCY|TACTICAL|OUTDOOR|CAMPING|GEAR|BACKPACK|PACK|POUCH|HOLSTER|CHEST\s*RIG|VEST|BELT|SLING|STRAP|CASE|BAG|CASE/i.test(name);
    
    if (survivalMatch) return 'survival';
    
    // ===== PASS 7: BRAND FALLBACK =====
    // Check parts brands FIRST before magazine brands
    if (/MAGPUL|BCM|GEISSELE|MIDWEST|RADIAN|REPTILIA|CLOUD|SUREFIRE|STREAMLIGHT|SAFARILAND|BLUE\s*FORCE|HOGUE|TIMNEY|TRIGGERTECH|AR15|AR-15|AERO\s*PRECISION|DANIEL\s*DEFENSE|LWRC|NOVESKE|PSA|BALLISTIC/i.test(name)) {
        if (!/MAGAZINE|MAG(?!NET|AZINE)|PMAG|CLIP|DRUM|LOADER/i.test(name)) {
            return 'gun-parts';
        }
    }
    
    if (/FEDERAL|HORNADY|WINCHESTER|REMINGTON|PMC|FIOCCHI|SPEER|CCI|BLAZER|NORMA|AGUILA|AMMO\s*INC|ARMSCOR|ATLANTA\s*ARMS|BARNES|BARRETT|BERGER|BROWNING|CORBON|DOUBLE\s*TAP|ESTATE|FRONTIER|HEVI-SHOT|HSM|KENT|LIBERTY|MAGTECH|MIGRA|NOBEL|NOSLER|PPU|RIO|SELLIER|SIERRA|SIG\s*SAUER|SK|SWIFT|UNDERWOOD|WEATHERBY|WILSON/i.test(name)) {
        return 'ammunition';
    }
    
    if (/RCBS|LEE|LYMAN|HORNADY|DILLON|REDDING|FRANKFORD|HODGDON|ALLIANT|ACCURATE|VIHTAVUORI|IMR|LAPUA|STARLINE|POWDER\s*VALLEY/i.test(name)) {
        return 'reloading';
    }
    
    if (/TRIJICON|EOTECH|AIMPOINT|HOLOSUN|VORTEX|LEUPOLD|PRIMARY\s*ARMS|NIGHTFORCE|BUSHNELL|ZEISS|NIKON|STEINER|SWAROVSKI|RIFLESCOPE|THERMAL/i.test(name)) {
        return 'optics';
    }
    
    if (/MAGPUL|PMAG|LANCER|HEXMAG|ETS|KCI|GLOCK|RUGER|MAGAZINE/i.test(name)) {
        return 'magazines';
    }
    
    if (/GERBER|SOG|BENCHMADE|KERSHAW|CRKT|STREAMLIGHT|SUREFIRE|BROWNING|SMITH\s*AND\s*WESSON|VICTORINOX|OPINEL|CONDOR|ESEE|COLD\s*STEEL/i.test(name)) {
        return 'survival';
    }
    
    return 'gear';
}

// Test products from the JSON files
const testProducts = [
    // From gear.json (SHOULD be ammunition, not gear)
    { name: 'CCI WMR MAXI MAG 40GR TMJ AMMO 50RD' },
    { name: 'CCI WMR MAXI MAG 40GR JHP AMMO 50RD' },
    { name: 'BLAZER 357 MAG 158GR JHP AMMO 50RD' },
    
    // From reloading.json (should be reloading)
    { name: 'ACCURATE POWDER #1680 1LB (0560)' },
    { name: 'ACCURATE POWD XMR-2015 1LB (0567)' },
    
    // From ammunition.json (should be ammunition)
    { name: 'Aguila 9MM FMJ 124 GR 50/RD' },
    { name: 'Aguila 9MM FMJ 115 GR  50/RD' },
    
    // From survival.json (should be survival)
    { name: 'Browning Joint Venture 3 Pocket Knife Jigged Sheep Horn' },
    { name: 'S&W HRT 2 in Boot Knife - Box' },
    
    // Edge cases
    { name: 'MAGPUL PMAG 30 5.56 NATO' },
    { name: 'MAGPUL BCM GUNFIGHTER STOCK' },
];

console.log('CATEGORIZATION TEST RESULTS\n');
console.log('═'.repeat(80));

testProducts.forEach(product => {
    const category = categorizeProduct(product);
    console.log(`${product.name.substring(0, 60).padEnd(60)} → ${category}`);
});

console.log('\n' + '═'.repeat(80));
console.log('✓ Test complete. Review categorization above.');
