-- Safe Bites demo seed: short descriptions for the 12 seeded restaurants.
-- Run AFTER migrations/0006_restaurant_descriptions.sql and both
-- demo-seed-schenectady-12305*.sql files.
--
-- Each description is paraphrased from the source URL stored alongside it
-- (researched 2026-09-24). Updates only -- touches no menu items, tags,
-- ratings, or community submissions. Safe to re-run.

update restaurants set
  description = 'Casual American pub chain serving classic bar fare like wings and prime rib, with happy hour specials and weekly trivia nights.',
  description_source = 'https://www.99restaurants.com/'
where osm_id = 1674094952; -- Ninety Nine Restaurant & Pub

update restaurants set
  description = 'Italian restaurant in the Stockade District with a rotating seasonal menu of risotto, appetizers, and weekend entrees; shares space with Seven Points Brewery and the Van Dyck Music Club.',
  description_source = 'https://www.stellapastabar.com/'
where osm_id = 3872013358; -- Stella Pasta Bar and Bistro

update restaurants set
  description = 'Peruvian restaurant on Altamont Avenue serving traditional Peruvian cuisine.',
  description_source = 'https://mibanderaperuvianrestaurantny.com/'
where osm_id = 8408467706; -- Mi Bandera Peruvian Restaurant

update restaurants set
  description = 'Family-run, third-generation Dominican and Puerto Rican restaurant and sports bar, known for slow-roasted pernil, jerk chicken, and house-made desserts.',
  description_source = 'https://www.caribeschenectady.com/'
where osm_id = 10759583676; -- Caribe Spanish Restaurant and Sports Bar

update restaurants set
  description = 'Neapolitan and New York-style wood-fired pizza inside Frog Alley Brewing at 108 State St, also serving sandwiches and shareable appetizers.',
  description_source = 'https://www.dailygazette.com/news/local/lily-p-frog-alley-brewing-pizza/article_1ee9f7fa-dd87-45f4-a7ec-b38e8b2a43c5.html'
where osm_id = 9740136722; -- Lily P's Wood Fired Pizza Co.

update restaurants set
  description = 'Casual barbecue restaurant specializing in slow-cooked smoked meats, especially brisket and ribs.',
  description_source = 'https://www.meatandcompanynisky.com/'
where osm_id = 7320589996; -- Meat & Company

update restaurants set
  description = 'Chinese restaurant on Union Street offering traditional dishes, with a focus on convenient pickup.',
  description_source = 'https://www.hunanwokchinese.com/'
where osm_id = 763671171; -- Hunan Wok Chinese Restaurant

update restaurants set
  description = 'Halal Indian and Pakistani restaurant known for its breads, appetizers, chicken dishes, and biryani.',
  description_source = 'https://www.tandoorihousehalal.com/'
where osm_id = 773400807; -- Tandoori House

update restaurants set
  description = 'Family Italian restaurant open since 1974, serving rustic regional dishes from the Ciociara area between Rome and Naples, including handmade pasta and spaghetti and meatballs.',
  description_source = 'https://www.ferrarisristorante.com/'
where osm_id = 1546138578; -- Ferrari's Ristorante

update restaurants set
  description = 'Japanese restaurant in Mohawk Plaza serving sushi, hibachi, sauteed noodles, and curry.',
  description_source = 'https://www.mizusushijapanese.com/'
where osm_id = 3054623686; -- Mizu Sushi

update restaurants set
  description = 'Halal Mediterranean and Afghan restaurant known for bold spice blends in kebabs, bowls, wraps, and falafel, with build-your-own bowls.',
  description_source = 'https://zaffronk.com/'
where osm_id = 8408461687; -- Zaffron Kitchen

update restaurants set
  description = 'Small, casual Thai and Vietnamese restaurant (also operating as Rama Thai Bistro), known for its pho, Panang curry, and Pad Thai.',
  description_source = 'https://www.dailygazette.com/food/at-the-table-fresh-thai-flavors-make-schenectady-s-pho-queen-a-great-find/article_d4456f91-de84-5d61-96ff-7b7c7b679a83.html'
where osm_id = 11148902151; -- Pho Queen

-- Research dates for the two Schenectady batches. Migration 0007 backfills
-- these too, but only for rows that existed when it ran, so on a fresh setup
-- (migrations first, then seeds) they're set here.
update restaurants set reviewed_at = '2026-09-22'
 where reviewed_at is null
   and osm_id in (763671171, 773400807, 1546138578, 3054623686, 8408461687, 11148902151);
update restaurants set reviewed_at = '2026-09-23'
 where reviewed_at is null
   and osm_id in (1674094952, 3872013358, 8408467706, 10759583676, 9740136722, 7320589996);
