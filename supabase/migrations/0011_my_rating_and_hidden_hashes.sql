-- Safe Bites: "your rating" lookup, and hiding the device/owner fingerprints.
--
-- 1. my_rating() returns this device's rating for a restaurant, so the page
--    can show "Your rating" and offer "Edit your rating" when you come back.
-- 2. The public (anon) role can no longer read ratings.device_hash or the
--    owner_hash columns. They're one-way hashes, but readable they would let
--    someone link ratings or entries made from the same phone. The app now
--    selects only the columns it shows. The database functions still use
--    these columns internally.
--
-- Supabase may warn about "destructive operations": this changes column
-- permissions only. No data is changed or deleted.

create or replace function my_rating(p_osm_id bigint, p_device_id text)
returns table (
  accuracy_rating smallint,
  accommodation_rating smallint,
  comment text,
  created_at timestamptz,
  updated_at timestamptz
)
language sql
stable
security definer
set search_path = public, extensions
as $$
  select r.accuracy_rating, r.accommodation_rating, r.comment, r.created_at, r.updated_at
    from ratings r
   where r.osm_id = p_osm_id
     and p_device_id is not null
     and r.device_hash = encode(digest(p_device_id, 'sha256'), 'hex')
   limit 1;
$$;

grant execute on function my_rating(bigint, text) to anon;

-- Column-level read access for anon: everything except the hashes.
revoke select on ratings from anon;
grant select (id, osm_id, restaurant_name, accuracy_rating, accommodation_rating, comment, created_at, updated_at)
  on ratings to anon;

revoke select on community_menu_items from anon;
grant select (id, osm_id, restaurant_name, name, description, price, created_at, updated_at, report_count)
  on community_menu_items to anon;

revoke select on menu_item_allergen_feedback from anon;
grant select (id, menu_item_id, allergen_code, status, comment, created_at, updated_at, report_count)
  on menu_item_allergen_feedback to anon;
