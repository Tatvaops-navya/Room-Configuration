-- Coffee tables, study/desks, side tables, IKEA desks/tables (Urban Ladder, IKEA).
-- ui_target: which internal customization tab loads this row — "table" or "desk".
-- Fetched by GET /api/product-variations?component=table|desk&context=internal

CREATE TABLE IF NOT EXISTS table_products (
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
  ui_target text NOT NULL DEFAULT 'table' CHECK (ui_target IN ('table', 'desk')),
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_table_products_brand ON table_products(brand);
CREATE INDEX IF NOT EXISTS idx_table_products_category ON table_products(category);
CREATE INDEX IF NOT EXISTS idx_table_products_ui_target ON table_products(ui_target);
ALTER TABLE table_products ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public read table_products" ON table_products;
CREATE POLICY "Allow public read table_products" ON table_products FOR SELECT USING (true);
