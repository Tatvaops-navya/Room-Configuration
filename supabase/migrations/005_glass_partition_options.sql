-- New table: glass_partition_options (do not drop any existing tables)
-- Columns: id, color_hex, style_name, description, material, texture, finish, category

CREATE TABLE IF NOT EXISTS glass_partition_options (
  id integer PRIMARY KEY,
  color_hex text NOT NULL,
  style_name text NOT NULL,
  description text NOT NULL,
  material text NOT NULL,
  texture text NOT NULL,
  finish text NOT NULL,
  category text NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_glass_partition_options_category ON glass_partition_options(category);
CREATE INDEX IF NOT EXISTS idx_glass_partition_options_material ON glass_partition_options(material);

ALTER TABLE glass_partition_options ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read" ON glass_partition_options FOR SELECT USING (true);

INSERT INTO glass_partition_options (id, color_hex, style_name, description, material, texture, finish, category) VALUES
(1, '#EDEFF2', 'Clear Glass Frameless', 'Clear frameless glass partition', 'Glass', 'Smooth', 'Glossy', 'Standard'),
(2, '#E8EDF3', 'Ultra Clear Glass', 'High transparency glass', 'Glass', 'Smooth', 'Glossy', 'Premium'),
(3, '#DDE3EA', 'Low Iron Glass', 'Low tint glass panel', 'Glass', 'Smooth', 'Glossy', 'Premium'),
(4, '#D1D7DE', 'Frosted Glass Light', 'Light frosted privacy glass', 'Glass', 'Matte', 'Frosted', 'Standard'),
(5, '#C7CDD4', 'Frosted Glass Heavy', 'High privacy frosted glass', 'Glass', 'Matte', 'Frosted', 'Standard'),
(6, '#BCC2C9', 'Sandblasted Glass', 'Sandblasted matte glass', 'Glass', 'Textured', 'Matte', 'Premium'),
(7, '#E5E5E5', 'Etched Pattern Glass', 'Decor etched glass', 'Glass', 'Pattern', 'Matte', 'Premium'),
(8, '#F2F2F2', 'Milk White Glass', 'Opaque white glass', 'Glass', 'Smooth', 'Matte', 'Modern'),
(9, '#E9E9E9', 'Laminated Glass', 'Safety laminated glass', 'Glass', 'Smooth', 'Glossy', 'Standard'),
(10, '#DADADA', 'Tempered Glass', 'Tempered clear glass', 'Glass', 'Smooth', 'Glossy', 'Standard'),
(11, '#C0C6CC', 'Tinted Glass Grey', 'Grey tinted glass', 'Glass', 'Smooth', 'Glossy', 'Modern'),
(12, '#B5BDC4', 'Tinted Glass Blue', 'Blue tinted glass', 'Glass', 'Smooth', 'Glossy', 'Modern'),
(13, '#AEB6BE', 'Tinted Glass Bronze', 'Bronze tinted glass', 'Glass', 'Smooth', 'Glossy', 'Modern'),
(14, '#9FA6AD', 'Tinted Glass Black', 'Dark tinted glass', 'Glass', 'Smooth', 'Glossy', 'Premium'),
(15, '#C9CED3', 'Gradient Frost Glass', 'Gradient frosted glass', 'Glass', 'Gradient', 'Matte', 'Premium'),
(16, '#E7EBEF', 'Reeded Glass', 'Vertical ribbed glass', 'Glass', 'Textured', 'Glossy', 'Premium'),
(17, '#E3E7EB', 'Fluted Glass', 'Fluted privacy glass', 'Glass', 'Textured', 'Glossy', 'Premium'),
(18, '#DDE2E6', 'Pattern Square Glass', 'Square pattern glass', 'Glass', 'Pattern', 'Glossy', 'Premium'),
(19, '#D6DBE0', 'Pattern Geometric Glass', 'Geometric glass panel', 'Glass', 'Pattern', 'Glossy', 'Premium'),
(20, '#CFD5DB', 'Pattern Wave Glass', 'Wave textured glass', 'Glass', 'Pattern', 'Glossy', 'Premium'),
(21, '#E8ECF1', 'Sliding Glass Panel', 'Sliding glass partition', 'Glass', 'Smooth', 'Glossy', 'Modern'),
(22, '#E1E6EB', 'Framed Glass Black', 'Black framed glass', 'Glass+Metal', 'Smooth', 'Glossy', 'Modern'),
(23, '#E6EAEE', 'Framed Glass White', 'White framed glass', 'Glass+Metal', 'Smooth', 'Glossy', 'Modern'),
(24, '#DEE3E8', 'Metal Grid Glass', 'Industrial grid glass', 'Glass+Metal', 'Smooth', 'Glossy', 'Industrial'),
(25, '#D7DCE1', 'Minimal Frame Glass', 'Slim frame glass', 'Glass+Metal', 'Smooth', 'Glossy', 'Modern'),
(26, '#F0F3F6', 'Acoustic Glass', 'Soundproof glass', 'Glass', 'Smooth', 'Matte', 'Premium'),
(27, '#E9EDF1', 'Double Glazed Glass', 'Insulated glass panel', 'Glass', 'Smooth', 'Glossy', 'Premium'),
(28, '#E2E7EC', 'Smart Switch Glass', 'Switchable privacy glass', 'Glass', 'Smooth', 'Glossy', 'Premium'),
(29, '#DCE2E7', 'Reflective Glass', 'Reflective mirror glass', 'Glass', 'Reflective', 'Glossy', 'Premium'),
(30, '#D5DBE0', 'Mirror Glass Panel', 'Mirror finish glass', 'Glass', 'Reflective', 'Glossy', 'Modern'),
(31, '#EEF1F4', 'Glass With Wooden Frame', 'Wood framed glass', 'Glass+Wood', 'Smooth', 'Glossy', 'Premium'),
(32, '#E7EBEF', 'Glass With Metal Frame', 'Metal framed glass', 'Glass+Metal', 'Smooth', 'Glossy', 'Modern'),
(33, '#E1E5E9', 'Glass Divider Panels', 'Modular glass divider', 'Glass', 'Smooth', 'Glossy', 'Modern'),
(34, '#DADFE4', 'Half Frost Glass', 'Half frosted design', 'Glass', 'Mixed', 'Matte', 'Modern'),
(35, '#D3D8DD', 'Stripe Frost Glass', 'Striped frosted glass', 'Glass', 'Pattern', 'Matte', 'Modern'),
(36, '#F3F5F7', 'Luxury Pattern Glass', 'Luxury patterned glass', 'Glass', 'Pattern', 'Glossy', 'Premium'),
(37, '#ECEFF2', 'Decor Printed Glass', 'Printed decor glass', 'Glass', 'Printed', 'Glossy', 'Premium'),
(38, '#E6E9ED', 'Color Back Painted Glass', 'Back painted glass', 'Glass', 'Smooth', 'Glossy', 'Modern'),
(39, '#DFE3E7', 'Matte Back Painted Glass', 'Back painted matte glass', 'Glass', 'Smooth', 'Matte', 'Modern'),
(40, '#D8DDE2', 'Textured Privacy Glass', 'Privacy textured glass', 'Glass', 'Textured', 'Matte', 'Premium'),
(41, '#EEF2F5', 'Office Glass Partition', 'Office divider glass', 'Glass', 'Smooth', 'Glossy', 'Standard'),
(42, '#E8EDF2', 'Home Divider Glass', 'Home glass divider', 'Glass', 'Smooth', 'Glossy', 'Standard'),
(43, '#E1E6EA', 'Full Height Glass', 'Full height glass wall', 'Glass', 'Smooth', 'Glossy', 'Modern'),
(44, '#DBE0E5', 'Corner Glass Panel', 'Corner glass partition', 'Glass', 'Smooth', 'Glossy', 'Modern'),
(45, '#D4DAE0', 'Curved Glass Partition', 'Curved glass wall', 'Glass', 'Smooth', 'Glossy', 'Premium'),
(46, '#F4F6F8', 'Minimal Glass Divider', 'Minimal divider glass', 'Glass', 'Smooth', 'Glossy', 'Modern'),
(47, '#EDF1F4', 'Elegant Glass Panel', 'Elegant partition glass', 'Glass', 'Smooth', 'Glossy', 'Premium'),
(48, '#E6EBEF', 'Luxury Frost Pattern', 'Luxury frosted design', 'Glass', 'Pattern', 'Matte', 'Premium'),
(49, '#DFE4E9', 'Designer Glass Panel', 'Designer glass partition', 'Glass', 'Smooth', 'Glossy', 'Premium'),
(50, '#D8DEE4', 'Premium Clear Glass', 'Premium clarity glass', 'Glass', 'Smooth', 'Glossy', 'Premium');
