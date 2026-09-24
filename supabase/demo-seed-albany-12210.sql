-- Safe Bites demo seed data: 5 real restaurants near zip 12210 (downtown
-- Albany, NY), discovered live via the same OpenStreetMap Overpass query the
-- app itself uses.
--
-- Menu items and allergen tags below are researched from each restaurant's
-- actual published menu (website, or an aggregator mirroring it) as of
-- 2026-09-24, with conservative best-effort allergen calls -- NOT verified
-- directly with kitchen staff. This is demo/hackathon seed data illustrating
-- the app's intended data model (ADR-0002's hybrid manual-seeding approach),
-- not a production food-safety guarantee. See each restaurant's block below
-- for its source URL(s). A missing allergen tag means "unknown", not "safe".
--
-- Prices are null where the restaurant does not publish them online (677
-- Prime's steakhouse menu, and Mystic Momo, whose delivery-platform pricing
-- could not be retrieved).
--
-- Restaurants considered but NOT seeded here: Cafe Capriccio was initially
-- considered but its own site only exposes the menu as images, so its data
-- below is instead sourced from allmenus.com (a text mirror of that same
-- published menu). All 5 candidates researched had usable itemized menus;
-- none from the candidate list were skipped for lacking one.
--
-- Run this AFTER 0001_initial_schema.sql and 0002_seed_allergens.sql.
-- Safe to re-run: restaurants are upserted by osm_id, and the preamble below
-- clears this file's menu_items (tags cascade) before re-inserting them, so a
-- second run replaces rather than duplicates. Ratings are never touched.

delete from menu_items
where restaurant_id in (
  select id from restaurants
  where osm_id in (679495455, 679497101, 1228524795, 1404775814, 1469590183)
);

-- =============================================================================
-- 1. 677 Prime -- 677 Broadway, Albany, NY -- Steakhouse
-- Source: https://www.677prime.com/dinner-menu
-- =============================================================================
insert into restaurants (osm_id, name, description, description_source, reviewed_at)
values (679495455, '677 Prime', 'Upscale downtown Albany steakhouse serving Wagyu and prime-cut steaks alongside seafood, raw bar, and composed appetizers.', 'https://www.677prime.com/dinner-menu', '2026-09-24')
  on conflict (osm_id) do update set name = excluded.name, description = excluded.description, description_source = excluded.description_source, reviewed_at = excluded.reviewed_at;

insert into menu_items (restaurant_id, name, description, price)
select id, 'Baked Burrata', 'Sweet cherry peppers, romesco sauce, parmesan, rouille, almonds, baguette.', null
from restaurants where osm_id = 679495455;
insert into menu_item_allergen_tags (menu_item_id, allergen_code, status)
select mi.id, v.code, v.status from menu_items mi join restaurants r on r.id = mi.restaurant_id
cross join (values ('dairy','contains'),('tree_nut','contains'),('gluten','contains'),('vegan','contains')) as v(code, status)
where r.osm_id = 679495455 and mi.name = 'Baked Burrata';

insert into menu_items (restaurant_id, name, description, price)
select id, 'Short Rib & Lobster Dumplings', 'Crispy short rib gyoza, lobster and cucumber salad, kewpie mayo, chili oil.', null
from restaurants where osm_id = 679495455;
insert into menu_item_allergen_tags (menu_item_id, allergen_code, status)
select mi.id, v.code, v.status from menu_items mi join restaurants r on r.id = mi.restaurant_id
cross join (values ('shellfish','contains'),('egg','contains'),('gluten','contains'),('vegan','contains'),('vegetarian','contains')) as v(code, status)
where r.osm_id = 679495455 and mi.name = 'Short Rib & Lobster Dumplings';

insert into menu_items (restaurant_id, name, description, price)
select id, 'Moules Frites', 'Vermont salumi fiddlehead IPA bratwurst, Prince Edward Island mussels, fennel, basil.', null
from restaurants where osm_id = 679495455;
insert into menu_item_allergen_tags (menu_item_id, allergen_code, status)
select mi.id, v.code, v.status from menu_items mi join restaurants r on r.id = mi.restaurant_id
cross join (values ('shellfish','contains'),('vegan','contains'),('vegetarian','contains')) as v(code, status)
where r.osm_id = 679495455 and mi.name = 'Moules Frites';

insert into menu_items (restaurant_id, name, description, price)
select id, 'NY Strip', '14 oz, Prime Greater Omaha.', null
from restaurants where osm_id = 679495455;
insert into menu_item_allergen_tags (menu_item_id, allergen_code, status)
select mi.id, v.code, v.status from menu_items mi join restaurants r on r.id = mi.restaurant_id
cross join (values ('vegan','contains'),('vegetarian','contains')) as v(code, status)
where r.osm_id = 679495455 and mi.name = 'NY Strip';

insert into menu_items (restaurant_id, name, description, price)
select id, 'Miso Glazed Faroe Island Salmon', 'Fried rice, sesame green beans, pickled cucumber salad, thai peanut sauce.', null
from restaurants where osm_id = 679495455;
insert into menu_item_allergen_tags (menu_item_id, allergen_code, status)
select mi.id, v.code, v.status from menu_items mi join restaurants r on r.id = mi.restaurant_id
cross join (values ('fish','contains'),('soy','contains'),('sesame','contains'),('peanut','contains'),('vegan','contains'),('vegetarian','contains')) as v(code, status)
where r.osm_id = 679495455 and mi.name = 'Miso Glazed Faroe Island Salmon';

insert into menu_items (restaurant_id, name, description, price)
select id, 'Lobster Mac N'' Cheese', 'Cavatappi, four cheeses.', null
from restaurants where osm_id = 679495455;
insert into menu_item_allergen_tags (menu_item_id, allergen_code, status)
select mi.id, v.code, v.status from menu_items mi join restaurants r on r.id = mi.restaurant_id
cross join (values ('shellfish','contains'),('dairy','contains'),('gluten','contains'),('vegan','contains')) as v(code, status)
where r.osm_id = 679495455 and mi.name = 'Lobster Mac N'' Cheese';

-- =============================================================================
-- 2. Jack's Oyster House -- 42 State St, Albany, NY -- Seafood
-- Source: https://jacksoysterhouse.com/menu/
-- =============================================================================
insert into restaurants (osm_id, name, description, description_source, reviewed_at)
values (679497101, 'Jack''s Oyster House', 'Historic downtown Albany seafood restaurant open since 1913, known for its raw oyster bar, chowder, and steaks.', 'https://jacksoysterhouse.com/menu/', '2026-09-24')
  on conflict (osm_id) do update set name = excluded.name, description = excluded.description, description_source = excluded.description_source, reviewed_at = excluded.reviewed_at;

insert into menu_items (restaurant_id, name, description, price)
select id, 'Oysters on the Half Shell (Half Dozen)', 'House-made vinegar selection, super lemon, cocktail sauce.', 25.00
from restaurants where osm_id = 679497101;
insert into menu_item_allergen_tags (menu_item_id, allergen_code, status)
select mi.id, v.code, v.status from menu_items mi join restaurants r on r.id = mi.restaurant_id
cross join (values ('shellfish','contains'),('vegan','contains'),('vegetarian','contains')) as v(code, status)
where r.osm_id = 679497101 and mi.name = 'Oysters on the Half Shell (Half Dozen)';

insert into menu_items (restaurant_id, name, description, price)
select id, 'Jumbo Shrimp Cocktail', 'Cocktail sauce, lemon.', 28.00
from restaurants where osm_id = 679497101;
insert into menu_item_allergen_tags (menu_item_id, allergen_code, status)
select mi.id, v.code, v.status from menu_items mi join restaurants r on r.id = mi.restaurant_id
cross join (values ('shellfish','contains'),('vegan','contains'),('vegetarian','contains')) as v(code, status)
where r.osm_id = 679497101 and mi.name = 'Jumbo Shrimp Cocktail';

insert into menu_items (restaurant_id, name, description, price)
select id, 'Jack''s Seafood Chowder', 'Lobster, shrimp, mussels, clams, white fish, bacon.', 18.00
from restaurants where osm_id = 679497101;
insert into menu_item_allergen_tags (menu_item_id, allergen_code, status)
select mi.id, v.code, v.status from menu_items mi join restaurants r on r.id = mi.restaurant_id
cross join (values ('shellfish','contains'),('fish','contains'),('dairy','contains'),('vegan','contains'),('vegetarian','contains')) as v(code, status)
where r.osm_id = 679497101 and mi.name = 'Jack''s Seafood Chowder';

insert into menu_items (restaurant_id, name, description, price)
select id, 'Lobster Roll', 'Fresh Maine hard shell lobster, toasted brioche bun, cole slaw. Cold with mayo or hot with butter.', 31.00
from restaurants where osm_id = 679497101;
insert into menu_item_allergen_tags (menu_item_id, allergen_code, status)
select mi.id, v.code, v.status from menu_items mi join restaurants r on r.id = mi.restaurant_id
cross join (values ('shellfish','contains'),('gluten','contains'),('egg','contains'),('dairy','may_contain'),('vegan','contains'),('vegetarian','contains')) as v(code, status)
where r.osm_id = 679497101 and mi.name = 'Lobster Roll';

insert into menu_items (restaurant_id, name, description, price)
select id, 'Old Bay Dusted Fish & Chips', 'Beer battered haddock, B&B pickles, tartar sauce, lemon, french fries.', 28.00
from restaurants where osm_id = 679497101;
insert into menu_item_allergen_tags (menu_item_id, allergen_code, status)
select mi.id, v.code, v.status from menu_items mi join restaurants r on r.id = mi.restaurant_id
cross join (values ('fish','contains'),('gluten','contains'),('egg','may_contain'),('vegan','contains'),('vegetarian','contains')) as v(code, status)
where r.osm_id = 679497101 and mi.name = 'Old Bay Dusted Fish & Chips';

insert into menu_items (restaurant_id, name, description, price)
select id, '10 oz New York Strip Steak Frites', 'Spinach, frites, au poivre sauce.', 48.00
from restaurants where osm_id = 679497101;
insert into menu_item_allergen_tags (menu_item_id, allergen_code, status)
select mi.id, v.code, v.status from menu_items mi join restaurants r on r.id = mi.restaurant_id
cross join (values ('dairy','contains'),('vegan','contains'),('vegetarian','contains')) as v(code, status)
where r.osm_id = 679497101 and mi.name = '10 oz New York Strip Steak Frites';

-- =============================================================================
-- 3. Cafe Capriccio -- 49 Grand St, Albany, NY -- Italian
-- Source: https://www.allmenus.com/ny/albany/61701-cafe-capriccio/menu/
-- (cafecapriccio.com's own menu is image-only; allmenus mirrors its text)
-- =============================================================================
insert into restaurants (osm_id, name, description, description_source, reviewed_at)
values (1228524795, 'Cafe Capriccio', 'Longtime downtown Albany Italian restaurant serving authentic regional dishes, handmade pasta, and classic antipasti.', 'https://www.cafecapriccio.com/', '2026-09-24')
  on conflict (osm_id) do update set name = excluded.name, description = excluded.description, description_source = excluded.description_source, reviewed_at = excluded.reviewed_at;

insert into menu_items (restaurant_id, name, description, price)
select id, 'Eggplant with 4 Cheeses', 'Capriccio classic: lightly battered and light tomato sauce.', 13.00
from restaurants where osm_id = 1228524795;
insert into menu_item_allergen_tags (menu_item_id, allergen_code, status)
select mi.id, v.code, v.status from menu_items mi join restaurants r on r.id = mi.restaurant_id
cross join (values ('dairy','contains'),('gluten','contains'),('egg','may_contain'),('vegan','contains')) as v(code, status)
where r.osm_id = 1228524795 and mi.name = 'Eggplant with 4 Cheeses';

insert into menu_items (restaurant_id, name, description, price)
select id, 'Greens & Beans Passanante', 'Capriccio classic: escarole, white beans and pancetta.', 13.00
from restaurants where osm_id = 1228524795;
insert into menu_item_allergen_tags (menu_item_id, allergen_code, status)
select mi.id, v.code, v.status from menu_items mi join restaurants r on r.id = mi.restaurant_id
cross join (values ('vegan','contains'),('vegetarian','contains')) as v(code, status)
where r.osm_id = 1228524795 and mi.name = 'Greens & Beans Passanante';

insert into menu_items (restaurant_id, name, description, price)
select id, 'Roasted Meatballs', 'Local pork, beef & chicken with tomato sauce.', 12.00
from restaurants where osm_id = 1228524795;
insert into menu_item_allergen_tags (menu_item_id, allergen_code, status)
select mi.id, v.code, v.status from menu_items mi join restaurants r on r.id = mi.restaurant_id
cross join (values ('gluten','may_contain'),('egg','may_contain'),('vegan','contains'),('vegetarian','contains')) as v(code, status)
where r.osm_id = 1228524795 and mi.name = 'Roasted Meatballs';

insert into menu_items (restaurant_id, name, description, price)
select id, 'Ragu Napolitana', 'Homemade lumache pasta, local beef & pork slow cooked with tomato sauce & fresh herbs.', 20.00
from restaurants where osm_id = 1228524795;
insert into menu_item_allergen_tags (menu_item_id, allergen_code, status)
select mi.id, v.code, v.status from menu_items mi join restaurants r on r.id = mi.restaurant_id
cross join (values ('gluten','contains'),('egg','may_contain'),('vegan','contains'),('vegetarian','contains')) as v(code, status)
where r.osm_id = 1228524795 and mi.name = 'Ragu Napolitana';

insert into menu_items (restaurant_id, name, description, price)
select id, 'Shrimp and Calamari Fra Diavolo with Tagliatelle', 'Wild shrimp and calamari in a spicy tomato sauce.', 22.00
from restaurants where osm_id = 1228524795;
insert into menu_item_allergen_tags (menu_item_id, allergen_code, status)
select mi.id, v.code, v.status from menu_items mi join restaurants r on r.id = mi.restaurant_id
cross join (values ('shellfish','contains'),('gluten','contains'),('egg','may_contain'),('vegan','contains'),('vegetarian','contains')) as v(code, status)
where r.osm_id = 1228524795 and mi.name = 'Shrimp and Calamari Fra Diavolo with Tagliatelle';

insert into menu_items (restaurant_id, name, description, price)
select id, 'Handmade Ravioli with Spinach and Garlic', 'Tomato, basil, garlic cream.', 22.00
from restaurants where osm_id = 1228524795;
insert into menu_item_allergen_tags (menu_item_id, allergen_code, status)
select mi.id, v.code, v.status from menu_items mi join restaurants r on r.id = mi.restaurant_id
cross join (values ('dairy','contains'),('gluten','contains'),('egg','contains'),('vegan','contains')) as v(code, status)
where r.osm_id = 1228524795 and mi.name = 'Handmade Ravioli with Spinach and Garlic';

-- =============================================================================
-- 4. Viva Empanadas -- 90 N Pearl St, Albany, NY -- Latin American
-- Source: https://www.vivaempanadas.com/albanymenu
-- =============================================================================
insert into restaurants (osm_id, name, description, description_source, reviewed_at)
values (1404775814, 'Viva Empanadas', 'Latin American restaurant on North Pearl Street serving handcrafted empanadas in savory and sweet flavors, made to order and mixed-and-matched by the half dozen.', 'https://www.vivaempanadas.com/albanymenu', '2026-09-24')
  on conflict (osm_id) do update set name = excluded.name, description = excluded.description, description_source = excluded.description_source, reviewed_at = excluded.reviewed_at;

insert into menu_items (restaurant_id, name, description, price)
select id, 'Cubana Empanada', 'Corn, beef chuck, peppers, olives, capers, tomatoes, onions, cilantro.', 4.00
from restaurants where osm_id = 1404775814;
insert into menu_item_allergen_tags (menu_item_id, allergen_code, status)
select mi.id, v.code, v.status from menu_items mi join restaurants r on r.id = mi.restaurant_id
cross join (values ('gluten','contains'),('vegan','contains'),('vegetarian','contains')) as v(code, status)
where r.osm_id = 1404775814 and mi.name = 'Cubana Empanada';

insert into menu_items (restaurant_id, name, description, price)
select id, 'Spicy Chorizo Empanada', 'Yuca, Mexican chorizo, potato, and queso fresco.', 4.00
from restaurants where osm_id = 1404775814;
insert into menu_item_allergen_tags (menu_item_id, allergen_code, status)
select mi.id, v.code, v.status from menu_items mi join restaurants r on r.id = mi.restaurant_id
cross join (values ('dairy','contains'),('gluten','contains'),('vegan','contains'),('vegetarian','contains')) as v(code, status)
where r.osm_id = 1404775814 and mi.name = 'Spicy Chorizo Empanada';

insert into menu_items (restaurant_id, name, description, price)
select id, 'Veganlicious Empanada', 'Black beans, pinto beans, mushrooms, zucchini.', 4.00
from restaurants where osm_id = 1404775814;
insert into menu_item_allergen_tags (menu_item_id, allergen_code, status)
select mi.id, v.code, v.status from menu_items mi join restaurants r on r.id = mi.restaurant_id
cross join (values ('gluten','contains'),('vegan','safe'),('vegetarian','safe')) as v(code, status)
where r.osm_id = 1404775814 and mi.name = 'Veganlicious Empanada';

insert into menu_items (restaurant_id, name, description, price)
select id, 'Empanada de Pino', 'Top sirloin beef.', 4.00
from restaurants where osm_id = 1404775814;
insert into menu_item_allergen_tags (menu_item_id, allergen_code, status)
select mi.id, v.code, v.status from menu_items mi join restaurants r on r.id = mi.restaurant_id
cross join (values ('gluten','contains'),('vegan','contains'),('vegetarian','contains')) as v(code, status)
where r.osm_id = 1404775814 and mi.name = 'Empanada de Pino';

insert into menu_items (restaurant_id, name, description, price)
select id, 'Guava-Cheese Empanada', 'Sweet empanada filled with guava paste and cheese.', 4.00
from restaurants where osm_id = 1404775814;
insert into menu_item_allergen_tags (menu_item_id, allergen_code, status)
select mi.id, v.code, v.status from menu_items mi join restaurants r on r.id = mi.restaurant_id
cross join (values ('dairy','contains'),('gluten','contains'),('vegan','contains'),('vegetarian','safe')) as v(code, status)
where r.osm_id = 1404775814 and mi.name = 'Guava-Cheese Empanada';

insert into menu_items (restaurant_id, name, description, price)
select id, 'Nutella-Banana Empanada', 'Sweet empanada filled with Nutella and banana.', 4.00
from restaurants where osm_id = 1404775814;
insert into menu_item_allergen_tags (menu_item_id, allergen_code, status)
select mi.id, v.code, v.status from menu_items mi join restaurants r on r.id = mi.restaurant_id
cross join (values ('dairy','contains'),('tree_nut','contains'),('gluten','contains'),('vegan','contains'),('vegetarian','safe')) as v(code, status)
where r.osm_id = 1404775814 and mi.name = 'Nutella-Banana Empanada';

-- =============================================================================
-- 5. Mystic Momo -- 40 Central Ave, Albany, NY -- Nepalese
-- Sources: https://www.timesunion.com/food/article/mystic-momo-nepalese-dumpling-albany-review-19630573.php ,
-- https://www.facebook.com/themysticmomo/ (menu photos). Prices are not
-- published on a stable text page (delivery-platform listings blocked
-- automated fetch), so item prices are null here.
-- =============================================================================
insert into restaurants (osm_id, name, description, description_source, reviewed_at)
values (1469590183, 'Mystic Momo', 'Nepalese restaurant on Central Avenue specializing in hand-crafted momo dumplings (steamed, fried, or in soup) with a range of fillings, opened in 2024.', 'https://www.timesunion.com/food/article/mystic-momo-nepalese-dumpling-albany-review-19630573.php', '2026-09-24')
  on conflict (osm_id) do update set name = excluded.name, description = excluded.description, description_source = excluded.description_source, reviewed_at = excluded.reviewed_at;

insert into menu_items (restaurant_id, name, description, price)
select id, 'Chicken Momo', 'Steamed or fried dumplings filled with halal chicken, served with chutney.', null
from restaurants where osm_id = 1469590183;
insert into menu_item_allergen_tags (menu_item_id, allergen_code, status)
select mi.id, v.code, v.status from menu_items mi join restaurants r on r.id = mi.restaurant_id
cross join (values ('gluten','contains'),('vegan','contains'),('vegetarian','contains')) as v(code, status)
where r.osm_id = 1469590183 and mi.name = 'Chicken Momo';

insert into menu_items (restaurant_id, name, description, price)
select id, 'Beef Momo', 'Steamed or fried dumplings filled with halal beef, served with chutney.', null
from restaurants where osm_id = 1469590183;
insert into menu_item_allergen_tags (menu_item_id, allergen_code, status)
select mi.id, v.code, v.status from menu_items mi join restaurants r on r.id = mi.restaurant_id
cross join (values ('gluten','contains'),('vegan','contains'),('vegetarian','contains')) as v(code, status)
where r.osm_id = 1469590183 and mi.name = 'Beef Momo';

insert into menu_items (restaurant_id, name, description, price)
select id, 'Pork Momo', 'Steamed or fried dumplings filled with pork, served with chutney.', null
from restaurants where osm_id = 1469590183;
insert into menu_item_allergen_tags (menu_item_id, allergen_code, status)
select mi.id, v.code, v.status from menu_items mi join restaurants r on r.id = mi.restaurant_id
cross join (values ('gluten','contains'),('vegan','contains'),('vegetarian','contains')) as v(code, status)
where r.osm_id = 1469590183 and mi.name = 'Pork Momo';

insert into menu_items (restaurant_id, name, description, price)
select id, 'Chives Momo', 'Steamed or fried dumplings filled with chives, served with chutney.', null
from restaurants where osm_id = 1469590183;
insert into menu_item_allergen_tags (menu_item_id, allergen_code, status)
select mi.id, v.code, v.status from menu_items mi join restaurants r on r.id = mi.restaurant_id
cross join (values ('gluten','contains'),('vegetarian','safe')) as v(code, status)
where r.osm_id = 1469590183 and mi.name = 'Chives Momo';

insert into menu_items (restaurant_id, name, description, price)
select id, 'Mushroom Momo', 'Steamed or fried dumplings filled with mushroom, served with chutney.', null
from restaurants where osm_id = 1469590183;
insert into menu_item_allergen_tags (menu_item_id, allergen_code, status)
select mi.id, v.code, v.status from menu_items mi join restaurants r on r.id = mi.restaurant_id
cross join (values ('gluten','contains'),('vegetarian','safe')) as v(code, status)
where r.osm_id = 1469590183 and mi.name = 'Mushroom Momo';

insert into menu_items (restaurant_id, name, description, price)
select id, 'Paneer Momo', 'Steamed or fried dumplings filled with paneer cheese, served with chutney.', null
from restaurants where osm_id = 1469590183;
insert into menu_item_allergen_tags (menu_item_id, allergen_code, status)
select mi.id, v.code, v.status from menu_items mi join restaurants r on r.id = mi.restaurant_id
cross join (values ('dairy','contains'),('gluten','contains'),('vegan','contains'),('vegetarian','safe')) as v(code, status)
where r.osm_id = 1469590183 and mi.name = 'Paneer Momo';
