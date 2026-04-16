-- Chair / study chair / dining catalog (Urban Ladder, IKEA, etc.).
-- Fetched by GET /api/product-variations?component=chair&context=internal

CREATE TABLE IF NOT EXISTS chair_products (
  id bigserial PRIMARY KEY,
  category text,
  name text NOT NULL,
  brand text,
  colour text,
  warranty_in_months int,
  country_of_origin text,
  length text,
  width text,
  height text,
  net_weight text,
  description text,
  generic_name text,
  primary_material_type text,
  primary_material_subtype text,
  primary_room text,
  seating_capacity text,
  product_model_name text,
  price numeric(12,2),
  images_url text,
  product_url text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_chair_products_brand ON chair_products(brand);
CREATE INDEX IF NOT EXISTS idx_chair_products_category ON chair_products(category);
ALTER TABLE chair_products ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public read chair_products" ON chair_products;
CREATE POLICY "Allow public read chair_products" ON chair_products FOR SELECT USING (true);
