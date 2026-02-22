/**
 * Neon schema: categories, vendors, products, offers, mappings, orders.
 * Run: node scripts/db/schema.js
 */
require('dotenv').config();
const { Client } = require('pg');
const path = require('path');

// Load .env from project root
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const connectionString = process.env.DATABASE_URL || process.argv[2];

const SQL = `
-- Categories (your 8 site categories)
CREATE TABLE IF NOT EXISTS categories (
  id SERIAL PRIMARY KEY,
  slug VARCHAR(64) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  sort_order INT NOT NULL DEFAULT 0
);

-- Vendors (sources: API, CSV, etc.)
CREATE TABLE IF NOT EXISTS vendors (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(32) NOT NULL DEFAULT 'csv',
  config JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Canonical products (one per sellable item; identity by UPC or MPN)
CREATE TABLE IF NOT EXISTS products (
  id SERIAL PRIMARY KEY,
  upc VARCHAR(64),
  manufacturer_part_number VARCHAR(128),
  name VARCHAR(512) NOT NULL,
  description TEXT,
  category_id INT NOT NULL REFERENCES categories(id),
  brand VARCHAR(255),
  image_url TEXT,
  type VARCHAR(128),
  caliber VARCHAR(64),
  bullet_type VARCHAR(64),
  grain_weight VARCHAR(32),
  capacity VARCHAR(32),
  ammo_type VARCHAR(64),
  is_firearm BOOLEAN DEFAULT FALSE,
  requires_ffl BOOLEAN DEFAULT FALSE,
  min_age INT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_upc ON products(upc);
CREATE INDEX IF NOT EXISTS idx_products_mpn ON products(manufacturer_part_number);
CREATE INDEX IF NOT EXISTS idx_products_name_gin ON products USING gin(to_tsvector('english', name));

-- Offers (one per vendor+product: cost, price, stock, fulfillment)
CREATE TABLE IF NOT EXISTS offers (
  id SERIAL PRIMARY KEY,
  product_id INT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  vendor_id INT NOT NULL REFERENCES vendors(id),
  vendor_sku VARCHAR(128) NOT NULL,
  cost NUMERIC(12,2) NOT NULL DEFAULT 0,
  msrp NUMERIC(12,2),
  map_price NUMERIC(12,2),
  display_price NUMERIC(12,2) NOT NULL,
  quantity_in_stock INT NOT NULL DEFAULT 0,
  fulfillment_type VARCHAR(32) NOT NULL DEFAULT 'order_then_ship',
  is_primary BOOLEAN DEFAULT TRUE,
  is_live BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(vendor_id, vendor_sku)
);

CREATE INDEX IF NOT EXISTS idx_offers_product ON offers(product_id);
CREATE INDEX IF NOT EXISTS idx_offers_vendor ON offers(vendor_id);
CREATE INDEX IF NOT EXISTS idx_offers_live ON offers(is_live) WHERE is_live = TRUE;

-- Sale/featured: which offers are on sale (replaces active.json)
CREATE TABLE IF NOT EXISTS sale_offers (
  offer_id INT PRIMARY KEY REFERENCES offers(id) ON DELETE CASCADE,
  discount_pct INT DEFAULT 0,
  sale_price NUMERIC(12,2),
  added_at TIMESTAMPTZ DEFAULT NOW()
);

-- Category mapping: vendor category string -> our category_id
CREATE TABLE IF NOT EXISTS category_mappings (
  id SERIAL PRIMARY KEY,
  vendor_id INT NOT NULL REFERENCES vendors(id),
  their_value VARCHAR(512) NOT NULL,
  our_category_id INT NOT NULL REFERENCES categories(id),
  UNIQUE(vendor_id, their_value)
);

CREATE INDEX IF NOT EXISTS idx_cat_map_vendor ON category_mappings(vendor_id);

-- Field mapping: vendor column name -> our field (for CSV/API)
CREATE TABLE IF NOT EXISTS field_mappings (
  id SERIAL PRIMARY KEY,
  vendor_id INT NOT NULL REFERENCES vendors(id),
  their_column VARCHAR(128) NOT NULL,
  our_field VARCHAR(64) NOT NULL,
  UNIQUE(vendor_id, their_column)
);

-- Orders (for Phase 4; used by existing order flow later)
CREATE TABLE IF NOT EXISTS orders (
  id SERIAL PRIMARY KEY,
  order_id VARCHAR(128) UNIQUE NOT NULL,
  buyer_email VARCHAR(255),
  status VARCHAR(64) DEFAULT 'Received',
  tracking_number VARCHAR(255),
  shipped_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS order_lines (
  id SERIAL PRIMARY KEY,
  order_id INT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  offer_id INT REFERENCES offers(id),
  product_name VARCHAR(512),
  quantity INT NOT NULL DEFAULT 1,
  unit_price NUMERIC(12,2) NOT NULL,
  total NUMERIC(12,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Admin auth (simple password hash for single admin)
CREATE TABLE IF NOT EXISTS admin_users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(64) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Raw vendor product data: each vendor's native columns stored as-is (no mapping, no filtering).
-- One row per vendor+SKU. raw_data JSONB holds the full API/CSV row.
CREATE TABLE IF NOT EXISTS vendor_product_raw (
  id SERIAL PRIMARY KEY,
  vendor_id INT NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  vendor_sku VARCHAR(128) NOT NULL,
  raw_data JSONB NOT NULL DEFAULT '{}',
  synced_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(vendor_id, vendor_sku)
);

CREATE INDEX IF NOT EXISTS idx_vendor_product_raw_vendor ON vendor_product_raw(vendor_id);
CREATE INDEX IF NOT EXISTS idx_vendor_product_raw_synced ON vendor_product_raw(synced_at);
`;

async function run() {
  if (!connectionString) {
    console.error('Set DATABASE_URL in .env or pass as first argument.');
    process.exit(1);
  }
  const client = new Client({ connectionString });
  try {
    await client.connect();
    console.log('Applying schema...');
    await client.query(SQL);
    // Migration: add sale_price to sale_offers (idempotent)
    await client.query(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='sale_offers' AND column_name='sale_price') THEN
          ALTER TABLE sale_offers ADD COLUMN sale_price NUMERIC(12,2);
        END IF;
      END $$;
    `);
    console.log('Schema applied.');
  } catch (err) {
    console.error('Schema error:', err.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

run();
