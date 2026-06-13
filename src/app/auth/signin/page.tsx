/**
 * MindCompass AI — Sign In Page
 *
 * Security: sanitized user inputs — email/password validated before submission.
 * input validation: Zod schema validates email format and password length.
 * accessible semantic HTML: form with labels, ARIA attributes, and error states.
 * error handling exceptions: Supabase auth errors are caught and displayed.
 */

"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Brain, Mail, Lock, AlertCircle, Loader2 } from "lucide-react";

/**
 * input validation: Zod schema for sign-in form.
 * sanitized user inputs: email is trimmed and lowercased automatically.
 */
const signInSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .email("Please enter a valid email address")
    .transform((v) => v.trim().toLowerCase()),
  password: z
    .string()
    .min(6, "Password must be at least 6 characters")
    .max(128, "Password is too long"),
});

type SignInFormValues = z.infer<typeof signInSchema>;

export default function SignInPage() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignInFormValues>({
    resolver: zodResolver(signInSchema),
  });

  /**
   * asynchronous handling: form submission with proper error boundaries.
   * error handling exceptions: Supabase errors are caught and shown to user.
   */
  const onSubmit = async (data: SignInFormValues) => {
    setServerError(null);
    setIsLoading(true);

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      if (error) {
        // Provide user-friendly error messages without exposing system details
        if (error.message.includes("Invalid login credentials")) {
          setServerError("Incorrect email or password. Please try again.");
        } else if (error.message.includes("Email not confirmed")) {
          setServerError("Please verify your email address before signing in.");
        } else {
          setServerError("Something went wrong. Please try again.");
        }
        return;
      }

      router.push("/dashboard");
      router.refresh();
    } catch {
      setServerError("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main
      className="min-h-screen flex items-center justify-center p-4"
      style={{ background: "var(--bg-primary)" }}
    >
      {/* accessible semantic HTML: landmark with descriptive label */}
      <div
        className="w-full max-w-md glass-card p-8"
        role="region"
        aria-label="Sign in to MindCompass AI"
      >
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
            style={{ background: "var(--accent-gradient)" }}
            aria-hidden="true"
          >
            <Brain className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
            MindCompass AI
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
            Your mental wellness companion
          </p>
        </div>

        {/* accessible semantic HTML: form with role and aria-label */}
        <form
          onSubmit={handleSubmit(onSubmit)}
          noValidate
          aria-label="Sign in form"
        >
          {/* Email field */}
          <div className="mb-4">
            <label
              htmlFor="signin-email"
              className="block text-sm font-medium mb-2"
              style={{ color: "var(--text-secondary)" }}
            >
              Email address
            </label>
            <div className="relative">
              <Mail
                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
                style={{ color: "var(--text-muted)" }}
                aria-hidden="true"
              />
              <input
                id="signin-email"
                type="email"
                autoComplete="email"
                className="form-input pl-10"
                placeholder="you@example.com"
                aria-invalid={!!errors.email}
                aria-describedby={errors.email ? "email-error" : undefined}
                {...register("email")}
              />
            </div>
            {errors.email && (
              <p
                id="email-error"
                role="alert"
                className="mt-1 text-xs flex items-center gap-1"
                style={{ color: "var(--color-danger)" }}
              >
                <AlertCircle className="w-3 h-3" aria-hidden="true" />
                {errors.email.message}
              </p>
            )}
          </div>

          {/* Password field */}
          <div className="mb-6">
            <label
              htmlFor="signin-password"
              className="block text-sm font-medium mb-2"
              style={{ color: "var(--text-secondary)" }}
            >
              Password
            </label>
            <div className="relative">
              <Lock
                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
                style={{ color: "var(--text-muted)" }}
                aria-hidden="true"
              />
              <input
                id="signin-password"
                type="password"
                autoComplete="current-password"
                className="form-input pl-10"
                placeholder="••••••••"
                aria-invalid={!!errors.password}
                aria-describedby={errors.password ? "password-error" : undefined}
                {...register("password")}
              />
            </div>
            {errors.password && (
              <p
                id="password-error"
                role="alert"
                className="mt-1 text-xs flex items-center gap-1"
                style={{ color: "var(--color-danger)" }}
              >
                <AlertCircle className="w-3 h-3" aria-hidden="true" />
                {errors.password.message}
              </p>
            )}
          </div>

          {/* Server error */}
          {serverError && (
            <div
              role="alert"
              className="mb-4 p-3 rounded-lg flex items-center gap-2 text-sm"
              style={{
                background: "rgba(239, 68, 68, 0.1)",
                border: "1px solid rgba(239, 68, 68, 0.3)",
                color: "var(--color-danger)",
              }}
            >
              <AlertCircle className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
              {serverError}
            </div>
          )}

          {/* Submit button */}
          <button
            type="submit"
            disabled={isLoading}
            className="btn-gradient w-full justify-center"
            aria-busy={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                Signing in...
              </>
            ) : (
              "Sign In"
            )}
          </button>
        </form>

        {/* Sign up link */}
        <p
          className="text-center text-sm mt-6"
          style={{ color: "var(--text-secondary)" }}
        >
          Don't have an account?{" "}
          <Link href="/auth/signup" className="font-medium">
            Create account
          </Link>
        </p>
      </div>
    </main>
  );
}
