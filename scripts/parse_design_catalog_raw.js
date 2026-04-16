/**
 * Parses design_catalog_raw.txt (9 lines per record) into design_catalog_data.csv
 * Run from project root: node scripts/parse_design_catalog_raw.js
 */
const fs = require('fs');
const path = require('path');

const rawPath = path.join(__dirname, '..', 'design_catalog_raw.txt');
const outPath = path.join(__dirname, '..', 'design_catalog_data.csv');

let raw = fs.readFileSync(rawPath, 'utf8');
// Remove </user_query> if present
raw = raw.replace(/\s*<\/user_query>\s*$/i, '').trim();
const lines = raw.split(/\r?\n/).map(l => l.trim());

// Find start of data: header is ID, Component, Material_Category, Design_Code, Design_Name, Finish, Texture, Color_Family, Application
// then first numeric ID (1). Locate "1" as first data row.
let startIdx = 0;
for (let i = 0; i < lines.length; i++) {
  if (lines[i] === '1' && i >= 9 && lines[i - 1] && lines[i - 1].toLowerCase() === 'application') {
    startIdx = i;
    break;
  }
}
if (startIdx === 0) {
  // Fallback: find first line that is exactly "1"
  const oneIdx = lines.findIndex((l, i) => l === '1' && i > 10);
  if (oneIdx >= 0) startIdx = oneIdx;
}

const dataLines = lines.slice(startIdx);
const records = [];
for (let i = 0; i < dataLines.length; i += 9) {
  const chunk = dataLines.slice(i, i + 9);
  if (chunk.length < 9) break;
  records.push(chunk);
}

function escapeCsv(val) {
  const s = String(val).trim();
  if (s.includes(',') || s.includes('"') || s.includes('\n')) {
    return '"' + s.replace(/"/g, '""') + '"';
  }
  return s;
}

const header = 'id,component,material_category,design_code,design_name,finish,texture,color_family,application';
const csvRows = [header, ...records.map(r => r.map(escapeCsv).join(','))];
fs.writeFileSync(outPath, csvRows.join('\n'), 'utf8');
console.log('Wrote', outPath, 'with', records.length, 'rows.');
if (records.length !== 2000) console.warn('Expected 2000 rows, got', records.length);
