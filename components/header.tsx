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
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();

    // Check active session
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      setIsLoading(false);
    });

    // Subscribe to auth state updates
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
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
    <header className="border-b border-hairline bg-paper">
      <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-4">
        <Link
          href="/"
          className="font-heading text-xl text-ink tracking-tight hover:opacity-90 transition-opacity"
        >
          Cold email
        </Link>

        {/* Center / Left Navigation for logged in users */}
        {user && (
          <nav className="hidden sm:flex items-center gap-6 text-sm">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`transition-colors ${
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
        <div className="flex items-center gap-4 text-xs">
          {!isLoading && user ? (
            <div className="flex items-center gap-3">
              <div className="hidden md:flex items-center gap-1.5 text-muted-ink">
                <span className="truncate max-w-[160px] text-ink font-medium">
                  {user.email}
                </span>
                <span className="rounded-sm border border-hairline px-1.5 py-0.5 text-[10px] text-muted-ink uppercase tracking-wider">
                  Free
                </span>
              </div>
              <button
                onClick={handleSignOut}
                title="Sign out"
                className="inline-flex items-center gap-1 text-muted-ink hover:text-ink transition-colors py-1 px-2 border border-transparent hover:border-hairline rounded-sm"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Sign out</span>
              </button>
            </div>
          ) : !isLoading && !user && pathname !== "/login" && pathname !== "/signup" ? (
            <div className="flex items-center gap-3">
              <Link
                href="/login"
                className="text-muted-ink hover:text-ink transition-colors"
              >
                Sign in
              </Link>
              <Link
                href="/signup"
                className="rounded-sm border border-hairline bg-ink px-3 py-1 text-xs font-medium text-paper hover:bg-ink/90 transition-colors"
              >
                Create account
              </Link>
            </div>
          ) : null}
        </div>
      </div>

      {/* Mobile navigation bar when logged in */}
      {user && (
        <div className="sm:hidden border-t border-hairline px-6 py-2.5 flex items-center justify-around text-xs">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={
                  isActive
                    ? "font-medium text-ink"
                    : "text-muted-ink hover:text-ink"
                }
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
