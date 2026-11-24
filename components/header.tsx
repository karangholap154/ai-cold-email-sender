"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import {
  LogOut,
  PenLine,
  Mail,
  Settings as SettingsIcon,
  Menu,
  X,
  Sparkles,
  Briefcase,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";
import { FREE_MONTHLY_LIMIT } from "@/lib/constants/plans";

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [plan, setPlan] = useState<"free" | "pro">("free");
  const [pendingFollowUpCount, setPendingFollowUpCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const supabase = createClient();

    const fetchUserPlanAndOutreach = async () => {
      try {
        const [profileRes, emailsRes] = await Promise.all([
          fetch("/api/profile"),
          fetch("/api/emails"),
        ]);

        if (profileRes.ok) {
          const data = await profileRes.json();
          if (data?.profile?.plan) {
            setPlan(data.profile.plan);
          }
        }

        if (emailsRes.ok) {
          const data = await emailsRes.json();
          if (Array.isArray(data?.emails)) {
            const fiveDaysAgo = Date.now() - 5 * 24 * 60 * 60 * 1000;
            // Count initial sent emails older than 5 days that are not responded and not already followed up
            const emails = data.emails;
            const parentIdsWithFollowUps = new Set(
              emails
                .filter((e: { email_type?: string; parent_email_id?: string | null }) => e.email_type === "followup" && e.parent_email_id)
                .map((e: { parent_email_id: string }) => e.parent_email_id)
            );

            const pending = emails.filter((e: {
              id: string;
              status: string;
              email_type?: string;
              is_responded?: boolean;
              created_at: string;
            }) => {
              if (e.status !== "sent" || e.email_type === "followup" || e.is_responded) return false;
              if (parentIdsWithFollowUps.has(e.id)) return false;
              return new Date(e.created_at).getTime() <= fiveDaysAgo;
            }).length;

            setPendingFollowUpCount(pending);
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
        fetchUserPlanAndOutreach();
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
        fetchUserPlanAndOutreach();
      } else {
        setPlan("free");
        setPendingFollowUpCount(0);
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
    setMobileMenuOpen(false);
    router.push("/login");
    router.refresh();
  };

  const navLinks = [
    { href: "/jobs", label: "Jobs", icon: Briefcase },
    { href: "/draft", label: "Draft", icon: PenLine },
    { href: "/log", label: "Sent letters", icon: Mail },
    { href: "/settings", label: "Settings", icon: SettingsIcon },
  ];

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-hairline/80 bg-paper/85 backdrop-blur-md transition-all duration-200">
        <div className="mx-auto flex h-14 sm:h-16 max-w-5xl items-center justify-between px-4 sm:px-6">
          {/* Left: Brand Identity */}
          <div className="flex items-center gap-6 md:gap-8">
            <Link
              href="/"
              className="group flex items-center gap-2.5 transition-transform active:scale-95"
            >
              <div className="relative flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-sm transition-transform group-hover:scale-105">
                <Image
                  src="/logo.png"
                  alt="Vina logo"
                  width={28}
                  height={28}
                  className="h-6 w-6 sm:h-7 sm:w-7 object-contain"
                  priority
                />
              </div>
              <span className="font-heading text-lg sm:text-xl font-medium tracking-tight text-ink">
                Vina
              </span>
            </Link>

            {/* Desktop / Tablet Navigation Pills */}
            {user ? (
              <nav className="hidden md:flex items-center gap-1 rounded-full border border-hairline/70 bg-paper/60 p-1 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
                {navLinks.map((link) => {
                  const isActive = pathname === link.href;
                  const Icon = link.icon;
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-full transition-all duration-150 relative ${
                        isActive
                          ? "bg-ink text-paper shadow-xs font-semibold"
                          : "text-muted-ink hover:text-ink hover:bg-black/5"
                      }`}
                    >
                      <Icon className="h-3.5 w-3.5 shrink-0" />
                      <span>{link.label}</span>
                      {link.href === "/log" && pendingFollowUpCount > 0 && (
                        <span className={`inline-flex items-center justify-center px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                          isActive
                            ? "bg-amber-400 text-ink"
                            : "bg-amber-500/20 text-amber-800 border border-amber-400/40"
                        }`}>
                          {pendingFollowUpCount}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </nav>
            ) : (
              <nav className="hidden md:flex items-center gap-1">
                <Link
                  href="/tools"
                  className={`inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-full transition-all duration-150 ${
                    pathname.startsWith("/tools")
                      ? "bg-ink text-paper font-semibold"
                      : "text-muted-ink hover:text-ink hover:bg-black/5"
                  }`}
                >
                  <Sparkles className="h-3.5 w-3.5 text-seal" />
                  <span>Free Tools</span>
                </Link>
              </nav>
            )}
          </div>

          {/* Right side: User Profile / Auth Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            {!isLoading && user ? (
              <>
                {/* User chip on desktop & tablet */}
                <div className="hidden sm:flex items-center gap-2 rounded-full border border-hairline bg-[#FAF9F5] pl-2.5 pr-3 py-1 text-xs shadow-xs">
                  <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-ink/10 text-[10px] font-semibold text-ink uppercase">
                    {user.email ? user.email.charAt(0) : "U"}
                  </div>
                  <span className="truncate max-w-[130px] lg:max-w-[170px] text-ink font-medium font-mono text-[11px]">
                    {user.email}
                  </span>
                  {plan === "pro" ? (
                    <span className="inline-flex items-center gap-1 rounded-full border border-seal/40 bg-seal/10 px-2 py-0.5 text-[9px] font-semibold text-seal uppercase tracking-wider">
                      <Sparkles className="h-2.5 w-2.5" />
                      Pro
                    </span>
                  ) : (
                    <span className="rounded-full border border-hairline bg-paper px-2 py-0.5 text-[9px] font-medium text-muted-ink uppercase tracking-wider">
                      Free
                    </span>
                  )}
                </div>

                {/* Sign out desktop button */}
                <button
                  onClick={handleSignOut}
                  title="Sign out"
                  className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-hairline px-3 py-1.5 text-xs font-medium text-muted-ink hover:text-ink hover:bg-[#FAF9F5] transition-all cursor-pointer"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  <span>Sign out</span>
                </button>

                {/* Mobile Hamburger Toggle */}
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
                  className="md:hidden inline-flex h-9 w-9 items-center justify-center rounded-md border border-hairline bg-paper text-ink hover:bg-[#FAF9F5] transition-colors cursor-pointer"
                >
                  {mobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
                </button>
              </>
            ) : !isLoading && !user && pathname !== "/login" ? (
              <div className="flex items-center gap-2">
                <Link
                  href="/tools"
                  className="md:hidden rounded-full px-2.5 py-1 text-xs font-medium text-muted-ink hover:text-ink"
                >
                  Tools
                </Link>
                <Link
                  href="/login"
                  className="rounded-full px-3.5 py-1.5 text-xs font-medium text-muted-ink hover:text-ink transition-colors"
                >
                  Sign in
                </Link>
                <Link
                  href="/login?mode=signup"
                  className="rounded-full border border-ink bg-ink px-4 py-1.5 text-xs font-medium text-paper hover:bg-ink/90 active:scale-95 transition-all shadow-xs shrink-0"
                >
                  Create account
                </Link>
              </div>
            ) : null}
          </div>
        </div>

        {/* Mobile Dropdown Menu Drawer */}
        {user && mobileMenuOpen && (
          <div className="md:hidden border-t border-hairline bg-paper/95 backdrop-blur-md px-4 py-4 space-y-3 animate-in fade-in-50 slide-in-from-top-2 duration-200">
            {/* User status info for mobile */}
            <div className="flex items-center justify-between rounded-md border border-hairline bg-[#FAF9F5] p-3 text-xs">
              <div className="flex items-center gap-2 min-w-0">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-ink/10 text-xs font-medium text-ink uppercase">
                  {user.email ? user.email.charAt(0) : "U"}
                </div>
                <div className="min-w-0">
                  <p className="truncate font-mono text-[11px] font-medium text-ink">
                    {user.email}
                  </p>
                  <p className="text-[10px] text-muted-ink">
                    {plan === "pro" ? "Pro Plan • Unlimited letters" : `Free Tier • ${FREE_MONTHLY_LIMIT} letters / mo`}
                  </p>
                </div>
              </div>
              {plan === "pro" ? (
                <span className="inline-flex items-center gap-1 rounded-full border border-seal/40 bg-seal/10 px-2 py-0.5 text-[9px] font-semibold text-seal uppercase tracking-wider">
                  <Sparkles className="h-2.5 w-2.5" />
                  Pro
                </span>
              ) : (
                <Link
                  href="/settings?tab=billing"
                  className="rounded-full border border-seal/40 bg-seal/10 px-2 py-0.5 text-[10px] font-medium text-seal hover:bg-seal/20 transition-colors"
                >
                  Upgrade
                </Link>
              )}
            </div>

            {/* Navigation links for mobile drawer */}
            <div className="space-y-1">
              {navLinks.map((link) => {
                const isActive = pathname === link.href;
                const Icon = link.icon;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center justify-between rounded-md px-3 py-2.5 text-xs font-medium transition-colors ${
                      isActive
                        ? "bg-ink text-paper font-semibold shadow-xs"
                        : "text-muted-ink hover:text-ink hover:bg-[#FAF9F5]"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="h-4 w-4" />
                      <span>{link.label}</span>
                    </div>
                    {link.href === "/log" && pendingFollowUpCount > 0 && (
                      <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                        {pendingFollowUpCount} pending
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>

            {/* Sign out link */}
            <div className="pt-2 border-t border-hairline">
              <button
                type="button"
                onClick={handleSignOut}
                className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-xs font-medium text-muted-ink hover:text-ink hover:bg-[#FAF9F5] transition-colors cursor-pointer"
              >
                <LogOut className="h-4 w-4" />
                <span>Sign out</span>
              </button>
            </div>
          </div>
        )}
      </header>

      {/* Floating Modern Mobile Bottom Dock for instant navigation between tabs */}
      {user && (
        <nav
          aria-label="Mobile Navigation"
          className="md:hidden fixed bottom-3 left-4 right-4 z-40 flex items-center justify-around rounded-full border border-hairline/80 bg-paper/90 px-3 py-2 shadow-[0_8px_24px_rgba(0,0,0,0.08)] backdrop-blur-md"
        >
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`relative flex flex-col items-center gap-0.5 px-3 py-1 rounded-full text-[10px] font-medium transition-all ${
                  isActive
                    ? "text-ink font-semibold"
                    : "text-muted-ink hover:text-ink"
                }`}
              >
                <Icon className={`h-4 w-4 transition-transform ${isActive ? "scale-110" : ""}`} />
                <span>{link.label}</span>
                {isActive && (
                  <span className="absolute -bottom-1 h-1 w-1 rounded-full bg-ink" />
                )}
              </Link>
            );
          })}
        </nav>
      )}
    </>
  );
}
