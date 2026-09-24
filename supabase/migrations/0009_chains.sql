-- Safe Bites: chain restaurant data from each chain's official allergen guide.
--
-- One chain's data covers every location of it. A search result is matched
-- to a chain by its OpenStreetMap `brand:wikidata` tag (e.g. Q38076 for
-- McDonald's), which the app already receives from Overpass. A restaurant's
-- own `restaurants` row, if it has one, always wins over its chain's data.
--
-- Same shape as menu_items / menu_item_allergen_tags; read-only for anon,
-- seeded by the developer (supabase/demo-seed-chains-*.sql).

create table if not exists chains (
  id uuid primary key default gen_random_uuid(),
  brand_wikidata text not null unique,
  name text not null,
  -- URL of the official allergen guide the tags were taken from.
  allergen_source text not null,
  reviewed_at date,
  created_at timestamptz not null default now()
);

create table if not exists chain_menu_items (
  id uuid primary key default gen_random_uuid(),
  chain_id uuid not null references chains(id) on delete cascade,
  name text not null,
  description text,
  price numeric(10, 2),
  created_at timestamptz not null default now()
);

create table if not exists chain_menu_item_allergen_tags (
  id uuid primary key default gen_random_uuid(),
  chain_menu_item_id uuid not null references chain_menu_items(id) on delete cascade,
  allergen_code text not null references allergens(code),
  status text not null check (status in ('safe', 'contains', 'may_contain')),
  unique (chain_menu_item_id, allergen_code)
);

create index if not exists chain_menu_items_chain_id_idx on chain_menu_items(chain_id);

alter table chains enable row level security;
alter table chain_menu_items enable row level security;
alter table chain_menu_item_allergen_tags enable row level security;

create policy "public read chains"
  on chains for select to anon using (true);
create policy "public read chain_menu_items"
  on chain_menu_items for select to anon using (true);
create policy "public read chain_menu_item_allergen_tags"
  on chain_menu_item_allergen_tags for select to anon using (true);
