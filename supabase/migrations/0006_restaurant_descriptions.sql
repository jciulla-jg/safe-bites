-- Safe Bites: a short researched description per seeded restaurant, with the
-- URL it was paraphrased from. Curated like the rest of `restaurants` (seeded
-- by the developer, not writable from the app). Shown on the restaurant
-- page's About card, attributed to its source.

alter table restaurants add column if not exists description text;
alter table restaurants add column if not exists description_source text;
