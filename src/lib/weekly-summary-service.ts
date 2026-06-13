/**
 * MindCompass AI — Weekly Summary Service
 *
 * Direct module invocation helper for weekly summary generation.
 *
 * Efficiency:
 *   - Directly uses the server database connection and Gemini API.
 *   - Executes within the same process context without loopback HTTP network overhead.
 *   - Eliminates configurations for NEXT_PUBLIC_APP_URL, preventing potential failures.
 */

import { SupabaseClient } from "@supabase/supabase-js";
import { generateWeeklySummary } from "@/lib/gemini";
import { format, subDays } from "date-fns";

/**
 * Generates and stores a weekly pattern summary for the given user.
 * Reuse the existing authenticated Supabase client connection.
 */
export async function generateAndSaveWeeklySummary(
  supabase: SupabaseClient,
  userId: string
): Promise<{ success: boolean; error?: string; week_ending?: string }> {
  const today = format(new Date(), "yyyy-MM-dd");
  const sevenDaysAgo = format(subDays(new Date(), 7), "yyyy-MM-dd");

  const [journalsResult, metricsResult, profileResult] = await Promise.all([
    supabase
      .from("journal_entries")
      .select("*")
      .eq("user_id", userId)
      .gte("entry_date", sevenDaysAgo)
      .lte("entry_date", today)
      .order("entry_date", { ascending: true }),
    supabase
      .from("daily_metrics")
      .select("*")
      .eq("user_id", userId)
      .gte("check_in_date", sevenDaysAgo)
      .lte("check_in_date", today)
      .order("check_in_date", { ascending: true }),
    supabase
      .from("user_profiles")
      .select("*")
      .eq("user_id", userId)
      .single(),
  ]);

  if (profileResult.error || !profileResult.data) {
    return { success: false, error: "Profile not found" };
  }

  if (!journalsResult.data || journalsResult.data.length === 0) {
    return { success: true, error: "Not enough journal data for weekly summary" };
  }

  try {
    const summary = await generateWeeklySummary({
      profile: profileResult.data,
      journals: journalsResult.data,
      metrics: metricsResult.data ?? [],
    });

    if (summary) {
      // Save weekly summary
      const { error: upsertError } = await supabase.from("weekly_summaries").upsert(
        {
          user_id: userId,
          summary,
          week_ending: today,
        },
        { onConflict: "user_id,week_ending" }
      );

      if (upsertError) {
        throw upsertError;
      }
    }

    return { success: true, week_ending: today };
  } catch (error) {
    console.error("[MindCompass Service] Weekly summary generation failed:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
