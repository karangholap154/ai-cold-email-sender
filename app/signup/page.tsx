"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, CheckCircle2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      toast.error("Please fill in all fields.");
      return;
    }

    if (password.length < 6) {
      toast.error("Password must be at least 6 characters.");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }

    setIsLoading(true);
    try {
      const supabase = createClient();
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        toast.error(error.message);
        return;
      }

      // If user session exists immediately (email confirmation disabled in Supabase)
      if (data.session) {
        toast.success("Account created successfully.");
        router.push("/");
        router.refresh();
      } else {
        // Confirmation email sent
        setIsSuccess(true);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to create account.";
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="flex flex-1 flex-col items-center justify-center px-6 py-12">
      <div className="w-full max-w-sm">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="font-heading text-2xl text-ink">Create an account</h1>
          <p className="mt-1.5 text-xs text-muted-ink">
            Start drafting tailored, genuine cold applications in seconds.
          </p>
        </div>

        {/* Success confirmation state */}
        {isSuccess ? (
          <div className="border border-hairline bg-paper p-6 rounded-sm text-center">
            <CheckCircle2 className="mx-auto h-8 w-8 text-confirmed mb-3" />
            <h2 className="text-sm font-medium text-ink">Check your inbox</h2>
            <p className="mt-1.5 text-xs text-muted-ink leading-relaxed">
              We&apos;ve sent a confirmation link to <strong className="font-medium text-ink">{email}</strong>. Click the link in that email to confirm your account and sign in.
            </p>
            <div className="mt-5 border-t border-hairline pt-4">
              <Link
                href="/login"
                className="text-xs text-ink underline underline-offset-4 hover:opacity-80"
              >
                Back to Sign in
              </Link>
            </div>
          </div>
        ) : (
          /* Form Card */
          <div className="border border-hairline bg-paper p-6 rounded-sm shadow-none">
            <form onSubmit={handleSignup} className="space-y-4">
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
                  className="w-full rounded-sm border border-hairline bg-paper px-3 py-2 text-xs text-ink placeholder:text-muted-ink/50 focus:border-seal focus:outline-none transition-colors"
                />
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="password"
                  className="block text-xs font-medium text-ink"
                >
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  required
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className="w-full rounded-sm border border-hairline bg-paper px-3 py-2 text-xs text-ink placeholder:text-muted-ink/50 focus:border-seal focus:outline-none transition-colors"
                />
              </div>

              <div className="space-y-1.5">
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
                  className="w-full rounded-sm border border-hairline bg-paper px-3 py-2 text-xs text-ink placeholder:text-muted-ink/50 focus:border-seal focus:outline-none transition-colors"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="mt-2 flex w-full items-center justify-center gap-2 rounded-sm border border-hairline bg-ink py-2 text-xs font-medium text-paper transition-colors hover:bg-ink/90 disabled:opacity-50"
              >
                {isLoading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                <span>{isLoading ? "Creating account..." : "Create account"}</span>
              </button>
            </form>
          </div>
        )}

        {/* Footer Link */}
        {!isSuccess && (
          <p className="mt-6 text-center text-xs text-muted-ink">
            Already have an account?{" "}
            <Link
              href="/login"
              className="text-ink underline underline-offset-4 hover:opacity-80 transition-opacity"
            >
              Sign in
            </Link>
          </p>
        )}
      </div>
    </main>
  );
}
