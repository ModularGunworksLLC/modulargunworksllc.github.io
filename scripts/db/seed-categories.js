/**
 * Seed the 8 site categories into Neon.
 * Run after schema: node scripts/db/seed-categories.js
 */
require('dotenv').config();
const path = require('path');
const { Client } = require('pg');

require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const connectionString = process.env.DATABASE_URL || process.argv[2];

const CATEGORIES = [
  { slug: 'ammunition', name: 'Ammunition', sort_order: 1 },
  { slug: 'magazines', name: 'Magazines', sort_order: 2 },
  { slug: 'guns', name: 'Firearms', sort_order: 3 },
  { slug: 'gun-parts', name: 'Gun Parts', sort_order: 4 },
  { slug: 'gear', name: 'Gear', sort_order: 5 },
  { slug: 'optics', name: 'Optics', sort_order: 6 },
  { slug: 'reloading', name: 'Reloading', sort_order: 7 },
  { slug: 'outdoors', name: 'Outdoors', sort_order: 8 },
];

async function run() {
  if (!connectionString) {
    console.error('Set DATABASE_URL in .env or pass as first argument.');
    process.exit(1);
  }
  const client = new Client({ connectionString });
  try {
    await client.connect();
    for (const c of CATEGORIES) {
      await client.query(
        `INSERT INTO categories (slug, name, sort_order)
         VALUES ($1, $2, $3)
         ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, sort_order = EXCLUDED.sort_order`,
        [c.slug, c.name, c.sort_order]
      );
    }
    console.log('Seeded', CATEGORIES.length, 'categories.');
  } catch (err) {
    console.error('Seed error:', err.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

run();
