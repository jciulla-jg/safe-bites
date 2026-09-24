import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Secrets for community submissions (feedback, community menu items) made on
 * this device, keyed by submission id. The server keeps only a hash of each
 * secret (supabase/migrations/0005_submission_ownership.sql), so holding the
 * secret is what proves "you submitted this" without any account. Clearing
 * app storage forfeits the ability to edit those entries -- they stay up.
 */

const STORAGE_KEY = 'safe-bites/owned-submissions';

export type OwnedSubmissions = Record<string, string>;

export async function loadOwnedSubmissions(): Promise<OwnedSubmissions> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
  } catch {
    return {};
  }
}

export async function rememberOwnedSubmission(id: string, secret: string): Promise<void> {
  const owned = await loadOwnedSubmissions();
  owned[id] = secret;
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(owned));
}

export async function forgetOwnedSubmission(id: string): Promise<void> {
  const owned = await loadOwnedSubmissions();
  delete owned[id];
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(owned));
}
