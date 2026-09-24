import AsyncStorage from '@react-native-async-storage/async-storage';
import type { RestaurantDetails } from './osm';

/**
 * Restaurants the diner saved, with an optional personal note ("ate here
 * fine, ask for no soy sauce"). On-device only, like the profile and
 * recently viewed (ADR-0002). The note is the diner's own record: it never
 * feeds the Safe/Unsafe verdict.
 */

const STORAGE_KEY = 'safe-bites/saved-restaurants';
export const MAX_SAVED = 100;
export const MAX_NOTE_LENGTH = 200;

export interface SavedRestaurant {
  osmId: number;
  restaurantName: string;
  lat?: number;
  lon?: number;
  phone?: string;
  address?: string;
  cuisine?: string;
  details?: RestaurantDetails;
  note?: string;
  savedAt: number;
}

type Listener = () => void;
const listeners = new Set<Listener>();

/** Lets the Saved tab refresh when a restaurant page saves or unsaves. */
export function onSavedChanged(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export async function loadSaved(): Promise<SavedRestaurant[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed)
      ? parsed.filter(
          (entry): entry is SavedRestaurant =>
            entry && typeof entry.osmId === 'number' && typeof entry.restaurantName === 'string'
        )
      : [];
  } catch {
    return [];
  }
}

async function write(list: SavedRestaurant[]): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  for (const listener of listeners) listener();
}

/** Newest first. Saving an already-saved restaurant keeps its note. */
export async function saveRestaurant(entry: Omit<SavedRestaurant, 'savedAt' | 'note'>): Promise<void> {
  const list = await loadSaved();
  const existing = list.find((e) => e.osmId === entry.osmId);
  const next = [
    { ...entry, note: existing?.note, savedAt: existing?.savedAt ?? Date.now() },
    ...list.filter((e) => e.osmId !== entry.osmId),
  ].slice(0, MAX_SAVED);
  await write(next);
}

export async function unsaveRestaurant(osmId: number): Promise<void> {
  await write((await loadSaved()).filter((e) => e.osmId !== osmId));
}

export async function setSavedNote(osmId: number, note: string): Promise<void> {
  const trimmed = note.trim().slice(0, MAX_NOTE_LENGTH);
  await write((await loadSaved()).map((e) => (e.osmId === osmId ? { ...e, note: trimmed || undefined } : e)));
}
