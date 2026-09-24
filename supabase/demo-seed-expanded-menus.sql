-- Safe Bites demo seed data: expanded menus for two already-seeded restaurants.
-- Run this AFTER demo-seed-schenectady-12305.sql AND
-- demo-seed-schenectady-12305-batch2.sql (both must have run first so the
-- restaurants exist). This file only ADDS new menu items to those two
-- restaurants; it never touches the original seed items from batch 1/2.
--
-- Restaurants expanded:
--   1. Ninety Nine Restaurant & Pub (osm_id 1674094952) -- national chain,
--      Niskayuna, NY location. Source: https://order.99restaurants.com/65398/menu/
--      (live online-ordering menu for that location; same source cited in
--      demo-seed-schenectady-12305-batch2.sql for this restaurant's original
--      6 items). No official 99 Restaurants allergen/nutrition guide could be
--      retrieved (the published allergen PDF returned 404 and Nutritionix's
--      allergen wizard is paywalled), so allergen tags here are conservative
--      best-effort calls made ONLY from each item's own published
--      description/name -- e.g. a dish described with cheese is tagged dairy
--      'contains'. Nothing is tagged 'safe' in this file: without an explicit
--      "does not contain" style source, an unmentioned allergen is left
--      untagged (shown as unknown in the app) rather than guessed as safe.
--   2. Stella Pasta Bar and Bistro (osm_id 3872013358) -- 237 Union St,
--      Schenectady, NY. Source: https://stellapastabar.com/menu (dinner menu).
--      Chosen as the second restaurant over Hunan Wok Chinese Restaurant and
--      Tandoori House because its published menu has full descriptive text
--      for nearly every dish, while Hunan Wok's page redirects to an
--      online-ordering system and Tandoori House's menu is mostly bare
--      name+price with few descriptions -- Stella gives the most real,
--      non-fabricated detail to seed from. Same allergen approach as above:
--      conservative 'contains' calls from the published description/name
--      only, nothing marked 'safe'.
--
-- Researched 2026-09-24. Not verified directly with kitchen staff -- this is
-- demo/hackathon seed data illustrating the app's intended data model, not a
-- production food-safety guarantee.
--
-- Safe to re-run: the delete below removes only the specific (restaurant,
-- item name) pairs this file adds, so re-running replaces them without
-- touching the original batch 1/2 seed items or any other restaurant.

delete from menu_item_allergen_tags
where menu_item_id in (
  select mi.id
  from menu_items mi
  join restaurants r on r.id = mi.restaurant_id
  where r.osm_id in (1674094952, 3872013358)
    and mi.name in (
      'Chicken Fajita Flatbread', 'Big Bar Pretzel', 'Classic Potato Skins',
      'Vermont Cheddar Chicken Sandwich', 'Bourbon Onion Burger', 'Cheese Burger',
      'Baked Haddock', 'Seasoned Salmon', 'Fish & Chips', 'Baby Back BBQ Ribs',
      'Top Sirloin Steak', 'Chicken Parmigiana', 'Grilled Balsamic Chicken',
      'Caesar Salad', 'Signature House Salad', 'Sweet Potato Fries',
      'Cheese Quesadilla', 'Macaroni & Cheese', 'Little Midnight Fudge Hero Sundae',
      'Strawberry & Mango Cheesecake',
      'Broccoli Rabe & Italian Sausage', 'Eggplant Stack', 'Bruschetta',
      'Sweet Corn Fritters', 'Stella Salad', 'Mediterranean Shrimp Salad',
      'Chef''s BBQ Burger', 'Chicken Parmesan Submarine', 'Meatball Parmesan Submarine',
      'Short Rib Ravioli', 'Chicken Parmesan', 'Chicken Francese', 'Chicken Marsala',
      'Eggplant Parmesan', 'Shrimp Genovese', 'Blue Crab Tagliatelle',
      'Chef''s Specialty Meatballs (3)', 'Crispy French Fries', 'Sauteed Broccoli'
    )
);

delete from menu_items
where restaurant_id in (
  select id from restaurants where osm_id in (1674094952, 3872013358)
)
and name in (
  'Chicken Fajita Flatbread', 'Big Bar Pretzel', 'Classic Potato Skins',
  'Vermont Cheddar Chicken Sandwich', 'Bourbon Onion Burger', 'Cheese Burger',
  'Baked Haddock', 'Seasoned Salmon', 'Fish & Chips', 'Baby Back BBQ Ribs',
  'Top Sirloin Steak', 'Chicken Parmigiana', 'Grilled Balsamic Chicken',
  'Caesar Salad', 'Signature House Salad', 'Sweet Potato Fries',
  'Cheese Quesadilla', 'Macaroni & Cheese', 'Little Midnight Fudge Hero Sundae',
  'Strawberry & Mango Cheesecake',
  'Broccoli Rabe & Italian Sausage', 'Eggplant Stack', 'Bruschetta',
  'Sweet Corn Fritters', 'Stella Salad', 'Mediterranean Shrimp Salad',
  'Chef''s BBQ Burger', 'Chicken Parmesan Submarine', 'Meatball Parmesan Submarine',
  'Short Rib Ravioli', 'Chicken Parmesan', 'Chicken Francese', 'Chicken Marsala',
  'Eggplant Parmesan', 'Shrimp Genovese', 'Blue Crab Tagliatelle',
  'Chef''s Specialty Meatballs (3)', 'Crispy French Fries', 'Sauteed Broccoli'
);

-- =============================================================================
-- 1. Ninety Nine Restaurant & Pub -- 20 additional items
-- Source: https://order.99restaurants.com/65398/menu/
-- =============================================================================

insert into menu_items (restaurant_id, name, description, price)
select id, 'Chicken Fajita Flatbread', 'Crisp flatbread glazed with queso and topped with fajita spiced grilled chicken, sauteed onions, peppers and Monterey Jack and cheddar cheeses. Topped with fresh pico de gallo, chopped cilantro and chipotle sauce.', 13.29
from restaurants where osm_id = 1674094952;
insert into menu_item_allergen_tags (menu_item_id, allergen_code, status)
select mi.id, v.code, v.status from menu_items mi join restaurants r on r.id = mi.restaurant_id
cross join (values ('gluten','contains'),('dairy','contains'),('vegetarian','contains'),('vegan','contains')) as v(code, status)
where r.osm_id = 1674094952 and mi.name = 'Chicken Fajita Flatbread';

insert into menu_items (restaurant_id, name, description, price)
select id, 'Big Bar Pretzel', 'A giant freshly baked, salted Bavarian pretzel. Served with warm queso sauce.', 13.49
from restaurants where osm_id = 1674094952;
insert into menu_item_allergen_tags (menu_item_id, allergen_code, status)
select mi.id, v.code, v.status from menu_items mi join restaurants r on r.id = mi.restaurant_id
cross join (values ('gluten','contains'),('dairy','contains'),('vegan','contains')) as v(code, status)
where r.osm_id = 1674094952 and mi.name = 'Big Bar Pretzel';

insert into menu_items (restaurant_id, name, description, price)
select id, 'Classic Potato Skins', 'Melted Monterey Jack and cheddar cheeses and applewood smoked bacon layered on top of crispy potato skins. Served with sour cream.', 12.89
from restaurants where osm_id = 1674094952;
insert into menu_item_allergen_tags (menu_item_id, allergen_code, status)
select mi.id, v.code, v.status from menu_items mi join restaurants r on r.id = mi.restaurant_id
cross join (values ('dairy','contains'),('vegetarian','contains'),('vegan','contains')) as v(code, status)
where r.osm_id = 1674094952 and mi.name = 'Classic Potato Skins';

insert into menu_items (restaurant_id, name, description, price)
select id, 'Vermont Cheddar Chicken Sandwich', 'Grilled chicken breast topped with Cabot Vermont Cheddar cheese, caramelized onions, applewood smoked bacon and real Vermont maple mayonnaise stacked with lettuce, tomato and pickles. Served on a brioche bun with one side.', 15.49
from restaurants where osm_id = 1674094952;
insert into menu_item_allergen_tags (menu_item_id, allergen_code, status)
select mi.id, v.code, v.status from menu_items mi join restaurants r on r.id = mi.restaurant_id
cross join (values ('gluten','contains'),('dairy','contains'),('egg','contains'),('vegetarian','contains'),('vegan','contains')) as v(code, status)
where r.osm_id = 1674094952 and mi.name = 'Vermont Cheddar Chicken Sandwich';

insert into menu_items (restaurant_id, name, description, price)
select id, 'Bourbon Onion Burger', 'A 1/2 pound 100% American Angus beef burger with melted American cheese topped with a caramelized onion bourbon jam. Served on a brioche bun with one side.', 18.69
from restaurants where osm_id = 1674094952;
insert into menu_item_allergen_tags (menu_item_id, allergen_code, status)
select mi.id, v.code, v.status from menu_items mi join restaurants r on r.id = mi.restaurant_id
cross join (values ('gluten','contains'),('dairy','contains'),('vegetarian','contains'),('vegan','contains')) as v(code, status)
where r.osm_id = 1674094952 and mi.name = 'Bourbon Onion Burger';

insert into menu_items (restaurant_id, name, description, price)
select id, 'Cheese Burger', 'A classic 1/2 pound 100% American Angus beef burger with American cheese. Also available with Vermont Cheddar or Swiss. Served on a brioche bun with choice of one side.', 16.59
from restaurants where osm_id = 1674094952;
insert into menu_item_allergen_tags (menu_item_id, allergen_code, status)
select mi.id, v.code, v.status from menu_items mi join restaurants r on r.id = mi.restaurant_id
cross join (values ('gluten','contains'),('dairy','contains'),('vegetarian','contains'),('vegan','contains')) as v(code, status)
where r.osm_id = 1674094952 and mi.name = 'Cheese Burger';

insert into menu_items (restaurant_id, name, description, price)
select id, 'Baked Haddock', 'A favorite from the North Atlantic. Crusted with seasoned cracker crumbs and baked until tender and flaky. Served with two sides.', 21.29
from restaurants where osm_id = 1674094952;
insert into menu_item_allergen_tags (menu_item_id, allergen_code, status)
select mi.id, v.code, v.status from menu_items mi join restaurants r on r.id = mi.restaurant_id
cross join (values ('fish','contains'),('gluten','contains'),('vegetarian','contains'),('vegan','contains')) as v(code, status)
where r.osm_id = 1674094952 and mi.name = 'Baked Haddock';

insert into menu_items (restaurant_id, name, description, price)
select id, 'Seasoned Salmon', 'Atlantic salmon filet lightly seasoned and roasted. Served with two sides.', 22.69
from restaurants where osm_id = 1674094952;
insert into menu_item_allergen_tags (menu_item_id, allergen_code, status)
select mi.id, v.code, v.status from menu_items mi join restaurants r on r.id = mi.restaurant_id
cross join (values ('fish','contains'),('vegetarian','contains'),('vegan','contains')) as v(code, status)
where r.osm_id = 1674094952 and mi.name = 'Seasoned Salmon';

insert into menu_items (restaurant_id, name, description, price)
select id, 'Fish & Chips', 'Hand-breaded filet fried until crispy. Served with tartar sauce and two sides.', 19.19
from restaurants where osm_id = 1674094952;
insert into menu_item_allergen_tags (menu_item_id, allergen_code, status)
select mi.id, v.code, v.status from menu_items mi join restaurants r on r.id = mi.restaurant_id
cross join (values ('fish','contains'),('gluten','contains'),('egg','contains'),('vegetarian','contains'),('vegan','contains')) as v(code, status)
where r.osm_id = 1674094952 and mi.name = 'Fish & Chips';

insert into menu_items (restaurant_id, name, description, price)
select id, 'Baby Back BBQ Ribs', 'Fall-off-the-bone baby back ribs slow cooked in house for hours, seasoned and basted with BBQ sauce. Served with a warm honey-glazed biscuit and two sides.', 27.39
from restaurants where osm_id = 1674094952;
insert into menu_item_allergen_tags (menu_item_id, allergen_code, status)
select mi.id, v.code, v.status from menu_items mi join restaurants r on r.id = mi.restaurant_id
cross join (values ('gluten','contains'),('vegetarian','contains'),('vegan','contains')) as v(code, status)
where r.osm_id = 1674094952 and mi.name = 'Baby Back BBQ Ribs';

insert into menu_items (restaurant_id, name, description, price)
select id, 'Top Sirloin Steak', 'Tender and juicy 8 oz. USDA Choice top sirloin, cooked to your taste. Served with choice of two: potato, House Salad or vegetable.', 24.89
from restaurants where osm_id = 1674094952;
insert into menu_item_allergen_tags (menu_item_id, allergen_code, status)
select mi.id, v.code, v.status from menu_items mi join restaurants r on r.id = mi.restaurant_id
cross join (values ('vegetarian','contains'),('vegan','contains')) as v(code, status)
where r.osm_id = 1674094952 and mi.name = 'Top Sirloin Steak';

insert into menu_items (restaurant_id, name, description, price)
select id, 'Chicken Parmigiana', 'A generous, fried chicken cutlet topped with classic marinara sauce and melted mozzarella and provolone cheeses. Served with penne pasta and warm Rustic Bread.', 19.79
from restaurants where osm_id = 1674094952;
insert into menu_item_allergen_tags (menu_item_id, allergen_code, status)
select mi.id, v.code, v.status from menu_items mi join restaurants r on r.id = mi.restaurant_id
cross join (values ('dairy','contains'),('gluten','contains'),('vegetarian','contains'),('vegan','contains')) as v(code, status)
where r.osm_id = 1674094952 and mi.name = 'Chicken Parmigiana';

insert into menu_items (restaurant_id, name, description, price)
select id, 'Grilled Balsamic Chicken', 'A tender marinated chicken breast flame broiled with a balsamic glaze. Served with two sides.', 16.99
from restaurants where osm_id = 1674094952;
insert into menu_item_allergen_tags (menu_item_id, allergen_code, status)
select mi.id, v.code, v.status from menu_items mi join restaurants r on r.id = mi.restaurant_id
cross join (values ('vegetarian','contains'),('vegan','contains')) as v(code, status)
where r.osm_id = 1674094952 and mi.name = 'Grilled Balsamic Chicken';

insert into menu_items (restaurant_id, name, description, price)
select id, 'Caesar Salad', 'A full-size Caesar Salad with fresh, crisp romaine lettuce drizzled with Caesar dressing, sprinkled with croutons and cheese.', 12.29
from restaurants where osm_id = 1674094952;
insert into menu_item_allergen_tags (menu_item_id, allergen_code, status)
select mi.id, v.code, v.status from menu_items mi join restaurants r on r.id = mi.restaurant_id
cross join (values ('dairy','contains'),('gluten','contains'),('fish','may_contain'),('vegan','contains')) as v(code, status)
where r.osm_id = 1674094952 and mi.name = 'Caesar Salad';

insert into menu_items (restaurant_id, name, description, price)
select id, 'Signature House Salad', 'A full-size House Salad with fresh mixed greens topped with tomatoes, cucumbers, red onions, Parmesan cheese, croutons and choice of dressing.', 12.29
from restaurants where osm_id = 1674094952;
insert into menu_item_allergen_tags (menu_item_id, allergen_code, status)
select mi.id, v.code, v.status from menu_items mi join restaurants r on r.id = mi.restaurant_id
cross join (values ('dairy','contains'),('gluten','contains'),('vegan','contains')) as v(code, status)
where r.osm_id = 1674094952 and mi.name = 'Signature House Salad';

insert into menu_items (restaurant_id, name, description, price)
select id, 'Sweet Potato Fries', null, 4.39
from restaurants where osm_id = 1674094952;
-- No published ingredient/allergen detail for this side beyond the name; no tags inserted (unknown).

insert into menu_items (restaurant_id, name, description, price)
select id, 'Cheese Quesadilla', 'A flour tortilla filled with melted Monterey Jack and cheddar cheeses served with fresh pico de gallo.', 7.09
from restaurants where osm_id = 1674094952;
insert into menu_item_allergen_tags (menu_item_id, allergen_code, status)
select mi.id, v.code, v.status from menu_items mi join restaurants r on r.id = mi.restaurant_id
cross join (values ('gluten','contains'),('dairy','contains'),('vegan','contains')) as v(code, status)
where r.osm_id = 1674094952 and mi.name = 'Cheese Quesadilla';

insert into menu_items (restaurant_id, name, description, price)
select id, 'Macaroni & Cheese', 'Kids menu macaroni and cheese.', 7.09
from restaurants where osm_id = 1674094952;
insert into menu_item_allergen_tags (menu_item_id, allergen_code, status)
select mi.id, v.code, v.status from menu_items mi join restaurants r on r.id = mi.restaurant_id
cross join (values ('gluten','contains'),('dairy','contains'),('vegan','contains')) as v(code, status)
where r.osm_id = 1674094952 and mi.name = 'Macaroni & Cheese';

insert into menu_items (restaurant_id, name, description, price)
select id, 'Little Midnight Fudge Hero Sundae', 'Chocolate cake with OREO Cookie pieces inside. Served with creamy vanilla bean ice cream, chocolate sauce, and whipped cream.', 3.79
from restaurants where osm_id = 1674094952;
insert into menu_item_allergen_tags (menu_item_id, allergen_code, status)
select mi.id, v.code, v.status from menu_items mi join restaurants r on r.id = mi.restaurant_id
cross join (values ('gluten','contains'),('dairy','contains'),('vegan','contains')) as v(code, status)
where r.osm_id = 1674094952 and mi.name = 'Little Midnight Fudge Hero Sundae';

insert into menu_items (restaurant_id, name, description, price)
select id, 'Strawberry & Mango Cheesecake', 'Rich, creamy vanilla cheesecake topped with fresh sliced strawberries, diced mangos and strawberry sauce with a dollop of whipped cream.', 9.79
from restaurants where osm_id = 1674094952;
insert into menu_item_allergen_tags (menu_item_id, allergen_code, status)
select mi.id, v.code, v.status from menu_items mi join restaurants r on r.id = mi.restaurant_id
cross join (values ('dairy','contains'),('vegan','contains')) as v(code, status)
where r.osm_id = 1674094952 and mi.name = 'Strawberry & Mango Cheesecake';

-- =============================================================================
-- 2. Stella Pasta Bar and Bistro -- 20 additional items
-- Source: https://stellapastabar.com/menu
-- =============================================================================

insert into menu_items (restaurant_id, name, description, price)
select id, 'Broccoli Rabe & Italian Sausage', 'Broccoli rabe and sliced sausage sauteed with garlic, red pepper, salt & pepper; topped with pecorino romano.', 15.00
from restaurants where osm_id = 3872013358;
insert into menu_item_allergen_tags (menu_item_id, allergen_code, status)
select mi.id, v.code, v.status from menu_items mi join restaurants r on r.id = mi.restaurant_id
cross join (values ('dairy','contains'),('vegetarian','contains'),('vegan','contains')) as v(code, status)
where r.osm_id = 3872013358 and mi.name = 'Broccoli Rabe & Italian Sausage';

insert into menu_items (restaurant_id, name, description, price)
select id, 'Eggplant Stack', 'Layers of panko breaded eggplant, mozzarella cheese, & marinara sauce; topped with basil & pecorino romano.', 14.00
from restaurants where osm_id = 3872013358;
insert into menu_item_allergen_tags (menu_item_id, allergen_code, status)
select mi.id, v.code, v.status from menu_items mi join restaurants r on r.id = mi.restaurant_id
cross join (values ('gluten','contains'),('dairy','contains'),('vegan','contains')) as v(code, status)
where r.osm_id = 3872013358 and mi.name = 'Eggplant Stack';

insert into menu_items (restaurant_id, name, description, price)
select id, 'Bruschetta', 'Fresh grilled house-made baguette brushed with evoo, salt and pepper, topped with fresh plum tomatoes, shallots, garlic, basil and aged balsamic vinegar. Add Mozzarella +$2.', 10.00
from restaurants where osm_id = 3872013358;
insert into menu_item_allergen_tags (menu_item_id, allergen_code, status)
select mi.id, v.code, v.status from menu_items mi join restaurants r on r.id = mi.restaurant_id
cross join (values ('gluten','contains')) as v(code, status)
where r.osm_id = 3872013358 and mi.name = 'Bruschetta';

insert into menu_items (restaurant_id, name, description, price)
select id, 'Sweet Corn Fritters', 'Classic fritters made with sweet corn & served with a side of Melba Sauce.', 12.00
from restaurants where osm_id = 3872013358;
insert into menu_item_allergen_tags (menu_item_id, allergen_code, status)
select mi.id, v.code, v.status from menu_items mi join restaurants r on r.id = mi.restaurant_id
cross join (values ('gluten','contains')) as v(code, status)
where r.osm_id = 3872013358 and mi.name = 'Sweet Corn Fritters';

insert into menu_items (restaurant_id, name, description, price)
select id, 'Stella Salad', 'Sweet heirloom grape tomatoes, English cucumbers, red onion, Maplebrook Farm mozzarella on crisp romaine and arugula with House Vinaigrette.', 12.00
from restaurants where osm_id = 3872013358;
insert into menu_item_allergen_tags (menu_item_id, allergen_code, status)
select mi.id, v.code, v.status from menu_items mi join restaurants r on r.id = mi.restaurant_id
cross join (values ('dairy','contains'),('vegan','contains')) as v(code, status)
where r.osm_id = 3872013358 and mi.name = 'Stella Salad';

insert into menu_items (restaurant_id, name, description, price)
select id, 'Mediterranean Shrimp Salad', 'Grilled shrimp (4), feta cheese, kalamata olives, grape tomatoes, cucumbers, red onions, and romaine, with Roasted Garlic Parmesan dressing.', 18.00
from restaurants where osm_id = 3872013358;
insert into menu_item_allergen_tags (menu_item_id, allergen_code, status)
select mi.id, v.code, v.status from menu_items mi join restaurants r on r.id = mi.restaurant_id
cross join (values ('shellfish','contains'),('dairy','contains'),('vegetarian','contains'),('vegan','contains')) as v(code, status)
where r.osm_id = 3872013358 and mi.name = 'Mediterranean Shrimp Salad';

insert into menu_items (restaurant_id, name, description, price)
select id, 'Chef''s BBQ Burger', '6oz Grass-Fed Patty with Fried Onion Ring, Romaine, Swiss Cheese & Chef''s BBQ Sauce.', 19.00
from restaurants where osm_id = 3872013358;
insert into menu_item_allergen_tags (menu_item_id, allergen_code, status)
select mi.id, v.code, v.status from menu_items mi join restaurants r on r.id = mi.restaurant_id
cross join (values ('dairy','contains'),('gluten','contains'),('vegetarian','contains'),('vegan','contains')) as v(code, status)
where r.osm_id = 3872013358 and mi.name = 'Chef''s BBQ Burger';

insert into menu_items (restaurant_id, name, description, price)
select id, 'Chicken Parmesan Submarine', 'Chicken Cutlets, Stella Marinara, Mozzarella; Toasted & Garlic Buttered Sub Roll.', 19.00
from restaurants where osm_id = 3872013358;
insert into menu_item_allergen_tags (menu_item_id, allergen_code, status)
select mi.id, v.code, v.status from menu_items mi join restaurants r on r.id = mi.restaurant_id
cross join (values ('gluten','contains'),('dairy','contains'),('vegetarian','contains'),('vegan','contains')) as v(code, status)
where r.osm_id = 3872013358 and mi.name = 'Chicken Parmesan Submarine';

insert into menu_items (restaurant_id, name, description, price)
select id, 'Meatball Parmesan Submarine', 'Sliced Chef''s Specialty Meatballs, Stella Marinara, Mozzarella; Toasted & Garlic Buttered Sub Roll.', 19.00
from restaurants where osm_id = 3872013358;
insert into menu_item_allergen_tags (menu_item_id, allergen_code, status)
select mi.id, v.code, v.status from menu_items mi join restaurants r on r.id = mi.restaurant_id
cross join (values ('gluten','contains'),('dairy','contains'),('vegetarian','contains'),('vegan','contains')) as v(code, status)
where r.osm_id = 3872013358 and mi.name = 'Meatball Parmesan Submarine';

insert into menu_items (restaurant_id, name, description, price)
select id, 'Short Rib Ravioli', 'Served in a mushroom, sherry & herb alfredo sauce.', 24.00
from restaurants where osm_id = 3872013358;
insert into menu_item_allergen_tags (menu_item_id, allergen_code, status)
select mi.id, v.code, v.status from menu_items mi join restaurants r on r.id = mi.restaurant_id
cross join (values ('dairy','contains'),('gluten','contains'),('egg','contains'),('vegetarian','contains'),('vegan','contains')) as v(code, status)
where r.osm_id = 3872013358 and mi.name = 'Short Rib Ravioli';

insert into menu_items (restaurant_id, name, description, price)
select id, 'Chicken Parmesan', 'Chicken cutlet topped with Stella Marinara, mozzarella and parmesan cheese.', 26.00
from restaurants where osm_id = 3872013358;
insert into menu_item_allergen_tags (menu_item_id, allergen_code, status)
select mi.id, v.code, v.status from menu_items mi join restaurants r on r.id = mi.restaurant_id
cross join (values ('dairy','contains'),('gluten','contains'),('vegetarian','contains'),('vegan','contains')) as v(code, status)
where r.osm_id = 3872013358 and mi.name = 'Chicken Parmesan';

insert into menu_items (restaurant_id, name, description, price)
select id, 'Chicken Francese', 'Lightly fried chicken cutlet finished in a lemony white wine sauce with butter and herbs, served with Stella linguine.', 26.00
from restaurants where osm_id = 3872013358;
insert into menu_item_allergen_tags (menu_item_id, allergen_code, status)
select mi.id, v.code, v.status from menu_items mi join restaurants r on r.id = mi.restaurant_id
cross join (values ('dairy','contains'),('gluten','contains'),('vegetarian','contains'),('vegan','contains')) as v(code, status)
where r.osm_id = 3872013358 and mi.name = 'Chicken Francese';

insert into menu_items (restaurant_id, name, description, price)
select id, 'Chicken Marsala', 'Pan-seared chicken cutlet with shallots & mushrooms, deglazed with marsala wine, served over a bed of spinach & marsala Stella Tagliatelle.', 27.00
from restaurants where osm_id = 3872013358;
insert into menu_item_allergen_tags (menu_item_id, allergen_code, status)
select mi.id, v.code, v.status from menu_items mi join restaurants r on r.id = mi.restaurant_id
cross join (values ('gluten','contains'),('vegetarian','contains'),('vegan','contains')) as v(code, status)
where r.osm_id = 3872013358 and mi.name = 'Chicken Marsala';

insert into menu_items (restaurant_id, name, description, price)
select id, 'Eggplant Parmesan', 'Lightly battered eggplant layered with Stella marinara & mozzarella, served with Stella Linguine.', 25.00
from restaurants where osm_id = 3872013358;
insert into menu_item_allergen_tags (menu_item_id, allergen_code, status)
select mi.id, v.code, v.status from menu_items mi join restaurants r on r.id = mi.restaurant_id
cross join (values ('gluten','contains'),('dairy','contains'),('vegan','contains')) as v(code, status)
where r.osm_id = 3872013358 and mi.name = 'Eggplant Parmesan';

insert into menu_items (restaurant_id, name, description, price)
select id, 'Shrimp Genovese', 'In a white wine sauce with baby spinach and heirloom tomatoes over Stella linguine.', 28.00
from restaurants where osm_id = 3872013358;
insert into menu_item_allergen_tags (menu_item_id, allergen_code, status)
select mi.id, v.code, v.status from menu_items mi join restaurants r on r.id = mi.restaurant_id
cross join (values ('shellfish','contains'),('gluten','contains'),('vegetarian','contains'),('vegan','contains')) as v(code, status)
where r.osm_id = 3872013358 and mi.name = 'Shrimp Genovese';

insert into menu_items (restaurant_id, name, description, price)
select id, 'Blue Crab Tagliatelle', 'Lump Blue Crab meat in a savory saffron cream sauce, served with Stella Tagliatelle.', 30.00
from restaurants where osm_id = 3872013358;
insert into menu_item_allergen_tags (menu_item_id, allergen_code, status)
select mi.id, v.code, v.status from menu_items mi join restaurants r on r.id = mi.restaurant_id
cross join (values ('shellfish','contains'),('dairy','contains'),('gluten','contains'),('vegetarian','contains'),('vegan','contains')) as v(code, status)
where r.osm_id = 3872013358 and mi.name = 'Blue Crab Tagliatelle';

insert into menu_items (restaurant_id, name, description, price)
select id, 'Chef''s Specialty Meatballs (3)', '3 meatballs served over Stella Marinara Sauce.', 12.00
from restaurants where osm_id = 3872013358;
insert into menu_item_allergen_tags (menu_item_id, allergen_code, status)
select mi.id, v.code, v.status from menu_items mi join restaurants r on r.id = mi.restaurant_id
cross join (values ('gluten','contains'),('vegetarian','contains'),('vegan','contains')) as v(code, status)
where r.osm_id = 3872013358 and mi.name = 'Chef''s Specialty Meatballs (3)';

insert into menu_items (restaurant_id, name, description, price)
select id, 'Crispy French Fries', 'Seasoned or Salted.', 8.00
from restaurants where osm_id = 3872013358;
-- No published ingredient/allergen detail beyond "seasoned or salted"; no tags inserted (unknown).

insert into menu_items (restaurant_id, name, description, price)
select id, 'Sauteed Broccoli', 'With olive oil, garlic, salt & pepper.', 9.00
from restaurants where osm_id = 3872013358;
-- Listed ingredients are all plant-based, but no explicit "does not contain"
-- allergen statement was published, so no 'safe' tags are asserted here.
