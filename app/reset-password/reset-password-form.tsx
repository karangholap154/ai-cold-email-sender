"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Eye, EyeOff, CheckCircle2, Lock } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export function ResetPasswordForm() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!password) {
      toast.error("Please enter a new password.");
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
      const { error } = await supabase.auth.updateUser({
        password,
      });

      if (error) {
        toast.error(error.message);
        return;
      }

      setIsSuccess(true);
      toast.success("Password updated successfully.");

      // Smoothly redirect to draft workspace
      setTimeout(() => {
        router.push("/draft");
        router.refresh();
      }, 1500);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to update password. Please try again.";
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
            Set new password
          </h1>
          <p className="mt-1.5 text-xs text-muted-ink">
            Choose a strong password to protect your account.
          </p>
        </div>

        {isSuccess ? (
          <div className="border border-hairline bg-paper p-5 sm:p-6 rounded-sm text-center animate-in fade-in duration-200">
            <CheckCircle2 className="mx-auto h-8 w-8 text-confirmed mb-3" />
            <h2 className="text-sm font-medium text-ink">
              Password updated successfully
            </h2>
            <p className="mt-1.5 text-xs text-muted-ink leading-relaxed">
              Redirecting you to your letter workspace...
            </p>
            <div className="mt-5 border-t border-hairline pt-4">
              <Link
                href="/draft"
                className="text-xs text-seal underline underline-offset-4 hover:opacity-80 py-1 font-medium inline-block"
              >
                Go to Workspace now
              </Link>
            </div>
          </div>
        ) : (
          <div className="border border-hairline bg-paper p-5 sm:p-6 rounded-sm shadow-none">
            <form onSubmit={handleResetPassword} className="space-y-4">
              {/* New Password */}
              <div className="space-y-1.5">
                <label
                  htmlFor="new-password"
                  className="block text-xs font-medium text-ink"
                >
                  New password
                </label>
                <div className="relative">
                  <input
                    id="new-password"
                    type={showPassword ? "text" : "password"}
                    required
                    autoComplete="new-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    className="w-full rounded-sm border border-hairline bg-paper px-3.5 py-2.5 sm:py-2 pr-10 text-sm sm:text-xs text-ink placeholder:text-muted-ink/50 focus:border-seal focus:outline-none transition-colors min-h-[40px]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-ink hover:text-ink cursor-pointer p-1"
                    title={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div className="space-y-1.5">
                <label
                  htmlFor="confirm-new-password"
                  className="block text-xs font-medium text-ink"
                >
                  Confirm new password
                </label>
                <div className="relative">
                  <input
                    id="confirm-new-password"
                    type={showConfirmPassword ? "text" : "password"}
                    required
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repeat new password"
                    className="w-full rounded-sm border border-hairline bg-paper px-3.5 py-2.5 sm:py-2 pr-10 text-sm sm:text-xs text-ink placeholder:text-muted-ink/50 focus:border-seal focus:outline-none transition-colors min-h-[40px]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-ink hover:text-ink cursor-pointer p-1"
                    title={showConfirmPassword ? "Hide password" : "Show password"}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Submit button */}
              <button
                type="submit"
                disabled={isLoading}
                className="mt-2 flex w-full items-center justify-center gap-2 rounded-sm border border-hairline bg-ink py-2.5 sm:py-2 text-xs font-medium text-paper transition-colors hover:bg-ink/90 disabled:opacity-50 cursor-pointer min-h-[42px]"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>Updating password...</span>
                  </>
                ) : (
                  <>
                    <Lock className="h-3.5 w-3.5" />
                    <span>Update password</span>
                  </>
                )}
              </button>
            </form>
          </div>
        )}

        {/* Back to sign in link */}
        <p className="mt-6 text-center text-xs text-muted-ink">
          <Link
            href="/login"
            className="text-ink underline underline-offset-4 hover:opacity-80 transition-opacity py-1 font-medium inline-block"
          >
            Back to Sign in
          </Link>
        </p>
      </div>
    </main>
  );
}
