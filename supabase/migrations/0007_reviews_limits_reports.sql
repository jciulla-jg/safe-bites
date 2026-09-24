-- Safe Bites: three small additions in one file.
--   1. A length limit on rating comments (community submissions already have one).
--   2. restaurants.reviewed_at: when a restaurant's reviewed menu was researched,
--      shown on the restaurant page ("Menu reviewed Sep 2026").
--   3. Reporting community entries. Anyone can report per-item feedback or a
--      community menu item; at 3 reports it's hidden from everyone pending
--      review. Hidden rows are kept (report_count >= 3), and the reports log
--      isn't readable from the app. To restore an entry:
--        update community_menu_items set report_count = 0 where id = '...';
--
-- Run AFTER 0006_restaurant_descriptions.sql. Safe to re-run.

-- 1. Rating comment length -------------------------------------------------
alter table ratings drop constraint if exists ratings_comment_length;
alter table ratings add constraint ratings_comment_length
  check (comment is null or char_length(comment) <= 500);

-- 2. Review dates ------------------------------------------------------------
alter table restaurants add column if not exists reviewed_at date;

-- Backfill the 12 seeded restaurants with the dates their menus were researched.
update restaurants set reviewed_at = '2026-09-22'
 where reviewed_at is null
   and osm_id in (763671171, 773400807, 1546138578, 3054623686, 8408461687, 11148902151);
update restaurants set reviewed_at = '2026-09-23'
 where reviewed_at is null
   and osm_id in (1674094952, 3872013358, 8408467706, 10759583676, 9740136722, 7320589996);

-- 3. Reports ------------------------------------------------------------------
alter table menu_item_allergen_feedback add column if not exists report_count integer not null default 0;
alter table community_menu_items add column if not exists report_count integer not null default 0;

create table if not exists submission_reports (
  id uuid primary key default gen_random_uuid(),
  target_type text not null check (target_type in ('feedback', 'community_item')),
  target_id uuid not null,
  created_at timestamptz not null default now()
);
-- RLS on with no policies: the app can't read or write this directly, only
-- through report_submission() below.
alter table submission_reports enable row level security;

-- Hide entries at 3+ reports.
drop policy if exists "public read menu_item_allergen_feedback" on menu_item_allergen_feedback;
create policy "public read menu_item_allergen_feedback"
  on menu_item_allergen_feedback for select
  to anon
  using (report_count < 3);

drop policy if exists "public read community_menu_items" on community_menu_items;
create policy "public read community_menu_items"
  on community_menu_items for select
  to anon
  using (report_count < 3);

create or replace function report_submission(
  p_target_type text,
  p_target_id uuid
) returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_target_type = 'feedback' then
    update menu_item_allergen_feedback set report_count = report_count + 1 where id = p_target_id;
  elsif p_target_type = 'community_item' then
    update community_menu_items set report_count = report_count + 1 where id = p_target_id;
  else
    raise exception 'unknown target type';
  end if;

  if not found then
    return false;
  end if;

  insert into submission_reports (target_type, target_id) values (p_target_type, p_target_id);
  return true;
end;
$$;

grant execute on function report_submission(text, uuid) to anon;
