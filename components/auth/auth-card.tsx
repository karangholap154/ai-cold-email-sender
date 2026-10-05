"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Loader2, CheckCircle2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface AuthCardProps {
  initialMode?: "signin" | "signup";
}

export function AuthCard({ initialMode = "signin" }: AuthCardProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Mode state: prioritize query param ?mode= if present, otherwise initialMode
  const urlMode = searchParams.get("mode");
  const [mode, setMode] = useState<"signin" | "signup">(
    urlMode === "signup" || urlMode === "signin" ? urlMode : initialMode
  );

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Sync mode if query params change externally
  useEffect(() => {
    if (urlMode === "signup" || urlMode === "signin") {
      setMode(urlMode);
    }
  }, [urlMode]);

  // Display error from query param (e.g. from /auth/callback)
  useEffect(() => {
    const errorMsg = searchParams.get("error");
    if (errorMsg) {
      toast.error(errorMsg);
    }
  }, [searchParams]);

  const switchMode = (newMode: "signin" | "signup") => {
    if (mode === newMode) return;
    setMode(newMode);
    setIsSuccess(false);
    // Keep email populated, reset password fields for safety
    setPassword("");
    setConfirmPassword("");
    // Update URL query param smoothly without full page reload
    const currentUrl = new URL(window.location.href);
    currentUrl.searchParams.set("mode", newMode);
    window.history.replaceState({}, "", currentUrl.toString());
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim() || !password) {
      toast.error("Please enter both email and password.");
      return;
    }

    if (mode === "signup") {
      if (password.length < 6) {
        toast.error("Password must be at least 6 characters.");
        return;
      }

      if (password !== confirmPassword) {
        toast.error("Passwords do not match.");
        return;
      }
    }

    setIsLoading(true);
    const nextUrl = searchParams.get("next") || "/draft";

    try {
      const supabase = createClient();

      if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

        if (error) {
          toast.error(error.message);
          return;
        }

        toast.success("Welcome back.");
        router.push(nextUrl);
        router.refresh();
      } else {
        // Pre-validate email to block temporary/disposable inboxes
        try {
          const valRes = await fetch("/api/auth/validate-email", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: email.trim() }),
          });
          const valData = await valRes.json();
          if (!valRes.ok || !valData.valid) {
            toast.error(
              valData.error ||
                "Temporary/disposable email addresses are not permitted."
            );
            return;
          }
        } catch {
          // If the validation check fails due to an unexpected network issue, continue to Supabase
        }

        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(nextUrl)}`,
          },
        });

        if (error) {
          toast.error(error.message);
          return;
        }

        // If user session exists immediately (email confirmation disabled in Supabase)
        if (data.session) {
          toast.success("Account created successfully.");
          router.push(nextUrl);
          router.refresh();
        } else {
          // Confirmation email sent
          setIsSuccess(true);
        }
      }
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : mode === "signin"
          ? "Failed to sign in."
          : "Failed to create account.";
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="flex flex-1 flex-col items-center justify-center px-4 py-8 sm:px-6 sm:py-12">
      <div className="w-full max-w-sm">
        {/* Header */}
        <div className="mb-6 sm:mb-8 text-center flex flex-col items-center">
          <Link href="/" className="mb-3 hover:opacity-80 transition-opacity">
            <Image
              src="/logo.png"
              alt="Vina logo"
              width={36}
              height={36}
              className="h-9 w-auto"
              priority
            />
          </Link>
          <h1 className="font-heading text-xl sm:text-2xl text-ink">
            {mode === "signin" ? "Welcome back" : "Create your account"}
          </h1>
          <p className="mt-1.5 text-xs text-muted-ink">
            {mode === "signin"
              ? "Sign in to review your drafts and sent letters."
              : "Turn a job description into a letter worth sending."}
          </p>
        </div>

        {/* Success confirmation state */}
        {isSuccess ? (
          <div className="border border-hairline bg-paper p-5 sm:p-6 rounded-sm text-center">
            <CheckCircle2 className="mx-auto h-8 w-8 text-confirmed mb-3" />
            <h2 className="text-sm font-medium text-ink">
              Check your inbox to confirm your email before you continue.
            </h2>
            <p className="mt-1.5 text-xs text-muted-ink leading-relaxed">
              We&apos;ve sent a confirmation link to{" "}
              <strong className="font-medium text-ink break-all">{email}</strong>.
            </p>
            <div className="mt-5 border-t border-hairline pt-4">
              <button
                type="button"
                onClick={() => switchMode("signin")}
                className="text-xs text-ink underline underline-offset-4 hover:opacity-80 py-1 cursor-pointer font-medium"
              >
                Back to Sign in
              </button>
            </div>
          </div>
        ) : (
          /* Form Card */
          <div className="border border-hairline bg-paper p-5 sm:p-6 rounded-sm shadow-none">
            {/* Segmented Mode Switcher */}
            <div className="grid grid-cols-2 p-1 bg-subtle rounded-sm border border-hairline mb-5 text-xs">
              <button
                type="button"
                onClick={() => switchMode("signin")}
                className={`py-1.5 font-medium rounded-sm transition-all cursor-pointer text-center ${
                  mode === "signin"
                    ? "bg-paper text-ink shadow-sm border border-hairline"
                    : "text-muted-ink hover:text-ink border border-transparent"
                }`}
              >
                Sign in
              </button>
              <button
                type="button"
                onClick={() => switchMode("signup")}
                className={`py-1.5 font-medium rounded-sm transition-all cursor-pointer text-center ${
                  mode === "signup"
                    ? "bg-paper text-ink shadow-sm border border-hairline"
                    : "text-muted-ink hover:text-ink border border-transparent"
                }`}
              >
                Create account
              </button>
            </div>

            <form onSubmit={handleAuth} className="space-y-4">
              {/* Email Address */}
              <div className="space-y-1.5">
                <label
                  htmlFor="email"
                  className="block text-xs font-medium text-ink"
                >
                  Email address
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@domain.com"
                  className="w-full rounded-sm border border-hairline bg-paper px-3.5 py-2.5 sm:py-2 text-sm sm:text-xs text-ink placeholder:text-muted-ink/50 focus:border-seal focus:outline-none transition-colors min-h-[40px]"
                />
                {mode === "signup" && (
                  <p className="text-[11px] text-muted-ink">
                    We&apos;ll only use this to sign you in — no marketing emails.
                  </p>
                )}
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label
                    htmlFor="password"
                    className="block text-xs font-medium text-ink"
                  >
                    Password
                  </label>
                </div>
                <input
                  id="password"
                  type="password"
                  required
                  autoComplete={mode === "signin" ? "current-password" : "new-password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={mode === "signup" ? "At least 6 characters" : "••••••••"}
                  className="w-full rounded-sm border border-hairline bg-paper px-3.5 py-2.5 sm:py-2 text-sm sm:text-xs text-ink placeholder:text-muted-ink/50 focus:border-seal focus:outline-none transition-colors min-h-[40px]"
                />
              </div>

              {/* Confirm Password (only in signup mode) */}
              {mode === "signup" && (
                <div className="space-y-1.5 animate-in fade-in duration-150">
                  <label
                    htmlFor="confirm-password"
                    className="block text-xs font-medium text-ink"
                  >
                    Confirm password
                  </label>
                  <input
                    id="confirm-password"
                    type="password"
                    required
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repeat password"
                    className="w-full rounded-sm border border-hairline bg-paper px-3.5 py-2.5 sm:py-2 text-sm sm:text-xs text-ink placeholder:text-muted-ink/50 focus:border-seal focus:outline-none transition-colors min-h-[40px]"
                  />
                </div>
              )}

              {/* Submit button */}
              <button
                type="submit"
                disabled={isLoading}
                className="mt-2 flex w-full items-center justify-center gap-2 rounded-sm border border-hairline bg-ink py-2.5 sm:py-2 text-xs font-medium text-paper transition-colors hover:bg-ink/90 disabled:opacity-50 cursor-pointer min-h-[42px]"
              >
                {isLoading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                <span>
                  {isLoading
                    ? mode === "signin"
                      ? "Signing in..."
                      : "Creating account..."
                    : mode === "signin"
                    ? "Sign in"
                    : "Create account"}
                </span>
              </button>

              {/* Legal terms agreement (only in signup mode) */}
              {mode === "signup" && (
                <p className="text-[11px] text-muted-ink text-center pt-2 leading-relaxed animate-in fade-in duration-150">
                  By creating an account, you agree to our{" "}
                  <Link
                    href="/terms"
                    className="text-ink underline underline-offset-2 hover:text-seal"
                  >
                    Terms
                  </Link>
                  ,{" "}
                  <Link
                    href="/privacy"
                    className="text-ink underline underline-offset-2 hover:text-seal"
                  >
                    Privacy Policy
                  </Link>
                  , and{" "}
                  <Link
                    href="/refund"
                    className="text-ink underline underline-offset-2 hover:text-seal"
                  >
                    Refund Policy
                  </Link>
                  .
                </p>
              )}
            </form>
          </div>
        )}

        {/* Quick toggle link below card */}
        {!isSuccess && (
          <p className="mt-6 text-center text-xs text-muted-ink">
            {mode === "signin" ? (
              <>
                Don&apos;t have an account yet?{" "}
                <button
                  type="button"
                  onClick={() => switchMode("signup")}
                  className="text-ink underline underline-offset-4 hover:opacity-80 transition-opacity py-1 cursor-pointer font-medium"
                >
                  Create one
                </button>
              </>
            ) : (
              <>
                Already have an account?{" "}
                <button
                  type="button"
                  onClick={() => switchMode("signin")}
                  className="text-ink underline underline-offset-4 hover:opacity-80 transition-opacity py-1 cursor-pointer font-medium"
                >
                  Sign in
                </button>
              </>
            )}
          </p>
        )}

        {/* Legal & Help Links */}
        <div className="mt-6 flex justify-center gap-4 text-[11px] text-muted-ink">
          <Link
            href="/privacy"
            className="hover:text-ink underline underline-offset-2"
          >
            Privacy
          </Link>
          <Link
            href="/terms"
            className="hover:text-ink underline underline-offset-2"
          >
            Terms
          </Link>
          <Link
            href="/refund"
            className="hover:text-ink underline underline-offset-2"
          >
            Refunds
          </Link>
          <Link
            href="/contact"
            className="hover:text-ink underline underline-offset-2"
          >
            Contact
          </Link>
        </div>
      </div>
    </main>
  );
}
