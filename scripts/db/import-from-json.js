/**
 * Import existing mapped-products JSON files into Neon (products + offers).
 * Creates one vendor "Chattanooga", then for each file: insert/update products and offers.
 * Run: node scripts/db/import-from-json.js
 */
require('dotenv').config();
const path = require('path');
const fs = require('fs');
const { Client } = require('pg');

require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const connectionString = process.env.DATABASE_URL || process.argv[2];
const MAPPED_DIR = path.join(__dirname, '../../data/products/mapped-products');

// File name (no .json) -> category slug in DB
const FILE_TO_SLUG = {
  'Ammunition': 'ammunition',
  'Magazines': 'magazines',
  'Firearms': 'guns',
  'Gun_Parts': 'gun-parts',
  'Gear': 'gear',
  'Optics': 'optics',
  'Reloading': 'reloading',
  'Outdoors': 'outdoors',
  'Knives': 'outdoors',
  'Clothing___Footwear': 'gear',
};

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

function displayPrice(row) {
  const msrp = priceOrNull(row.MSRP);
  const map = priceOrNull(row.MAP);
  return msrp ?? map ?? null;
}

async function run() {
  if (!connectionString) {
    console.error('Set DATABASE_URL in .env or pass as first argument.');
    process.exit(1);
  }

  const client = new Client({ connectionString });
  await client.connect();

  try {
    // Ensure vendor exists
    let vendorId;
    const v = await client.query(
      `SELECT id FROM vendors WHERE name = $1`,
      ['Chattanooga']
    );
    if (v.rows.length) {
      vendorId = v.rows[0].id;
      console.log('Using vendor Chattanooga id', vendorId);
    } else {
      const ins = await client.query(
        `INSERT INTO vendors (name, type) VALUES ($1, $2) RETURNING id`,
        ['Chattanooga', 'api']
      );
      vendorId = ins.rows[0].id;
      console.log('Created vendor Chattanooga id', vendorId);
    }

    const categoryRows = await client.query('SELECT id, slug FROM categories');
    const slugToCategoryId = {};
    categoryRows.rows.forEach((r) => { slugToCategoryId[r.slug] = r.id; });

    const files = fs.readdirSync(MAPPED_DIR).filter((f) => f.endsWith('.json'));
    let productsCreated = 0;
    let offersUpserted = 0;

    for (const file of files) {
      const baseName = path.basename(file, '.json');
      const slug = FILE_TO_SLUG[baseName];
      if (!slug || !slugToCategoryId[slug]) {
        console.log('Skip (no slug mapping):', file);
        continue;
      }
      const categoryId = slugToCategoryId[slug];
      const filePath = path.join(MAPPED_DIR, file);
      const raw = fs.readFileSync(filePath, 'utf8');
      let items;
      try {
        items = JSON.parse(raw);
      } catch (e) {
        console.error('Invalid JSON:', file, e.message);
        continue;
      }
      const list = Array.isArray(items) ? items : (items.products || items.items || []);
      console.log(file, ':', list.length, 'rows');

      for (const row of list) {
        const sku = (row.SKU || row.sku || '').toString().trim();
        if (!sku) continue;

        const dp = displayPrice(row);
        if (dp == null || dp <= 0) continue;

        const top = row.mappedCategory?.top || baseName.replace(/_/g, ' ');
        const sub = (row.mappedCategory?.sub || '').toString().trim();
        const name = (row['Item Name'] || row.name || '').toString().trim();
        const description = (row['Web Item Description'] || row.description || '').toString().trim();
        const brand = (row.Manufacturer || row.manufacturer || '').toString().trim();
        const imageUrl = (row.image || row['Image Location'] || '').toString().trim();
        const upc = (row.UPC || row.upc || '').toString().trim() || null;
        const mpn = (row['Manufacturer Item Number'] || '').toString().trim() || null;
        const cost = toNum(row.Price) ?? 0;
        const msrp = priceOrNull(row.MSRP);
        const mapPrice = priceOrNull(row.MAP);
        const qty = toNum(row['Quantity In Stock']) ?? 0;
        const dropShip = String(row['Drop Ship Flag'] || '').trim().toLowerCase() === '1' || String(row['Drop Ship Flag']).toLowerCase() === 'true';
        const fulfillmentType = dropShip ? 'drop_ship' : 'order_then_ship';

        const isFirearm = (top || '').toLowerCase() === 'firearms';
        const minAge = isFirearm ? 21 : null;

        const existingOffer = await client.query(
          `SELECT id, product_id FROM offers WHERE vendor_id = $1 AND vendor_sku = $2`,
          [vendorId, sku]
        );

        if (existingOffer.rows.length) {
          const offerId = existingOffer.rows[0].id;
          const productId = existingOffer.rows[0].product_id;
          await client.query(
            `UPDATE products SET name = $1, description = $2, category_id = $3, brand = $4, image_url = $5, type = $6, upc = $7, manufacturer_part_number = $8, is_firearm = $9, min_age = $10, updated_at = NOW() WHERE id = $11`,
            [name, description || null, categoryId, brand || null, imageUrl || null, sub || null, upc, mpn, isFirearm, minAge, productId]
          );
          await client.query(
            `UPDATE offers SET cost = $1, msrp = $2, map_price = $3, display_price = $4, quantity_in_stock = $5, fulfillment_type = $6, updated_at = NOW() WHERE id = $7`,
            [cost, msrp, mapPrice, dp, qty, fulfillmentType, offerId]
          );
          offersUpserted++;
        } else {
          const productIns = await client.query(
            `INSERT INTO products (name, description, category_id, brand, image_url, type, upc, manufacturer_part_number, is_firearm, min_age)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING id`,
            [name, description || null, categoryId, brand || null, imageUrl || null, sub || null, upc, mpn, isFirearm, minAge]
          );
          const productId = productIns.rows[0].id;
          productsCreated++;
          await client.query(
            `INSERT INTO offers (product_id, vendor_id, vendor_sku, cost, msrp, map_price, display_price, quantity_in_stock, fulfillment_type, is_primary, is_live)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, TRUE, TRUE)`,
            [productId, vendorId, sku, cost, msrp, mapPrice, dp, qty, fulfillmentType]
          );
          offersUpserted++;
        }
      }
    }

    console.log('Done. Products created:', productsCreated, 'Offers upserted:', offersUpserted);
  } finally {
    await client.end();
  }
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
