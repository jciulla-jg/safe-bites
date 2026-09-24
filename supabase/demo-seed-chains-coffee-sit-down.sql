-- Chain allergen seed data: Dunkin', Olive Garden, Chili's.
-- What this is: demo menu items + allergen tags for three national chains, matched to
-- OSM map locations via brand:wikidata. Run after migration 0009_chains.sql.
--
-- Sources (each chain's own published allergen guide, researched 2026-09-24):
--   Dunkin'      -> https://assets.ctfassets.net/ubkcphxhphh0/2CUEGD9uKplsMy8kvgPs3A/918542b5a4c68b7eb96925b64bfae5a3/DD_W6_allergy_ingredient_guide.pdf
--                    (linked from dunkindonuts.com/nutrition/ "Get Allergen/Ingredients PDF")
--   Olive Garden -> https://media.olivegarden.com/en_us/pdf/allergen_guide.pdf
--   Chili's      -> https://cdn.builder.io/o/assets%2F4967176e01a141828a5fad701f6faa79%2Fcc54f14dac1d4dd5b8d758d56479c656 (the
--                    "Printable Allergen Guide" linked from chilis.com's own nutrition page)
--
-- Skipped: Starbucks (US starbucks.com allergen/nutrition pages are rendered client-side
-- per selected store and returned no allergen data to automated fetches; no official
-- US-wide allergen PDF could be found, only UK/Iceland guides, which don't apply to US
-- menus/recipes). Applebee's (applebees.com blocks automated fetches with a Cloudflare
-- bot challenge on every path tried, including the allergen PDF and interactive nutrition
-- page, so no official data could be retrieved).
--
-- Caveat: this data comes from each chain's own published allergen guide. Actual
-- ingredients and cross-contact risk vary by location and over time, and none of this
-- has been verified with restaurant staff. Always confirm with the restaurant directly.

-- Re-run safe: removing the chain row cascades to its items and tags.
-- Olive Garden's "gluten-sensitive" items are tagged gluten may_contain, not
-- safe: Olive Garden says they're prepared in a kitchen with gluten, so they
-- aren't gluten-free.

delete from chains where brand_wikidata in ('Q847743', 'Q3045312', 'Q1072948');

insert into chains (brand_wikidata, name, allergen_source, reviewed_at)
values
  ('Q847743', 'Dunkin''', 'https://assets.ctfassets.net/ubkcphxhphh0/2CUEGD9uKplsMy8kvgPs3A/918542b5a4c68b7eb96925b64bfae5a3/DD_W6_allergy_ingredient_guide.pdf', '2026-09-24'),
  ('Q3045312', 'Olive Garden', 'https://media.olivegarden.com/en_us/pdf/allergen_guide.pdf', '2026-09-24'),
  ('Q1072948', 'Chili''s', 'https://cdn.builder.io/o/assets%2F4967176e01a141828a5fad701f6faa79%2Fcc54f14dac1d4dd5b8d758d56479c656', '2026-09-24');

-- ============================================================
-- Dunkin' (Q847743)
-- ============================================================

insert into chain_menu_items (chain_id, name, description, price)
select id, 'Glazed Donut', 'Classic yeast-raised ring donut with a light sugar glaze.', null from chains where brand_wikidata = 'Q847743';
insert into chain_menu_item_allergen_tags (chain_menu_item_id, allergen_code, status)
select mi.id, v.code, v.status from chain_menu_items mi join chains c on c.id = mi.chain_id
cross join (values ('dairy','contains'),('egg','contains'),('soy','contains'),('gluten','contains'),
                    ('peanut','safe'),('tree_nut','safe'),('sesame','safe'),('fish','safe'),('shellfish','safe')) as v(code, status)
where c.brand_wikidata = 'Q847743' and mi.name = 'Glazed Donut';

insert into chain_menu_items (chain_id, name, description, price)
select id, 'Boston Kreme Donut', 'Yeast donut filled with vanilla creme, topped with chocolate icing.', null from chains where brand_wikidata = 'Q847743';
insert into chain_menu_item_allergen_tags (chain_menu_item_id, allergen_code, status)
select mi.id, v.code, v.status from chain_menu_items mi join chains c on c.id = mi.chain_id
cross join (values ('dairy','contains'),('egg','contains'),('soy','contains'),('gluten','contains'),
                    ('peanut','safe'),('tree_nut','safe'),('sesame','safe'),('fish','safe'),('shellfish','safe')) as v(code, status)
where c.brand_wikidata = 'Q847743' and mi.name = 'Boston Kreme Donut';

insert into chain_menu_items (chain_id, name, description, price)
select id, 'Chocolate Frosted Donut', 'Yeast donut topped with chocolate icing.', null from chains where brand_wikidata = 'Q847743';
insert into chain_menu_item_allergen_tags (chain_menu_item_id, allergen_code, status)
select mi.id, v.code, v.status from chain_menu_items mi join chains c on c.id = mi.chain_id
cross join (values ('dairy','contains'),('egg','contains'),('soy','contains'),('gluten','contains'),
                    ('peanut','safe'),('tree_nut','safe'),('sesame','safe'),('fish','safe'),('shellfish','safe')) as v(code, status)
where c.brand_wikidata = 'Q847743' and mi.name = 'Chocolate Frosted Donut';

insert into chain_menu_items (chain_id, name, description, price)
select id, 'Peanut Donut', 'Glazed cake donut topped with dry roasted peanuts.', null from chains where brand_wikidata = 'Q847743';
insert into chain_menu_item_allergen_tags (chain_menu_item_id, allergen_code, status)
select mi.id, v.code, v.status from chain_menu_items mi join chains c on c.id = mi.chain_id
cross join (values ('dairy','contains'),('egg','contains'),('peanut','contains'),('soy','contains'),('gluten','contains'),
                    ('tree_nut','safe'),('sesame','safe'),('fish','safe'),('shellfish','safe')) as v(code, status)
where c.brand_wikidata = 'Q847743' and mi.name = 'Peanut Donut';

insert into chain_menu_items (chain_id, name, description, price)
select id, 'Plain Bagel', 'Boiled and baked plain bagel.', null from chains where brand_wikidata = 'Q847743';
insert into chain_menu_item_allergen_tags (chain_menu_item_id, allergen_code, status)
select mi.id, v.code, v.status from chain_menu_items mi join chains c on c.id = mi.chain_id
cross join (values ('soy','contains'),('gluten','contains'),
                    ('dairy','may_contain'),('egg','may_contain'),('tree_nut','may_contain'),
                    ('peanut','safe'),('sesame','safe'),('fish','safe'),('shellfish','safe')) as v(code, status)
where c.brand_wikidata = 'Q847743' and mi.name = 'Plain Bagel';

insert into chain_menu_items (chain_id, name, description, price)
select id, 'Everything Bagel', 'Plain bagel topped with sesame seeds, poppy seeds, and dried onion and garlic.', null from chains where brand_wikidata = 'Q847743';
insert into chain_menu_item_allergen_tags (chain_menu_item_id, allergen_code, status)
select mi.id, v.code, v.status from chain_menu_items mi join chains c on c.id = mi.chain_id
cross join (values ('soy','contains'),('gluten','contains'),('sesame','contains'),
                    ('dairy','may_contain'),('egg','may_contain'),('tree_nut','may_contain'),
                    ('peanut','safe'),('fish','safe'),('shellfish','safe')) as v(code, status)
where c.brand_wikidata = 'Q847743' and mi.name = 'Everything Bagel';

insert into chain_menu_items (chain_id, name, description, price)
select id, 'Bacon, Egg and Cheese on a Plain Bagel', 'Egg patty, American cheese, and bacon on a plain bagel.', null from chains where brand_wikidata = 'Q847743';
insert into chain_menu_item_allergen_tags (chain_menu_item_id, allergen_code, status)
select mi.id, v.code, v.status from chain_menu_items mi join chains c on c.id = mi.chain_id
cross join (values ('egg','contains'),('dairy','contains'),('soy','contains'),('gluten','contains'),
                    ('tree_nut','may_contain'),
                    ('peanut','safe'),('sesame','safe'),('fish','safe'),('shellfish','safe')) as v(code, status)
where c.brand_wikidata = 'Q847743' and mi.name = 'Bacon, Egg and Cheese on a Plain Bagel';

insert into chain_menu_items (chain_id, name, description, price)
select id, 'Sausage, Egg and Cheese on a Plain Bagel', 'Pork sausage, egg patty, and American cheese on a plain bagel.', null from chains where brand_wikidata = 'Q847743';
insert into chain_menu_item_allergen_tags (chain_menu_item_id, allergen_code, status)
select mi.id, v.code, v.status from chain_menu_items mi join chains c on c.id = mi.chain_id
cross join (values ('egg','contains'),('dairy','contains'),('soy','contains'),('gluten','contains'),
                    ('tree_nut','may_contain'),
                    ('peanut','safe'),('sesame','safe'),('fish','safe'),('shellfish','safe')) as v(code, status)
where c.brand_wikidata = 'Q847743' and mi.name = 'Sausage, Egg and Cheese on a Plain Bagel';

insert into chain_menu_items (chain_id, name, description, price)
select id, 'Avocado Toast', 'Mashed avocado with lemon, salt and pepper on sourdough, topped with everything bagel seasoning.', null from chains where brand_wikidata = 'Q847743';
insert into chain_menu_item_allergen_tags (chain_menu_item_id, allergen_code, status)
select mi.id, v.code, v.status from chain_menu_items mi join chains c on c.id = mi.chain_id
cross join (values ('gluten','contains'),('sesame','contains'),
                    ('egg','may_contain'),('dairy','may_contain'),('soy','may_contain'),
                    ('peanut','safe'),('tree_nut','safe'),('fish','safe'),('shellfish','safe')) as v(code, status)
where c.brand_wikidata = 'Q847743' and mi.name = 'Avocado Toast';

insert into chain_menu_items (chain_id, name, description, price)
select id, 'Stuffed Bagel Minis - Everything', 'Mini bagels stuffed with cream cheese, topped with everything seasoning.', null from chains where brand_wikidata = 'Q847743';
insert into chain_menu_item_allergen_tags (chain_menu_item_id, allergen_code, status)
select mi.id, v.code, v.status from chain_menu_items mi join chains c on c.id = mi.chain_id
cross join (values ('dairy','contains'),('gluten','contains'),('sesame','contains'),
                    ('egg','may_contain'),('soy','may_contain'),('tree_nut','may_contain'),
                    ('peanut','safe'),('fish','safe'),('shellfish','safe')) as v(code, status)
where c.brand_wikidata = 'Q847743' and mi.name = 'Stuffed Bagel Minis - Everything';

insert into chain_menu_items (chain_id, name, description, price)
select id, 'Bacon & Cheddar Omelet Bites', 'Baked egg bites with cottage cheese, white cheddar, and bacon.', null from chains where brand_wikidata = 'Q847743';
insert into chain_menu_item_allergen_tags (chain_menu_item_id, allergen_code, status)
select mi.id, v.code, v.status from chain_menu_items mi join chains c on c.id = mi.chain_id
cross join (values ('egg','contains'),('dairy','contains'),
                    ('peanut','safe'),('tree_nut','safe'),('sesame','safe'),('fish','safe'),('shellfish','safe'),('soy','safe')) as v(code, status)
where c.brand_wikidata = 'Q847743' and mi.name = 'Bacon & Cheddar Omelet Bites';

insert into chain_menu_items (chain_id, name, description, price)
select id, 'Hash Browns', 'Shredded and fried potatoes.', null from chains where brand_wikidata = 'Q847743';
insert into chain_menu_item_allergen_tags (chain_menu_item_id, allergen_code, status)
select mi.id, v.code, v.status from chain_menu_items mi join chains c on c.id = mi.chain_id
cross join (values ('dairy','safe'),('egg','safe'),('peanut','safe'),('tree_nut','safe'),
                    ('sesame','safe'),('fish','safe'),('shellfish','safe'),('soy','safe')) as v(code, status)
where c.brand_wikidata = 'Q847743' and mi.name = 'Hash Browns';

insert into chain_menu_items (chain_id, name, description, price)
select id, 'Iced Coffee', 'Brewed Arabica coffee served over ice, unsweetened black.', null from chains where brand_wikidata = 'Q847743';
insert into chain_menu_item_allergen_tags (chain_menu_item_id, allergen_code, status)
select mi.id, v.code, v.status from chain_menu_items mi join chains c on c.id = mi.chain_id
cross join (values ('dairy','safe'),('egg','safe'),('peanut','safe'),('tree_nut','safe'),
                    ('sesame','safe'),('fish','safe'),('shellfish','safe'),('soy','safe')) as v(code, status)
where c.brand_wikidata = 'Q847743' and mi.name = 'Iced Coffee';

-- ============================================================
-- Olive Garden (Q3045312)
-- ============================================================

insert into chain_menu_items (chain_id, name, description, price)
select id, 'Calamari', 'Breaded, fried calamari served with marinara.', null from chains where brand_wikidata = 'Q3045312';
insert into chain_menu_item_allergen_tags (chain_menu_item_id, allergen_code, status)
select mi.id, v.code, v.status from chain_menu_items mi join chains c on c.id = mi.chain_id
cross join (values ('dairy','contains'),('egg','contains'),('shellfish','contains'),('gluten','contains'),('soy','contains'),
                    ('fish','safe'),('tree_nut','safe'),('peanut','safe'),('sesame','safe')) as v(code, status)
where c.brand_wikidata = 'Q3045312' and mi.name = 'Calamari';

insert into chain_menu_items (chain_id, name, description, price)
select id, 'Fried Mozzarella', 'Breaded, fried mozzarella cheese sticks served with marinara.', null from chains where brand_wikidata = 'Q3045312';
insert into chain_menu_item_allergen_tags (chain_menu_item_id, allergen_code, status)
select mi.id, v.code, v.status from chain_menu_items mi join chains c on c.id = mi.chain_id
cross join (values ('dairy','contains'),('gluten','contains'),('soy','contains'),
                    ('egg','safe'),('fish','safe'),('shellfish','safe'),('tree_nut','safe'),('peanut','safe'),('sesame','safe')) as v(code, status)
where c.brand_wikidata = 'Q3045312' and mi.name = 'Fried Mozzarella';

insert into chain_menu_items (chain_id, name, description, price)
select id, 'Shrimp Fritto Misto', 'Lightly floured, fried shrimp served with marinara.', null from chains where brand_wikidata = 'Q3045312';
insert into chain_menu_item_allergen_tags (chain_menu_item_id, allergen_code, status)
select mi.id, v.code, v.status from chain_menu_items mi join chains c on c.id = mi.chain_id
cross join (values ('dairy','contains'),('egg','contains'),('shellfish','contains'),('gluten','contains'),('soy','contains'),
                    ('fish','safe'),('tree_nut','safe'),('peanut','safe'),('sesame','safe')) as v(code, status)
where c.brand_wikidata = 'Q3045312' and mi.name = 'Shrimp Fritto Misto';

insert into chain_menu_items (chain_id, name, description, price)
select id, 'Spinach-Artichoke Dip with flatbread crisps', 'Creamy spinach and artichoke dip served with flatbread crisps.', null from chains where brand_wikidata = 'Q3045312';
insert into chain_menu_item_allergen_tags (chain_menu_item_id, allergen_code, status)
select mi.id, v.code, v.status from chain_menu_items mi join chains c on c.id = mi.chain_id
cross join (values ('dairy','contains'),('gluten','contains'),
                    ('egg','safe'),('fish','safe'),('shellfish','safe'),('tree_nut','safe'),('peanut','safe'),('soy','safe'),('sesame','safe')) as v(code, status)
where c.brand_wikidata = 'Q3045312' and mi.name = 'Spinach-Artichoke Dip with flatbread crisps';

insert into chain_menu_items (chain_id, name, description, price)
select id, 'Breadstick with garlic topping', 'Freshly baked breadstick brushed with garlic topping.', null from chains where brand_wikidata = 'Q3045312';
insert into chain_menu_item_allergen_tags (chain_menu_item_id, allergen_code, status)
select mi.id, v.code, v.status from chain_menu_items mi join chains c on c.id = mi.chain_id
cross join (values ('gluten','contains'),
                    ('dairy','safe'),('egg','safe'),('fish','safe'),('shellfish','safe'),('tree_nut','safe'),('peanut','safe'),('soy','safe'),('sesame','safe')) as v(code, status)
where c.brand_wikidata = 'Q3045312' and mi.name = 'Breadstick with garlic topping';

insert into chain_menu_items (chain_id, name, description, price)
select id, 'Fettuccine Alfredo', 'Fettuccine pasta tossed in Alfredo sauce.', null from chains where brand_wikidata = 'Q3045312';
insert into chain_menu_item_allergen_tags (chain_menu_item_id, allergen_code, status)
select mi.id, v.code, v.status from chain_menu_items mi join chains c on c.id = mi.chain_id
cross join (values ('dairy','contains'),('gluten','contains'),
                    ('egg','safe'),('fish','safe'),('shellfish','safe'),('tree_nut','safe'),('peanut','safe'),('soy','safe'),('sesame','safe')) as v(code, status)
where c.brand_wikidata = 'Q3045312' and mi.name = 'Fettuccine Alfredo';

insert into chain_menu_items (chain_id, name, description, price)
select id, 'Chicken Parmigiana', 'Breaded chicken breast topped with marinara and melted cheese, served with spaghetti.', null from chains where brand_wikidata = 'Q3045312';
insert into chain_menu_item_allergen_tags (chain_menu_item_id, allergen_code, status)
select mi.id, v.code, v.status from chain_menu_items mi join chains c on c.id = mi.chain_id
cross join (values ('dairy','contains'),('gluten','contains'),
                    ('egg','safe'),('fish','safe'),('shellfish','safe'),('tree_nut','safe'),('peanut','safe'),('soy','safe'),('sesame','safe')) as v(code, status)
where c.brand_wikidata = 'Q3045312' and mi.name = 'Chicken Parmigiana';

insert into chain_menu_items (chain_id, name, description, price)
select id, 'Herb-Grilled Salmon', 'Grilled salmon fillet with herbs, listed on Olive Garden''s gluten-sensitive menu.', null from chains where brand_wikidata = 'Q3045312';
insert into chain_menu_item_allergen_tags (chain_menu_item_id, allergen_code, status)
select mi.id, v.code, v.status from chain_menu_items mi join chains c on c.id = mi.chain_id
cross join (values ('dairy','contains'),('fish','contains'),('gluten','may_contain'),
                    ('egg','safe'),('shellfish','safe'),('tree_nut','safe'),('peanut','safe'),('soy','safe'),('sesame','safe')) as v(code, status)
where c.brand_wikidata = 'Q3045312' and mi.name = 'Herb-Grilled Salmon';

insert into chain_menu_items (chain_id, name, description, price)
select id, 'Zuppa Toscana Soup', 'Italian sausage, potato, and kale soup in a creamy broth, listed on Olive Garden''s gluten-sensitive menu.', null from chains where brand_wikidata = 'Q3045312';
insert into chain_menu_item_allergen_tags (chain_menu_item_id, allergen_code, status)
select mi.id, v.code, v.status from chain_menu_items mi join chains c on c.id = mi.chain_id
cross join (values ('dairy','contains'),('gluten','may_contain'),
                    ('egg','safe'),('fish','safe'),('shellfish','safe'),('tree_nut','safe'),('peanut','safe'),('soy','safe'),('sesame','safe')) as v(code, status)
where c.brand_wikidata = 'Q3045312' and mi.name = 'Zuppa Toscana Soup';

insert into chain_menu_items (chain_id, name, description, price)
select id, 'Famous House Salad without Croutons', 'Signature mixed greens salad with Italian dressing, no croutons.', null from chains where brand_wikidata = 'Q3045312';
insert into chain_menu_item_allergen_tags (chain_menu_item_id, allergen_code, status)
select mi.id, v.code, v.status from chain_menu_items mi join chains c on c.id = mi.chain_id
cross join (values ('dairy','contains'),('egg','contains'),('gluten','may_contain'),
                    ('fish','safe'),('shellfish','safe'),('tree_nut','safe'),('peanut','safe'),('soy','safe'),('sesame','safe')) as v(code, status)
where c.brand_wikidata = 'Q3045312' and mi.name = 'Famous House Salad without Croutons';

insert into chain_menu_items (chain_id, name, description, price)
select id, 'Tiramisu', 'Classic Italian layered dessert with espresso-soaked ladyfingers and mascarpone.', null from chains where brand_wikidata = 'Q3045312';
insert into chain_menu_item_allergen_tags (chain_menu_item_id, allergen_code, status)
select mi.id, v.code, v.status from chain_menu_items mi join chains c on c.id = mi.chain_id
cross join (values ('dairy','contains'),('egg','contains'),('gluten','contains'),('soy','contains'),
                    ('fish','safe'),('shellfish','safe'),('tree_nut','safe'),('peanut','safe'),('sesame','safe')) as v(code, status)
where c.brand_wikidata = 'Q3045312' and mi.name = 'Tiramisu';

insert into chain_menu_items (chain_id, name, description, price)
select id, 'Chicken Alfredo', 'Grilled chicken over fettuccine tossed in Alfredo sauce.', null from chains where brand_wikidata = 'Q3045312';
insert into chain_menu_item_allergen_tags (chain_menu_item_id, allergen_code, status)
select mi.id, v.code, v.status from chain_menu_items mi join chains c on c.id = mi.chain_id
cross join (values ('dairy','contains'),('gluten','contains'),
                    ('egg','safe'),('fish','safe'),('shellfish','safe'),('tree_nut','safe'),('peanut','safe'),('soy','safe'),('sesame','safe')) as v(code, status)
where c.brand_wikidata = 'Q3045312' and mi.name = 'Chicken Alfredo';

insert into chain_menu_items (chain_id, name, description, price)
select id, 'Mint candy', 'After-dinner mint.', null from chains where brand_wikidata = 'Q3045312';
insert into chain_menu_item_allergen_tags (chain_menu_item_id, allergen_code, status)
select mi.id, v.code, v.status from chain_menu_items mi join chains c on c.id = mi.chain_id
cross join (values ('dairy','contains'),('soy','contains'),
                    ('egg','safe'),('fish','safe'),('shellfish','safe'),('tree_nut','safe'),('peanut','safe'),('sesame','safe')) as v(code, status)
where c.brand_wikidata = 'Q3045312' and mi.name = 'Mint candy';

-- ============================================================
-- Chili's (Q1072948)
-- ============================================================

insert into chain_menu_items (chain_id, name, description, price)
select id, '8 Count Boneless Wings - Buffalo', 'Breaded boneless wings tossed in buffalo sauce.', null from chains where brand_wikidata = 'Q1072948';
insert into chain_menu_item_allergen_tags (chain_menu_item_id, allergen_code, status)
select mi.id, v.code, v.status from chain_menu_items mi join chains c on c.id = mi.chain_id
cross join (values ('egg','contains'),('fish','contains'),('gluten','contains'),('dairy','contains'),
                    ('peanut','safe'),('sesame','safe'),('shellfish','safe'),('soy','safe'),('tree_nut','safe')) as v(code, status)
where c.brand_wikidata = 'Q1072948' and mi.name = '8 Count Boneless Wings - Buffalo';

insert into chain_menu_items (chain_id, name, description, price)
select id, '8 Count Wings - Buffalo', 'Bone-in chicken wings tossed in buffalo sauce.', null from chains where brand_wikidata = 'Q1072948';
insert into chain_menu_item_allergen_tags (chain_menu_item_id, allergen_code, status)
select mi.id, v.code, v.status from chain_menu_items mi join chains c on c.id = mi.chain_id
cross join (values ('egg','contains'),('fish','contains'),('dairy','contains'),
                    ('gluten','safe'),('peanut','safe'),('sesame','safe'),('shellfish','safe'),('soy','safe'),('tree_nut','safe')) as v(code, status)
where c.brand_wikidata = 'Q1072948' and mi.name = '8 Count Wings - Buffalo';

insert into chain_menu_items (chain_id, name, description, price)
select id, 'Fresh Guacamole & Chips', 'House-made guacamole served with tortilla chips.', null from chains where brand_wikidata = 'Q1072948';
insert into chain_menu_item_allergen_tags (chain_menu_item_id, allergen_code, status)
select mi.id, v.code, v.status from chain_menu_items mi join chains c on c.id = mi.chain_id
cross join (values ('egg','safe'),('fish','safe'),('gluten','safe'),('dairy','safe'),
                    ('peanut','safe'),('sesame','safe'),('shellfish','safe'),('soy','safe'),('tree_nut','safe')) as v(code, status)
where c.brand_wikidata = 'Q1072948' and mi.name = 'Fresh Guacamole & Chips';

insert into chain_menu_items (chain_id, name, description, price)
select id, 'Fried Mozzarella, 6 Count', 'Breaded, fried mozzarella sticks served with marinara.', null from chains where brand_wikidata = 'Q1072948';
insert into chain_menu_item_allergen_tags (chain_menu_item_id, allergen_code, status)
select mi.id, v.code, v.status from chain_menu_items mi join chains c on c.id = mi.chain_id
cross join (values ('egg','contains'),('gluten','contains'),('dairy','contains'),
                    ('fish','safe'),('peanut','safe'),('sesame','safe'),('shellfish','safe'),('soy','safe'),('tree_nut','safe')) as v(code, status)
where c.brand_wikidata = 'Q1072948' and mi.name = 'Fried Mozzarella, 6 Count';

insert into chain_menu_items (chain_id, name, description, price)
select id, 'Fajita Shrimp', 'Seasoned, grilled shrimp fajita meat.', null from chains where brand_wikidata = 'Q1072948';
insert into chain_menu_item_allergen_tags (chain_menu_item_id, allergen_code, status)
select mi.id, v.code, v.status from chain_menu_items mi join chains c on c.id = mi.chain_id
cross join (values ('dairy','contains'),('shellfish','contains'),('soy','contains'),
                    ('egg','safe'),('fish','safe'),('gluten','safe'),('peanut','safe'),('sesame','safe'),('tree_nut','safe')) as v(code, status)
where c.brand_wikidata = 'Q1072948' and mi.name = 'Fajita Shrimp';

insert into chain_menu_items (chain_id, name, description, price)
select id, 'Bacon Cheeseburger', 'Beef burger with bacon and cheese on a bun.', null from chains where brand_wikidata = 'Q1072948';
insert into chain_menu_item_allergen_tags (chain_menu_item_id, allergen_code, status)
select mi.id, v.code, v.status from chain_menu_items mi join chains c on c.id = mi.chain_id
cross join (values ('egg','contains'),('gluten','contains'),('dairy','contains'),('soy','contains'),
                    ('fish','safe'),('peanut','safe'),('sesame','safe'),('shellfish','safe'),('tree_nut','safe')) as v(code, status)
where c.brand_wikidata = 'Q1072948' and mi.name = 'Bacon Cheeseburger';

insert into chain_menu_items (chain_id, name, description, price)
select id, 'Classic Sirloin, 6 oz', 'Grilled 6 oz sirloin steak.', null from chains where brand_wikidata = 'Q1072948';
insert into chain_menu_item_allergen_tags (chain_menu_item_id, allergen_code, status)
select mi.id, v.code, v.status from chain_menu_items mi join chains c on c.id = mi.chain_id
cross join (values ('dairy','contains'),('soy','contains'),
                    ('egg','safe'),('fish','safe'),('gluten','safe'),('peanut','safe'),('sesame','safe'),('shellfish','safe'),('tree_nut','safe')) as v(code, status)
where c.brand_wikidata = 'Q1072948' and mi.name = 'Classic Sirloin, 6 oz';

insert into chain_menu_items (chain_id, name, description, price)
select id, 'Ancho Salmon', 'Grilled salmon with ancho chile glaze, from the Guiltless Grill menu.', null from chains where brand_wikidata = 'Q1072948';
insert into chain_menu_item_allergen_tags (chain_menu_item_id, allergen_code, status)
select mi.id, v.code, v.status from chain_menu_items mi join chains c on c.id = mi.chain_id
cross join (values ('fish','contains'),('dairy','contains'),
                    ('egg','safe'),('gluten','safe'),('peanut','safe'),('sesame','safe'),('shellfish','safe'),('soy','safe'),('tree_nut','safe')) as v(code, status)
where c.brand_wikidata = 'Q1072948' and mi.name = 'Ancho Salmon';

insert into chain_menu_items (chain_id, name, description, price)
select id, 'Molten Chocolate Cake', 'Warm chocolate cake with a molten chocolate center.', null from chains where brand_wikidata = 'Q1072948';
insert into chain_menu_item_allergen_tags (chain_menu_item_id, allergen_code, status)
select mi.id, v.code, v.status from chain_menu_items mi join chains c on c.id = mi.chain_id
cross join (values ('egg','contains'),('gluten','contains'),('dairy','contains'),('soy','contains'),
                    ('fish','safe'),('peanut','safe'),('sesame','safe'),('shellfish','safe'),('tree_nut','safe')) as v(code, status)
where c.brand_wikidata = 'Q1072948' and mi.name = 'Molten Chocolate Cake';

insert into chain_menu_items (chain_id, name, description, price)
select id, 'Peanut Butter Pie', 'Peanut butter pie with a chocolate cookie crust.', null from chains where brand_wikidata = 'Q1072948';
insert into chain_menu_item_allergen_tags (chain_menu_item_id, allergen_code, status)
select mi.id, v.code, v.status from chain_menu_items mi join chains c on c.id = mi.chain_id
cross join (values ('peanut','contains'),('gluten','contains'),('dairy','contains'),('soy','contains'),
                    ('egg','safe'),('fish','safe'),('sesame','safe'),('shellfish','safe'),('tree_nut','safe')) as v(code, status)
where c.brand_wikidata = 'Q1072948' and mi.name = 'Peanut Butter Pie';

insert into chain_menu_items (chain_id, name, description, price)
select id, 'Homestyle Fries', 'Seasoned french fries.', null from chains where brand_wikidata = 'Q1072948';
insert into chain_menu_item_allergen_tags (chain_menu_item_id, allergen_code, status)
select mi.id, v.code, v.status from chain_menu_items mi join chains c on c.id = mi.chain_id
cross join (values ('egg','safe'),('fish','safe'),('gluten','safe'),('dairy','safe'),
                    ('peanut','safe'),('sesame','safe'),('shellfish','safe'),('soy','safe'),('tree_nut','safe')) as v(code, status)
where c.brand_wikidata = 'Q1072948' and mi.name = 'Homestyle Fries';

insert into chain_menu_items (chain_id, name, description, price)
select id, 'Mashed Potatoes', 'Creamy mashed potatoes.', null from chains where brand_wikidata = 'Q1072948';
insert into chain_menu_item_allergen_tags (chain_menu_item_id, allergen_code, status)
select mi.id, v.code, v.status from chain_menu_items mi join chains c on c.id = mi.chain_id
cross join (values ('dairy','contains'),('soy','contains'),
                    ('egg','safe'),('fish','safe'),('gluten','safe'),('peanut','safe'),('sesame','safe'),('shellfish','safe'),('tree_nut','safe')) as v(code, status)
where c.brand_wikidata = 'Q1072948' and mi.name = 'Mashed Potatoes';

insert into chain_menu_items (chain_id, name, description, price)
select id, 'Bottomless Chips & Salsa', 'Tortilla chips served with fresh salsa.', null from chains where brand_wikidata = 'Q1072948';
insert into chain_menu_item_allergen_tags (chain_menu_item_id, allergen_code, status)
select mi.id, v.code, v.status from chain_menu_items mi join chains c on c.id = mi.chain_id
cross join (values ('egg','safe'),('fish','safe'),('gluten','safe'),('dairy','safe'),
                    ('peanut','safe'),('sesame','safe'),('shellfish','safe'),('soy','safe'),('tree_nut','safe')) as v(code, status)
where c.brand_wikidata = 'Q1072948' and mi.name = 'Bottomless Chips & Salsa';

insert into chain_menu_items (chain_id, name, description, price)
select id, 'Southwestern Eggrolls', 'Fried eggrolls filled with chicken, black beans, corn, and spices.', null from chains where brand_wikidata = 'Q1072948';
insert into chain_menu_item_allergen_tags (chain_menu_item_id, allergen_code, status)
select mi.id, v.code, v.status from chain_menu_items mi join chains c on c.id = mi.chain_id
cross join (values ('egg','contains'),('gluten','contains'),('dairy','contains'),('soy','contains'),
                    ('fish','safe'),('peanut','safe'),('sesame','safe'),('shellfish','safe'),('tree_nut','safe')) as v(code, status)
where c.brand_wikidata = 'Q1072948' and mi.name = 'Southwestern Eggrolls';
