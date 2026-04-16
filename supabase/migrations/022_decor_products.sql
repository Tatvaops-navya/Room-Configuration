-- Home decor / accessories catalog (Urban Ladder, IKEA, etc.).
-- Fetched later via /api/product-variations?component=decor when we wire it up.

CREATE TABLE IF NOT EXISTS decor_products (
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

CREATE INDEX IF NOT EXISTS idx_decor_products_brand ON decor_products(brand);
CREATE INDEX IF NOT EXISTS idx_decor_products_category ON decor_products(category);
ALTER TABLE decor_products ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public read decor_products" ON decor_products;
CREATE POLICY "Allow public read decor_products" ON decor_products FOR SELECT USING (true);

