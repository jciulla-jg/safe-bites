import { supabase } from './supabase';
import type { AllergenStatus } from './database.types';
import type { RestrictionProfile, SeverityLevel } from './profileStorage';
import { itemMentions } from './mentions';
import { ALLERGENS } from '../data/allergens';

/**
 * Per-restaurant safety status relative to a diner's restriction profile.
 * See ADR-0002's hybrid allergen-data decision and vision.md's "Safety
 * Rating" vocabulary entry.
 *
 * - 'safe': restaurant has seeded menu data and, for every one of the
 *   diner's active restrictions, at least one menu item is explicitly
 *   tagged `safe` for that allergen.
 * - 'unsafe': restaurant has seeded menu data but at least one active
 *   restriction has no menu item explicitly tagged `safe` for it.
 * - 'no-data': restaurant has no seeded row in the `restaurants` table.
 */
export type SafetyStatus = 'safe' | 'unsafe' | 'no-data';

export interface MenuItemAllergenTag {
  allergenCode: string;
  status: AllergenStatus;
}

export interface MenuItemWithTags {
  id: string;
  name: string;
  description: string | null;
  price: number | null;
  tags: MenuItemAllergenTag[];
}

export interface RestaurantSafetyData {
  restaurantId: string;
  menuItems: MenuItemWithTags[];
  /** Researched description (0006 migration) and the URL it came from. */
  description: string | null;
  descriptionSource: string | null;
  /** When the reviewed menu data was last researched (0007 migration), ISO date. */
  reviewedAt: string | null;
  /** Who verified the tags (0008 migration); treated as safe_bites before it exists. */
  verification: Verification;
  /** Set when the data is the chain's (0009), not this location's own: its name and allergen guide URL. */
  chain?: { name: string; allergenSource: string };
}

export type Verification = 'safe_bites' | 'restaurant' | 'chain';

type RestaurantRow = {
  id: string;
  osm_id: number;
  description?: string | null;
  description_source?: string | null;
  reviewed_at?: string | null;
  verification?: string | null;
};

// PostgREST puts `.in()` values in the URL; chunking keeps a 25-mile search
// (several hundred restaurants) under typical URL length limits.
const IN_CHUNK_SIZE = 150;

function chunk<T>(items: T[]): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += IN_CHUNK_SIZE) chunks.push(items.slice(i, i + IN_CHUNK_SIZE));
  return chunks;
}

/**
 * Seeded safety data for many restaurants at once, keyed by OSM id -- two
 * queries per chunk (restaurants, then their menu items with tags) instead of
 * one or two per restaurant. A search near 12305 used to make ~145 separate
 * requests. OSM ids with no seeded row are simply absent from the map (the
 * "no safety data yet" case).
 */
export async function fetchSafetyDataForRestaurants(
  osmIds: number[],
  /** osm id -> brand:wikidata, so chain locations with no data of their own get their chain's. */
  brandByOsmId: Map<number, string> = new Map()
): Promise<Map<number, RestaurantSafetyData>> {
  const result = new Map<number, RestaurantSafetyData>();
  const unique = Array.from(new Set(osmIds));

  for (const ids of chunk(unique)) {
    const { data: restaurantData, error: restaurantError } = await supabase
      .from('restaurants')
      .select('*')
      .in('osm_id', ids);
    if (restaurantError) throw restaurantError;
    // Cast: the hand-authored Database type (no Supabase-generated relationship
    // metadata) makes supabase-js's generic inference collapse to `never` here
    // in this TS/supabase-js combination -- see src/lib/database.types.ts.
    const restaurants = (restaurantData ?? []) as RestaurantRow[];
    if (restaurants.length === 0) continue;

    const { data: menuItems, error: menuItemsError } = await supabase
      .from('menu_items')
      .select('*, menu_item_allergen_tags(*)')
      .in('restaurant_id', restaurants.map((r) => r.id));
    if (menuItemsError) throw menuItemsError;

    const itemsByRestaurant = new Map<string, MenuItemWithTags[]>();
    for (const item of (menuItems ?? []) as any[]) {
      const list = itemsByRestaurant.get(item.restaurant_id) ?? [];
      list.push({
        id: item.id,
        name: item.name,
        description: item.description ?? null,
        price: item.price ?? null,
        tags: (item.menu_item_allergen_tags ?? []).map((tag: any) => ({
          allergenCode: tag.allergen_code,
          status: tag.status as AllergenStatus,
        })),
      });
      itemsByRestaurant.set(item.restaurant_id, list);
    }

    for (const restaurant of restaurants) {
      result.set(restaurant.osm_id, {
        restaurantId: restaurant.id,
        // `?? null` keeps this working before migrations 0006/0007 add the columns.
        description: restaurant.description ?? null,
        descriptionSource: restaurant.description_source ?? null,
        reviewedAt: restaurant.reviewed_at ?? null,
        verification: restaurant.verification === 'restaurant' ? 'restaurant' : 'safe_bites',
        menuItems: itemsByRestaurant.get(restaurant.id) ?? [],
      });
    }
  }

  // Chain fallback: a location's own row (above) always wins.
  const brands = new Set<string>();
  for (const osmId of unique) {
    const brand = brandByOsmId.get(osmId);
    if (brand && !result.has(osmId)) brands.add(brand);
  }
  if (brands.size > 0) {
    const chains = await fetchChainData(Array.from(brands));
    for (const osmId of unique) {
      const brand = brandByOsmId.get(osmId);
      const chainData = brand && !result.has(osmId) ? chains.get(brand) : undefined;
      if (chainData) result.set(osmId, chainData);
    }
  }

  return result;
}

/** Chain data by brand:wikidata. Errors are swallowed so a missing 0009 migration can't break search. */
async function fetchChainData(brands: string[]): Promise<Map<string, RestaurantSafetyData>> {
  const out = new Map<string, RestaurantSafetyData>();
  const { data: chainRows, error } = await supabase.from('chains').select('*').in('brand_wikidata', brands);
  if (error || !chainRows || chainRows.length === 0) return out;
  const chains = chainRows as any[];
  const { data: items, error: itemsError } = await supabase
    .from('chain_menu_items')
    .select('*, chain_menu_item_allergen_tags(*)')
    .in('chain_id', chains.map((c) => c.id));
  if (itemsError) return out;
  const itemsByChain = new Map<string, MenuItemWithTags[]>();
  for (const item of (items ?? []) as any[]) {
    const list = itemsByChain.get(item.chain_id) ?? [];
    list.push({
      id: item.id,
      name: item.name,
      description: item.description ?? null,
      price: item.price ?? null,
      tags: (item.chain_menu_item_allergen_tags ?? []).map((tag: any) => ({
        allergenCode: tag.allergen_code,
        status: tag.status as AllergenStatus,
      })),
    });
    itemsByChain.set(item.chain_id, list);
  }
  for (const chain of chains) {
    out.set(chain.brand_wikidata, {
      restaurantId: chain.id,
      description: null,
      descriptionSource: null,
      reviewedAt: chain.reviewed_at ?? null,
      verification: 'chain',
      chain: { name: chain.name, allergenSource: chain.allergen_source },
      menuItems: (itemsByChain.get(chain.id) ?? []).sort((a, b) => a.name.localeCompare(b.name)),
    });
  }
  return out;
}

/** One restaurant's seeded safety data (or its chain's), or null for "no safety data yet". */
export async function fetchRestaurantSafetyData(
  osmId: number,
  brandWikidata?: string
): Promise<RestaurantSafetyData | null> {
  const brands = brandWikidata ? new Map([[osmId, brandWikidata]]) : undefined;
  return (await fetchSafetyDataForRestaurants([osmId], brands)).get(osmId) ?? null;
}

/**
 * Per-item, per-restriction label used on the detail screen.
 */
export type ItemAllergenLabel = 'safe' | 'contains' | 'may_contain' | 'unknown';

export function labelForItemAllergen(
  item: MenuItemWithTags,
  allergenCode: string
): ItemAllergenLabel {
  const tag = item.tags.find((t) => t.allergenCode === allergenCode);
  if (!tag) {
    return 'unknown';
  }
  return tag.status;
}

/**
 * Whether an item's tag for one restriction disqualifies IT SPECIFICALLY,
 * given how strictly that restriction must be honored (vision.md's Severity
 * Level vocabulary: Preference, Intolerance, Allergy, Severe/Life-threatening).
 * This is the per-item rule only -- severe and allergy share it, because what
 * actually tells them apart is a restaurant-wide check (see
 * menuHasCrossContactRisk / computeSafetyStatus), not a per-item one.
 *
 * - severe / allergy: only an explicit `safe` tag clears an item --
 *   `may_contain`, `contains`, and an untagged ("unknown") allergen all
 *   disqualify it.
 * - intolerance: `contains` disqualifies; `may_contain` and unknown are a
 *   soft warning (still shown as a per-item tag) rather than a reason to
 *   exclude the item or mark the restaurant unsafe.
 * - preference: informational only -- never disqualifies anything.
 */
function itemFailsRestriction(status: ItemAllergenLabel, severity: SeverityLevel): boolean {
  switch (severity) {
    case 'severe':
    case 'allergy':
      return status !== 'safe';
    case 'intolerance':
      return status === 'contains';
    case 'preference':
      return false;
  }
}

/**
 * Whether an item passes every one of the diner's active restrictions, per
 * itemFailsRestriction's severity-aware rule, and mentions none of their
 * custom keywords (customRestrictions.ts). Shared by the safe-item count and
 * the detail screen's "Safe items only" filter, so both apply the same
 * definition of "safe for you".
 */
export function itemIsSafeForProfile(
  item: MenuItemWithTags,
  profile: RestrictionProfile,
  customKeywords: string[] = []
): boolean {
  return (
    profile.every((entry) => !itemFailsRestriction(labelForItemAllergen(item, entry.allergenCode), entry.severity)) &&
    itemMentions(item, customKeywords).length === 0
  );
}

/**
 * Whether ANY menu item risks cross-contact for this allergen (tagged
 * `contains` or `may_contain`), regardless of whether another item is
 * explicitly safe. This is the restaurant-level distinction between
 * "Allergy" and "Severe": an Allergy diner just needs one safe thing to
 * order; a Severe/life-threatening diner also needs the kitchen itself to
 * carry no risk for that allergen -- shared fryers, prep surfaces, etc. --
 * because a menu item they didn't order can still make them unsafe to eat
 * there at all.
 */
function menuHasCrossContactRisk(menuItems: MenuItemWithTags[], allergenCode: string): boolean {
  return menuItems.some((item) => {
    const label = labelForItemAllergen(item, allergenCode);
    return label === 'contains' || label === 'may_contain';
  });
}

/**
 * Compute the overall safety status for a restaurant that HAS seeded menu
 * data, against the diner's active restriction profile. Callers should use
 * 'no-data' directly when fetchRestaurantSafetyData returns null -- this
 * function is only for the case where seeded data exists.
 *
 * A restaurant is "safe" when, for every active restriction, at least one
 * menu item clears it (not necessarily the same item across restrictions) --
 * see itemFailsRestriction for what "clears it" means per severity level --
 * AND, for any restriction marked "severe", the menu as a whole carries no
 * cross-contact risk for that allergen (menuHasCrossContactRisk). "Allergy"
 * and "Severe" otherwise apply the identical per-item rule; this is what
 * actually tells them apart.
 */
export function computeSafetyStatus(
  menuItems: MenuItemWithTags[],
  profile: RestrictionProfile
): 'safe' | 'unsafe' {
  // Derived from the reasons so the verdict and its explanation can't disagree.
  // No restrictions set means no reasons, so any seeded restaurant is trivially "Safe".
  return explainUnsafe(menuItems, profile).length === 0 ? 'safe' : 'unsafe';
}

function allergenLabel(code: string): string {
  return ALLERGENS.find((a) => a.code === code)?.label ?? code;
}

/**
 * Plain-language reasons a restaurant is "Unsafe" for this profile -- one per
 * failing restriction -- or [] when it's "Safe". This is the single source of
 * the verdict (computeSafetyStatus is just "no reasons").
 */
export function explainUnsafe(menuItems: MenuItemWithTags[], profile: RestrictionProfile): string[] {
  const reasons: string[] = [];
  for (const entry of profile) {
    const label = allergenLabel(entry.allergenCode);
    const covered = menuItems.some(
      (item) => !itemFailsRestriction(labelForItemAllergen(item, entry.allergenCode), entry.severity)
    );
    if (!covered) {
      reasons.push(
        entry.severity === 'intolerance'
          ? `Every menu item on file contains ${label}.`
          : `No menu item is confirmed safe for ${label} (${entry.severity === 'severe' ? 'Severe' : 'Allergy'}).`
      );
      continue;
    }
    if (entry.severity === 'severe' && menuHasCrossContactRisk(menuItems, entry.allergenCode)) {
      const risky = menuItems.filter((item) => {
        const status = labelForItemAllergen(item, entry.allergenCode);
        return status === 'contains' || status === 'may_contain';
      }).length;
      reasons.push(
        `${risky} menu item${risky === 1 ? '' : 's'} contain${risky === 1 ? 's' : ''} or may contain ${label}: cross-contact risk for a severe allergy, even if you order something else.`
      );
    }
  }
  return reasons;
}

/**
 * Count menu items that pass every one of the diner's active restrictions
 * (itemIsSafeForProfile). With no active restrictions, every item counts --
 * there's nothing to conflict with. Used by the search results list to show
 * "N of M items safe for you" without a second round-trip.
 */
export function countSafeItems(
  menuItems: MenuItemWithTags[],
  profile: RestrictionProfile,
  customKeywords: string[] = []
): number {
  if (profile.length === 0 && customKeywords.length === 0) {
    return menuItems.length;
  }

  return menuItems.filter((item) => itemIsSafeForProfile(item, profile, customKeywords)).length;
}
