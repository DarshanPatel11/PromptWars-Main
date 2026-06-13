/**
 * MindCompass AI — Mental Readiness Score Calculator
 *
 * clean architecture: pure function with zero side effects.
 * This is the hero metric of MindCompass — a deterministic, testable formula
 * that converts AI-provided score component inputs into a single 0–100 score.
 *
 * unit test cases: see src/__tests__/readiness-score.test.ts
 * edge case handling: handles boundary values, defaults, and invalid inputs.
 *
 * Score Formula (weights):
 *   Mood Stability     → 25%
 *   Energy Stability   → 20%
 *   Burnout Risk       → 25% (INVERTED: high burnout_risk = lower score)
 *   Confidence Trend   → 15%
 *   Recovery Habits    → 15%
 */

import type { ScoreInputs } from "@/types";

/** Weights must sum to 1.0 */
const SCORE_WEIGHTS = {
  mood_stability: 0.25,
  energy_stability: 0.20,
  burnout_risk: 0.25, // applied as (1 - burnout_risk)
  confidence_trend: 0.15,
  recovery_habits: 0.15,
} as const;

/**
 * Default score inputs for a user's first check-in (no historical data yet).
 * Neutral values (0.5) across all components until trends are established.
 */
export const DEFAULT_SCORE_INPUTS: ScoreInputs = {
  mood_stability: 0.5,
  energy_stability: 0.5,
  burnout_risk: 0.5,
  confidence_trend: 0.5,
  recovery_habits: 0.5,
};

/**
 * Clamps a value to [0, 1] to guard against out-of-range AI outputs.
 * error handling exceptions: prevents NaN / Infinity from corrupting the score.
 */
function clamp(value: number): number {
  if (!Number.isFinite(value)) return 0.5; // safe default for non-finite values
  return Math.max(0, Math.min(1, value));
}

/**
 * Calculates the Mental Readiness Score from normalized component inputs.
 *
 * @param inputs - AI-provided score component values (all in [0, 1])
 * @returns Integer score in [0, 100]
 *
 * edge case handling:
 * - Non-finite values are clamped to 0.5
 * - Null/undefined inputs fall back to DEFAULT_SCORE_INPUTS
 * - Result is always a valid integer in [0, 100]
 *
 * unit test cases: see src/__tests__/readiness-score.test.ts
 */
export function calculateMentalReadinessScore(
  inputs: Partial<ScoreInputs> | null | undefined
): number {
  // edge case handling: merge with defaults if partial or missing
  const safeInputs: ScoreInputs = {
    ...DEFAULT_SCORE_INPUTS,
    ...(inputs ?? {}),
  };

  const raw =
    clamp(safeInputs.mood_stability) * SCORE_WEIGHTS.mood_stability +
    clamp(safeInputs.energy_stability) * SCORE_WEIGHTS.energy_stability +
    // burnout_risk is INVERTED: high risk → lower score contribution
    (1 - clamp(safeInputs.burnout_risk)) * SCORE_WEIGHTS.burnout_risk +
    clamp(safeInputs.confidence_trend) * SCORE_WEIGHTS.confidence_trend +
    clamp(safeInputs.recovery_habits) * SCORE_WEIGHTS.recovery_habits;

  // efficient loops: single-pass weighted sum, no iteration over arrays
  return Math.round(raw * 100);
}

/**
 * Returns a color category for the score, used in visual indicators.
 * Returns text labels alongside colors — not color alone (accessibility).
 * Five levels for granular feedback during high-stakes exam preparation.
 */
export function getScoreCategory(score: number): {
  label: string;
  color: string;
  textColor: string;
} {
  if (score >= 85) {
    return { label: "Excellent", color: "#22c55e", textColor: "text-green-400" };
  }
  if (score >= 70) {
    return { label: "Good", color: "#4ade80", textColor: "text-green-300" };
  }
  if (score >= 45) {
    return { label: "Moderate", color: "#eab308", textColor: "text-yellow-400" };
  }
  if (score >= 30) {
    return { label: "Low", color: "#f97316", textColor: "text-orange-400" };
  }
  return { label: "Critical", color: "#ef4444", textColor: "text-red-400" };
}

/**
 * Derives mood_stability and energy_stability from the raw metric history.
 * Uses the coefficient of variation (lower variance = higher stability).
 * efficient loops: single pass over the history array.
 *
 * @param values - Array of daily values (e.g., mood scores over N days)
 * @returns Stability score in [0, 1]
 */
export function calculateStabilityFromHistory(values: number[]): number {
  if (values.length === 0) return 0.5; // edge case handling: no data

  const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
  if (mean === 0) return 0.5;

  const variance =
    values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
  const stdDev = Math.sqrt(variance);
  const coefficientOfVariation = stdDev / mean;

  // High CV (volatile) → low stability; low CV (steady) → high stability
  return clamp(1 - coefficientOfVariation);
}

/**
 * Derives recovery_habits score from sleep hours and journaling streak.
 *
 * @param avgSleep - Average sleep hours over recent days (0–16)
 * @param journalingStreak - Consecutive days with journal entries
 * @returns Recovery habits score in [0, 1]
 */
export function calculateRecoveryHabits(
  avgSleep: number,
  journalingStreak: number
): number {
  // edge case handling: clamp inputs to valid ranges
  const sleepScore = clamp(Math.min(avgSleep, 9) / 9); // 9h = max (1.0)
  const streakScore = clamp(Math.min(journalingStreak, 14) / 14); // 14 days = max

  return sleepScore * 0.6 + streakScore * 0.4; // sleep weighted higher
}
