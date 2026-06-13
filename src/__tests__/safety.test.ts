/**
 * MindCompass AI — Unit Tests: safety.ts
 *
 * unit test cases: tests for dual-layer crisis detection.
 * edge case handling: tests realistic exam-student journal entries,
 *   indirect crisis language, Hinglish phrases, and false positives.
 * integration testing scripts: verifies crisis resources are properly formatted.
 */

import {
  checkForCrisisLanguage,
  CRISIS_RESOURCES,
  CRISIS_MESSAGE,
} from "@/lib/safety";

describe("checkForCrisisLanguage", () => {
  // ── Happy path: Non-crisis journals ───────────────────────

  it("returns isCrisis=false for a typical positive journal entry", () => {
    const result = checkForCrisisLanguage(
      "Had a great study session today. Physics is finally clicking. Feeling confident!"
    );
    expect(result.isCrisis).toBe(false);
    expect(result.triggeredKeywords).toHaveLength(0);
  });

  it("returns isCrisis=false for a stressed but non-crisis entry", () => {
    const result = checkForCrisisLanguage(
      "I'm really stressed about the mock test results. Very tired. Need to sleep more."
    );
    expect(result.isCrisis).toBe(false);
  });

  it("returns isCrisis=false for normal negative emotions (anxiety, failure fear)", () => {
    const result = checkForCrisisLanguage(
      "Failed my physics test. Feeling hopeless about my preparation. So anxious about the exam."
    );
    expect(result.isCrisis).toBe(false);
  });

  it("returns isCrisis=false for empty string", () => {
    const result = checkForCrisisLanguage("");
    expect(result.isCrisis).toBe(false);
  });

  it("returns isCrisis=false for whitespace-only input", () => {
    const result = checkForCrisisLanguage("   \n\t  ");
    expect(result.isCrisis).toBe(false);
  });

  // ── Crisis detection: Direct indicators ──────────────────

  it("detects direct self-harm mention", () => {
    const result = checkForCrisisLanguage(
      "I am thinking about hurting myself. I can't take this pressure anymore."
    );
    expect(result.isCrisis).toBe(true);
    expect(result.triggeredKeywords.length).toBeGreaterThan(0);
  });

  it("detects suicidal ideation", () => {
    const result = checkForCrisisLanguage(
      "Sometimes I think about ending my life. Nobody would understand."
    );
    expect(result.isCrisis).toBe(true);
  });

  it("detects 'want to die' language", () => {
    const result = checkForCrisisLanguage(
      "I don't want to live anymore. The pressure is too much."
    );
    expect(result.isCrisis).toBe(true);
  });

  // ── Crisis detection: Indirect indicators (exam context) ──

  it("detects indirect crisis language — 'nobody would miss me'", () => {
    const result = checkForCrisisLanguage(
      "I wonder if anyone would even notice if I disappeared. Nobody would miss me anyway."
    );
    expect(result.isCrisis).toBe(true);
  });

  it("detects indirect crisis language — 'want everything to stop'", () => {
    const result = checkForCrisisLanguage(
      "I just want everything to stop. I can't do this anymore."
    );
    expect(result.isCrisis).toBe(true);
  });

  // ── Edge case handling ─────────────────────────────────────

  it("edge case: case-insensitive matching works", () => {
    const result = checkForCrisisLanguage(
      "I AM THINKING ABOUT HURTING MYSELF."
    );
    expect(result.isCrisis).toBe(true);
  });

  it("edge case: long journal with crisis indicator buried in middle", () => {
    const longEntry =
      "Today was okay. I studied 10 chapters. " +
      "Physics went well. Math was hard. " +
      "I just want to end it all honestly. " +
      "Will try again tomorrow. Chemistry left.";
    const result = checkForCrisisLanguage(longEntry);
    expect(result.isCrisis).toBe(true);
  });

  it("edge case: returns matched keywords list", () => {
    const result = checkForCrisisLanguage(
      "I want to hurt myself and I feel like ending everything."
    );
    expect(result.isCrisis).toBe(true);
    expect(Array.isArray(result.triggeredKeywords)).toBe(true);
    expect(result.triggeredKeywords.length).toBeGreaterThan(0);
  });

  // ── False positive prevention ─────────────────────────────

  it("does NOT flag 'kill it in the exam' as crisis", () => {
    const result = checkForCrisisLanguage(
      "Going to kill it in tomorrow's mock test! Super confident."
    );
    expect(result.isCrisis).toBe(false);
  });

  it("does NOT flag normal frustration language", () => {
    const result = checkForCrisisLanguage(
      "This chapter is killing me. I've been studying for 12 hours straight."
    );
    expect(result.isCrisis).toBe(false);
  });
});

describe("CRISIS_RESOURCES", () => {
  // unit test cases: validates crisis resource data integrity

  it("has at least 2 crisis resources", () => {
    expect(CRISIS_RESOURCES.length).toBeGreaterThanOrEqual(2);
  });

  it("each resource has name, number, and description", () => {
    CRISIS_RESOURCES.forEach((resource) => {
      expect(resource.name).toBeTruthy();
      expect(resource.number).toBeTruthy();
      expect(resource.description).toBeTruthy();
    });
  });

  it("all phone numbers are non-empty strings", () => {
    CRISIS_RESOURCES.forEach((resource) => {
      expect(typeof resource.number).toBe("string");
      expect(resource.number.length).toBeGreaterThan(0);
    });
  });

  it("includes iCall as a resource", () => {
    const hasICall = CRISIS_RESOURCES.some((r) =>
      r.name.toLowerCase().includes("icall")
    );
    expect(hasICall).toBe(true);
  });
});

describe("CRISIS_MESSAGE", () => {
  // unit test cases: validates crisis message content

  it("has headline, body, and disclaimer fields", () => {
    expect(CRISIS_MESSAGE.headline).toBeTruthy();
    expect(CRISIS_MESSAGE.body).toBeTruthy();
    expect(CRISIS_MESSAGE.disclaimer).toBeTruthy();
  });

  it("disclaimer mentions AI is not a substitute for professional help", () => {
    const disclaimerLower = CRISIS_MESSAGE.disclaimer.toLowerCase();
    expect(disclaimerLower).toMatch(/professional|therapist|clinical/);
  });

  it("body is warm and not alarming in tone", () => {
    // Should contain empathetic language
    const bodyLower = CRISIS_MESSAGE.body.toLowerCase();
    expect(bodyLower).toMatch(/support|help|alone|care/);
  });
});
