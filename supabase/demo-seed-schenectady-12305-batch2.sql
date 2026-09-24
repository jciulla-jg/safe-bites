-- Safe Bites demo seed data, batch 2: 6 more real restaurants near zip 12305
-- (Schenectady/Niskayuna, NY), same sourcing standard as batch 1 -- see
-- demo-seed-schenectady-12305.sql's header for the full explanation.
--
-- Run this AFTER 0001_initial_schema.sql, 0002_seed_allergens.sql, and (if
-- you already ran it) demo-seed-schenectady-12305.sql -- this file is
-- independent of batch 1 and can also be run on its own.
-- Safe to re-run: restaurants are upserted by osm_id, and the preamble below
-- clears this file's menu_items (tags cascade) before re-inserting them.
--
-- Two candidates researched for this batch were deliberately NOT seeded --
-- both confirmed permanently closed, not just "menu not found":
--   - Tequila's Mexican Bar & Grill (closed Feb 15, 2025)
--   - Thai Thai Bistro (closed Apr 30, 2022)
-- Their OSM entries will correctly show "no data yet" in the app.

delete from menu_items
where restaurant_id in (
  select id from restaurants
  where osm_id in (1674094952, 3872013358, 8408467706, 10759583676, 9740136722, 7320589996)
);

-- =============================================================================
-- 1. Ninety Nine Restaurant & Pub -- Niskayuna, NY (national chain menu)
-- Source: https://order.99restaurants.com/65398/menu/
-- =============================================================================
insert into restaurants (osm_id, name) values (1674094952, 'Ninety Nine Restaurant & Pub')
  on conflict (osm_id) do update set name = excluded.name;

insert into menu_items (restaurant_id, name, description, price)
select id, 'Grilled Teriyaki Chicken', 'Marinated chicken breast flame broiled with teriyaki glaze and grilled pineapple.', 14.99
from restaurants where osm_id = 1674094952;
insert into menu_item_allergen_tags (menu_item_id, allergen_code, status)
select mi.id, v.code, v.status from menu_items mi join restaurants r on r.id = mi.restaurant_id
cross join (values ('gluten','contains'),('soy','contains'),('shellfish','safe'),('fish','safe'),('peanut','safe'),('tree_nut','safe'),('vegan','contains'),('vegetarian','contains')) as v(code, status)
where r.osm_id = 1674094952 and mi.name = 'Grilled Teriyaki Chicken';

insert into menu_items (restaurant_id, name, description, price)
select id, 'Chopped Sirloin', 'Ground sirloin flame broiled, smothered with red wine sauce and sauteed mushrooms.', 14.99
from restaurants where osm_id = 1674094952;
insert into menu_item_allergen_tags (menu_item_id, allergen_code, status)
select mi.id, v.code, v.status from menu_items mi join restaurants r on r.id = mi.restaurant_id
cross join (values ('egg','safe'),('shellfish','safe'),('fish','safe'),('peanut','safe'),('tree_nut','safe'),('sesame','safe'),('vegan','contains'),('vegetarian','contains')) as v(code, status)
where r.osm_id = 1674094952 and mi.name = 'Chopped Sirloin';

insert into menu_items (restaurant_id, name, description, price)
select id, 'Chicken & Sausage Al Forno', 'Penne, creamy tomato sauce, chicken, Italian sausage, parmesan, oven baked with mozzarella/provolone.', 14.99
from restaurants where osm_id = 1674094952;
insert into menu_item_allergen_tags (menu_item_id, allergen_code, status)
select mi.id, v.code, v.status from menu_items mi join restaurants r on r.id = mi.restaurant_id
cross join (values ('dairy','contains'),('gluten','contains'),('peanut','safe'),('tree_nut','safe'),('shellfish','safe'),('fish','safe'),('vegan','contains'),('vegetarian','contains')) as v(code, status)
where r.osm_id = 1674094952 and mi.name = 'Chicken & Sausage Al Forno';

insert into menu_items (restaurant_id, name, description, price)
select id, 'Boneless Wings', 'Hand-breaded, tossed in Buffalo or Gold Fever (honey mustard BBQ) sauce.', 14.39
from restaurants where osm_id = 1674094952;
insert into menu_item_allergen_tags (menu_item_id, allergen_code, status)
select mi.id, v.code, v.status from menu_items mi join restaurants r on r.id = mi.restaurant_id
cross join (values ('gluten','contains'),('dairy','contains'),('peanut','safe'),('tree_nut','safe'),('shellfish','safe'),('fish','safe'),('vegan','contains'),('vegetarian','contains')) as v(code, status)
where r.osm_id = 1674094952 and mi.name = 'Boneless Wings';

insert into menu_items (restaurant_id, name, description, price)
select id, 'Spinach & Artichoke Dip', 'Parmesan, spinach, artichoke hearts, mozzarella/provolone, pico de gallo, tortilla chips.', 11.39
from restaurants where osm_id = 1674094952;
insert into menu_item_allergen_tags (menu_item_id, allergen_code, status)
select mi.id, v.code, v.status from menu_items mi join restaurants r on r.id = mi.restaurant_id
cross join (values ('dairy','contains'),('shellfish','safe'),('fish','safe'),('peanut','safe'),('tree_nut','safe'),('vegetarian','safe'),('vegan','contains')) as v(code, status)
where r.osm_id = 1674094952 and mi.name = 'Spinach & Artichoke Dip';

insert into menu_items (restaurant_id, name, description, price)
select id, 'Bucket of Seafood Chowder', 'Clams, shrimp, schrod, and potatoes in a creamy chowder. Serves up to 5.', 19.99
from restaurants where osm_id = 1674094952;
insert into menu_item_allergen_tags (menu_item_id, allergen_code, status)
select mi.id, v.code, v.status from menu_items mi join restaurants r on r.id = mi.restaurant_id
cross join (values ('shellfish','contains'),('fish','contains'),('dairy','contains'),('gluten','contains'),('peanut','safe'),('tree_nut','safe'),('vegan','contains'),('vegetarian','contains')) as v(code, status)
where r.osm_id = 1674094952 and mi.name = 'Bucket of Seafood Chowder';

-- =============================================================================
-- 2. Stella Pasta Bar and Bistro -- 237 Union St, Schenectady, NY
-- Source: https://www.stellapastabar.com/menu
-- =============================================================================
insert into restaurants (osm_id, name) values (3872013358, 'Stella Pasta Bar and Bistro')
  on conflict (osm_id) do update set name = excluded.name;

insert into menu_items (restaurant_id, name, description, price)
select id, 'Lobster Ravioli', 'Served in a lemon & white wine cream sauce.', 24.00
from restaurants where osm_id = 3872013358;
insert into menu_item_allergen_tags (menu_item_id, allergen_code, status)
select mi.id, v.code, v.status from menu_items mi join restaurants r on r.id = mi.restaurant_id
cross join (values ('shellfish','contains'),('fish','safe'),('dairy','contains'),('egg','contains'),('gluten','contains'),('peanut','safe'),('tree_nut','safe'),('sesame','safe'),('vegan','contains'),('vegetarian','contains')) as v(code, status)
where r.osm_id = 3872013358 and mi.name = 'Lobster Ravioli';

insert into menu_items (restaurant_id, name, description, price)
select id, 'Wild Mushroom Ravioli', 'Served in a sherry & herb alfredo sauce.', 24.00
from restaurants where osm_id = 3872013358;
insert into menu_item_allergen_tags (menu_item_id, allergen_code, status)
select mi.id, v.code, v.status from menu_items mi join restaurants r on r.id = mi.restaurant_id
cross join (values ('dairy','contains'),('egg','contains'),('gluten','contains'),('shellfish','safe'),('fish','safe'),('peanut','safe'),('tree_nut','safe'),('sesame','safe'),('vegetarian','safe'),('vegan','contains')) as v(code, status)
where r.osm_id = 3872013358 and mi.name = 'Wild Mushroom Ravioli';

insert into menu_items (restaurant_id, name, description, price)
select id, 'Gnocchi Carbonara', 'Gnocchi with egg, crispy prosciutto, parmesan, pecorino romano, and peas.', 25.00
from restaurants where osm_id = 3872013358;
insert into menu_item_allergen_tags (menu_item_id, allergen_code, status)
select mi.id, v.code, v.status from menu_items mi join restaurants r on r.id = mi.restaurant_id
cross join (values ('egg','contains'),('dairy','contains'),('gluten','contains'),('shellfish','safe'),('fish','safe'),('peanut','safe'),('tree_nut','safe'),('sesame','safe'),('vegan','contains'),('vegetarian','contains')) as v(code, status)
where r.osm_id = 3872013358 and mi.name = 'Gnocchi Carbonara';

insert into menu_items (restaurant_id, name, description, price)
select id, 'Stella Crab Cakes', '3 crab cakes with lump crab meat, herbs, capers, garlic aioli, heirloom tomatoes.', 18.00
from restaurants where osm_id = 3872013358;
insert into menu_item_allergen_tags (menu_item_id, allergen_code, status)
select mi.id, v.code, v.status from menu_items mi join restaurants r on r.id = mi.restaurant_id
cross join (values ('shellfish','contains'),('fish','safe'),('egg','contains'),('peanut','safe'),('tree_nut','safe'),('sesame','safe'),('vegan','contains'),('vegetarian','contains')) as v(code, status)
where r.osm_id = 3872013358 and mi.name = 'Stella Crab Cakes';

insert into menu_items (restaurant_id, name, description, price)
select id, 'Luigi''s Linguine Alle Vongole', 'Linguine with littleneck clams, white wine, garlic, herbs, spinach, heirloom tomatoes.', 30.00
from restaurants where osm_id = 3872013358;
insert into menu_item_allergen_tags (menu_item_id, allergen_code, status)
select mi.id, v.code, v.status from menu_items mi join restaurants r on r.id = mi.restaurant_id
cross join (values ('shellfish','contains'),('fish','safe'),('gluten','contains'),('egg','contains'),('peanut','safe'),('tree_nut','safe'),('sesame','safe'),('vegan','contains'),('vegetarian','contains')) as v(code, status)
where r.osm_id = 3872013358 and mi.name = 'Luigi''s Linguine Alle Vongole';

insert into menu_items (restaurant_id, name, description, price)
select id, 'Gluten-Free Penne (build your own)', 'Gluten-free penne base for any build-your-own pasta dish.', null
from restaurants where osm_id = 3872013358;
insert into menu_item_allergen_tags (menu_item_id, allergen_code, status)
select mi.id, v.code, v.status from menu_items mi join restaurants r on r.id = mi.restaurant_id
cross join (values ('gluten','safe')) as v(code, status)
where r.osm_id = 3872013358 and mi.name = 'Gluten-Free Penne (build your own)';

-- =============================================================================
-- 3. Mi Bandera Peruvian Restaurant -- 1600 Altamont Ave, Schenectady, NY
-- Source: https://mibanderaperuvianrestaurantny.com/mi-bandera-peruvian-restaurant/menu/1600-Altamont-Ave/
-- =============================================================================
insert into restaurants (osm_id, name) values (8408467706, 'Mi Bandera Peruvian Restaurant')
  on conflict (osm_id) do update set name = excluded.name;

insert into menu_items (restaurant_id, name, description, price)
select id, 'Ceviche de Pescado', 'Raw fish marinated in citrus (leche de tigre), onion, chili, corn, sweet potato.', 24.00
from restaurants where osm_id = 8408467706;
insert into menu_item_allergen_tags (menu_item_id, allergen_code, status)
select mi.id, v.code, v.status from menu_items mi join restaurants r on r.id = mi.restaurant_id
cross join (values ('fish','contains'),('shellfish','safe'),('dairy','safe'),('egg','safe'),('gluten','safe'),('peanut','safe'),('tree_nut','safe'),('vegan','contains'),('vegetarian','contains')) as v(code, status)
where r.osm_id = 8408467706 and mi.name = 'Ceviche de Pescado';

insert into menu_items (restaurant_id, name, description, price)
select id, 'Lomo Saltado', 'Stir-fried beef, onions, tomatoes, french fries, rice, Chifa-style soy sauce.', 24.00
from restaurants where osm_id = 8408467706;
insert into menu_item_allergen_tags (menu_item_id, allergen_code, status)
select mi.id, v.code, v.status from menu_items mi join restaurants r on r.id = mi.restaurant_id
cross join (values ('soy','contains'),('gluten','contains'),('shellfish','safe'),('fish','safe'),('dairy','safe'),('egg','safe'),('peanut','safe'),('tree_nut','safe'),('vegetarian','contains'),('vegan','contains')) as v(code, status)
where r.osm_id = 8408467706 and mi.name = 'Lomo Saltado';

insert into menu_items (restaurant_id, name, description, price)
select id, 'Anticuchos', 'Grilled beef heart skewers marinated in vinegar, chili, and aji panca.', 22.00
from restaurants where osm_id = 8408467706;
insert into menu_item_allergen_tags (menu_item_id, allergen_code, status)
select mi.id, v.code, v.status from menu_items mi join restaurants r on r.id = mi.restaurant_id
cross join (values ('shellfish','safe'),('fish','safe'),('dairy','safe'),('egg','safe'),('peanut','safe'),('tree_nut','safe'),('vegetarian','contains'),('vegan','contains')) as v(code, status)
where r.osm_id = 8408467706 and mi.name = 'Anticuchos';

insert into menu_items (restaurant_id, name, description, price)
select id, 'Papa a la Huancaina', 'Boiled potatoes in creamy queso fresco/aji amarillo sauce, egg, olives.', 14.00
from restaurants where osm_id = 8408467706;
insert into menu_item_allergen_tags (menu_item_id, allergen_code, status)
select mi.id, v.code, v.status from menu_items mi join restaurants r on r.id = mi.restaurant_id
cross join (values ('dairy','contains'),('egg','contains'),('vegetarian','safe'),('vegan','contains'),('shellfish','safe'),('fish','safe'),('peanut','safe'),('tree_nut','safe'),('gluten','safe')) as v(code, status)
where r.osm_id = 8408467706 and mi.name = 'Papa a la Huancaina';

insert into menu_items (restaurant_id, name, description, price)
select id, 'Causa de Pollo', 'Layered mashed yellow potato (aji amarillo, lime) with shredded chicken, mayonnaise, egg garnish.', 14.00
from restaurants where osm_id = 8408467706;
insert into menu_item_allergen_tags (menu_item_id, allergen_code, status)
select mi.id, v.code, v.status from menu_items mi join restaurants r on r.id = mi.restaurant_id
cross join (values ('egg','contains'),('fish','safe'),('shellfish','safe'),('peanut','safe'),('tree_nut','safe'),('gluten','safe'),('vegetarian','contains'),('vegan','contains')) as v(code, status)
where r.osm_id = 8408467706 and mi.name = 'Causa de Pollo';

insert into menu_items (restaurant_id, name, description, price)
select id, 'Chaufa de Pollo', 'Peruvian-Chinese (Chifa) fried rice with chicken, egg, scallions, soy sauce.', 20.00
from restaurants where osm_id = 8408467706;
insert into menu_item_allergen_tags (menu_item_id, allergen_code, status)
select mi.id, v.code, v.status from menu_items mi join restaurants r on r.id = mi.restaurant_id
cross join (values ('soy','contains'),('egg','contains'),('gluten','contains'),('shellfish','safe'),('fish','safe'),('dairy','safe'),('peanut','safe'),('tree_nut','safe'),('vegetarian','contains'),('vegan','contains')) as v(code, status)
where r.osm_id = 8408467706 and mi.name = 'Chaufa de Pollo';

-- =============================================================================
-- 4. Caribe Spanish Restaurant and Sports Bar -- 2236 Broadway, Schenectady, NY
-- Source: https://caribeschenectady.com/menu
-- =============================================================================
insert into restaurants (osm_id, name) values (10759583676, 'Caribe Spanish Restaurant and Sports Bar')
  on conflict (osm_id) do update set name = excluded.name;

insert into menu_items (restaurant_id, name, description, price)
select id, 'Garlic Shrimp (Camarones al Ajillo)', 'Shrimp simmered in garlic sauce with chopped peppers and onions.', 32.35
from restaurants where osm_id = 10759583676;
insert into menu_item_allergen_tags (menu_item_id, allergen_code, status)
select mi.id, v.code, v.status from menu_items mi join restaurants r on r.id = mi.restaurant_id
cross join (values ('shellfish','contains'),('fish','safe'),('peanut','safe'),('tree_nut','safe'),('egg','safe'),('sesame','safe'),('vegan','contains'),('vegetarian','contains')) as v(code, status)
where r.osm_id = 10759583676 and mi.name = 'Garlic Shrimp (Camarones al Ajillo)';

insert into menu_items (restaurant_id, name, description, price)
select id, 'Seafood Rice', 'Rice with squid, octopus, shrimp, clams, and mussels.', 36.39
from restaurants where osm_id = 10759583676;
insert into menu_item_allergen_tags (menu_item_id, allergen_code, status)
select mi.id, v.code, v.status from menu_items mi join restaurants r on r.id = mi.restaurant_id
cross join (values ('shellfish','contains'),('peanut','safe'),('tree_nut','safe'),('egg','safe'),('sesame','safe'),('vegan','contains'),('vegetarian','contains')) as v(code, status)
where r.osm_id = 10759583676 and mi.name = 'Seafood Rice';

insert into menu_items (restaurant_id, name, description, price)
select id, 'Roast Pork (Pernil)', 'Slow-roasted 7 hours, crispy skin.', 16.15
from restaurants where osm_id = 10759583676;
insert into menu_item_allergen_tags (menu_item_id, allergen_code, status)
select mi.id, v.code, v.status from menu_items mi join restaurants r on r.id = mi.restaurant_id
cross join (values ('shellfish','safe'),('fish','safe'),('dairy','safe'),('peanut','safe'),('tree_nut','safe'),('sesame','safe'),('vegan','contains'),('vegetarian','contains')) as v(code, status)
where r.osm_id = 10759583676 and mi.name = 'Roast Pork (Pernil)';

insert into menu_items (restaurant_id, name, description, price)
select id, 'Tres Golpes', 'Dominican breakfast: mangu (mashed plantains), fried cheese, salami.', 26.95
from restaurants where osm_id = 10759583676;
insert into menu_item_allergen_tags (menu_item_id, allergen_code, status)
select mi.id, v.code, v.status from menu_items mi join restaurants r on r.id = mi.restaurant_id
cross join (values ('dairy','contains'),('shellfish','safe'),('fish','safe'),('peanut','safe'),('tree_nut','safe'),('vegan','contains'),('vegetarian','contains')) as v(code, status)
where r.osm_id = 10759583676 and mi.name = 'Tres Golpes';

insert into menu_items (restaurant_id, name, description, price)
select id, 'Vegetarian Sampler (Picadera Vegetariana)', 'Fried plantains, sweet plantains, and fried cheese.', 20.19
from restaurants where osm_id = 10759583676;
insert into menu_item_allergen_tags (menu_item_id, allergen_code, status)
select mi.id, v.code, v.status from menu_items mi join restaurants r on r.id = mi.restaurant_id
cross join (values ('vegetarian','safe'),('dairy','contains'),('vegan','contains'),('shellfish','safe'),('fish','safe'),('peanut','safe'),('tree_nut','safe')) as v(code, status)
where r.osm_id = 10759583676 and mi.name = 'Vegetarian Sampler (Picadera Vegetariana)';

insert into menu_items (restaurant_id, name, description, price)
select id, 'Jerked Chicken', 'Chicken marinated in bold jerk spices, grilled.', 16.15
from restaurants where osm_id = 10759583676;
insert into menu_item_allergen_tags (menu_item_id, allergen_code, status)
select mi.id, v.code, v.status from menu_items mi join restaurants r on r.id = mi.restaurant_id
cross join (values ('shellfish','safe'),('fish','safe'),('dairy','safe'),('peanut','safe'),('tree_nut','safe'),('vegan','contains'),('vegetarian','contains')) as v(code, status)
where r.osm_id = 10759583676 and mi.name = 'Jerked Chicken';

-- =============================================================================
-- 5. Lily P's Wood Fired Pizza Co. -- Schenectady, NY (inside Frog Alley Brewing)
-- Source: Daily Gazette coverage (no published price list found anywhere online)
-- =============================================================================
insert into restaurants (osm_id, name) values (9740136722, 'Lily P''s Wood Fired Pizza Co.')
  on conflict (osm_id) do update set name = excluded.name;

insert into menu_items (restaurant_id, name, description, price)
select id, 'Ricky Ricotta', 'Ricotta-based pizza with roasted broccoli and sausage.', null
from restaurants where osm_id = 9740136722;
insert into menu_item_allergen_tags (menu_item_id, allergen_code, status)
select mi.id, v.code, v.status from menu_items mi join restaurants r on r.id = mi.restaurant_id
cross join (values ('dairy','contains'),('gluten','contains'),('egg','safe'),('peanut','safe'),('tree_nut','safe'),('shellfish','safe'),('fish','safe'),('sesame','safe'),('vegetarian','contains'),('vegan','contains')) as v(code, status)
where r.osm_id = 9740136722 and mi.name = 'Ricky Ricotta';

insert into menu_items (restaurant_id, name, description, price)
select id, 'Joe Pesto', 'Pesto-based pizza with sun-dried tomatoes, pesto, and sausage.', null
from restaurants where osm_id = 9740136722;
insert into menu_item_allergen_tags (menu_item_id, allergen_code, status)
select mi.id, v.code, v.status from menu_items mi join restaurants r on r.id = mi.restaurant_id
cross join (values ('dairy','contains'),('gluten','contains'),('tree_nut','contains'),('egg','safe'),('peanut','safe'),('shellfish','safe'),('fish','safe'),('sesame','safe'),('vegetarian','contains'),('vegan','contains')) as v(code, status)
where r.osm_id = 9740136722 and mi.name = 'Joe Pesto';

insert into menu_items (restaurant_id, name, description, price)
select id, 'Bacon Jam Pizza', 'Pizza featuring homemade bacon jam.', null
from restaurants where osm_id = 9740136722;
insert into menu_item_allergen_tags (menu_item_id, allergen_code, status)
select mi.id, v.code, v.status from menu_items mi join restaurants r on r.id = mi.restaurant_id
cross join (values ('dairy','contains'),('gluten','contains'),('egg','safe'),('peanut','safe'),('tree_nut','safe'),('shellfish','safe'),('fish','safe'),('sesame','safe'),('vegetarian','contains'),('vegan','contains')) as v(code, status)
where r.osm_id = 9740136722 and mi.name = 'Bacon Jam Pizza';

insert into menu_items (restaurant_id, name, description, price)
select id, 'Broccoli Burrata', 'White garlic-based pizza with burrata and broccoli.', null
from restaurants where osm_id = 9740136722;
insert into menu_item_allergen_tags (menu_item_id, allergen_code, status)
select mi.id, v.code, v.status from menu_items mi join restaurants r on r.id = mi.restaurant_id
cross join (values ('dairy','contains'),('gluten','contains'),('egg','safe'),('peanut','safe'),('tree_nut','safe'),('shellfish','safe'),('fish','safe'),('sesame','safe'),('vegetarian','safe'),('vegan','contains')) as v(code, status)
where r.osm_id = 9740136722 and mi.name = 'Broccoli Burrata';

insert into menu_items (restaurant_id, name, description, price)
select id, 'Cheese Pizza', 'Classic cheese pizza.', null
from restaurants where osm_id = 9740136722;
insert into menu_item_allergen_tags (menu_item_id, allergen_code, status)
select mi.id, v.code, v.status from menu_items mi join restaurants r on r.id = mi.restaurant_id
cross join (values ('dairy','contains'),('gluten','contains'),('egg','safe'),('peanut','safe'),('tree_nut','safe'),('shellfish','safe'),('fish','safe'),('sesame','safe'),('vegetarian','safe'),('vegan','contains')) as v(code, status)
where r.osm_id = 9740136722 and mi.name = 'Cheese Pizza';

insert into menu_items (restaurant_id, name, description, price)
select id, 'Pepperoni Pizza', 'Classic pepperoni pizza.', null
from restaurants where osm_id = 9740136722;
insert into menu_item_allergen_tags (menu_item_id, allergen_code, status)
select mi.id, v.code, v.status from menu_items mi join restaurants r on r.id = mi.restaurant_id
cross join (values ('dairy','contains'),('gluten','contains'),('egg','safe'),('peanut','safe'),('tree_nut','safe'),('shellfish','safe'),('fish','safe'),('sesame','safe'),('vegetarian','contains'),('vegan','contains')) as v(code, status)
where r.osm_id = 9740136722 and mi.name = 'Pepperoni Pizza';

-- =============================================================================
-- 6. Meat & Company -- 2321 Nott St E, Niskayuna, NY (barbecue)
-- Source: https://www.meatandcompanynisky.com/menu (no prices published there)
-- =============================================================================
insert into restaurants (osm_id, name) values (7320589996, 'Meat & Company')
  on conflict (osm_id) do update set name = excluded.name;

insert into menu_items (restaurant_id, name, description, price)
select id, 'Smoked Grilled Wings', 'Hickory-smoked, char-grilled wings with choice of sauce, served with blue cheese or ranch.', null
from restaurants where osm_id = 7320589996;
insert into menu_item_allergen_tags (menu_item_id, allergen_code, status)
select mi.id, v.code, v.status from menu_items mi join restaurants r on r.id = mi.restaurant_id
cross join (values ('dairy','contains'),('shellfish','safe'),('fish','safe'),('vegan','contains'),('vegetarian','contains')) as v(code, status)
where r.osm_id = 7320589996 and mi.name = 'Smoked Grilled Wings';

insert into menu_items (restaurant_id, name, description, price)
select id, 'Chicken Corn Chowder', 'Smoky chicken, sweet corn, potato chunks, bell peppers.', null
from restaurants where osm_id = 7320589996;
insert into menu_item_allergen_tags (menu_item_id, allergen_code, status)
select mi.id, v.code, v.status from menu_items mi join restaurants r on r.id = mi.restaurant_id
cross join (values ('dairy','contains'),('vegan','contains'),('vegetarian','contains'),('shellfish','safe'),('fish','safe'),('peanut','safe'),('tree_nut','safe')) as v(code, status)
where r.osm_id = 7320589996 and mi.name = 'Chicken Corn Chowder';

insert into menu_items (restaurant_id, name, description, price)
select id, 'Brisket Sandwich', 'Smoked brisket on a bun.', null
from restaurants where osm_id = 7320589996;
insert into menu_item_allergen_tags (menu_item_id, allergen_code, status)
select mi.id, v.code, v.status from menu_items mi join restaurants r on r.id = mi.restaurant_id
cross join (values ('gluten','contains'),('vegan','contains'),('vegetarian','contains'),('shellfish','safe'),('fish','safe'),('peanut','safe'),('tree_nut','safe')) as v(code, status)
where r.osm_id = 7320589996 and mi.name = 'Brisket Sandwich';

insert into menu_items (restaurant_id, name, description, price)
select id, 'Three Cheese Mac & Cheese', 'Mac and cheese side dish.', null
from restaurants where osm_id = 7320589996;
insert into menu_item_allergen_tags (menu_item_id, allergen_code, status)
select mi.id, v.code, v.status from menu_items mi join restaurants r on r.id = mi.restaurant_id
cross join (values ('dairy','contains'),('gluten','contains'),('vegetarian','safe'),('vegan','contains'),('shellfish','safe'),('fish','safe'),('peanut','safe'),('tree_nut','safe')) as v(code, status)
where r.osm_id = 7320589996 and mi.name = 'Three Cheese Mac & Cheese';

insert into menu_items (restaurant_id, name, description, price)
select id, 'Pit Beans', 'BBQ baked beans.', null
from restaurants where osm_id = 7320589996;
insert into menu_item_allergen_tags (menu_item_id, allergen_code, status)
select mi.id, v.code, v.status from menu_items mi join restaurants r on r.id = mi.restaurant_id
cross join (values ('dairy','safe'),('shellfish','safe'),('peanut','safe'),('tree_nut','safe')) as v(code, status)
where r.osm_id = 7320589996 and mi.name = 'Pit Beans';
