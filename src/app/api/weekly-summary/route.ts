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
import { generateWeeklySummary } from "@/lib/gemini";
import { format, subDays } from "date-fns";

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

  // ── Fetch last 7 days of data ──────────────────────────────
  const today = format(new Date(), "yyyy-MM-dd");
  const sevenDaysAgo = format(subDays(new Date(), 7), "yyyy-MM-dd");

  const [journalsResult, metricsResult, profileResult] = await Promise.all([
    supabase
      .from("journal_entries")
      .select("*")
      .eq("user_id", user.id)
      .gte("entry_date", sevenDaysAgo)
      .lte("entry_date", today)
      .order("entry_date", { ascending: true }),
    supabase
      .from("daily_metrics")
      .select("*")
      .eq("user_id", user.id)
      .gte("check_in_date", sevenDaysAgo)
      .lte("check_in_date", today)
      .order("check_in_date", { ascending: true }),
    supabase
      .from("user_profiles")
      .select("*")
      .eq("user_id", user.id)
      .single(),
  ]);

  if (!profileResult.data) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }

  if (!journalsResult.data || journalsResult.data.length === 0) {
    return NextResponse.json(
      { message: "Not enough journal data for weekly summary" },
      { status: 200 }
    );
  }

  // ── Generate weekly summary via Gemini ─────────────────────
  try {
    const summary = await generateWeeklySummary({
      profile: profileResult.data,
      journals: journalsResult.data,
      metrics: metricsResult.data ?? [],
    });

    if (summary) {
      // Save weekly summary
      await supabase.from("weekly_summaries").upsert(
        {
          user_id: user.id,
          summary,
          week_ending: today,
        },
        { onConflict: "user_id,week_ending" }
      );
    }

    return NextResponse.json({ success: true, week_ending: today });
  } catch (error) {
    // error handling exceptions: log but return 200 (non-critical operation)
    console.error("[MindCompass API] Weekly summary generation failed:", error);
    return NextResponse.json(
      { success: false, error: "Summary generation failed" },
      { status: 200 }
    );
  }
}
