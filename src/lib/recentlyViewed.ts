import AsyncStorage from '@react-native-async-storage/async-storage';
import type { RestaurantDetails } from './osm';

/**
 * On-device "recently viewed" list, same persistence pattern as
 * profileStorage.ts (AsyncStorage, no backend -- ADR-0002). Lets the Search
 * screen offer a one-tap way back into a restaurant the diner already
 * opened this session/previously, without re-running a search.
 */

const STORAGE_KEY = 'safe-bites/recently-viewed';
const MAX_ENTRIES = 8;

export interface RecentRestaurant {
  osmId: number;
  restaurantName: string;
  lat?: number;
  lon?: number;
  phone?: string;
  address?: string;
  cuisine?: string;
  details?: RestaurantDetails;
  viewedAt: number;
}

export async function loadRecentlyViewed(): Promise<RecentRestaurant[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (entry): entry is RecentRestaurant =>
        entry && typeof entry === 'object' && typeof entry.osmId === 'number' && typeof entry.restaurantName === 'string'
    );
  } catch {
    return [];
  }
}

/** Add/move an entry to the front, deduping by osmId, capped at MAX_ENTRIES. */
export async function recordRecentlyViewed(entry: Omit<RecentRestaurant, 'viewedAt'>): Promise<void> {
  const existing = await loadRecentlyViewed();
  const next = [
    { ...entry, viewedAt: Date.now() },
    ...existing.filter((e) => e.osmId !== entry.osmId),
  ].slice(0, MAX_ENTRIES);
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
}

export async function clearRecentlyViewed(): Promise<void> {
  await AsyncStorage.removeItem(STORAGE_KEY);
}
