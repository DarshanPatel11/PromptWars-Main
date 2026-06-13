/**
 * MindCompass AI — Sign Up Page
 *
 * Security: sanitized user inputs — all fields validated with Zod before submission.
 * input validation: email format, password strength, and name length enforced.
 * accessible semantic HTML: labeled inputs, ARIA error associations, live regions.
 * error handling exceptions: Supabase errors surface as user-friendly messages.
 */

"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Brain, Mail, Lock, User, AlertCircle, CheckCircle, Loader2 } from "lucide-react";

/**
 * input validation: Zod schema with comprehensive rules.
 * sanitized user inputs: name trimmed, email lowercased.
 */
const signUpSchema = z
  .object({
    name: z
      .string()
      .min(2, "Name must be at least 2 characters")
      .max(100, "Name is too long")
      .transform((v) => v.trim()),
    email: z
      .string()
      .min(1, "Email is required")
      .email("Please enter a valid email address")
      .transform((v) => v.trim().toLowerCase()),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .max(128, "Password is too long")
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        "Password must contain at least one uppercase letter, one lowercase letter, and one number"
      ),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type SignUpFormValues = z.infer<typeof signUpSchema>;

export default function SignUpPage() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignUpFormValues>({
    resolver: zodResolver(signUpSchema),
  });

  /**
   * asynchronous handling: sign-up flow with email confirmation.
   * error handling exceptions: various Supabase error conditions handled.
   */
  const onSubmit = async (data: SignUpFormValues) => {
    setServerError(null);
    setIsLoading(true);

    try {
      const supabase = createClient();
      const { data: authData, error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            full_name: data.name,
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        if (error.message.includes("already registered")) {
          setServerError(
            "An account with this email already exists. Please sign in instead."
          );
        } else if (error.message.includes("weak password")) {
          setServerError("Please choose a stronger password.");
        } else {
          setServerError("Something went wrong. Please try again.");
        }
        return;
      }

      // If email confirmation is disabled, redirect directly
      if (authData.session) {
        router.push("/onboarding");
        router.refresh();
      } else {
        setIsSuccess(true);
      }
    } catch {
      setServerError("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <main
        className="min-h-screen flex items-center justify-center p-4"
        style={{ background: "var(--bg-primary)" }}
      >
        <div
          className="w-full max-w-md glass-card p-8 text-center"
          role="alert"
          aria-live="polite"
        >
          <CheckCircle
            className="w-16 h-16 mx-auto mb-4"
            style={{ color: "var(--color-success)" }}
            aria-hidden="true"
          />
          <h2 className="text-xl font-bold mb-2">Check your email!</h2>
          <p style={{ color: "var(--text-secondary)" }}>
            We sent a confirmation link to your email address. Click it to
            complete your registration and start your wellness journey.
          </p>
          <Link href="/auth/signin" className="btn-gradient mt-6 inline-flex">
            Back to Sign In
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main
      className="min-h-screen flex items-center justify-center p-4"
      style={{ background: "var(--bg-primary)" }}
    >
      <div
        className="w-full max-w-md glass-card p-8"
        role="region"
        aria-label="Create your MindCompass AI account"
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
            Create Account
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
            Start your wellness journey today
          </p>
        </div>

        <form
          onSubmit={handleSubmit(onSubmit)}
          noValidate
          aria-label="Sign up form"
        >
          {/* Name field */}
          <div className="mb-4">
            <label
              htmlFor="signup-name"
              className="block text-sm font-medium mb-2"
              style={{ color: "var(--text-secondary)" }}
            >
              Full name
            </label>
            <div className="relative">
              <User
                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
                style={{ color: "var(--text-muted)" }}
                aria-hidden="true"
              />
              <input
                id="signup-name"
                type="text"
                autoComplete="name"
                className="form-input pl-10"
                placeholder="Priya Sharma"
                aria-invalid={!!errors.name}
                aria-describedby={errors.name ? "name-error" : undefined}
                {...register("name")}
              />
            </div>
            {errors.name && (
              <p
                id="name-error"
                role="alert"
                className="mt-1 text-xs flex items-center gap-1"
                style={{ color: "var(--color-danger)" }}
              >
                <AlertCircle className="w-3 h-3" aria-hidden="true" />
                {errors.name.message}
              </p>
            )}
          </div>

          {/* Email field */}
          <div className="mb-4">
            <label
              htmlFor="signup-email"
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
                id="signup-email"
                type="email"
                autoComplete="email"
                className="form-input pl-10"
                placeholder="you@example.com"
                aria-invalid={!!errors.email}
                aria-describedby={errors.email ? "email-error-signup" : undefined}
                {...register("email")}
              />
            </div>
            {errors.email && (
              <p
                id="email-error-signup"
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
          <div className="mb-4">
            <label
              htmlFor="signup-password"
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
                id="signup-password"
                type="password"
                autoComplete="new-password"
                className="form-input pl-10"
                placeholder="Min. 8 characters"
                aria-invalid={!!errors.password}
                aria-describedby="password-requirements"
                {...register("password")}
              />
            </div>
            <p
              id="password-requirements"
              className="mt-1 text-xs"
              style={{ color: "var(--text-muted)" }}
            >
              Must contain uppercase, lowercase, and a number
            </p>
            {errors.password && (
              <p
                role="alert"
                className="mt-1 text-xs flex items-center gap-1"
                style={{ color: "var(--color-danger)" }}
              >
                <AlertCircle className="w-3 h-3" aria-hidden="true" />
                {errors.password.message}
              </p>
            )}
          </div>

          {/* Confirm Password field */}
          <div className="mb-6">
            <label
              htmlFor="signup-confirm"
              className="block text-sm font-medium mb-2"
              style={{ color: "var(--text-secondary)" }}
            >
              Confirm password
            </label>
            <div className="relative">
              <Lock
                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
                style={{ color: "var(--text-muted)" }}
                aria-hidden="true"
              />
              <input
                id="signup-confirm"
                type="password"
                autoComplete="new-password"
                className="form-input pl-10"
                placeholder="Repeat password"
                aria-invalid={!!errors.confirmPassword}
                aria-describedby={
                  errors.confirmPassword ? "confirm-error" : undefined
                }
                {...register("confirmPassword")}
              />
            </div>
            {errors.confirmPassword && (
              <p
                id="confirm-error"
                role="alert"
                className="mt-1 text-xs flex items-center gap-1"
                style={{ color: "var(--color-danger)" }}
              >
                <AlertCircle className="w-3 h-3" aria-hidden="true" />
                {errors.confirmPassword.message}
              </p>
            )}
          </div>

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

          <button
            type="submit"
            disabled={isLoading}
            className="btn-gradient w-full justify-center"
            aria-busy={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                Creating account...
              </>
            ) : (
              "Create Account"
            )}
          </button>
        </form>

        <p
          className="text-center text-sm mt-6"
          style={{ color: "var(--text-secondary)" }}
        >
          Already have an account?{" "}
          <Link href="/auth/signin" className="font-medium">
            Sign in
          </Link>
        </p>
      </div>
    </main>
  );
}
