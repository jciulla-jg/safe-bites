import AsyncStorage from '@react-native-async-storage/async-storage';
import type { GeocodeResult, OsmRestaurant } from './osm';

/**
 * Last good results from the free OpenStreetMap services, kept on the
 * device. The public Overpass server sometimes returns 504s under load. When
 * a live lookup fails, the Search screen falls back to these (labeled as
 * saved results), so a demo or a busy evening doesn't end in an error.
 */

const GEOCODE_KEY = 'safe-bites/geocode-cache';
const RESULTS_KEY = 'safe-bites/search-cache';
const MAX_GEOCODES = 30;
// Result sets can be a few hundred KB each; keep only the most recent few.
const MAX_RESULT_SETS = 5;

interface CachedResults {
  key: string;
  savedAt: number;
  restaurants: OsmRestaurant[];
}

async function readJson<T>(key: string, fallback: T): Promise<T> {
  try {
    const raw = await AsyncStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

async function writeJson(key: string, value: unknown): Promise<void> {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage full or unavailable: the cache is only a convenience.
  }
}

export async function loadCachedGeocode(zip: string): Promise<GeocodeResult | null> {
  const all = await readJson<Record<string, GeocodeResult>>(GEOCODE_KEY, {});
  return all[zip] ?? null;
}

export async function saveCachedGeocode(zip: string, result: GeocodeResult): Promise<void> {
  const all = await readJson<Record<string, GeocodeResult>>(GEOCODE_KEY, {});
  delete all[zip];
  const entries = [...Object.entries(all), [zip, result] as [string, GeocodeResult]].slice(-MAX_GEOCODES);
  await writeJson(GEOCODE_KEY, Object.fromEntries(entries));
}

/** Same zip + radius means the same result set. */
export function resultsKey(zip: string, radiusMiles: number): string {
  return `${zip}:${radiusMiles}`;
}

export async function loadCachedResults(key: string): Promise<{ savedAt: number; restaurants: OsmRestaurant[] } | null> {
  const all = await readJson<CachedResults[]>(RESULTS_KEY, []);
  const hit = all.find((entry) => entry.key === key);
  return hit ? { savedAt: hit.savedAt, restaurants: hit.restaurants } : null;
}

export async function saveCachedResults(key: string, restaurants: OsmRestaurant[]): Promise<void> {
  const all = await readJson<CachedResults[]>(RESULTS_KEY, []);
  const next = [{ key, savedAt: Date.now(), restaurants }, ...all.filter((entry) => entry.key !== key)].slice(
    0,
    MAX_RESULT_SETS
  );
  await writeJson(RESULTS_KEY, next);
}
