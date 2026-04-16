-- table_products is only for tables and desks; cabinets use cabinet_products.

ALTER TABLE table_products DROP CONSTRAINT IF EXISTS table_products_ui_target_check;

ALTER TABLE table_products
  ADD CONSTRAINT table_products_ui_target_check CHECK (ui_target IN ('table', 'desk'));
