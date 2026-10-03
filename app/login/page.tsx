import { Suspense } from "react";
import { Metadata } from "next";
import { AuthCard } from "@/components/auth/auth-card";
import { Loader2 } from "lucide-react";

export const metadata: Metadata = {
  title: "Sign in — Vina",
  description: "Sign in to review your cold email drafts and sent letters.",
};

function AuthCardFallback() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center px-4 py-8 sm:px-6 sm:py-12">
      <div className="w-full max-w-sm flex items-center justify-center p-12">
        <Loader2 className="h-6 w-6 animate-spin text-seal" />
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<AuthCardFallback />}>
      <AuthCard initialMode="signin" />
    </Suspense>
  );
}
