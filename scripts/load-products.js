// scripts/load-products.js
// Dynamic loader for normalized UI-ready product JSON files

// --- Normalization helpers ---

function toNumber(value) {
  if (value === undefined || value === null) return null;
  const n = Number(String(value).trim());
  return Number.isFinite(n) ? n : null;
}

function toBooleanFromFlag(value) {
  const v = String(value).trim().toLowerCase();
  return v === "1" || v === "yes" || v === "true";
}

function normalizeCategoryValue(value) {
  if (!value) return "";
  return String(value).split("|").filter(Boolean)[0] || "";
}

/** Request larger image size so images stay crisp (CDN often gives ?w=110&h=110). */
function toHighResImageUrl(url, size) {
  if (!url || typeof url !== "string") return url;
  size = size || 500;
  return url.replace(/\?w=\d+&h=\d+/, "?w=" + size + "&h=" + size);
}

/** Return numeric price or null if missing/empty/zero (so we can fall back to next tier). */
function priceOrNull(value) {
  if (value == null || value === '') return null;
  const s = String(value).trim().toLowerCase();
  if (s === 'custom' || s === 'call' || s === 'quote') return null;
  const n = toNumber(value);
  return n != null && n > 0 ? n : null;
}

// --- Core normalizer: vendor → UI product ---
// Display price: MSRP ?? MAP ?? Price (prefer MSRP/MAP; use Price when vendor doesn't provide them). Never use custom/call/quote.

function normalizeVendorProduct(vendor) {
  const msrp = priceOrNull(vendor["MSRP"]);
  const map = priceOrNull(vendor["MAP"]);
  const price = priceOrNull(vendor["Price"]);
  const displayPrice = msrp ?? map ?? price ?? null;
  const category = normalizeCategoryValue(vendor.mappedCategory?.top);
  const isFirearmCategory = (category || "").toLowerCase() === "firearms";
  return {
    sku: vendor["SKU"] ?? "",
    name: vendor["Item Name"] ?? "",
    webName: vendor["Web Item Name"] ?? "",
    description: vendor["Web Item Description"] ?? "",
    price: toNumber(vendor["Price"]) ?? 0,
    msrp: toNumber(vendor["MSRP"]),
    map: toNumber(vendor["MAP"]),
    displayPrice: displayPrice ?? 0,
    upc: vendor["UPC"] ?? "",
    inventory: toNumber(vendor["Quantity In Stock"]) ?? 0,
    dropShip: toBooleanFromFlag(vendor["Drop Ship Flag"]),
    dropShipPrice: toNumber(vendor["Drop Ship Price"]),
    category: category,
    subcategory: normalizeCategoryValue(vendor.mappedCategory?.sub),
    rawCategory: vendor["Category"] ?? "",
    isFirearm: isFirearmCategory,
    minFirearmAge: isFirearmCategory ? 21 : undefined,
    shipWeight: toNumber(vendor["Ship Weight"]),
    image: toHighResImageUrl(vendor["Image Location"] ?? vendor["image"] ?? "", 500),
    imageLocation: vendor["Image Location"] ?? "",
    manufacturer: vendor["Manufacturer"] ?? "",
    manufacturerItemNumber: vendor["Manufacturer Item Number"] ?? "",
    length: toNumber(vendor["Length"]),
    width: toNumber(vendor["Width"]),
    height: toNumber(vendor["Height"]),
    availableDropShipOptions: vendor["Available Drop Ship Delivery Options"] ?? "",
    allocated: toBooleanFromFlag(vendor["Allocated Item?"])
  };
}

// --- Brand order: top brands first when page loads (lower rank = higher on page) ---
// Order is dictated by this list; brands not listed sort to the end.
var BRAND_PRIORITY = [
  'Hornady', 'Federal', 'Sig Sauer', 'Glock', 'Smith & Wesson', 'Ruger', 'Springfield Armory',
  'Leupold', 'Vortex', 'Trijicon', 'Magpul', 'RCBS', 'Lee Precision', 'Redding', 'Lyman', 'Forster',
  'Remington', 'Winchester', 'Browning', 'Savage', 'Mossberg', 'FN America', 'Heckler & Koch',
  'Daniel Defense', 'Wilson Combat', 'Aero Precision', 'Holosun', 'Primary Arms', 'EOTech', 'Aimpoint',
  'Streamlight', 'SureFire', 'Burris', 'Bushnell', 'Athlon', 'Nosler', 'Barnes', 'Sierra', 'Berger',
  'Hodgdon', 'Alliant Powder', 'Fiocchi', 'Blackhawk', 'DeSantis', 'Safariland', 'ProMag', 'Mec-Gar',
  'Kimber', 'Walther', 'Beretta', 'Henry', 'Kel-Tec', 'Umarex', 'Sellmark', 'Hogue', 'Meprolight'
];

// Map raw manufacturer string (lowercase) to display name for brand rank lookup.
function getManufacturerDisplayName(raw) {
  if (!raw || !String(raw).trim()) return '';
  var key = String(raw).trim().toLowerCase().replace(/\.$/, '');
  var map = {
    'hornady mfg': 'Hornady', 'hornady manufacturing': 'Hornady', 'hornady': 'Hornady',
    'federal cartridge co': 'Federal', 'federal cartridge': 'Federal', 'federal premium': 'Federal', 'federal': 'Federal',
    'sig sauer': 'Sig Sauer', 'sig': 'Sig Sauer',
    'glock inc': 'Glock', 'glock': 'Glock',
    'smith & wesson inc': 'Smith & Wesson', 'smith & wesson': 'Smith & Wesson', 'smith and wesson': 'Smith & Wesson',
    'sturm ruger & co': 'Ruger', 'ruger': 'Ruger',
    'springfield armory': 'Springfield Armory', 'springfield': 'Springfield Armory',
    'leupold & stevens inc': 'Leupold', 'leupold': 'Leupold',
    'vortex optics': 'Vortex', 'vortex': 'Vortex',
    'trijicon': 'Trijicon',
    'magpul': 'Magpul', 'magpul industries': 'Magpul',
    'rcbs': 'RCBS',
    'lee precision': 'Lee Precision', 'lee': 'Lee Precision',
    'redding': 'Redding',
    'lyman': 'Lyman',
    'forster products': 'Forster', 'forster': 'Forster',
    'remington': 'Remington', 'remington arms co. inc': 'Remington',
    'winchester': 'Winchester', 'winchester ammunition': 'Winchester',
    'browning': 'Browning', 'browning firearms': 'Browning',
    'savage arms': 'Savage', 'savage': 'Savage',
    'mossberg': 'Mossberg', 'mossberg & sons inc': 'Mossberg',
    'fn america': 'FN America', 'fn usa': 'FN America',
    'heckler & koch': 'Heckler & Koch', 'hk': 'Heckler & Koch',
    'daniel defense': 'Daniel Defense',
    'wilson combat': 'Wilson Combat',
    'aero precision': 'Aero Precision',
    'holosun': 'Holosun',
    'primary arms': 'Primary Arms',
    'eotech': 'EOTech',
    'aimpoint': 'Aimpoint',
    'streamlight': 'Streamlight',
    'surefire': 'SureFire', 'surefire llc': 'SureFire',
    'burris': 'Burris',
    'bushnell': 'Bushnell',
    'athlon': 'Athlon', 'athlon optics': 'Athlon',
    'nosler': 'Nosler',
    'barnes': 'Barnes',
    'sierra': 'Sierra',
    'berger': 'Berger',
    'hodgdon': 'Hodgdon',
    'alliant powder': 'Alliant Powder',
    'fiocchi': 'Fiocchi',
    'blackhawk': 'Blackhawk',
    'desantis': 'DeSantis',
    'safariland': 'Safariland',
    'promag': 'ProMag',
    'mec-gar': 'Mec-Gar',
    'kimber': 'Kimber',
    'walther': 'Walther',
    'beretta': 'Beretta',
    'henry': 'Henry',
    'kel-tec': 'Kel-Tec',
    'umarex': 'Umarex',
    'sellmark': 'Sellmark',
    'hogue': 'Hogue',
    'meprolight': 'Meprolight'
  };
  return map[key] || '';
}

function getBrandRank(manufacturer) {
  var name = getManufacturerDisplayName(manufacturer);
  if (!name) return 9999;
  var i = BRAND_PRIORITY.indexOf(name);
  return i >= 0 ? i : 9999;
}

// --- Existing logic: determine which file to load ---

function getCategoryFileName() {
  const page = window.location.pathname.split('/').pop().replace('.html', '');
  // Match repo filenames: e.g. gun-parts -> Gun_Parts.json, ammunition -> Ammunition.json
  const parts = page.replace(/[- ]/g, '_').split('_').filter(Boolean);
  const fileName = parts.map(function (p) {
    return p.charAt(0).toUpperCase() + p.slice(1).toLowerCase();
  }).join('_') + '.json';
  return fileName;
}

// --- Main loader with normalization ---

async function loadProducts() {
  const fileName = getCategoryFileName();
  const url = `../data/products/mapped-products/${fileName}`;

  try {
    const res = await fetch(url);
    if (!res.ok) {
      // 404 or other error: show empty list (e.g. Magazines.json not created yet)
      window.allProducts = [];
      if (typeof onProductsLoaded === 'function') onProductsLoaded([]);
      return;
    }

    const vendorProducts = await res.json();
    const list = Array.isArray(vendorProducts) ? vendorProducts : (vendorProducts.products || vendorProducts.items || []);
    const normalized = list.map(normalizeVendorProduct);
    // List products that have any valid price (MSRP, MAP, or Price). Excludes custom/call/quote.
    let products = normalized.filter(p => p.displayPrice != null && p.displayPrice > 0);
    // Sort by brand priority so top-name brands appear first when the page loads.
    products = products.slice().sort((a, b) => {
      const rankA = getBrandRank(a.manufacturer);
      const rankB = getBrandRank(b.manufacturer);
      if (rankA !== rankB) return rankA - rankB;
      return (a.name || '').localeCompare(b.name || '');
    });

    window.allProducts = products;

    if (typeof onProductsLoaded === 'function') {
      onProductsLoaded(products);
    }

  } catch (e) {
    window.allProducts = [];
    if (typeof onProductsLoaded === 'function') onProductsLoaded([]);
    console.error('Failed to load products:', e);
  }
}

document.addEventListener('DOMContentLoaded', loadProducts);
