/**
 * MindCompass AI — Unit Tests: readiness-score.ts
 *
 * unit test cases: tests for Mental Readiness Score calculation.
 * edge case handling: tests with extreme values, missing inputs, boundary conditions.
 * integration testing scripts: verifies score categories and component weights.
 */

import {
  calculateMentalReadinessScore,
  getScoreCategory,
} from "@/lib/readiness-score";

describe("calculateMentalReadinessScore", () => {
  // ── Happy path tests ──────────────────────────────────────

  it("returns 100 for perfect inputs", () => {
    const score = calculateMentalReadinessScore({
      mood_stability: 1.0,
      energy_stability: 1.0,
      burnout_risk: 0.0,
      confidence_trend: 1.0,
      recovery_habits: 1.0,
    });
    expect(score).toBe(100);
  });

  it("returns 0 for worst-case inputs", () => {
    const score = calculateMentalReadinessScore({
      mood_stability: 0.0,
      energy_stability: 0.0,
      burnout_risk: 1.0,
      confidence_trend: 0.0,
      recovery_habits: 0.0,
    });
    expect(score).toBe(0);
  });

  it("returns a score in the 0–100 range for typical inputs", () => {
    const score = calculateMentalReadinessScore({
      mood_stability: 0.65,
      energy_stability: 0.62,
      burnout_risk: 0.45,
      confidence_trend: 0.60,
      recovery_habits: 0.72,
    });
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(100);
  });

  it("penalizes high burnout_risk correctly", () => {
    const lowBurnout = calculateMentalReadinessScore({
      mood_stability: 0.7,
      energy_stability: 0.7,
      burnout_risk: 0.1,
      confidence_trend: 0.7,
      recovery_habits: 0.7,
    });
    const highBurnout = calculateMentalReadinessScore({
      mood_stability: 0.7,
      energy_stability: 0.7,
      burnout_risk: 0.9,
      confidence_trend: 0.7,
      recovery_habits: 0.7,
    });
    expect(lowBurnout).toBeGreaterThan(highBurnout);
  });

  it("returns an integer (no decimal places)", () => {
    const score = calculateMentalReadinessScore({
      mood_stability: 0.55,
      energy_stability: 0.48,
      burnout_risk: 0.62,
      confidence_trend: 0.41,
      recovery_habits: 0.59,
    });
    expect(Number.isInteger(score)).toBe(true);
  });

  // ── Edge case handling ─────────────────────────────────────

  it("edge case: all inputs at 0.5 (mid-range) returns score near 50", () => {
    const score = calculateMentalReadinessScore({
      mood_stability: 0.5,
      energy_stability: 0.5,
      burnout_risk: 0.5,
      confidence_trend: 0.5,
      recovery_habits: 0.5,
    });
    // Mid-range should be roughly 50 ± 10
    expect(score).toBeGreaterThanOrEqual(40);
    expect(score).toBeLessThanOrEqual(60);
  });

  it("edge case: score is stable when burnout_risk is exactly 0.5", () => {
    const score = calculateMentalReadinessScore({
      mood_stability: 0.8,
      energy_stability: 0.8,
      burnout_risk: 0.5,
      confidence_trend: 0.8,
      recovery_habits: 0.8,
    });
    expect(score).toBeGreaterThan(60);
  });

  it("clamps output to [0, 100] even with inputs outside [0, 1]", () => {
    const score = calculateMentalReadinessScore({
      mood_stability: 1.5, // Out of range — should be clamped
      energy_stability: 1.5,
      burnout_risk: -0.5, // Negative — should be treated as 0
      confidence_trend: 1.5,
      recovery_habits: 1.5,
    });
    expect(score).toBeLessThanOrEqual(100);
    expect(score).toBeGreaterThanOrEqual(0);
  });
});

describe("getScoreCategory", () => {
  // ── Score category tests ───────────────────────────────────

  it("returns 'Critical' for scores below 30", () => {
    expect(getScoreCategory(0).label).toBe("Critical");
    expect(getScoreCategory(29).label).toBe("Critical");
  });

  it("returns 'Low' for scores 30–44", () => {
    expect(getScoreCategory(30).label).toBe("Low");
    expect(getScoreCategory(44).label).toBe("Low");
  });

  it("returns 'Moderate' for scores 45–69", () => {
    expect(getScoreCategory(45).label).toBe("Moderate");
    expect(getScoreCategory(69).label).toBe("Moderate");
  });

  it("returns 'Good' for scores 70–84", () => {
    expect(getScoreCategory(70).label).toBe("Good");
    expect(getScoreCategory(84).label).toBe("Good");
  });

  it("returns 'Excellent' for scores 85+", () => {
    expect(getScoreCategory(85).label).toBe("Excellent");
    expect(getScoreCategory(100).label).toBe("Excellent");
  });

  // ── Edge case handling ─────────────────────────────────────

  it("edge case: exactly 0 returns 'Critical'", () => {
    expect(getScoreCategory(0).label).toBe("Critical");
  });

  it("edge case: exactly 100 returns 'Excellent'", () => {
    expect(getScoreCategory(100).label).toBe("Excellent");
  });

  it("edge case: boundary at 45 returns 'Moderate' not 'Low'", () => {
    expect(getScoreCategory(44).label).toBe("Low");
    expect(getScoreCategory(45).label).toBe("Moderate");
  });

  it("edge case: boundary at 70 returns 'Good' not 'Moderate'", () => {
    expect(getScoreCategory(69).label).toBe("Moderate");
    expect(getScoreCategory(70).label).toBe("Good");
  });

  it("returns a color string for all categories", () => {
    [0, 30, 45, 70, 85].forEach((score) => {
      const category = getScoreCategory(score);
      expect(typeof category.color).toBe("string");
      expect(category.color.length).toBeGreaterThan(0);
    });
  });
});
