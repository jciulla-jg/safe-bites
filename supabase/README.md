# Supabase setup (Safe Bites)

This folder contains the SQL migrations for the Safe Bites schema
(ADR-0002 / architecture/technology-stack.md) under `migrations/`, plus two
optional demo seed scripts (`demo-seed-*.sql`) at this level. You run all of
them yourself against your own free-tier project via the SQL Editor.

## No Supabase CLI required

For a one-day hackathon build, the fastest path is copy/paste, not the
Supabase CLI:

1. Create a free project at [supabase.com](https://supabase.com) (no credit
   card required).
2. Open your project's **SQL Editor** in the Supabase dashboard.
3. Paste the contents of `migrations/0001_initial_schema.sql`, run it.
4. Paste the contents of `migrations/0002_seed_allergens.sql`, run it.
5. Paste the contents of `migrations/0003_menu_item_allergen_feedback.sql`, run it.
6. Paste the contents of `migrations/0004_community_menu_items.sql`, run it.
7. Paste the contents of `migrations/0005_submission_ownership.sql`, run it.
   (Supabase may warn about "destructive operations" -- it drops the old
   direct-insert policies, which the functions in this file replace.)
8. Paste the contents of `migrations/0006_restaurant_descriptions.sql`, run it.
9. Paste the contents of `migrations/0007_reviews_limits_reports.sql`, run it.
   (It may show the "destructive operations" warning: it replaces two read
   policies so entries with 3+ reports are hidden. No data is deleted.)
10. Paste the contents of `migrations/0008_review_requests.sql`, run it.
   (Powers "Request a safety review". The file ends with a query that lists
   the most-requested restaurants -- handy for picking what to research next.)
11. Paste the contents of `migrations/0009_chains.sql`, run it. (Chain data:
   one chain's official allergen guide covers all its locations, matched by
   the OpenStreetMap `brand:wikidata` tag. Seed with `demo-seed-chains-*.sql`;
   the format is in `chain-seed-format.md`.)
12. Copy your project's URL and anon/public key (Project Settings > API) into
   a `.env` file at the repo root (see `.env.example`):

   ```
   EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   ```

Migrations are numbered and should be run in order. If you add more later,
keep the `NNNN_description.sql` naming so the order stays obvious even
without the CLI's migration history table.

## Seeding restaurant/menu safety data

Per ADR-0002, `restaurants` / `menu_items` / `menu_item_allergen_tags` are
manually seeded by the developer via the SQL Editor or the dashboard's table
editor -- not from the app (there's no insert policy for anon on those
tables, only `select`). Match a seeded restaurant to a live OpenStreetMap
search result via `restaurants.osm_id` (the OSM node/way id).

`ratings`, `menu_item_allergen_feedback`, `community_menu_items`, and
`community_menu_item_allergen_tags` are the tables the app can write to
directly (anon insert policy) -- there's no auth, so any device with the
anon key can submit a rating, per-item feedback, or (for a restaurant with
no reviewed data yet) an entire community-submitted menu item.
`menu_item_allergen_feedback` and `community_menu_items` /
`community_menu_item_allergen_tags` are deliberately separate from
`menu_items` / `menu_item_allergen_tags`: they're diner-submitted and
unverified, shown in the app labeled as such, and never feed into the
app's own safety computation or get promoted into the curated tables.

### Demo seed data

`demo-seed-schenectady-12305.sql` (6 restaurants) and
`demo-seed-schenectady-12305-batch2.sql` (6 more, independent of batch 1 --
run either or both, in any order) seed real nearby restaurants (found live
via the same OpenStreetMap Overpass query the app uses, for zip 12305 /
Schenectady NY) with real, researched menu items and best-effort allergen
tags sourced from each restaurant's actual published menu -- see each file's
header comment for sources and caveats. Run them after the two migrations
above, via the SQL Editor, to make the search/detail screens show real
safety data instead of "no data yet" for those results. Safe to skip
entirely; the app works fine with zero seeded restaurants, it just won't
demo as well. Both files are safe to re-run: each starts by deleting its own
restaurants' menu items (tags cascade) and then re-inserts them, so a rerun
replaces rather than duplicates. Ratings are never touched.

`demo-seed-descriptions.sql` adds a short, sourced description to each of
the 12 (run it after migration 0006 and the two batches). It only updates
the `restaurants` rows, so it's safe to re-run.

`demo-seed-expanded-menus.sql` (run after both batches) grows two restaurants
-- Ninety Nine Restaurant & Pub and Stella Pasta Bar and Bistro -- to about 25
items each, for a fuller demo. The other restaurants keep 5-6 representative
items, not their full menus. Safe to re-run: it deletes only the items it adds.

`demo-seed-albany-12210.sql` seeds 5 restaurants in downtown Albany (zip
12210), with descriptions included: 677 Prime, Jack's Oyster House, Cafe
Capriccio, Viva Empanadas and Mystic Momo. Independent of the other files;
safe to re-run.

`demo-seed-saratoga-12866.sql` seeds 5 restaurants in Saratoga Springs (zip
12866): Hattie's, Chianti Ristorante, Sushi Thai Garden, Scallions and Sara's
Kitchen. Same shape as the Albany file.

**Chain data** (run after migration 0009, any order): `demo-seed-chains-fast-food.sql`
(McDonald's, Taco Bell), `demo-seed-chains-fast-casual.sql` (Chipotle, Panera,
Subway, Five Guys) and `demo-seed-chains-coffee-sit-down.sql` (Dunkin', Olive
Garden, Chili's). Each covers every location of that chain. Wendy's, Burger
King, Starbucks and Applebee's were skipped: their official allergen info
couldn't be read automatically.

**Adding more restaurants later:** research the menu, allergen tags, AND a
1-2 sentence description with its source URL in the same pass, and upsert
`description` / `description_source` in the same `insert into restaurants
... on conflict (osm_id) do update` as the name. Caution: re-running a batch
file deletes and re-inserts that batch's menu items, which also removes any
community feedback attached to those items (it cascades).

12 restaurants total across both batches: Hunan Wok Chinese Restaurant,
Tandoori House, Ferrari's Ristorante, Mizu Sushi, Zaffron Kitchen, Pho Queen,
Ninety Nine Restaurant & Pub, Stella Pasta Bar and Bistro, Mi Bandera
Peruvian Restaurant, Caribe Spanish Restaurant and Sports Bar, Lily P's Wood
Fired Pizza Co., and Meat & Company.

## Free-tier reminder

A free Supabase project auto-pauses after about a week of inactivity. If
there's a gap before a demo, log into the dashboard beforehand to un-pause
it.
