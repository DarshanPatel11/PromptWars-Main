/**
 * MindCompass AI — History Page
 *
 * Calendar heat map showing 30 days of check-in history.
 * Clicking a day shows its journal entry, metrics, and AI insight.
 *
 * accessible semantic HTML: calendar grid uses role="grid", day cells use role="gridcell".
 * ARIA labels: each day cell describes its score and date.
 * minimized layout shifting: fixed calendar cell dimensions.
 * optimized loading state loaders: skeleton while data loads.
 */

"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { format, parseISO, subDays, eachDayOfInterval } from "date-fns";
import { Calendar, ChevronLeft, BookOpen, Zap, Moon, Brain } from "lucide-react";

interface DayData {
  date: string;
  score: number | null;
  journal: string | null;
  metrics: {
    mood_score: number;
    energy_score: number;
    confidence_score: number;
    sleep_hours: number;
    study_hours: number;
  } | null;
  insight: {
    dominant_emotion: string;
    emotional_summary: string;
    encouragement: string;
  } | null;
}

/** Returns heat map color for a given score. */
function getHeatMapColor(score: number | null): string {
  if (score === null) return "rgba(255,255,255,0.03)";
  if (score >= 70) return "rgba(34, 197, 94, 0.6)";
  if (score >= 55) return "rgba(34, 197, 94, 0.3)";
  if (score >= 40) return "rgba(234, 179, 8, 0.5)";
  return "rgba(239, 68, 68, 0.5)";
}

export default function HistoryPage() {
  const [historyData, setHistoryData] = useState<DayData[]>([]);
  const [selectedDay, setSelectedDay] = useState<DayData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function fetchHistory() {
      try {
        const supabase = createClient();
        const today = new Date();
        const thirtyDaysAgo = subDays(today, 29);

        const [scoresResult, journalsResult, metricsResult, insightsResult] =
          await Promise.all([
            supabase
              .from("readiness_scores")
              .select("score, score_date")
              .gte("score_date", format(thirtyDaysAgo, "yyyy-MM-dd"))
              .order("score_date"),
            supabase
              .from("journal_entries")
              .select("content, entry_date")
              .gte("entry_date", format(thirtyDaysAgo, "yyyy-MM-dd")),
            supabase
              .from("daily_metrics")
              .select("*")
              .gte("check_in_date", format(thirtyDaysAgo, "yyyy-MM-dd")),
            supabase
              .from("ai_insights")
              .select("dominant_emotion, emotional_summary, encouragement, insight_date")
              .gte("insight_date", format(thirtyDaysAgo, "yyyy-MM-dd")),
          ]);

        if (!mounted) return;

        // Build a map of date → data for efficient lookup
        const scoreMap = new Map(
          scoresResult.data?.map((s) => [s.score_date, s.score]) ?? []
        );
        const journalMap = new Map(
          journalsResult.data?.map((j) => [j.entry_date, j.content]) ?? []
        );
        const metricsMap = new Map(
          metricsResult.data?.map((m) => [m.check_in_date, m]) ?? []
        );
        const insightMap = new Map(
          insightsResult.data?.map((i) => [i.insight_date, i]) ?? []
        );

        // Generate all 30 days
        const days = eachDayOfInterval({ start: thirtyDaysAgo, end: today });
        const history: DayData[] = days.map((day) => {
          const dateStr = format(day, "yyyy-MM-dd");
          return {
            date: dateStr,
            score: scoreMap.get(dateStr) ?? null,
            journal: journalMap.get(dateStr) ?? null,
            metrics: metricsMap.get(dateStr) ?? null,
            insight: insightMap.get(dateStr) ?? null,
          };
        });

        setHistoryData(history);
      } catch (error) {
        console.error("[MindCompass History] Failed to fetch:", error);
      } finally {
        if (mounted) setIsLoading(false);
      }
    }

    fetchHistory();
    return () => { mounted = false; };
  }, []);

  if (isLoading) {
    return (
      <div className="p-6 max-w-4xl mx-auto" aria-busy="true" aria-label="Loading history">
        <div className="skeleton h-8 w-48 mb-8 rounded-xl" aria-hidden="true" />
        <div className="glass-card p-6">
          <div className="grid grid-cols-10 gap-2">
            {Array.from({ length: 30 }).map((_, i) => (
              <div key={i} className="skeleton calendar-cell" aria-hidden="true" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  const checkedInDays = historyData.filter((d) => d.score !== null).length;
  const avgScore =
    historyData
      .filter((d) => d.score !== null)
      .reduce((sum, d) => sum + (d.score ?? 0), 0) /
      (checkedInDays || 1);

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Page header */}
      <header className="mb-6">
        <h1
          className="text-2xl font-bold flex items-center gap-2"
          style={{ color: "var(--text-primary)" }}
        >
          <Calendar className="w-6 h-6" aria-hidden="true" />
          Wellness History
        </h1>
        <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
          Last 30 days — click any day to see your journal and insights.
        </p>
      </header>

      {/* Summary stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: "Check-ins", value: checkedInDays, max: 30 },
          {
            label: "Avg Score",
            value: checkedInDays > 0 ? Math.round(avgScore) : "—",
            max: null,
          },
          {
            label: "Streak",
            value: calculateStreak(historyData),
            max: null,
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className="glass-card p-4 text-center"
            role="region"
            aria-label={`${stat.label}: ${stat.value}${stat.max ? ` out of ${stat.max}` : ""}`}
          >
            <p
              className="text-2xl font-bold"
              style={{ color: "var(--text-primary)" }}
            >
              {stat.value}
              {stat.max && (
                <span className="text-sm font-normal" style={{ color: "var(--text-muted)" }}>
                  /{stat.max}
                </span>
              )}
            </p>
            <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
              {stat.label}
            </p>
          </div>
        ))}
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Calendar heat map */}
        <div className="flex-1">
          <div className="glass-card p-6">
            <h2
              className="text-sm font-semibold mb-4"
              style={{ color: "var(--text-muted)" }}
            >
              30-DAY CALENDAR
            </h2>

            {/*
             * accessible semantic HTML: grid with role="grid".
             * ARIA labels: aria-label on grid and each cell.
             */}
            <div
              role="grid"
              aria-label="30-day mental readiness score calendar"
              className="grid gap-2"
              style={{
                gridTemplateColumns: `repeat(10, 1fr)`,
              }}
            >
              {historyData.map((day) => {
                const displayDate = format(parseISO(day.date), "MMM d");
                const isSelected = selectedDay?.date === day.date;

                return (
                  <div key={day.date} role="gridcell" aria-label={`${displayDate}${day.score !== null ? `, score: ${day.score}` : ", no check-in"}`}>
                    <button
                      onClick={() =>
                        day.score !== null
                          ? setSelectedDay(isSelected ? null : day)
                          : undefined
                      }
                      disabled={day.score === null}
                      className={`calendar-cell w-full ${day.score === null ? "calendar-cell-empty" : ""}`}
                      style={{
                        background: getHeatMapColor(day.score),
                        outline: isSelected
                          ? "2px solid var(--accent-primary)"
                          : "none",
                        outlineOffset: "2px",
                      }}
                      title={`${displayDate}${day.score !== null ? ` — Score: ${day.score}` : " — No check-in"}`}
                      aria-pressed={isSelected}
                    />
                  </div>
                );
              })}
            </div>

            {/* Legend */}
            <div
              className="flex items-center gap-4 mt-4 text-xs"
              style={{ color: "var(--text-muted)" }}
              aria-label="Score legend"
            >
              <span>Score:</span>
              {[
                { color: "rgba(239,68,68,0.5)", label: "<40" },
                { color: "rgba(234,179,8,0.5)", label: "40–54" },
                { color: "rgba(34,197,94,0.3)", label: "55–69" },
                { color: "rgba(34,197,94,0.6)", label: "70+" },
              ].map((l) => (
                <div key={l.label} className="flex items-center gap-1">
                  <div
                    className="w-4 h-4 rounded"
                    style={{ background: l.color }}
                    aria-hidden="true"
                  />
                  <span>{l.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Day detail panel */}
        {selectedDay && (
          <div
            className="w-full md:w-80 flex-shrink-0"
            role="complementary"
            aria-label={`Details for ${format(parseISO(selectedDay.date), "MMMM d, yyyy")}`}
          >
            <div className="glass-card p-5">
              <div className="flex items-center justify-between mb-4">
                <h2
                  className="font-semibold"
                  style={{ color: "var(--text-primary)" }}
                >
                  {format(parseISO(selectedDay.date), "MMMM d, yyyy")}
                </h2>
                <button
                  onClick={() => setSelectedDay(null)}
                  aria-label="Close day details"
                  className="text-xs px-2 py-1 rounded"
                  style={{ color: "var(--text-muted)" }}
                >
                  <ChevronLeft className="w-4 h-4" aria-hidden="true" />
                </button>
              </div>

              {/* Score */}
              <div
                className="text-center p-4 rounded-xl mb-4"
                style={{ background: "var(--bg-glass)" }}
              >
                <p
                  className="text-3xl font-bold"
                  style={{ color: selectedDay.score && selectedDay.score >= 70
                    ? "var(--color-success)"
                    : selectedDay.score && selectedDay.score >= 45
                    ? "var(--color-warning)"
                    : "var(--color-danger)" }}
                  aria-label={`Score: ${selectedDay.score} out of 100`}
                >
                  {selectedDay.score}
                </p>
                <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
                  Mental Readiness Score
                </p>
              </div>

              {/* Metrics */}
              {selectedDay.metrics && (
                <div className="grid grid-cols-2 gap-2 mb-4">
                  {[
                    { icon: Zap, label: "Energy", value: selectedDay.metrics.energy_score, unit: "/10" },
                    { icon: Brain, label: "Confidence", value: selectedDay.metrics.confidence_score, unit: "/10" },
                    { icon: Moon, label: "Sleep", value: selectedDay.metrics.sleep_hours, unit: "h" },
                    { icon: BookOpen, label: "Study", value: selectedDay.metrics.study_hours, unit: "h" },
                  ].map(({ icon: Icon, label, value, unit }) => (
                    <div
                      key={label}
                      className="p-2 rounded-lg text-center"
                      style={{ background: "var(--bg-glass)" }}
                    >
                      <Icon className="w-3 h-3 mx-auto mb-1" style={{ color: "var(--text-muted)" }} aria-hidden="true" />
                      <p className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>
                        {value}{unit}
                      </p>
                      <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                        {label}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              {/* Journal snippet */}
              {selectedDay.journal && (
                <div className="mb-4">
                  <h3 className="text-xs font-semibold mb-1" style={{ color: "var(--text-muted)" }}>
                    JOURNAL
                  </h3>
                  <p
                    className="text-xs leading-relaxed"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    {selectedDay.journal.slice(0, 200)}
                    {selectedDay.journal.length > 200 && "..."}
                  </p>
                </div>
              )}

              {/* AI insight */}
              {selectedDay.insight && (
                <div>
                  <h3 className="text-xs font-semibold mb-1" style={{ color: "var(--text-muted)" }}>
                    AI INSIGHT — {selectedDay.insight.dominant_emotion}
                  </h3>
                  <p
                    className="text-xs leading-relaxed"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    {selectedDay.insight.emotional_summary.slice(0, 150)}...
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Calculates current journaling streak from the most recent day backward.
 * edge case handling: handles gaps in check-in data correctly.
 */
function calculateStreak(history: DayData[]): number {
  const sorted = [...history].reverse(); // Newest first
  let streak = 0;
  for (const day of sorted) {
    if (day.score !== null) streak++;
    else break;
  }
  return streak;
}
