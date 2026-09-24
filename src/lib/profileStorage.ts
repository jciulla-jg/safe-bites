import AsyncStorage from '@react-native-async-storage/async-storage';
import { notifyRestrictionsChanged } from './restrictionEvents';

/**
 * On-device restriction profile persistence.
 *
 * Per ADR-0002, there is no backend auth/server round-trip for the
 * restriction profile -- it lives on-device only, persisted via
 * AsyncStorage as JSON under STORAGE_KEY.
 *
 * `loadProfile()` is the single, obvious entry point later deliverables
 * (e.g. SB-3's safety-status computation) should import to read the
 * diner's current restriction profile.
 */

/**
 * How strictly a restriction must be honored. See vision.md's Domain
 * Vocabulary "Severity Level" entry (Preference, Intolerance, Allergy,
 * Severe/Life-threatening).
 */
export type SeverityLevel = 'preference' | 'intolerance' | 'allergy' | 'severe';

/** One entry in a diner's restriction profile: an allergen + its severity. */
export interface RestrictionEntry {
  allergenCode: string;
  severity: SeverityLevel;
}

/** A diner's saved set of allergens/dietary restrictions, each with a severity level. */
export type RestrictionProfile = RestrictionEntry[];

const STORAGE_KEY = 'safe-bites/restriction-profile';

/**
 * Load the diner's restriction profile from on-device storage.
 * Returns an empty array (no restrictions set) if nothing has been saved
 * yet, or if the stored value is missing/corrupt.
 */
export async function loadProfile(): Promise<RestrictionProfile> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed.filter(
      (entry): entry is RestrictionEntry =>
        entry &&
        typeof entry === 'object' &&
        typeof entry.allergenCode === 'string' &&
        typeof entry.severity === 'string'
    );
  } catch {
    return [];
  }
}

/** Persist the diner's restriction profile to on-device storage. */
export async function saveProfile(profile: RestrictionProfile): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
  notifyRestrictionsChanged();
}
