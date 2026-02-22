#!/usr/bin/env node
/**
 * Promote vendor_product_raw → products + offers (curated layer).
 * Reads raw Chattanooga /items data, maps to products/offers so admin dashboard shows products.
 *
 * - display_price = retail_map_price ?? retail_price ?? map_price (never custom_price/dealer cost)
 * - Products without valid display_price get display_price=0 (admin must fix before storefront)
 * - Category: uses category_mappings when raw has Category; else defaults to "gear"
 * - /items API has no Category field; defaults to gear. Seed category_mappings for CSV imports later.
 *
 * Run: node scripts/db/promote-raw-to-curated.js
 */
require('dotenv').config();
const path = require('path');
const { Client } = require('pg');

require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const connectionString = process.env.DATABASE_URL || process.argv[2];

function toNum(v) {
  if (v === undefined || v === null || v === '') return null;
  const n = Number(String(v).trim());
  return Number.isFinite(n) ? n : null;
}

function priceOrNull(v) {
  if (v == null || v === '') return null;
  const s = String(v).trim().toLowerCase();
  if (s === 'custom' || s === 'call' || s === 'quote') return null;
  const n = toNum(v);
  return n != null && n > 0 ? n : null;
}

/** display_price: MSRP or MAP only. Never use dealer cost (custom_price, drop_ship_price). */
function getDisplayPrice(item) {
  const retailMap = priceOrNull(item.retail_map_price);
  const retail = priceOrNull(item.retail_price);
  const map = priceOrNull(item.map_price);
  return retailMap ?? retail ?? map ?? null;
}

/** Cost (dealer price) for margin calc. */
function getCost(item) {
  return toNum(item.custom_price) ?? toNum(item.drop_ship_price) ?? 0;
}

/** Image URL: use API-provided URL if present, else construct from Chattanooga CDN pattern. */
function getImageUrl(item, vendorSku) {
  const raw = (item.image || item.image_url || item['Image Location'] || item.image_location || '').toString().trim();
  if (raw && raw.startsWith('http')) {
    return raw.replace(/\?w=\d+&h=\d+/, '?w=500&h=500');
  }
  if (!vendorSku) return null;
  const sku = String(vendorSku).trim();
  return `https://media.chattanoogashooting.com/images/product/${sku}/${sku}-1.jpg?w=500&h=500&q=2`;
}

/**
 * Infer category from product name when raw data has no Category field.
 * /items API does not include Category; this reduces "everything in gear" problem.
 * Returns slug or null (caller uses defaultCategoryId when null).
 */
const CATEGORY_KEYWORDS = {
  ammunition: [
    /\bammo\b/i, /\bammunition\b/i, /\brounds?\b(?!\s*\/)/i, /\bcartridges?\b/i,
    /\b(\d+)\s*(?:rd|rds|round)\s*(?:box|ammo)/i, /\bloaded\s+ammunition/i,
    /\b\.\d{2,3}\s*(?:acp|luger|rem|win|mag|spc|nato|wsm|wssm)?\s*(?:\d+\s*(?:gr|grain|gn))?/i,
    /\b(?:fmj|jhp|sp|hp|bt|vmax|eld|tmj)\s+(?:\d+\s*(?:gr|grain))?/i,
    /\bcci\b/i, /\bremington\s+umc\b/i, /\bwinchester\s+(?:white\s+box|usa)\b/i,
  ],
  magazines: [
    /\bmag(?:azine)?\b/i, /\b(?:ar|ak|glock|sig|m&p|beretta)\s*(?:\d+\s*)?round/i,
    /\bcapacity\s*(?:\d+)/i, /\b(\d+)\s*(?:rd|rds?|round)\s*(?:mag|capacity)/i,
  ],
  reloading: [
    /\breload/i, /\bbrass\b/i, /\bprimers?\b/i, /\bpowder\b/i, /\bbullets?\s+(?:box|pk)/i,
    /\b(?:case|die)\s+(?:trim|gauge|lube)/i, /\bpress\b/i, /\bscale\b/i,
  ],
  optics: [
    /\bscope\b/i, /\breticle\b/i, /\bred\s*dot\b/i, /\bholo\b/i, /\bsight\b/i,
    /\bmount\s*(?:ring|base|rail)/i, /\boptic\b/i, /\bprism\b/i, /\bmonocular\b/i,
    /\b(?:rifle|magnifier)\s*scope/i,
  ],
  'gun-parts': [
    /\bbarrel\b/i, /\bupper\b/i, /\blower\b/i, /\btrigger\b/i, /\bbcg\b/i,
    /\bbolt\b/i, /\bchassis\b/i, /\bstock\b/i, /\bgrip\b/i, /\bhandguard\b/i,
    /\bmuzzle\b/i, /\bflash\s*hider\b/i, /\bbrake\b/i, /\bbuffer\b/i,
    /\b(?:ar|ak)\s*(?:15|10|47)\s*(?:upper|lower|parts?)/i,
  ],
  outdoors: [
    /\bknife\b/i, /\bbinocular/i, /\bcompass\b/i, /\bsurvival\b/i,
    /\b(folding|camping|hunting)\s*(?:knife|gear)/i, /\boutdoor\b/i,
  ],
};

function inferCategoryFromName(name) {
  if (!name || typeof name !== 'string') return null;
  const n = name.trim();
  if (!n) return null;

  // Order matters: check more specific categories first
  const order = ['ammunition', 'magazines', 'reloading', 'optics', 'gun-parts', 'outdoors'];
  for (const slug of order) {
    for (const re of CATEGORY_KEYWORDS[slug]) {
      if (re.test(n)) return slug;
    }
  }
  return null;
}

/** Extract caliber from product name for filter support. Returns first match or null. */
function extractCaliberFromName(name) {
  if (!name || typeof name !== 'string') return null;
  const m = name.match(/\b(\d{2,3}(?:\s*\/\s*\d{2,3})?|\d{1,2}\.?\d*\s*(?:mm|ga(?:uge)?)|\d+\.?\d*\s*(?:rem|win|mag|spc|acp|luger|creedmoor|nato|parabellum))\b/i);
  return m ? m[1].trim() : null;
}

/** Extract magazine capacity from product name (e.g. "30 rd", "17+1"). */
function extractCapacityFromName(name) {
  if (!name || typeof name !== 'string') return null;
  const m = name.match(/\b(\d{1,3})\s*(?:\+\d+)?\s*(?:rd|rds?|round|capacity)/i) ||
    name.match(/(\d{1,3})\s*round/i);
  return m ? m[1] : null;
}

async function run() {
  if (!connectionString) {
    console.error('Set DATABASE_URL in .env or pass as first argument.');
    process.exit(1);
  }

  const client = new Client({
    connectionString,
    ssl: connectionString.includes('neon.tech') ? { rejectUnauthorized: true } : false,
  });
  await client.connect();

  try {
    const vendorRes = await client.query(`SELECT id FROM vendors WHERE name = 'Chattanooga'`);
    if (vendorRes.rows.length === 0) {
      console.error('Chattanooga vendor not found. Run sync:neon first.');
      process.exit(1);
    }
    const vendorId = vendorRes.rows[0].id;

    const catRes = await client.query('SELECT id, slug FROM categories');
    const slugToId = {};
    let defaultCategoryId = null;
    for (const r of catRes.rows) {
      slugToId[r.slug] = r.id;
      if (r.slug === 'gear') defaultCategoryId = r.id;
    }
    if (!defaultCategoryId) defaultCategoryId = catRes.rows[0]?.id;
    if (!defaultCategoryId) {
      console.error('No categories found. Run npm run db:seed first.');
      process.exit(1);
    }

    const mappingRes = await client.query(
      'SELECT their_value, our_category_id FROM category_mappings WHERE vendor_id = $1',
      [vendorId]
    );
    const categoryMap = {};
    mappingRes.rows.forEach((r) => {
      categoryMap[String(r.their_value).trim().toLowerCase()] = r.our_category_id;
    });

    const rawRes = await client.query(
      'SELECT id, vendor_sku, raw_data FROM vendor_product_raw WHERE vendor_id = $1',
      [vendorId]
    );

    console.log('[promote-raw] Processing', rawRes.rows.length, 'raw items…');

    const existingOffers = await client.query(
      'SELECT vendor_sku, id, product_id FROM offers WHERE vendor_id = $1',
      [vendorId]
    );
    const offerBySku = new Map();
    existingOffers.rows.forEach((r) => offerBySku.set(r.vendor_sku, { id: r.id, product_id: r.product_id }));

    const toInsert = [];
    const toUpdate = [];

    for (const row of rawRes.rows) {
      const item = row.raw_data;
      if (!item || typeof item !== 'object') continue;

      const vendorSku = (item.cssi_id || item.item_number || row.vendor_sku || '').toString().trim();
      if (!vendorSku) continue;

      const name = (item.name || '').toString().trim();
      if (!name) continue;

      const displayPrice = getDisplayPrice(item);
      const cost = getCost(item);
      const qty = toNum(item.inventory) ?? 0;
      const dropShip = item.drop_ship_flag === 1 || String(item.drop_ship_flag).toLowerCase() === 'true';
      const fulfillmentType = dropShip ? 'drop_ship' : 'order_then_ship';

      const msrp = priceOrNull(item.retail_price);
      const mapPrice = priceOrNull(item.map_price) ?? priceOrNull(item.retail_map_price);

      let categoryId = defaultCategoryId;
      const theirCategory = (item.Category || item.category || '').toString().trim();
      if (theirCategory && categoryMap[theirCategory.toLowerCase()]) {
        categoryId = categoryMap[theirCategory.toLowerCase()];
      } else {
        const inferredSlug = inferCategoryFromName(name);
        if (inferredSlug && slugToId[inferredSlug]) {
          categoryId = slugToId[inferredSlug];
        }
      }

      const imageUrl = getImageUrl(item, vendorSku);
      const upc = (item.upc || item.UPC || '').toString().trim() || null;
      const mpn = (item.manufacturer_part_number || item['Manufacturer Item Number'] || '').toString().trim() || null;
      const brand = (item.Manufacturer || item.manufacturer || item.Brand || item.brand || '').toString().trim() || null;
      const caliber = (item.caliber || item.Caliber || '').toString().trim() || extractCaliberFromName(name) || null;
      const capacity = (item.capacity || item.Capacity || '').toString().trim() || extractCapacityFromName(name) || null;

      const dpForDb = displayPrice != null && displayPrice > 0 ? displayPrice : 0;

      const existing = offerBySku.get(vendorSku);
      if (existing) {
        toUpdate.push({
          offerId: existing.id,
          productId: existing.product_id,
          name,
          categoryId,
          brand,
          imageUrl,
          upc,
          mpn,
          caliber,
          capacity,
          cost,
          msrp,
          mapPrice,
          dpForDb,
          qty,
          fulfillmentType,
        });
      } else {
        toInsert.push({
          vendorSku,
          name,
          categoryId,
          brand,
          imageUrl,
          upc,
          mpn,
          caliber,
          capacity,
          cost,
          msrp,
          mapPrice,
          dpForDb,
          qty,
          fulfillmentType,
        });
      }
    }

    const BATCH = 500;

    for (let i = 0; i < toUpdate.length; i += BATCH) {
      const batch = toUpdate.slice(i, i + BATCH);
      const pPlaces = [];
      const pVals = [];
      let pN = 1;
      for (const u of batch) {
        pPlaces.push(`($${pN}::int, $${pN + 1}::text, $${pN + 2}::int, $${pN + 3}::text, $${pN + 4}::text, $${pN + 5}::text, $${pN + 6}::text, $${pN + 7}::text, $${pN + 8}::text)`);
        pVals.push(u.productId, u.name, u.categoryId, u.brand || null, u.imageUrl || null, u.upc || null, u.mpn || null, u.caliber || null, u.capacity || null);
        pN += 9;
      }
      await client.query(
        `UPDATE products p SET name = v.name, category_id = v.category_id, brand = v.brand, image_url = v.image_url, upc = v.upc, manufacturer_part_number = v.mpn, caliber = v.caliber, capacity = v.capacity, updated_at = NOW()
         FROM (VALUES ${pPlaces.join(', ')}) AS v(id, name, category_id, brand, image_url, upc, mpn, caliber, capacity) WHERE p.id = v.id`,
        pVals.flat()
      );

      const oPlaces = [];
      const oVals = [];
      let oN = 1;
      for (const u of batch) {
        oPlaces.push(`($${oN}::int, $${oN + 1}::numeric, $${oN + 2}::numeric, $${oN + 3}::numeric, $${oN + 4}::numeric, $${oN + 5}::int, $${oN + 6}::text)`);
        oVals.push(u.offerId, u.cost, u.msrp || null, u.mapPrice || null, u.dpForDb, u.qty, u.fulfillmentType);
        oN += 7;
      }
      await client.query(
        `UPDATE offers o SET cost = v.cost, msrp = v.msrp, map_price = v.map_price, display_price = v.display_price, quantity_in_stock = v.qty, fulfillment_type = v.fulfillment_type, updated_at = NOW()
         FROM (VALUES ${oPlaces.join(', ')}) AS v(id, cost, msrp, map_price, display_price, qty, fulfillment_type) WHERE o.id = v.id`,
        oVals.flat()
      );

      if ((i + BATCH) % 5000 === 0 || i + BATCH >= toUpdate.length) {
        console.log('[promote-raw] Updated', Math.min(i + BATCH, toUpdate.length), '/', toUpdate.length);
      }
    }

    for (let i = 0; i < toInsert.length; i += BATCH) {
      const batch = toInsert.slice(i, i + BATCH);
      const pVals = [];
      const pPlace = [];
      let pi = 1;
      for (const ins of batch) {
        pPlace.push(`($${pi}, $${pi + 1}, $${pi + 2}, $${pi + 3}, $${pi + 4}, $${pi + 5}, $${pi + 6}, $${pi + 7}, $${pi + 8}, $${pi + 9})`);
        pVals.push(ins.name, null, ins.categoryId, ins.brand || null, ins.imageUrl || null, null, ins.upc || null, ins.mpn || null, ins.caliber || null, ins.capacity || null);
        pi += 10;
      }
      const productRes = await client.query(
        `INSERT INTO products (name, description, category_id, brand, image_url, type, upc, manufacturer_part_number, caliber, capacity)
         VALUES ${pPlace.join(', ')} RETURNING id`,
        pVals.flat()
      );
      const productIds = productRes.rows.map((r) => r.id);

      const oPlace = [];
      const oVals = [];
      let oi = 1;
      for (let j = 0; j < batch.length; j++) {
        const ins = batch[j];
        oPlace.push(`($${oi}, $${oi + 1}, $${oi + 2}, $${oi + 3}, $${oi + 4}, $${oi + 5}, $${oi + 6}, $${oi + 7}, $${oi + 8}, $${oi + 9}, TRUE, TRUE)`);
        oVals.push(productIds[j], vendorId, ins.vendorSku, ins.cost, ins.msrp || null, ins.mapPrice || null, ins.dpForDb, ins.qty, ins.fulfillmentType);
        oi += 10;
      }
      await client.query(
        `INSERT INTO offers (product_id, vendor_id, vendor_sku, cost, msrp, map_price, display_price, quantity_in_stock, fulfillment_type, is_primary, is_live)
         VALUES ${oPlace.join(', ')}`,
        oVals.flat()
      );
      if ((i + BATCH) % 5000 === 0 || i + BATCH >= toInsert.length) {
        console.log('[promote-raw] Inserted', Math.min(i + BATCH, toInsert.length), '/', toInsert.length);
      }
    }

    console.log('[promote-raw] Done. Products+offers created:', toInsert.length, '| Offers updated:', toUpdate.length);
  } finally {
    await client.end();
  }
}

run().catch((err) => {
  console.error('[promote-raw] Error:', err.message);
  process.exit(1);
});
