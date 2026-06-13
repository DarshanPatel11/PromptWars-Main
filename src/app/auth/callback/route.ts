/**
 * MindCompass AI — Auth Callback Route Handler
 *
 * Handles the OAuth/email confirmation callback from Supabase.
 * Security: validates the auth code before exchanging for a session.
 * error handling exceptions: invalid or expired codes redirect to sign-in.
 * clean architecture: single responsibility — auth code exchange only.
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * GET /auth/callback
 * Called by Supabase after email confirmation or OAuth flow.
 * asynchronous handling: awaits the code exchange before redirecting.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  // input validation: code must be present
  if (!code) {
    console.error("[MindCompass Auth] Missing auth code in callback.");
    return NextResponse.redirect(`${origin}/auth/signin?error=missing_code`);
  }

  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      console.error("[MindCompass Auth] Code exchange failed:", error.message);
      return NextResponse.redirect(`${origin}/auth/signin?error=auth_failed`);
    }

    // Redirect to onboarding if first login, otherwise dashboard
    return NextResponse.redirect(`${origin}${next}`);
  } catch (error) {
    // error handling exceptions: unexpected server errors
    console.error("[MindCompass Auth] Unexpected callback error:", error);
    return NextResponse.redirect(`${origin}/auth/signin?error=server_error`);
  }
}
