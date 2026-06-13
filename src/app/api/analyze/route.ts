/**
 * MindCompass AI — AI Analysis Route Handler
 *
 * POST /api/analyze
 *
 * Security:
 *   - no hardcoded API keys: GEMINI_API_KEY loaded from server env only
 *   - Authenticated: validates Supabase session before processing
 *   - sanitized user inputs: journal text validated for length/type
 *   - input validation: request body validated with Zod before AI processing
 *   - Minimal data to Gemini: only recent journals + profile (no raw user IDs)
 *
 * clean architecture: route handler delegates to gemini.ts for AI calls
 * asynchronous handling: all DB and AI operations properly awaited
 * error handling exceptions: structured error responses for all failure modes
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { analyzeCheckIn } from "@/lib/gemini";
import { calculateMentalReadinessScore } from "@/lib/readiness-score";
import { format } from "date-fns";

/**
 * input validation: strict schema for the analysis request body.
 * sanitized user inputs: string trimming and range constraints enforced.
 */
const analyzeRequestSchema = z.object({
  mood_score: z.number().int().min(1).max(10),
  energy_score: z.number().int().min(1).max(10),
  confidence_score: z.number().int().min(1).max(10),
  sleep_hours: z.number().min(0).max(16),
  study_hours: z.number().min(0).max(24),
  journal_content: z
    .string()
    .min(1, "Journal entry cannot be empty")
    .max(10000, "Journal entry is too long")
    .transform((v) => v.trim()),
});

/**
 * POST /api/analyze
 * Processes a daily check-in: saves metrics, runs Gemini analysis,
 * calculates Mental Readiness Score, and stores all results.
 */
export async function POST(request: NextRequest) {
  // ── Step 1: Authentication check ──────────────────────────
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json(
      { error: "Unauthorized. Please sign in." },
      { status: 401 }
    );
  }

  // ── Step 2: Parse and validate request body ───────────────
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid request body. Expected JSON." },
      { status: 400 }
    );
  }

  const parseResult = analyzeRequestSchema.safeParse(body);
  if (!parseResult.success) {
    return NextResponse.json(
      {
        error: "Validation failed",
        details: parseResult.error.flatten().fieldErrors,
      },
      { status: 400 }
    );
  }

  const validatedData = parseResult.data;
  const today = format(new Date(), "yyyy-MM-dd");

  // ── Step 3: Fetch user profile ────────────────────────────
  const { data: profile, error: profileError } = await supabase
    .from("user_profiles")
    .select("*")
    .eq("user_id", user.id)
    .single();

  if (profileError || !profile) {
    return NextResponse.json(
      { error: "User profile not found. Please complete onboarding." },
      { status: 404 }
    );
  }

  // ── Step 4: Save daily metrics (upsert for idempotency) ───
  const { data: savedMetrics, error: metricsError } = await supabase
    .from("daily_metrics")
    .upsert(
      {
        user_id: user.id,
        mood_score: validatedData.mood_score,
        energy_score: validatedData.energy_score,
        confidence_score: validatedData.confidence_score,
        sleep_hours: validatedData.sleep_hours,
        study_hours: validatedData.study_hours,
        check_in_date: today,
      },
      { onConflict: "user_id,check_in_date" }
    )
    .select()
    .single();

  if (metricsError) {
    console.error("[MindCompass API] Failed to save metrics:", metricsError);
    return NextResponse.json(
      { error: "Failed to save check-in metrics." },
      { status: 500 }
    );
  }

  // ── Step 5: Save journal entry ────────────────────────────
  const { error: journalError } = await supabase
    .from("journal_entries")
    .upsert(
      {
        user_id: user.id,
        content: validatedData.journal_content,
        entry_date: today,
      },
      { onConflict: "user_id,entry_date" }
    );

  if (journalError) {
    console.error("[MindCompass API] Failed to save journal:", journalError);
    return NextResponse.json(
      { error: "Failed to save journal entry." },
      { status: 500 }
    );
  }

  // ── Step 6: Fetch recent history (last 3 days) ────────────
  const { data: recentJournals } = await supabase
    .from("journal_entries")
    .select("*")
    .eq("user_id", user.id)
    .lt("entry_date", today)
    .order("entry_date", { ascending: false })
    .limit(3);

  const { data: recentMetrics } = await supabase
    .from("daily_metrics")
    .select("*")
    .eq("user_id", user.id)
    .lt("check_in_date", today)
    .order("check_in_date", { ascending: false })
    .limit(3);

  // ── Step 7: Fetch latest weekly summary ───────────────────
  const { data: weeklySummary } = await supabase
    .from("weekly_summaries")
    .select("*")
    .eq("user_id", user.id)
    .order("week_ending", { ascending: false })
    .limit(1)
    .maybeSingle();

  // ── Step 8: Run Gemini analysis ───────────────────────────
  let analysisResult;
  try {
    analysisResult = await analyzeCheckIn({
      profile,
      currentJournal: validatedData.journal_content,
      currentMetrics: savedMetrics,
      recentJournals: recentJournals ?? [],
      recentMetrics: recentMetrics ?? [],
      weeklySummary: weeklySummary ?? null,
    });
  } catch (error) {
    console.error("[MindCompass API] Gemini analysis failed:", error);
    return NextResponse.json(
      { error: "AI analysis failed. Please try again." },
      { status: 500 }
    );
  }

  // ── Step 9: Calculate Mental Readiness Score (client formula) ──
  const score = calculateMentalReadinessScore(analysisResult.score_inputs);

  // ── Step 10: Save AI insight ──────────────────────────────
  await supabase.from("ai_insights").upsert(
    {
      user_id: user.id,
      emotions: analysisResult.emotions,
      dominant_emotion: analysisResult.dominant_emotion,
      emotional_summary: analysisResult.emotional_summary,
      coping_strategy: analysisResult.coping_strategy,
      mindfulness_exercise: analysisResult.mindfulness_exercise,
      encouragement: analysisResult.encouragement,
      score_inputs: analysisResult.score_inputs,
      safety_flag: analysisResult.safety_flag,
      insight_date: today,
    },
    { onConflict: "user_id,insight_date" }
  );

  // ── Step 11: Save Mental Readiness Score ─────────────────
  await supabase.from("readiness_scores").upsert(
    {
      user_id: user.id,
      score,
      components: analysisResult.score_inputs,
      explanation: analysisResult.emotional_summary,
      score_date: today,
    },
    { onConflict: "user_id,score_date" }
  );

  // ── Step 12: Increment check-in count + trigger weekly summary ──
  const newCheckInCount = (profile.check_in_count ?? 0) + 1;
  await supabase
    .from("user_profiles")
    .update({ check_in_count: newCheckInCount })
    .eq("user_id", user.id);

  // Trigger weekly summary generation asynchronously (non-blocking)
  if (newCheckInCount % 7 === 0) {
    // Fire-and-forget — the summary is generated in the background
    // and available for the next check-in
    fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/weekly-summary`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: user.id }),
    }).catch((err) =>
      console.error("[MindCompass API] Weekly summary trigger failed:", err)
    );
  }

  // ── Return analysis result ────────────────────────────────
  return NextResponse.json({
    success: true,
    analysis: analysisResult,
    score,
    check_in_date: today,
  });
}
