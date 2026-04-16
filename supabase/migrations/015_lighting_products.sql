-- Interior lighting catalog (Urban Ladder / IKEA). Seeded in 016_lighting_products_seed.sql.

CREATE TABLE IF NOT EXISTS lighting_products (
  id BIGSERIAL PRIMARY KEY,
  category TEXT,
  name TEXT NOT NULL,
  brand TEXT,
  colour TEXT,
  warranty_in_months INTEGER,
  length TEXT,
  width TEXT,
  height TEXT,
  net_weight TEXT,
  description TEXT,
  primary_material_type TEXT,
  price NUMERIC,
  image_urls TEXT,
  product_url TEXT
);

CREATE INDEX IF NOT EXISTS idx_lighting_products_product_url ON lighting_products (product_url);
