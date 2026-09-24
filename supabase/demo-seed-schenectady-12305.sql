-- Safe Bites demo seed data: 6 real restaurants near zip 12305 (Schenectady, NY),
-- discovered live via the same OpenStreetMap Overpass query the app itself uses.
--
-- Menu items and allergen tags below are researched from each restaurant's
-- actual published menu (website, or an aggregator mirroring it) as of
-- 2026-09-22, with conservative best-effort allergen calls -- NOT verified
-- directly with kitchen staff. This is demo/hackathon seed data illustrating
-- the app's intended data model (ADR-0002's hybrid manual-seeding approach),
-- not a production food-safety guarantee. See each restaurant's block below
-- for its source URL(s).
--
-- Restaurants intentionally NOT seeded here (Celadon Thai Bistro -- appears
-- closed as of Aug 2026 per Yelp; Tacos & Margaritas Cantina -- no
-- itemized published menu found online) will correctly show "no data yet"
-- in the app, which is accurate rather than fabricated.
--
-- Run this AFTER 0001_initial_schema.sql and 0002_seed_allergens.sql.
-- Safe to re-run: restaurants are upserted by osm_id, and the preamble below
-- clears this file's menu_items (tags cascade) before re-inserting them, so a
-- second run replaces rather than duplicates. Ratings are never touched.

delete from menu_items
where restaurant_id in (
  select id from restaurants
  where osm_id in (763671171, 773400807, 1546138578, 3054623686, 8408461687, 11148902151)
);

-- =============================================================================
-- 1. Hunan Wok Chinese Restaurant -- 1617 Union St, Schenectady, NY
-- Source: https://www.hunanwokchinese.com/menu
-- =============================================================================
insert into restaurants (osm_id, name) values (763671171, 'Hunan Wok Chinese Restaurant')
  on conflict (osm_id) do update set name = excluded.name;

insert into menu_items (restaurant_id, name, description, price)
select id, 'Crab Rangoon (12)', 'Fried wontons filled with crab and cream cheese.', 8.55
from restaurants where osm_id = 763671171;
insert into menu_item_allergen_tags (menu_item_id, allergen_code, status)
select mi.id, v.code, v.status from menu_items mi join restaurants r on r.id = mi.restaurant_id
cross join (values ('shellfish','contains'),('dairy','contains'),('gluten','contains'),('vegan','contains'),('vegetarian','contains')) as v(code, status)
where r.osm_id = 763671171 and mi.name = 'Crab Rangoon (12)';

insert into menu_items (restaurant_id, name, description, price)
select id, 'Szechuan Dumpling in Hot Sauce (14)', 'Spicy dumplings served with a peanut butter-based sauce.', 7.95
from restaurants where osm_id = 763671171;
insert into menu_item_allergen_tags (menu_item_id, allergen_code, status)
select mi.id, v.code, v.status from menu_items mi join restaurants r on r.id = mi.restaurant_id
cross join (values ('peanut','contains'),('gluten','contains'),('soy','contains')) as v(code, status)
where r.osm_id = 763671171 and mi.name = 'Szechuan Dumpling in Hot Sauce (14)';

insert into menu_items (restaurant_id, name, description, price)
select id, 'Shrimp w/ Cashew Nuts', 'Stir-fried shrimp and cashews in standard Chinese-American sauce.', 10.40
from restaurants where osm_id = 763671171;
insert into menu_item_allergen_tags (menu_item_id, allergen_code, status)
select mi.id, v.code, v.status from menu_items mi join restaurants r on r.id = mi.restaurant_id
cross join (values ('shellfish','contains'),('tree_nut','contains'),('soy','contains'),('gluten','contains'),('vegan','contains'),('vegetarian','contains')) as v(code, status)
where r.osm_id = 763671171 and mi.name = 'Shrimp w/ Cashew Nuts';

insert into menu_items (restaurant_id, name, description, price)
select id, 'General Tso''s Chicken', 'Chunked chicken, hot and spicy, with red pepper, broccoli, and carrot.', 14.85
from restaurants where osm_id = 763671171;
insert into menu_item_allergen_tags (menu_item_id, allergen_code, status)
select mi.id, v.code, v.status from menu_items mi join restaurants r on r.id = mi.restaurant_id
cross join (values ('gluten','contains'),('soy','contains'),('vegan','contains'),('vegetarian','contains')) as v(code, status)
where r.osm_id = 763671171 and mi.name = 'General Tso''s Chicken';

insert into menu_items (restaurant_id, name, description, price)
select id, 'Sesame Chicken', 'Breaded fried chicken in sweet soy-based sesame sauce.', 14.85
from restaurants where osm_id = 763671171;
insert into menu_item_allergen_tags (menu_item_id, allergen_code, status)
select mi.id, v.code, v.status from menu_items mi join restaurants r on r.id = mi.restaurant_id
cross join (values ('sesame','contains'),('gluten','contains'),('soy','contains'),('vegan','contains'),('vegetarian','contains')) as v(code, status)
where r.osm_id = 763671171 and mi.name = 'Sesame Chicken';

insert into menu_items (restaurant_id, name, description, price)
select id, 'Moo Shu Pork', 'Includes rice and 4 pancakes.', 12.95
from restaurants where osm_id = 763671171;
insert into menu_item_allergen_tags (menu_item_id, allergen_code, status)
select mi.id, v.code, v.status from menu_items mi join restaurants r on r.id = mi.restaurant_id
cross join (values ('gluten','contains'),('egg','contains'),('soy','contains'),('vegan','contains'),('vegetarian','contains')) as v(code, status)
where r.osm_id = 763671171 and mi.name = 'Moo Shu Pork';

-- =============================================================================
-- 2. Tandoori House -- 1338 Gerling St, Schenectady, NY
-- Source: https://www.tandoorihousehalal.com/menu
-- =============================================================================
insert into restaurants (osm_id, name) values (773400807, 'Tandoori House')
  on conflict (osm_id) do update set name = excluded.name;

insert into menu_items (restaurant_id, name, description, price)
select id, 'Butter Chicken', 'Chicken in creamy tomato-based sauce, served with rice.', 14.99
from restaurants where osm_id = 773400807;
insert into menu_item_allergen_tags (menu_item_id, allergen_code, status)
select mi.id, v.code, v.status from menu_items mi join restaurants r on r.id = mi.restaurant_id
cross join (values ('dairy','contains'),('shellfish','safe'),('fish','safe'),('vegetarian','contains'),('vegan','contains')) as v(code, status)
where r.osm_id = 773400807 and mi.name = 'Butter Chicken';

insert into menu_items (restaurant_id, name, description, price)
select id, 'Chicken Tikka Masala', 'Chicken in cream/yogurt-based tikka masala sauce.', 14.99
from restaurants where osm_id = 773400807;
insert into menu_item_allergen_tags (menu_item_id, allergen_code, status)
select mi.id, v.code, v.status from menu_items mi join restaurants r on r.id = mi.restaurant_id
cross join (values ('dairy','contains'),('shellfish','safe'),('fish','safe'),('vegetarian','contains'),('vegan','contains')) as v(code, status)
where r.osm_id = 773400807 and mi.name = 'Chicken Tikka Masala';

insert into menu_items (restaurant_id, name, description, price)
select id, 'Saag Paneer', 'Indian cheese (paneer) in spinach gravy.', 12.99
from restaurants where osm_id = 773400807;
insert into menu_item_allergen_tags (menu_item_id, allergen_code, status)
select mi.id, v.code, v.status from menu_items mi join restaurants r on r.id = mi.restaurant_id
cross join (values ('dairy','contains'),('shellfish','safe'),('fish','safe'),('vegetarian','safe'),('vegan','contains')) as v(code, status)
where r.osm_id = 773400807 and mi.name = 'Saag Paneer';

insert into menu_items (restaurant_id, name, description, price)
select id, 'Veg Samosa', 'Crispy pastry filled with potatoes and chutney (2 pcs).', 5.99
from restaurants where osm_id = 773400807;
insert into menu_item_allergen_tags (menu_item_id, allergen_code, status)
select mi.id, v.code, v.status from menu_items mi join restaurants r on r.id = mi.restaurant_id
cross join (values ('gluten','contains'),('shellfish','safe'),('fish','safe'),('vegetarian','safe')) as v(code, status)
where r.osm_id = 773400807 and mi.name = 'Veg Samosa';

insert into menu_items (restaurant_id, name, description, price)
select id, 'Garlic Naan', 'Wheat flatbread with garlic, brushed with ghee/butter.', 5.50
from restaurants where osm_id = 773400807;
insert into menu_item_allergen_tags (menu_item_id, allergen_code, status)
select mi.id, v.code, v.status from menu_items mi join restaurants r on r.id = mi.restaurant_id
cross join (values ('gluten','contains'),('dairy','contains'),('vegetarian','safe'),('vegan','contains'),('shellfish','safe'),('fish','safe')) as v(code, status)
where r.osm_id = 773400807 and mi.name = 'Garlic Naan';

insert into menu_items (restaurant_id, name, description, price)
select id, 'Shrimp Curry', 'Shrimp in curry sauce, served with rice.', 15.99
from restaurants where osm_id = 773400807;
insert into menu_item_allergen_tags (menu_item_id, allergen_code, status)
select mi.id, v.code, v.status from menu_items mi join restaurants r on r.id = mi.restaurant_id
cross join (values ('shellfish','contains'),('fish','safe'),('vegetarian','contains'),('vegan','contains')) as v(code, status)
where r.osm_id = 773400807 and mi.name = 'Shrimp Curry';

-- =============================================================================
-- 3. Ferrari's Ristorante -- 1254 Congress St, Schenectady, NY
-- Source: https://www.allmenus.com/ny/schenectady/291474-ferraris-ristorante/menu/
-- =============================================================================
insert into restaurants (osm_id, name) values (1546138578, 'Ferrari''s Ristorante')
  on conflict (osm_id) do update set name = excluded.name;

insert into menu_items (restaurant_id, name, description, price)
select id, 'Veal Parmigiano', 'Ferrari''s most famous dish; breaded veal with mozzarella, choice of pasta side.', 22.95
from restaurants where osm_id = 1546138578;
insert into menu_item_allergen_tags (menu_item_id, allergen_code, status)
select mi.id, v.code, v.status from menu_items mi join restaurants r on r.id = mi.restaurant_id
cross join (values ('dairy','contains'),('gluten','contains'),('egg','contains'),('vegan','contains'),('vegetarian','contains'),('shellfish','safe'),('fish','safe'),('peanut','safe'),('tree_nut','safe')) as v(code, status)
where r.osm_id = 1546138578 and mi.name = 'Veal Parmigiano';

insert into menu_items (restaurant_id, name, description, price)
select id, 'Chicken Francese', 'Breaded chicken in a butter, garlic, and lemon sauce.', 13.00
from restaurants where osm_id = 1546138578;
insert into menu_item_allergen_tags (menu_item_id, allergen_code, status)
select mi.id, v.code, v.status from menu_items mi join restaurants r on r.id = mi.restaurant_id
cross join (values ('dairy','contains'),('gluten','contains'),('egg','contains'),('vegetarian','contains'),('vegan','contains'),('shellfish','safe'),('fish','safe'),('peanut','safe'),('tree_nut','safe')) as v(code, status)
where r.osm_id = 1546138578 and mi.name = 'Chicken Francese';

insert into menu_items (restaurant_id, name, description, price)
select id, 'Shrimp Fra Diablo', 'Shrimp in a spicy marinara sauce served over linguini.', 16.50
from restaurants where osm_id = 1546138578;
insert into menu_item_allergen_tags (menu_item_id, allergen_code, status)
select mi.id, v.code, v.status from menu_items mi join restaurants r on r.id = mi.restaurant_id
cross join (values ('shellfish','contains'),('gluten','contains'),('fish','safe'),('vegetarian','contains'),('vegan','contains'),('peanut','safe'),('tree_nut','safe')) as v(code, status)
where r.osm_id = 1546138578 and mi.name = 'Shrimp Fra Diablo';

insert into menu_items (restaurant_id, name, description, price)
select id, 'Homemade Spaghetti with Garlic Oil & Anchovies', 'Spaghetti tossed in garlic oil with anchovies.', 19.95
from restaurants where osm_id = 1546138578;
insert into menu_item_allergen_tags (menu_item_id, allergen_code, status)
select mi.id, v.code, v.status from menu_items mi join restaurants r on r.id = mi.restaurant_id
cross join (values ('fish','contains'),('gluten','contains'),('shellfish','safe'),('vegetarian','contains'),('vegan','contains'),('peanut','safe'),('tree_nut','safe')) as v(code, status)
where r.osm_id = 1546138578 and mi.name = 'Homemade Spaghetti with Garlic Oil & Anchovies';

insert into menu_items (restaurant_id, name, description, price)
select id, 'Eggplant Parmigiano with Pasta', 'Breaded eggplant with mozzarella/parmesan and pasta.', 18.50
from restaurants where osm_id = 1546138578;
insert into menu_item_allergen_tags (menu_item_id, allergen_code, status)
select mi.id, v.code, v.status from menu_items mi join restaurants r on r.id = mi.restaurant_id
cross join (values ('dairy','contains'),('gluten','contains'),('egg','contains'),('vegetarian','safe'),('vegan','contains'),('shellfish','safe'),('fish','safe'),('peanut','safe'),('tree_nut','safe')) as v(code, status)
where r.osm_id = 1546138578 and mi.name = 'Eggplant Parmigiano with Pasta';

insert into menu_items (restaurant_id, name, description, price)
select id, 'Gluten-Free Chocolate Cake', 'Store-bought gluten-free chocolate cake dessert.', 6.95
from restaurants where osm_id = 1546138578;
insert into menu_item_allergen_tags (menu_item_id, allergen_code, status)
select mi.id, v.code, v.status from menu_items mi join restaurants r on r.id = mi.restaurant_id
cross join (values ('gluten','safe'),('vegetarian','safe'),('shellfish','safe'),('fish','safe')) as v(code, status)
where r.osm_id = 1546138578 and mi.name = 'Gluten-Free Chocolate Cake';

-- =============================================================================
-- 4. Mizu Sushi -- 3610 State St, Schenectady, NY
-- Source: beyondmenu.com / menupages.com listings for Mizu Sushi Japanese Restaurant
-- =============================================================================
insert into restaurants (osm_id, name) values (3054623686, 'Mizu Sushi')
  on conflict (osm_id) do update set name = excluded.name;

insert into menu_items (restaurant_id, name, description, price)
select id, 'Edamame', 'Steamed soy beans.', 6.00
from restaurants where osm_id = 3054623686;
insert into menu_item_allergen_tags (menu_item_id, allergen_code, status)
select mi.id, v.code, v.status from menu_items mi join restaurants r on r.id = mi.restaurant_id
cross join (values ('soy','contains'),('gluten','safe'),('dairy','safe'),('egg','safe'),('peanut','safe'),('tree_nut','safe'),('shellfish','safe'),('fish','safe'),('vegan','safe'),('vegetarian','safe')) as v(code, status)
where r.osm_id = 3054623686 and mi.name = 'Edamame';

insert into menu_items (restaurant_id, name, description, price)
select id, 'California Roll', 'Imitation crab, avocado, cucumber roll.', 6.50
from restaurants where osm_id = 3054623686;
insert into menu_item_allergen_tags (menu_item_id, allergen_code, status)
select mi.id, v.code, v.status from menu_items mi join restaurants r on r.id = mi.restaurant_id
cross join (values ('shellfish','contains'),('fish','contains'),('egg','contains'),('gluten','contains'),('dairy','safe'),('peanut','safe'),('tree_nut','safe'),('vegan','contains'),('vegetarian','contains')) as v(code, status)
where r.osm_id = 3054623686 and mi.name = 'California Roll';

insert into menu_items (restaurant_id, name, description, price)
select id, 'Dragon Roll', 'Eel and cucumber inside with sliced avocado and tobiko on top.', 12.50
from restaurants where osm_id = 3054623686;
insert into menu_item_allergen_tags (menu_item_id, allergen_code, status)
select mi.id, v.code, v.status from menu_items mi join restaurants r on r.id = mi.restaurant_id
cross join (values ('fish','contains'),('soy','contains'),('gluten','contains'),('dairy','safe'),('egg','safe'),('peanut','safe'),('tree_nut','safe'),('vegan','contains'),('vegetarian','contains')) as v(code, status)
where r.osm_id = 3054623686 and mi.name = 'Dragon Roll';

insert into menu_items (restaurant_id, name, description, price)
select id, 'Tiger Roll', 'Lobster tempura inside, topped with shrimp and tobiko.', 14.50
from restaurants where osm_id = 3054623686;
insert into menu_item_allergen_tags (menu_item_id, allergen_code, status)
select mi.id, v.code, v.status from menu_items mi join restaurants r on r.id = mi.restaurant_id
cross join (values ('shellfish','contains'),('fish','contains'),('gluten','contains'),('egg','contains'),('dairy','safe'),('peanut','safe'),('tree_nut','safe'),('vegan','contains'),('vegetarian','contains')) as v(code, status)
where r.osm_id = 3054623686 and mi.name = 'Tiger Roll';

insert into menu_items (restaurant_id, name, description, price)
select id, 'Spicy Rock Shrimp', 'Baby shrimp tempura with spicy mayo.', 9.45
from restaurants where osm_id = 3054623686;
insert into menu_item_allergen_tags (menu_item_id, allergen_code, status)
select mi.id, v.code, v.status from menu_items mi join restaurants r on r.id = mi.restaurant_id
cross join (values ('shellfish','contains'),('gluten','contains'),('egg','contains'),('dairy','safe'),('fish','safe'),('peanut','safe'),('tree_nut','safe'),('vegan','contains'),('vegetarian','contains')) as v(code, status)
where r.osm_id = 3054623686 and mi.name = 'Spicy Rock Shrimp';

insert into menu_items (restaurant_id, name, description, price)
select id, 'Sashimi Appetizer', '7 pieces assorted sashimi (raw fish, no rice).', 11.95
from restaurants where osm_id = 3054623686;
insert into menu_item_allergen_tags (menu_item_id, allergen_code, status)
select mi.id, v.code, v.status from menu_items mi join restaurants r on r.id = mi.restaurant_id
cross join (values ('fish','contains'),('gluten','safe'),('dairy','safe'),('egg','safe'),('peanut','safe'),('tree_nut','safe'),('vegan','contains'),('vegetarian','contains')) as v(code, status)
where r.osm_id = 3054623686 and mi.name = 'Sashimi Appetizer';

-- =============================================================================
-- 5. Zaffron Kitchen -- 183 Nott Terrace, Schenectady, NY
-- Source: https://zaffronk.com/menu/schenectady
-- =============================================================================
insert into restaurants (osm_id, name) values (8408461687, 'Zaffron Kitchen')
  on conflict (osm_id) do update set name = excluded.name;

insert into menu_items (restaurant_id, name, description, price)
select id, 'Bolanee Bites', 'Leek and potato-filled turnovers with garlic-mint yogurt sauce.', 5.99
from restaurants where osm_id = 8408461687;
insert into menu_item_allergen_tags (menu_item_id, allergen_code, status)
select mi.id, v.code, v.status from menu_items mi join restaurants r on r.id = mi.restaurant_id
cross join (values ('gluten','contains'),('dairy','contains')) as v(code, status)
where r.osm_id = 8408461687 and mi.name = 'Bolanee Bites';

insert into menu_items (restaurant_id, name, description, price)
select id, 'Hummus', 'Served with naan.', 5.99
from restaurants where osm_id = 8408461687;
insert into menu_item_allergen_tags (menu_item_id, allergen_code, status)
select mi.id, v.code, v.status from menu_items mi join restaurants r on r.id = mi.restaurant_id
cross join (values ('gluten','contains'),('sesame','contains'),('dairy','safe'),('vegan','safe'),('vegetarian','safe')) as v(code, status)
where r.osm_id = 8408461687 and mi.name = 'Hummus';

insert into menu_items (restaurant_id, name, description, price)
select id, 'Aushak (Vegetable Manti)', 'Leek and herb dumplings topped with creamy garlic yogurt sauce.', 9.99
from restaurants where osm_id = 8408461687;
insert into menu_item_allergen_tags (menu_item_id, allergen_code, status)
select mi.id, v.code, v.status from menu_items mi join restaurants r on r.id = mi.restaurant_id
cross join (values ('gluten','contains'),('dairy','contains'),('vegetarian','safe'),('vegan','contains'),('shellfish','safe'),('fish','safe')) as v(code, status)
where r.osm_id = 8408461687 and mi.name = 'Aushak (Vegetable Manti)';

insert into menu_items (restaurant_id, name, description, price)
select id, 'Dynamite Jumbo Shrimp', 'Battered fried jumbo shrimp with mild Zaffire sauce.', 8.99
from restaurants where osm_id = 8408461687;
insert into menu_item_allergen_tags (menu_item_id, allergen_code, status)
select mi.id, v.code, v.status from menu_items mi join restaurants r on r.id = mi.restaurant_id
cross join (values ('shellfish','contains'),('gluten','contains'),('vegan','contains'),('vegetarian','contains'),('fish','safe')) as v(code, status)
where r.osm_id = 8408461687 and mi.name = 'Dynamite Jumbo Shrimp';

insert into menu_items (restaurant_id, name, description, price)
select id, 'Lamb Shank with Kabuli Palow', 'Marinated lamb foreshank with rice, carrots and caramelized raisins.', 19.99
from restaurants where osm_id = 8408461687;
insert into menu_item_allergen_tags (menu_item_id, allergen_code, status)
select mi.id, v.code, v.status from menu_items mi join restaurants r on r.id = mi.restaurant_id
cross join (values ('vegan','contains'),('vegetarian','contains'),('shellfish','safe'),('fish','safe')) as v(code, status)
where r.osm_id = 8408461687 and mi.name = 'Lamb Shank with Kabuli Palow';

insert into menu_items (restaurant_id, name, description, price)
select id, 'Spanakopita', 'Greek-style pastry with spinach and feta cheese filling in flaky dough.', 7.99
from restaurants where osm_id = 8408461687;
insert into menu_item_allergen_tags (menu_item_id, allergen_code, status)
select mi.id, v.code, v.status from menu_items mi join restaurants r on r.id = mi.restaurant_id
cross join (values ('dairy','contains'),('gluten','contains'),('vegetarian','safe'),('vegan','contains'),('shellfish','safe'),('fish','safe')) as v(code, status)
where r.osm_id = 8408461687 and mi.name = 'Spanakopita';

-- =============================================================================
-- 6. Pho Queen -- 602 State St, Schenectady, NY
-- Source: https://www.allmenus.com/ny/schenectady/507631-pho-queen/menu/
-- =============================================================================
insert into restaurants (osm_id, name) values (11148902151, 'Pho Queen')
  on conflict (osm_id) do update set name = excluded.name;

insert into menu_items (restaurant_id, name, description, price)
select id, 'Siamese Wing', 'Deep-fried chicken wings glazed with hot and spicy tamarind sauce.', 8.00
from restaurants where osm_id = 11148902151;
insert into menu_item_allergen_tags (menu_item_id, allergen_code, status)
select mi.id, v.code, v.status from menu_items mi join restaurants r on r.id = mi.restaurant_id
cross join (values ('sesame','contains'),('gluten','contains'),('dairy','safe'),('shellfish','safe'),('vegan','contains'),('vegetarian','contains')) as v(code, status)
where r.osm_id = 11148902151 and mi.name = 'Siamese Wing';

insert into menu_items (restaurant_id, name, description, price)
select id, 'Crab Rangoon', 'Fried crab and cream cheese wontons.', 8.00
from restaurants where osm_id = 11148902151;
insert into menu_item_allergen_tags (menu_item_id, allergen_code, status)
select mi.id, v.code, v.status from menu_items mi join restaurants r on r.id = mi.restaurant_id
cross join (values ('shellfish','contains'),('dairy','contains'),('gluten','contains'),('vegan','contains'),('vegetarian','contains')) as v(code, status)
where r.osm_id = 11148902151 and mi.name = 'Crab Rangoon';

insert into menu_items (restaurant_id, name, description, price)
select id, 'Chicken Satay', 'Grilled marinated chicken with peanut sauce.', 8.00
from restaurants where osm_id = 11148902151;
insert into menu_item_allergen_tags (menu_item_id, allergen_code, status)
select mi.id, v.code, v.status from menu_items mi join restaurants r on r.id = mi.restaurant_id
cross join (values ('peanut','contains'),('soy','contains'),('shellfish','safe'),('fish','safe'),('tree_nut','safe'),('vegan','contains'),('vegetarian','contains')) as v(code, status)
where r.osm_id = 11148902151 and mi.name = 'Chicken Satay';

insert into menu_items (restaurant_id, name, description, price)
select id, 'Kui Tiao Tom Yum Kung Soup', 'Shrimp with lemongrass and kaffir lime broth.', 18.00
from restaurants where osm_id = 11148902151;
insert into menu_item_allergen_tags (menu_item_id, allergen_code, status)
select mi.id, v.code, v.status from menu_items mi join restaurants r on r.id = mi.restaurant_id
cross join (values ('shellfish','contains'),('fish','contains'),('dairy','safe'),('peanut','safe'),('tree_nut','safe'),('vegan','contains'),('vegetarian','contains')) as v(code, status)
where r.osm_id = 11148902151 and mi.name = 'Kui Tiao Tom Yum Kung Soup';

insert into menu_items (restaurant_id, name, description, price)
select id, 'Vegetable Spring Roll', 'Baked glass noodle and vegetable rolls.', 8.00
from restaurants where osm_id = 11148902151;
insert into menu_item_allergen_tags (menu_item_id, allergen_code, status)
select mi.id, v.code, v.status from menu_items mi join restaurants r on r.id = mi.restaurant_id
cross join (values ('gluten','contains'),('shellfish','safe'),('dairy','safe'),('fish','safe'),('vegetarian','safe')) as v(code, status)
where r.osm_id = 11148902151 and mi.name = 'Vegetable Spring Roll';

insert into menu_items (restaurant_id, name, description, price)
select id, 'Edamame', 'Steamed soy beans with sea salt.', 7.00
from restaurants where osm_id = 11148902151;
insert into menu_item_allergen_tags (menu_item_id, allergen_code, status)
select mi.id, v.code, v.status from menu_items mi join restaurants r on r.id = mi.restaurant_id
cross join (values ('soy','contains'),('gluten','safe'),('dairy','safe'),('peanut','safe'),('tree_nut','safe'),('shellfish','safe'),('fish','safe'),('egg','safe'),('sesame','safe'),('vegan','safe'),('vegetarian','safe')) as v(code, status)
where r.osm_id = 11148902151 and mi.name = 'Edamame';
