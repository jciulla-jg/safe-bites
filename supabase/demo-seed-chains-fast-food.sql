-- Demo seed data: national fast-food chain allergen info (McDonald's, Taco Bell).
-- Run after migration 0009_chains.sql (and after supabase/chain-seed-format.md's
-- format has been reviewed). Re-run safe: the delete below cascades to each
-- chain's menu items and allergen tags before re-inserting.
--
-- Sources (researched 2026-09-24):
--   McDonald's (Q38076) - https://www.mcdonalds.com/us/en-us/about-our-food/nutrition-calculator.html
--     Per-item "Ingredients" / "Allergen Information" panels on each product
--     page (e.g. mcdonalds.com/us/en-us/product/big-mac.html), which list a
--     "Contains:" / "May Contain:" line per component. This covers the nine
--     FDA major allergens (egg, dairy, wheat, soy, peanut, tree nut, fish,
--     shellfish, sesame) as stated on that page.
--   Taco Bell (Q752941) - https://www.tacobell.com/nutrition/ingredients
--     Taco Bell's official Ingredient Statement Search tool (embedded on the
--     page above), which gives per-component "Contains:" lines plus Taco
--     Bell's own "[certified vegan]" / "[certified vegetarian]" ingredient
--     certifications. Taco Bell's allergen disclaimer states peanuts, tree
--     nuts, fish and shellfish are not used in its regular menu items, and
--     that it does not claim any item "gluten-free".
--
-- Wendy's (Q550258) and Burger King (Q177054) were skipped: their US
-- allergen/ingredient tools (order.wendys.com, bk.com/nutrition-explorer)
-- require selecting a specific restaurant location before showing any
-- allergen data and could not be driven to a static chart in this pass, so
-- no chain-wide allergen data was captured for them. Per the "never guess"
-- rule, they are left out of this file rather than fabricated.
--
-- Caveat: allergen tags below come from each chain's own published guide as
-- captured above. Ingredients and formulations vary by location and change
-- over time, and this data has not been verified with restaurant staff.
-- Always confirm with the restaurant before relying on it for a severe
-- allergy.

-- Re-run safe: removing the chain rows cascades to their items and tags.
delete from chains where brand_wikidata in ('Q38076', 'Q752941');

insert into chains (brand_wikidata, name, allergen_source, reviewed_at)
values
  ('Q38076', 'McDonald''s', 'https://www.mcdonalds.com/us/en-us/about-our-food/nutrition-calculator.html', '2026-09-24'),
  ('Q752941', 'Taco Bell', 'https://www.tacobell.com/nutrition/ingredients', '2026-09-24');

-- =========================================================================
-- McDonald's (Q38076)
-- =========================================================================

insert into chain_menu_items (chain_id, name, description, price)
select id, 'Hamburger', '100% beef patty with pickles, onions, ketchup and mustard on a regular bun.', null
from chains where brand_wikidata = 'Q38076';
insert into chain_menu_item_allergen_tags (chain_menu_item_id, allergen_code, status)
select mi.id, v.code, v.status from chain_menu_items mi join chains c on c.id = mi.chain_id
cross join (values
  ('gluten','contains'),('sesame','may_contain'),
  ('dairy','safe'),('egg','safe'),('peanut','safe'),('tree_nut','safe'),
  ('fish','safe'),('shellfish','safe'),('soy','safe'),
  ('vegan','contains'),('vegetarian','contains')
) as v(code, status)
where c.brand_wikidata = 'Q38076' and mi.name = 'Hamburger';

insert into chain_menu_items (chain_id, name, description, price)
select id, 'Big Mac', 'Two beef patties, special sauce, lettuce, cheese, pickles and onions on a sesame seed bun.', null
from chains where brand_wikidata = 'Q38076';
insert into chain_menu_item_allergen_tags (chain_menu_item_id, allergen_code, status)
select mi.id, v.code, v.status from chain_menu_items mi join chains c on c.id = mi.chain_id
cross join (values
  ('gluten','contains'),('sesame','contains'),('egg','contains'),('soy','contains'),('dairy','contains'),
  ('peanut','safe'),('tree_nut','safe'),('fish','safe'),('shellfish','safe'),
  ('vegan','contains'),('vegetarian','contains')
) as v(code, status)
where c.brand_wikidata = 'Q38076' and mi.name = 'Big Mac';

insert into chain_menu_items (chain_id, name, description, price)
select id, 'Quarter Pounder with Cheese', 'Quarter-pound beef patty with cheese, onions, pickles, ketchup and mustard on a sesame seed bun.', null
from chains where brand_wikidata = 'Q38076';
insert into chain_menu_item_allergen_tags (chain_menu_item_id, allergen_code, status)
select mi.id, v.code, v.status from chain_menu_items mi join chains c on c.id = mi.chain_id
cross join (values
  ('gluten','contains'),('sesame','contains'),('dairy','contains'),('soy','contains'),
  ('egg','safe'),('peanut','safe'),('tree_nut','safe'),('fish','safe'),('shellfish','safe'),
  ('vegan','contains'),('vegetarian','contains')
) as v(code, status)
where c.brand_wikidata = 'Q38076' and mi.name = 'Quarter Pounder with Cheese';

insert into chain_menu_items (chain_id, name, description, price)
select id, 'McChicken', 'Crispy chicken patty with shredded lettuce and mayonnaise on a bun.', null
from chains where brand_wikidata = 'Q38076';
insert into chain_menu_item_allergen_tags (chain_menu_item_id, allergen_code, status)
select mi.id, v.code, v.status from chain_menu_items mi join chains c on c.id = mi.chain_id
cross join (values
  ('gluten','contains'),('egg','contains'),('sesame','may_contain'),
  ('dairy','safe'),('peanut','safe'),('tree_nut','safe'),('fish','safe'),('shellfish','safe'),('soy','safe'),
  ('vegan','contains'),('vegetarian','contains')
) as v(code, status)
where c.brand_wikidata = 'Q38076' and mi.name = 'McChicken';

insert into chain_menu_items (chain_id, name, description, price)
select id, 'Chicken McNuggets', 'Bite-sized nuggets made with all white meat chicken.', null
from chains where brand_wikidata = 'Q38076';
insert into chain_menu_item_allergen_tags (chain_menu_item_id, allergen_code, status)
select mi.id, v.code, v.status from chain_menu_items mi join chains c on c.id = mi.chain_id
cross join (values
  ('gluten','contains'),
  ('dairy','safe'),('egg','safe'),('peanut','safe'),('tree_nut','safe'),('fish','safe'),('shellfish','safe'),('sesame','safe'),('soy','safe'),
  ('vegan','contains'),('vegetarian','contains')
) as v(code, status)
where c.brand_wikidata = 'Q38076' and mi.name = 'Chicken McNuggets';

insert into chain_menu_items (chain_id, name, description, price)
select id, 'World Famous Fries', 'McDonald''s signature salted french fries.', null
from chains where brand_wikidata = 'Q38076';
insert into chain_menu_item_allergen_tags (chain_menu_item_id, allergen_code, status)
select mi.id, v.code, v.status from chain_menu_items mi join chains c on c.id = mi.chain_id
cross join (values
  ('gluten','contains'),('dairy','contains'),
  ('egg','safe'),('peanut','safe'),('tree_nut','safe'),('fish','safe'),('shellfish','safe'),('sesame','safe'),('soy','safe')
) as v(code, status)
where c.brand_wikidata = 'Q38076' and mi.name = 'World Famous Fries';

insert into chain_menu_items (chain_id, name, description, price)
select id, 'Filet-O-Fish', 'Fish patty with tartar sauce and a slice of cheese on a steamed bun.', null
from chains where brand_wikidata = 'Q38076';
insert into chain_menu_item_allergen_tags (chain_menu_item_id, allergen_code, status)
select mi.id, v.code, v.status from chain_menu_items mi join chains c on c.id = mi.chain_id
cross join (values
  ('fish','contains'),('gluten','contains'),('dairy','contains'),('egg','contains'),('soy','contains'),('sesame','may_contain'),
  ('peanut','safe'),('tree_nut','safe'),('shellfish','safe'),
  ('vegan','contains'),('vegetarian','contains')
) as v(code, status)
where c.brand_wikidata = 'Q38076' and mi.name = 'Filet-O-Fish';

insert into chain_menu_items (chain_id, name, description, price)
select id, 'Egg McMuffin', 'Egg, Canadian bacon and cheese on a toasted English muffin.', null
from chains where brand_wikidata = 'Q38076';
insert into chain_menu_item_allergen_tags (chain_menu_item_id, allergen_code, status)
select mi.id, v.code, v.status from chain_menu_items mi join chains c on c.id = mi.chain_id
cross join (values
  ('gluten','contains'),('egg','contains'),('dairy','contains'),('soy','contains'),('sesame','may_contain'),
  ('peanut','safe'),('tree_nut','safe'),('fish','safe'),('shellfish','safe'),
  ('vegan','contains'),('vegetarian','contains')
) as v(code, status)
where c.brand_wikidata = 'Q38076' and mi.name = 'Egg McMuffin';

insert into chain_menu_items (chain_id, name, description, price)
select id, 'Hash Browns', 'Shredded potato patty, fried until crispy.', null
from chains where brand_wikidata = 'Q38076';
insert into chain_menu_item_allergen_tags (chain_menu_item_id, allergen_code, status)
select mi.id, v.code, v.status from chain_menu_items mi join chains c on c.id = mi.chain_id
cross join (values
  ('gluten','contains'),('dairy','contains'),
  ('egg','safe'),('peanut','safe'),('tree_nut','safe'),('fish','safe'),('shellfish','safe'),('sesame','safe'),('soy','safe')
) as v(code, status)
where c.brand_wikidata = 'Q38076' and mi.name = 'Hash Browns';

insert into chain_menu_items (chain_id, name, description, price)
select id, 'Apple Slices', 'Fresh sliced apples.', null
from chains where brand_wikidata = 'Q38076';
insert into chain_menu_item_allergen_tags (chain_menu_item_id, allergen_code, status)
select mi.id, v.code, v.status from chain_menu_items mi join chains c on c.id = mi.chain_id
cross join (values
  ('dairy','safe'),('egg','safe'),('peanut','safe'),('tree_nut','safe'),('fish','safe'),('shellfish','safe'),('sesame','safe'),('soy','safe')
) as v(code, status)
where c.brand_wikidata = 'Q38076' and mi.name = 'Apple Slices';

insert into chain_menu_items (chain_id, name, description, price)
select id, 'Oreo McFlurry', 'Vanilla soft serve blended with OREO cookie pieces.', null
from chains where brand_wikidata = 'Q38076';
insert into chain_menu_item_allergen_tags (chain_menu_item_id, allergen_code, status)
select mi.id, v.code, v.status from chain_menu_items mi join chains c on c.id = mi.chain_id
cross join (values
  ('dairy','contains'),('gluten','contains'),('soy','contains'),
  ('egg','safe'),('peanut','safe'),('tree_nut','safe'),('fish','safe'),('shellfish','safe'),('sesame','safe'),
  ('vegan','contains')
) as v(code, status)
where c.brand_wikidata = 'Q38076' and mi.name = 'Oreo McFlurry';

insert into chain_menu_items (chain_id, name, description, price)
select id, 'Cheeseburger', 'Beef patty with cheese, pickles, onions, ketchup and mustard on a bun.', null
from chains where brand_wikidata = 'Q38076';
insert into chain_menu_item_allergen_tags (chain_menu_item_id, allergen_code, status)
select mi.id, v.code, v.status from chain_menu_items mi join chains c on c.id = mi.chain_id
cross join (values
  ('gluten','contains'),('sesame','may_contain'),('dairy','contains'),('soy','contains'),
  ('egg','safe'),('peanut','safe'),('tree_nut','safe'),('fish','safe'),('shellfish','safe'),
  ('vegan','contains'),('vegetarian','contains')
) as v(code, status)
where c.brand_wikidata = 'Q38076' and mi.name = 'Cheeseburger';

insert into chain_menu_items (chain_id, name, description, price)
select id, 'Sausage McMuffin', 'Sausage patty and cheese on a toasted English muffin.', null
from chains where brand_wikidata = 'Q38076';
insert into chain_menu_item_allergen_tags (chain_menu_item_id, allergen_code, status)
select mi.id, v.code, v.status from chain_menu_items mi join chains c on c.id = mi.chain_id
cross join (values
  ('gluten','contains'),('sesame','may_contain'),('dairy','contains'),('soy','contains'),
  ('egg','safe'),('peanut','safe'),('tree_nut','safe'),('fish','safe'),('shellfish','safe'),
  ('vegan','contains'),('vegetarian','contains')
) as v(code, status)
where c.brand_wikidata = 'Q38076' and mi.name = 'Sausage McMuffin';

insert into chain_menu_items (chain_id, name, description, price)
select id, 'Hot Fudge Sundae', 'Vanilla soft serve topped with hot fudge.', null
from chains where brand_wikidata = 'Q38076';
insert into chain_menu_item_allergen_tags (chain_menu_item_id, allergen_code, status)
select mi.id, v.code, v.status from chain_menu_items mi join chains c on c.id = mi.chain_id
cross join (values
  ('dairy','contains'),('soy','contains'),
  ('egg','safe'),('peanut','safe'),('tree_nut','safe'),('fish','safe'),('shellfish','safe'),('sesame','safe'),
  ('vegan','contains')
) as v(code, status)
where c.brand_wikidata = 'Q38076' and mi.name = 'Hot Fudge Sundae';

insert into chain_menu_items (chain_id, name, description, price)
select id, 'Baked Hot Apple Pie', 'Warm pastry shell filled with diced apples.', null
from chains where brand_wikidata = 'Q38076';
insert into chain_menu_item_allergen_tags (chain_menu_item_id, allergen_code, status)
select mi.id, v.code, v.status from chain_menu_items mi join chains c on c.id = mi.chain_id
cross join (values
  ('gluten','contains'),
  ('dairy','safe'),('egg','safe'),('peanut','safe'),('tree_nut','safe'),('fish','safe'),('shellfish','safe'),('sesame','safe'),('soy','safe')
) as v(code, status)
where c.brand_wikidata = 'Q38076' and mi.name = 'Baked Hot Apple Pie';

-- =========================================================================
-- Taco Bell (Q752941)
-- =========================================================================

insert into chain_menu_items (chain_id, name, description, price)
select id, 'Crunchy Taco', 'Seasoned beef in a crunchy corn shell with lettuce and cheddar cheese.', null
from chains where brand_wikidata = 'Q752941';
insert into chain_menu_item_allergen_tags (chain_menu_item_id, allergen_code, status)
select mi.id, v.code, v.status from chain_menu_items mi join chains c on c.id = mi.chain_id
cross join (values
  ('soy','contains'),('dairy','contains'),
  ('egg','safe'),('peanut','safe'),('tree_nut','safe'),('fish','safe'),('shellfish','safe'),('sesame','safe'),
  ('vegan','contains'),('vegetarian','contains')
) as v(code, status)
where c.brand_wikidata = 'Q752941' and mi.name = 'Crunchy Taco';

insert into chain_menu_items (chain_id, name, description, price)
select id, 'Soft Taco', 'Seasoned beef, lettuce and cheddar cheese in a soft flour tortilla.', null
from chains where brand_wikidata = 'Q752941';
insert into chain_menu_item_allergen_tags (chain_menu_item_id, allergen_code, status)
select mi.id, v.code, v.status from chain_menu_items mi join chains c on c.id = mi.chain_id
cross join (values
  ('gluten','contains'),('soy','contains'),('dairy','contains'),
  ('egg','safe'),('peanut','safe'),('tree_nut','safe'),('fish','safe'),('shellfish','safe'),('sesame','safe'),
  ('vegan','contains'),('vegetarian','contains')
) as v(code, status)
where c.brand_wikidata = 'Q752941' and mi.name = 'Soft Taco';

insert into chain_menu_items (chain_id, name, description, price)
select id, 'Bean Burrito', 'Refried beans, red sauce, cheddar cheese and onions in a flour tortilla.', null
from chains where brand_wikidata = 'Q752941';
insert into chain_menu_item_allergen_tags (chain_menu_item_id, allergen_code, status)
select mi.id, v.code, v.status from chain_menu_items mi join chains c on c.id = mi.chain_id
cross join (values
  ('gluten','contains'),('dairy','contains'),
  ('egg','safe'),('peanut','safe'),('tree_nut','safe'),('fish','safe'),('shellfish','safe'),('sesame','safe'),('soy','safe'),
  ('vegan','contains'),('vegetarian','safe')
) as v(code, status)
where c.brand_wikidata = 'Q752941' and mi.name = 'Bean Burrito';

insert into chain_menu_items (chain_id, name, description, price)
select id, 'Crunchwrap Supreme', 'Seasoned beef, nacho cheese sauce, lettuce, tomato and sour cream folded in a grilled tortilla around a crunchy tostada shell.', null
from chains where brand_wikidata = 'Q752941';
insert into chain_menu_item_allergen_tags (chain_menu_item_id, allergen_code, status)
select mi.id, v.code, v.status from chain_menu_items mi join chains c on c.id = mi.chain_id
cross join (values
  ('gluten','contains'),('soy','contains'),('dairy','contains'),
  ('egg','safe'),('peanut','safe'),('tree_nut','safe'),('fish','safe'),('shellfish','safe'),('sesame','safe'),
  ('vegan','contains'),('vegetarian','contains')
) as v(code, status)
where c.brand_wikidata = 'Q752941' and mi.name = 'Crunchwrap Supreme';

insert into chain_menu_items (chain_id, name, description, price)
select id, 'Chalupa Supreme', 'Seasoned beef, lettuce, tomato, sour cream and cheese on a fried chalupa flatbread.', null
from chains where brand_wikidata = 'Q752941';
insert into chain_menu_item_allergen_tags (chain_menu_item_id, allergen_code, status)
select mi.id, v.code, v.status from chain_menu_items mi join chains c on c.id = mi.chain_id
cross join (values
  ('gluten','contains'),('soy','contains'),('dairy','contains'),
  ('egg','safe'),('peanut','safe'),('tree_nut','safe'),('fish','safe'),('shellfish','safe'),('sesame','safe'),
  ('vegan','contains'),('vegetarian','contains')
) as v(code, status)
where c.brand_wikidata = 'Q752941' and mi.name = 'Chalupa Supreme';

insert into chain_menu_items (chain_id, name, description, price)
select id, 'Doritos Locos Tacos', 'Seasoned beef, lettuce and cheddar cheese in a Doritos Nacho Cheese-flavored shell.', null
from chains where brand_wikidata = 'Q752941';
insert into chain_menu_item_allergen_tags (chain_menu_item_id, allergen_code, status)
select mi.id, v.code, v.status from chain_menu_items mi join chains c on c.id = mi.chain_id
cross join (values
  ('soy','contains'),('dairy','contains'),
  ('egg','safe'),('peanut','safe'),('tree_nut','safe'),('fish','safe'),('shellfish','safe'),('sesame','safe'),
  ('vegan','contains'),('vegetarian','contains')
) as v(code, status)
where c.brand_wikidata = 'Q752941' and mi.name = 'Doritos Locos Tacos';

insert into chain_menu_items (chain_id, name, description, price)
select id, 'Mexican Pizza', 'Seasoned beef and refried beans between two crispy shells, topped with cheese and pizza sauce.', null
from chains where brand_wikidata = 'Q752941';
insert into chain_menu_item_allergen_tags (chain_menu_item_id, allergen_code, status)
select mi.id, v.code, v.status from chain_menu_items mi join chains c on c.id = mi.chain_id
cross join (values
  ('gluten','contains'),('soy','contains'),('dairy','contains'),
  ('egg','safe'),('peanut','safe'),('tree_nut','safe'),('fish','safe'),('shellfish','safe'),('sesame','safe'),
  ('vegan','contains'),('vegetarian','contains')
) as v(code, status)
where c.brand_wikidata = 'Q752941' and mi.name = 'Mexican Pizza';

insert into chain_menu_items (chain_id, name, description, price)
select id, 'Cheesy Gordita Crunch', 'Seasoned beef and cheese in a crunchy taco shell, wrapped in a soft cheesy gordita flatbread.', null
from chains where brand_wikidata = 'Q752941';
insert into chain_menu_item_allergen_tags (chain_menu_item_id, allergen_code, status)
select mi.id, v.code, v.status from chain_menu_items mi join chains c on c.id = mi.chain_id
cross join (values
  ('gluten','contains'),('soy','contains'),('dairy','contains'),('egg','contains'),
  ('peanut','safe'),('tree_nut','safe'),('fish','safe'),('shellfish','safe'),('sesame','safe'),
  ('vegan','contains'),('vegetarian','contains')
) as v(code, status)
where c.brand_wikidata = 'Q752941' and mi.name = 'Cheesy Gordita Crunch';

insert into chain_menu_items (chain_id, name, description, price)
select id, 'Nacho Fries', 'Seasoned fries served with warm nacho cheese sauce.', null
from chains where brand_wikidata = 'Q752941';
insert into chain_menu_item_allergen_tags (chain_menu_item_id, allergen_code, status)
select mi.id, v.code, v.status from chain_menu_items mi join chains c on c.id = mi.chain_id
cross join (values
  ('gluten','contains'),('dairy','contains'),
  ('egg','safe'),('peanut','safe'),('tree_nut','safe'),('fish','safe'),('shellfish','safe'),('sesame','safe'),('soy','safe'),
  ('vegan','contains'),('vegetarian','safe')
) as v(code, status)
where c.brand_wikidata = 'Q752941' and mi.name = 'Nacho Fries';

insert into chain_menu_items (chain_id, name, description, price)
select id, 'Cinnamon Twists', 'Crispy corn twists dusted with cinnamon sugar.', null
from chains where brand_wikidata = 'Q752941';
insert into chain_menu_item_allergen_tags (chain_menu_item_id, allergen_code, status)
select mi.id, v.code, v.status from chain_menu_items mi join chains c on c.id = mi.chain_id
cross join (values
  ('gluten','contains'),
  ('dairy','safe'),('egg','safe'),('peanut','safe'),('tree_nut','safe'),('fish','safe'),('shellfish','safe'),('sesame','safe'),('soy','safe'),
  ('vegan','safe'),('vegetarian','safe')
) as v(code, status)
where c.brand_wikidata = 'Q752941' and mi.name = 'Cinnamon Twists';

insert into chain_menu_items (chain_id, name, description, price)
select id, 'Black Beans', 'Seasoned black beans, served as a side.', null
from chains where brand_wikidata = 'Q752941';
insert into chain_menu_item_allergen_tags (chain_menu_item_id, allergen_code, status)
select mi.id, v.code, v.status from chain_menu_items mi join chains c on c.id = mi.chain_id
cross join (values
  ('dairy','safe'),('egg','safe'),('peanut','safe'),('tree_nut','safe'),('fish','safe'),('shellfish','safe'),('sesame','safe'),('soy','safe'),
  ('vegan','safe'),('vegetarian','safe')
) as v(code, status)
where c.brand_wikidata = 'Q752941' and mi.name = 'Black Beans';

insert into chain_menu_items (chain_id, name, description, price)
select id, 'Chicken Quesadilla', 'Grilled chicken and three-cheese blend folded in a flour tortilla with creamy jalapeno sauce.', null
from chains where brand_wikidata = 'Q752941';
insert into chain_menu_item_allergen_tags (chain_menu_item_id, allergen_code, status)
select mi.id, v.code, v.status from chain_menu_items mi join chains c on c.id = mi.chain_id
cross join (values
  ('gluten','contains'),('dairy','contains'),('egg','contains'),
  ('peanut','safe'),('tree_nut','safe'),('fish','safe'),('shellfish','safe'),('sesame','safe'),('soy','safe'),
  ('vegan','contains'),('vegetarian','contains')
) as v(code, status)
where c.brand_wikidata = 'Q752941' and mi.name = 'Chicken Quesadilla';

insert into chain_menu_items (chain_id, name, description, price)
select id, 'Black Bean Crunchwrap Supreme', 'Black beans, nacho cheese sauce, lettuce, tomato and sour cream folded in a grilled tortilla around a crunchy tostada shell.', null
from chains where brand_wikidata = 'Q752941';
insert into chain_menu_item_allergen_tags (chain_menu_item_id, allergen_code, status)
select mi.id, v.code, v.status from chain_menu_items mi join chains c on c.id = mi.chain_id
cross join (values
  ('gluten','contains'),('dairy','contains'),
  ('egg','safe'),('peanut','safe'),('tree_nut','safe'),('fish','safe'),('shellfish','safe'),('sesame','safe'),('soy','safe'),
  ('vegan','contains'),('vegetarian','safe')
) as v(code, status)
where c.brand_wikidata = 'Q752941' and mi.name = 'Black Bean Crunchwrap Supreme';

insert into chain_menu_items (chain_id, name, description, price)
select id, 'Spicy Potato Soft Taco', 'Crispy seasoned potato bites, lettuce, cheddar cheese and chipotle sauce in a soft flour tortilla.', null
from chains where brand_wikidata = 'Q752941';
insert into chain_menu_item_allergen_tags (chain_menu_item_id, allergen_code, status)
select mi.id, v.code, v.status from chain_menu_items mi join chains c on c.id = mi.chain_id
cross join (values
  ('gluten','contains'),('dairy','contains'),('egg','contains'),
  ('peanut','safe'),('tree_nut','safe'),('fish','safe'),('shellfish','safe'),('sesame','safe'),('soy','safe'),
  ('vegan','contains'),('vegetarian','safe')
) as v(code, status)
where c.brand_wikidata = 'Q752941' and mi.name = 'Spicy Potato Soft Taco';

insert into chain_menu_items (chain_id, name, description, price)
select id, 'Cheese Quesadilla', 'Three-cheese blend and creamy jalapeno sauce folded in a flour tortilla.', null
from chains where brand_wikidata = 'Q752941';
insert into chain_menu_item_allergen_tags (chain_menu_item_id, allergen_code, status)
select mi.id, v.code, v.status from chain_menu_items mi join chains c on c.id = mi.chain_id
cross join (values
  ('gluten','contains'),('dairy','contains'),('egg','contains'),
  ('peanut','safe'),('tree_nut','safe'),('fish','safe'),('shellfish','safe'),('sesame','safe'),('soy','safe'),
  ('vegan','contains'),('vegetarian','safe')
) as v(code, status)
where c.brand_wikidata = 'Q752941' and mi.name = 'Cheese Quesadilla';
