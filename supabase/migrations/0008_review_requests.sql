-- Safe Bites: diner requests for a restaurant to get reviewed safety data,
-- plus who verified each reviewed restaurant's data (bottom of file).
--
-- "Request a safety review" on a restaurant with no data records one row per
-- device per restaurant, so the developer can see which restaurants diners
-- want researched next (query at the bottom). The device is identified only
-- by the SHA-256 of a random id the app keeps on the device -- no personal
-- data. No direct table access for anon; everything goes through the two
-- functions below.

create table if not exists review_requests (
  id uuid primary key default gen_random_uuid(),
  osm_id bigint not null,
  restaurant_name text not null check (char_length(restaurant_name) <= 200),
  device_hash text not null,
  created_at timestamptz not null default now(),
  unique (osm_id, device_hash)
);

alter table review_requests enable row level security;
-- (no policies: anon can't read or write the table directly)

-- Record a request (a repeat from the same device is ignored); returns the new total.
create or replace function request_review(p_osm_id bigint, p_restaurant_name text, p_device_id text)
returns integer
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  if p_device_id is null or char_length(p_device_id) not between 16 and 100 then
    raise exception 'invalid device id';
  end if;
  insert into review_requests (osm_id, restaurant_name, device_hash)
  values (p_osm_id, left(coalesce(trim(p_restaurant_name), ''), 200),
          encode(digest(p_device_id, 'sha256'), 'hex'))
  on conflict (osm_id, device_hash) do nothing;
  return (select count(*)::integer from review_requests where osm_id = p_osm_id);
end;
$$;

-- How many diners asked, and whether this device already did.
create or replace function review_request_status(p_osm_id bigint, p_device_id text)
returns table (request_count integer, requested_by_me boolean)
language sql
stable
security definer
set search_path = public, extensions
as $$
  select count(*)::integer,
         coalesce(bool_or(device_hash = encode(digest(p_device_id, 'sha256'), 'hex')), false)
    from review_requests
   where osm_id = p_osm_id;
$$;

grant execute on function request_review(bigint, text, text) to anon;
grant execute on function review_request_status(bigint, text) to anon;

-- Who verified a reviewed restaurant's allergen data:
--   safe_bites -- researched by Safe Bites from the published menu (all seeded
--                 restaurants so far)
--   restaurant -- the restaurant itself confirmed the tags. Only set this after
--                 actually hearing from the restaurant, e.g.
--                 update restaurants set verification = 'restaurant',
--                   reviewed_at = current_date where osm_id = ...;
-- Community-submitted items are a separate, always-unverified tier.
alter table restaurants
  add column if not exists verification text not null default 'safe_bites'
    check (verification in ('safe_bites', 'restaurant'));

-- Most-requested restaurants (run this yourself in the SQL Editor):
--   select osm_id, max(restaurant_name) as name, count(*) as requests
--     from review_requests group by osm_id order by requests desc;
