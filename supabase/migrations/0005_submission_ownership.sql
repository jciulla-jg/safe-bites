-- Safe Bites: let the diner who submitted a community entry (per-item
-- feedback, or a community menu item) edit or delete it -- and nobody else.
--
-- There are no accounts (ADR-0002), so ownership is a per-submission secret:
-- the create_* functions below generate a random secret server-side, store
-- only its SHA-256 hash, and return the secret once to the submitting
-- device, which keeps it locally. update_*/delete_* succeed only when the
-- caller presents a secret whose hash matches. Losing the device's storage
-- means losing the ability to edit that entry, never the entry itself.
--
-- The direct anon insert policies from 0003/0004 are dropped: every write
-- now goes through these SECURITY DEFINER functions, which also apply basic
-- length limits. Reads are unchanged (public select).
--
-- Run AFTER 0003_menu_item_allergen_feedback.sql and 0004_community_menu_items.sql.

alter table menu_item_allergen_feedback add column if not exists owner_hash text;
alter table menu_item_allergen_feedback add column if not exists updated_at timestamptz;
alter table community_menu_items add column if not exists owner_hash text;
alter table community_menu_items add column if not exists updated_at timestamptz;

drop policy if exists "public insert menu_item_allergen_feedback" on menu_item_allergen_feedback;
drop policy if exists "public insert community_menu_items" on community_menu_items;
drop policy if exists "public insert community_menu_item_allergen_tags" on community_menu_item_allergen_tags;

-- ---------------------------------------------------------------------------
-- Per-item feedback
-- ---------------------------------------------------------------------------
create or replace function create_menu_item_feedback(
  p_menu_item_id uuid,
  p_allergen_code text,
  p_status text,
  p_comment text
) returns json
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_secret text := gen_random_uuid()::text;
  v_row menu_item_allergen_feedback;
begin
  if length(coalesce(p_comment, '')) > 500 then
    raise exception 'comment too long';
  end if;

  insert into menu_item_allergen_feedback (menu_item_id, allergen_code, status, comment, owner_hash)
  values (p_menu_item_id, p_allergen_code, p_status, nullif(trim(p_comment), ''),
          encode(digest(v_secret, 'sha256'), 'hex'))
  returning * into v_row;

  return json_build_object('row', row_to_json(v_row), 'owner_secret', v_secret);
end;
$$;

create or replace function update_menu_item_feedback(
  p_id uuid,
  p_owner_secret text,
  p_status text,
  p_comment text
) returns boolean
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  if length(coalesce(p_comment, '')) > 500 then
    raise exception 'comment too long';
  end if;

  update menu_item_allergen_feedback
     set status = p_status,
         comment = nullif(trim(p_comment), ''),
         updated_at = now()
   where id = p_id
     and owner_hash = encode(digest(p_owner_secret, 'sha256'), 'hex');
  return found;
end;
$$;

create or replace function delete_menu_item_feedback(
  p_id uuid,
  p_owner_secret text
) returns boolean
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  delete from menu_item_allergen_feedback
   where id = p_id
     and owner_hash = encode(digest(p_owner_secret, 'sha256'), 'hex');
  return found;
end;
$$;

-- ---------------------------------------------------------------------------
-- Community menu items (with their allergen tags)
-- p_tags is a JSON array of {"allergen_code": "...", "status": "..."}.
-- ---------------------------------------------------------------------------
create or replace function create_community_menu_item(
  p_osm_id bigint,
  p_restaurant_name text,
  p_name text,
  p_description text,
  p_price numeric,
  p_tags jsonb
) returns json
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_secret text := gen_random_uuid()::text;
  v_row community_menu_items;
begin
  if coalesce(trim(p_name), '') = '' then
    raise exception 'name is required';
  end if;
  if length(p_name) > 120 or length(coalesce(p_description, '')) > 500 then
    raise exception 'name or description too long';
  end if;

  insert into community_menu_items (osm_id, restaurant_name, name, description, price, owner_hash)
  values (p_osm_id, p_restaurant_name, trim(p_name), nullif(trim(p_description), ''), p_price,
          encode(digest(v_secret, 'sha256'), 'hex'))
  returning * into v_row;

  insert into community_menu_item_allergen_tags (community_menu_item_id, allergen_code, status)
  select v_row.id, t.allergen_code, t.status
    from jsonb_to_recordset(coalesce(p_tags, '[]'::jsonb)) as t(allergen_code text, status text);

  return json_build_object('row', row_to_json(v_row), 'owner_secret', v_secret);
end;
$$;

create or replace function update_community_menu_item(
  p_id uuid,
  p_owner_secret text,
  p_name text,
  p_description text,
  p_price numeric,
  p_tags jsonb
) returns boolean
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  if coalesce(trim(p_name), '') = '' then
    raise exception 'name is required';
  end if;
  if length(p_name) > 120 or length(coalesce(p_description, '')) > 500 then
    raise exception 'name or description too long';
  end if;

  update community_menu_items
     set name = trim(p_name),
         description = nullif(trim(p_description), ''),
         price = p_price,
         updated_at = now()
   where id = p_id
     and owner_hash = encode(digest(p_owner_secret, 'sha256'), 'hex');

  if not found then
    return false;
  end if;

  delete from community_menu_item_allergen_tags where community_menu_item_id = p_id;
  insert into community_menu_item_allergen_tags (community_menu_item_id, allergen_code, status)
  select p_id, t.allergen_code, t.status
    from jsonb_to_recordset(coalesce(p_tags, '[]'::jsonb)) as t(allergen_code text, status text);

  return true;
end;
$$;

create or replace function delete_community_menu_item(
  p_id uuid,
  p_owner_secret text
) returns boolean
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  -- Tags cascade via the foreign key.
  delete from community_menu_items
   where id = p_id
     and owner_hash = encode(digest(p_owner_secret, 'sha256'), 'hex');
  return found;
end;
$$;

grant execute on function create_menu_item_feedback(uuid, text, text, text) to anon;
grant execute on function update_menu_item_feedback(uuid, text, text, text) to anon;
grant execute on function delete_menu_item_feedback(uuid, text) to anon;
grant execute on function create_community_menu_item(bigint, text, text, text, numeric, jsonb) to anon;
grant execute on function update_community_menu_item(uuid, text, text, text, numeric, jsonb) to anon;
grant execute on function delete_community_menu_item(uuid, text) to anon;
