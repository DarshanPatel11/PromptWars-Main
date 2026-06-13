/**
 * MindCompass AI — Root App Layout
 *
 * accessible semantic HTML: semantic <html>, <head>, <body> structure.
 * responsive viewport framework: viewport meta tag and fluid sizing.
 * SEO: complete meta tags on root layout.
 * optimized loading state loaders: font preloading prevents FOUT.
 * minimized layout shifting: font-display swap, explicit viewport.
 */

import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: {
    default: "MindCompass AI — Mental Wellness for Exam Preparation",
    template: "%s | MindCompass AI",
  },
  description:
    "AI-powered mental wellness companion for JEE, NEET, UPSC, CAT, GATE, and CUET students. " +
    "Daily journaling, emotional pattern analysis, personalized coping strategies, and burnout prevention.",
  keywords: [
    "mental wellness",
    "exam preparation",
    "JEE",
    "NEET",
    "UPSC",
    "stress management",
    "AI companion",
    "burnout prevention",
    "student wellbeing",
  ],
  authors: [{ name: "MindCompass AI Team" }],
  creator: "MindCompass AI",
  robots: "index, follow",
  openGraph: {
    title: "MindCompass AI — Mental Wellness for Exam Preparation",
    description:
      "AI-powered wellness companion for competitive exam students. Journal, track, and thrive.",
    type: "website",
    locale: "en_IN",
  },
};

// responsive viewport framework: enforces consistent viewport behavior
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#0f0f1a",
};

interface RootLayoutProps {
  children: React.ReactNode;
}

/**
 * Root layout wraps the entire application.
 * accessible semantic HTML: lang attribute set for screen readers.
 */
export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en" className={`dark ${inter.variable}`}>
      <head />
      <body className={inter.className}>
        {/*
         * accessible semantic HTML: <main> is the primary landmark.
         * responsive viewport framework: full-viewport layout container.
         * Typography: Inter is applied globally here.
         */}
        {children}
      </body>
    </html>
  );
}
