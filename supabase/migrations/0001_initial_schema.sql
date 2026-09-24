-- Safe Bites: initial schema
-- Per ADR-0002 / architecture/technology-stack.md: no auth, no user accounts.
-- The restriction profile lives on-device only and is never stored here.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- allergens: canonical list of restriction/allergen codes selectable in the
-- on-device restriction profile, and used to tag menu items below.
-- ---------------------------------------------------------------------------
create table if not exists allergens (
  code text primary key,
  label text not null,
  sort_order int not null default 0
);

-- ---------------------------------------------------------------------------
-- restaurants: manually-seeded safety-data anchor for a live-discovered
-- OpenStreetMap restaurant. osm_id is the OSM node/way id used to match a
-- live Overpass search result to seeded data (see ADR-0002's hybrid
-- allergen-data decision). Not every live-discovered restaurant has a row
-- here -- absence means "no safety data yet".
-- ---------------------------------------------------------------------------
create table if not exists restaurants (
  id uuid primary key default gen_random_uuid(),
  osm_id bigint not null unique,
  name text not null,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- menu_items: menu items belonging to a seeded restaurant.
-- ---------------------------------------------------------------------------
create table if not exists menu_items (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references restaurants(id) on delete cascade,
  name text not null,
  description text,
  price numeric,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- menu_item_allergen_tags: per-menu-item allergen safety status.
-- ---------------------------------------------------------------------------
create table if not exists menu_item_allergen_tags (
  id uuid primary key default gen_random_uuid(),
  menu_item_id uuid not null references menu_items(id) on delete cascade,
  allergen_code text not null references allergens(code),
  status text not null check (status in ('safe', 'contains', 'may_contain')),
  unique (menu_item_id, allergen_code)
);

-- ---------------------------------------------------------------------------
-- ratings: two-axis (data accuracy, restaurant accommodation) ratings.
-- Deliberately NOT foreign-keyed to restaurants -- any live-discovered
-- restaurant can be rated even if it has no seeded safety data yet.
-- restaurant_name is denormalized so ratings remain readable/displayable
-- without a join back to a (possibly nonexistent) restaurants row.
-- ---------------------------------------------------------------------------
create table if not exists ratings (
  id uuid primary key default gen_random_uuid(),
  osm_id bigint not null,
  restaurant_name text not null,
  accuracy_rating smallint not null check (accuracy_rating between 1 and 5),
  accommodation_rating smallint not null check (accommodation_rating between 1 and 5),
  comment text,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table allergens enable row level security;
alter table restaurants enable row level security;
alter table menu_items enable row level security;
alter table menu_item_allergen_tags enable row level security;
alter table ratings enable row level security;

-- Public (anon) read access on all tables -- the app has no auth and every
-- screen (search results, menu safety data, ratings) reads with the anon key.
create policy "public read allergens"
  on allergens for select
  to anon
  using (true);

create policy "public read restaurants"
  on restaurants for select
  to anon
  using (true);

create policy "public read menu_items"
  on menu_items for select
  to anon
  using (true);

create policy "public read menu_item_allergen_tags"
  on menu_item_allergen_tags for select
  to anon
  using (true);

create policy "public read ratings"
  on ratings for select
  to anon
  using (true);

-- Public (anon) insert access on ratings ONLY -- there's no auth, so anyone
-- with the anon key can submit a rating. allergens/restaurants/menu_items/
-- menu_item_allergen_tags are seeded manually via the Supabase SQL editor
-- or dashboard, not from the app, so they get no insert policy.
create policy "public insert ratings"
  on ratings for insert
  to anon
  with check (true);
