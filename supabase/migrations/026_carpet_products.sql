-- Rugs, carpets, dhurries, bath mats (Urban Ladder / Reliance Retail catalog).
-- Fetched by GET /api/product-variations?component=carpet&context=internal

CREATE TABLE IF NOT EXISTS carpet_products (
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

CREATE INDEX IF NOT EXISTS idx_carpet_products_brand ON carpet_products(brand);
CREATE INDEX IF NOT EXISTS idx_carpet_products_category ON carpet_products(category);
ALTER TABLE carpet_products ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public read carpet_products" ON carpet_products;
CREATE POLICY "Allow public read carpet_products" ON carpet_products FOR SELECT USING (true);
