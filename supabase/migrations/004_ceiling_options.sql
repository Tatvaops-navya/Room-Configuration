-- New table: ceiling_options (do not drop any existing tables)
-- Columns: id, color_hex, style_name, material, texture, finish, category

CREATE TABLE IF NOT EXISTS ceiling_options (
  id integer PRIMARY KEY,
  color_hex text NOT NULL,
  style_name text NOT NULL,
  material text NOT NULL,
  texture text NOT NULL,
  finish text NOT NULL,
  category text NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_ceiling_options_category ON ceiling_options(category);
CREATE INDEX IF NOT EXISTS idx_ceiling_options_material ON ceiling_options(material);

ALTER TABLE ceiling_options ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read" ON ceiling_options FOR SELECT USING (true);

INSERT INTO ceiling_options (id, color_hex, style_name, material, texture, finish, category) VALUES
(1, '#FFFFFF', 'Pure White Paint Smooth Matte', 'Paint', 'Smooth', 'Matte', 'Standard'),
(2, '#F2F2F2', 'Soft White Paint Smooth Matte', 'Paint', 'Smooth', 'Matte', 'Standard'),
(3, '#FFF5E6', 'Warm White Paint Smooth Matte', 'Paint', 'Smooth', 'Matte', 'Standard'),
(4, '#F5F5DC', 'Cream Paint Smooth Matte', 'Paint', 'Smooth', 'Matte', 'Standard'),
(5, '#E8E8E8', 'Light Grey Paint Smooth Matte', 'Paint', 'Smooth', 'Matte', 'Modern'),
(6, '#DCDCDC', 'Grey Paint Smooth Matte', 'Paint', 'Smooth', 'Matte', 'Modern'),
(7, '#CFCFCF', 'Concrete Ceiling Smooth', 'Concrete', 'Smooth', 'Matte', 'Modern'),
(8, '#BEBEBE', 'Concrete Ceiling Raw', 'Concrete', 'Rough', 'Matte', 'Modern'),
(9, '#FFFFFF', 'Glossy White Stretch Ceiling', 'PVC', 'Smooth', 'Glossy', 'Premium'),
(10, '#F8F8FF', 'Matte White Stretch Ceiling', 'PVC', 'Smooth', 'Matte', 'Premium'),
(11, '#E6E6FA', 'Pastel Lavender Paint', 'Paint', 'Smooth', 'Matte', 'Modern'),
(12, '#E0FFFF', 'Soft Blue Paint', 'Paint', 'Smooth', 'Matte', 'Modern'),
(13, '#FFFACD', 'Light Cream Paint', 'Paint', 'Smooth', 'Matte', 'Standard'),
(14, '#F0FFF0', 'Mint Paint', 'Paint', 'Smooth', 'Matte', 'Modern'),
(15, '#FAFAD2', 'Warm Cream Paint', 'Paint', 'Smooth', 'Matte', 'Standard'),
(16, '#EDEDED', 'Acoustic Panel White', 'Panel', 'Textured', 'Matte', 'Premium'),
(17, '#DADADA', 'Acoustic Panel Grey', 'Panel', 'Textured', 'Matte', 'Premium'),
(18, '#C0C0C0', 'Metal Ceiling Panel', 'Metal', 'Smooth', 'Matte', 'Modern'),
(19, '#A9A9A9', 'Industrial Metal Ceiling', 'Metal', 'Brushed', 'Matte', 'Modern'),
(20, '#FFF8DC', 'Coffered Ceiling Cream', 'Wood', 'Grain', 'Matte', 'Premium'),
(21, '#F5DEB3', 'Coffered Ceiling Oak', 'Wood', 'Grain', 'Matte', 'Premium'),
(22, '#EEDFCC', 'Wood Panel Ceiling Beige', 'Wood', 'Grain', 'Matte', 'Premium'),
(23, '#D2B48C', 'Wood Panel Ceiling Teak', 'Wood', 'Grain', 'Matte', 'Premium'),
(24, '#CD853F', 'Wood Slat Ceiling', 'Wood', 'Grain', 'Matte', 'Premium'),
(25, '#FAF0E6', 'Minimal Ceiling Off White', 'Paint', 'Smooth', 'Matte', 'Standard'),
(26, '#EAEAEA', 'Minimal Ceiling Grey', 'Paint', 'Smooth', 'Matte', 'Modern'),
(27, '#F5F5F5', 'POP Ceiling Smooth', 'Plaster', 'Smooth', 'Matte', 'Standard'),
(28, '#EFEFEF', 'POP Ceiling Texture', 'Plaster', 'Textured', 'Matte', 'Standard'),
(29, '#FFFFFF', 'Recessed Ceiling White', 'Plaster', 'Smooth', 'Matte', 'Standard'),
(30, '#F7F7F7', 'Recessed Ceiling Soft White', 'Plaster', 'Smooth', 'Matte', 'Standard'),
(31, '#FDF5E6', 'Classic Ceiling Ivory', 'Paint', 'Smooth', 'Matte', 'Standard'),
(32, '#EEE8AA', 'Classic Ceiling Beige', 'Paint', 'Smooth', 'Matte', 'Standard'),
(33, '#FFF0F5', 'Soft Pink Ceiling', 'Paint', 'Smooth', 'Matte', 'Modern'),
(34, '#F0F8FF', 'Light Blue Ceiling', 'Paint', 'Smooth', 'Matte', 'Modern'),
(35, '#FFF5EE', 'Peach Ceiling', 'Paint', 'Smooth', 'Matte', 'Modern'),
(36, '#FFEFD5', 'Soft Peach Ceiling', 'Paint', 'Smooth', 'Matte', 'Modern'),
(37, '#FFFACD', 'Warm Yellow Ceiling', 'Paint', 'Smooth', 'Matte', 'Modern'),
(38, '#FFFFF0', 'Ivory Smooth Ceiling', 'Paint', 'Smooth', 'Matte', 'Standard'),
(39, '#F0FFF0', 'Soft Green Ceiling', 'Paint', 'Smooth', 'Matte', 'Modern'),
(40, '#E6FFE6', 'Pastel Green Ceiling', 'Paint', 'Smooth', 'Matte', 'Modern'),
(41, '#D3D3D3', 'Industrial Grey Ceiling', 'Concrete', 'Smooth', 'Matte', 'Modern'),
(42, '#B0B0B0', 'Industrial Dark Ceiling', 'Concrete', 'Smooth', 'Matte', 'Modern'),
(43, '#EAE0C8', 'Beige Panel Ceiling', 'Panel', 'Smooth', 'Matte', 'Premium'),
(44, '#DDD6C8', 'Stone Finish Ceiling', 'Stone', 'Textured', 'Matte', 'Premium'),
(45, '#F4F4F4', 'Ultra White Ceiling', 'Paint', 'Smooth', 'Matte', 'Standard'),
(46, '#ECECEC', 'Neutral Grey Ceiling', 'Paint', 'Smooth', 'Matte', 'Modern'),
(47, '#F8F8FF', 'Gloss White Ceiling', 'Paint', 'Smooth', 'Glossy', 'Premium'),
(48, '#E0E0E0', 'Soft Concrete Ceiling', 'Concrete', 'Smooth', 'Matte', 'Modern'),
(49, '#FFF8DC', 'Luxury Cream Ceiling', 'Paint', 'Smooth', 'Matte', 'Premium'),
(50, '#FAFAFA', 'Minimal White Ceiling', 'Paint', 'Smooth', 'Matte', 'Standard');
