import type { UserUsage } from "@/lib/types/database";
import { FREE_MONTHLY_LIMIT, DAILY_SAFETY_LIMIT } from "@/lib/constants/plans";
import type { SupabaseClient } from "@supabase/supabase-js";

export interface UserSendCounts {
  monthlySends: number;
  dailySends: number;
  isMonthlyCapped: boolean;
  isDailySafetyCapped: boolean;
}

/**
 * Queries monthly and 24-hour sent email counts for a user in parallel.
 * Calculates UTC start-of-month and rolling 24-hour timestamps.
 */
export async function getUserSendCounts(
  supabase: SupabaseClient,
  userId: string,
  plan: "free" | "pro" = "free"
): Promise<UserSendCounts> {
  const now = new Date();
  const startOfMonth = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)
  ).toISOString();
  const past24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  const [monthlyResult, dailyResult] = await Promise.all([
    supabase
      .from("sent_emails")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("status", "sent")
      .gte("created_at", startOfMonth),
    supabase
      .from("sent_emails")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("status", "sent")
      .gte("created_at", past24Hours),
  ]);

  const monthlySends = monthlyResult.count ?? 0;
  const dailySends = dailyResult.count ?? 0;

  return {
    monthlySends,
    dailySends,
    isMonthlyCapped: plan === "free" && monthlySends >= FREE_MONTHLY_LIMIT,
    isDailySafetyCapped: dailySends >= DAILY_SAFETY_LIMIT,
  };
}

/**
 * Returns true if the user is on the Pro membership.
 */
export function isProPlan(usage: UserUsage | null | undefined): boolean {
  return usage?.plan === "pro";
}

/**
 * Determines whether a free-tier user has exhausted their monthly allowance of letters.
 */
export function isMonthlyCapped(usage: UserUsage | null | undefined): boolean {
  if (!usage || usage.plan === "pro") return false;
  const limit = usage.monthlyLimit ?? FREE_MONTHLY_LIMIT;
  return usage.monthlySends >= limit;
}

/**
 * Determines whether the user has hit Google's safe daily sending ceiling (50 sends / 24 hours).
 */
export function isDailySafetyCapped(usage: UserUsage | null | undefined): boolean {
  if (!usage) return false;
  const sends = usage.dailySends;
  const limit = usage.dailyLimit ?? DAILY_SAFETY_LIMIT;
  return typeof sends === "number" && sends >= limit;
}

/**
 * Returns remaining sends for the current monthly billing/calendar window.
 * Returns null for Pro users (unlimited).
 */
export function getRemainingMonthlySends(usage: UserUsage | null | undefined): number | null {
  if (!usage || usage.plan === "pro") return null;
  const limit = usage.monthlyLimit ?? FREE_MONTHLY_LIMIT;
  return Math.max(0, limit - (usage.monthlySends ?? 0));
}

/**
 * Returns progress percentage (0 - 100) towards monthly allowance.
 */
export function getMonthlyQuotaPercent(usage: UserUsage | null | undefined): number {
  if (!usage || usage.plan === "pro") return 0;
  const limit = usage.monthlyLimit ?? FREE_MONTHLY_LIMIT;
  if (limit <= 0) return 100;
  return Math.min(100, Math.max(0, Math.round(((usage.monthlySends ?? 0) / limit) * 100)));
}
