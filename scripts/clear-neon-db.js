/**
 * One-time script: connect to Neon Postgres and clear all user data (drop public schema and recreate).
 * Usage: node scripts/clear-neon-db.js
 *   Requires DATABASE_URL in .env, or:
 *   node scripts/clear-neon-db.js "postgresql://..."
 */
require('dotenv').config();
const { Client } = require('pg');

const connectionString = process.env.DATABASE_URL || process.argv[2];

async function main() {
  if (!connectionString) {
    console.error('Set DATABASE_URL in .env or pass connection string as first argument.');
    process.exit(1);
  }

  const client = new Client({ connectionString });
  try {
    await client.connect();
    console.log('Connected to Neon.');

    // Drop and recreate public schema to remove all tables, views, sequences, etc.
    await client.query('DROP SCHEMA IF EXISTS public CASCADE');
    await client.query('CREATE SCHEMA public');
    await client.query('GRANT ALL ON SCHEMA public TO neondb_owner');
    await client.query('GRANT ALL ON SCHEMA public TO public');

    console.log('Neon database cleared. public schema is empty and ready for a fresh start.');
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

main();
