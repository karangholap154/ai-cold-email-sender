"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LogOut, User as UserIcon } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [plan, setPlan] = useState<"free" | "pro">("free");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();

    const fetchUserPlan = async () => {
      try {
        const res = await fetch("/api/profile");
        if (res.ok) {
          const data = await res.json();
          if (data?.profile?.plan) {
            setPlan(data.profile.plan);
          }
        }
      } catch {
        // Fallback to default
      }
    };

    // Check active session
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      if (user) {
        fetchUserPlan();
      }
      setIsLoading(false);
    });

    // Subscribe to auth state updates
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      if (currentUser) {
        fetchUserPlan();
      } else {
        setPlan("free");
      }
      setIsLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  const navLinks = [
    { href: "/draft", label: "Draft" },
    { href: "/log", label: "Send Log" },
    { href: "/settings", label: "Settings & Resume" },
  ];

  return (
    <header className="border-b border-hairline bg-paper sticky top-0 z-30">
      <div className="mx-auto flex max-w-4xl items-center justify-between px-4 sm:px-6 py-3 sm:py-4">
        <Link
          href="/"
          className="font-heading text-lg sm:text-xl text-ink tracking-tight hover:opacity-90 transition-opacity shrink-0"
        >
          Cold email
        </Link>

        {/* Center Navigation for logged-in users on tablet/desktop */}
        {user && (
          <nav className="hidden sm:flex items-center gap-6 text-sm">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`transition-colors py-1 ${
                    isActive
                      ? "font-medium text-ink underline underline-offset-8 decoration-hairline decoration-2"
                      : "text-muted-ink hover:text-ink"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>
        )}

        {/* Right side: Auth status */}
        <div className="flex items-center gap-2 sm:gap-4 text-xs">
          {!isLoading && user ? (
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="hidden sm:flex items-center gap-1.5 text-muted-ink">
                <span className="truncate max-w-[110px] md:max-w-[160px] text-ink font-medium">
                  {user.email}
                </span>
                {plan === "pro" ? (
                  <span className="rounded-sm border border-seal/40 bg-seal/10 text-seal px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider">
                    Pro
                  </span>
                ) : (
                  <span className="rounded-sm border border-hairline px-1.5 py-0.5 text-[10px] text-muted-ink uppercase tracking-wider">
                    Free
                  </span>
                )}
              </div>
              <button
                onClick={handleSignOut}
                title="Sign out"
                className="inline-flex items-center gap-1 text-muted-ink hover:text-ink transition-colors py-1.5 px-2 sm:px-2.5 border border-transparent hover:border-hairline rounded-sm cursor-pointer"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span className="text-[11px] sm:text-xs">Sign out</span>
              </button>
            </div>
          ) : !isLoading && !user && pathname !== "/login" && pathname !== "/signup" ? (
            <div className="flex items-center gap-2 sm:gap-3">
              <Link
                href="/login"
                className="text-muted-ink hover:text-ink transition-colors px-2 py-1 text-[11px] sm:text-xs"
              >
                Sign in
              </Link>
              <Link
                href="/signup"
                className="rounded-sm border border-hairline bg-ink px-2.5 sm:px-3 py-1 text-[11px] sm:text-xs font-medium text-paper hover:bg-ink/90 transition-colors shrink-0"
              >
                Create account
              </Link>
            </div>
          ) : null}
        </div>
      </div>

      {/* Mobile navigation bar when logged in */}
      {user && (
        <div className="sm:hidden border-t border-hairline px-3 py-2 flex items-center justify-around text-xs bg-paper">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`px-3 py-1.5 rounded-sm transition-colors ${
                  isActive
                    ? "font-medium text-ink bg-[#EDEAE2]"
                    : "text-muted-ink hover:text-ink"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </div>
      )}
    </header>
  );
}
