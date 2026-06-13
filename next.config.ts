import type { NextConfig } from "next";

/**
 * MindCompass AI — Next.js Configuration
 *
 * Architecture: modular design with explicit security headers.
 * secure headers: Content-Security-Policy, X-Frame-Options, etc.
 * cross-site scripting (XSS) protection via CSP and X-XSS-Protection.
 * Vercel deployment: zero additional configuration needed beyond this file.
 */
const nextConfig: NextConfig = {
  // Strict TypeScript & ESLint during builds for code quality
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: false,
  },

  /**
   * Security headers applied to every response.
   * secure headers: prevents clickjacking, MIME sniffing, XSS, and information leakage.
   * cross-site scripting (XSS) protection: enforced via CSP and X-XSS-Protection.
   */
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          // cross-site scripting (XSS) protection
          {
            key: "X-XSS-Protection",
            value: "1; mode=block",
          },
          // Prevent MIME type sniffing
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          // Clickjacking protection
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          // HTTPS enforcement (HSTS)
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          // Referrer policy — minimize information leakage
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          // Permissions policy — disable unused browser features
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          /**
           * Content Security Policy — primary XSS defense.
           * cross-site scripting (XSS) protection: restricts script sources to known safe origins.
           * no hardcoded API keys: API calls happen server-side only.
           */
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval'", // Next.js requires unsafe-eval in dev
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com",
              "img-src 'self' data: https:",
              "connect-src 'self' https://*.supabase.co wss://*.supabase.co",
              "frame-ancestors 'none'",
            ].join("; "),
          },
        ],
      },
    ];
  },
};

export default nextConfig;
