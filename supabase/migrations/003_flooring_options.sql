-- New table: flooring_options (do not drop any existing tables)
-- Columns: id, color_hex, style_name, material, texture, finish, category

CREATE TABLE IF NOT EXISTS flooring_options (
  id integer PRIMARY KEY,
  color_hex text NOT NULL,
  style_name text NOT NULL,
  material text NOT NULL,
  texture text NOT NULL,
  finish text NOT NULL,
  category text NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_flooring_options_category ON flooring_options(category);
CREATE INDEX IF NOT EXISTS idx_flooring_options_material ON flooring_options(material);

ALTER TABLE flooring_options ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read" ON flooring_options FOR SELECT USING (true);

INSERT INTO flooring_options (id, color_hex, style_name, material, texture, finish, category) VALUES
(1, '#E3D9C6', 'Warm Beige Tile Smooth Matte', 'Tile', 'Smooth', 'Matte', 'Standard'),
(2, '#E3D9C6', 'Warm Beige Tile Smooth Glossy', 'Tile', 'Smooth', 'Glossy', 'Standard'),
(3, '#F5F5F5', 'Soft White Marble Polished', 'Marble', 'Smooth', 'Polished', 'Premium'),
(4, '#F5F5F5', 'Soft White Marble Honed', 'Marble', 'Smooth', 'Honed', 'Premium'),
(5, '#D8D1C5', 'Sandstone Texture Matte', 'Stone', 'Textured', 'Matte', 'Standard'),
(6, '#BEBEBE', 'Concrete Finish Smooth', 'Concrete', 'Smooth', 'Matte', 'Modern'),
(7, '#BEBEBE', 'Concrete Finish Polished', 'Concrete', 'Smooth', 'Polished', 'Modern'),
(8, '#7A5230', 'Walnut Wood Plank Matte', 'Wood', 'Grain', 'Matte', 'Premium'),
(9, '#7A5230', 'Walnut Wood Plank Satin', 'Wood', 'Grain', 'Satin', 'Premium'),
(10, '#C79A6B', 'Oak Wood Natural Matte', 'Wood', 'Grain', 'Matte', 'Standard'),
(11, '#C79A6B', 'Oak Wood Natural Satin', 'Wood', 'Grain', 'Satin', 'Standard'),
(12, '#FFFFFF', 'Glossy Porcelain White', 'Porcelain', 'Smooth', 'Glossy', 'Modern'),
(13, '#FFFFFF', 'Matte Porcelain White', 'Porcelain', 'Smooth', 'Matte', 'Modern'),
(14, '#9A9A9A', 'Grey Slate Texture', 'Stone', 'Rough', 'Matte', 'Standard'),
(15, '#4B4B4B', 'Dark Granite Polished', 'Granite', 'Smooth', 'Polished', 'Premium'),
(16, '#E6D8B5', 'Ivory Tile Matte', 'Tile', 'Smooth', 'Matte', 'Standard'),
(17, '#E6D8B5', 'Ivory Tile Glossy', 'Tile', 'Smooth', 'Glossy', 'Standard'),
(18, '#AFAFAF', 'Urban Concrete Raw', 'Concrete', 'Rough', 'Matte', 'Modern'),
(19, '#AFAFAF', 'Urban Concrete Smooth', 'Concrete', 'Smooth', 'Matte', 'Modern'),
(20, '#D2C2A8', 'Travertine Stone Matte', 'Stone', 'Textured', 'Matte', 'Premium'),
(21, '#D2C2A8', 'Travertine Stone Polished', 'Stone', 'Smooth', 'Polished', 'Premium'),
(22, '#B38B5E', 'Classic Teak Wood Matte', 'Wood', 'Grain', 'Matte', 'Premium'),
(23, '#B38B5E', 'Classic Teak Wood Satin', 'Wood', 'Grain', 'Satin', 'Premium'),
(24, '#ECECEC', 'Light Grey Tile Matte', 'Tile', 'Smooth', 'Matte', 'Standard'),
(25, '#ECECEC', 'Light Grey Tile Glossy', 'Tile', 'Smooth', 'Glossy', 'Standard'),
(26, '#F0EFEA', 'Off White Marble Matte', 'Marble', 'Smooth', 'Matte', 'Premium'),
(27, '#F0EFEA', 'Off White Marble Polished', 'Marble', 'Smooth', 'Polished', 'Premium'),
(28, '#6F6F6F', 'Charcoal Tile Matte', 'Tile', 'Smooth', 'Matte', 'Modern'),
(29, '#6F6F6F', 'Charcoal Tile Glossy', 'Tile', 'Smooth', 'Glossy', 'Modern'),
(30, '#B7A28A', 'Natural Stone Rough', 'Stone', 'Rough', 'Matte', 'Standard'),
(31, '#B7A28A', 'Natural Stone Smooth', 'Stone', 'Smooth', 'Matte', 'Standard'),
(32, '#DADADA', 'Minimal Concrete Light', 'Concrete', 'Smooth', 'Matte', 'Modern'),
(33, '#DADADA', 'Minimal Concrete Polished', 'Concrete', 'Smooth', 'Polished', 'Modern'),
(34, '#9B6F4A', 'Rustic Wood Matte', 'Wood', 'Grain', 'Matte', 'Premium'),
(35, '#9B6F4A', 'Rustic Wood Satin', 'Wood', 'Grain', 'Satin', 'Premium'),
(36, '#F7F7F7', 'Pure White Tile Glossy', 'Tile', 'Smooth', 'Glossy', 'Modern'),
(37, '#F7F7F7', 'Pure White Tile Matte', 'Tile', 'Smooth', 'Matte', 'Modern'),
(38, '#C4C4C4', 'Stone Grey Polished', 'Stone', 'Smooth', 'Polished', 'Premium'),
(39, '#C4C4C4', 'Stone Grey Matte', 'Stone', 'Smooth', 'Matte', 'Premium'),
(40, '#8E8E8E', 'Industrial Cement', 'Concrete', 'Rough', 'Matte', 'Modern'),
(41, '#8E8E8E', 'Industrial Cement Polished', 'Concrete', 'Smooth', 'Polished', 'Modern'),
(42, '#E1D4C4', 'Cream Marble Polished', 'Marble', 'Smooth', 'Polished', 'Premium'),
(43, '#E1D4C4', 'Cream Marble Matte', 'Marble', 'Smooth', 'Matte', 'Premium'),
(44, '#5C3A21', 'Dark Walnut Wood Matte', 'Wood', 'Grain', 'Matte', 'Premium'),
(45, '#5C3A21', 'Dark Walnut Wood Satin', 'Wood', 'Grain', 'Satin', 'Premium'),
(46, '#DCD0B0', 'Beige Stone Polished', 'Stone', 'Smooth', 'Polished', 'Standard'),
(47, '#DCD0B0', 'Beige Stone Matte', 'Stone', 'Smooth', 'Matte', 'Standard'),
(48, '#9E9E9E', 'Modern Grey Concrete', 'Concrete', 'Smooth', 'Matte', 'Modern'),
(49, '#9E9E9E', 'Modern Grey Concrete Polished', 'Concrete', 'Smooth', 'Polished', 'Modern'),
(50, '#EFE6D8', 'Soft Cream Tile', 'Tile', 'Smooth', 'Matte', 'Standard');
