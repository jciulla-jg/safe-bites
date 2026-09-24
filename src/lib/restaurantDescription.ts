import { cuisineTokens, formatCuisineLabel } from './cuisineIcon';
import type { RestaurantDetails } from './osm';

/**
 * Human-readable descriptions of a restaurant, assembled only from real
 * OpenStreetMap tags (see RestaurantDetails in osm.ts) -- never generated
 * prose, since OSM carries no written descriptions for these restaurants.
 */

const DIET_LABELS: Record<string, string> = {
  vegan: 'Vegan',
  vegetarian: 'Vegetarian',
  gluten_free: 'Gluten-free',
  dairy_free: 'Dairy-free',
  nut_free: 'Nut-free',
  soy_free: 'Soy-free',
  halal: 'Halal',
  kosher: 'Kosher',
};

export function dietLabel(diet: { code: string; only: boolean }): string {
  const label = DIET_LABELS[diet.code] ?? formatCuisineLabel(diet.code);
  return diet.only ? `${label} only` : `${label} options`;
}

/** e.g. "Italian, Pizza" -- every cuisine OSM lists, not just the first. */
export function formatCuisineList(cuisine?: string): string | undefined {
  const tokens = cuisineTokens(cuisine);
  return tokens.length > 0 ? tokens.map(formatCuisineLabel).join(', ') : undefined;
}

/**
 * One line for the search results: up to two cuisines plus up to two
 * dietary tags, e.g. "Italian · Pizza · Vegan options". Falls back to
 * "Restaurant" when OSM lists no cuisine.
 */
export function shortDescription(cuisine: string | undefined, details: RestaurantDetails | undefined): string {
  const parts = cuisineTokens(cuisine).slice(0, 2).map(formatCuisineLabel);
  if (parts.length === 0) parts.push('Restaurant');
  for (const diet of (details?.diets ?? []).slice(0, 2)) {
    parts.push(dietLabel(diet));
  }
  return parts.join(' · ');
}

const DAY_NAMES: Record<string, string> = {
  Mo: 'Mon',
  Tu: 'Tue',
  We: 'Wed',
  Th: 'Thu',
  Fr: 'Fri',
  Sa: 'Sat',
  Su: 'Sun',
  PH: 'Holidays',
};

/** "17:00" -> "5 PM", "11:30" -> "11:30 AM", "24:00" -> "12 AM" (midnight). */
function to12Hour(hours: string, minutes: string): string {
  const h = Number(hours) % 24;
  const suffix = h < 12 ? 'AM' : 'PM';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return minutes === '00' ? `${h12} ${suffix}` : `${h12}:${minutes} ${suffix}`;
}

/**
 * Light cleanup of an OSM opening_hours value for display: one line per
 * rule, two-letter day codes spelled out, 24-hour times as 12-hour
 * ("17:00-20:00" -> "5 PM–8 PM"), "off" shown as "closed". OSM's full
 * syntax is richer than this handles, so anything unrecognized is shown as
 * written rather than guessed at.
 */
export function formatOpeningHours(raw: string): string[] {
  if (raw.trim().toLowerCase() === 'closed') return ['Listed as closed'];
  if (raw.trim() === '24/7') return ['Open 24 hours'];
  return raw
    .split(';')
    .map((rule) => rule.trim())
    .filter(Boolean)
    .map((rule) =>
      rule
        .replace(/\b(Mo|Tu|We|Th|Fr|Sa|Su|PH)\b/g, (code) => DAY_NAMES[code])
        .replace(/\boff\b/gi, 'closed')
        .replace(/\b00:00-24:00\b/g, 'open 24 hours')
        .replace(/\b([01]?\d|2[0-4]):([0-5]\d)\b/g, (_, h: string, m: string) => to12Hour(h, m))
        .replace(/(AM|PM)-(\d)/g, '$1–$2')
        .replace(/,(?=\S)/g, ', ')
    );
}

/** Services/accessibility facts worth listing, in display order. */
export function serviceLabels(details: RestaurantDetails | undefined): string[] {
  if (!details) return [];
  const labels: string[] = [];
  if (details.takeaway) labels.push('Takeout');
  if (details.delivery) labels.push('Delivery');
  if (details.outdoorSeating) labels.push('Outdoor seating');
  if (details.driveThrough) labels.push('Drive-through');
  if (details.wheelchair === 'yes') labels.push('Wheelchair accessible');
  if (details.wheelchair === 'limited') labels.push('Limited wheelchair access');
  if (details.wheelchair === 'no') labels.push('Not wheelchair accessible');
  return labels;
}

/** True when OSM gives us anything beyond the name/address to describe. */
export function hasAnyDetails(cuisine: string | undefined, details: RestaurantDetails | undefined): boolean {
  return (
    cuisineTokens(cuisine).length > 0 ||
    !!details?.website ||
    !!details?.openingHours ||
    (details?.diets?.length ?? 0) > 0 ||
    serviceLabels(details).length > 0
  );
}
