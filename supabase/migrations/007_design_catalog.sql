-- Design Catalog table: component design options (ID, Component, Material_Category, Design_Code, Design_Name, Finish, Texture, Color_Family, Application)
-- Does NOT drop or modify any existing tables.

CREATE TABLE IF NOT EXISTS design_catalog (
  id integer PRIMARY KEY,
  component text NOT NULL,
  material_category text NOT NULL,
  design_code text NOT NULL,
  design_name text NOT NULL,
  finish text NOT NULL,
  texture text NOT NULL,
  color_family text NOT NULL,
  application text NOT NULL
);

-- Enable RLS with public read (optional; adjust policies as needed)
ALTER TABLE design_catalog ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access on design_catalog"
  ON design_catalog FOR SELECT
  USING (true);

-- Seed data: run 007_design_catalog_seed.sql after this migration (in Supabase SQL Editor run this file first, then 007_design_catalog_seed.sql).
-- To regenerate the seed from CSV: node scripts/generate_design_catalog_seed.js (requires design_catalog_data.csv in project root).
