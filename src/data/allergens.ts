/**
 * Canonical allergen/restriction catalog.
 *
 * Mirrors supabase/migrations/0002_seed_allergens.sql byte-for-byte on the
 * `code` values so they line up with menu_item_allergen_tags.allergen_code
 * (see SB-3 / D3). Hardcoded locally rather than fetched from Supabase --
 * this is a static list and the restriction profile is on-device only
 * (ADR-0002, no backend auth/round-trip for profile data).
 */
export interface Allergen {
  code: string;
  label: string;
  sortOrder: number;
}

export const ALLERGENS: Allergen[] = [
  { code: 'peanut', label: 'Peanut', sortOrder: 1 },
  { code: 'tree_nut', label: 'Tree Nut', sortOrder: 2 },
  { code: 'dairy', label: 'Dairy', sortOrder: 3 },
  { code: 'egg', label: 'Egg', sortOrder: 4 },
  { code: 'gluten', label: 'Gluten', sortOrder: 5 },
  { code: 'soy', label: 'Soy', sortOrder: 6 },
  { code: 'shellfish', label: 'Shellfish', sortOrder: 7 },
  { code: 'fish', label: 'Fish', sortOrder: 8 },
  { code: 'sesame', label: 'Sesame', sortOrder: 9 },
  { code: 'vegan', label: 'Vegan', sortOrder: 10 },
  { code: 'vegetarian', label: 'Vegetarian', sortOrder: 11 },
];
