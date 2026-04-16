/**
 * Extract catalog text from Cursor agent transcript JSONL (line 1 = first user message),
 * parse Urban Ladder + IKEA blocks, write compact rows for build-decor-seed.mjs
 *
 * Run: node scripts/parse-decor-catalog-from-transcript.mjs [path-to.jsonl]
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

const defaultTranscript = path.join(
  process.env.USERPROFILE || process.env.HOME || '',
  '.cursor',
  'projects',
  'c-Users-DELL-OneDrive-Desktop-room-configuration',
  'agent-transcripts',
  '980d6f34-5edf-44c0-9619-cf9e0ad9547a',
  '980d6f34-5edf-44c0-9619-cf9e0ad9547a.jsonl'
);

const transcriptPath = process.argv[2] || defaultTranscript;

function extractUserCatalogText(jsonlPath) {
  const firstLine = fs.readFileSync(jsonlPath, 'utf8').split(/\r?\n/)[0];
  const record = JSON.parse(firstLine);
  let text = record.message.content[0].text;
  text = text.replace(/^<user_query>\s*/i, '').replace(/<\/user_query>\s*$/i, '');
  return text;
}

const PROMO =
  /^(Crush Sale|Returns Quality Promise|^Returns$|Qty\s*:|Configuration\s*:|ByUrban Ladder)$/i;

function isPromoOrNotColour(l) {
  if (PROMO.test(l)) return true;
  if (/Crush Sale/i.test(l)) return true;
  if (/Up to 70%/i.test(l)) return true;
  if (/Returns Quality Promise/i.test(l)) return true;
  return false;
}

function parseUrbanBlock(rawLines) {
  const lines = rawLines.map((l) => l.trim()).filter((l) => l.length > 0);
  const start = lines.findIndex((l) => l.startsWith('Collection /'));
  if (start === -1) return null;
  const L = lines.slice(start);
  const category = L[0];
  const name = L[1];
  if (!name) return null;
  let brand = (L[2] || '').replace(/,\s*$/, '');
  let i = 3;
  const colourBuf = [];
  for (; i < L.length; i++) {
    const l = L[i];
    if (/^\d+$/.test(l)) break;
    if (isPromoOrNotColour(l)) continue;
    if (l.length < 120 && !l.includes('http')) colourBuf.push(l);
  }
  let colour = colourBuf.length ? colourBuf.join(' ').replace(/^\s*:\s*/, '').trim() : null;
  if (colour === '' || colour === ':') colour = null;

  const nums = [];
  while (i < L.length) {
    if (/^\d+$/.test(L[i])) {
      nums.push(parseInt(L[i], 10));
      i++;
      continue;
    }
    if (/^[\d.]+\s*kg$/i.test(L[i])) break;
    break;
  }
  let nw = null;
  if (i < L.length && /^[\d.]+\s*kg$/i.test(L[i])) {
    nw = L[i];
    i++;
  }
  const warranty = nums.length ? nums[0] : null;
  const dim = nums.slice(1);
  const le = dim[0] != null ? String(dim[0]) : null;
  const wi = dim[1] != null ? String(dim[1]) : null;
  const hi = dim[2] != null ? String(dim[2]) : null;

  const tail = L.slice(i);
  if (tail.length < 3) return null;
  const pu = tail.pop();
  const iu = tail.pop();
  let priceLine = tail.pop();
  let p = parseFloat(String(priceLine).replace(/,/g, ''));
  let m = null;
  if (!Number.isFinite(p)) {
    m = priceLine;
    priceLine = tail.pop();
    if (priceLine == null) return null;
    p = parseFloat(String(priceLine).replace(/,/g, ''));
  }
  if (!Number.isFinite(p)) return null;
  if (tail.length > 0) {
    const last = tail[tail.length - 1];
    if (
      last &&
      !last.includes('http') &&
      last.length < 80 &&
      !/^\d/.test(last) &&
      /^[A-Za-z]/.test(last)
    ) {
      const mat = tail.pop();
      if (m) tail.push(m);
      m = mat;
    }
  }
  const d = tail.join('\n').trim() || null;

  if (!/^https:\/\/www\.urbanladder\.com\/product\//.test(pu)) return null;
  if (!iu.includes('http')) return null;

  return {
    c: category,
    n: name,
    b: brand || null,
    co: colour,
    w: warranty,
    le,
    wi,
    hi,
    nw,
    d,
    g: null,
    m: m || null,
    p,
    iu,
    pu,
  };
}

function parseIkeaBlock(rawLines) {
  const lines = rawLines.map((l) => l.trim()).filter((l) => l.length > 0);
  if (lines.length < 4) return null;
  if (!lines[0].startsWith('in/en/cat/')) return null;
  const work = [...lines];
  const pu = work.pop();
  if (!/^https:\/\/www\.ikea\.com\/in\/en\/p\/[^\s]+\/?$/.test(pu)) return null;
  const iu = work.pop();
  if (!iu.includes('ikea.com/in/en/images')) return null;
  let p = null;
  const maybePrice = work[work.length - 1];
  if (/^\d+(?:\.\d+)?$/.test(maybePrice)) {
    const pv = parseFloat(work.pop());
    if (Number.isFinite(pv) && pv < 1e7) p = pv;
  }
  if (work.length < 2) return null;
  const catPath = work[0];
  const category = `IKEA / ${catPath.replace(/^in\/en\/cat\//, '')}`;
  const name = work[1];
  let d = work.slice(2).join('\n').trim() || null;
  if (d && name && d.startsWith(name)) d = d.slice(name.length).trim() || null;
  const colourMatch = name.match(/,\s*([^,/]+)\s*,\s*\d/);
  const co = colourMatch ? colourMatch[1].trim() : null;
  return {
    c: category,
    n: name,
    b: 'IKEA',
    co,
    w: null,
    le: null,
    wi: null,
    hi: null,
    nw: null,
    d,
    g: null,
    m: null,
    p,
    iu,
    pu,
  };
}

function splitIntoBlocks(text) {
  const lines = text.split(/\r?\n/);
  const blocks = [];
  let buf = [];
  for (const line of lines) {
    buf.push(line);
    const t = line.trim();
    if (
      /^https:\/\/www\.urbanladder\.com\/product\/[^\s]+$/.test(t) ||
      /^https:\/\/www\.ikea\.com\/in\/en\/p\/[^\s]+\/?$/.test(t)
    ) {
      blocks.push(buf.join('\n'));
      buf = [];
    }
  }
  return blocks;
}

function main() {
  if (!fs.existsSync(transcriptPath)) {
    console.error('Transcript not found:', transcriptPath);
    process.exit(1);
  }
  const catalog = extractUserCatalogText(transcriptPath);
  fs.writeFileSync(path.join(root, 'scripts', '_catalog_extracted.txt'), catalog, 'utf8');

  const blocks = splitIntoBlocks(catalog);
  const rows = [];
  const seen = new Set();
  for (const block of blocks) {
    const rawLines = block.split(/\r?\n/);
    let row = parseUrbanBlock(rawLines);
    if (!row) row = parseIkeaBlock(rawLines);
    if (!row) continue;
    if (seen.has(row.pu)) continue;
    seen.add(row.pu);
    rows.push(row);
  }

  const outJs = path.join(root, 'scripts', 'decor_seed_rows.mjs');
  const header = `/** Auto-generated by parse-decor-catalog-from-transcript.mjs — do not edit by hand; re-run parser after catalog changes. */
export const decorSeedRows = `;
  fs.writeFileSync(outJs, header + JSON.stringify(rows, null, 2) + ';\n', 'utf8');
  console.log('Wrote', rows.length, 'rows to', outJs);
}

main();
