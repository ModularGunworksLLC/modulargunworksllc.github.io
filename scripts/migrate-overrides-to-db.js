#!/usr/bin/env node
/**
 * One-time: copy data/products/overrides.json into Neon Postgres.
 * Run: node scripts/migrate-overrides-to-db.js
 * Requires .env: DATABASE_URL (Neon connection string)
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const db = require('../admin/db');

db.migrateFromFile()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
