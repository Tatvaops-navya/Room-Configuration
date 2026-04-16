-- Allow cabinet / storage catalog rows in table_products (see 029_cabinet_storage_products_seed.sql).

ALTER TABLE table_products DROP CONSTRAINT IF EXISTS table_products_ui_target_check;

ALTER TABLE table_products
  ADD CONSTRAINT table_products_ui_target_check CHECK (ui_target IN ('table', 'desk', 'cabinet'));
