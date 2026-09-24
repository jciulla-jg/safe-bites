/**
 * Map OSM's free-text `cuisine` tag to a representative emoji for the
 * search results list. Ionicons only has a handful of food-related glyphs
 * (pizza/cafe/beer/wine/ice-cream/fast-food/restaurant), nowhere near
 * enough variety to distinguish cuisines at a glance -- emoji cover far
 * more ground with zero extra assets.
 *
 * `cuisine` can list several values separated by `;` (e.g.
 * "chinese;seafood"); the first recognized keyword wins.
 */
const CUISINE_EMOJI: Record<string, string> = {
  pizza: '\u{1F355}',
  chinese: '\u{1F961}',
  japanese: '\u{1F363}',
  sushi: '\u{1F363}',
  italian: '\u{1F35D}',
  mexican: '\u{1F32E}',
  indian: '\u{1F35B}',
  thai: '\u{1F35C}',
  vietnamese: '\u{1F35C}',
  korean: '\u{1F372}',
  american: '\u{1F354}',
  burger: '\u{1F354}',
  sandwich: '\u{1F96A}',
  seafood: '\u{1F364}',
  steak_house: '\u{1F969}',
  barbecue: '\u{1F356}',
  bbq: '\u{1F356}',
  mediterranean: '\u{1F959}',
  greek: '\u{1F959}',
  french: '\u{1F950}',
  spanish: '\u{1F359}',
  vegetarian: '\u{1F957}',
  vegan: '\u{1F957}',
  breakfast: '\u{1F95E}',
  cafe: '☕',
  coffee_shop: '☕',
  bar: '\u{1F37A}',
  pub: '\u{1F37A}',
  ice_cream: '\u{1F368}',
  dessert: '\u{1F368}',
  chicken: '\u{1F357}',
  ramen: '\u{1F35C}',
  noodle: '\u{1F35C}',
  fish_and_chips: '\u{1F41F}',
};

const DEFAULT_EMOJI = '\u{1F37D}️'; // fork and knife with plate

export function getCuisineEmoji(cuisine?: string): string {
  for (const keyword of cuisineTokens(cuisine)) {
    if (CUISINE_EMOJI[keyword]) {
      return CUISINE_EMOJI[keyword];
    }
  }
  return DEFAULT_EMOJI;
}

/** OSM cuisine values are snake_case (e.g. "steak_house"); make them readable. */
export function formatCuisineLabel(cuisine: string): string {
  return cuisine
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/** A restaurant's cuisine tag can list several values separated by ; or ,. */
export function cuisineTokens(cuisine?: string): string[] {
  if (!cuisine) return [];
  return cuisine
    .split(/[;,]/)
    .map((c) => c.trim().toLowerCase())
    .filter(Boolean);
}
