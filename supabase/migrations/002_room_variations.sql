-- Internal room configuration (sofa, wall, door, window)
-- Table: room_variations
-- Run this in Supabase SQL Editor after 001_component_variations.sql (exterior).

DROP TABLE IF EXISTS room_variations CASCADE;

CREATE TABLE room_variations (
  id bigserial PRIMARY KEY,
  component_type text NOT NULL,
  product_code text NOT NULL,
  variation_code text NOT NULL,
  color text NOT NULL,
  material text NOT NULL,
  texture text NOT NULL,
  finish text NOT NULL,
  size text NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_room_variations_component_type ON room_variations(component_type);

ALTER TABLE room_variations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read" ON room_variations FOR SELECT USING (true);

-- Sofa
INSERT INTO room_variations (component_type, product_code, variation_code, color, material, texture, finish, size) VALUES
('sofa','SOF-001','SOF-001-CHA-SMO-MAT','Charcoal Grey','Fabric','Smooth','Matte','2-Seater'),
('sofa','SOF-001','SOF-001-CHA-SMO-SAT','Charcoal Grey','Fabric','Smooth','Satin','2-Seater'),
('sofa','SOF-001','SOF-001-CHA-WOV-MAT','Charcoal Grey','Fabric','Woven','Matte','2-Seater'),
('sofa','SOF-001','SOF-001-CHA-WOV-SAT','Charcoal Grey','Fabric','Woven','Satin','2-Seater'),
('sofa','SOF-001','SOF-001-BEI-SMO-MAT','Beige Linen','Fabric','Smooth','Matte','2-Seater'),
('sofa','SOF-001','SOF-001-BEI-SMO-SAT','Beige Linen','Fabric','Smooth','Satin','2-Seater'),
('sofa','SOF-001','SOF-001-BEI-WOV-MAT','Beige Linen','Fabric','Woven','Matte','2-Seater'),
('sofa','SOF-001','SOF-001-BEI-WOV-SAT','Beige Linen','Fabric','Woven','Satin','2-Seater'),
('sofa','SOF-001','SOF-001-NAV-SMO-MAT','Navy Blue','Fabric','Smooth','Matte','2-Seater'),
('sofa','SOF-001','SOF-001-NAV-SMO-SAT','Navy Blue','Fabric','Smooth','Satin','2-Seater'),
('sofa','SOF-001','SOF-001-NAV-WOV-MAT','Navy Blue','Fabric','Woven','Matte','2-Seater'),
('sofa','SOF-001','SOF-001-NAV-WOV-SAT','Navy Blue','Fabric','Woven','Satin','2-Seater');

-- Wall
INSERT INTO room_variations (component_type, product_code, variation_code, color, material, texture, finish, size) VALUES
('wall','WAL-001','WAL-001-WAR-SMO-MAT','Warm White','Paint','Smooth','Matte','Standard'),
('wall','WAL-001','WAL-001-WAR-SMO-EGG','Warm White','Paint','Smooth','Eggshell','Standard'),
('wall','WAL-001','WAL-001-WAR-LIG-MAT','Warm White','Paint','Light Texture','Matte','Standard'),
('wall','WAL-001','WAL-001-WAR-LIG-EGG','Warm White','Paint','Light Texture','Eggshell','Standard'),
('wall','WAL-001','WAL-001-SAG-SMO-MAT','Sage Green','Paint','Smooth','Matte','Standard'),
('wall','WAL-001','WAL-001-SAG-SMO-EGG','Sage Green','Paint','Smooth','Eggshell','Standard'),
('wall','WAL-001','WAL-001-SAG-LIG-MAT','Sage Green','Paint','Light Texture','Matte','Standard'),
('wall','WAL-001','WAL-001-SAG-LIG-EGG','Sage Green','Paint','Light Texture','Eggshell','Standard'),
('wall','WAL-001','WAL-001-TER-SMO-MAT','Terracotta','Paint','Smooth','Matte','Standard'),
('wall','WAL-001','WAL-001-TER-SMO-EGG','Terracotta','Paint','Smooth','Eggshell','Standard'),
('wall','WAL-001','WAL-001-TER-LIG-MAT','Terracotta','Paint','Light Texture','Matte','Standard'),
('wall','WAL-001','WAL-001-TER-LIG-EGG','Terracotta','Paint','Light Texture','Eggshell','Standard');

-- Door (internal)
INSERT INTO room_variations (component_type, product_code, variation_code, color, material, texture, finish, size) VALUES
('door','DOR-001','DOR-001-WAL-SMO-MAT','Walnut Brown','Wood','Smooth','Matte','Standard'),
('door','DOR-001','DOR-001-WAL-SMO-SEM','Walnut Brown','Wood','Smooth','Semi-Gloss','Standard'),
('door','DOR-001','DOR-001-WAL-WOO-MAT','Walnut Brown','Wood','Wood Grain','Matte','Standard'),
('door','DOR-001','DOR-001-WAL-WOO-SEM','Walnut Brown','Wood','Wood Grain','Semi-Gloss','Standard'),
('door','DOR-001','DOR-001-OAK-SMO-MAT','Oak Natural','Wood','Smooth','Matte','Standard'),
('door','DOR-001','DOR-001-OAK-SMO-SEM','Oak Natural','Wood','Smooth','Semi-Gloss','Standard'),
('door','DOR-001','DOR-001-OAK-WOO-MAT','Oak Natural','Wood','Wood Grain','Matte','Standard'),
('door','DOR-001','DOR-001-OAK-WOO-SEM','Oak Natural','Wood','Wood Grain','Semi-Gloss','Standard'),
('door','DOR-001','DOR-001-WHI-SMO-MAT','White Matte','Wood','Smooth','Matte','Standard'),
('door','DOR-001','DOR-001-WHI-SMO-SEM','White Matte','Wood','Smooth','Semi-Gloss','Standard'),
('door','DOR-001','DOR-001-WHI-WOO-MAT','White Matte','Wood','Wood Grain','Matte','Standard'),
('door','DOR-001','DOR-001-WHI-WOO-SEM','White Matte','Wood','Wood Grain','Semi-Gloss','Standard');

-- Window (internal)
INSERT INTO room_variations (component_type, product_code, variation_code, color, material, texture, finish, size) VALUES
('window','WIN-001','WIN-001-MAT-SMO-GLO','Matte Black','Aluminum','Smooth','Glossy','Standard'),
('window','WIN-001','WIN-001-MAT-SMO-MAT','Matte Black','Aluminum','Smooth','Matte','Standard'),
('window','WIN-001','WIN-001-MAT-BRU-GLO','Matte Black','Aluminum','Brushed','Glossy','Standard'),
('window','WIN-001','WIN-001-MAT-BRU-MAT','Matte Black','Aluminum','Brushed','Matte','Standard'),
('window','WIN-001','WIN-001-PUR-SMO-GLO','Pure White','Aluminum','Smooth','Glossy','Standard'),
('window','WIN-001','WIN-001-PUR-SMO-MAT','Pure White','Aluminum','Smooth','Matte','Standard'),
('window','WIN-001','WIN-001-PUR-BRU-GLO','Pure White','Aluminum','Brushed','Glossy','Standard'),
('window','WIN-001','WIN-001-PUR-BRU-MAT','Pure White','Aluminum','Brushed','Matte','Standard'),
('window','WIN-001','WIN-001-SIL-SMO-GLO','Silver Grey','Aluminum','Smooth','Glossy','Standard'),
('window','WIN-001','WIN-001-SIL-SMO-MAT','Silver Grey','Aluminum','Smooth','Matte','Standard'),
('window','WIN-001','WIN-001-SIL-BRU-GLO','Silver Grey','Aluminum','Brushed','Glossy','Standard'),
('window','WIN-001','WIN-001-SIL-BRU-MAT','Silver Grey','Aluminum','Brushed','Matte','Standard');
