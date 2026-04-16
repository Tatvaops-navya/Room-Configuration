/**
 * Connects to PostgreSQL and runs mytyles_vitrified_tiles schema + seed.
 * Usage: set DATABASE_URL then run: node scripts/run_mytyles_migration.js
 * Example (PowerShell): $env:DATABASE_URL = "postgresql://user:pass%40word@host:5432/postgres"; node scripts/run_mytyles_migration.js
 */
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const schemaPath = path.join(__dirname, '..', 'supabase', 'migrations', '008_mytyles_vitrified_tiles.sql');
const seedPath = path.join(__dirname, '..', 'supabase', 'migrations', '008_mytyles_vitrified_tiles_seed.sql');

const conn = process.env.DATABASE_URL;
if (!conn) {
  console.error('Set DATABASE_URL (e.g. postgresql://user:pass@host:5432/postgres). Password with @ must be encoded as %40.');
  process.exit(1);
}

async function run() {
  const client = new Client({ connectionString: conn });
  try {
    await client.connect();
    console.log('Connected.');

    const schema = fs.readFileSync(schemaPath, 'utf8');
    const schemaStatements = schema
      .split(/;\s*\n/)
      .map((s) => s.replace(/--[^\n]*/g, '').trim())
      .filter((s) => s.length > 0);
    for (const stmt of schemaStatements) {
      try {
        await client.query(stmt);
      } catch (e) {
        if (!/already exists/.test(e.message)) throw e;
      }
    }
    console.log('Schema applied (008_mytyles_vitrified_tiles.sql).');

    const seed = fs.readFileSync(seedPath, 'utf8');
    const statements = seed
      .split(/;\s*\n+/)
      .map((s) => s.replace(/--[^\n]*/g, '').trim())
      .filter((s) => s.length > 0 && /^INSERT\s/i.test(s));

    for (let i = 0; i < statements.length; i++) {
      await client.query(statements[i]);
      console.log('Seed batch', i + 1, '/', statements.length, 'done.');
    }
    console.log('Done. mytyles_vitrified_tiles table created and seeded.');
  } catch (err) {
    console.error(err.message || err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

run();
