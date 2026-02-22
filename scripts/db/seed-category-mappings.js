/**
 * Seed category_mappings from VENDOR_CAT_TO_SLUG for all vendors.
 * Run: node scripts/db/seed-category-mappings.js
 */
require('dotenv').config();
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const { Client } = require('pg');

const VENDOR_CAT_TO_SLUG = {
  ammunition: 'ammunition',
  magazines: 'magazines',
  firearms: 'guns',
  guns: 'guns',
  'gun parts': 'gun-parts',
  'chassis & stocks': 'gun-parts',
  'chassis and stocks': 'gun-parts',
  optics: 'optics',
  reloading: 'reloading',
  gear: 'gear',
  outdoors: 'outdoors',
  knives: 'outdoors',
  clothing: 'gear',
  footwear: 'gear',
  'clothing & footwear': 'gear',
};

async function run() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL?.includes('neon.tech') ? { rejectUnauthorized: true } : false,
  });
  await client.connect();
  const catRes = await client.query('SELECT id, slug FROM categories');
  const slugToId = {};
  catRes.rows.forEach((r) => { slugToId[r.slug] = r.id; });

  const vendors = await client.query('SELECT id FROM vendors');
  let inserted = 0;
  for (const v of vendors.rows) {
    for (const [theirValue, slug] of Object.entries(VENDOR_CAT_TO_SLUG)) {
      const ourId = slugToId[slug];
      if (!ourId) continue;
      await client.query(
        `INSERT INTO category_mappings (vendor_id, their_value, our_category_id) VALUES ($1, $2, $3) ON CONFLICT (vendor_id, their_value) DO NOTHING`,
        [v.id, theirValue, ourId]
      );
      inserted++;
    }
  }
  console.log('Seeded category_mappings for', vendors.rows.length, 'vendors');
  await client.end();
}
run().catch((e) => { console.error(e); process.exit(1); });
