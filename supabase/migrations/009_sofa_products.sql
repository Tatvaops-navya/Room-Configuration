-- Sofa products catalog: full product details for when user selects "Sofa" in room customization.
-- Fetched by GET /api/product-variations?component=sofa&context=internal

DROP TABLE IF EXISTS sofa_products CASCADE;

CREATE TABLE sofa_products (
  id bigserial PRIMARY KEY,
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

CREATE INDEX IF NOT EXISTS idx_sofa_products_brand ON sofa_products(brand);
ALTER TABLE sofa_products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read" ON sofa_products FOR SELECT USING (true);
