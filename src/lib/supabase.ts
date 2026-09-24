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
export const supabase = createClient<Database>(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-anon-key'
);
