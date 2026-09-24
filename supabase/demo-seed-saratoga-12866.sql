-- Safe Bites demo seed data: 5 real restaurants near zip 12866 (downtown
-- Saratoga Springs, NY), discovered live via the same OpenStreetMap Overpass
-- query the app itself uses.
--
-- Menu items and allergen tags below are researched from each restaurant's
-- actual published menu (website, or an aggregator mirroring it) as of
-- 2026-09-24, with conservative best-effort allergen calls -- NOT verified
-- directly with kitchen staff. This is demo/hackathon seed data illustrating
-- the app's intended data model (ADR-0002's hybrid manual-seeding approach),
-- not a production food-safety guarantee. See each restaurant's block below
-- for its source URL(s). A missing allergen tag means "unknown", not "safe".
--
-- Prices are null where the restaurant does not publish them online (Sushi
-- Thai Garden's main-menu page lists descriptions but no prices).
--
-- Restaurants considered but NOT seeded here: from the candidate list, Boca
-- Bistro's printable dinner PDF could not be parsed for itemized text and its
-- allmenus.com listing resolved to an unrelated Austin, TX restaurant, so it
-- was dropped in favor of Sara's Kitchen, whose own site has a clean itemized
-- menu with prices. All other candidates were not researched once 5 usable
-- restaurants (a mix of Southern, Northern Italian, Japanese/Thai, New
-- American, and Middle Eastern) were confirmed.
--
-- Run this AFTER 0001_initial_schema.sql and 0002_seed_allergens.sql.
-- Safe to re-run: restaurants are upserted by osm_id, and the preamble below
-- clears this file's menu_items (tags cascade) before re-inserting them, so a
-- second run replaces rather than duplicates. Ratings are never touched.

delete from menu_items
where restaurant_id in (
  select id from restaurants
  where osm_id in (319935639, 8790812003, 319935641, 1574606220, 8405000130)
);

-- =============================================================================
-- 1. Hattie's -- 45 Phila St, Saratoga Springs, NY -- Southern / soul food
-- Source: https://www.allmenus.com/ny/saratoga-springs/678954-hatties-restaurant/menu/
-- (mirrors hattiesrestaurants.com's own published menu, including its
-- Vegetarian Items and Gluten-Free Items groupings)
-- =============================================================================
insert into restaurants (osm_id, name, description, description_source, reviewed_at)
values (319935639, 'Hattie''s', 'Saratoga Springs soul-food institution dating to 1938, known for its award-winning Southern fried chicken, jambalaya, and scratch-made Southern sides.', 'https://www.allmenus.com/ny/saratoga-springs/678954-hatties-restaurant/menu/', '2026-09-24')
  on conflict (osm_id) do update set name = excluded.name, description = excluded.description, description_source = excluded.description_source, reviewed_at = excluded.reviewed_at;

insert into menu_items (restaurant_id, name, description, price)
select id, 'Hush Puppies', 'Cornmeal fritters with onions and fresh corn.', 8.95
from restaurants where osm_id = 319935639;
insert into menu_item_allergen_tags (menu_item_id, allergen_code, status)
select mi.id, v.code, v.status from menu_items mi join restaurants r on r.id = mi.restaurant_id
cross join (values ('gluten','contains'),('vegetarian','safe')) as v(code, status)
where r.osm_id = 319935639 and mi.name = 'Hush Puppies';

insert into menu_items (restaurant_id, name, description, price)
select id, 'Fried Green Tomatoes', 'Served with dill ranch dipping sauce.', 10.95
from restaurants where osm_id = 319935639;
insert into menu_item_allergen_tags (menu_item_id, allergen_code, status)
select mi.id, v.code, v.status from menu_items mi join restaurants r on r.id = mi.restaurant_id
cross join (values ('gluten','contains'),('dairy','contains'),('vegetarian','safe')) as v(code, status)
where r.osm_id = 319935639 and mi.name = 'Fried Green Tomatoes';

insert into menu_items (restaurant_id, name, description, price)
select id, 'Hattie''s House Salad', 'Spring mix with tomato and cucumbers.', 6.95
from restaurants where osm_id = 319935639;
insert into menu_item_allergen_tags (menu_item_id, allergen_code, status)
select mi.id, v.code, v.status from menu_items mi join restaurants r on r.id = mi.restaurant_id
cross join (values ('gluten','safe'),('vegetarian','safe')) as v(code, status)
where r.osm_id = 319935639 and mi.name = 'Hattie''s House Salad';

insert into menu_items (restaurant_id, name, description, price)
select id, 'Red Beans & Rice (Small)', 'Slow-cooked red beans and Carolina rice.', 13.95
from restaurants where osm_id = 319935639;
insert into menu_item_allergen_tags (menu_item_id, allergen_code, status)
select mi.id, v.code, v.status from menu_items mi join restaurants r on r.id = mi.restaurant_id
cross join (values ('gluten','safe'),('vegetarian','safe')) as v(code, status)
where r.osm_id = 319935639 and mi.name = 'Red Beans & Rice (Small)';

insert into menu_items (restaurant_id, name, description, price)
select id, 'Jambalaya (Small)', 'Slow-cooked Southern jambalaya.', 13.95
from restaurants where osm_id = 319935639;
insert into menu_item_allergen_tags (menu_item_id, allergen_code, status)
select mi.id, v.code, v.status from menu_items mi join restaurants r on r.id = mi.restaurant_id
cross join (values ('gluten','safe'),('vegetarian','contains')) as v(code, status)
where r.osm_id = 319935639 and mi.name = 'Jambalaya (Small)';

insert into menu_items (restaurant_id, name, description, price)
select id, 'Hattie''s Famous Fried Chicken (Large Plate)', 'One white and one dark piece of chicken with a choice of two sides.', null
from restaurants where osm_id = 319935639;
insert into menu_item_allergen_tags (menu_item_id, allergen_code, status)
select mi.id, v.code, v.status from menu_items mi join restaurants r on r.id = mi.restaurant_id
cross join (values ('gluten','contains'),('vegan','contains'),('vegetarian','contains')) as v(code, status)
where r.osm_id = 319935639 and mi.name = 'Hattie''s Famous Fried Chicken (Large Plate)';

-- =============================================================================
-- 2. Chianti Ristorante -- 18 Division St, Saratoga Springs, NY -- Northern Italian
-- Source: https://www.yelp.com/menu/chianti-ristorante-saratoga-springs/dinner-menu
-- (mirrors chiantiristorante.com's own dinner menu)
-- =============================================================================
insert into restaurants (osm_id, name, description, description_source, reviewed_at)
values (8790812003, 'Chianti Ristorante', 'Elegant downtown Saratoga Springs restaurant serving sophisticated Northern Italian fare: house-made pastas, carpacci, dry-aged steaks, and fresh seafood.', 'https://www.yelp.com/menu/chianti-ristorante-saratoga-springs/dinner-menu', '2026-09-24')
  on conflict (osm_id) do update set name = excluded.name, description = excluded.description, description_source = excluded.description_source, reviewed_at = excluded.reviewed_at;

insert into menu_items (restaurant_id, name, description, price)
select id, 'Calamaretti Fritti', 'Fried calamari, delicately spiced tomato sauce.', 19.00
from restaurants where osm_id = 8790812003;
insert into menu_item_allergen_tags (menu_item_id, allergen_code, status)
select mi.id, v.code, v.status from menu_items mi join restaurants r on r.id = mi.restaurant_id
cross join (values ('shellfish','contains'),('gluten','contains'),('vegan','contains'),('vegetarian','contains')) as v(code, status)
where r.osm_id = 8790812003 and mi.name = 'Calamaretti Fritti';

insert into menu_items (restaurant_id, name, description, price)
select id, 'Bufala Caprese', 'Imported mozzarella di bufala, heirloom tomatoes, prosciutto, basil oil.', 25.00
from restaurants where osm_id = 8790812003;
insert into menu_item_allergen_tags (menu_item_id, allergen_code, status)
select mi.id, v.code, v.status from menu_items mi join restaurants r on r.id = mi.restaurant_id
cross join (values ('dairy','contains'),('vegan','contains'),('vegetarian','contains')) as v(code, status)
where r.osm_id = 8790812003 and mi.name = 'Bufala Caprese';

insert into menu_items (restaurant_id, name, description, price)
select id, 'B&B', 'Whipped burrata, slow roasted beets, cilantro pesto, toasted salted pepitas.', 19.00
from restaurants where osm_id = 8790812003;
insert into menu_item_allergen_tags (menu_item_id, allergen_code, status)
select mi.id, v.code, v.status from menu_items mi join restaurants r on r.id = mi.restaurant_id
cross join (values ('dairy','contains'),('vegan','contains')) as v(code, status)
where r.osm_id = 8790812003 and mi.name = 'B&B';

insert into menu_items (restaurant_id, name, description, price)
select id, 'Tagliatelle Bolognese', 'Handmade fettuccine with traditional Northern Italian beef ragu.', 27.00
from restaurants where osm_id = 8790812003;
insert into menu_item_allergen_tags (menu_item_id, allergen_code, status)
select mi.id, v.code, v.status from menu_items mi join restaurants r on r.id = mi.restaurant_id
cross join (values ('gluten','contains'),('vegan','contains'),('vegetarian','contains')) as v(code, status)
where r.osm_id = 8790812003 and mi.name = 'Tagliatelle Bolognese';

insert into menu_items (restaurant_id, name, description, price)
select id, 'Spaghetti Ai Frutti Di Mare', 'Thin spaghetti, assorted seafood, olive oil, garlic, lightly spiced tomato sauce.', 37.00
from restaurants where osm_id = 8790812003;
insert into menu_item_allergen_tags (menu_item_id, allergen_code, status)
select mi.id, v.code, v.status from menu_items mi join restaurants r on r.id = mi.restaurant_id
cross join (values ('shellfish','contains'),('fish','contains'),('gluten','contains'),('vegan','contains'),('vegetarian','contains')) as v(code, status)
where r.osm_id = 8790812003 and mi.name = 'Spaghetti Ai Frutti Di Mare';

insert into menu_items (restaurant_id, name, description, price)
select id, 'Risotto Con Funghi e Ceci', 'Mixed mushrooms, young garbanzos, Grana Padano.', 30.00
from restaurants where osm_id = 8790812003;
insert into menu_item_allergen_tags (menu_item_id, allergen_code, status)
select mi.id, v.code, v.status from menu_items mi join restaurants r on r.id = mi.restaurant_id
cross join (values ('dairy','contains')) as v(code, status)
where r.osm_id = 8790812003 and mi.name = 'Risotto Con Funghi e Ceci';

-- =============================================================================
-- 3. Sushi Thai Garden -- 44-46 Phila St, Saratoga Springs, NY -- Japanese / Thai
-- Source: https://www.sushithaigardensaratoga.com/main-menu
-- =============================================================================
insert into restaurants (osm_id, name, description, description_source, reviewed_at)
values (319935641, 'Sushi Thai Garden', 'Phila Street sushi bar and Thai kitchen offering fresh sushi and sashimi alongside Thai classics, plus a dedicated Vegetarian Corner section.', 'https://www.sushithaigardensaratoga.com/main-menu', '2026-09-24')
  on conflict (osm_id) do update set name = excluded.name, description = excluded.description, description_source = excluded.description_source, reviewed_at = excluded.reviewed_at;

insert into menu_items (restaurant_id, name, description, price)
select id, 'Edamame', 'Steamed soybean, lightly salted.', null
from restaurants where osm_id = 319935641;
insert into menu_item_allergen_tags (menu_item_id, allergen_code, status)
select mi.id, v.code, v.status from menu_items mi join restaurants r on r.id = mi.restaurant_id
cross join (values ('soy','contains')) as v(code, status)
where r.osm_id = 319935641 and mi.name = 'Edamame';

insert into menu_items (restaurant_id, name, description, price)
select id, 'Thai Spring Rolls', 'Crispy egg rolls, Thai style, served with homemade sweet and sour sauce.', null
from restaurants where osm_id = 319935641;
insert into menu_item_allergen_tags (menu_item_id, allergen_code, status)
select mi.id, v.code, v.status from menu_items mi join restaurants r on r.id = mi.restaurant_id
cross join (values ('gluten','contains'),('egg','contains')) as v(code, status)
where r.osm_id = 319935641 and mi.name = 'Thai Spring Rolls';

insert into menu_items (restaurant_id, name, description, price)
select id, 'Pork Dumplings', 'Steamed or fried minced pork dumpling, served with ginger sauce.', null
from restaurants where osm_id = 319935641;
insert into menu_item_allergen_tags (menu_item_id, allergen_code, status)
select mi.id, v.code, v.status from menu_items mi join restaurants r on r.id = mi.restaurant_id
cross join (values ('gluten','contains'),('vegan','contains'),('vegetarian','contains')) as v(code, status)
where r.osm_id = 319935641 and mi.name = 'Pork Dumplings';

insert into menu_items (restaurant_id, name, description, price)
select id, 'Chicken Satay', 'Charcoal grilled chicken with peanut and cucumber sauces.', null
from restaurants where osm_id = 319935641;
insert into menu_item_allergen_tags (menu_item_id, allergen_code, status)
select mi.id, v.code, v.status from menu_items mi join restaurants r on r.id = mi.restaurant_id
cross join (values ('peanut','contains'),('vegan','contains'),('vegetarian','contains')) as v(code, status)
where r.osm_id = 319935641 and mi.name = 'Chicken Satay';

insert into menu_items (restaurant_id, name, description, price)
select id, 'Vegetarian Pad Thai', 'Stir-fried Thai rice noodles with fried tofu, garden vegetables, egg, and crushed peanuts.', null
from restaurants where osm_id = 319935641;
insert into menu_item_allergen_tags (menu_item_id, allergen_code, status)
select mi.id, v.code, v.status from menu_items mi join restaurants r on r.id = mi.restaurant_id
cross join (values ('peanut','contains'),('egg','contains'),('soy','contains'),('vegan','contains'),('vegetarian','safe')) as v(code, status)
where r.osm_id = 319935641 and mi.name = 'Vegetarian Pad Thai';

insert into menu_items (restaurant_id, name, description, price)
select id, 'Thai Garden Salad', 'Fried tofu and sliced boiled egg on a bed of fresh vegetables.', null
from restaurants where osm_id = 319935641;
insert into menu_item_allergen_tags (menu_item_id, allergen_code, status)
select mi.id, v.code, v.status from menu_items mi join restaurants r on r.id = mi.restaurant_id
cross join (values ('egg','contains'),('soy','contains')) as v(code, status)
where r.osm_id = 319935641 and mi.name = 'Thai Garden Salad';

-- =============================================================================
-- 4. Scallions -- 44 Lake Ave, Saratoga Springs, NY -- New American cafe
-- Source: https://scallionsrestaurant.com/saratoga-springs-scallions-food-menu
-- =============================================================================
insert into restaurants (osm_id, name, description, description_source, reviewed_at)
values (1574606220, 'Scallions', 'Lake Avenue cafe known for scratch-made soups, panini, and composed salads, with a full lineup of items the menu itself marks gluten-free (GF) and vegetarian (VG).', 'https://scallionsrestaurant.com/saratoga-springs-scallions-food-menu', '2026-09-24')
  on conflict (osm_id) do update set name = excluded.name, description = excluded.description, description_source = excluded.description_source, reviewed_at = excluded.reviewed_at;

insert into menu_items (restaurant_id, name, description, price)
select id, 'Fried Green Tomatoes', 'With sweet sriracha dipping sauce.', 14.00
from restaurants where osm_id = 1574606220;
insert into menu_item_allergen_tags (menu_item_id, allergen_code, status)
select mi.id, v.code, v.status from menu_items mi join restaurants r on r.id = mi.restaurant_id
cross join (values ('gluten','contains'),('vegetarian','safe')) as v(code, status)
where r.osm_id = 1574606220 and mi.name = 'Fried Green Tomatoes';

insert into menu_items (restaurant_id, name, description, price)
select id, 'Falafel', 'With sweet Thai chili sauce.', 12.00
from restaurants where osm_id = 1574606220;
insert into menu_item_allergen_tags (menu_item_id, allergen_code, status)
select mi.id, v.code, v.status from menu_items mi join restaurants r on r.id = mi.restaurant_id
cross join (values ('gluten','safe'),('vegetarian','safe')) as v(code, status)
where r.osm_id = 1574606220 and mi.name = 'Falafel';

insert into menu_items (restaurant_id, name, description, price)
select id, 'Hummus with Grilled Naan', null, 12.00
from restaurants where osm_id = 1574606220;
insert into menu_item_allergen_tags (menu_item_id, allergen_code, status)
select mi.id, v.code, v.status from menu_items mi join restaurants r on r.id = mi.restaurant_id
cross join (values ('gluten','contains'),('sesame','contains'),('vegetarian','safe')) as v(code, status)
where r.osm_id = 1574606220 and mi.name = 'Hummus with Grilled Naan';

insert into menu_items (restaurant_id, name, description, price)
select id, 'Tofu Slaw Salad', 'Veggie slaw with sunflower seeds tossed in a honey-lime tahini dressing, topped with grilled tofu.', 17.00
from restaurants where osm_id = 1574606220;
insert into menu_item_allergen_tags (menu_item_id, allergen_code, status)
select mi.id, v.code, v.status from menu_items mi join restaurants r on r.id = mi.restaurant_id
cross join (values ('gluten','safe'),('soy','contains'),('sesame','contains'),('vegetarian','safe')) as v(code, status)
where r.osm_id = 1574606220 and mi.name = 'Tofu Slaw Salad';

insert into menu_items (restaurant_id, name, description, price)
select id, 'Southwestern Quinoa Salad', 'Quinoa, roasted corn, poblano peppers, black beans, avocado.', 17.00
from restaurants where osm_id = 1574606220;
insert into menu_item_allergen_tags (menu_item_id, allergen_code, status)
select mi.id, v.code, v.status from menu_items mi join restaurants r on r.id = mi.restaurant_id
cross join (values ('gluten','safe'),('vegetarian','safe')) as v(code, status)
where r.osm_id = 1574606220 and mi.name = 'Southwestern Quinoa Salad';

insert into menu_items (restaurant_id, name, description, price)
select id, 'Vegan Fried Rice', null, 30.00
from restaurants where osm_id = 1574606220;
insert into menu_item_allergen_tags (menu_item_id, allergen_code, status)
select mi.id, v.code, v.status from menu_items mi join restaurants r on r.id = mi.restaurant_id
cross join (values ('gluten','safe'),('soy','contains'),('vegan','safe'),('vegetarian','safe')) as v(code, status)
where r.osm_id = 1574606220 and mi.name = 'Vegan Fried Rice';

-- =============================================================================
-- 5. Sara's Kitchen -- 419 Broadway, Saratoga Springs, NY -- Middle Eastern
-- Source: https://saraskitchen518.com/menu
-- =============================================================================
insert into restaurants (osm_id, name, description, description_source, reviewed_at)
values (8405000130, 'Sara''s Kitchen', 'Broadway restaurant serving authentic Levantine mezze, shawarma wraps, and grilled skewers, with a gluten-free chip substitute offered for most dishes.', 'https://saraskitchen518.com/menu', '2026-09-24')
  on conflict (osm_id) do update set name = excluded.name, description = excluded.description, description_source = excluded.description_source, reviewed_at = excluded.reviewed_at;

insert into menu_items (restaurant_id, name, description, price)
select id, 'Lentil Soup', 'Red split lentil soup, spiced with cumin and coriander, tossed with vermicelli.', 11.00
from restaurants where osm_id = 8405000130;
insert into menu_item_allergen_tags (menu_item_id, allergen_code, status)
select mi.id, v.code, v.status from menu_items mi join restaurants r on r.id = mi.restaurant_id
cross join (values ('gluten','contains')) as v(code, status)
where r.osm_id = 8405000130 and mi.name = 'Lentil Soup';

insert into menu_items (restaurant_id, name, description, price)
select id, 'Hummus', 'Creamy chickpea blend with tahini and lime juice, drizzled with extra virgin olive oil.', 16.50
from restaurants where osm_id = 8405000130;
insert into menu_item_allergen_tags (menu_item_id, allergen_code, status)
select mi.id, v.code, v.status from menu_items mi join restaurants r on r.id = mi.restaurant_id
cross join (values ('sesame','contains')) as v(code, status)
where r.osm_id = 8405000130 and mi.name = 'Hummus';

insert into menu_items (restaurant_id, name, description, price)
select id, 'Muhammara', 'Roasted red peppers, walnuts, and pomegranate molasses.', 17.60
from restaurants where osm_id = 8405000130;
insert into menu_item_allergen_tags (menu_item_id, allergen_code, status)
select mi.id, v.code, v.status from menu_items mi join restaurants r on r.id = mi.restaurant_id
cross join (values ('tree_nut','contains')) as v(code, status)
where r.osm_id = 8405000130 and mi.name = 'Muhammara';

insert into menu_items (restaurant_id, name, description, price)
select id, 'Stuffed Grape Leaves', 'Tender grape leaves stuffed with an authentic Egyptian rice and herb mix.', 15.00
from restaurants where osm_id = 8405000130;
insert into menu_item_allergen_tags (menu_item_id, allergen_code, status)
select mi.id, v.code, v.status from menu_items mi join restaurants r on r.id = mi.restaurant_id
cross join (values ('vegan','contains'),('vegetarian','contains')) as v(code, status)
where r.osm_id = 8405000130 and mi.name = 'Stuffed Grape Leaves';

insert into menu_items (restaurant_id, name, description, price)
select id, 'Chicken Shawarma Wrap', 'Roasted chicken with cornichons, french fries, and toum.', 19.80
from restaurants where osm_id = 8405000130;
insert into menu_item_allergen_tags (menu_item_id, allergen_code, status)
select mi.id, v.code, v.status from menu_items mi join restaurants r on r.id = mi.restaurant_id
cross join (values ('gluten','contains'),('vegan','contains'),('vegetarian','contains')) as v(code, status)
where r.osm_id = 8405000130 and mi.name = 'Chicken Shawarma Wrap';

insert into menu_items (restaurant_id, name, description, price)
select id, 'Gluten-Free Chips', null, 4.40
from restaurants where osm_id = 8405000130;
insert into menu_item_allergen_tags (menu_item_id, allergen_code, status)
select mi.id, v.code, v.status from menu_items mi join restaurants r on r.id = mi.restaurant_id
cross join (values ('gluten','safe')) as v(code, status)
where r.osm_id = 8405000130 and mi.name = 'Gluten-Free Chips';
