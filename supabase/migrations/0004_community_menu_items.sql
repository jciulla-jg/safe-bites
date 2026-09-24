-- Safe Bites: community-submitted menu items for restaurants that have NO
-- reviewed safety data yet (no row in menu_items/menu_item_allergen_tags
-- for their osm_id).
--
-- Kept in its own tables, entirely separate from menu_items /
-- menu_item_allergen_tags, and keyed by osm_id -- like `ratings` -- rather
-- than a restaurants.id foreign key, since these restaurants have no
-- restaurants row at all. This is diner-submitted and unverified, shown in
-- the app labeled as such, and never promoted into the curated tables or
-- read by the app's safety computation (src/lib/safetyStatus.ts).

create table if not exists community_menu_items (
  id uuid primary key default gen_random_uuid(),
  osm_id bigint not null,
  restaurant_name text not null,
  name text not null,
  description text,
  price numeric,
  created_at timestamptz not null default now()
);

create table if not exists community_menu_item_allergen_tags (
  id uuid primary key default gen_random_uuid(),
  community_menu_item_id uuid not null references community_menu_items(id) on delete cascade,
  allergen_code text not null references allergens(code),
  status text not null check (status in ('safe', 'contains', 'may_contain')),
  unique (community_menu_item_id, allergen_code)
);

alter table community_menu_items enable row level security;
alter table community_menu_item_allergen_tags enable row level security;

create policy "public read community_menu_items"
  on community_menu_items for select
  to anon
  using (true);

create policy "public insert community_menu_items"
  on community_menu_items for insert
  to anon
  with check (true);

create policy "public read community_menu_item_allergen_tags"
  on community_menu_item_allergen_tags for select
  to anon
  using (true);

create policy "public insert community_menu_item_allergen_tags"
  on community_menu_item_allergen_tags for insert
  to anon
  with check (true);
