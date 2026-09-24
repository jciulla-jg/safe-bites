-- Safe Bites: limits that can't be dodged by inventing device ids, a basic
-- content filter, and tighter function permissions.
--
-- 1. Per-network rate limits. Every diner write is counted against a hash of
--    the caller's IP address (never the IP itself) for one hour. Limits are
--    generous, because a demo audience on one Wi-Fi shares a single IP.
-- 2. Content filter. Community text (item names and descriptions, feedback
--    and rating comments) can't contain links, email addresses or phone
--    numbers, or any term listed in blocked_terms (add your own; see
--    supabase/admin-queries.sql).
-- 3. Anonymous accounts. A signed-in phone is identified by a server-issued
--    account id instead of a device id it makes up (see section 3). Signed-in
--    callers get the same access anon has today, and the app functions are no
--    longer callable by PUBLIC.
--
-- The limits and the filter run as triggers on the tables. Rows written from
-- the SQL Editor (seeds, your own fixes) carry no request headers and are
-- never limited or filtered.
--
-- Safe to run before or after the app update: callers that aren't signed in
-- keep working exactly as today.
--
-- Supabase may warn about "destructive operations": this replaces five
-- functions, widens read rules to include signed-in callers, and removes
-- PUBLIC's access to the app functions. No data is changed.

-- Hash of the caller's IP, or null outside an app request ------------------
create or replace function _request_ip_hash() returns text
language plpgsql
stable
set search_path = public, extensions
as $$
declare
  v_headers json;
  v_ip text;
begin
  v_headers := nullif(current_setting('request.headers', true), '')::json;
  if v_headers is null then
    return null;
  end if;
  v_ip := split_part(coalesce(v_headers ->> 'x-forwarded-for', v_headers ->> 'x-real-ip', ''), ',', 1);
  if trim(v_ip) = '' then
    return null;
  end if;
  return encode(digest('safe-bites:' || trim(v_ip), 'sha256'), 'hex');
end;
$$;

-- 1. Rate limits -------------------------------------------------------------
create table if not exists write_log (
  id bigint generated always as identity primary key,
  action text not null,
  ip_hash text not null,
  created_at timestamptz not null default now()
);
create index if not exists write_log_lookup on write_log (action, ip_hash, created_at);
alter table write_log enable row level security;
-- (no policies: only the triggers below touch it)

create or replace function _enforce_rate_limit() returns trigger
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_ip text := _request_ip_hash();
  v_action text := tg_argv[0];
  v_limit integer := tg_argv[1]::integer;
  v_recent integer;
begin
  if v_ip is null then
    return new; -- SQL Editor / seeds: not limited
  end if;
  select count(*) into v_recent
    from write_log
   where action = v_action and ip_hash = v_ip and created_at > now() - interval '1 hour';
  if v_recent >= v_limit then
    raise exception 'rate_limited: too many submissions from this network, try again later';
  end if;
  insert into write_log (action, ip_hash) values (v_action, v_ip);
  -- Keep the log small: drop entries older than a day now and then.
  if random() < 0.02 then
    delete from write_log where created_at < now() - interval '1 day';
  end if;
  return new;
end;
$$;

drop trigger if exists rate_limit_community_items on community_menu_items;
create trigger rate_limit_community_items before insert on community_menu_items
  for each row execute function _enforce_rate_limit('community_item', '40');

drop trigger if exists rate_limit_feedback on menu_item_allergen_feedback;
create trigger rate_limit_feedback before insert on menu_item_allergen_feedback
  for each row execute function _enforce_rate_limit('feedback', '60');

drop trigger if exists rate_limit_ratings on ratings;
create trigger rate_limit_ratings before insert on ratings
  for each row execute function _enforce_rate_limit('rating', '60');

drop trigger if exists rate_limit_review_requests on review_requests;
create trigger rate_limit_review_requests before insert on review_requests
  for each row execute function _enforce_rate_limit('review_request', '60');

drop trigger if exists rate_limit_reports on submission_reports;
create trigger rate_limit_reports before insert on submission_reports
  for each row execute function _enforce_rate_limit('report', '30');

-- 2. Content filter ----------------------------------------------------------
create table if not exists blocked_terms (
  term text primary key check (term = lower(trim(term)) and char_length(term) between 2 and 60)
);
alter table blocked_terms enable row level security;
-- (no policies: manage it from the SQL Editor)
insert into blocked_terms (term) values ('viagra'), ('casino'), ('crypto giveaway'), ('free money')
  on conflict do nothing;

create or replace function _text_is_acceptable(p_text text) returns boolean
language plpgsql
stable
set search_path = public
as $$
declare
  v text := lower(coalesce(p_text, ''));
begin
  if v = '' then
    return true;
  end if;
  -- Links, email addresses and phone numbers: spam, and never needed here.
  if v ~ '(https?://|www\.|\m[a-z0-9-]+\.(com|net|org|io|co|xyz|info|biz|ly|me)\M)' then
    return false;
  end if;
  if v ~ '[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}' then
    return false;
  end if;
  if v ~ '\d{3}[\s.-]?\d{3}[\s.-]?\d{4}' then
    return false;
  end if;
  return not exists (select 1 from blocked_terms b where position(b.term in v) > 0);
end;
$$;

create or replace function _enforce_content_filter() returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_field text;
  v_value text;
begin
  if _request_ip_hash() is null then
    return new; -- SQL Editor / seeds: not filtered
  end if;
  foreach v_field in array tg_argv loop
    v_value := to_jsonb(new) ->> v_field;
    -- Only check text that's new or changed, so reporting an existing entry
    -- (which bumps its report count) is never blocked by its old text.
    if tg_op = 'UPDATE' and (to_jsonb(old) ->> v_field) is not distinct from v_value then
      continue;
    end if;
    if not _text_is_acceptable(v_value) then
      raise exception 'content_rejected: remove links, contact details or blocked words';
    end if;
  end loop;
  return new;
end;
$$;

drop trigger if exists content_filter_community_items on community_menu_items;
create trigger content_filter_community_items before insert or update on community_menu_items
  for each row execute function _enforce_content_filter('name', 'description');

drop trigger if exists content_filter_feedback on menu_item_allergen_feedback;
create trigger content_filter_feedback before insert or update on menu_item_allergen_feedback
  for each row execute function _enforce_content_filter('comment');

drop trigger if exists content_filter_ratings on ratings;
create trigger content_filter_ratings before insert or update on ratings
  for each row execute function _enforce_content_filter('comment');

-- The helpers are internal: nobody calls them directly.
revoke execute on function _request_ip_hash() from public, anon, authenticated;
revoke execute on function _text_is_acceptable(text) from public, anon, authenticated;
revoke execute on function _enforce_rate_limit() from public, anon, authenticated;
revoke execute on function _enforce_content_filter() from public, anon, authenticated;

-- 3. Anonymous accounts: who is calling ------------------------------------
-- The app now signs each phone in with a Supabase anonymous account (no
-- email, no sign-up screen). A signed-in caller is identified by its account
-- id, which the server issues and a script can't make up. Callers that
-- aren't signed in (older app builds, or when anonymous sign-ins are off or
-- rate-limited) fall back to the device id, exactly as before.
create or replace function _caller_identity(p_device_id text) returns text
language plpgsql
stable
set search_path = public, extensions
as $$
begin
  if auth.uid() is not null then
    return 'user:' || auth.uid()::text;
  end if;
  if p_device_id is null or char_length(p_device_id) not between 16 and 100 then
    raise exception 'invalid device id';
  end if;
  return p_device_id; -- unchanged, so existing device-based rows still match
end;
$$;
revoke execute on function _caller_identity(text) from public, anon, authenticated;

-- The per-person functions from 0008/0010/0011, now using _caller_identity.
create or replace function report_submission(p_target_type text, p_target_id uuid, p_device_id text)
returns boolean
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_hash text := encode(digest(_caller_identity(p_device_id), 'sha256'), 'hex');
  v_inserted integer;
begin
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
  insert into submission_reports (target_type, target_id, device_hash)
  values (p_target_type, p_target_id, v_hash)
  on conflict (target_type, target_id, device_hash) do nothing;
  get diagnostics v_inserted = row_count;
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

create or replace function request_review(p_osm_id bigint, p_restaurant_name text, p_device_id text)
returns integer
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  insert into review_requests (osm_id, restaurant_name, device_hash)
  values (p_osm_id, left(coalesce(trim(p_restaurant_name), ''), 200),
          encode(digest(_caller_identity(p_device_id), 'sha256'), 'hex'))
  on conflict (osm_id, device_hash) do nothing;
  return (select count(*)::integer from review_requests where osm_id = p_osm_id);
end;
$$;

create or replace function review_request_status(p_osm_id bigint, p_device_id text)
returns table (request_count integer, requested_by_me boolean)
language sql
stable
security definer
set search_path = public, extensions
as $$
  select count(*)::integer,
         coalesce(bool_or(device_hash = encode(digest(_caller_identity(p_device_id), 'sha256'), 'hex')), false)
    from review_requests
   where osm_id = p_osm_id;
$$;

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
  v_hash text := encode(digest(_caller_identity(p_device_id), 'sha256'), 'hex');
  v_existed boolean;
begin
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
     and r.device_hash = encode(digest(_caller_identity(p_device_id), 'sha256'), 'hex')
   limit 1;
$$;

-- 4. Give signed-in (anonymous-account) callers the same access as anon ------
-- Supabase treats any signed-in caller as the "authenticated" role, so every
-- read rule and function grant that named only anon must now name both.
do $$
declare
  r record;
begin
  for r in
    select policyname, tablename from pg_policies
     where schemaname = 'public' and roles = '{anon}'::name[]
  loop
    execute format('alter policy %I on public.%I to anon, authenticated', r.policyname, r.tablename);
  end loop;
end;
$$;

-- Same hidden-column rules as 0011, for signed-in callers.
revoke select on ratings from authenticated;
grant select (id, osm_id, restaurant_name, accuracy_rating, accommodation_rating, comment, created_at, updated_at)
  on ratings to authenticated;
revoke select on community_menu_items from authenticated;
grant select (id, osm_id, restaurant_name, name, description, price, created_at, updated_at, report_count)
  on community_menu_items to authenticated;
revoke select on menu_item_allergen_feedback from authenticated;
grant select (id, menu_item_id, allergen_code, status, comment, created_at, updated_at, report_count)
  on menu_item_allergen_feedback to authenticated;

-- App functions: callable by anon and signed-in callers, not by PUBLIC.
do $$
declare
  fn text;
begin
  foreach fn in array array[
    'create_menu_item_feedback(uuid, text, text, text)',
    'update_menu_item_feedback(uuid, text, text, text)',
    'delete_menu_item_feedback(uuid, text)',
    'create_community_menu_item(bigint, text, text, text, numeric, jsonb)',
    'update_community_menu_item(uuid, text, text, text, numeric, jsonb)',
    'delete_community_menu_item(uuid, text)',
    'report_submission(text, uuid, text)',
    'request_review(bigint, text, text)',
    'review_request_status(bigint, text)',
    'submit_rating(bigint, text, smallint, smallint, text, text)',
    'my_rating(bigint, text)'
  ] loop
    execute format('revoke execute on function %s from public', fn);
    execute format('grant execute on function %s to anon, authenticated', fn);
  end loop;
end;
$$;

-- After the demo, to REQUIRE accounts (so device ids can't be used at all):
-- first raise the anonymous sign-in rate limit (Authentication -> Rate
-- Limits), since a room on one Wi-Fi shares an IP; then revoke execute on
-- each function above from anon.
