# Chain seed file format (for supabase/demo-seed-chains-*.sql)

Tables come from migrations/0009_chains.sql. Each chain is matched to its
map locations by its OpenStreetMap `brand:wikidata` id (e.g. `Q38076`).

```sql
-- Re-run safe: removing the chain row cascades to its items and tags.
delete from chains where brand_wikidata in ('Q38076', 'Q550258');

insert into chains (brand_wikidata, name, allergen_source, reviewed_at)
values ('Q38076', 'McDonald''s', 'https://<official allergen guide URL>', '2026-09-24');

insert into chain_menu_items (chain_id, name, description, price)
select id, 'Big Mac', 'Two beef patties, special sauce, lettuce, cheese, pickles, onions on a sesame seed bun.', null
from chains where brand_wikidata = 'Q38076';
insert into chain_menu_item_allergen_tags (chain_menu_item_id, allergen_code, status)
select mi.id, v.code, v.status from chain_menu_items mi join chains c on c.id = mi.chain_id
cross join (values ('dairy','contains'),('gluten','contains'),('sesame','contains')) as v(code, status)
where c.brand_wikidata = 'Q38076' and mi.name = 'Big Mac';
```

## Tagging rules for official allergen charts

- Allergen codes: `peanut tree_nut dairy egg gluten soy shellfish fish sesame vegan vegetarian`.
  Statuses: `safe`, `contains`, `may_contain`.
- Charts usually cover milk, egg, fish, shellfish, tree nuts, peanuts, wheat,
  soy and sesame. For each allergen **the chart covers**:
  - `contains` when the chart says the item contains it (milk -> `dairy`,
    wheat -> `gluten`);
  - `may_contain` when the chart flags cross-contact or "may contain" for
    that item (e.g. shared fryer), or a chain-wide warning names that allergen;
  - `safe` when the chart covers that allergen and lists the item as not
    containing it.
- **gluten**: wheat is not the same as gluten (barley, rye and oats also
  contain it). Use `contains` if wheat is listed, but `safe` ONLY if the chain
  explicitly says the item is gluten-free. Otherwise omit the tag.
- **vegan / vegetarian**: `contains` (meaning NOT vegan/vegetarian) when the
  item obviously has meat/fish, or animal products for vegan. Use `safe` only
  if the chain itself labels the item vegan or vegetarian. Otherwise omit.
- If the chart doesn't cover an allergen, omit it (it shows as unknown).
- Prices: `null` (they vary by location). Descriptions: short and paraphrased
  from the chain's own menu, or null.
- Escape apostrophes as `''`. Never invent items or allergen facts.
