-- Safe Bites: admin queries. Run these one at a time in the Supabase SQL
-- Editor. Nothing here runs automatically.

-- ---------------------------------------------------------------------------
-- Moderation: the newest community content, including hidden (3+ reports)
-- ---------------------------------------------------------------------------
select 'community item' as kind, id, restaurant_name, name as text, description as detail,
       report_count, created_at
  from community_menu_items
union all
select 'feedback', f.id, r.name, f.allergen_code || ': ' || f.status, f.comment, f.report_count, f.created_at
  from menu_item_allergen_feedback f
  join menu_items mi on mi.id = f.menu_item_id
  join restaurants r on r.id = mi.restaurant_id
union all
select 'rating', id, restaurant_name,
       accuracy_rating || '/5 accuracy, ' || accommodation_rating || '/5 accommodation', comment, 0, created_at
  from ratings
order by created_at desc
limit 100;

-- Delete one entry (paste its id). Tags and reports go with it.
-- delete from community_menu_items where id = '...';
-- delete from menu_item_allergen_feedback where id = '...';
-- delete from ratings where id = '...';

-- Un-hide an entry that was reported unfairly:
-- update community_menu_items set report_count = 0 where id = '...';
-- delete from submission_reports where target_id = '...';

-- ---------------------------------------------------------------------------
-- Blocked words (content filter, migration 0012). Lowercase, 2-60 chars.
-- A term blocks any submission whose text contains it.
-- ---------------------------------------------------------------------------
-- insert into blocked_terms (term) values ('example') on conflict do nothing;
-- delete from blocked_terms where term = 'example';
select term from blocked_terms order by term;

-- ---------------------------------------------------------------------------
-- Rate limits: which networks (hashed, not real IPs) wrote the most in the
-- last hour. Useful if something is flooding.
-- ---------------------------------------------------------------------------
select action, left(ip_hash, 12) as network, count(*) as writes
  from write_log
 where created_at > now() - interval '1 hour'
 group by action, ip_hash
 order by writes desc
 limit 20;

-- ---------------------------------------------------------------------------
-- Most-requested restaurants to research next (migration 0008)
-- ---------------------------------------------------------------------------
select osm_id, max(restaurant_name) as name, count(*) as requests
  from review_requests group by osm_id order by requests desc;

-- ---------------------------------------------------------------------------
-- Backup of diner-submitted data. The free tier has no downloadable backups,
-- and researched/chain data can be rebuilt from the seed files, but community
-- entries and ratings exist only here. Run each query, then use the SQL
-- Editor's "Download CSV" button. Monthly is plenty.
-- ---------------------------------------------------------------------------
select * from community_menu_items order by created_at;
select * from community_menu_item_allergen_tags;
select * from menu_item_allergen_feedback order by created_at;
select * from ratings order by created_at;
select * from review_requests order by created_at;

-- ---------------------------------------------------------------------------
-- Housekeeping: anonymous accounts (one per phone that opened the app).
-- Deleting one only means that phone gets a fresh account next time; its
-- ratings stay, but it will no longer see them as "Your rating".
-- ---------------------------------------------------------------------------
select count(*) as anonymous_accounts from auth.users where is_anonymous;
-- delete from auth.users where is_anonymous and last_sign_in_at < now() - interval '90 days';
