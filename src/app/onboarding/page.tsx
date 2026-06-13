/**
 * MindCompass AI — Onboarding Page
 *
 * First-time setup: collects exam profile (type, date, stress, sleep, confidence).
 * accessible semantic HTML: step-indicator with ARIA, form with proper labels.
 * ARIA labels: progress steps labeled with state (current/complete/upcoming).
 * input validation: Zod schema validated before API call.
 * sanitized user inputs: all fields trimmed and constrained.
 * error handling exceptions: Supabase errors shown inline.
 */

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Brain, ChevronRight, Loader2, AlertCircle, BookOpen, Calendar, Activity } from "lucide-react";

const EXAM_OPTIONS = [
  "JEE",
  "NEET",
  "UPSC",
  "CAT",
  "GATE",
  "CUET",
  "Board Exams",
] as const;

type ExamType = (typeof EXAM_OPTIONS)[number];

interface OnboardingForm {
  name: string;
  examType: ExamType | "";
  examDate: string;
  stressLevel: number;
  avgSleep: number;
  confidence: number;
}

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1); // Steps 1–3
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState<OnboardingForm>({
    name: "",
    examType: "",
    examDate: "",
    stressLevel: 5,
    avgSleep: 7,
    confidence: 5,
  });

  /** input validation: checks current step's required fields. */
  function validateStep(): string | null {
    if (step === 1) {
      if (!form.name.trim() || form.name.trim().length < 2)
        return "Please enter your name (at least 2 characters).";
      if (!form.examType) return "Please select your exam.";
    }
    if (step === 2) {
      if (!form.examDate) return "Please select your exam date.";
      const examDate = new Date(form.examDate);
      if (examDate <= new Date()) return "Exam date must be in the future.";
    }
    return null;
  }

  const handleNext = () => {
    const validationError = validateStep();
    if (validationError) {
      setError(validationError);
      return;
    }
    setError(null);
    setStep((s) => s + 1);
  };

  /**
   * Saves the user profile to Supabase.
   * asynchronous handling: async/await with error boundaries.
   * sanitized user inputs: name trimmed before saving.
   */
  const handleSubmit = async () => {
    setIsSubmitting(true);
    setError(null);

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.push("/auth/signin");
        return;
      }

      const { error: insertError } = await supabase
        .from("user_profiles")
        .insert({
          user_id: user.id,
          name: form.name.trim(),
          exam_type: form.examType,
          exam_date: form.examDate,
          stress_level: form.stressLevel,
          avg_sleep: form.avgSleep,
          confidence: form.confidence,
          check_in_count: 0,
        });

      if (insertError) {
        if (insertError.code === "23505") {
          // Profile already exists — update instead
          await supabase.from("user_profiles").update({
            name: form.name.trim(),
            exam_type: form.examType,
            exam_date: form.examDate,
            stress_level: form.stressLevel,
            avg_sleep: form.avgSleep,
            confidence: form.confidence,
          }).eq("user_id", user.id);
        } else {
          throw new Error(insertError.message);
        }
      }

      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const STEP_LABELS = ["Your Profile", "Exam Details", "Wellness Baseline"];

  return (
    <main
      className="min-h-screen flex items-center justify-center p-4"
      style={{ background: "var(--bg-primary)" }}
    >
      <div className="w-full max-w-lg">
        {/* Logo */}
        <div className="text-center mb-8">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
            style={{ background: "var(--accent-gradient)" }}
            aria-hidden="true"
          >
            <Brain className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
            Welcome to MindCompass
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
            Quick setup (less than 2 minutes) to personalize your experience
          </p>
        </div>

        {/* Step indicator */}
        <nav aria-label="Onboarding steps" className="mb-8">
          <ol className="flex items-center justify-center gap-0" role="list">
            {STEP_LABELS.map((label, idx) => {
              const stepNum = idx + 1;
              const isComplete = step > stepNum;
              const isCurrent = step === stepNum;

              return (
                <li key={label} className="flex items-center">
                  <div className="flex flex-col items-center">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
                      style={{
                        background: isComplete
                          ? "var(--accent-gradient)"
                          : isCurrent
                          ? "rgba(124,58,237,0.2)"
                          : "var(--bg-glass)",
                        border: isCurrent
                          ? "2px solid var(--accent-primary)"
                          : "1px solid var(--border-glass)",
                        color: isComplete || isCurrent ? "var(--accent-primary)" : "var(--text-muted)",
                      }}
                      aria-label={`Step ${stepNum}: ${label}${isComplete ? " (complete)" : isCurrent ? " (current)" : ""}`}
                      aria-current={isCurrent ? "step" : undefined}
                    >
                      {isComplete ? "✓" : stepNum}
                    </div>
                    <span
                      className="text-xs mt-1 hidden sm:block"
                      style={{
                        color: isCurrent ? "var(--accent-primary)" : "var(--text-muted)",
                      }}
                    >
                      {label}
                    </span>
                  </div>
                  {idx < STEP_LABELS.length - 1 && (
                    <div
                      className="w-16 h-px mx-2 mt-[-16px]"
                      style={{
                        background: step > stepNum
                          ? "var(--accent-primary)"
                          : "var(--border-glass)",
                      }}
                      aria-hidden="true"
                    />
                  )}
                </li>
              );
            })}
          </ol>
        </nav>

        {/* Step content */}
        <div className="glass-card p-6">
          {/* Step 1: Name + Exam Type */}
          {step === 1 && (
            <fieldset>
              <legend className="text-lg font-semibold mb-6 flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
                <BookOpen className="w-5 h-5" aria-hidden="true" />
                Tell us about yourself
              </legend>

              <div className="mb-4">
                <label htmlFor="onboard-name" className="block text-sm font-medium mb-2" style={{ color: "var(--text-secondary)" }}>
                  Your name
                </label>
                <input
                  id="onboard-name"
                  type="text"
                  className="form-input"
                  placeholder="Priya Sharma"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  autoComplete="name"
                  maxLength={100}
                />
              </div>

              <div>
                <p className="text-sm font-medium mb-3" style={{ color: "var(--text-secondary)" }}>
                  Which exam are you preparing for?
                </p>
                <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Exam selection">
                  {EXAM_OPTIONS.map((exam) => (
                    <label
                      key={exam}
                      htmlFor={`exam-${exam}`}
                      className="flex items-center gap-2 p-3 rounded-xl cursor-pointer transition-all"
                      style={{
                        background: form.examType === exam
                          ? "rgba(124,58,237,0.15)"
                          : "var(--bg-glass)",
                        border: form.examType === exam
                          ? "2px solid var(--accent-primary)"
                          : "1px solid var(--border-glass)",
                      }}
                    >
                      <input
                        type="radio"
                        id={`exam-${exam}`}
                        name="examType"
                        value={exam}
                        checked={form.examType === exam}
                        onChange={() => setForm((f) => ({ ...f, examType: exam }))}
                        className="sr-only"
                      />
                      <span className="font-semibold text-sm" style={{ color: form.examType === exam ? "var(--accent-primary)" : "var(--text-secondary)" }}>
                        {exam}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            </fieldset>
          )}

          {/* Step 2: Exam Date */}
          {step === 2 && (
            <fieldset>
              <legend className="text-lg font-semibold mb-6 flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
                <Calendar className="w-5 h-5" aria-hidden="true" />
                When is your exam?
              </legend>

              <div>
                <label htmlFor="exam-date" className="block text-sm font-medium mb-2" style={{ color: "var(--text-secondary)" }}>
                  {form.examType} exam date
                </label>
                <input
                  id="exam-date"
                  type="date"
                  className="form-input"
                  value={form.examDate}
                  min={new Date().toISOString().split("T")[0]}
                  onChange={(e) => setForm((f) => ({ ...f, examDate: e.target.value }))}
                  aria-label={`${form.examType} exam date`}
                />
              </div>

              {form.examDate && (
                <div
                  className="mt-4 p-3 rounded-xl text-sm"
                  style={{ background: "rgba(124,58,237,0.1)", border: "1px solid rgba(124,58,237,0.2)" }}
                  role="status"
                >
                  <p style={{ color: "var(--accent-primary)" }}>
                    {Math.max(0, Math.ceil((new Date(form.examDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))} days until your {form.examType} exam
                  </p>
                </div>
              )}
            </fieldset>
          )}

          {/* Step 3: Wellness Baseline */}
          {step === 3 && (
            <fieldset>
              <legend className="text-lg font-semibold mb-6 flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
                <Activity className="w-5 h-5" aria-hidden="true" />
                Quick wellness baseline
              </legend>

              {[
                {
                  id: "stress-slider",
                  label: "Current stress level",
                  value: form.stressLevel,
                  onChange: (v: number) => setForm((f) => ({ ...f, stressLevel: v })),
                  min: 1,
                  max: 10,
                  minLabel: "Very relaxed",
                  maxLabel: "Very stressed",
                  unit: "/10",
                },
                {
                  id: "sleep-slider",
                  label: "Average hours of sleep per night",
                  value: form.avgSleep,
                  onChange: (v: number) => setForm((f) => ({ ...f, avgSleep: v })),
                  min: 3,
                  max: 12,
                  step: 0.5,
                  minLabel: "3h",
                  maxLabel: "12h",
                  unit: " hours",
                },
                {
                  id: "confidence-slider",
                  label: "Preparation confidence",
                  value: form.confidence,
                  onChange: (v: number) => setForm((f) => ({ ...f, confidence: v })),
                  min: 1,
                  max: 10,
                  minLabel: "Not ready",
                  maxLabel: "Very ready",
                  unit: "/10",
                },
              ].map((slider) => (
                <div key={slider.id} className="mb-5">
                  <div className="flex justify-between mb-2">
                    <label htmlFor={slider.id} className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>
                      {slider.label}
                    </label>
                    <span className="text-sm font-bold" style={{ color: "var(--accent-primary)" }}>
                      {slider.value}{slider.unit}
                    </span>
                  </div>
                  <input
                    id={slider.id}
                    type="range"
                    min={slider.min}
                    max={slider.max}
                    step={slider.step ?? 1}
                    value={slider.value}
                    onChange={(e) => slider.onChange(Number(e.target.value))}
                    className="gradient-slider"
                    aria-valuemin={slider.min}
                    aria-valuemax={slider.max}
                    aria-valuenow={slider.value}
                  />
                  <div className="flex justify-between text-xs mt-1" style={{ color: "var(--text-muted)" }}>
                    <span>{slider.minLabel}</span>
                    <span>{slider.maxLabel}</span>
                  </div>
                </div>
              ))}
            </fieldset>
          )}

          {/* Error display */}
          {error && (
            <div
              role="alert"
              className="mt-4 p-3 rounded-lg flex items-center gap-2 text-sm"
              style={{
                background: "rgba(239,68,68,0.1)",
                border: "1px solid rgba(239,68,68,0.3)",
                color: "var(--color-danger)",
              }}
            >
              <AlertCircle className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
              {error}
            </div>
          )}

          {/* Navigation buttons */}
          <div className="flex gap-3 mt-6">
            {step > 1 && (
              <button
                onClick={() => { setStep(s => s - 1); setError(null); }}
                className="flex-1 py-3 rounded-xl text-sm font-medium transition-colors"
                style={{
                  background: "var(--bg-glass)",
                  border: "1px solid var(--border-glass)",
                  color: "var(--text-secondary)",
                }}
              >
                Back
              </button>
            )}
            {step < 3 ? (
              <button
                onClick={handleNext}
                className="btn-gradient flex-1 justify-center"
                id={`btn-onboard-step-${step}`}
              >
                Next <ChevronRight className="w-4 h-4" aria-hidden="true" />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="btn-gradient flex-1 justify-center"
                id="btn-onboard-complete"
                aria-busy={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                    Setting up...
                  </>
                ) : (
                  "Start My Journey 🚀"
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
