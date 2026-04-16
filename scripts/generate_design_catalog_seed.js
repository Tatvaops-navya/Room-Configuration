/**
 * Generates INSERT statements for design_catalog from design_catalog_data.csv
 * Run: node scripts/generate_design_catalog_seed.js
 * Expects design_catalog_data.csv in project root with columns: id,component,material_category,design_code,design_name,finish,texture,color_family,application
 */
const fs = require('fs');
const path = require('path');

const csvPath = path.join(__dirname, '..', 'design_catalog_data.csv');
const outPath = path.join(__dirname, '..', 'supabase', 'migrations', '007_design_catalog_seed.sql');

function escape(v) {
  return "'" + String(v).replace(/'/g, "''").trim() + "'";
}

let csv;
try {
  csv = fs.readFileSync(csvPath, 'utf8');
} catch (e) {
  console.error('Create design_catalog_data.csv first (id,component,material_category,design_code,design_name,finish,texture,color_family,application).');
  process.exit(1);
}

const lines = csv.trim().split(/\r?\n/).filter(Boolean);
const header = lines[0].toLowerCase();
const dataLines = lines.slice(1);
const rows = dataLines.map(line => {
  const parts = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') { inQuotes = !inQuotes; continue; }
    if (!inQuotes && c === ',') { parts.push(cur.trim()); cur = ''; continue; }
    cur += c;
  }
  parts.push(cur.trim());
  return parts;
});

const values = rows.map((r, i) => {
  const id = parseInt(r[0], 10) || i + 1;
  const rest = [r[1], r[2], r[3], r[4], r[5], r[6], r[7], r[8]].map(escape);
  return '(' + id + ',' + rest.join(',') + ')';
});

const BATCH = 200;
let sql = '-- Generated seed for design_catalog. Run after 007_design_catalog.sql\n\n';
for (let i = 0; i < values.length; i += BATCH) {
  const chunk = values.slice(i, i + BATCH);
  sql += 'INSERT INTO design_catalog (id, component, material_category, design_code, design_name, finish, texture, color_family, application) VALUES\n';
  sql += chunk.join(',\n') + ';\n\n';
}
fs.writeFileSync(outPath, sql);
console.log('Wrote', outPath, 'with', rows.length, 'rows.');
