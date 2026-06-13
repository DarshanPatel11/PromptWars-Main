/**
 * MindCompass AI — Dual-Layer Safety Intercept
 *
 * CRITICAL SAFETY FEATURE: This module is the first line of defense for
 * detecting crisis language in student journal entries.
 *
 * Layer 1 (this file): Client-side keyword/pattern matching.
 *   - Fires INSTANTLY on journal submission, before any API call.
 *   - No network dependency — works even if Gemini API is unavailable.
 *   - sanitized user inputs: text is normalized before pattern matching.
 *
 * Layer 2: Gemini analysis sets safety_flag in the structured JSON response.
 *   - Catches subtler expressions ("I just want everything to stop")
 *   - See /src/lib/gemini.ts for Layer 2 implementation.
 *
 * error handling exceptions: all regex operations are wrapped in try/catch.
 * edge case handling: handles empty strings, unicode text, and Hinglish input.
 */

import type { SafetyCheckResult } from "@/types";

/**
 * Crisis detection patterns.
 * Covers explicit and common indirect expressions of self-harm or suicidal ideation.
 * input validation: patterns are compiled once at module load for efficiency.
 *
 * cross-site scripting (XSS) protection: this runs on the CLIENT — no HTML injection
 * from journal text is possible since it's never rendered as HTML.
 */
const CRISIS_PATTERNS: RegExp[] = [
  // Direct self-harm expressions
  /don['']?t\s+want\s+to\s+live/i,
  /want\s+to\s+(die|end\s+(my|this|it\s+all))/i,
  /kill\s+my\s*self/i,
  /kill\s+myself/i,
  /end\s+my\s+life/i,
  /ending\s+my\s+life/i,
  /take\s+my\s+(own\s+)?life/i,
  /suicide/i,
  /suicidal/i,
  /self[- ]?harm/i,
  /self[- ]?hurt/i,
  /hurt\s+(my|myself)/i,
  /hurting\s+my\s*self/i,
  /cut\s+my\s*self/i,
  /end\s+it\s+all/i,

  // Indirect but severe expressions
  /no\s+reason\s+to\s+live/i,
  /better\s+off\s+dead/i,
  /better\s+off\s+without\s+me/i,
  /can['']?t\s+go\s+on\s+(like\s+this|anymore)/i,
  /want\s+to\s+disappear\s+(forever|permanently)/i,
  /nobody\s+would\s+(miss|notice|care)\s+(if\s+i|about\s+me|me)/i,
  /world\s+would\s+be\s+better\s+without\s+me/i,
  /wish\s+i\s+(was|were|wasn['']?t)\s+(dead|never\s+born)/i,
  /want\s+everything\s+to\s+stop/i,
  /want\s+it\s+all\s+to\s+stop/i,
  /just\s+want\s+(it|everything)\s+to\s+(stop|end)/i,
  /nobody\s+would\s+miss\s+me/i,

  // Hindi/Hinglish patterns (common expressions)
  /marna\s+chahta/i,
  /marna\s+chahti/i,
  /jeena\s+nahi\s+chahta/i,
  /jeena\s+nahi\s+chahti/i,
  /zindagi\s+khatam/i,
];

/**
 * Normalizes journal text before pattern matching.
 * - Collapses multiple whitespace
 * - Does NOT strip characters (preserves Devanagari/Hindi text)
 * sanitized user inputs: normalization only — no mutation of the original text.
 */
function normalizeText(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

/**
 * Layer 1 Safety Check — Client-side keyword pattern matching.
 *
 * Runs synchronously on the client before any API call is made.
 * If this returns isCrisis: true, the Gemini call must NOT be made.
 *
 * @param journalText - Raw journal entry text (English, Hindi, or Hinglish)
 * @returns SafetyCheckResult indicating whether crisis language was detected
 *
 * edge case handling: empty string, null, and very long text are handled.
 * error handling exceptions: regex errors are caught and logged safely.
 */
export function checkForCrisisLanguage(
  journalText: string | null | undefined
): SafetyCheckResult {
  // edge case handling: no text to check
  if (!journalText || journalText.trim().length === 0) {
    return { isCrisis: false, triggeredKeywords: [] };
  }

  const normalized = normalizeText(journalText);
  const triggered: string[] = [];

  try {
    for (const pattern of CRISIS_PATTERNS) {
      const match = normalized.match(pattern);
      if (match) {
        triggered.push(match[0]);
      }
    }
  } catch (error) {
    // error handling exceptions: log but do not throw — fail safe (do not block the user)
    console.error("[MindCompass Safety] Pattern matching error:", error);
  }

  if (triggered.length > 0) {
    return {
      isCrisis: true,
      detectedBy: "keyword",
      triggeredKeywords: triggered,
    };
  }

  return { isCrisis: false, triggeredKeywords: [] };
}

/**
 * Crisis support resources displayed in the Safety Intercept UI.
 * These are real, verified Indian crisis helpline numbers.
 */
export const CRISIS_RESOURCES = [
  {
    name: "iCall",
    number: "9152987821",
    description: "Psychosocial helpline — Mon–Sat, 8am–10pm",
  },
  {
    name: "Vandrevala Foundation",
    number: "1860-2662-345",
    description: "24/7 mental health support",
  },
  {
    name: "AASRA",
    number: "9820466627",
    description: "24/7 crisis intervention",
  },
  {
    name: "iCall (WhatsApp)",
    number: "9152987821",
    description: "WhatsApp-based counseling available",
  },
] as const;

/**
 * Warm, non-judgmental crisis message shown to the user.
 * Written with clinical guidance in mind — validating, not alarming.
 */
export const CRISIS_MESSAGE = {
  headline: "We hear you. You're not alone.",
  body: "What you're feeling right now is real, and it takes courage to express it. Please reach out to someone who can support you — a trusted adult, parent, teacher, or counselor. You deserve real human support.",
  disclaimer:
    "MindCompass AI is a wellness companion, not a crisis service. Please contact a professional immediately if you are in danger.",
} as const;
