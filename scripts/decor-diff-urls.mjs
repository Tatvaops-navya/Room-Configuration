import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const cat = fs.readFileSync(path.join(__dirname, '_catalog_extracted.txt'), 'utf8');
const urls = [
  ...cat.matchAll(
    /^https:\/\/www\.(urbanladder\.com\/product\/[^\s]+|ikea\.com\/in\/en\/p\/[^\s]+)\s*$/gm
  ),
].map((m) => m[0].trim());
const seed = fs.readFileSync(path.join(__dirname, 'decor_seed_rows.mjs'), 'utf8');
const inSeed = new Set([...seed.matchAll(/"pu": "([^"]+)"/g)].map((m) => m[1]));
const missing = urls.filter((u) => !inSeed.has(u));
console.log('catalog urls', urls.length, 'seed', inSeed.size, 'missing', missing.length);
missing.forEach((u) => console.log(u));
