import type { UserUsage } from "@/lib/types/database";
import { FREE_MONTHLY_LIMIT, DAILY_SAFETY_LIMIT } from "@/lib/constants/plans";

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
