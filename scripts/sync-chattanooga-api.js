/**
 * BATCH TEST MODE
 * Usage:
 *   node scripts/sync-chattanooga-api.js --batch file.txt
 *
 * file.txt should contain one SKU per line:
 * KBPICKSET
 * XNPRSRFMMG
 * ISPL76566U
 * RER0003
 * TJHC740735SM
 */

if (require.main === module && process.argv[2] === "--batch") {
  (async () => {
    const fs = require("fs");
    const file = process.argv[3];

    if (!file || !fs.existsSync(file)) {
      console.log("Usage: node scripts/sync-chattanooga-api.js --batch <file>");
      process.exit(1);
    }

    const lines = fs.readFileSync(file, "utf8")
      .split("\n")
      .map(l => l.trim())
      .filter(Boolean);

    console.log(`Running batch image resolver test on ${lines.length} SKUs...\n`);

    const results = [];

    for (const sku of lines) {
      let attempted = [];
      let successful = [];
      let chosen = null;

      // Patch logDebug to capture resolver output
      const origLogDebug = logDebug;
      global.logDebug = (section, details) => {
        if (section === "IMAGE_RESOLVER_LOG") {
          attempted = details.attempted;
          successful = details.successful;
          // chosen = details.chosen; // Don't set from logDebug, use actual return value
        }
        origLogDebug(section, details);
      };

      chosen = await resolveProductImage({ id: sku, brand: "", name: "" });

      results.push({
        sku,
        chosen,
        successCount: successful.length
      });

      console.log(`SKU: ${sku}`);
      console.log(`  Successful: ${successful.length}`);
      console.log(`  Chosen: ${chosen}`);
      console.log("");
    }

    console.log("\n===== SUMMARY =====");
    const passed = results.filter(r => r.chosen);
    const failed = results.filter(r => !r.chosen);

    console.log(`Total SKUs: ${results.length}`);
    console.log(`Resolved: ${passed.length}`);
    console.log(`Failed: ${failed.length}`);

    if (failed.length > 0) {
      console.log("\nFailed SKUs:");
      failed.forEach(r => console.log("  " + r.sku));
    }

    process.exit(0);
  })();
}
// sync-chattanooga-api.js
// Deterministic, exclusion-first, instrumented Chattanooga sync

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

// ========== CONFIG & CONSTANTS ==========

const API_SID = process.env.API_SID;
const API_TOKEN = process.env.API_TOKEN;
const API_BASE = "https://api.chattanoogashooting.com/rest/v4";
const DEBUG_RAW_PRODUCT = process.argv.includes("--debug-raw");

// Top brands (inclusive) and bad brands (exclusive)
const TOP_BRANDS = [
  // Firearms
  "GLOCK", "SMITH & WESSON", "S&W", "SIG SAUER", "RUGER", "FN", "HK", "CZ",
  "WALTHER", "SPRINGFIELD ARMORY", "DANIEL DEFENSE", "BCM", "AERO PRECISION",
  "GEISSELE", "NOVESKE", "LWRC", "PSA",

  // Optics
  "TRIJICON", "EOTECH", "LEUPOLD", "NIGHT FISION", "MEPROLIGHT", "XS SIGHT SYSTEMS",
  "VIRIDIAN", "PULSAR", "INFIRAY", "ATHLON", "BURRIS", "BUSHNELL", "RITON",
  "SWAMPFOX", "SIGHTMARK", "HI-VIZ", "HIVIZ", "BUTLER CREEK", "WEAVER", "WARNE",
  "TALLEY", "DNZ", "AREA 419",

  // Magazines
  "MAGPUL", "PMAG", "LANCER", "HEXMAG", "ETS", "KCI",

  // Ammunition
  "FEDERAL", "HORNADY", "WINCHESTER", "REMINGTON", "PMC", "FIOCCHI", "SPEER",
  "CCI", "BLAZER", "NORMA", "AGUILA", "AMMO INC", "ARMSCOR", "BARNES",
  "BERGER", "BROWNING", "COR-BON", "ESTATE", "FN", "FRONTIER", "HEVI-SHOT",
  "HSM", "KENT", "LAPUA", "MAGTECH", "NOSLER", "PPU", "RIO", "SELLIER & BELLOT",
  "SIERRA", "SIG SAUER", "UNDERWOOD", "WEATHERBY", "WILSON COMBAT",

  // Parts & Accessories
  "MAGPUL", "BCM", "GEISSELE", "MIDWEST INDUSTRIES", "RADIAN", "REPTILIA",
  "CLOUD DEFENSIVE", "SUREFIRE", "STREAMLIGHT", "SAFARILAND", "BLUE FORCE GEAR",
  "HOGUE", "TIMNEY", "TRIGGERTECH",

  // Reloading
  "HORNADY", "RCBS", "LYMAN", "LEE", "DILLON", "HODGDON", "ALLIANT",
  "ACCURATE", "VIHTAVUORI", "IMR",

  // Outdoors / Gear
  "GERBER", "SOG", "BENCHMADE", "KERSHAW", "CRKT", "STREAMLIGHT", "SUREFIRE"
];

const BAD_BRANDS = [
  "NCSTAR", "UTG", "LEAPERS", "ALLEN", "GENERIC", "UNBRANDED", "UNKNOWN",
  "AIRSOFT", "PAINTBALL", "CROSMAN", "DAISY", "GAME WINNER",
  "HUNTER'S SPECIALTIES", "MISC", "IMPORTS"
];

// If you have a Chattanooga→site category map JSON, require it here.
// Otherwise, use an empty object and rely on name-based categorization.
let chattanoogaToSiteMapping = {};
try {
  chattanoogaToSiteMapping = require("./chattanooga-category-map.json");
} catch {
  chattanoogaToSiteMapping = {};
}

// ========== LOGGING ==========

function logDebug(section, details) {
  console.log(`\n===== ${section} =====`);
  console.log(JSON.stringify(details, null, 2));
}

// ========== HELPERS ==========

function getAuthHeader(token) {
  const tokenHash = crypto.createHash("md5").update(token).digest("hex");
  return `Basic ${API_SID}:${tokenHash}`;
}

async function fetchAllProducts(page = 1) {
  try {
    const url = `${API_BASE}/items?page=${page}&per_page=200`;
    const authHeader = getAuthHeader(API_TOKEN);

    const response = await fetch(url, {
      headers: {
        Authorization: authHeader,
        "Content-Type": "application/json"
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

function loadActiveProducts() {
  try {
    const activePath = path.join(__dirname, "../data/products/active.json");
    if (fs.existsSync(activePath)) {
      const data = JSON.parse(fs.readFileSync(activePath, "utf8"));
      const active = {};
      Object.entries(data).forEach(([key, value]) => {
        if (!key.startsWith("_") && value && typeof value === "object" && value.page) {
          active[key] = value;
        }
      });
      return active;
    }
  } catch (error) {
    console.warn("No active.json found, syncing all products");
  }
  return {};
}

// ========== BRAND & COMPLIANCE FILTERS ==========

function shouldIncludeBrand(product) {
  const brand = (product.brand || "GENERIC").toUpperCase().trim();

  if (BAD_BRANDS.some(b => brand.includes(b))) return false;
  if (TOP_BRANDS.some(b => brand.includes(b))) return true;

  // Soft-allow: if brand is unknown but category is strong
  return ["ammunition", "magazines", "optics", "gun-parts", "reloading"].includes(
    product.category || ""
  );
}

function shouldIncludeProduct(apiProduct) {
  const fflRequired =
    apiProduct.ffl_flag === 1 ||
    apiProduct.ffl_flag === true ||
    apiProduct.ffl_flag === "Y";

  const serialized =
    apiProduct.serialized_flag === 1 ||
    apiProduct.serialized_flag === true ||
    apiProduct.serialized_flag === "Y";

  const allocated =
    apiProduct.allocated_flag === 1 ||
    apiProduct.allocated_flag === true ||
    apiProduct.allocated_flag === "Y" ||
    apiProduct.allocated === true;

  const discontinued =
    apiProduct.discontinued === 1 ||
    apiProduct.discontinued === true ||
    apiProduct.discontinued === "Y";

  const inventory = parseInt(apiProduct.inventory || 0, 10);
  const price = parseFloat(apiProduct.retail_price || 0);
  const upc = (apiProduct.upc_code || "").trim();
  const sku = (apiProduct.cssi_id || "").trim();
  const department = apiProduct.department || "";
  const name = (apiProduct.name || "").toUpperCase();

  if (inventory <= 0) return false;
  if (discontinued) return false;
  if (price <= 0) return false;
  if (!upc && !sku) return false;

  // Be conservative with FFL/serialized: exclude for now
  if (fflRequired || serialized) return false;

  // Suppressors and parts: allow only clear accessories
  if (department === "Suppressors and Parts") {
    const allowedParts = /ADAPTER|MOUNT|PISTON|END\s*CAP|SPACER|SHIM|WRENCH/i.test(name);
    const hasSuppressorKeywords = /SUPPRESSOR|SILENCER|QD\s*SUPPRESSOR|SUPPRESSOR\s*KIT/i.test(
      name
    );
    if (!allowedParts || hasSuppressorKeywords) return false;
  }

  // Exclude explicit suppressor keywords anywhere
  if (/SUPPRESSOR|SILENCER|QD\s*SUPPRESSOR|SUPPRESSOR\s*KIT/i.test(name)) return false;

  return true;
}

// ========== CATEGORIZATION ==========

function categorizeProduct(product) {
  const name = (product.name || "").toUpperCase();
  const vendorCategory = product.vendorCategory || "";

  // 0. Vendor category mapping
  if (vendorCategory && chattanoogaToSiteMapping[vendorCategory]) {
    return chattanoogaToSiteMapping[vendorCategory];
  }

  // Global exclusions → gear
  if (
    /GIFT\s*CARD|CREDIT|VOUCHER|SERVICE FEE|ENGRAVING|GUNSMITHING|LABOR|INSTALLATION|LICENSE|PERMIT|TRAINING|CLASS|COURSE/i.test(
      name
    )
  ) {
    return "gear";
  }

  const hasAmmoWords =
    /\bAMMO\b|\bROUND\b|\bCARTRIDGE\b|\b9MM\b|\b223\b|\b308\b|\b45\s*AUTO\b|\b40\s*S&W\b|\b380\s*AUTO\b|\b10MM\b|\b12GA\b|\b20GA\b|\b410GA\b|\bBUCKSHOT\b|\bSLUG\b/i.test(
      name
    );

  const hasGunPartWords =
    /\bTRIGGER\b|\bBARREL\b|\bUPPER\b|\bLOWER\b|\bRECEIVER\b|\bSTOCK\b|\bHANDGUARD\b|\bBOLT CARRIER\b|\bBUFFER\b/i.test(
      name
    );

  const hasOpticWords =
    /\bSCOPE\b|\bRED\s*DOT\b|\bHOLOGRAPHIC\b|\bRIFLESCOPE\b|\bOPTIC\b|\bMAGNIFIER\b/i.test(
      name
    );

  const hasOutdoorsWords =
    /\bKNIFE\b|\bFLASHLIGHT\b|\bTACTICAL\b|\bGEAR\b|\bHOLSTER\b|\bCASE\b|\bSLING\b|\bMULTI-TOOL\b|\bPACK\b|\bBACKPACK\b/i.test(
      name
    );

  const isCaseOrBag =
    /\bCASE\b|\bBAG\b|\bSLEEVE\b|\bHOLSTER\b|\bSCABBARD\b|\bPACK\b|\bBACKPACK\b/i.test(name);

  const magazineExclusions = [
    "MAG PRO",
    "MAGNUM",
    "MAGTECH",
    "PERCUSSION",
    "CAPS",
    "PRIMER",
    "PRIMERS",
    "POWDER",
    "GRAIN",
    "MUZZLE",
    "MUZZLELOADER",
    "BLACK POWDER",
    "RELOADING",
    "MAXI MAG"
  ];

  const isMagazineCore =
    /\bMAGAZINE\b/i.test(name) ||
    /\bMAG\b/i.test(name) ||
    /\bPMAG\b/i.test(name) ||
    /\bDRUM\b/i.test(name);

  const blockedMagazine = magazineExclusions.some(ex => name.includes(ex));
  const isMagazine = isMagazineCore && !blockedMagazine && !hasAmmoWords;

  const ammoExclusive = hasAmmoWords && !isMagazine;

  // 1. Reloading
  if (
    /\bBULLET\b|\bBRASS\b|\bPRIMER\b|\bPOWDER\b|\bDIE\b|\bPRESS\b|\bRELOADING\b|\bSHELL HOLDER\b/i.test(
      name
    )
  ) {
    return "reloading";
  }

  // 2. Ammunition
  if (ammoExclusive && !hasGunPartWords) {
    return "ammunition";
  }

  // 3. Magazines
  if (isMagazine) {
    return "magazines";
  }

  // 4. Optics
  if (hasOpticWords && !isCaseOrBag) {
    return "optics";
  }

  // 5. Gun parts
  if (hasGunPartWords) {
    return "gun-parts";
  }

  // 6. Outdoors
  if (hasOutdoorsWords || isCaseOrBag) {
    return "outdoors";
  }

  // 7. Brand fallback
  const brand = (product.brand || "").toUpperCase();
  if (brand.match(/\bMAGPUL\b|\bBCM\b|\bGEISSELE\b/)) return "gun-parts";
  if (brand.match(/\bLEUPOLD\b|\bTRIJICON\b|\bEOTECH\b/)) return "optics";
  if (brand.match(/\bHORNADY\b|\bFEDERAL\b|\bWINCHESTER\b|\bREMINGTON\b/)) {
    if (ammoExclusive) return "ammunition";
    return "reloading";
  }

  // 8. Default
  return "gear";
}

function applyGlobalOverrides(product, category) {
  const name = (product.name || "").toUpperCase();

  // Bore-sighters → gear
  if (/BORESIGHT|BORE\s*SIGHT|LASER\s*CARTRIDGE/i.test(name)) {
    return "gear";
  }

  // Shotgun ammo → ammunition
  if (
    /12GA|20GA|16GA|10GA|410|SHOTSHELL|BUCKSHOT|SLUG/i.test(name) &&
    !/DIE|PRESS|POWDER|PRIMER|CASE|BRASS|BULLET|SHELL\s*HOLDER|RELOADING|DECAPPER|SIZER|TRIMMER/i.test(
      name
    )
  ) {
    return "ammunition";
  }

  return category;
}

// ========== ATTRIBUTE EXTRACTION ==========

function extractCaliber(name) {
  if (!name) return null;
  const patterns = [
    { pattern: /\b(9MM|9x19|9x19mm|9 ?MM|PARABELLUM)\b/i, normalized: "9MM" },
    { pattern: /\b(40\s*S&W|40\s*CAL|\.40|40SW)\b/i, normalized: ".40 S&W" },
    { pattern: /\b(45\s*ACP|45\s*AUTO|\.45|45 ?CAL)\b/i, normalized: ".45 ACP" },
    { pattern: /\b(380|\.380|380 ?AUTO)\b/i, normalized: ".380 ACP" },
    { pattern: /\b(357|\.357|357\s*MAG|357MAGNUM)\b/i, normalized: ".357 Mag" },
    { pattern: /\b(38|\.38|38\s*SPL|38\s*SPECIAL)\b/i, normalized: ".38 SPL" },
    { pattern: /\b(44|\.44|44\s*MAG|44MAGNUM)\b/i, normalized: ".44 Mag" },
    { pattern: /\b(10MM|10\s*MM)\b/i, normalized: "10MM" },
    { pattern: /\b(223|5\.56|5\.56\s*NATO|5\.56x45)\b/i, normalized: "5.56 NATO" },
    { pattern: /\b(308|7\.62\s*NATO|7\.62x51)\b/i, normalized: ".308 WIN" },
    { pattern: /\b(300\s*BLK|300\s*BLACKOUT)\b/i, normalized: "300 BLK" },
    { pattern: /\b(6\.5\s*CREED|6\.5\s*CREEDMOOR)\b/i, normalized: "6.5 Creed" },
    { pattern: /\b(22\s*LR|22\s*LONG\s*RIFLE|\.22|22LR)\b/i, normalized: ".22 LR" },
    { pattern: /\b(22\s*WMR|22\s*MAG|\.22\s*MAG)\b/i, normalized: ".22 WMR" },
    { pattern: /\b(12\s*GA|12\s*GAUGE|12GA)\b/i, normalized: "12 GA" },
    { pattern: /\b(20\s*GA|20\s*GAUGE|20GA)\b/i, normalized: "20 GA" },
    { pattern: /\b(16\s*GA|16\s*GAUGE|16GA)\b/i, normalized: "16 GA" },
    { pattern: /\b(10\s*GA|10\s*GAUGE|10GA)\b/i, normalized: "10 GA" },
    { pattern: /\b(\.410|410)\b/i, normalized: ".410" }
  ];
  for (const { pattern, normalized } of patterns) {
    if (pattern.test(name)) return normalized;
  }
  return null;
}

function extractPlatform(name) {
  if (!name) return null;
  const patterns = [
    { pattern: /\b(AR-?15|AR15|M4|M16)\b/i, normalized: "AR-15" },
    { pattern: /\b(AR-?10|AR10|LR308)\b/i, normalized: "AR-10" },
    { pattern: /\b(AK|AK-?47|AK-?74|AKM|SAIGA)\b/i, normalized: "AK Platform" },
    { pattern: /\bGLOCK\b/i, normalized: "Glock" },
    { pattern: /\b1911\b/i, normalized: "1911" },
    { pattern: /\bP320|P365|P226|P229\b/i, normalized: "Sig Sauer" }
  ];
  for (const { pattern, normalized } of patterns) {
    if (pattern.test(name)) return normalized;
  }
  return null;
}

function extractCapacity(name) {
  if (!name) return null;
  const match = name.match(
    /(?:MAG|MAGAZINE|CLIP).*?(\d{1,3})(?:\s*RD|ROUND|RDS)?|(\d{1,3})\s*(?:RD|ROUND|RDS)\b/i
  );
  if (match) {
    const capacity = match[1] || match[2];
    return parseInt(capacity, 10);
  }
  return null;
}

function extractMaterial(name) {
  if (!name) return null;
  const patterns = [
    { pattern: /\bPOLYMER\b|\bPLASTIC\b/i, normalized: "Polymer" },
    { pattern: /\bSTEEL\b|\BSTAINLESS\b/i, normalized: "Steel" },
    { pattern: /\bALUMINUM\b|\bALUMINIUM\b/i, normalized: "Aluminum" },
    { pattern: /\bCARBON\s*FIBER\b/i, normalized: "Carbon Fiber" },
    { pattern: /\bRUBBER\b/i, normalized: "Rubber" }
  ];
  for (const { pattern, normalized } of patterns) {
    if (pattern.test(name)) return normalized;
  }
  return null;
}

function deriveSubCategory(name, category) {
  const lower = (name || "").toLowerCase();

  if (category === "ammunition") {
    if (lower.includes("9mm") || lower.includes(".45") || lower.includes(".40") || lower.includes("10mm"))
      return "Handgun Ammo";
    if (lower.includes("223") || lower.includes("5.56") || lower.includes("308") || lower.includes("creed"))
      return "Rifle Ammo";
    if (lower.includes("12 gauge") || lower.includes("20 gauge") || lower.includes("buck") || lower.includes("slug"))
      return "Shotgun Ammo";
    if (lower.includes("rimfire") || lower.includes(".22")) return "Rimfire Ammo";
    return "Other Ammo";
  }

  if (category === "magazines") return "Magazines";

  return "";
}
// ========== IMAGE RESOLUTION (MONOLITHIC, MAX-COVERAGE) ==========

// Helper: safely normalize strings
function safeLower(str) {
  return (str || "").toString().trim().toLowerCase();
}

// Helper: collect all ID-like fields for filename patterns
function getIdCandidates(raw) {
  const ids = new Set();

  // Core SKU/id
  if (raw.sku) ids.add(raw.sku);
  if (raw.id) ids.add(raw.id);

  // Item number / vendor item / internal codes
  if (raw.itemNumber) ids.add(raw.itemNumber);
  if (raw.item_no) ids.add(raw.item_no);
  if (raw.item) ids.add(raw.item);
  if (raw.item_id) ids.add(raw.item_id);
  if (raw.vendorItemNumber) ids.add(raw.vendorItemNumber);
  if (raw.vendor_item_number) ids.add(raw.vendor_item_number);
  if (raw.internalId) ids.add(raw.internalId);
  if (raw.internal_id) ids.add(raw.internal_id);

  // MPN / manufacturer part number
  if (raw.mpn) ids.add(raw.mpn);
  if (raw.manufacturerPartNumber) ids.add(raw.manufacturerPartNumber);
  if (raw.manufacturer_part_number) ids.add(raw.manufacturer_part_number);
  if (raw.model) ids.add(raw.model);

  // UPC / GTIN
  if (raw.upc) ids.add(raw.upc);
  if (raw.upcCode) ids.add(raw.upcCode);
  if (raw.upc_code) ids.add(raw.upc_code);
  if (raw.gtin) ids.add(raw.gtin);

  return Array.from(ids).filter(Boolean);
}

// Helper: derive "internal" numeric-ish codes from SKUs (e.g., TJP0M252102 -> TJP00252102)
function deriveInternalCodes(raw) {
  const codes = new Set();

  const sku = (raw.sku || raw.id || "").toString();
  if (!sku) return [];

  // Example heuristic: keep first 3 letters, then all digits
  const prefix = sku.replace(/[^A-Za-z]/g, "").slice(0, 3);
  const digits = sku.replace(/[^0-9]/g, "");
  if (prefix && digits) {
    codes.add(prefix + digits);
  }

  return Array.from(codes).filter(Boolean);
}

// Helper: build base filenames from all ID-like sources
function buildBaseFilenames(product) {
  const raw = product.raw || {};
  const base = new Set();

  // Only use SKU/ID-based values for image filename patterns
  const idCandidates = getIdCandidates({
    sku: product.id,
    id: product.id,
    ...raw,
  });

  const internalCodes = deriveInternalCodes({ sku: product.id, ...raw });

  // Add all ID-like values
  for (const id of idCandidates) {
    base.add(id.toString());
  }

  // Add internal transformed codes
  for (const code of internalCodes) {
    base.add(code.toString());
  }

  // Do NOT add product-name-based or brand+SKU-based patterns

  return Array.from(base);
}

// Helper: expand filenames into all filename variants
function expandFilenameVariants(filename) {
  const variants = new Set();
  const base = filename.toString();

  // Always include the base
  variants.add(`${base}.jpg`);
  variants.add(`${base}.png`);

  // Common numeric and main variants
  variants.add(`${base}_1.jpg`);
  variants.add(`${base}_1.png`);
  variants.add(`${base}__1.jpg`);
  variants.add(`${base}__1.png`);
  variants.add(`${base}-1.jpg`);
  variants.add(`${base}-1.png`);
  variants.add(`${base}-2.jpg`);
  variants.add(`${base}-2.png`);
  variants.add(`${base}-3.jpg`);
  variants.add(`${base}-3.png`);
  variants.add(`${base}_main.jpg`);
  variants.add(`${base}_main.png`);
  variants.add(`${base}-main.jpg`);
  variants.add(`${base}-main.png`);

  // Add ammo type suffixes if present in the product name
  let productName = null;
  if (typeof global !== 'undefined' && global._currentProductName) {
    productName = global._currentProductName;
  }
  const ammoTypes = [
    'Centerfire', 'Rimfire', 'Shotgun', 'Handgun', 'Rifle', 'Pistol', 'Revolver',
    'Blank', 'Subsonic', 'Buckshot', 'Slug', 'Magnum', 'Match', 'Practice',
    'Training', 'Lead', 'Steel', 'Brass', 'Polymer', 'Non-Toxic', 'Plated',
    'HollowPoint', 'FMJ', 'JHP', 'SP', 'HP', 'LRN', 'TMJ', 'Varmint', 'Ball',
    'Tracer', 'Incendiary', 'ArmorPiercing', 'Frangible', 'ReducedRecoil',
    'LowRecoil', 'HighVelocity', 'Super', 'Mini', 'Short', 'Long', 'Extra',
    'Special', 'Express', 'Auto', 'ACP', 'WMR', 'Mag', 'Win', 'Rem', 'Savage',
    'Weatherby', 'Nosler', 'Lapua', 'Hornady', 'Federal', 'Fiocchi', 'PMC',
    'Blazer', 'Speer', 'CCI', 'Aguila', 'Norma', 'Barnes', 'Browning', 'CorBon',
    'Estate', 'Frontier', 'HSM', 'Kent', 'Lapua', 'Magtech', 'Nosler', 'PPU',
    'Rio', 'SellierBellot', 'Sierra', 'SigSauer', 'Underwood', 'Weatherby', 'WilsonCombat'
  ];
  if (productName) {
    for (const type of ammoTypes) {
      const regex = new RegExp(type, 'i');
      if (regex.test(productName)) {
        variants.add(`${base}-${type}.jpg`);
        variants.add(`${base}-${type}.png`);
      }
    }
  }
  return Array.from(variants);
}

// Helper: expand query-string variants for a given URL
function expandQueryVariants(url) {
  const variants = new Set();

  // bare
  variants.add(url);

  // simple width
  variants.add(`${url}?w=500`);
  variants.add(`${url}?width=500`);

  // Chattanooga-style transform
  variants.add(`${url}?w=437&h=454&q=5&v=1.0`);

  return Array.from(variants);
}

async function resolveProductImage(raw) {

  // ---- Basic guards ----
  if (!raw || !raw.id) {
    logDebug("IMAGE_RESOLVER_SKU_MISSING", {
      rawId: raw ? raw.id : null,
      brand: raw && raw.brand ? raw.brand : "",
      name: raw && raw.name ? raw.name : ""
    });
    return { image: "../images/placeholders/product-placeholder.png", ext: null };
  }

  const sku = raw.id;
  const fs = require("fs");
  const path = require("path");
  const fetch = global.fetch || require("node-fetch");

  // Deterministic CDN check order
  const candidates = [
    `https://media.chattanoogashooting.com/productimages/${sku}.jpg`,
    `https://media.chattanoogashooting.com/productimages/${sku}_1.jpg`,
    `https://media.chattanoogashooting.com/productimages/${sku}.png`,
    `https://media.chattanoogashooting.com/productimages/${sku}_1.png`
  ];

  let foundUrl = null;
  let ext = null;
  for (const url of candidates) {
    try {
      const res = await fetch(url, { method: "HEAD" });
      if (res.status >= 200 && res.status < 300) {
        foundUrl = url;
        ext = url.endsWith(".png") ? "png" : "jpg";
        break;
      }
    } catch (e) {}
  }

  // Download and save image if found
  if (foundUrl && ext) {
    try {
      const res = await fetch(foundUrl);
      if (res.status >= 200 && res.status < 300) {
        const arrayBuffer = await res.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const outDir = path.join(__dirname, "../public/images/thumbnails");
        if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
        const outPath = path.join(outDir, `${sku}.${ext}`);
        fs.writeFileSync(outPath, buffer);
        const relPath = `../images/thumbnails/${sku}.${ext}`;
        console.log(`Resolved image for ${sku}: ${relPath}`);
        return { image: relPath, ext };
      }
    } catch (e) {}
  }

  // If not found, use placeholder
  console.log(`Image missing for ${sku}, using placeholder`);
  return { image: "../images/placeholders/product-placeholder.png", ext: null };
}

// ========== TRANSFORMATION & SAVE ==========

function extractBrandFromName(name) {
  if (!name) return "Generic";
  const firstWord = name.split(" ")[0].toUpperCase();
  return firstWord;
}

async function transformProduct(apiProduct) {
  const productName = apiProduct.name || "Unknown Product";
  const msrp = parseFloat(apiProduct.retail_price || 0);
  const map = parseFloat(apiProduct.map_price || 0);
  const displayPrice = map > 0 ? map : msrp;

  if (displayPrice <= 0) return null;

  const brand = (apiProduct.brand || extractBrandFromName(productName) || "Generic").toUpperCase();
  const vendorCategory = apiProduct.category || apiProduct.subcategory || "";

  const imageResult = await resolveProductImage({
    id: apiProduct.cssi_id || apiProduct.id || "",
    brand,
    name: productName
  });

  const category = categorizeProduct({
    name: productName,
    brand,
    vendorCategory
  });

  const finalCategory = applyGlobalOverrides(
    { name: productName, brand },
    category || "gear"
  ) || "gear";

  const subCategory = deriveSubCategory(productName, finalCategory);

  const transformed = {
    id: apiProduct.cssi_id || apiProduct.id || "",
    name: productName,
    brand,
    category: finalCategory,
    subCategory,
    image: imageResult.image,
    hidden: false, // set below
    msrp,
    mapPrice: map,
    displayPrice,
    inventory: parseInt(apiProduct.inventory || 0, 10),
    inStock: apiProduct.in_stock_flag === 1,
    requiresFFL: apiProduct.ffl_flag === 1,
    serialized: apiProduct.serialized_flag === 1,
    dropShip: apiProduct.drop_ship_flag === 1,
    allocated: apiProduct.allocated_flag === 1,
    lastUpdated: apiProduct.qas_last_updated_at || "",
    caliber: extractCaliber(productName),
    platform: extractPlatform(productName),
    capacity: extractCapacity(productName),
    material: extractMaterial(productName)
  };

  logDebug("CATEGORY_DECISION", {
    sku: transformed.id,
    name: transformed.name,
    brand: transformed.brand,
    vendorCategory,
    assignedCategory: finalCategory
  });

  // Category-aware hiding logic
  const hideCategories = ["optics", "magazines", "gun-parts", "gear"];
  const shouldHide =
    transformed.image === null && hideCategories.includes(finalCategory);

  transformed.hidden = shouldHide;

  if (shouldHide) {
    logDebug("PRODUCT_HIDDEN", {
      sku: transformed.id,
      category: finalCategory,
      reason: "Missing image"
    });
  } else {
    logDebug("PRODUCT_VISIBLE", {
      sku: transformed.id,
      category: finalCategory,
      image: transformed.image
    });
  }

  return transformed;
}

function saveProducts(category, products) {
  const dir = path.join(__dirname, "../data/products");
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  const filepath = path.join(dir, `${category}.json`);
  const data = {
    category,
    lastUpdated: new Date().toISOString(),
    products
  };

  logDebug("JSON_WRITE", { file: filepath, count: products.length });
  fs.writeFileSync(filepath, JSON.stringify(data, null, 2));
  console.log(`✓ Saved ${products.length} products to ${category}.json`);
}

// ========== MISSING IMAGE AUDIT ==========

async function checkImageExists(url) {
  try {
    const res = await fetch(url, { method: "HEAD" });
    return res.ok;
  } catch {
    return false;
  }
}

async function auditMissingImages() {
  const categories = [
    "ammunition",
    "magazines",
    "reloading",
    "gun-parts",
    "optics",
    "gear",
    "outdoors"
  ];

  const results = {};
  const missingDetails = [];

  for (const cat of categories) {
    const file = path.join(__dirname, `../data/products/${cat}.json`);
    if (!fs.existsSync(file)) continue;

    const data = JSON.parse(fs.readFileSync(file, "utf8"));
    let missing = 0;

    for (const product of data.products) {
      if (!product.image) {
        missing++;
        missingDetails.push({
          id: product.id,
          name: product.name,
          brand: product.brand,
          category: cat,
          price: product.displayPrice || null,
          image: product.image
        });
        continue;
      }

      const exists = await checkImageExists(product.image);
      if (!exists) {
        missing++;
        missingDetails.push({
          id: product.id,
          name: product.name,
          brand: product.brand,
          category: cat,
          price: product.displayPrice || null,
          image: product.image
        });
      }
    }

    results[cat] = missing;
  }

  console.log("\n===== Missing Images Report =====");
  for (const [cat, count] of Object.entries(results)) {
    console.log(`${cat}: ${count} missing`);
  }
  console.log("=================================\n");

  console.log("\n===== Missing Image Details by Category =====");
  const grouped = {};
  missingDetails.forEach(item => {
    if (!grouped[item.category]) grouped[item.category] = [];
    grouped[item.category].push(item);
  });

  Object.keys(grouped).forEach(cat => {
    console.log(`\n--- ${cat.toUpperCase()} (${grouped[cat].length} missing) ---`);
    grouped[cat].forEach(item => {
      console.log(
        `${item.brand} | ${item.name} | ${item.id} | $${item.price} | ${item.image}`
      );
    });
  });

  console.log("\n=============================================\n");
}

// ========== MAIN SYNC ==========

async function syncAllProducts() {
  console.log("Starting Chattanooga API sync...\n");

  if (!API_SID || !API_TOKEN) {
    console.error("❌ Error: API_SID and API_TOKEN environment variables required");
    process.exit(1);
  }



  try {
    const activeProducts = loadActiveProducts();
    console.log(
      `📋 Active products configured: ${Object.keys(activeProducts).length}`
    );
    console.log("ℹ️  If empty, all products will be synced\n");

    const BATCH_SIZE = 2000;
    let page = 1;
    let hasMore = true;
    let totalFetched = 0;
    let batchNum = 1;
    // Prepare file streams for incremental writing
    const categoryFiles = {};
    const categoryFirstWrite = {};
    const categories = [
      "ammunition",
      "magazines",
      "reloading",
      "gun-parts",
      "optics",
      "gear",
      "outdoors",
      "brands",
      "sale",
      "firearms",
      "services"
    ];
    // Remove/replace old files before starting
    for (const cat of categories) {
      const filePath = path.join(__dirname, `../data/products/${cat}.json`);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      categoryFirstWrite[cat] = true;
    }

    while (hasMore) {
      const response = await fetchAllProducts(page);
      const items = response.items || [];
      if (items.length === 0) {
        hasMore = false;
        break;
      }
      totalFetched += items.length;
      console.log(`Processing batch ${batchNum}`);
      batchNum++;

      // Transform and resolve images in batch
      const transformationResults = await Promise.all(
        items.map(apiProduct => transformProduct(apiProduct))
      );
      const transformedProducts = transformationResults.filter(p => p !== null);

      // Apply brand & compliance filters
      const finalProducts = [];
      for (let i = 0; i < transformedProducts.length; i++) {
        const transformed = transformedProducts[i];
        const apiProduct = items[i];
        if (!shouldIncludeBrand(transformed)) continue;
        if (!shouldIncludeProduct(apiProduct)) continue;
        finalProducts.push(transformed);
      }

      // Write each product to its category file incrementally
      await writeCategoryFilesIncrementally(finalProducts, categoryFirstWrite);

      // Next batch
      page++;
      const pagination = response.pagination || {};
      hasMore = page <= (pagination.page_count || 0);
    }

    console.log(`\n✓ Fetched and processed ${totalFetched} products from API in batches\n`);
    console.log("\n════════════════════════════════════════");
    console.log("✓ SYNC COMPLETED SUCCESSFULLY");
    console.log("════════════════════════════════════════\n");

    await auditMissingImages();
  } catch (error) {
    console.error("❌ Sync failed:", error);
    process.exit(1);
  }
}

// Helper: Incrementally write products to category files in batches
async function writeCategoryFilesIncrementally(productsBatch, categoryFirstWrite) {
  const fs = require("fs");
  const path = require("path");
  const byCategory = {};
  for (const product of productsBatch) {
    const cat = product.category || "gear";
    if (!byCategory[cat]) byCategory[cat] = [];
    byCategory[cat].push(product);
  }
  for (const [cat, products] of Object.entries(byCategory)) {
    const filePath = path.join(__dirname, `../data/products/${cat}.json`);
    let fileExists = fs.existsSync(filePath);
    let data = { category: cat, lastUpdated: new Date().toISOString(), products: [] };
    if (fileExists && !categoryFirstWrite[cat]) {
      // Read existing products array only
      try {
        const raw = fs.readFileSync(filePath, "utf8");
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed.products)) data.products = parsed.products;
      } catch {}
    }
    data.products = data.products.concat(products);
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    categoryFirstWrite[cat] = false;
  }
}
  // ========== EXECUTE SYNC WHEN RUN DIRECTLY ==========
  if (require.main === module) {
    syncAllProducts();
  }
}

// ========== EXECUTE SYNC WHEN RUN DIRECTLY ==========
if (require.main === module) {
  syncAllProducts();
}
