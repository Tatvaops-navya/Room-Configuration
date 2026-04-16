-- Mattress / bed mattress catalog (IKEA-style export: category, name, price, description, images, product URL).
-- Fetched by GET /api/product-variations?component=mattress|bed&context=internal

DROP TABLE IF EXISTS mattress_products CASCADE;

CREATE TABLE mattress_products (
  id bigserial PRIMARY KEY,
  category text NOT NULL,
  name text NOT NULL,
  price numeric(12, 2),
  description text,
  image_url text,
  images_url text,
  product_url text NOT NULL UNIQUE,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_mattress_products_category ON mattress_products (category);
ALTER TABLE mattress_products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read mattress_products" ON mattress_products FOR SELECT USING (true);
