-- Mytyles vitrified tiles product catalog (from mytyles_products_vitrified_tiles CSV).
-- Run seed: 008_mytyles_vitrified_tiles_seed.sql (generate with: node scripts/generate_mytyles_seed.js)

CREATE TABLE IF NOT EXISTS mytyles_vitrified_tiles (
  id integer PRIMARY KEY,
  category text NOT NULL,
  product_name text NOT NULL,
  price numeric(12,2),
  description text,
  colors text,
  styles text,
  image_url text,
  filter_size text,
  url text
);

ALTER TABLE mytyles_vitrified_tiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access on mytyles_vitrified_tiles"
  ON mytyles_vitrified_tiles FOR SELECT
  USING (true);
