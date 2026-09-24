import AsyncStorage from '@react-native-async-storage/async-storage';
import { notifyRestrictionsChanged } from './restrictionEvents';

/**
 * Free-text custom restrictions ("beef", "cilantro") -- anything a diner
 * avoids beyond the 11 tagged allergens. Unlike allergens, no menu data is
 * tagged for these, so they're matched against the words a menu item's name
 * and description actually contain. A mention is a real warning; the absence
 * of one proves nothing (a broth can contain beef without saying so), so
 * these never make an item or restaurant "Safe" -- they can only exclude.
 * Stored on-device only, like the restriction profile (ADR-0002).
 */

const STORAGE_KEY = 'safe-bites/custom-restrictions';
export const MAX_CUSTOM_RESTRICTIONS = 15;
export const MAX_CUSTOM_RESTRICTION_LENGTH = 30;

export async function loadCustomRestrictions(): Promise<string[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((k): k is string => typeof k === 'string' && k.trim().length > 0) : [];
  } catch {
    return [];
  }
}

export async function saveCustomRestrictions(keywords: string[]): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(keywords));
  notifyRestrictionsChanged();
}
