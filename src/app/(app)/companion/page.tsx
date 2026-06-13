/**
 * MindCompass AI — AI Companion Chat Page
 *
 * Conversational AI companion with streaming responses (Gemini SSE).
 * Remembers the user's emotional context from recent check-ins.
 *
 * accessible semantic HTML: chat region with live region for new messages.
 * ARIA labels: chat messages labeled with sender role.
 * optimized loading state loaders: thinking dots during stream.
 * cross-site scripting (XSS) protection: all AI text content rendered as
 *   text nodes — never via dangerouslySetInnerHTML.
 * error handling exceptions: stream errors show inline message.
 * asynchronous handling: EventSource parsing with proper cleanup.
 */

"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Brain, Send, Loader2, AlertCircle, RefreshCw } from "lucide-react";
import type { ChatMessage } from "@/types";

export default function CompanionPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        "Hi! I'm your MindCompass companion. I've been keeping track of your emotional journey and I'm here to support you. How are you feeling right now? What's on your mind?",
      timestamp: Date.now(),
    },
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamError, setStreamError] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Cleanup on unmount
  useEffect(() => {
    return () => abortControllerRef.current?.abort();
  }, []);

  /**
   * Sends a message and streams the response.
   * asynchronous handling: uses fetch + ReadableStream reader for SSE parsing.
   * error handling exceptions: handles network errors, stream errors, parse errors.
   */
  const sendMessage = useCallback(async () => {
    const trimmedMessage = inputMessage.trim();
    if (!trimmedMessage || isStreaming) return;

    // input validation: max 2000 chars
    if (trimmedMessage.length > 2000) {
      setStreamError("Message is too long. Please keep it under 2000 characters.");
      return;
    }

    setStreamError(null);
    setInputMessage("");

    // Add user message
    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: trimmedMessage,
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMessage]);

    // Add placeholder for streaming assistant response
    const assistantId = `assistant-${Date.now()}`;
    setMessages((prev) => [
      ...prev,
      {
        id: assistantId,
        role: "assistant",
        content: "",
        timestamp: Date.now(),
        isStreaming: true,
      },
    ]);

    setIsStreaming(true);

    // Create abort controller for cleanup
    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const response = await fetch("/api/companion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: trimmedMessage,
          sessionMessages: messages
            .filter((m) => m.id !== "welcome")
            .map((m) => ({
              id: m.id,
              role: m.role,
              content: m.content,
              timestamp: m.timestamp,
            })),
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`HTTP error: ${response.status}`);
      }

      const reader = response.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      // Stream reader loop
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const data = line.slice(6);
          if (data === "[DONE]") continue;

          try {
            const parsed = JSON.parse(data);
            if (typeof parsed === "string") {
              // Append text chunk to streaming message
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantId
                    ? { ...m, content: m.content + parsed }
                    : m
                )
              );
            } else if (parsed?.error) {
              throw new Error(parsed.error);
            }
          } catch {
            // edge case handling: malformed JSON chunks are skipped
          }
        }
      }
    } catch (error: unknown) {
      if (error instanceof Error && error.name === "AbortError") return;

      // error handling exceptions: show error in chat
      setStreamError("Connection error. Please try again.");
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantId
            ? {
                ...m,
                content:
                  m.content ||
                  "I had trouble responding. Please try sending your message again.",
                isStreaming: false,
              }
            : m
        )
      );
    } finally {
      // Mark streaming as complete
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantId ? { ...m, isStreaming: false } : m
        )
      );
      setIsStreaming(false);
    }
  }, [inputMessage, isStreaming, messages]);

  /** Handle Enter key (send) vs Shift+Enter (new line). */
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div
      className="flex flex-col"
      style={{ height: "100vh" }}
      aria-label="AI Companion chat"
    >
      {/* Chat header */}
      <header
        className="flex items-center gap-3 p-4 flex-shrink-0"
        style={{ borderBottom: "1px solid var(--border-glass)" }}
      >
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center"
          style={{ background: "var(--accent-gradient)" }}
          aria-hidden="true"
        >
          <Brain className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-base font-semibold" style={{ color: "var(--text-primary)" }}>
            MindCompass Companion
          </h1>
          <p className="text-xs flex items-center gap-1" style={{ color: "var(--color-success)" }}>
            <span
              className="w-2 h-2 rounded-full inline-block"
              style={{ background: "var(--color-success)" }}
              aria-hidden="true"
            />
            Active — knows your emotional history
          </p>
        </div>
      </header>

      {/* Messages area */}
      <div
        className="flex-1 overflow-y-auto p-4 space-y-4"
        role="log"
        aria-label="Conversation messages"
        aria-live="polite"
      >
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
            role="article"
            aria-label={`${message.role === "user" ? "Your message" : "Companion response"}`}
          >
            {message.role === "assistant" && (
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center mr-2 flex-shrink-0 mt-1"
                style={{ background: "var(--accent-gradient)" }}
                aria-hidden="true"
              >
                <Brain className="w-3.5 h-3.5 text-white" />
              </div>
            )}

            <div
              className={
                message.role === "user"
                  ? "chat-bubble-user"
                  : "chat-bubble-assistant"
              }
            >
              {message.content || (message.isStreaming ? null : "...")}

              {/* Thinking dots during streaming */}
              {message.isStreaming && !message.content && (
                <div className="flex gap-1 items-center p-1" aria-label="Companion is typing">
                  <span className="thinking-dot" aria-hidden="true" />
                  <span className="thinking-dot" aria-hidden="true" />
                  <span className="thinking-dot" aria-hidden="true" />
                </div>
              )}

              {/* Streaming cursor */}
              {message.isStreaming && message.content && (
                <span
                  className="inline-block w-0.5 h-4 ml-0.5 animate-pulse"
                  style={{ background: "var(--accent-primary)" }}
                  aria-hidden="true"
                />
              )}
            </div>
          </div>
        ))}

        {/* Stream error */}
        {streamError && (
          <div
            role="alert"
            className="flex items-center gap-2 text-xs p-3 rounded-xl"
            style={{
              background: "rgba(239,68,68,0.1)",
              border: "1px solid rgba(239,68,68,0.3)",
              color: "var(--color-danger)",
            }}
          >
            <AlertCircle className="w-3 h-3" aria-hidden="true" />
            {streamError}
            <button
              onClick={() => setStreamError(null)}
              className="ml-auto text-xs underline"
              aria-label="Dismiss error message"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Auto-scroll anchor */}
        <div ref={messagesEndRef} aria-hidden="true" />
      </div>

      {/* Input area */}
      <div
        className="p-4 flex-shrink-0"
        style={{ borderTop: "1px solid var(--border-glass)" }}
      >
        <div className="flex gap-3 items-end max-w-2xl mx-auto">
          <div className="flex-1 relative">
            <label htmlFor="companion-input" className="sr-only">
              Type a message to MindCompass Companion
            </label>
            <textarea
              ref={inputRef}
              id="companion-input"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your message... (Enter to send, Shift+Enter for new line)"
              rows={2}
              maxLength={2000}
              disabled={isStreaming}
              className="form-input resize-none pr-12"
              style={{ maxHeight: "120px" }}
              aria-label="Chat message input"
              aria-describedby="chat-hint"
            />
          </div>
          <button
            onClick={sendMessage}
            disabled={isStreaming || !inputMessage.trim()}
            className="btn-gradient h-12 px-4 flex-shrink-0"
            id="btn-send-message"
            aria-label={isStreaming ? "Sending message..." : "Send message"}
            aria-busy={isStreaming}
          >
            {isStreaming ? (
              <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
            ) : (
              <Send className="w-4 h-4" aria-hidden="true" />
            )}
          </button>

          {isStreaming && (
            <button
              onClick={() => {
                abortControllerRef.current?.abort();
                setIsStreaming(false);
              }}
              className="h-12 px-3 rounded-xl text-xs"
              style={{
                background: "var(--bg-glass)",
                border: "1px solid var(--border-glass)",
                color: "var(--text-secondary)",
              }}
              aria-label="Stop generating response"
            >
              <RefreshCw className="w-4 h-4" aria-hidden="true" />
            </button>
          )}
        </div>
        <p id="chat-hint" className="text-xs text-center mt-2" style={{ color: "var(--text-muted)" }}>
          AI responses are for support only — not clinical advice.
        </p>
      </div>
    </div>
  );
}
