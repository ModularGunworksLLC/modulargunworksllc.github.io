const fs = require('fs');
const path = require('path');

const categories = ['ammunition', 'magazines', 'optics', 'gun-parts', 'reloading', 'survival', 'gear'];
const data = {};
categories.forEach(cat => {
  const file = path.join(__dirname, 'data/products', cat + '.json');
  data[cat] = JSON.parse(fs.readFileSync(file, 'utf8')).products || [];
});

console.log('=== OPTICS (3888 items) ===');
const optics = data.optics;
console.log('  COVERS: ' + optics.filter(p => p.name.match(/COVER|CAP/i)).length);
console.log('  TARGETS: ' + optics.filter(p => p.name.match(/TARGET|SIGHT-IN/i)).length);
console.log('  MOUNTS/BASES: ' + optics.filter(p => p.name.match(/MOUNT|BASE|RING/i)).length);
console.log('  CLEANING: ' + optics.filter(p => p.name.match(/CLEAN|LUBRIC|CLOTH|LENS|WIPE/i)).length);
console.log('  SLINGS/STRAPS: ' + optics.filter(p => p.name.match(/SLING|STRAP|CASE|CORD/i)).length);
console.log('  BATTERIES: ' + optics.filter(p => p.name.match(/BATTERY|BATTERIES/i)).length);

console.log('\n=== AMMUNITION (6747 items) ===');
const ammo = data.ammunition;
console.log('  LOOSE BULLETS: ' + ammo.filter(p => p.name.match(/BULLET|\.DIA|PROJECTILE/i) && !p.name.match(/AMMO|LOADED|ROUND|CARTRIDGE/i)).length);
console.log('  POWDER/PRIMER/BRASS: ' + ammo.filter(p => p.name.match(/POWDER|PRIMER|BRASS|RELOAD/i)).length);
console.log('  AMMO BOXES: ' + ammo.filter(p => p.name.match(/AMMO BOX|AMMUNITION BOX|CASE STORAGE/i)).length);
console.log('  AMMO POUCHES/BELTS: ' + ammo.filter(p => p.name.match(/AMMO POUCH|AMMO BELT|MAG POUCH|AMMUNITION CARRIER/i)).length);
console.log('  CLEANING PRODUCTS: ' + ammo.filter(p => p.name.match(/CLEANER|BRUSH|BORE|SCRUBBER|DEGREASER|OIL|LUBRIC|CLOTH|WIPE|BLUE|COMPOUND|STOCK SEALER/i)).length);
console.log('  TARGETS/RANGE AIDS: ' + ammo.filter(p => p.name.match(/TARGET|SIGHT SPOT|BULLSEYE|PASTER|VISION AID/i)).length);

console.log('\n=== MAGAZINES (1528 items) ===');
const mags = data.magazines;
console.log('  WITH MAG POUCHES/SLEEVES: ' + mags.filter(p => p.name.match(/SLEEVE|POUCH|CARRIER|BAND|HOLDER|HOLSTER/i)).length);

console.log('\n=== RELOADING (2461 items) ===');
const reload = data.reloading;
console.log('  POWDER: ' + reload.filter(p => p.name.match(/POWDER(?!ED)/i)).length);
console.log('  PRIMERS: ' + reload.filter(p => p.name.match(/PRIMER/i)).length);
console.log('  BULLETS/DIA: ' + reload.filter(p => p.name.match(/BULLET|\.DIA|PROJECTILE/i)).length);
console.log('  BRASS: ' + reload.filter(p => p.name.match(/BRASS|UNPRIMED|FIRED/i)).length);
console.log('  EQUIPMENT: ' + reload.filter(p => p.name.match(/PRESS|TRIMMER|SCALE|TUMBLER|CALIPER|TOOL/i)).length);

console.log('\n=== GUN-PARTS (1821 items) ===');
const parts = data['gun-parts'];
console.log('  CLEANING/TOOLS: ' + parts.filter(p => p.name.match(/CLEANER|BRUSH|BORE|SCRUBBER|DEGREASER|PUNCH|HAMMER|WRENCH|VISE|TOOL|KIT|ROD|PATCH|LUBRIC|SOLVENT/i)).length);
console.log('  STORAGE/CASES: ' + parts.filter(p => p.name.match(/CASE|BOX|BAG|POUCH|HOLSTER|STORAGE|CARRIER|PACK|VEST|CHEST|SLING|STRAP/i) && !p.name.match(/UPPER|LOWER|BARREL|TRIGGER|STOCK|GRIP/i)).length);

console.log('\n=== SURVIVAL (800 items) ===');
const surv = data.survival;
console.log('  KNIVES: ' + surv.filter(p => p.name.match(/KNIFE|BLADE/i)).length);
console.log('  LIGHTS: ' + surv.filter(p => p.name.match(/FLASHLIGHT|LIGHT|TORCH|LAMP|LANTERN/i)).length);
console.log('  TOOLS/MULTI-TOOLS: ' + surv.filter(p => p.name.match(/TOOL|LEATHERMAN|GERBER|SOG|MULTI/i)).length);

console.log('\n=== GEAR (29104 items - DUMPING GROUND) ===');
const gear = data.gear;
console.log('  POWDER/RELOADING: ' + gear.filter(p => p.name.match(/POWDER|PRIMER|RELOAD|BRASS|BULLET|\.DIA/i)).length);
console.log('  LOOSE AMMO: ' + gear.filter(p => p.name.match(/ROUND|ROUNDS|CARTRIDGE|AMMO|AMMUNITION/i) && !p.name.match(/LOADED|BOX|SHELL|CASE|POUCH|BELT/i)).length);
console.log('  CLEANING: ' + gear.filter(p => p.name.match(/CLEANER|BRUSH|BORE|SCRUBBER|DEGREASER|OIL|LUBRIC|CLOTH|WIPE|COMPOUND|STOCK SEALER|BLUE|REFINISH/i)).length);
console.log('  TOOLS: ' + gear.filter(p => p.name.match(/TOOL|WRENCH|HAMMER|PUNCH|SCREWDRIVER|VISE|SCALE|TUMBLER|PRESS|KIT|CALIPER|GAUGE/i)).length);
console.log('  TARGETS: ' + gear.filter(p => p.name.match(/TARGET|BULLSEYE|PASTER|SIGHT SPOT/i)).length);
console.log('  STORAGE: ' + gear.filter(p => p.name.match(/CASE|BOX|BAG|POUCH|HOLSTER|CARRIER|PACK|VEST|CHEST|SLING|STRAP/i)).length);

console.log('\n=== TOTALS ===');
let total = 0;
Object.entries(data).forEach(([cat, prods]) => {
  console.log(cat + ': ' + prods.length);
  total += prods.length;
});
console.log('TOTAL: ' + total);

console.log('\n=== SAMPLE MISCLASSIFIED ITEMS ===');
console.log('\nOPTICS - Scope covers:');
optics.filter(p => p.name.match(/COVER/i)).slice(0, 3).forEach(p => console.log('  ' + p.name.substring(0, 70)));

console.log('\nAMMO - Loose bullets:');
ammo.filter(p => p.name.match(/BULLET|\.DIA/i) && !p.name.match(/AMMO|LOADED|ROUND|CARTRIDGE/i)).slice(0, 3).forEach(p => console.log('  ' + p.name.substring(0, 70)));

console.log('\nAMMO - Cleaning products:');
ammo.filter(p => p.name.match(/CLEANER|BORE|BRUSH|DEGREASER/i)).slice(0, 3).forEach(p => console.log('  ' + p.name.substring(0, 70)));

console.log('\nGEAR - Reloading components:');
gear.filter(p => p.name.match(/POWDER|PRIMER|BULLET/i)).slice(0, 3).forEach(p => console.log('  ' + p.name.substring(0, 70)));
