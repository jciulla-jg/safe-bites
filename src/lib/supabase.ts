import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

// Expo automatically inlines any env var prefixed with EXPO_PUBLIC_ at build time,
// so these are available on both native and web without extra config.
// See .env.example at the repo root for the expected shape of a real .env file.
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  // Don't throw at import time in dev -- just warn, so the rest of the app
  // (screens that don't need Supabase yet) can still render/typecheck.
  // NOTE: createClient() itself throws synchronously on an empty string URL
  // (it validates the URL is well-formed, not that it's reachable), so a
  // placeholder well-formed URL is passed below instead of ''. Any actual
  // Supabase call will simply fail at request time until real credentials
  // are set, which is the correct/expected failure mode pre-configuration.
  console.warn(
    '[supabase] EXPO_PUBLIC_SUPABASE_URL / EXPO_PUBLIC_SUPABASE_ANON_KEY are not set. ' +
      'Copy .env.example to .env and fill in your Supabase project credentials.'
  );
}

// NOTE: Database is a hand-authored placeholder (see ./database.types.ts) matching the
// SQL migrations in supabase/migrations/. Regenerate it with the Supabase CLI
// (supabase gen types typescript) once a live project exists, if desired.
// React Native and browsers both define `window`; plain Node does not.
const inApp = typeof window !== 'undefined';

export const supabase = createClient<Database>(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-anon-key',
  {
    auth: {
      // Keep the anonymous account across app restarts (web: localStorage).
      // Off outside an app (the Node unit tests import this file too).
      storage: AsyncStorage,
      persistSession: inApp,
      autoRefreshToken: inApp,
      detectSessionInUrl: false,
    },
  }
);

/**
 * Sign this phone in with a Supabase anonymous account (no email, no screen)
 * so the server can tell diners apart without trusting a device id the phone
 * makes up (0012 _caller_identity). Best effort: if anonymous sign-ins are
 * off or rate-limited, the app keeps working with its device id as before.
 */
export async function ensureAnonymousSession(): Promise<void> {
  try {
    const { data } = await supabase.auth.getSession();
    if (data.session) return;
    await supabase.auth.signInAnonymously();
  } catch {
    // Not signed in: every call still works as the public role.
  }
}
