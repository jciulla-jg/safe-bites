-- Demo seed data: fast-casual chain allergen tags for Safe Bites.
-- Run AFTER migration 0009_chains.sql.
-- Researched 2026-09-24. Wikidata brand ids verified against wikidata.org.
--
-- Sources (each chain's own published allergen guide, fetched 2026-09-24):
--   Chipotle Mexican Grill (Q465751): https://www.chipotle.com/allergens
--     (chain-wide dietary/allergen statement; no eggs, mustard, peanuts, tree
--     nuts, sesame, shellfish or fish are used as ingredients, but cross-contact
--     is not guaranteed) plus https://www.chipotle.com/content/dam/poc/order/
--     nutrition-files/PaperMenu_STANDARD_NoPricing_120221_us.pdf for the
--     ingredient list itself. Chipotle's chart is ingredient-based, not
--     dish-based, so items below are core ingredients per chain-seed-format.md.
--   Panera Bread (Q7130852): https://www.panerabread.com/content/dam/panerabread/
--     documents/c6-26-allergen-guide.pdf ("Allergen Guide", Edition 1, valid
--     6/17/2026).
--   Subway (Q244457): https://media.subway.com/dam/urn:aaid:aem:c47e1a3c-6d6c-
--     45c0-8186-c9f4c183646a/original/as/us-allergens-en.pdf ("U.S. Allergy and
--     Sensitivity Information", January 2026).
--   Five Guys (Q1131810): https://www.fiveguys.com/wp-content/uploads/2026/08/
--     Five-Guys-US-Nutrition-Allergen-Guide-English-June-2026.pdf
--     ("Nutrition & Allergen Guide", USA).
--
-- Caveat: allergen tags come from each chain's own published national guide.
-- Actual preparation can vary by location, ingredients/formulations change
-- over time, and none of this has been verified with restaurant staff.
-- Always confirm with the restaurant before relying on it for a real allergy.

-- Re-run safe: removing the chain rows cascades to their items and tags.
delete from chains where brand_wikidata in ('Q465751', 'Q7130852', 'Q244457', 'Q1131810');

insert into chains (brand_wikidata, name, allergen_source, reviewed_at)
values
  ('Q465751', 'Chipotle Mexican Grill', 'https://www.chipotle.com/allergens', '2026-09-24'),
  ('Q7130852', 'Panera Bread', 'https://www.panerabread.com/content/dam/panerabread/documents/c6-26-allergen-guide.pdf', '2026-09-24'),
  ('Q244457', 'Subway', 'https://media.subway.com/dam/urn:aaid:aem:c47e1a3c-6d6c-45c0-8186-c9f4c183646a/original/as/us-allergens-en.pdf', '2026-09-24'),
  ('Q1131810', 'Five Guys', 'https://www.fiveguys.com/wp-content/uploads/2026/08/Five-Guys-US-Nutrition-Allergen-Guide-English-June-2026.pdf', '2026-09-24');

-- =====================================================================
-- Chipotle Mexican Grill (Q465751)
-- Chart is ingredient-based. Chain-wide statement: eggs, mustard, peanuts,
-- tree nuts, sesame, shellfish and fish are not used as ingredients, but the
-- chain cannot guarantee their complete absence -> may_contain on every item.
-- Dairy is limited to cheese, queso blanco and sour cream. Wheat/gluten is
-- limited to the flour tortilla. Sofritas and the other named vegan items are
-- explicitly labeled vegan/vegetarian by Chipotle.
-- =====================================================================

insert into chain_menu_items (chain_id, name, description, price)
select id, 'Chicken', 'Responsibly raised chicken, marinated in chipotle adobo, then grilled.', null
from chains where brand_wikidata = 'Q465751';
insert into chain_menu_item_allergen_tags (chain_menu_item_id, allergen_code, status)
select mi.id, v.code, v.status from chain_menu_items mi join chains c on c.id = mi.chain_id
cross join (values ('egg','may_contain'),('peanut','may_contain'),('tree_nut','may_contain'),('sesame','may_contain'),('shellfish','may_contain'),('fish','may_contain'),('vegan','contains'),('vegetarian','contains')) as v(code, status)
where c.brand_wikidata = 'Q465751' and mi.name = 'Chicken';

insert into chain_menu_items (chain_id, name, description, price)
select id, 'Steak', 'Responsibly raised steak, marinated in chipotle adobo, then grilled.', null
from chains where brand_wikidata = 'Q465751';
insert into chain_menu_item_allergen_tags (chain_menu_item_id, allergen_code, status)
select mi.id, v.code, v.status from chain_menu_items mi join chains c on c.id = mi.chain_id
cross join (values ('egg','may_contain'),('peanut','may_contain'),('tree_nut','may_contain'),('sesame','may_contain'),('shellfish','may_contain'),('fish','may_contain'),('vegan','contains'),('vegetarian','contains')) as v(code, status)
where c.brand_wikidata = 'Q465751' and mi.name = 'Steak';

insert into chain_menu_items (chain_id, name, description, price)
select id, 'Barbacoa', 'Responsibly raised beef, braised for hours, then shredded.', null
from chains where brand_wikidata = 'Q465751';
insert into chain_menu_item_allergen_tags (chain_menu_item_id, allergen_code, status)
select mi.id, v.code, v.status from chain_menu_items mi join chains c on c.id = mi.chain_id
cross join (values ('egg','may_contain'),('peanut','may_contain'),('tree_nut','may_contain'),('sesame','may_contain'),('shellfish','may_contain'),('fish','may_contain'),('vegan','contains'),('vegetarian','contains')) as v(code, status)
where c.brand_wikidata = 'Q465751' and mi.name = 'Barbacoa';

insert into chain_menu_items (chain_id, name, description, price)
select id, 'Carnitas', 'Responsibly raised pork, braised for hours, then shredded.', null
from chains where brand_wikidata = 'Q465751';
insert into chain_menu_item_allergen_tags (chain_menu_item_id, allergen_code, status)
select mi.id, v.code, v.status from chain_menu_items mi join chains c on c.id = mi.chain_id
cross join (values ('egg','may_contain'),('peanut','may_contain'),('tree_nut','may_contain'),('sesame','may_contain'),('shellfish','may_contain'),('fish','may_contain'),('vegan','contains'),('vegetarian','contains')) as v(code, status)
where c.brand_wikidata = 'Q465751' and mi.name = 'Carnitas';

insert into chain_menu_items (chain_id, name, description, price)
select id, 'Sofritas', 'Organic plant-based protein braised with chipotle chilis, roasted poblanos and a blend of aromatic spices.', null
from chains where brand_wikidata = 'Q465751';
insert into chain_menu_item_allergen_tags (chain_menu_item_id, allergen_code, status)
select mi.id, v.code, v.status from chain_menu_items mi join chains c on c.id = mi.chain_id
cross join (values ('egg','may_contain'),('peanut','may_contain'),('tree_nut','may_contain'),('sesame','may_contain'),('shellfish','may_contain'),('fish','may_contain'),('dairy','safe'),('vegan','safe'),('vegetarian','safe')) as v(code, status)
where c.brand_wikidata = 'Q465751' and mi.name = 'Sofritas';

insert into chain_menu_items (chain_id, name, description, price)
select id, 'Flour Tortilla', 'Flour tortilla used for burritos and soft tacos.', null
from chains where brand_wikidata = 'Q465751';
insert into chain_menu_item_allergen_tags (chain_menu_item_id, allergen_code, status)
select mi.id, v.code, v.status from chain_menu_items mi join chains c on c.id = mi.chain_id
cross join (values ('gluten','contains'),('egg','may_contain'),('peanut','may_contain'),('tree_nut','may_contain'),('sesame','may_contain'),('shellfish','may_contain'),('fish','may_contain'),('dairy','safe'),('vegan','safe'),('vegetarian','safe')) as v(code, status)
where c.brand_wikidata = 'Q465751' and mi.name = 'Flour Tortilla';

insert into chain_menu_items (chain_id, name, description, price)
select id, 'Crispy Corn Tortilla', 'Corn tortilla used for tacos; Chipotle''s gluten-free tortilla option.', null
from chains where brand_wikidata = 'Q465751';
insert into chain_menu_item_allergen_tags (chain_menu_item_id, allergen_code, status)
select mi.id, v.code, v.status from chain_menu_items mi join chains c on c.id = mi.chain_id
cross join (values ('gluten','safe'),('dairy','safe'),('egg','may_contain'),('peanut','may_contain'),('tree_nut','may_contain'),('sesame','may_contain'),('shellfish','may_contain'),('fish','may_contain'),('vegan','safe'),('vegetarian','safe')) as v(code, status)
where c.brand_wikidata = 'Q465751' and mi.name = 'Crispy Corn Tortilla';

insert into chain_menu_items (chain_id, name, description, price)
select id, 'White Rice', 'Cilantro-lime white rice.', null
from chains where brand_wikidata = 'Q465751';
insert into chain_menu_item_allergen_tags (chain_menu_item_id, allergen_code, status)
select mi.id, v.code, v.status from chain_menu_items mi join chains c on c.id = mi.chain_id
cross join (values ('gluten','safe'),('dairy','safe'),('egg','may_contain'),('peanut','may_contain'),('tree_nut','may_contain'),('sesame','may_contain'),('shellfish','may_contain'),('fish','may_contain'),('vegan','safe'),('vegetarian','safe')) as v(code, status)
where c.brand_wikidata = 'Q465751' and mi.name = 'White Rice';

insert into chain_menu_items (chain_id, name, description, price)
select id, 'Black Beans', 'Seasoned black beans.', null
from chains where brand_wikidata = 'Q465751';
insert into chain_menu_item_allergen_tags (chain_menu_item_id, allergen_code, status)
select mi.id, v.code, v.status from chain_menu_items mi join chains c on c.id = mi.chain_id
cross join (values ('gluten','safe'),('dairy','safe'),('egg','may_contain'),('peanut','may_contain'),('tree_nut','may_contain'),('sesame','may_contain'),('shellfish','may_contain'),('fish','may_contain'),('vegan','safe'),('vegetarian','safe')) as v(code, status)
where c.brand_wikidata = 'Q465751' and mi.name = 'Black Beans';

insert into chain_menu_items (chain_id, name, description, price)
select id, 'Pinto Beans', 'Seasoned pinto beans.', null
from chains where brand_wikidata = 'Q465751';
insert into chain_menu_item_allergen_tags (chain_menu_item_id, allergen_code, status)
select mi.id, v.code, v.status from chain_menu_items mi join chains c on c.id = mi.chain_id
cross join (values ('gluten','safe'),('dairy','safe'),('egg','may_contain'),('peanut','may_contain'),('tree_nut','may_contain'),('sesame','may_contain'),('shellfish','may_contain'),('fish','may_contain'),('vegan','safe'),('vegetarian','safe')) as v(code, status)
where c.brand_wikidata = 'Q465751' and mi.name = 'Pinto Beans';

insert into chain_menu_items (chain_id, name, description, price)
select id, 'Fajita Vegetables', 'Sauteed peppers and onions.', null
from chains where brand_wikidata = 'Q465751';
insert into chain_menu_item_allergen_tags (chain_menu_item_id, allergen_code, status)
select mi.id, v.code, v.status from chain_menu_items mi join chains c on c.id = mi.chain_id
cross join (values ('gluten','safe'),('dairy','safe'),('egg','may_contain'),('peanut','may_contain'),('tree_nut','may_contain'),('sesame','may_contain'),('shellfish','may_contain'),('fish','may_contain'),('vegan','safe'),('vegetarian','safe')) as v(code, status)
where c.brand_wikidata = 'Q465751' and mi.name = 'Fajita Vegetables';

insert into chain_menu_items (chain_id, name, description, price)
select id, 'Queso Blanco', 'Warm white queso dip.', null
from chains where brand_wikidata = 'Q465751';
insert into chain_menu_item_allergen_tags (chain_menu_item_id, allergen_code, status)
select mi.id, v.code, v.status from chain_menu_items mi join chains c on c.id = mi.chain_id
cross join (values ('dairy','contains'),('egg','may_contain'),('peanut','may_contain'),('tree_nut','may_contain'),('sesame','may_contain'),('shellfish','may_contain'),('fish','may_contain'),('vegetarian','safe'),('vegan','contains')) as v(code, status)
where c.brand_wikidata = 'Q465751' and mi.name = 'Queso Blanco';

insert into chain_menu_items (chain_id, name, description, price)
select id, 'Cheese', 'Monterey Jack and cheddar cheese blend, shredded.', null
from chains where brand_wikidata = 'Q465751';
insert into chain_menu_item_allergen_tags (chain_menu_item_id, allergen_code, status)
select mi.id, v.code, v.status from chain_menu_items mi join chains c on c.id = mi.chain_id
cross join (values ('dairy','contains'),('egg','may_contain'),('peanut','may_contain'),('tree_nut','may_contain'),('sesame','may_contain'),('shellfish','may_contain'),('fish','may_contain'),('vegetarian','safe'),('vegan','contains')) as v(code, status)
where c.brand_wikidata = 'Q465751' and mi.name = 'Cheese';

insert into chain_menu_items (chain_id, name, description, price)
select id, 'Sour Cream', 'Sour cream topping.', null
from chains where brand_wikidata = 'Q465751';
insert into chain_menu_item_allergen_tags (chain_menu_item_id, allergen_code, status)
select mi.id, v.code, v.status from chain_menu_items mi join chains c on c.id = mi.chain_id
cross join (values ('dairy','contains'),('egg','may_contain'),('peanut','may_contain'),('tree_nut','may_contain'),('sesame','may_contain'),('shellfish','may_contain'),('fish','may_contain'),('vegetarian','safe'),('vegan','contains')) as v(code, status)
where c.brand_wikidata = 'Q465751' and mi.name = 'Sour Cream';

insert into chain_menu_items (chain_id, name, description, price)
select id, 'Guacamole', 'Fresh guacamole made in-restaurant daily.', null
from chains where brand_wikidata = 'Q465751';
insert into chain_menu_item_allergen_tags (chain_menu_item_id, allergen_code, status)
select mi.id, v.code, v.status from chain_menu_items mi join chains c on c.id = mi.chain_id
cross join (values ('gluten','safe'),('dairy','safe'),('egg','may_contain'),('peanut','may_contain'),('tree_nut','may_contain'),('sesame','may_contain'),('shellfish','may_contain'),('fish','may_contain'),('vegan','safe'),('vegetarian','safe')) as v(code, status)
where c.brand_wikidata = 'Q465751' and mi.name = 'Guacamole';

insert into chain_menu_items (chain_id, name, description, price)
select id, 'Fresh Tomato Salsa', 'Mild tomato salsa.', null
from chains where brand_wikidata = 'Q465751';
insert into chain_menu_item_allergen_tags (chain_menu_item_id, allergen_code, status)
select mi.id, v.code, v.status from chain_menu_items mi join chains c on c.id = mi.chain_id
cross join (values ('gluten','safe'),('dairy','safe'),('egg','may_contain'),('peanut','may_contain'),('tree_nut','may_contain'),('sesame','may_contain'),('shellfish','may_contain'),('fish','may_contain'),('vegan','safe'),('vegetarian','safe')) as v(code, status)
where c.brand_wikidata = 'Q465751' and mi.name = 'Fresh Tomato Salsa';

insert into chain_menu_items (chain_id, name, description, price)
select id, 'Tomatillo-Green Chili Salsa', 'Medium-heat tomatillo and green chili salsa.', null
from chains where brand_wikidata = 'Q465751';
insert into chain_menu_item_allergen_tags (chain_menu_item_id, allergen_code, status)
select mi.id, v.code, v.status from chain_menu_items mi join chains c on c.id = mi.chain_id
cross join (values ('gluten','safe'),('dairy','safe'),('egg','may_contain'),('peanut','may_contain'),('tree_nut','may_contain'),('sesame','may_contain'),('shellfish','may_contain'),('fish','may_contain'),('vegan','safe'),('vegetarian','safe')) as v(code, status)
where c.brand_wikidata = 'Q465751' and mi.name = 'Tomatillo-Green Chili Salsa';

insert into chain_menu_items (chain_id, name, description, price)
select id, 'Tortilla Chips', 'House-made tortilla chips.', null
from chains where brand_wikidata = 'Q465751';
insert into chain_menu_item_allergen_tags (chain_menu_item_id, allergen_code, status)
select mi.id, v.code, v.status from chain_menu_items mi join chains c on c.id = mi.chain_id
cross join (values ('dairy','safe'),('egg','may_contain'),('peanut','may_contain'),('tree_nut','may_contain'),('sesame','may_contain'),('shellfish','may_contain'),('fish','may_contain'),('vegan','safe'),('vegetarian','safe')) as v(code, status)
where c.brand_wikidata = 'Q465751' and mi.name = 'Tortilla Chips';

insert into chain_menu_items (chain_id, name, description, price)
select id, 'Romaine Lettuce', 'Chopped romaine lettuce.', null
from chains where brand_wikidata = 'Q465751';
insert into chain_menu_item_allergen_tags (chain_menu_item_id, allergen_code, status)
select mi.id, v.code, v.status from chain_menu_items mi join chains c on c.id = mi.chain_id
cross join (values ('gluten','safe'),('dairy','safe'),('egg','may_contain'),('peanut','may_contain'),('tree_nut','may_contain'),('sesame','may_contain'),('shellfish','may_contain'),('fish','may_contain'),('vegan','safe'),('vegetarian','safe')) as v(code, status)
where c.brand_wikidata = 'Q465751' and mi.name = 'Romaine Lettuce';

-- =====================================================================
-- Panera Bread (Q7130852)
-- Source: Panera "Allergen Guide" Edition 1 (valid 6/17/2026). Yes = contains,
-- May Contain = may_contain. "No Major Allergens Present" rows are tagged
-- safe for every covered allergen.
-- =====================================================================

insert into chain_menu_items (chain_id, name, description, price)
select id, 'Asiago Cheese Bagel', 'Bagel topped with asiago cheese.', null
from chains where brand_wikidata = 'Q7130852';
insert into chain_menu_item_allergen_tags (chain_menu_item_id, allergen_code, status)
select mi.id, v.code, v.status from chain_menu_items mi join chains c on c.id = mi.chain_id
cross join (values ('gluten','contains'),('tree_nut','may_contain'),('dairy','contains'),('soy','may_contain'),('egg','may_contain')) as v(code, status)
where c.brand_wikidata = 'Q7130852' and mi.name = 'Asiago Cheese Bagel';

insert into chain_menu_items (chain_id, name, description, price)
select id, 'Everything Bagel', 'Bagel topped with a savory seed and seasoning blend.', null
from chains where brand_wikidata = 'Q7130852';
insert into chain_menu_item_allergen_tags (chain_menu_item_id, allergen_code, status)
select mi.id, v.code, v.status from chain_menu_items mi join chains c on c.id = mi.chain_id
cross join (values ('gluten','contains'),('tree_nut','may_contain'),('dairy','may_contain'),('soy','may_contain'),('egg','may_contain'),('sesame','contains')) as v(code, status)
where c.brand_wikidata = 'Q7130852' and mi.name = 'Everything Bagel';

insert into chain_menu_items (chain_id, name, description, price)
select id, 'Plain Bagel', 'Classic plain bagel.', null
from chains where brand_wikidata = 'Q7130852';
insert into chain_menu_item_allergen_tags (chain_menu_item_id, allergen_code, status)
select mi.id, v.code, v.status from chain_menu_items mi join chains c on c.id = mi.chain_id
cross join (values ('gluten','contains'),('tree_nut','may_contain'),('dairy','may_contain'),('soy','may_contain'),('egg','may_contain'),('sesame','contains')) as v(code, status)
where c.brand_wikidata = 'Q7130852' and mi.name = 'Plain Bagel';

insert into chain_menu_items (chain_id, name, description, price)
select id, 'Classic White Loaf', 'Classic white sandwich bread.', null
from chains where brand_wikidata = 'Q7130852';
insert into chain_menu_item_allergen_tags (chain_menu_item_id, allergen_code, status)
select mi.id, v.code, v.status from chain_menu_items mi join chains c on c.id = mi.chain_id
cross join (values ('gluten','contains'),('dairy','contains'),('sesame','may_contain')) as v(code, status)
where c.brand_wikidata = 'Q7130852' and mi.name = 'Classic White Loaf';

insert into chain_menu_items (chain_id, name, description, price)
select id, 'Croissant', 'Buttery, flaky croissant.', null
from chains where brand_wikidata = 'Q7130852';
insert into chain_menu_item_allergen_tags (chain_menu_item_id, allergen_code, status)
select mi.id, v.code, v.status from chain_menu_items mi join chains c on c.id = mi.chain_id
cross join (values ('gluten','contains'),('tree_nut','may_contain'),('dairy','contains'),('soy','may_contain'),('egg','contains'),('sesame','may_contain')) as v(code, status)
where c.brand_wikidata = 'Q7130852' and mi.name = 'Croissant';

insert into chain_menu_items (chain_id, name, description, price)
select id, 'Broccoli Cheddar Soup', 'Cream of broccoli soup with cheddar cheese.', null
from chains where brand_wikidata = 'Q7130852';
insert into chain_menu_item_allergen_tags (chain_menu_item_id, allergen_code, status)
select mi.id, v.code, v.status from chain_menu_items mi join chains c on c.id = mi.chain_id
cross join (values ('gluten','contains'),('dairy','contains')) as v(code, status)
where c.brand_wikidata = 'Q7130852' and mi.name = 'Broccoli Cheddar Soup';

insert into chain_menu_items (chain_id, name, description, price)
select id, 'Vegetarian Black Bean Soup', 'Panera-labeled vegetarian black bean soup.', null
from chains where brand_wikidata = 'Q7130852';
insert into chain_menu_item_allergen_tags (chain_menu_item_id, allergen_code, status)
select mi.id, v.code, v.status from chain_menu_items mi join chains c on c.id = mi.chain_id
cross join (values ('soy','may_contain'),('vegetarian','safe')) as v(code, status)
where c.brand_wikidata = 'Q7130852' and mi.name = 'Vegetarian Black Bean Soup';

insert into chain_menu_items (chain_id, name, description, price)
select id, 'Mac & Cheese', 'Creamy macaroni and cheese, cup size.', null
from chains where brand_wikidata = 'Q7130852';
insert into chain_menu_item_allergen_tags (chain_menu_item_id, allergen_code, status)
select mi.id, v.code, v.status from chain_menu_items mi join chains c on c.id = mi.chain_id
cross join (values ('gluten','contains'),('dairy','contains'),('egg','contains')) as v(code, status)
where c.brand_wikidata = 'Q7130852' and mi.name = 'Mac & Cheese';

insert into chain_menu_items (chain_id, name, description, price)
select id, 'Chicken Caesar Wrap', 'Grilled chicken, romaine and parmesan in a Caesar wrap.', null
from chains where brand_wikidata = 'Q7130852';
insert into chain_menu_item_allergen_tags (chain_menu_item_id, allergen_code, status)
select mi.id, v.code, v.status from chain_menu_items mi join chains c on c.id = mi.chain_id
cross join (values ('gluten','contains'),('dairy','contains'),('soy','contains'),('egg','contains'),('fish','contains'),('sesame','contains'),('vegetarian','contains'),('vegan','contains')) as v(code, status)
where c.brand_wikidata = 'Q7130852' and mi.name = 'Chicken Caesar Wrap';

insert into chain_menu_items (chain_id, name, description, price)
select id, 'Turkey & Cheddar Wrap', 'Oven-roasted turkey and cheddar wrap.', null
from chains where brand_wikidata = 'Q7130852';
insert into chain_menu_item_allergen_tags (chain_menu_item_id, allergen_code, status)
select mi.id, v.code, v.status from chain_menu_items mi join chains c on c.id = mi.chain_id
cross join (values ('gluten','contains'),('dairy','contains'),('soy','contains'),('egg','contains'),('sesame','contains'),('vegetarian','contains'),('vegan','contains')) as v(code, status)
where c.brand_wikidata = 'Q7130852' and mi.name = 'Turkey & Cheddar Wrap';

insert into chain_menu_items (chain_id, name, description, price)
select id, 'Strawberry Poppyseed Salad without Chicken, without Pecans', 'Strawberries and greens with poppyseed dressing; no chicken or pecans.', null
from chains where brand_wikidata = 'Q7130852';
insert into chain_menu_item_allergen_tags (chain_menu_item_id, allergen_code, status)
select mi.id, v.code, v.status from chain_menu_items mi join chains c on c.id = mi.chain_id
cross join (values ('dairy','safe'),('egg','safe'),('gluten','safe'),('soy','safe'),('tree_nut','safe'),('peanut','safe'),('fish','safe'),('shellfish','safe'),('sesame','safe'),('vegetarian','safe')) as v(code, status)
where c.brand_wikidata = 'Q7130852' and mi.name = 'Strawberry Poppyseed Salad without Chicken, without Pecans';

insert into chain_menu_items (chain_id, name, description, price)
select id, 'Fuji Apple Salad without Chicken, without Pecans', 'Fuji apples and mixed greens; no chicken or pecans.', null
from chains where brand_wikidata = 'Q7130852';
insert into chain_menu_item_allergen_tags (chain_menu_item_id, allergen_code, status)
select mi.id, v.code, v.status from chain_menu_items mi join chains c on c.id = mi.chain_id
cross join (values ('dairy','safe'),('egg','safe'),('gluten','safe'),('soy','safe'),('tree_nut','safe'),('peanut','safe'),('fish','safe'),('shellfish','safe'),('sesame','safe'),('vegetarian','safe')) as v(code, status)
where c.brand_wikidata = 'Q7130852' and mi.name = 'Fuji Apple Salad without Chicken, without Pecans';

insert into chain_menu_items (chain_id, name, description, price)
select id, 'Tuna Salad Sandwich', 'Tuna salad on Country Rustic sourdough.', null
from chains where brand_wikidata = 'Q7130852';
insert into chain_menu_item_allergen_tags (chain_menu_item_id, allergen_code, status)
select mi.id, v.code, v.status from chain_menu_items mi join chains c on c.id = mi.chain_id
cross join (values ('gluten','contains'),('dairy','contains'),('soy','contains'),('egg','contains'),('fish','contains'),('sesame','may_contain')) as v(code, status)
where c.brand_wikidata = 'Q7130852' and mi.name = 'Tuna Salad Sandwich';

insert into chain_menu_items (chain_id, name, description, price)
select id, 'Bacon Turkey Bravo', 'Smoked turkey, bacon and tomato on tomato basil bread.', null
from chains where brand_wikidata = 'Q7130852';
insert into chain_menu_item_allergen_tags (chain_menu_item_id, allergen_code, status)
select mi.id, v.code, v.status from chain_menu_items mi join chains c on c.id = mi.chain_id
cross join (values ('gluten','contains'),('dairy','contains'),('soy','contains'),('sesame','may_contain')) as v(code, status)
where c.brand_wikidata = 'Q7130852' and mi.name = 'Bacon Turkey Bravo';

insert into chain_menu_items (chain_id, name, description, price)
select id, 'Toasted Frontega Chicken', 'Chicken, mozzarella and pesto mayo on focaccia.', null
from chains where brand_wikidata = 'Q7130852';
insert into chain_menu_item_allergen_tags (chain_menu_item_id, allergen_code, status)
select mi.id, v.code, v.status from chain_menu_items mi join chains c on c.id = mi.chain_id
cross join (values ('gluten','contains'),('dairy','contains'),('soy','contains'),('sesame','may_contain')) as v(code, status)
where c.brand_wikidata = 'Q7130852' and mi.name = 'Toasted Frontega Chicken';

insert into chain_menu_items (chain_id, name, description, price)
select id, 'Ciabatta Cheesesteak', 'Steak and cheese on ciabatta.', null
from chains where brand_wikidata = 'Q7130852';
insert into chain_menu_item_allergen_tags (chain_menu_item_id, allergen_code, status)
select mi.id, v.code, v.status from chain_menu_items mi join chains c on c.id = mi.chain_id
cross join (values ('gluten','contains'),('dairy','contains'),('soy','contains'),('sesame','may_contain')) as v(code, status)
where c.brand_wikidata = 'Q7130852' and mi.name = 'Ciabatta Cheesesteak';

insert into chain_menu_items (chain_id, name, description, price)
select id, 'Mediterranean Veggie Sandwich', 'Hummus, cucumber, tomato and greens on tomato basil bread.', null
from chains where brand_wikidata = 'Q7130852';
insert into chain_menu_item_allergen_tags (chain_menu_item_id, allergen_code, status)
select mi.id, v.code, v.status from chain_menu_items mi join chains c on c.id = mi.chain_id
cross join (values ('gluten','contains'),('dairy','contains'),('soy','contains'),('vegetarian','safe')) as v(code, status)
where c.brand_wikidata = 'Q7130852' and mi.name = 'Mediterranean Veggie Sandwich';

insert into chain_menu_items (chain_id, name, description, price)
select id, 'Grilled Cheese on Classic White', 'Melted cheese on grilled white bread.', null
from chains where brand_wikidata = 'Q7130852';
insert into chain_menu_item_allergen_tags (chain_menu_item_id, allergen_code, status)
select mi.id, v.code, v.status from chain_menu_items mi join chains c on c.id = mi.chain_id
cross join (values ('gluten','contains'),('dairy','contains'),('soy','contains'),('sesame','may_contain'),('vegetarian','safe')) as v(code, status)
where c.brand_wikidata = 'Q7130852' and mi.name = 'Grilled Cheese on Classic White';

insert into chain_menu_items (chain_id, name, description, price)
select id, 'Bacon Mac & Cheese', 'Mac and cheese topped with bacon.', null
from chains where brand_wikidata = 'Q7130852';
insert into chain_menu_item_allergen_tags (chain_menu_item_id, allergen_code, status)
select mi.id, v.code, v.status from chain_menu_items mi join chains c on c.id = mi.chain_id
cross join (values ('gluten','contains'),('dairy','contains'),('egg','contains')) as v(code, status)
where c.brand_wikidata = 'Q7130852' and mi.name = 'Bacon Mac & Cheese';

-- =====================================================================
-- Subway (Q244457)
-- Source: Subway "U.S. Allergy and Sensitivity Information", January 2026.
-- ● = contains, x/** = may_contain. "*" in the Soybeans column means the
-- ingredient contains only a highly refined soybean oil, which the FDA
-- exempts from allergen labeling, so it is treated as not covered (omitted)
-- rather than tagged.
-- =====================================================================

insert into chain_menu_items (chain_id, name, description, price)
select id, 'Artisan Italian (White) Bread', 'Classic white Italian bread.', null
from chains where brand_wikidata = 'Q244457';
insert into chain_menu_item_allergen_tags (chain_menu_item_id, allergen_code, status)
select mi.id, v.code, v.status from chain_menu_items mi join chains c on c.id = mi.chain_id
cross join (values ('gluten','contains')) as v(code, status)
where c.brand_wikidata = 'Q244457' and mi.name = 'Artisan Italian (White) Bread';

insert into chain_menu_items (chain_id, name, description, price)
select id, 'Italian Herbs and Cheese Bread', 'Italian bread topped with herbs and cheese.', null
from chains where brand_wikidata = 'Q244457';
insert into chain_menu_item_allergen_tags (chain_menu_item_id, allergen_code, status)
select mi.id, v.code, v.status from chain_menu_items mi join chains c on c.id = mi.chain_id
cross join (values ('gluten','contains'),('dairy','contains')) as v(code, status)
where c.brand_wikidata = 'Q244457' and mi.name = 'Italian Herbs and Cheese Bread';

insert into chain_menu_items (chain_id, name, description, price)
select id, '12" Wrap', 'Flour tortilla wrap.', null
from chains where brand_wikidata = 'Q244457';
insert into chain_menu_item_allergen_tags (chain_menu_item_id, allergen_code, status)
select mi.id, v.code, v.status from chain_menu_items mi join chains c on c.id = mi.chain_id
cross join (values ('gluten','contains'),('soy','contains')) as v(code, status)
where c.brand_wikidata = 'Q244457' and mi.name = '12" Wrap';

insert into chain_menu_items (chain_id, name, description, price)
select id, 'Chicken, Grilled', 'Grilled chicken strips.', null
from chains where brand_wikidata = 'Q244457';
insert into chain_menu_item_allergen_tags (chain_menu_item_id, allergen_code, status)
select mi.id, v.code, v.status from chain_menu_items mi join chains c on c.id = mi.chain_id
cross join (values ('soy','contains'),('vegetarian','contains'),('vegan','contains')) as v(code, status)
where c.brand_wikidata = 'Q244457' and mi.name = 'Chicken, Grilled';

insert into chain_menu_items (chain_id, name, description, price)
select id, 'Cold Cut Combo Meats', 'Deli meat blend used in the Cold Cut Combo.', null
from chains where brand_wikidata = 'Q244457';
insert into chain_menu_item_allergen_tags (chain_menu_item_id, allergen_code, status)
select mi.id, v.code, v.status from chain_menu_items mi join chains c on c.id = mi.chain_id
cross join (values ('soy','contains'),('vegetarian','contains'),('vegan','contains')) as v(code, status)
where c.brand_wikidata = 'Q244457' and mi.name = 'Cold Cut Combo Meats';

insert into chain_menu_items (chain_id, name, description, price)
select id, 'Ham (Black Forest)', 'Black Forest ham.', null
from chains where brand_wikidata = 'Q244457';
insert into chain_menu_item_allergen_tags (chain_menu_item_id, allergen_code, status)
select mi.id, v.code, v.status from chain_menu_items mi join chains c on c.id = mi.chain_id
cross join (values ('soy','contains'),('vegetarian','contains'),('vegan','contains')) as v(code, status)
where c.brand_wikidata = 'Q244457' and mi.name = 'Ham (Black Forest)';

insert into chain_menu_items (chain_id, name, description, price)
select id, 'Meatballs & Marinara', 'Meatballs in marinara sauce.', null
from chains where brand_wikidata = 'Q244457';
insert into chain_menu_item_allergen_tags (chain_menu_item_id, allergen_code, status)
select mi.id, v.code, v.status from chain_menu_items mi join chains c on c.id = mi.chain_id
cross join (values ('gluten','contains'),('dairy','contains'),('soy','contains'),('vegetarian','contains'),('vegan','contains')) as v(code, status)
where c.brand_wikidata = 'Q244457' and mi.name = 'Meatballs & Marinara';

insert into chain_menu_items (chain_id, name, description, price)
select id, 'Tuna Salad', 'Tuna mixed with mayonnaise.', null
from chains where brand_wikidata = 'Q244457';
insert into chain_menu_item_allergen_tags (chain_menu_item_id, allergen_code, status)
select mi.id, v.code, v.status from chain_menu_items mi join chains c on c.id = mi.chain_id
cross join (values ('egg','contains'),('fish','contains'),('vegetarian','contains'),('vegan','contains')) as v(code, status)
where c.brand_wikidata = 'Q244457' and mi.name = 'Tuna Salad';

insert into chain_menu_items (chain_id, name, description, price)
select id, 'Turkey Breast, Oven Roasted', 'Oven-roasted turkey breast.', null
from chains where brand_wikidata = 'Q244457';
insert into chain_menu_item_allergen_tags (chain_menu_item_id, allergen_code, status)
select mi.id, v.code, v.status from chain_menu_items mi join chains c on c.id = mi.chain_id
cross join (values ('egg','safe'),('fish','safe'),('dairy','safe'),('peanut','safe'),('sesame','safe'),('shellfish','safe'),('tree_nut','safe'),('vegetarian','contains'),('vegan','contains')) as v(code, status)
where c.brand_wikidata = 'Q244457' and mi.name = 'Turkey Breast, Oven Roasted';

insert into chain_menu_items (chain_id, name, description, price)
select id, 'Veggie Patty', 'Plant-based veggie patty.', null
from chains where brand_wikidata = 'Q244457';
insert into chain_menu_item_allergen_tags (chain_menu_item_id, allergen_code, status)
select mi.id, v.code, v.status from chain_menu_items mi join chains c on c.id = mi.chain_id
cross join (values ('soy','contains')) as v(code, status)
where c.brand_wikidata = 'Q244457' and mi.name = 'Veggie Patty';

insert into chain_menu_items (chain_id, name, description, price)
select id, 'American Cheese', 'Processed American cheese.', null
from chains where brand_wikidata = 'Q244457';
insert into chain_menu_item_allergen_tags (chain_menu_item_id, allergen_code, status)
select mi.id, v.code, v.status from chain_menu_items mi join chains c on c.id = mi.chain_id
cross join (values ('dairy','contains'),('soy','contains'),('vegetarian','safe')) as v(code, status)
where c.brand_wikidata = 'Q244457' and mi.name = 'American Cheese';

insert into chain_menu_items (chain_id, name, description, price)
select id, 'Pepperjack Cheese', 'Pepperjack cheese slice.', null
from chains where brand_wikidata = 'Q244457';
insert into chain_menu_item_allergen_tags (chain_menu_item_id, allergen_code, status)
select mi.id, v.code, v.status from chain_menu_items mi join chains c on c.id = mi.chain_id
cross join (values ('dairy','contains'),('soy','contains'),('vegetarian','safe')) as v(code, status)
where c.brand_wikidata = 'Q244457' and mi.name = 'Pepperjack Cheese';

insert into chain_menu_items (chain_id, name, description, price)
select id, 'Provolone Cheese', 'Provolone cheese slice.', null
from chains where brand_wikidata = 'Q244457';
insert into chain_menu_item_allergen_tags (chain_menu_item_id, allergen_code, status)
select mi.id, v.code, v.status from chain_menu_items mi join chains c on c.id = mi.chain_id
cross join (values ('dairy','contains'),('soy','safe'),('vegetarian','safe')) as v(code, status)
where c.brand_wikidata = 'Q244457' and mi.name = 'Provolone Cheese';

insert into chain_menu_items (chain_id, name, description, price)
select id, 'Mayonnaise', 'Regular mayonnaise.', null
from chains where brand_wikidata = 'Q244457';
insert into chain_menu_item_allergen_tags (chain_menu_item_id, allergen_code, status)
select mi.id, v.code, v.status from chain_menu_items mi join chains c on c.id = mi.chain_id
cross join (values ('egg','contains'),('vegetarian','safe'),('vegan','contains')) as v(code, status)
where c.brand_wikidata = 'Q244457' and mi.name = 'Mayonnaise';

insert into chain_menu_items (chain_id, name, description, price)
select id, 'Honey Mustard Sauce', 'Honey mustard sauce.', null
from chains where brand_wikidata = 'Q244457';
insert into chain_menu_item_allergen_tags (chain_menu_item_id, allergen_code, status)
select mi.id, v.code, v.status from chain_menu_items mi join chains c on c.id = mi.chain_id
cross join (values ('egg','contains'),('vegetarian','safe'),('vegan','contains')) as v(code, status)
where c.brand_wikidata = 'Q244457' and mi.name = 'Honey Mustard Sauce';

insert into chain_menu_items (chain_id, name, description, price)
select id, 'Sweet Onion Teriyaki Sauce', 'Sweet onion teriyaki sauce (contains poppy seeds).', null
from chains where brand_wikidata = 'Q244457';
insert into chain_menu_item_allergen_tags (chain_menu_item_id, allergen_code, status)
select mi.id, v.code, v.status from chain_menu_items mi join chains c on c.id = mi.chain_id
cross join (values ('gluten','contains'),('soy','contains'),('sesame','contains'),('vegetarian','safe'),('vegan','safe')) as v(code, status)
where c.brand_wikidata = 'Q244457' and mi.name = 'Sweet Onion Teriyaki Sauce';

insert into chain_menu_items (chain_id, name, description, price)
select id, 'Lettuce', 'Fresh lettuce.', null
from chains where brand_wikidata = 'Q244457';
insert into chain_menu_item_allergen_tags (chain_menu_item_id, allergen_code, status)
select mi.id, v.code, v.status from chain_menu_items mi join chains c on c.id = mi.chain_id
cross join (values ('egg','safe'),('fish','safe'),('dairy','safe'),('peanut','safe'),('sesame','safe'),('shellfish','safe'),('soy','safe'),('tree_nut','safe'),('vegetarian','safe'),('vegan','safe')) as v(code, status)
where c.brand_wikidata = 'Q244457' and mi.name = 'Lettuce';

insert into chain_menu_items (chain_id, name, description, price)
select id, 'Cookie, Chocolate Chip', 'Chocolate chip cookie.', null
from chains where brand_wikidata = 'Q244457';
insert into chain_menu_item_allergen_tags (chain_menu_item_id, allergen_code, status)
select mi.id, v.code, v.status from chain_menu_items mi join chains c on c.id = mi.chain_id
cross join (values ('gluten','contains'),('dairy','contains'),('egg','contains'),('soy','contains'),('peanut','may_contain'),('tree_nut','may_contain'),('vegetarian','safe')) as v(code, status)
where c.brand_wikidata = 'Q244457' and mi.name = 'Cookie, Chocolate Chip';

insert into chain_menu_items (chain_id, name, description, price)
select id, 'Cookie, White Chip Macadamia Nut', 'White chocolate chip macadamia nut cookie.', null
from chains where brand_wikidata = 'Q244457';
insert into chain_menu_item_allergen_tags (chain_menu_item_id, allergen_code, status)
select mi.id, v.code, v.status from chain_menu_items mi join chains c on c.id = mi.chain_id
cross join (values ('gluten','contains'),('dairy','contains'),('egg','contains'),('soy','contains'),('peanut','may_contain'),('tree_nut','contains'),('vegetarian','safe')) as v(code, status)
where c.brand_wikidata = 'Q244457' and mi.name = 'Cookie, White Chip Macadamia Nut';

-- =====================================================================
-- Five Guys (Q1131810)
-- Source: Five Guys "Nutrition & Allergen Guide" (USA, June 2026), including
-- its per-ingredient "Contains" / "May contain" statements. Fries are cooked
-- only in refined peanut oil, which Five Guys lists directly in the
-- ingredient statement, so peanut is tagged contains for the fries.
-- =====================================================================

insert into chain_menu_items (chain_id, name, description, price)
select id, 'Hamburger Bun', 'Standard hamburger bun.', null
from chains where brand_wikidata = 'Q1131810';
insert into chain_menu_item_allergen_tags (chain_menu_item_id, allergen_code, status)
select mi.id, v.code, v.status from chain_menu_items mi join chains c on c.id = mi.chain_id
cross join (values ('gluten','contains'),('egg','contains'),('dairy','contains'),('soy','contains'),('sesame','may_contain'),('vegetarian','contains'),('vegan','contains')) as v(code, status)
where c.brand_wikidata = 'Q1131810' and mi.name = 'Hamburger Bun';

insert into chain_menu_items (chain_id, name, description, price)
select id, 'Hot Dog Bun', 'Standard hot dog bun.', null
from chains where brand_wikidata = 'Q1131810';
insert into chain_menu_item_allergen_tags (chain_menu_item_id, allergen_code, status)
select mi.id, v.code, v.status from chain_menu_items mi join chains c on c.id = mi.chain_id
cross join (values ('gluten','contains'),('egg','contains'),('dairy','contains'),('soy','contains'),('sesame','may_contain'),('vegetarian','contains'),('vegan','contains')) as v(code, status)
where c.brand_wikidata = 'Q1131810' and mi.name = 'Hot Dog Bun';

insert into chain_menu_items (chain_id, name, description, price)
select id, 'Hamburger Patty', '100% beef hamburger patty.', null
from chains where brand_wikidata = 'Q1131810';
insert into chain_menu_item_allergen_tags (chain_menu_item_id, allergen_code, status)
select mi.id, v.code, v.status from chain_menu_items mi join chains c on c.id = mi.chain_id
cross join (values ('dairy','safe'),('egg','safe'),('soy','safe'),('peanut','safe'),('tree_nut','safe'),('fish','safe'),('shellfish','safe'),('sesame','safe'),('vegetarian','contains'),('vegan','contains')) as v(code, status)
where c.brand_wikidata = 'Q1131810' and mi.name = 'Hamburger Patty';

insert into chain_menu_items (chain_id, name, description, price)
select id, 'Hot Dog', '100% beef hot dog.', null
from chains where brand_wikidata = 'Q1131810';
insert into chain_menu_item_allergen_tags (chain_menu_item_id, allergen_code, status)
select mi.id, v.code, v.status from chain_menu_items mi join chains c on c.id = mi.chain_id
cross join (values ('soy','contains'),('dairy','safe'),('egg','safe'),('peanut','safe'),('tree_nut','safe'),('fish','safe'),('shellfish','safe'),('sesame','safe'),('vegetarian','contains'),('vegan','contains')) as v(code, status)
where c.brand_wikidata = 'Q1131810' and mi.name = 'Hot Dog';

insert into chain_menu_items (chain_id, name, description, price)
select id, 'Bacon', 'Cured bacon.', null
from chains where brand_wikidata = 'Q1131810';
insert into chain_menu_item_allergen_tags (chain_menu_item_id, allergen_code, status)
select mi.id, v.code, v.status from chain_menu_items mi join chains c on c.id = mi.chain_id
cross join (values ('dairy','safe'),('egg','safe'),('gluten','safe'),('soy','safe'),('peanut','safe'),('tree_nut','safe'),('fish','safe'),('shellfish','safe'),('sesame','safe'),('vegetarian','contains'),('vegan','contains')) as v(code, status)
where c.brand_wikidata = 'Q1131810' and mi.name = 'Bacon';

insert into chain_menu_items (chain_id, name, description, price)
select id, 'American Cheese', 'American cheese slice for burgers and sandwiches.', null
from chains where brand_wikidata = 'Q1131810';
insert into chain_menu_item_allergen_tags (chain_menu_item_id, allergen_code, status)
select mi.id, v.code, v.status from chain_menu_items mi join chains c on c.id = mi.chain_id
cross join (values ('dairy','contains'),('egg','safe'),('soy','safe'),('peanut','safe'),('tree_nut','safe'),('fish','safe'),('shellfish','safe'),('sesame','safe'),('vegetarian','safe')) as v(code, status)
where c.brand_wikidata = 'Q1131810' and mi.name = 'American Cheese';

insert into chain_menu_items (chain_id, name, description, price)
select id, 'Five Guys Style Fries', 'Fresh-cut potatoes, cooked only in refined peanut oil.', null
from chains where brand_wikidata = 'Q1131810';
insert into chain_menu_item_allergen_tags (chain_menu_item_id, allergen_code, status)
select mi.id, v.code, v.status from chain_menu_items mi join chains c on c.id = mi.chain_id
cross join (values ('peanut','contains'),('dairy','safe'),('egg','safe'),('soy','safe'),('tree_nut','safe'),('fish','safe'),('shellfish','safe'),('sesame','safe'),('vegetarian','safe'),('vegan','safe')) as v(code, status)
where c.brand_wikidata = 'Q1131810' and mi.name = 'Five Guys Style Fries';

insert into chain_menu_items (chain_id, name, description, price)
select id, 'Cajun Style Fries', 'Fresh-cut potatoes with Cajun seasoning, cooked only in refined peanut oil.', null
from chains where brand_wikidata = 'Q1131810';
insert into chain_menu_item_allergen_tags (chain_menu_item_id, allergen_code, status)
select mi.id, v.code, v.status from chain_menu_items mi join chains c on c.id = mi.chain_id
cross join (values ('peanut','contains'),('dairy','safe'),('egg','safe'),('soy','safe'),('tree_nut','safe'),('fish','safe'),('shellfish','safe'),('sesame','safe'),('vegetarian','safe'),('vegan','safe')) as v(code, status)
where c.brand_wikidata = 'Q1131810' and mi.name = 'Cajun Style Fries';

insert into chain_menu_items (chain_id, name, description, price)
select id, 'Vanilla Milkshake', 'Hand-dipped vanilla milkshake base.', null
from chains where brand_wikidata = 'Q1131810';
insert into chain_menu_item_allergen_tags (chain_menu_item_id, allergen_code, status)
select mi.id, v.code, v.status from chain_menu_items mi join chains c on c.id = mi.chain_id
cross join (values ('dairy','contains'),('vegetarian','safe')) as v(code, status)
where c.brand_wikidata = 'Q1131810' and mi.name = 'Vanilla Milkshake';

insert into chain_menu_items (chain_id, name, description, price)
select id, 'Peanut Butter Shake Mix-in', 'Peanut butter milkshake mix-in.', null
from chains where brand_wikidata = 'Q1131810';
insert into chain_menu_item_allergen_tags (chain_menu_item_id, allergen_code, status)
select mi.id, v.code, v.status from chain_menu_items mi join chains c on c.id = mi.chain_id
cross join (values ('dairy','contains'),('peanut','contains'),('soy','contains'),('tree_nut','may_contain'),('gluten','may_contain'),('vegetarian','safe')) as v(code, status)
where c.brand_wikidata = 'Q1131810' and mi.name = 'Peanut Butter Shake Mix-in';

insert into chain_menu_items (chain_id, name, description, price)
select id, 'Reese''s Peanut Butter Cup Shake Mix-in', 'Reese''s Peanut Butter Cup milkshake mix-in.', null
from chains where brand_wikidata = 'Q1131810';
insert into chain_menu_item_allergen_tags (chain_menu_item_id, allergen_code, status)
select mi.id, v.code, v.status from chain_menu_items mi join chains c on c.id = mi.chain_id
cross join (values ('dairy','contains'),('peanut','contains'),('soy','contains'),('tree_nut','may_contain'),('gluten','may_contain'),('vegetarian','safe')) as v(code, status)
where c.brand_wikidata = 'Q1131810' and mi.name = 'Reese''s Peanut Butter Cup Shake Mix-in';

insert into chain_menu_items (chain_id, name, description, price)
select id, 'Cheese Sauce', 'Warm cheese sauce dip.', null
from chains where brand_wikidata = 'Q1131810';
insert into chain_menu_item_allergen_tags (chain_menu_item_id, allergen_code, status)
select mi.id, v.code, v.status from chain_menu_items mi join chains c on c.id = mi.chain_id
cross join (values ('dairy','contains'),('vegetarian','safe')) as v(code, status)
where c.brand_wikidata = 'Q1131810' and mi.name = 'Cheese Sauce';

insert into chain_menu_items (chain_id, name, description, price)
select id, 'Mayonnaise', 'Regular mayonnaise topping.', null
from chains where brand_wikidata = 'Q1131810';
insert into chain_menu_item_allergen_tags (chain_menu_item_id, allergen_code, status)
select mi.id, v.code, v.status from chain_menu_items mi join chains c on c.id = mi.chain_id
cross join (values ('egg','contains'),('vegetarian','safe'),('vegan','contains')) as v(code, status)
where c.brand_wikidata = 'Q1131810' and mi.name = 'Mayonnaise';

insert into chain_menu_items (chain_id, name, description, price)
select id, 'Bulk Peanuts', 'Free in-shell roasted peanuts, self-serve.', null
from chains where brand_wikidata = 'Q1131810';
insert into chain_menu_item_allergen_tags (chain_menu_item_id, allergen_code, status)
select mi.id, v.code, v.status from chain_menu_items mi join chains c on c.id = mi.chain_id
cross join (values ('peanut','contains'),('vegetarian','safe'),('vegan','safe')) as v(code, status)
where c.brand_wikidata = 'Q1131810' and mi.name = 'Bulk Peanuts';

insert into chain_menu_items (chain_id, name, description, price)
select id, 'Lettuce Topping', 'Fresh iceberg lettuce topping.', null
from chains where brand_wikidata = 'Q1131810';
insert into chain_menu_item_allergen_tags (chain_menu_item_id, allergen_code, status)
select mi.id, v.code, v.status from chain_menu_items mi join chains c on c.id = mi.chain_id
cross join (values ('dairy','safe'),('egg','safe'),('gluten','safe'),('soy','safe'),('peanut','safe'),('tree_nut','safe'),('fish','safe'),('shellfish','safe'),('sesame','safe'),('vegetarian','safe'),('vegan','safe')) as v(code, status)
where c.brand_wikidata = 'Q1131810' and mi.name = 'Lettuce Topping';

insert into chain_menu_items (chain_id, name, description, price)
select id, 'Grilled Onions', 'Fresh onions, grilled.', null
from chains where brand_wikidata = 'Q1131810';
insert into chain_menu_item_allergen_tags (chain_menu_item_id, allergen_code, status)
select mi.id, v.code, v.status from chain_menu_items mi join chains c on c.id = mi.chain_id
cross join (values ('dairy','safe'),('egg','safe'),('gluten','safe'),('soy','safe'),('peanut','safe'),('tree_nut','safe'),('fish','safe'),('shellfish','safe'),('sesame','safe'),('vegetarian','safe'),('vegan','safe')) as v(code, status)
where c.brand_wikidata = 'Q1131810' and mi.name = 'Grilled Onions';

insert into chain_menu_items (chain_id, name, description, price)
select id, 'Ketchup', 'Ketchup topping.', null
from chains where brand_wikidata = 'Q1131810';
insert into chain_menu_item_allergen_tags (chain_menu_item_id, allergen_code, status)
select mi.id, v.code, v.status from chain_menu_items mi join chains c on c.id = mi.chain_id
cross join (values ('dairy','safe'),('egg','safe'),('gluten','safe'),('soy','safe'),('peanut','safe'),('tree_nut','safe'),('fish','safe'),('shellfish','safe'),('sesame','safe'),('vegetarian','safe'),('vegan','safe')) as v(code, status)
where c.brand_wikidata = 'Q1131810' and mi.name = 'Ketchup';
