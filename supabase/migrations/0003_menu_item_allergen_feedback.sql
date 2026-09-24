-- Safe Bites: user-submitted allergen feedback on a menu item.
--
-- Kept as its OWN table, separate from the curated menu_item_allergen_tags,
-- so the app's authoritative safety computation (src/lib/safetyStatus.ts)
-- never silently changes based on unverified crowd input. The app surfaces
-- these rows in the UI clearly labeled as unverified community feedback,
-- alongside (never blended into) the reviewed tag.

create table if not exists menu_item_allergen_feedback (
  id uuid primary key default gen_random_uuid(),
  menu_item_id uuid not null references menu_items(id) on delete cascade,
  allergen_code text not null references allergens(code),
  status text not null check (status in ('safe', 'contains', 'may_contain')),
  comment text,
  created_at timestamptz not null default now()
);

alter table menu_item_allergen_feedback enable row level security;

create policy "public read menu_item_allergen_feedback"
  on menu_item_allergen_feedback for select
  to anon
  using (true);

-- Anonymous insert, same posture as `ratings` (0001_initial_schema.sql):
-- no auth, so any device with the anon key can submit feedback. No
-- update/delete policy -- like ratings, this is an append-only log.
create policy "public insert menu_item_allergen_feedback"
  on menu_item_allergen_feedback for insert
  to anon
  with check (true);
