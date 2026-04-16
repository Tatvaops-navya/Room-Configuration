/**
 * Generates INSERT statements for mytyles_vitrified_tiles from mytyles CSV.
 * Run: node scripts/generate_mytyles_seed.js
 * Expects: mytyles_products_vitrified_tiles (4).csv in project root
 * Columns: Category, Product Name, Price, Description, Colors, Styles, Image URL, Filter Size, URL
 */
const fs = require('fs');
const path = require('path');

const csvPath = path.join(__dirname, '..', 'mytyles_products_vitrified_tiles (4).csv');
const outPath = path.join(__dirname, '..', 'supabase', 'migrations', '008_mytyles_vitrified_tiles_seed.sql');

function escape(v) {
  if (v == null || v === undefined) return "''";
  return "'" + String(v).replace(/'/g, "''").trim() + "'";
}

function parseCSVLine(line) {
  const parts = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') {
      inQuotes = !inQuotes;
      continue;
    }
    if (!inQuotes && c === ',') {
      parts.push(cur.trim());
      cur = '';
      continue;
    }
    cur += c;
  }
  parts.push(cur.trim());
  return parts;
}

let csv;
try {
  csv = fs.readFileSync(csvPath, 'utf8');
} catch (e) {
  console.error('Missing mytyles_products_vitrified_tiles (4).csv in project root.');
  process.exit(1);
}

const lines = csv.trim().split(/\r?\n/).filter(Boolean);
const dataLines = lines.slice(1); // skip header

const rows = dataLines.map((line) => parseCSVLine(line));

const values = rows.map((r, i) => {
  const id = i + 1;
  const category = escape(r[0] || '');
  const product_name = escape(r[1] || '');
  const price = (r[2] !== undefined && r[2] !== '' && !isNaN(parseFloat(r[2]))) ? parseFloat(r[2]) : null;
  const priceStr = price !== null ? price : 'NULL';
  const description = escape(r[3] || '');
  const colors = escape(r[4] || '');
  const styles = escape(r[5] || '');
  const image_url = escape(r[6] || '');
  const filter_size = escape(r[7] || '');
  const url = escape(r[8] || '');
  return `(${id},${category},${product_name},${priceStr},${description},${colors},${styles},${image_url},${filter_size},${url})`;
});

const BATCH = 100;
let sql = '-- Generated seed for mytyles_vitrified_tiles. Run after 008_mytyles_vitrified_tiles.sql\n\n';
for (let i = 0; i < values.length; i += BATCH) {
  const chunk = values.slice(i, i + BATCH);
  sql += 'INSERT INTO mytyles_vitrified_tiles (id, category, product_name, price, description, colors, styles, image_url, filter_size, url) VALUES\n';
  sql += chunk.join(',\n') + ';\n\n';
}
fs.writeFileSync(outPath, sql);
console.log('Wrote', outPath, 'with', rows.length, 'rows.');
