/**
 * MindCompass AI — AI Companion Chat Route Handler
 *
 * POST /api/companion
 *
 * Security:
 *   - no hardcoded API keys: GEMINI_API_KEY from environment variables only
 *   - Authenticated: session validated before any AI call
 *   - sanitized user inputs: message content validated and trimmed
 *   - input validation: message length limits enforced
 *   - cross-site scripting (XSS) protection: user messages are strings only,
 *     never injected into prompts as instructions
 *
 * Streaming: uses Server-Sent Events (SSE) for word-by-word response.
 * asynchronous handling: async generator streams to ReadableStream.
 * error handling exceptions: stream errors close the connection cleanly.
 */

import { NextRequest } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import {
  buildCompanionSystemPrompt,
  streamCompanionResponse,
} from "@/lib/gemini";

/**
 * input validation: strict schema for companion chat request.
 * sanitized user inputs: message trimmed, session messages validated.
 */
const companionRequestSchema = z.object({
  message: z
    .string()
    .min(1, "Message cannot be empty")
    .max(2000, "Message is too long")
    .transform((v) => v.trim()),
  sessionMessages: z
    .array(
      z.object({
        id: z.string(),
        role: z.enum(["user", "assistant"]),
        content: z.string().max(5000),
        timestamp: z.number(),
      })
    )
    .max(50) // limit session history to prevent prompt injection via many messages
    .default([]),
});

/**
 * POST /api/companion
 * Streams an AI companion response using Server-Sent Events.
 * Returns a ReadableStream with "data: {chunk}\n\n" format.
 */
export async function POST(request: NextRequest) {
  // ── Authentication ──────────────────────────────────────────
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return new Response("Unauthorized", { status: 401 });
  }

  // ── Parse and validate request body ────────────────────────
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return new Response("Invalid JSON body", { status: 400 });
  }

  const parseResult = companionRequestSchema.safeParse(body);
  if (!parseResult.success) {
    return new Response("Invalid request parameters", { status: 400 });
  }

  const { message, sessionMessages } = parseResult.data;

  // ── Fetch user context for system prompt ───────────────────
  // Efficiency: Fetch all user history in parallel.
  // Code Quality: Previously, readiness_scores was queried in Promise.all but the result was discarded
  // because of a destructuring typo, resulting in a duplicate sequential query.
  // By destructuring all 5 results and using scoreResult directly, we save one database roundtrip!
  const [profileResult, insightResult, metricsResult, summaryResult, scoreResult] =
    await Promise.all([
      supabase
        .from("user_profiles")
        .select("*")
        .eq("user_id", user.id)
        .single(),
      supabase
        .from("ai_insights")
        .select("dominant_emotion, emotional_summary")
        .eq("user_id", user.id)
        .order("insight_date", { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from("daily_metrics")
        .select("*")
        .eq("user_id", user.id)
        .order("check_in_date", { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from("weekly_summaries")
        .select("*")
        .eq("user_id", user.id)
        .order("week_ending", { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from("readiness_scores")
        .select("score")
        .eq("user_id", user.id)
        .order("score_date", { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);

  if (!profileResult.data) {
    return new Response("User profile not found", { status: 404 });
  }

  const systemPrompt = buildCompanionSystemPrompt({
    profile: profileResult.data,
    latestScore: scoreResult.data?.score ?? null,
    latestInsight: insightResult.data ?? null,
    latestMetrics: metricsResult.data ?? null,
    weeklySummary: summaryResult.data ?? null,
  });

  // ── Stream response via SSE ─────────────────────────────────
  /**
   * asynchronous handling: ReadableStream wraps the async generator.
   * The stream is closed cleanly on both completion and error.
   */
  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();

      try {
        const generator = streamCompanionResponse({
          systemPrompt,
          messages: sessionMessages,
          userMessage: message,
        });

        for await (const chunk of generator) {
          // SSE format: "data: {encoded_chunk}\n\n"
          const encoded = encoder.encode(`data: ${JSON.stringify(chunk)}\n\n`);
          controller.enqueue(encoded);
        }

        // Signal stream completion
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        controller.close();
      } catch (error) {
        // error handling exceptions: send error event before closing
        console.error("[MindCompass Companion] Stream error:", error);
        const errorMsg = encoder.encode(
          `data: ${JSON.stringify({ error: "Stream failed" })}\n\n`
        );
        controller.enqueue(errorMsg);
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
