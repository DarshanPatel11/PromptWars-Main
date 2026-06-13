/**
 * MindCompass AI — Dashboard Client Component
 *
 * Client-side interactive elements of the dashboard:
 * - Recent score trend chart (Recharts sparkline)
 * - Latest AI insight summary card
 *
 * modular design: client interactivity separated from server data fetching.
 * accessible semantic HTML: chart wrapped in figure/figcaption.
 * minimized layout shifting: chart container has fixed height.
 * optimized loading state loaders: handled via parent Suspense.
 */

"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { format, parseISO } from "date-fns";
import type { AIInsight } from "@/types";

interface DashboardClientProps {
  recentScores: Array<{ score: number; score_date: string }>;
  latestInsight: AIInsight | null;
  todayCheckedIn: boolean;
}

/** Custom tooltip for the trend chart. */
function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ value: number }>;
  label?: string;
}) {
  if (!active || !payload?.[0]) return null;
  return (
    <div
      className="glass-card px-3 py-2 text-sm"
      style={{ border: "1px solid var(--border-glass)" }}
    >
      <p style={{ color: "var(--text-secondary)" }}>{label}</p>
      <p className="font-bold" style={{ color: "var(--accent-secondary)" }}>
        Score: {payload[0].value}
      </p>
    </div>
  );
}

export function DashboardClient({
  recentScores,
  latestInsight,
  todayCheckedIn,
}: DashboardClientProps) {
  // Format data for chart — reverse to show oldest → newest
  const chartData = [...recentScores]
    .reverse()
    .map((s) => ({
      date: format(parseISO(s.score_date), "MMM d"),
      score: s.score,
    }));

  return (
    <div className="flex flex-col gap-10 h-full">
      {/* Score trend chart */}
      <div className="glass-card p-12 flex-1">
        <h3 className="text-sm font-semibold mb-6" style={{ color: "var(--text-muted)" }}>
          14-DAY SCORE TREND
        </h3>

        {chartData.length > 1 ? (
          <figure aria-label="Mental Readiness Score trend over 14 days">
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={chartData}>
                <XAxis
                  dataKey="date"
                  tick={{ fill: "var(--text-muted)", fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  domain={[0, 100]}
                  tick={{ fill: "var(--text-muted)", fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                  width={25}
                />
                <Tooltip content={<CustomTooltip />} />
                {/* Reference lines for score categories */}
                <ReferenceLine y={70} stroke="rgba(34,197,94,0.3)" strokeDasharray="3 3" />
                <ReferenceLine y={45} stroke="rgba(234,179,8,0.3)" strokeDasharray="3 3" />
                <Line
                  type="monotone"
                  dataKey="score"
                  stroke="#7c3aed"
                  strokeWidth={2.5}
                  dot={{ fill: "#7c3aed", strokeWidth: 0, r: 4 }}
                  activeDot={{ r: 6, fill: "#3b82f6" }}
                />
              </LineChart>
            </ResponsiveContainer>
            <figcaption className="sr-only">
              Line chart showing Mental Readiness Scores over the last 14 days
            </figcaption>
          </figure>
        ) : (
          <div className="h-36 flex items-center justify-center">
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>
              Complete more check-ins to see your trend
            </p>
          </div>
        )}
      </div>

      {/* Latest AI insight card */}
      {latestInsight && (
        <div
          className="glass-card p-12 animate-slide-up"
          role="article"
          aria-label="Latest AI wellness insight"
        >
          <h3 className="text-sm font-semibold mb-4 flex items-center gap-2" style={{ color: "var(--text-muted)" }}>
            <span aria-hidden="true">🧠</span>
            LATEST INSIGHT
            {!todayCheckedIn && (
              <span
                className="text-xs px-2 py-0.5 rounded-full ml-auto"
                style={{
                  background: "rgba(234,179,8,0.15)",
                  color: "var(--color-warning)",
                }}
              >
                Yesterday
              </span>
            )}
          </h3>

          {/* Emotion tags */}
          <div className="flex flex-wrap gap-2 mb-3" role="list" aria-label="Detected emotions">
            {latestInsight.emotions.slice(0, 3).map((emotion) => (
              <span
                key={emotion.label}
                role="listitem"
                className="text-xs px-2 py-1 rounded-full font-medium"
                style={{
                  background: "var(--accent-gradient-soft)",
                  color: "var(--accent-secondary)",
                  border: "1px solid rgba(59,130,246,0.2)",
                }}
              >
                {emotion.label} ({Math.round(emotion.intensity * 100)}%)
              </span>
            ))}
          </div>

          <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
            {latestInsight.emotional_summary}
          </p>
        </div>
      )}
    </div>
  );
}
