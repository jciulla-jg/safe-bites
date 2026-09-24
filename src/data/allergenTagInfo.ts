import { colors } from '../navigation/theme';
import type { ItemAllergenLabel } from '../lib/safetyStatus';

/**
 * Single source of truth for what each per-item allergen tag (safetyStatus.ts's
 * ItemAllergenLabel) means and how it's styled -- shared by the detail
 * screen's per-item badges and the Profile screen's "what do the tags mean"
 * legend, so the two can't drift out of sync.
 */
export const ALLERGEN_TAG_INFO: Record<ItemAllergenLabel, { label: string; color: string; description: string }> = {
  safe: {
    label: 'Safe',
    color: colors.safe,
    description: 'Confirmed safe for this allergen.',
  },
  contains: {
    label: 'Contains',
    color: colors.danger,
    description: 'Confirmed to contain this allergen.',
  },
  may_contain: {
    label: 'May contain',
    color: colors.unsafe,
    description: 'Possible cross-contact, or a shared ingredient/prep step -- not a confirmed "yes", but not ruled out either.',
  },
  unknown: {
    label: 'Unknown',
    color: colors.noData,
    description: "Not yet reviewed for this allergen -- ask the restaurant directly if you're relying on it.",
  },
};
