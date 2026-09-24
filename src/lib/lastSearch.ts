import AsyncStorage from '@react-native-async-storage/async-storage';

/** Remembers the last zip/radius searched, so reopening the app doesn't start blank. */

const STORAGE_KEY = 'safe-bites/last-search';

export interface LastSearch {
  zip: string;
  radiusMiles: number;
}

export async function loadLastSearch(): Promise<LastSearch | null> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (
      parsed &&
      typeof parsed === 'object' &&
      typeof parsed.zip === 'string' &&
      typeof parsed.radiusMiles === 'number'
    ) {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}

export async function saveLastSearch(search: LastSearch): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(search));
}
