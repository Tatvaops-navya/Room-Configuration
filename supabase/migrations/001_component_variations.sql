-- Component variations table (run this in Supabase SQL Editor)
-- Table: product_variations
-- If you had an older schema, this drops it so the new one can be created.

DROP TABLE IF EXISTS product_variations CASCADE;

CREATE TABLE product_variations (
  id bigserial PRIMARY KEY,
  component_type text NOT NULL,
  component_category text NOT NULL,
  component_name text NOT NULL,
  component_code text NOT NULL,
  variation_code text NOT NULL,
  variation_name text NOT NULL,
  style_family text NOT NULL,
  material text NOT NULL,
  color text NOT NULL,
  texture text NOT NULL,
  palette_code text NOT NULL
);

-- Index for API filtering by component_type
CREATE INDEX IF NOT EXISTS idx_product_variations_component_type ON product_variations(component_type);

-- Allow read for anon and authenticated (optional: restrict in RLS)
ALTER TABLE product_variations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read" ON product_variations FOR SELECT USING (true);

-- Seed data: Facade (Structure)
INSERT INTO product_variations (component_type, component_category, component_name, component_code, variation_code, variation_name, style_family, material, color, texture, palette_code) VALUES
('facade','Structure','Facade','STR-FAC','FAC-01','Matte Paint - Beige','Modern','Mixed','Beige','Varied','PAL-NEU'),
('facade','Structure','Facade','STR-FAC','FAC-02','Matte Paint - Grey','Modern','Mixed','Grey','Varied','PAL-NEU'),
('facade','Structure','Facade','STR-FAC','FAC-03','Matte Paint - White','Modern','Mixed','White','Varied','PAL-NEU'),
('facade','Structure','Facade','STR-FAC','FAC-04','Textured Paint - Sand','Modern','Mixed','Sand','Varied','PAL-NEU'),
('facade','Structure','Facade','STR-FAC','FAC-05','Stone Cladding - Grey','Modern','Mixed','Grey','Varied','PAL-NEU'),
('facade','Structure','Facade','STR-FAC','FAC-06','Stone Cladding - Brown','Modern','Mixed','Brown','Varied','PAL-NEU'),
('facade','Structure','Facade','STR-FAC','FAC-07','Brick Finish - Terracotta','Modern','Mixed','Terracotta','Varied','PAL-NEU'),
('facade','Structure','Facade','STR-FAC','FAC-08','Wood Panels - Walnut','Modern','Mixed','Walnut','Varied','PAL-NEU'),
('facade','Structure','Facade','STR-FAC','FAC-09','Concrete - Cement','Modern','Mixed','Cement','Varied','PAL-NEU'),
('facade','Structure','Facade','STR-FAC','FAC-10','Marble - White','Modern','Mixed','White','Varied','PAL-NEU'),
('facade','Structure','Facade','STR-FAC','FAC-11','Dual Tone - Beige Grey','Modern','Mixed','Beige Grey','Varied','PAL-NEU'),
('facade','Structure','Facade','STR-FAC','FAC-12','Pastel - Blue','Modern','Mixed','Blue','Varied','PAL-NEU'),
('facade','Structure','Facade','STR-FAC','FAC-13','Pastel - Green','Modern','Mixed','Green','Varied','PAL-NEU'),
('facade','Structure','Facade','STR-FAC','FAC-14','Geometric - White','Modern','Mixed','White','Varied','PAL-NEU'),
('facade','Structure','Facade','STR-FAC','FAC-15','Vertical Slats - Brown','Modern','Mixed','Brown','Varied','PAL-NEU');

-- Main Door (Openings)
INSERT INTO product_variations (component_type, component_category, component_name, component_code, variation_code, variation_name, style_family, material, color, texture, palette_code) VALUES
('door','Openings','Main Door','OPN-DR','DR-01','Solid Wood - Brown','Modern','Mixed','Brown','Varied','PAL-WOOD'),
('door','Openings','Main Door','OPN-DR','DR-02','Solid Wood - Dark Walnut','Modern','Mixed','Dark Walnut','Varied','PAL-WOOD'),
('door','Openings','Main Door','OPN-DR','DR-03','Metal - Black','Modern','Mixed','Black','Varied','PAL-WOOD'),
('door','Openings','Main Door','OPN-DR','DR-04','Glass Panel - Clear','Modern','Mixed','Clear','Varied','PAL-WOOD'),
('door','Openings','Main Door','OPN-DR','DR-05','Flush - White','Modern','Mixed','White','Varied','PAL-WOOD'),
('door','Openings','Main Door','OPN-DR','DR-06','Carved - Brown','Modern','Mixed','Brown','Varied','PAL-WOOD'),
('door','Openings','Main Door','OPN-DR','DR-07','Minimal - Oak','Modern','Mixed','Oak','Varied','PAL-WOOD'),
('door','Openings','Main Door','OPN-DR','DR-08','Double Door - Brown','Modern','Mixed','Brown','Varied','PAL-WOOD'),
('door','Openings','Main Door','OPN-DR','DR-09','Pivot - Beige','Modern','Mixed','Beige','Varied','PAL-WOOD'),
('door','Openings','Main Door','OPN-DR','DR-10','Arch - Brown','Modern','Mixed','Brown','Varied','PAL-WOOD'),
('door','Openings','Main Door','OPN-DR','DR-11','Classic - Teak','Modern','Mixed','Teak','Varied','PAL-WOOD'),
('door','Openings','Main Door','OPN-DR','DR-12','Modern - Black','Modern','Mixed','Black','Varied','PAL-WOOD'),
('door','Openings','Main Door','OPN-DR','DR-13','Panel - White','Modern','Mixed','White','Varied','PAL-WOOD'),
('door','Openings','Main Door','OPN-DR','DR-14','Luxury - Walnut','Modern','Mixed','Walnut','Varied','PAL-WOOD'),
('door','Openings','Main Door','OPN-DR','DR-15','Designer - Black','Modern','Mixed','Black','Varied','PAL-WOOD');

-- Windows (Openings)
INSERT INTO product_variations (component_type, component_category, component_name, component_code, variation_code, variation_name, style_family, material, color, texture, palette_code) VALUES
('window','Openings','Windows','OPN-WIN','WIN-01','Aluminum - Black','Modern','Mixed','Black','Varied','PAL-MONO'),
('window','Openings','Windows','OPN-WIN','WIN-02','Aluminum - Grey','Modern','Mixed','Grey','Varied','PAL-MONO'),
('window','Openings','Windows','OPN-WIN','WIN-03','uPVC - White','Modern','Mixed','White','Varied','PAL-MONO'),
('window','Openings','Windows','OPN-WIN','WIN-04','Sliding - Black','Modern','Mixed','Black','Varied','PAL-MONO'),
('window','Openings','Windows','OPN-WIN','WIN-05','Casement - White','Modern','Mixed','White','Varied','PAL-MONO'),
('window','Openings','Windows','OPN-WIN','WIN-06','French - White','Modern','Mixed','White','Varied','PAL-MONO'),
('window','Openings','Windows','OPN-WIN','WIN-07','Bay - Beige','Modern','Mixed','Beige','Varied','PAL-MONO'),
('window','Openings','Windows','OPN-WIN','WIN-08','Fixed - Clear','Modern','Mixed','Clear','Varied','PAL-MONO'),
('window','Openings','Windows','OPN-WIN','WIN-09','Slim - Grey','Modern','Mixed','Grey','Varied','PAL-MONO'),
('window','Openings','Windows','OPN-WIN','WIN-10','Industrial - Black','Modern','Mixed','Black','Varied','PAL-MONO'),
('window','Openings','Windows','OPN-WIN','WIN-11','Minimal - White','Modern','Mixed','White','Varied','PAL-MONO'),
('window','Openings','Windows','OPN-WIN','WIN-12','Tinted - Grey','Modern','Mixed','Grey','Varied','PAL-MONO'),
('window','Openings','Windows','OPN-WIN','WIN-13','Corner - Black','Modern','Mixed','Black','Varied','PAL-MONO'),
('window','Openings','Windows','OPN-WIN','WIN-14','Wide - White','Modern','Mixed','White','Varied','PAL-MONO'),
('window','Openings','Windows','OPN-WIN','WIN-15','Classic - Brown','Modern','Mixed','Brown','Varied','PAL-MONO');

-- Balcony (Structure)
INSERT INTO product_variations (component_type, component_category, component_name, component_code, variation_code, variation_name, style_family, material, color, texture, palette_code) VALUES
('balcony','Structure','Balcony','STR-BAL','BAL-01','Glass - Clear','Modern','Mixed','Clear','Varied','PAL-CLR'),
('balcony','Structure','Balcony','STR-BAL','BAL-02','Metal - Black','Modern','Mixed','Black','Varied','PAL-CLR'),
('balcony','Structure','Balcony','STR-BAL','BAL-03','Wood - Brown','Modern','Mixed','Brown','Varied','PAL-CLR'),
('balcony','Structure','Balcony','STR-BAL','BAL-04','Laser Cut - Brown','Modern','Mixed','Brown','Varied','PAL-CLR'),
('balcony','Structure','Balcony','STR-BAL','BAL-05','Cable - Silver','Modern','Mixed','Silver','Varied','PAL-CLR'),
('balcony','Structure','Balcony','STR-BAL','BAL-06','Extended - Grey','Modern','Mixed','Grey','Varied','PAL-CLR'),
('balcony','Structure','Balcony','STR-BAL','BAL-07','Juliet - Black','Modern','Mixed','Black','Varied','PAL-CLR'),
('balcony','Structure','Balcony','STR-BAL','BAL-08','Box - White','Modern','Mixed','White','Varied','PAL-CLR'),
('balcony','Structure','Balcony','STR-BAL','BAL-09','Floating - Grey','Modern','Mixed','Grey','Varied','PAL-CLR'),
('balcony','Structure','Balcony','STR-BAL','BAL-10','Minimal - Black','Modern','Mixed','Black','Varied','PAL-CLR'),
('balcony','Structure','Balcony','STR-BAL','BAL-11','Classic - Brown','Modern','Mixed','Brown','Varied','PAL-CLR'),
('balcony','Structure','Balcony','STR-BAL','BAL-12','Modern - Black','Modern','Mixed','Black','Varied','PAL-CLR'),
('balcony','Structure','Balcony','STR-BAL','BAL-13','Frameless - Clear','Modern','Mixed','Clear','Varied','PAL-CLR'),
('balcony','Structure','Balcony','STR-BAL','BAL-14','Designer - Black','Modern','Mixed','Black','Varied','PAL-CLR'),
('balcony','Structure','Balcony','STR-BAL','BAL-15','Premium - Silver','Modern','Mixed','Silver','Varied','PAL-CLR');

-- Canopy (Structure)
INSERT INTO product_variations (component_type, component_category, component_name, component_code, variation_code, variation_name, style_family, material, color, texture, palette_code) VALUES
('canopy','Structure','Canopy','STR-CAN','CAN-01','Fabric - Cream','Modern','Mixed','Cream','Varied','PAL-NEU'),
('canopy','Structure','Canopy','STR-CAN','CAN-02','Glass - Clear','Modern','Mixed','Clear','Varied','PAL-NEU'),
('canopy','Structure','Canopy','STR-CAN','CAN-03','Polycarbonate - White','Modern','Mixed','White','Varied','PAL-NEU'),
('canopy','Structure','Canopy','STR-CAN','CAN-04','Pergola - Brown','Modern','Mixed','Brown','Varied','PAL-NEU'),
('canopy','Structure','Canopy','STR-CAN','CAN-05','Metal - Grey','Modern','Mixed','Grey','Varied','PAL-NEU'),
('canopy','Structure','Canopy','STR-CAN','CAN-06','Flat - White','Modern','Mixed','White','Varied','PAL-NEU'),
('canopy','Structure','Canopy','STR-CAN','CAN-07','Curved - Black','Modern','Mixed','Black','Varied','PAL-NEU'),
('canopy','Structure','Canopy','STR-CAN','CAN-08','Hanging - Grey','Modern','Mixed','Grey','Varied','PAL-NEU'),
('canopy','Structure','Canopy','STR-CAN','CAN-09','Frame - Silver','Modern','Mixed','Silver','Varied','PAL-NEU'),
('canopy','Structure','Canopy','STR-CAN','CAN-10','Premium - Gold','Modern','Mixed','Gold','Varied','PAL-NEU'),
('canopy','Structure','Canopy','STR-CAN','CAN-11','Minimal - White','Modern','Mixed','White','Varied','PAL-NEU'),
('canopy','Structure','Canopy','STR-CAN','CAN-12','Classic - Brown','Modern','Mixed','Brown','Varied','PAL-NEU'),
('canopy','Structure','Canopy','STR-CAN','CAN-13','Modern - Grey','Modern','Mixed','Grey','Varied','PAL-NEU'),
('canopy','Structure','Canopy','STR-CAN','CAN-14','Designer - Black','Modern','Mixed','Black','Varied','PAL-NEU'),
('canopy','Structure','Canopy','STR-CAN','CAN-15','Luxury - Glass','Modern','Mixed','Glass','Varied','PAL-NEU');

-- Lighting (Styling)
INSERT INTO product_variations (component_type, component_category, component_name, component_code, variation_code, variation_name, style_family, material, color, texture, palette_code) VALUES
('lighting','Styling','Lighting','STY-LGT','LGT-01','Up Down - Warm','Modern','Mixed','Warm','Varied','PAL-WARM'),
('lighting','Styling','Lighting','STY-LGT','LGT-02','Up Down - Cool','Modern','Mixed','Cool','Varied','PAL-WARM'),
('lighting','Styling','Lighting','STY-LGT','LGT-03','Lantern - Warm','Modern','Mixed','Warm','Varied','PAL-WARM'),
('lighting','Styling','Lighting','STY-LGT','LGT-04','Recessed - White','Modern','Mixed','White','Varied','PAL-WARM'),
('lighting','Styling','Lighting','STY-LGT','LGT-05','Strip - Warm','Modern','Mixed','Warm','Varied','PAL-WARM'),
('lighting','Styling','Lighting','STY-LGT','LGT-06','Ambient - Warm','Modern','Mixed','Warm','Varied','PAL-WARM'),
('lighting','Styling','Lighting','STY-LGT','LGT-07','Spotlight - White','Modern','Mixed','White','Varied','PAL-WARM'),
('lighting','Styling','Lighting','STY-LGT','LGT-08','Path - Warm','Modern','Mixed','Warm','Varied','PAL-WARM'),
('lighting','Styling','Lighting','STY-LGT','LGT-09','Facade - White','Modern','Mixed','White','Varied','PAL-WARM'),
('lighting','Styling','Lighting','STY-LGT','LGT-10','Decor - Warm','Modern','Mixed','Warm','Varied','PAL-WARM'),
('lighting','Styling','Lighting','STY-LGT','LGT-11','Minimal - White','Modern','Mixed','White','Varied','PAL-WARM'),
('lighting','Styling','Lighting','STY-LGT','LGT-12','Wall - Warm','Modern','Mixed','Warm','Varied','PAL-WARM'),
('lighting','Styling','Lighting','STY-LGT','LGT-13','LED - Cool','Modern','Mixed','Cool','Varied','PAL-WARM'),
('lighting','Styling','Lighting','STY-LGT','LGT-14','Premium - Warm','Modern','Mixed','Warm','Varied','PAL-WARM'),
('lighting','Styling','Lighting','STY-LGT','LGT-15','Classic - Warm','Modern','Mixed','Warm','Varied','PAL-WARM');

-- Landscaping (Outdoors)
INSERT INTO product_variations (component_type, component_category, component_name, component_code, variation_code, variation_name, style_family, material, color, texture, palette_code) VALUES
('landscaping','Outdoors','Landscaping','OUT-LND','LND-01','Tropical - Green','Modern','Mixed','Green','Varied','PAL-GRN'),
('landscaping','Outdoors','Landscaping','OUT-LND','LND-02','Minimal - Green','Modern','Mixed','Green','Varied','PAL-GRN'),
('landscaping','Outdoors','Landscaping','OUT-LND','LND-03','Zen - Green','Modern','Mixed','Green','Varied','PAL-GRN'),
('landscaping','Outdoors','Landscaping','OUT-LND','LND-04','Lush - Green','Modern','Mixed','Green','Varied','PAL-GRN'),
('landscaping','Outdoors','Landscaping','OUT-LND','LND-05','Desert - Sand','Modern','Mixed','Sand','Varied','PAL-GRN'),
('landscaping','Outdoors','Landscaping','OUT-LND','LND-06','Modern - Green','Modern','Mixed','Green','Varied','PAL-GRN'),
('landscaping','Outdoors','Landscaping','OUT-LND','LND-07','Flower - Multi','Modern','Mixed','Multi','Varied','PAL-GRN'),
('landscaping','Outdoors','Landscaping','OUT-LND','LND-08','Shrubs - Green','Modern','Mixed','Green','Varied','PAL-GRN'),
('landscaping','Outdoors','Landscaping','OUT-LND','LND-09','Palm - Green','Modern','Mixed','Green','Varied','PAL-GRN'),
('landscaping','Outdoors','Landscaping','OUT-LND','LND-10','Bamboo - Green','Modern','Mixed','Green','Varied','PAL-GRN'),
('landscaping','Outdoors','Landscaping','OUT-LND','LND-11','Luxury - Green','Modern','Mixed','Green','Varied','PAL-GRN'),
('landscaping','Outdoors','Landscaping','OUT-LND','LND-12','Simple - Green','Modern','Mixed','Green','Varied','PAL-GRN'),
('landscaping','Outdoors','Landscaping','OUT-LND','LND-13','Natural - Green','Modern','Mixed','Green','Varied','PAL-GRN'),
('landscaping','Outdoors','Landscaping','OUT-LND','LND-14','Premium - Green','Modern','Mixed','Green','Varied','PAL-GRN'),
('landscaping','Outdoors','Landscaping','OUT-LND','LND-15','Compact - Green','Modern','Mixed','Green','Varied','PAL-GRN');

-- Pathway (Outdoors)
INSERT INTO product_variations (component_type, component_category, component_name, component_code, variation_code, variation_name, style_family, material, color, texture, palette_code) VALUES
('pathway','Outdoors','Pathway','OUT-PTH','PTH-01','Stone - Grey','Modern','Mixed','Grey','Varied','PAL-GRY'),
('pathway','Outdoors','Pathway','OUT-PTH','PTH-02','Concrete - Grey','Modern','Mixed','Grey','Varied','PAL-GRY'),
('pathway','Outdoors','Pathway','OUT-PTH','PTH-03','Brick - Red','Modern','Mixed','Red','Varied','PAL-GRY'),
('pathway','Outdoors','Pathway','OUT-PTH','PTH-04','Gravel - Grey','Modern','Mixed','Grey','Varied','PAL-GRY'),
('pathway','Outdoors','Pathway','OUT-PTH','PTH-05','Wood Deck - Brown','Modern','Mixed','Brown','Varied','PAL-GRY'),
('pathway','Outdoors','Pathway','OUT-PTH','PTH-06','Modern - Grey','Modern','Mixed','Grey','Varied','PAL-GRY'),
('pathway','Outdoors','Pathway','OUT-PTH','PTH-07','Pattern - Grey','Modern','Mixed','Grey','Varied','PAL-GRY'),
('pathway','Outdoors','Pathway','OUT-PTH','PTH-08','Minimal - White','Modern','Mixed','White','Varied','PAL-GRY'),
('pathway','Outdoors','Pathway','OUT-PTH','PTH-09','Premium - Black','Modern','Mixed','Black','Varied','PAL-GRY'),
('pathway','Outdoors','Pathway','OUT-PTH','PTH-10','Natural - Sand','Modern','Mixed','Sand','Varied','PAL-GRY');
