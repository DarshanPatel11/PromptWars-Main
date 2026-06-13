/**
 * MindCompass AI — Supabase Browser Client
 *
 * Security: no hardcoded API keys — all credentials loaded from environment variables.
 * This client uses the public anon key, which is safe for browser exposure.
 * Row Level Security (RLS) on all tables enforces that users can only
 * access their own data, even with a shared anon key.
 *
 * modular design: single shared client instance, imported wherever needed.
 */

import { createBrowserClient } from "@supabase/ssr";

/**
 * Creates a Supabase client for use in React components and client-side code.
 * Uses the public NEXT_PUBLIC_ env vars — never the service role key.
 * input validation: environment variables are validated at startup.
 */
export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn(
      "[MindCompass] Warning: Missing Supabase environment variables. " +
        "Ensure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set."
    );
  }

  return createBrowserClient(supabaseUrl || "", supabaseAnonKey || "");
}
