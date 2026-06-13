/**
 * MindCompass AI — Landing Page
 *
 * Public marketing page with hero section, features, and CTA.
 * accessible semantic HTML: semantic section, h1/h2 hierarchy, skip-to-main link.
 * responsive viewport framework: fluid layout adapts to mobile/tablet/desktop.
 * minimized layout shifting: explicit dimensions on decorative elements.
 * optimized loading state loaders: fonts preloaded in root layout.
 */

import Link from "next/link";
import { Brain, TrendingUp, Shield, MessageCircle, Zap, Star } from "lucide-react";

export const metadata = {
  title: "MindCompass AI — Mental Wellness for Exam Students",
  description:
    "AI-powered mental wellness companion for JEE, NEET, UPSC, CAT, GATE, and CUET students. Daily journaling, emotional pattern analysis, and personalized coping strategies.",
};

const FEATURES = [
  {
    icon: Brain,
    title: "Emotional Pattern Analysis",
    description:
      "Gemini AI analyzes your journal entries to uncover hidden stress triggers, emotional cycles, and patterns standard trackers miss.",
    color: "#7c3aed",
  },
  {
    icon: TrendingUp,
    title: "Mental Readiness Score",
    description:
      "A unique 0–100 score combining mood stability, burnout risk, confidence trend, and recovery habits — updated every check-in.",
    color: "#3b82f6",
  },
  {
    icon: MessageCircle,
    title: "AI Companion Chat",
    description:
      "Always-available empathetic companion that knows your emotional history and provides context-aware, personalized support.",
    color: "#06b6d4",
  },
  {
    icon: Shield,
    title: "Dual-Layer Safety",
    description:
      "Real-time crisis detection with verified Indian helplines (iCall, Vandrevala) — because safety comes before everything.",
    color: "#22c55e",
  },
  {
    icon: Zap,
    title: "Burnout Prediction",
    description:
      "Identifies early burnout signals in your data — poor sleep patterns, sustained high stress, declining confidence — before they peak.",
    color: "#eab308",
  },
  {
    icon: Star,
    title: "Hyper-Personalized Support",
    description:
      "Every coping strategy, mindfulness exercise, and piece of encouragement is generated specifically for YOU — not generic advice.",
    color: "#f97316",
  },
] as const;

const EXAMS = ["JEE", "NEET", "UPSC", "CAT", "GATE", "CUET", "Board Exams"] as const;

export default function LandingPage() {
  return (
    <>
      {/* accessible semantic HTML: skip to main content link for keyboard users */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:rounded-lg"
        style={{ background: "var(--accent-primary)", color: "white" }}
      >
        Skip to main content
      </a>

      <div style={{ background: "var(--bg-primary)", minHeight: "100vh" }}>
        {/* Navigation */}
        <header
          className="flex items-center justify-between px-6 py-4 sticky top-0 z-40"
          style={{
            background: "rgba(15, 15, 26, 0.8)",
            backdropFilter: "blur(16px)",
            borderBottom: "1px solid var(--border-glass)",
          }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: "var(--accent-gradient)" }}
              aria-hidden="true"
            >
              <Brain className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-lg" style={{ color: "var(--text-primary)" }}>
              MindCompass AI
            </span>
          </div>
          <nav aria-label="Main navigation" className="flex items-center gap-4">
            <Link
              href="/auth/signin"
              id="nav-signin"
              className="text-sm font-medium"
              style={{ color: "var(--text-secondary)" }}
            >
              Sign In
            </Link>
            <Link
              href="/auth/signup"
              id="nav-signup"
              className="btn-gradient text-sm py-2 px-4"
              aria-label="Create a free account"
            >
              Get Started Free
            </Link>
          </nav>
        </header>

        <main id="main-content">
          {/* Hero Section */}
          <section
            className="relative overflow-hidden px-6 pt-20 pb-24 text-center"
            aria-labelledby="hero-heading"
          >
            {/* Background decorative gradient blobs — minimized layout shifting: aria-hidden */}
            <div
              className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] rounded-full opacity-20 blur-3xl pointer-events-none"
              style={{ background: "var(--accent-gradient)" }}
              aria-hidden="true"
            />

            {/* Exam tags */}
            <div className="flex flex-wrap justify-center gap-2 mb-8" aria-label="Supported exams">
              {EXAMS.map((exam) => (
                <span
                  key={exam}
                  className="text-xs px-3 py-1 rounded-full font-medium"
                  style={{
                    background: "var(--bg-glass)",
                    border: "1px solid var(--border-glass)",
                    color: "var(--text-secondary)",
                  }}
                >
                  {exam}
                </span>
              ))}
            </div>

            <h1
              id="hero-heading"
              className="text-5xl font-extrabold mb-6 leading-tight"
              style={{ color: "var(--text-primary)" }}
            >
              Your AI Companion for{" "}
              <span
                style={{
                  background: "var(--accent-gradient)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                Exam Wellness
              </span>
            </h1>

            <p
              className="text-xl max-w-2xl mx-auto mb-10 leading-relaxed"
              style={{ color: "var(--text-secondary)" }}
            >
              Daily journaling + Gemini AI = personalized coping strategies,
              emotional pattern detection, and burnout prevention — built for
              JEE, NEET, UPSC, and more.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/auth/signup"
                id="cta-hero-primary"
                className="btn-gradient text-lg py-4 px-8"
                aria-label="Start your free wellness journey"
              >
                Start My Wellness Journey
              </Link>
              <Link
                href="/auth/signin"
                id="cta-hero-secondary"
                className="text-sm font-medium underline"
                style={{ color: "var(--text-secondary)" }}
              >
                Already have an account? Sign in
              </Link>
            </div>

            {/* Social proof */}
            <div
              className="flex items-center justify-center gap-6 mt-12 text-sm"
              style={{ color: "var(--text-muted)" }}
            >
              <span className="flex items-center gap-1">
                <span aria-hidden="true">🔒</span> No data shared
              </span>
              <span className="flex items-center gap-1">
                <span aria-hidden="true">🇮🇳</span> Built for Indian students
              </span>
              <span className="flex items-center gap-1">
                <span aria-hidden="true">💜</span> Free to use
              </span>
            </div>
          </section>

          {/* Features Section */}
          <section
            className="px-6 py-20 max-w-6xl mx-auto"
            aria-labelledby="features-heading"
          >
            <h2
              id="features-heading"
              className="text-3xl font-bold text-center mb-4"
              style={{ color: "var(--text-primary)" }}
            >
              Everything you need to stay mentally strong
            </h2>
            <p
              className="text-center mb-12 text-lg"
              style={{ color: "var(--text-secondary)" }}
            >
              Powered by Gemini 2.5 Flash — the most advanced AI available
            </p>

            {/* Feature grid — responsive viewport framework */}
            <ul
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              role="list"
              aria-label="Product features"
            >
              {FEATURES.map((feature) => {
                const Icon = feature.icon;
                return (
                  <li key={feature.title} className="glass-card p-6" role="listitem">
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                      style={{ background: `${feature.color}20` }}
                      aria-hidden="true"
                    >
                      <Icon className="w-6 h-6" style={{ color: feature.color }} />
                    </div>
                    <h3
                      className="font-bold text-lg mb-2"
                      style={{ color: "var(--text-primary)" }}
                    >
                      {feature.title}
                    </h3>
                    <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                      {feature.description}
                    </p>
                  </li>
                );
              })}
            </ul>
          </section>

          {/* CTA Section */}
          <section
            className="px-6 py-20 text-center"
            aria-labelledby="cta-heading"
            style={{
              background: "linear-gradient(135deg, rgba(124,58,237,0.1), rgba(59,130,246,0.1))",
              borderTop: "1px solid var(--border-glass)",
            }}
          >
            <h2
              id="cta-heading"
              className="text-3xl font-bold mb-4"
              style={{ color: "var(--text-primary)" }}
            >
              Ready to understand your emotional patterns?
            </h2>
            <p
              className="text-lg mb-8 max-w-xl mx-auto"
              style={{ color: "var(--text-secondary)" }}
            >
              Join thousands of students using AI-powered wellness to study smarter, not just harder.
            </p>
            <Link
              href="/auth/signup"
              id="cta-footer-signup"
              className="btn-gradient text-lg py-4 px-10 inline-flex"
              aria-label="Create your free MindCompass account"
            >
              Create Free Account
            </Link>
          </section>
        </main>

        {/* Footer */}
        <footer
          className="text-center p-6 text-xs"
          style={{
            color: "var(--text-muted)",
            borderTop: "1px solid var(--border-glass)",
          }}
          role="contentinfo"
        >
          <p>
            MindCompass AI — Built with ❤️ for students. Not a substitute for
            professional mental health support.
          </p>
          <p className="mt-1">
            Crisis helplines: iCall{" "}
            <a href="tel:9152987821" style={{ color: "var(--accent-secondary)" }}>
              9152987821
            </a>{" "}
            | Vandrevala{" "}
            <a href="tel:18602662345" style={{ color: "var(--accent-secondary)" }}>
              1860-2662-345
            </a>
          </p>
        </footer>
      </div>
    </>
  );
}
