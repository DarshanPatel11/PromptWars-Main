/**
 * MindCompass AI — Mental Readiness Score Gauge Component
 *
 * The hero feature: animated circular gauge displaying the 0–100 score.
 * modular design: self-contained SVG gauge with framer-motion animation.
 * accessible semantic HTML: ARIA attributes expose score value to screen readers.
 * ARIA labels: aria-label, aria-valuenow, aria-valuemin, aria-valuemax.
 * minimized layout shifting: fixed SVG viewBox ensures consistent dimensions.
 * optimized loading state loaders: skeleton shown while score is loading.
 */

"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { getScoreCategory } from "@/lib/readiness-score";

interface ScoreGaugeProps {
  score: number | null;
  explanation?: string;
  isLoading?: boolean;
}

/** SVG gauge configuration */
const GAUGE_CONFIG = {
  viewBox: "0 0 200 120",
  cx: 100,
  cy: 100,
  radius: 80,
  strokeWidth: 14,
  startAngle: -180, // degrees (left side of semicircle)
  endAngle: 0, // degrees (right side)
} as const;

/**
 * Converts a score (0–100) to the stroke-dashoffset for the gauge arc.
 * efficient loops: single mathematical conversion, no iteration.
 */
function scoreToStrokeDashoffset(score: number): number {
  const circumference = Math.PI * GAUGE_CONFIG.radius; // half circumference (semicircle)
  const progress = score / 100;
  return circumference * (1 - progress);
}

/**
 * Returns the gauge color based on score level.
 * Uses gradient from red → yellow → green.
 */
function getGaugeColor(score: number): string {
  if (score >= 70) return "#22c55e"; // green
  if (score >= 45) return "#eab308"; // yellow
  return "#ef4444"; // red
}

/**
 * ScoreGauge — The hero visualization of MindCompass AI.
 * Displays the Mental Readiness Score as an animated semicircular gauge.
 * ARIA labels: role="meter" with full value accessibility.
 */
export function ScoreGauge({ score, explanation, isLoading }: ScoreGaugeProps) {
  const [animatedScore, setAnimatedScore] = useState(0);

  // Animate score value from 0 to target on mount/change
  useEffect(() => {
    if (score === null || isLoading) return;

    const duration = 1200; // ms
    const start = Date.now();
    const from = animatedScore;
    const to = score;

    const animate = () => {
      const elapsed = Date.now() - start;
      const progress = Math.min(elapsed / duration, 1);
      // Ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setAnimatedScore(Math.round(from + (to - from) * eased));

      if (progress < 1) requestAnimationFrame(animate);
    };

    requestAnimationFrame(animate);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [score]);

  if (isLoading) {
    return (
      <div
        className="flex flex-col items-center"
        aria-busy="true"
        aria-label="Loading Mental Readiness Score"
      >
        {/* optimized loading state loaders: skeleton with fixed dimensions */}
        <div
          className="skeleton"
          style={{ width: 220, height: 130, borderRadius: "12px" }}
          aria-hidden="true"
        />
        <div className="skeleton skeleton-text mt-3" style={{ width: 180 }} aria-hidden="true" />
        <div className="skeleton skeleton-text-sm mt-2" style={{ width: 140 }} aria-hidden="true" />
      </div>
    );
  }

  if (score === null) {
    return (
      <div className="flex flex-col items-center text-center">
        <div
          className="w-48 h-28 rounded-xl flex items-center justify-center"
          style={{ background: "var(--bg-glass)", border: "1px solid var(--border-glass)" }}
        >
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            Complete your first check-in to see your score
          </p>
        </div>
      </div>
    );
  }

  const circumference = Math.PI * GAUGE_CONFIG.radius;
  const strokeDashoffset = scoreToStrokeDashoffset(animatedScore);
  const gaugeColor = getGaugeColor(animatedScore);
  const category = getScoreCategory(animatedScore);

  return (
    <div className="flex flex-col items-center">
      {/*
       * accessible semantic HTML: role="meter" for gauge semantics.
       * ARIA labels: full value description for screen readers.
       */}
      <div
        role="meter"
        aria-label={`Mental Readiness Score: ${score} out of 100 — ${category.label}`}
        aria-valuenow={score}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuetext={`${score} out of 100, ${category.label}`}
        className="relative"
      >
        <svg
          width="220"
          height="130"
          viewBox={GAUGE_CONFIG.viewBox}
          aria-hidden="true"
        >
          {/* Background track */}
          <path
            d="M 20 100 A 80 80 0 0 1 180 100"
            fill="none"
            stroke="rgba(255,255,255,0.08)"
            strokeWidth={GAUGE_CONFIG.strokeWidth}
            strokeLinecap="round"
          />

          {/* Animated progress arc */}
          <motion.path
            d="M 20 100 A 80 80 0 0 1 180 100"
            fill="none"
            stroke={gaugeColor}
            strokeWidth={GAUGE_CONFIG.strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            style={{ filter: `drop-shadow(0 0 6px ${gaugeColor}60)` }}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 1.2, ease: "easeOut" }}
          />

          {/* Score number in center */}
          <text
            x="100"
            y="92"
            textAnchor="middle"
            dominantBaseline="middle"
            fill="white"
            fontSize="36"
            fontWeight="800"
            fontFamily="Inter, sans-serif"
            style={{ letterSpacing: "-2px" }}
          >
            {animatedScore}
          </text>

          {/* "/100" label */}
          <text
            x="100"
            y="108"
            textAnchor="middle"
            fill="rgba(255,255,255,0.4)"
            fontSize="12"
            fontFamily="Inter, sans-serif"
          >
            / 100
          </text>
        </svg>

        {/* Score category badge */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2">
          <span
            className="text-xs font-semibold px-3 py-1 rounded-full"
            style={{
              background: `${gaugeColor}20`,
              color: gaugeColor,
              border: `1px solid ${gaugeColor}40`,
            }}
          >
            {category.label}
          </span>
        </div>
      </div>

      {/* One-line explanation */}
      {explanation && (
        <p
          className="text-center text-sm mt-8 max-w-xs"
          style={{ color: "var(--text-secondary)" }}
        >
          {explanation}
        </p>
      )}

      {/* Mental Readiness label */}
      <p
        className="text-xs font-medium mt-2 tracking-wide uppercase"
        style={{ color: "var(--text-muted)" }}
      >
        Mental Readiness Score
      </p>
    </div>
  );
}
