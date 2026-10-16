import { Suspense } from "react";
import type { Metadata } from "next";
import { Loader2 } from "lucide-react";
import { ResetPasswordForm } from "./reset-password-form";

export const metadata: Metadata = {
  title: "Set new password",
  description: "Set a new password for your Vina account.",
  robots: {
    index: false,
    follow: false,
  },
};

function ResetPasswordFallback() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center px-4 py-8 sm:px-6 sm:py-12">
      <div className="w-full max-w-sm flex items-center justify-center p-12">
        <Loader2 className="h-6 w-6 animate-spin text-seal" />
      </div>
    </main>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<ResetPasswordFallback />}>
      <ResetPasswordForm />
    </Suspense>
  );
}
