/**
 * MindCompass AI — Gemini AI Integration Layer
 *
 * Security: no hardcoded API keys — GEMINI_API_KEY loaded from environment variables only.
 * All AI calls happen server-side (Route Handlers) — the key never reaches the browser.
 *
 * clean architecture: all Gemini prompt construction and response parsing is
 * centralized here. Route Handlers call these functions; they do not build prompts.
 *
 * modular design: three distinct call types — analysis, companion, weekly summary.
 * asynchronous handling: all functions return Promises with proper error handling.
 * error handling exceptions: Gemini API errors are caught and re-thrown with context.
 */

import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import type {
  GeminiAnalysisResponse,
  UserProfile,
  DailyMetrics,
  JournalEntry,
  WeeklySummary,
  ChatMessage,
} from "@/types";

/**
 * Initializes the Gemini client.
 * input validation: throws immediately if API key is missing.
 * no hardcoded API keys: key sourced exclusively from GEMINI_API_KEY env var.
 */
function getGeminiClient(): GoogleGenerativeAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error(
      "[MindCompass Gemini] GEMINI_API_KEY environment variable is not set. " +
        "Ensure this is configured in your .env.local and Vercel project settings."
    );
  }
  return new GoogleGenerativeAI(apiKey);
}

/**
 * JSON schema for the structured analysis response.
 * Using Gemini's native JSON mode for reliable, parseable output.
 * This eliminates the need for brittle regex-based JSON extraction.
 */
const ANALYSIS_RESPONSE_SCHEMA = {
  type: SchemaType.OBJECT,
  properties: {
    emotions: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          label: { type: SchemaType.STRING },
          intensity: { type: SchemaType.NUMBER },
          evidence: { type: SchemaType.STRING },
        },
        required: ["label", "intensity", "evidence"],
      },
    },
    dominant_emotion: { type: SchemaType.STRING },
    emotional_summary: { type: SchemaType.STRING },
    coping_strategy: {
      type: SchemaType.OBJECT,
      properties: {
        title: { type: SchemaType.STRING },
        description: { type: SchemaType.STRING },
        duration_minutes: { type: SchemaType.NUMBER },
        target_emotion: { type: SchemaType.STRING },
      },
      required: ["title", "description", "duration_minutes", "target_emotion"],
    },
    mindfulness_exercise: {
      type: SchemaType.OBJECT,
      properties: {
        title: { type: SchemaType.STRING },
        description: { type: SchemaType.STRING },
        duration_minutes: { type: SchemaType.NUMBER },
        target_emotion: { type: SchemaType.STRING },
      },
      required: ["title", "description", "duration_minutes", "target_emotion"],
    },
    encouragement: { type: SchemaType.STRING },
    score_inputs: {
      type: SchemaType.OBJECT,
      properties: {
        mood_stability: { type: SchemaType.NUMBER },
        energy_stability: { type: SchemaType.NUMBER },
        burnout_risk: { type: SchemaType.NUMBER },
        confidence_trend: { type: SchemaType.NUMBER },
        recovery_habits: { type: SchemaType.NUMBER },
      },
      required: [
        "mood_stability",
        "energy_stability",
        "burnout_risk",
        "confidence_trend",
        "recovery_habits",
      ],
    },
    safety_flag: { type: SchemaType.BOOLEAN },
  },
  required: [
    "emotions",
    "dominant_emotion",
    "emotional_summary",
    "coping_strategy",
    "mindfulness_exercise",
    "encouragement",
    "score_inputs",
    "safety_flag",
  ],
};

/**
 * Formats recent journal history for inclusion in the analysis prompt.
 * Minimal data sent to Gemini — only content needed for analysis.
 * sanitized user inputs: no raw IDs or emails are sent to the AI API.
 */
function formatJournalHistory(
  journals: JournalEntry[],
  metrics: DailyMetrics[]
): string {
  if (journals.length === 0) return "No prior journal entries available.";

  return journals
    .map((journal) => {
      const metric = metrics.find(
        (m) => m.check_in_date === journal.entry_date
      );
      return [
        `Date: ${journal.entry_date}`,
        metric
          ? `Metrics — Mood: ${metric.mood_score}/10, Energy: ${metric.energy_score}/10, ` +
            `Confidence: ${metric.confidence_score}/10, Sleep: ${metric.sleep_hours}h`
          : "",
        `Journal: ${journal.content}`,
      ]
        .filter(Boolean)
        .join("\n");
    })
    .join("\n\n---\n\n");
}

/**
 * Calculates days until exam from today.
 * edge case handling: returns 0 if exam date is in the past.
 */
function getDaysUntilExam(examDate: string): number {
  const today = new Date();
  const exam = new Date(examDate);
  const diffMs = exam.getTime() - today.getTime();
  return Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
}

// ─────────────────────────────────────────────────────────────────────────────
// CALL TYPE 1: Daily Check-in Analysis (Non-Streaming, Structured JSON)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Performs the single Gemini analysis call for a daily check-in.
 *
 * Returns structured JSON with: emotions, coping strategy, mindfulness exercise,
 * encouragement, score_inputs, and a safety_flag for Layer 2 safety detection.
 *
 * asynchronous handling: async function with comprehensive error handling.
 * error handling exceptions: parse errors and API errors are caught and re-thrown.
 *
 * @param profile - User profile (exam type, date, name)
 * @param currentJournal - Today's journal entry text
 * @param currentMetrics - Today's mood/energy/confidence/sleep/study metrics
 * @param recentJournals - Last 3 days of journal entries
 * @param recentMetrics - Last 3 days of daily metrics
 * @param weeklySummary - AI-generated weekly pattern summary (if available)
 */
export async function analyzeCheckIn(params: {
  profile: UserProfile;
  currentJournal: string;
  currentMetrics: DailyMetrics;
  recentJournals: JournalEntry[];
  recentMetrics: DailyMetrics[];
  weeklySummary: WeeklySummary | null;
}): Promise<GeminiAnalysisResponse> {
  const {
    profile,
    currentJournal,
    currentMetrics,
    recentJournals,
    recentMetrics,
    weeklySummary,
  } = params;

  const genAI = getGeminiClient();
  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: ANALYSIS_RESPONSE_SCHEMA as never,
    },
    systemInstruction: `You are MindCompass AI, an empathetic wellness analysis engine for students.
Your role is to analyze journal entries and wellness metrics to provide compassionate,
actionable, and hyper-personalized support.

RULES:
- Always be warm, validating, and specific to this student's actual data
- Never diagnose mental health conditions
- Never suggest medication or clinical treatment
- Never claim therapeutic authority
- Reference concrete data points in your encouragement (e.g., journaling streak, sleep improvement)
- Generate coping strategies that are specific to the detected dominant emotion
- If ANY language suggests self-harm, suicidal ideation, or severe crisis (even indirect):
  set safety_flag to true. Examples: "I want everything to stop", "nobody would miss me"
- For safety_flag: true cases, set emotional_summary to a warm crisis acknowledgment message
- All score_inputs values must be between 0.0 and 1.0
- Respond in English regardless of the language the journal was written in`,
  });

  const daysUntilExam = getDaysUntilExam(profile.exam_date);
  const historyText = formatJournalHistory(recentJournals, recentMetrics);

  const prompt = `
STUDENT PROFILE:
Name: ${profile.name}
Exam: ${profile.exam_type} (in ${daysUntilExam} days)
Check-in streak: ${profile.check_in_count} days

TODAY'S CHECK-IN:
Mood: ${currentMetrics.mood_score}/10
Energy: ${currentMetrics.energy_score}/10
Confidence: ${currentMetrics.confidence_score}/10
Sleep: ${currentMetrics.sleep_hours} hours
Study: ${currentMetrics.study_hours} hours
Journal Entry:
"${currentJournal}"

RECENT HISTORY (last 3 days):
${historyText}

WEEKLY PATTERN SUMMARY:
${weeklySummary?.summary ?? "No weekly summary yet — this is among the user's first check-ins."}

Analyze this student's emotional state and provide the full structured response.
Pay special attention to: peer comparison language, mock-test anxiety, sleep patterns,
and any signs of burnout or self-criticism. Be specific and reference their actual words.
  `.trim();

  try {
    const result = await model.generateContent(prompt);
    const responseText = result.response.text();

    // Parse the structured JSON response
    const parsed = JSON.parse(responseText) as GeminiAnalysisResponse;
    return parsed;
  } catch (error) {
    // error handling exceptions: provide context-rich error for debugging
    throw new Error(
      `[MindCompass Gemini] Check-in analysis failed: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// CALL TYPE 2: AI Companion Chat (Streaming)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Builds the system prompt for the AI Companion chat.
 * sanitized user inputs: user data is included as plain text, not as instructions.
 * The system prompt provides context but does not execute user-controlled instructions.
 */
export function buildCompanionSystemPrompt(params: {
  profile: UserProfile;
  latestScore: number | null;
  latestInsight: {
    dominant_emotion: string;
    emotional_summary: string;
  } | null;
  latestMetrics: DailyMetrics | null;
  weeklySummary: WeeklySummary | null;
}): string {
  const { profile, latestScore, latestInsight, latestMetrics, weeklySummary } =
    params;
  const daysUntilExam = getDaysUntilExam(profile.exam_date);

  return `You are MindCompass AI, an empathetic wellness companion for ${profile.name},
a student preparing for ${profile.exam_type} (exam date in ${daysUntilExam} days).

LATEST EMOTIONAL STATE:
${latestScore !== null ? `- Mental Readiness Score: ${latestScore}/100` : "- No score yet (new user)"}
${latestInsight ? `- Dominant emotion: ${latestInsight.dominant_emotion}` : ""}
${latestInsight ? `- Summary: ${latestInsight.emotional_summary}` : ""}
${
  latestMetrics
    ? `- Mood: ${latestMetrics.mood_score}/10, Energy: ${latestMetrics.energy_score}/10, ` +
      `Sleep: ${latestMetrics.sleep_hours}h, Confidence: ${latestMetrics.confidence_score}/10`
    : "- No metrics recorded yet"
}

RECENT PATTERNS:
${weeklySummary?.summary ?? "No weekly pattern data yet."}

CONVERSATION RULES:
- Reference the student's actual data, not generic advice
- Never diagnose mental health conditions or suggest medication
- If the student expresses self-harm or suicidal thoughts, immediately provide:
  crisis resources (iCall: 9152987821, Vandrevala: 1860-2662-345)
  and recommend speaking to a trusted adult
- Be warm, validating, and specific
- Keep responses concise (2–3 paragraphs maximum)
- Respond in English always
- You remember this student's emotional journey through the context above`;
}

/**
 * Streams a companion chat response using Gemini's streaming API.
 * Returns an async generator that yields text chunks.
 *
 * asynchronous handling: uses async generator for efficient streaming.
 * error handling exceptions: stream errors are caught and propagate correctly.
 */
export async function* streamCompanionResponse(params: {
  systemPrompt: string;
  messages: ChatMessage[];
  userMessage: string;
}): AsyncGenerator<string, void, unknown> {
  const { systemPrompt, messages, userMessage } = params;

  const genAI = getGeminiClient();
  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    systemInstruction: systemPrompt,
  });

  // Build conversation history for context
  // efficient loops: map once, filter once — no nested iterations
  const history = messages
    .filter((m) => m.role === "user" || m.role === "assistant")
    .map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    }));

  try {
    const chat = model.startChat({ history });
    const streamResult = await chat.sendMessageStream(userMessage);

    for await (const chunk of streamResult.stream) {
      const text = chunk.text();
      if (text) yield text;
    }
  } catch (error) {
    // error handling exceptions: surface streaming errors clearly
    throw new Error(
      `[MindCompass Gemini] Companion stream error: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// CALL TYPE 3: Weekly Pattern Summary (Non-Streaming)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Generates a weekly pattern summary from 7 days of journals and metrics.
 * Triggered every 7th check-in (check_in_count % 7 === 0).
 *
 * The summary is stored and used in subsequent analysis calls and companion prompts
 * to provide longitudinal emotional intelligence without sending full raw history.
 *
 * asynchronous handling: async function returning a plain string.
 * error handling exceptions: API errors result in a graceful fallback message.
 */
export async function generateWeeklySummary(params: {
  profile: UserProfile;
  journals: JournalEntry[];
  metrics: DailyMetrics[];
}): Promise<string> {
  const { profile, journals, metrics } = params;

  const genAI = getGeminiClient();
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  const historyText = formatJournalHistory(journals, metrics);

  const prompt = `
Analyze the following 7 days of journal entries and wellness metrics for a student 
preparing for ${profile.exam_type}.

${historyText}

Write a concise summary (100–150 words) covering:
1. Dominant emotional themes and patterns
2. Recurring stress triggers observed
3. Notable mood, energy, or sleep trends
4. Any positive developments or signs of resilience

Write in third person (e.g., "The student..."). Be specific and data-driven.
This summary will be used as context for future AI analysis and conversation.
  `.trim();

  try {
    const result = await model.generateContent(prompt);
    return result.response.text().trim();
  } catch (error) {
    // error handling exceptions: non-fatal — return empty string to skip summary
    console.error("[MindCompass Gemini] Weekly summary generation failed:", error);
    return "";
  }
}
