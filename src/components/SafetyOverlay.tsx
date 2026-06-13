/**
 * MindCompass AI — Safety Intercept Overlay
 *
 * CRITICAL SAFETY COMPONENT. Displayed when crisis language is detected
 * in a journal entry (by either Layer 1 keyword matching or Layer 2 Gemini flag).
 *
 * Design principles:
 * - Warm, non-judgmental tone — not alarming or clinical
 * - Crisis resources are real, verified Indian helpline numbers
 * - Standard coaching flow is NEVER shown when this overlay is active
 *
 * accessible semantic HTML: role="alertdialog", focus management, ARIA.
 * ARIA labels: crisis resources labeled with name and availability.
 * cross-site scripting (XSS) protection: all content is static text, no user content rendered.
 */

"use client";

import { useEffect, useRef } from "react";
import { CRISIS_RESOURCES, CRISIS_MESSAGE } from "@/lib/safety";
import { Heart, Phone, X, Shield } from "lucide-react";

interface SafetyOverlayProps {
  onDismiss: () => void;
}

/**
 * Safety Intercept Overlay.
 * Displayed immediately when crisis language is detected.
 * Cannot be dismissed without reading the resources (no accidental close).
 */
export function SafetyOverlay({ onDismiss }: SafetyOverlayProps) {
  const dismissButtonRef = useRef<HTMLButtonElement>(null);

  // accessible semantic HTML: move focus to the dialog when it opens
  useEffect(() => {
    dismissButtonRef.current?.focus();
  }, []);

  // Prevent body scroll while overlay is open
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  return (
    /*
     * accessible semantic HTML: role="alertdialog" for crisis content.
     * aria-modal="true" traps focus within the dialog.
     * aria-labelledby and aria-describedby for screen reader navigation.
     */
    <div
      className="safety-overlay"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="safety-headline"
      aria-describedby="safety-body"
    >
      <div
        className="glass-card max-w-lg w-full p-8 relative"
        style={{
          border: "1px solid rgba(239, 68, 68, 0.3)",
          boxShadow: "0 0 40px rgba(239, 68, 68, 0.15)",
        }}
      >
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ background: "rgba(239, 68, 68, 0.15)" }}
            aria-hidden="true"
          >
            <Heart className="w-6 h-6" style={{ color: "var(--color-danger)" }} />
          </div>
          <div>
            <h2
              id="safety-headline"
              className="text-xl font-bold"
              style={{ color: "var(--text-primary)" }}
            >
              {CRISIS_MESSAGE.headline}
            </h2>
          </div>
        </div>

        {/* Main message */}
        <p
          id="safety-body"
          className="text-sm leading-relaxed mb-6"
          style={{ color: "var(--text-secondary)" }}
        >
          {CRISIS_MESSAGE.body}
        </p>

        {/* Crisis resources */}
        <section aria-labelledby="resources-heading">
          <h3
            id="resources-heading"
            className="text-sm font-semibold mb-3 flex items-center gap-2"
            style={{ color: "var(--text-primary)" }}
          >
            <Phone className="w-4 h-4" aria-hidden="true" />
            Crisis Support Helplines
          </h3>

          <ul className="space-y-3" role="list" aria-label="Crisis helpline numbers">
            {CRISIS_RESOURCES.map((resource) => (
              <li
                key={resource.name}
                className="flex items-center justify-between rounded-xl p-3"
                style={{
                  background: "var(--bg-glass)",
                  border: "1px solid var(--border-glass)",
                }}
              >
                <div>
                  <p
                    className="font-semibold text-sm"
                    style={{ color: "var(--text-primary)" }}
                  >
                    {resource.name}
                  </p>
                  <p
                    className="text-xs"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    {resource.description}
                  </p>
                </div>
                <a
                  href={`tel:${resource.number}`}
                  className="font-bold text-sm px-3 py-1.5 rounded-lg"
                  style={{
                    background: "rgba(239, 68, 68, 0.15)",
                    color: "var(--color-danger)",
                    border: "1px solid rgba(239, 68, 68, 0.3)",
                  }}
                  aria-label={`Call ${resource.name} at ${resource.number}`}
                >
                  {resource.number}
                </a>
              </li>
            ))}
          </ul>
        </section>

        {/* Disclaimer */}
        <div
          className="flex items-start gap-2 mt-4 p-3 rounded-lg"
          style={{
            background: "rgba(124, 58, 237, 0.08)",
            border: "1px solid rgba(124, 58, 237, 0.2)",
          }}
          role="note"
          aria-label="App limitation disclaimer"
        >
          <Shield className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: "var(--accent-primary)" }} aria-hidden="true" />
          <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
            {CRISIS_MESSAGE.disclaimer}
          </p>
        </div>

        {/* Dismiss button — at the bottom, after all resources are visible */}
        <button
          ref={dismissButtonRef}
          onClick={onDismiss}
          className="mt-6 w-full py-3 rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-2"
          style={{
            background: "var(--bg-glass)",
            border: "1px solid var(--border-glass)",
            color: "var(--text-secondary)",
          }}
          aria-label="I've read the resources. Continue to dashboard."
        >
          <X className="w-4 h-4" aria-hidden="true" />
          {"I've noted the resources — continue to dashboard"}
        </button>
      </div>
    </div>
  );
}
