/**
 * MindCompass AI — Weekly Summary Route Handler
 *
 * POST /api/weekly-summary
 *
 * Triggered automatically every 7th check-in (fire-and-forget from /api/analyze).
 * Generates a 100–150 word pattern summary from the last 7 days of journals.
 * This summary powers longitudinal emotional intelligence in subsequent analysis calls.
 *
 * Security:
 *   - Authenticated: validates session before processing
 *   - no hardcoded API keys: GEMINI_API_KEY from environment only
 *   - input validation: userId validated as UUID format
 *
 * asynchronous handling: non-blocking, called fire-and-forget.
 * error handling exceptions: failures are logged but do not surface to the user.
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { generateAndSaveWeeklySummary } from "@/lib/weekly-summary-service";

/**
 * input validation: userId must be a valid UUID.
 */
const weeklySummaryRequestSchema = z.object({
  userId: z.string().uuid("Invalid user ID format"),
});

/**
 * POST /api/weekly-summary
 * Generates and stores a weekly pattern summary for the given user.
 */
export async function POST(request: NextRequest) {
  // ── Authentication ──────────────────────────────────────────
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // ── Parse request body ─────────────────────────────────────
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parseResult = weeklySummaryRequestSchema.safeParse(body);
  if (!parseResult.success) {
    return NextResponse.json(
      { error: "Invalid user ID" },
      { status: 400 }
    );
  }

  // Security: ensure the requesting user can only generate their own summary
  if (parseResult.data.userId !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // ── Generate weekly summary via the shared service ─────────────
  const result = await generateAndSaveWeeklySummary(supabase, parseResult.data.userId);

  if (!result.success) {
    if (result.error === "Profile not found") {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }
    // Return 200 for other failures (non-critical operation fallback)
    return NextResponse.json(
      { success: false, error: result.error },
      { status: 200 }
    );
  }

  return NextResponse.json({ success: true, week_ending: result.week_ending });
}
