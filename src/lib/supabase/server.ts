/**
 * MindCompass AI — Supabase Server Client
 *
 * Security: no hardcoded API keys — credentials loaded from environment variables only.
 * This server-side client handles cookie-based session management for Next.js App Router.
 * Used in Server Components, Route Handlers, and Middleware.
 *
 * clean architecture: server and client Supabase instances are strictly separated.
 * asynchronous handling: uses async cookies() API from next/headers.
 */

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Server-side Supabase client.
 * Reads auth cookies to restore the user session in server context.
 * error handling exceptions: throws if env vars are missing.
 */
export async function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // input validation: fail fast if configuration is missing
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      "[MindCompass] Missing Supabase environment variables on server. " +
        "Ensure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set."
    );
  }

  const cookieStore = await cookies();

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // setAll is called from Server Components where cookies cannot be set.
          // The middleware handles session refresh in those cases.
        }
      },
    },
  });
}
