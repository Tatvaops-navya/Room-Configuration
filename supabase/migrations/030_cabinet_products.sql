-- Sideboards, shoe racks, bookshelves, TV units, chests of drawers (Urban Ladder, etc.).
-- Separate from table_products. Fetched by GET /api/product-variations?component=cabinet&context=internal

CREATE TABLE IF NOT EXISTS cabinet_products (
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

CREATE INDEX IF NOT EXISTS idx_cabinet_products_brand ON cabinet_products(brand);
CREATE INDEX IF NOT EXISTS idx_cabinet_products_category ON cabinet_products(category);
CREATE INDEX IF NOT EXISTS idx_cabinet_products_product_url ON cabinet_products(product_url);

ALTER TABLE cabinet_products ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public read cabinet_products" ON cabinet_products;
CREATE POLICY "Allow public read cabinet_products" ON cabinet_products FOR SELECT USING (true);
