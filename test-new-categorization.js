const crypto = require('crypto');

const API_SID = process.env.API_SID;
const API_TOKEN = process.env.API_TOKEN;
const API_BASE = 'https://api.chattanoogashooting.com/rest/v4';

const CATEGORY_PATTERNS = {
  reloading: [
    /(?:PRESS|PROGRESSIVE|SCALE|CALIPER|CALIPERS|DIE|SHELL HOLDER|TUMBLER|MEDIA|PULLER|SEATER|BENCH|LOADER|CASE TRIMMER|TRIMMER|CASE PREP|PRIMER POCKET)/i,
    /(?:BRASS|SHELL CASING|CASE).*(?:NEW|FIRED|UNPRIMED|PRIMED|BULK|COUNT)/i,
    /(?:RELOADING POWDER|SMOKELESS POWDER|BLACKPOWDER|MUZZLELOADING POWDER|DUPLICATE).*(?:\d+LB|GRAIN|GRANULE)/i,
    /(?:SMALL RIFLE|SMALL PISTOL|LARGE RIFLE|LARGE PISTOL|MAGNUM|SHOTGUN).*(?:PRIMER|PRIMERS)/i,
    /(?:RCBS|LEE|HORNADY RELOADING|LYMAN RELOADING|REDDING|FRANKFORD ARSENAL|DILLON|FORSTER|SINCLAIR|LYMAN SCALES)/i,
  ],
  ammunition: [
    /\d+(?:MM|GA|AWG|GRAIN|GR)\s*.*?\s*(?:\d+)?(?:GR|GRAIN).*(?:AMMO|AMMUNITION|ROUNDS?|BOX|RD|FMJ|JHP|SOFT|POINT|TARGET|HUNTING|MATCH|CRITICAL|DEFENSE|HOLLOW|LOAD|CASE)/i,
    /(?:\d+GA|12GA|20GA|16GA|10GA|3IN|3\.5IN)\s*(?:\d+)?(?:OZ|OZ\.)\s*(?:\d+)?(?:SHOT|BUCKSHOT|SLUG|SHELL|AMMO)/i,
    /(?:FEDERAL|REMINGTON|HORNADY|WINCHESTER|SPEER|BLAZER|WOLF|TULA|TULAMMO|FIOCCHI|PMC|CCI|AGUILA|AMERICAN|ARMSCOR|MAGTECH|NORMA|PERFECTA|PPU|ROCKY).*(?:AMMO|AMMUNITION|ROUND|LOAD|9MM|45|40|308|223|556|762|380|357|38|44|50BMG)/i,
    /(?:AMMO|AMMUNITION|CARTRIDGE).*(?:BOX|ROUND|SHELL|COUNT|CT|RD).*\d+/i,
  ],
  magazines: [
    /MAGAZINE.*(?:\d+RD|\d+ROUND|CAPACITY|CAP)/i,
    /(?:^|\s)MAG(?:\s|$).*\d+(?:RD|ROUND)/i,
    /DRUM.*(?:MAGAZINE|MAG|ROUND|RD)/i,
    /(?:GLOCK|SIG|SMITH|RUGER|COLT|TAURUS|SPRINGFIELD|AR-15|M1911|M4).*(?:MAGAZINE|MAG|MAGAZINE|CLIP)/i,
  ],
  'gun-parts': [
    /(?:SLIDE|RECEIVER|BOLT CARRIER GROUP|BCG|CHARGING HANDLE|HANDGUARD|FOREGRIP|RAIL|STOCK|BUFFER TUBE|BUFFER|SPRING|TRIGGER|HAMMER|SEAR|SAFETY|SELECTOR|MUZZLE BRAKE|COMP|FLASH HIDER|FLASH SUPPRESSOR|SUPPRESSOR|BARREL|CHAMBER)/i,
    /(?:LOWER RECEIVER|LOWER|FRAME|GRIP FRAME|RECEIVER ASSEMBLY)/i,
    /(?:UPPER RECEIVER|ACTION|BOLT|BOLT FACE)/i,
  ],
  optics: [
    /(?:SCOPE|SIGHT|OPTIC|RED DOT|LASER|HOLOGRAPHIC|PRISM|THERMAL|NIGHT VISION|NV|MAGNIFIER)/i,
    /(?:ACOG|EOTECH|TRIJICON|VORTEX|LEUPOLD|BUSHNELL|NIKON|ZEISS|SWAMPFOX|HOLOSUN|AGM|PULSAR|ATN|SIGHTMARK)/i,
  ],
  gear: [
    /(?:SHIRT|JACKET|VEST|PANT|PANTS|BOOT|BOOTS|HAT|CAP|GLOVE|GLOVES|SOCKS|UNDERWEAR|PANTS|SHORTS|SWEATSHIRT|HOODIE|FLEECE)/i,
    /(?:HOLSTER|CHEST RIG|CARRIER|PLATE CARRIER|SHOULDER HOLSTER|ANKLE HOLSTER|APPENDIX)/i,
    /(?:TACTICAL|SLING|STRAP|POUCH|PACK|BAG|CASE|RANGE BAG)/i,
    /(?:CLEANING|MAINTENANCE|LUBRICANT|LUBRICATING|OIL|SOLVENT|CLEANER|BRUSH|PATCH|ROD|BORE).*(?:KIT|SET|GUN|RIFLE|PISTOL)/i,
  ],
  survival: [
    /(?:SURVIVAL|CAMPING|HIKING|OUTDOOR|EMERGENCY).*(?:KIT|GEAR|PACK|BAG)/i,
    /(?:KNIFE|BLADE|PARACORD|ROPE|FLASHLIGHT|LIGHT|FIRE STARTER|COMPASS|MAP|MULTI-TOOL|TOOL|FIRST AID|MEDICAL)/i,
  ]
};

function categorizeProduct(product) {
  const name = product.name || '';
  for (const [category, patterns] of Object.entries(CATEGORY_PATTERNS)) {
    for (const pattern of patterns) {
      if (pattern.test(name)) {
        return category;
      }
    }
  }
  return 'gear';
}

function getAuthHeader(token) {
  const tokenHash = crypto.createHash('md5').update(token).digest('hex');
  const authValue = `${API_SID}:${tokenHash}`;
  return `Basic ${authValue}`;
}

async function testCategorization() {
  console.log('Testing improved categorization...\n');
  
  const authHeader = getAuthHeader(API_TOKEN);
  const response = await fetch(`${API_BASE}/items?page=1&per_page=100`, {
    headers: {
      'Authorization': authHeader,
      'Content-Type': 'application/json'
    }
  });
  
  const data = await response.json();
  const categorized = {};
  
  data.items.forEach(item => {
    const category = categorizeProduct(item);
    if (!categorized[category]) categorized[category] = [];
    categorized[category].push(item.name);
  });
  
  console.log('Sample categorization results:\n');
  Object.entries(categorized).forEach(([category, items]) => {
    console.log(`${category.toUpperCase()} (${items.length} items):`);
    items.slice(0, 5).forEach(name => console.log(`  • ${name}`));
    if (items.length > 5) console.log(`  ... and ${items.length - 5} more`);
    console.log();
  });
}

testCategorization();
