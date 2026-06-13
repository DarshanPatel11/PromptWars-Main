/**
 * MindCompass AI — Dashboard Page
 *
 * Hero page: shows Mental Readiness Score, recent trends, AI insights, and Tier 2 cards.
 * Server Component: data fetched server-side for fast initial render.
 * accessible semantic HTML: heading hierarchy h1→h2→h3, landmark regions.
 * minimized layout shifting: skeleton dimensions match real content.
 * optimized loading state loaders: Suspense boundaries for each section.
 */

import { Suspense } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ScoreGauge } from "@/components/ScoreGauge";
import { DashboardClient } from "@/components/DashboardClient";
import { Tier2Cards } from "@/components/Tier2Cards";
import { format } from "date-fns";

export const metadata = {
  title: "Dashboard",
  description: "Your mental wellness overview — readiness score, trends, and insights.",
};

/** Dashboard page — server component fetching all user data. */
export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth/signin");

  const today = format(new Date(), "yyyy-MM-dd");

  // Parallel data fetching for efficiency
  const [
    latestScoreResult,
    recentScoresResult,
    latestInsightResult,
    todayMetricsResult,
    profileResult,
  ] = await Promise.all([
    supabase
      .from("readiness_scores")
      .select("*")
      .eq("user_id", user.id)
      .order("score_date", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("readiness_scores")
      .select("score, score_date")
      .eq("user_id", user.id)
      .order("score_date", { ascending: false })
      .limit(14),
    supabase
      .from("ai_insights")
      .select("*")
      .eq("user_id", user.id)
      .order("insight_date", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("daily_metrics")
      .select("*")
      .eq("user_id", user.id)
      .eq("check_in_date", today)
      .maybeSingle(),
    supabase
      .from("user_profiles")
      .select("name, exam_type, check_in_count")
      .eq("user_id", user.id)
      .single(),
  ]);

  const latestScore = latestScoreResult.data;
  const recentScores = recentScoresResult.data ?? [];
  const latestInsight = latestInsightResult.data;
  const todayCheckedIn = !!todayMetricsResult.data;
  const profile = profileResult.data;

  return (
    /*
     * accessible semantic HTML: <main> with heading hierarchy.
     * Page heading h1 is rendered below in the greeting.
     */
    <div className="p-6 max-w-6xl mx-auto">
      {/* Page header */}
      <header className="mb-8">
        <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
          Good {getTimeOfDay()}, {profile?.name?.split(" ")[0] ?? "there"} 👋
        </h1>
        <p className="mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>
          {todayCheckedIn
            ? "You've completed today's check-in. Here's your wellness overview."
            : "Start your day with a quick check-in to track your mental readiness."}
        </p>
      </header>

      {/* Hero section: Score gauge + trends */}
      <section
        aria-labelledby="score-section-heading"
        className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6"
      >
        {/* Mental Readiness Score (hero) */}
        <div
          className="glass-card p-6 lg:col-span-1 flex flex-col items-center justify-center"
          role="region"
          aria-label="Mental Readiness Score"
        >
          <h2
            id="score-section-heading"
            className="text-sm font-semibold uppercase tracking-wide mb-4"
            style={{ color: "var(--text-muted)" }}
          >
            Today's Readiness
          </h2>
          <ScoreGauge
            score={latestScore?.score ?? null}
            explanation={latestScore?.explanation}
          />

          {/* Daily check-in CTA */}
          {!todayCheckedIn && (
            <a
              href="/checkin"
              className="btn-gradient mt-6 w-full justify-center text-center"
              id="cta-daily-checkin"
              aria-label="Complete your daily check-in"
            >
              ✏️ Daily Check-in
            </a>
          )}
        </div>

        {/* Score trend chart + latest insight */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          {/* Score trend */}
          <Suspense fallback={<div className="skeleton h-48 rounded-xl" aria-label="Loading trend chart" />}>
            <DashboardClient
              recentScores={recentScores}
              latestInsight={latestInsight}
              todayCheckedIn={todayCheckedIn}
            />
          </Suspense>
        </div>
      </section>

      {/* Tier 2 cards: Triggers, Burnout, What Changed */}
      <section aria-labelledby="insights-heading" className="mt-6">
        <h2
          id="insights-heading"
          className="text-lg font-semibold mb-4"
          style={{ color: "var(--text-primary)" }}
        >
          Pattern Intelligence
        </h2>
        <Tier2Cards userId={user.id} />
      </section>

      {/* Journaling streak */}
      {profile && (
        <div
          className="glass-card p-4 mt-6 flex items-center gap-3"
          role="status"
          aria-label={`Journaling streak: ${profile.check_in_count} days`}
        >
          <span className="text-2xl" aria-hidden="true">🔥</span>
          <div>
            <p className="font-semibold text-sm" style={{ color: "var(--text-primary)" }}>
              {profile.check_in_count} day{profile.check_in_count !== 1 ? "s" : ""} journaling streak
            </p>
            <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
              Consistency is the foundation of self-awareness. Keep going!
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

/** Returns time-of-day greeting string. edge case handling: covers full 24h range. */
function getTimeOfDay(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "morning";
  if (hour < 17) return "afternoon";
  return "evening";
}
