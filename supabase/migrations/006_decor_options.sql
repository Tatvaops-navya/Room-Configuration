-- New table: decor_options (do not drop any existing tables)
-- Columns: id, color_hex, style_name, description, material, texture, category

CREATE TABLE IF NOT EXISTS decor_options (
  id integer PRIMARY KEY,
  color_hex text NOT NULL,
  style_name text NOT NULL,
  description text NOT NULL,
  material text NOT NULL,
  texture text NOT NULL,
  category text NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_decor_options_category ON decor_options(category);
CREATE INDEX IF NOT EXISTS idx_decor_options_material ON decor_options(material);

ALTER TABLE decor_options ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read" ON decor_options FOR SELECT USING (true);

INSERT INTO decor_options (id, color_hex, style_name, description, material, texture, category) VALUES
(1, '#6FAF6A', 'Green Indoor Plants', 'Add lush indoor plants', 'Plants', 'Organic', 'Standard'),
(2, '#4F8F4F', 'Tall Corner Plants', 'Tall statement plants', 'Plants', 'Organic', 'Standard'),
(3, '#8BC34A', 'Minimal Plant Pots', 'Minimal planters', 'Ceramic', 'Smooth', 'Modern'),
(4, '#C2A57A', 'Warm Art Frames', 'Warm toned frames', 'Wood', 'Smooth', 'Standard'),
(5, '#B08968', 'Gallery Wall Frames', 'Gallery wall setup', 'Wood', 'Matte', 'Modern'),
(6, '#D4AF37', 'Golden Wall Decor', 'Gold accent decor', 'Metal', 'Glossy', 'Premium'),
(7, '#E6BE8A', 'Neutral Wall Art', 'Neutral artwork', 'Canvas', 'Matte', 'Standard'),
(8, '#FFD580', 'Warm Ambient Lamps', 'Warm lighting decor', 'Metal', 'Smooth', 'Modern'),
(9, '#FFE4B5', 'Soft Table Lamps', 'Soft decor lamps', 'Fabric', 'Soft', 'Standard'),
(10, '#F4A460', 'Decor Floor Lamps', 'Decorative floor lamps', 'Metal', 'Smooth', 'Modern'),
(11, '#A1887F', 'Wooden Sculptures', 'Wood decor accents', 'Wood', 'Grain', 'Premium'),
(12, '#9E9E9E', 'Minimal Metal Sculptures', 'Modern metal decor', 'Metal', 'Matte', 'Modern'),
(13, '#D7CCC8', 'Ceramic Decor Objects', 'Ceramic accents', 'Ceramic', 'Smooth', 'Standard'),
(14, '#FFE0B2', 'Boho Decor Items', 'Boho decorative items', 'Mixed', 'Textured', 'Modern'),
(15, '#F5F5F5', 'Minimal White Decor', 'Minimal decor set', 'Mixed', 'Smooth', 'Modern'),
(16, '#C5CAE9', 'Decor Cushions', 'Decor throw cushions', 'Fabric', 'Soft', 'Standard'),
(17, '#B39DDB', 'Pattern Cushions', 'Patterned cushions', 'Fabric', 'Textured', 'Standard'),
(18, '#80CBC4', 'Pastel Decor Accents', 'Pastel decor elements', 'Mixed', 'Smooth', 'Modern'),
(19, '#EF9A9A', 'Color Pop Decor', 'Bold accent decor', 'Mixed', 'Smooth', 'Modern'),
(20, '#FFCCBC', 'Soft Pink Decor', 'Soft tone decor', 'Mixed', 'Smooth', 'Modern'),
(21, '#A5D6A7', 'Indoor Planter Set', 'Planter decor set', 'Ceramic', 'Smooth', 'Standard'),
(22, '#DCE775', 'Natural Decor Basket', 'Woven basket decor', 'Wicker', 'Textured', 'Standard'),
(23, '#BCAAA4', 'Decor Storage Boxes', 'Decorative boxes', 'Wood', 'Matte', 'Standard'),
(24, '#90CAF9', 'Glass Decor Vases', 'Decor vases', 'Glass', 'Glossy', 'Modern'),
(25, '#81D4FA', 'Blue Accent Decor', 'Cool tone decor', 'Mixed', 'Smooth', 'Modern'),
(26, '#FFAB91', 'Terracotta Decor', 'Terracotta accents', 'Clay', 'Matte', 'Standard'),
(27, '#E57373', 'Rustic Decor Items', 'Rustic decor theme', 'Wood', 'Rough', 'Standard'),
(28, '#BA68C8', 'Luxury Decor Accents', 'Luxury decorative set', 'Metal', 'Glossy', 'Premium'),
(29, '#FFD54F', 'Golden Accent Decor', 'Gold decor elements', 'Metal', 'Glossy', 'Premium'),
(30, '#A1887F', 'Classic Decor Set', 'Classic decor theme', 'Mixed', 'Smooth', 'Standard'),
(31, '#B2DFDB', 'Modern Decor Accents', 'Modern decor style', 'Mixed', 'Smooth', 'Modern'),
(32, '#F8BBD0', 'Soft Feminine Decor', 'Soft decor theme', 'Mixed', 'Smooth', 'Modern'),
(33, '#DCEDC8', 'Eco Decor Style', 'Eco friendly decor', 'Mixed', 'Textured', 'Standard'),
(34, '#CFD8DC', 'Minimal Grey Decor', 'Neutral grey decor', 'Mixed', 'Smooth', 'Modern'),
(35, '#FFE082', 'Warm Cozy Decor', 'Cozy decor style', 'Mixed', 'Soft', 'Standard'),
(36, '#B0BEC5', 'Industrial Decor Accents', 'Industrial decor', 'Metal', 'Matte', 'Modern'),
(37, '#E0E0E0', 'Neutral Decor Elements', 'Neutral accents', 'Mixed', 'Smooth', 'Standard'),
(38, '#FFECB3', 'Decor Candle Set', 'Decor candles', 'Wax', 'Smooth', 'Standard'),
(39, '#FFCC80', 'Warm Candle Decor', 'Warm candle accents', 'Wax', 'Smooth', 'Standard'),
(40, '#CE93D8', 'Luxury Candle Decor', 'Luxury candle set', 'Wax', 'Glossy', 'Premium'),
(41, '#AED581', 'Nature Decor Theme', 'Nature decor accents', 'Mixed', 'Organic', 'Standard'),
(42, '#4DB6AC', 'Tropical Decor Style', 'Tropical decor', 'Mixed', 'Textured', 'Modern'),
(43, '#81C784', 'Green Accent Decor', 'Green decor elements', 'Mixed', 'Smooth', 'Modern'),
(44, '#FFF59D', 'Soft Yellow Decor', 'Soft yellow accents', 'Mixed', 'Smooth', 'Modern'),
(45, '#A5D6A7', 'Minimal Nature Decor', 'Minimal plant decor', 'Mixed', 'Organic', 'Standard'),
(46, '#90A4AE', 'Cool Tone Decor', 'Cool tone accents', 'Mixed', 'Smooth', 'Modern'),
(47, '#D7CCC8', 'Beige Decor Theme', 'Beige decor elements', 'Mixed', 'Smooth', 'Standard'),
(48, '#FFE0B2', 'Warm Neutral Decor', 'Warm neutral accents', 'Mixed', 'Smooth', 'Standard'),
(49, '#B39DDB', 'Soft Purple Decor', 'Soft purple accents', 'Mixed', 'Smooth', 'Modern'),
(50, '#C5E1A5', 'Fresh Decor Theme', 'Fresh decor style', 'Mixed', 'Organic', 'Standard');
