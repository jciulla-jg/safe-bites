-- Safe Bites: limits so one person can't game community data.
--
-- 1. Reports count once per device. Before this, one person calling
--    report_submission three times could hide any entry.
-- 2. One rating per device per restaurant. Rating again updates your rating
--    instead of adding another, so one person can't swing an average.
-- 3. Database-side input checks: no negative prices, and length limits on
--    restaurant names.
--
-- A "device" is identified only by the SHA-256 of a random id the app keeps
-- on the device, the same approach as review requests (0008). No personal
-- data. Supabase may warn about "destructive operations": this replaces the
-- old report function and the direct ratings insert rule. No data is deleted.

-- 1. Reports: once per device -----------------------------------------------
alter table submission_reports add column if not exists device_hash text;
create unique index if not exists submission_reports_once_per_device
  on submission_reports (target_type, target_id, device_hash);

drop function if exists report_submission(text, uuid);

create or replace function report_submission(
  p_target_type text,
  p_target_id uuid,
  p_device_id text
) returns boolean
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_hash text;
  v_inserted integer;
begin
  if p_device_id is null or char_length(p_device_id) not between 16 and 100 then
    raise exception 'invalid device id';
  end if;
  if p_target_type not in ('feedback', 'community_item') then
    raise exception 'unknown target type';
  end if;
  if p_target_type = 'feedback'
     and not exists (select 1 from menu_item_allergen_feedback where id = p_target_id) then
    return false;
  end if;
  if p_target_type = 'community_item'
     and not exists (select 1 from community_menu_items where id = p_target_id) then
    return false;
  end if;

  v_hash := encode(digest(p_device_id, 'sha256'), 'hex');
  insert into submission_reports (target_type, target_id, device_hash)
  values (p_target_type, p_target_id, v_hash)
  on conflict (target_type, target_id, device_hash) do nothing;
  get diagnostics v_inserted = row_count;

  -- A repeat report from the same device is accepted but not counted again.
  if v_inserted = 1 then
    if p_target_type = 'feedback' then
      update menu_item_allergen_feedback set report_count = report_count + 1 where id = p_target_id;
    else
      update community_menu_items set report_count = report_count + 1 where id = p_target_id;
    end if;
  end if;
  return true;
end;
$$;

grant execute on function report_submission(text, uuid, text) to anon;

-- 2. Ratings: one per device per restaurant --------------------------------
alter table ratings add column if not exists device_hash text;
alter table ratings add column if not exists updated_at timestamptz;
-- Older ratings (before this migration) have no device_hash and are kept.
create unique index if not exists ratings_one_per_device
  on ratings (osm_id, device_hash) where device_hash is not null;

drop policy if exists "public insert ratings" on ratings;

-- Returns true when this device had already rated the restaurant (updated).
create or replace function submit_rating(
  p_osm_id bigint,
  p_restaurant_name text,
  p_accuracy_rating smallint,
  p_accommodation_rating smallint,
  p_comment text,
  p_device_id text
) returns boolean
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_hash text;
  v_existed boolean;
begin
  if p_device_id is null or char_length(p_device_id) not between 16 and 100 then
    raise exception 'invalid device id';
  end if;
  v_hash := encode(digest(p_device_id, 'sha256'), 'hex');
  select exists (select 1 from ratings where osm_id = p_osm_id and device_hash = v_hash) into v_existed;

  insert into ratings (osm_id, restaurant_name, accuracy_rating, accommodation_rating, comment, device_hash)
  values (p_osm_id, left(trim(p_restaurant_name), 200), p_accuracy_rating, p_accommodation_rating,
          nullif(trim(p_comment), ''), v_hash)
  on conflict (osm_id, device_hash) where device_hash is not null do update
    set accuracy_rating = excluded.accuracy_rating,
        accommodation_rating = excluded.accommodation_rating,
        comment = excluded.comment,
        updated_at = now();
  return v_existed;
end;
$$;

grant execute on function submit_rating(bigint, text, smallint, smallint, text, text) to anon;

-- 3. Input checks -------------------------------------------------------------
-- `not valid` applies the checks to new and edited rows without rejecting
-- anything already stored.
alter table community_menu_items drop constraint if exists community_menu_items_price_nonnegative;
alter table community_menu_items add constraint community_menu_items_price_nonnegative
  check (price is null or (price >= 0 and price < 10000)) not valid;

alter table community_menu_items drop constraint if exists community_menu_items_restaurant_name_length;
alter table community_menu_items add constraint community_menu_items_restaurant_name_length
  check (char_length(restaurant_name) <= 200) not valid;

alter table ratings drop constraint if exists ratings_restaurant_name_length;
alter table ratings add constraint ratings_restaurant_name_length
  check (char_length(restaurant_name) <= 200) not valid;
