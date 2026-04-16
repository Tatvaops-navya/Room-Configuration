-- Cabinet catalog now lives in cabinet_products (030 + 031). Remove legacy rows from table_products.

DELETE FROM table_products WHERE ui_target = 'cabinet';
