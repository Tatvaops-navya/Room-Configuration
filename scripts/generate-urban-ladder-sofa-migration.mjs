/**
 * Generates supabase/migrations/014_urban_ladder_sofa_catalog_seed.sql
 * Run: node scripts/generate-urban-ladder-sofa-migration.mjs
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, '..')

function escLiteral(s) {
  return String(s ?? '')
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "''")
}

function dollarTag(s) {
  let t = 'd'
  const str = String(s ?? '')
  while (str.includes(`$${t}$`)) t += 'x'
  return `$${t}$${str}$${t}$`
}

/** @typedef {Record<string, unknown>} Row */
/** @param {Row} r */
function rowSql(r) {
  const {
    category,
    name,
    brand,
    colour,
    warranty_in_months,
    length,
    width,
    height,
    net_weight,
    description,
    primary_material_type,
    price,
    images_url,
    product_url,
    seating_capacity,
  } = r
  const br = brand ? String(brand).replace(/^By/i, '').trim() : null
  const w = warranty_in_months != null ? Number(warranty_in_months) : null
  const p = price != null ? Number(price) : null
  const cols = [
    `category`,
    `name`,
    `brand`,
    `colour`,
    `warranty_in_months`,
    `length`,
    `width`,
    `height`,
    `net_weight`,
    `description`,
    `generic_name`,
    `primary_material_type`,
    `primary_material_subtype`,
    `primary_room`,
    `seating_capacity`,
    `product_model_name`,
    `price`,
    `images_url`,
    `product_url`,
  ]
  const vals = [
    category != null ? dollarTag(category) : 'NULL',
    name != null ? dollarTag(name) : 'NULL',
    br != null ? dollarTag(br) : 'NULL',
    colour != null ? dollarTag(colour) : 'NULL',
    Number.isFinite(w) ? String(w) : 'NULL',
    length != null ? dollarTag(length) : 'NULL',
    width != null ? dollarTag(width) : 'NULL',
    height != null ? dollarTag(height) : 'NULL',
    net_weight != null ? dollarTag(net_weight) : 'NULL',
    description != null ? dollarTag(description) : 'NULL',
    'NULL',
    primary_material_type != null ? dollarTag(primary_material_type) : 'NULL',
    'NULL',
    'NULL',
    seating_capacity != null ? dollarTag(seating_capacity) : 'NULL',
    'NULL',
    p != null && !Number.isNaN(p) ? p.toFixed(2) : 'NULL',
    images_url != null ? dollarTag(images_url.replace(/\s*\|\s*/g, ' | ').trim()) : 'NULL',
    product_url != null ? `'${escLiteral(product_url)}'` : 'NULL',
  ]
  return `(${vals.join(',\n  ')})`
}

import { rows } from './urban-ladder-sofa-catalog.mjs'

const urls = rows.map((r) => r.product_url).filter(Boolean)
const header = `-- Urban Ladder sofa / recliner / sofa-cum-bed catalog (bulk import).
-- Adds category column if missing, replaces existing rows with matching product_url.

ALTER TABLE sofa_products ADD COLUMN IF NOT EXISTS category text;

DELETE FROM sofa_products WHERE product_url IN (${urls.map((u) => `'${escLiteral(u)}'`).join(',\n  ')});

INSERT INTO sofa_products (
  category,
  name,
  brand,
  colour,
  warranty_in_months,
  length,
  width,
  height,
  net_weight,
  description,
  generic_name,
  primary_material_type,
  primary_material_subtype,
  primary_room,
  seating_capacity,
  product_model_name,
  price,
  images_url,
  product_url
) VALUES
${rows.map(rowSql).join(',\n')};
`

const out = path.join(root, 'supabase', 'migrations', '014_urban_ladder_sofa_catalog_seed.sql')
fs.writeFileSync(out, header, 'utf8')
console.log('Wrote', out)
