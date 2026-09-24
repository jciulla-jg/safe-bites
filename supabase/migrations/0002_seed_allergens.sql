-- Safe Bites: seed the canonical allergen/restriction list.
-- Safe to re-run: conflicting codes are left as-is rather than duplicated.

insert into allergens (code, label, sort_order) values
  ('peanut',      'Peanut',           1),
  ('tree_nut',    'Tree Nut',         2),
  ('dairy',       'Dairy',            3),
  ('egg',         'Egg',              4),
  ('gluten',      'Gluten',           5),
  ('soy',         'Soy',              6),
  ('shellfish',   'Shellfish',        7),
  ('fish',        'Fish',             8),
  ('sesame',      'Sesame',           9),
  ('vegan',       'Vegan',           10),
  ('vegetarian',  'Vegetarian',      11)
on conflict (code) do nothing;
