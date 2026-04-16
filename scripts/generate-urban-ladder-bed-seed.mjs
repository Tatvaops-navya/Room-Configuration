/**
 * Writes supabase/migrations/025_urban_ladder_bed_products_seed.sql from urban-ladder-beds-rows.mjs
 * Run: node scripts/generate-urban-ladder-bed-seed.mjs
 */
import { writeFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import rows from './urban-ladder-beds-rows.mjs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const outPath = join(__dirname, '..', 'supabase', 'migrations', '025_urban_ladder_bed_products_seed.sql')

let n = 0
function q(s) {
  if (s == null || s === '') return 'NULL'
  const tag = `u${n++}`
  return `$${tag}$${String(s)}$${tag}$`
}

const urls = rows.map((r) => r.product_url).filter(Boolean)
const deleteList = urls.map((u) => q(u)).join(',\n  ')

const valueLines = rows.map((r) => {
  const w = r.warranty != null ? String(Number(r.warranty)) : 'NULL'
  const price = r.price != null ? String(Number(r.price)) : 'NULL'
  return `  (${q(r.category)}, ${q(r.name)}, ${q(r.brand)}, ${q(r.colour)}, ${w}, NULL, ${q(r.length)}, ${q(r.width)}, ${q(r.height)}, ${q(r.net_weight)}, ${q(r.description)}, NULL, ${q(r.material)}, NULL, NULL, NULL, NULL, ${price}, ${q(r.images_url)}, ${q(r.product_url)})`
})

const sql = `-- Urban Ladder bed / diwan catalog (bulk import into bed_products).
-- Regenerate: node scripts/generate-urban-ladder-bed-seed.mjs

DELETE FROM bed_products WHERE product_url IN (
  ${deleteList}
);

INSERT INTO bed_products (
  category,
  name,
  brand,
  colour,
  warranty_in_months,
  country_of_origin,
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
${valueLines.join(',\n')};
`

writeFileSync(outPath, sql, 'utf8')
console.log('Wrote', outPath, '(' + rows.length + ' rows)')
