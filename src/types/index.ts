/**
 * MindCompass AI — Shared TypeScript Types
 *
 * clean architecture: all domain types are defined once here and
 * imported across the codebase. No ad-hoc inline type definitions.
 * modular design: types are grouped by domain (user, metrics, AI, safety).
 */

// ─────────────────────────────────────────────
// Auth & User Domain
// ─────────────────────────────────────────────

export type ExamType =
  | "JEE"
  | "NEET"
  | "UPSC"
  | "CAT"
  | "GATE"
  | "CUET"
  | "Board Exams";

export interface UserProfile {
  id: string;
  user_id: string;
  name: string;
  exam_type: ExamType;
  exam_date: string; // ISO date string
  stress_level: number; // 1–10
  avg_sleep: number; // hours
  confidence: number; // 1–10
  check_in_count: number;
  created_at: string;
  updated_at: string;
}

// ─────────────────────────────────────────────
// Daily Check-in Domain
// ─────────────────────────────────────────────

/** Raw form values from the daily check-in form. */
export interface CheckInFormValues {
  mood_score: number; // 2 | 4 | 5 | 7 | 9 (mapped from emoji selection)
  energy_score: number; // 1–10
  confidence_score: number; // 1–10
  sleep_hours: number; // 0–16
  study_hours: number; // 0–24
  journal_content: string; // free text, English/Hindi/Hinglish/Gujarati/Gujenglish
}

export interface DailyMetrics {
  id: string;
  user_id: string;
  mood_score: number;
  energy_score: number;
  confidence_score: number;
  sleep_hours: number;
  study_hours: number;
  check_in_date: string; // ISO date
  created_at: string;
}

export interface JournalEntry {
  id: string;
  user_id: string;
  content: string;
  entry_date: string; // ISO date
  created_at: string;
}

// ─────────────────────────────────────────────
// AI Analysis Domain
// ─────────────────────────────────────────────

export interface EmotionLabel {
  label: string; // e.g. "anxiety", "self_doubt", "motivation"
  intensity: number; // 0.0–1.0
  evidence: string; // brief quote or reasoning from the journal
}

export interface CopingStrategy {
  title: string;
  description: string;
  duration_minutes: number;
  target_emotion: string;
}

export interface MindfulnessExercise {
  title: string;
  description: string;
  duration_minutes: number;
  target_emotion: string;
}

/**
 * Score component inputs returned by Gemini.
 * All values are normalized 0.0–1.0.
 * Note: burnout_risk is inverted in the score formula (high risk → lower score).
 */
export interface ScoreInputs {
  mood_stability: number; // 0.0–1.0
  energy_stability: number; // 0.0–1.0
  burnout_risk: number; // 0.0–1.0 (inverted in formula)
  confidence_trend: number; // 0.0–1.0
  recovery_habits: number; // 0.0–1.0
}

/** Structured JSON response from the single Gemini analysis call. */
export interface GeminiAnalysisResponse {
  emotions: EmotionLabel[];
  dominant_emotion: string;
  emotional_summary: string;
  coping_strategy: CopingStrategy;
  mindfulness_exercise: MindfulnessExercise;
  encouragement: string;
  score_inputs: ScoreInputs;
  /**
   * Safety flag: set to true by Gemini if the journal contains
   * any language suggesting self-harm or suicidal ideation —
   * even indirect expressions. Triggers safety intercept UI.
   */
  safety_flag: boolean;
}

export interface AIInsight {
  id: string;
  user_id: string;
  emotions: EmotionLabel[];
  dominant_emotion: string;
  emotional_summary: string;
  coping_strategy: CopingStrategy;
  mindfulness_exercise: MindfulnessExercise;
  encouragement: string;
  score_inputs: ScoreInputs;
  safety_flag: boolean;
  insight_date: string; // ISO date
  created_at: string;
}

// ─────────────────────────────────────────────
// Mental Readiness Score Domain
// ─────────────────────────────────────────────

export interface ReadinessScore {
  id: string;
  user_id: string;
  score: number; // 0–100
  components: ScoreInputs;
  explanation: string;
  score_date: string; // ISO date
  created_at: string;
}

// ─────────────────────────────────────────────
// Weekly Summary Domain
// ─────────────────────────────────────────────

export interface WeeklySummary {
  id: string;
  user_id: string;
  summary: string; // 100–150 word paragraph from Gemini
  week_ending: string; // ISO date
  created_at: string;
}

// ─────────────────────────────────────────────
// Companion Chat Domain
// ─────────────────────────────────────────────

export type ChatRole = "user" | "assistant";

export interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string;
  timestamp: number;
  /** true while the assistant is streaming this message */
  isStreaming?: boolean;
}

// ─────────────────────────────────────────────
// Safety Domain
// ─────────────────────────────────────────────

/** Result of the dual-layer safety check. */
export interface SafetyCheckResult {
  /** true if crisis language was detected by either layer */
  isCrisis: boolean;
  /** which layer caught it: "keyword" (client-side) or "ai" (Gemini) */
  detectedBy?: "keyword" | "ai";
  /** keywords or phrases that triggered the detection */
  triggeredKeywords?: string[];
}

// ─────────────────────────────────────────────
// Tier 2 — Pattern & Trigger Analytics
// ─────────────────────────────────────────────

export type BurnoutRiskLevel = "Low" | "Moderate" | "High";

export interface TriggerInsight {
  trigger: string; // e.g. "Mock Tests"
  frequency: number; // number of occurrences in history
  description: string;
}

export interface PatternInsight {
  pattern: string; // e.g. "Sleep below 6h → stress spike"
  confidence: number; // 0.0–1.0
}

export interface WhatChangedInsight {
  score_change: number; // delta from previous week
  previous_score: number;
  current_score: number;
  explanation: string; // plain-language explanation referencing ≥2 metrics
}

export interface Tier2Analytics {
  triggers: TriggerInsight[];
  patterns: PatternInsight[];
  burnout_risk: BurnoutRiskLevel;
  burnout_top_factor: string;
  what_changed: WhatChangedInsight;
}
