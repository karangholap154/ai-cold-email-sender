import type { UserPlan } from "@/lib/types/database";

export interface PlanFeature {
  text: string;
  isHighlight?: boolean;
}

export interface PlanConfig {
  id: UserPlan;
  name: string;
  badge?: string;
  priceUsd: number;
  priceInr: number;
  priceFormatted: string;
  periodText: string;
  description: string;
  monthlyLimit: number | null; // null represents unlimited
  resumeLimit: number;
  maxRegenerationsPerDraft: number | null; // null represents unlimited
  retentionDays: number | null; // null represents full lifetime archive
  allowFollowUps: boolean;
  features: PlanFeature[];
}

export const FREE_MONTHLY_LIMIT = 5;
export const FREE_REGEN_LIMIT = 2;
export const FREE_RESUME_LIMIT = 1;
export const PRO_RESUME_LIMIT = 3;
export const FREE_RETENTION_DAYS = 30;

export const PLANS: Record<UserPlan, PlanConfig> = {
  free: {
    id: "free",
    name: "Free",
    priceUsd: 0,
    priceInr: 0,
    priceFormatted: "$0",
    periodText: "/ month",
    description: "Ideal for testing Vina with your top target positions.",
    monthlyLimit: FREE_MONTHLY_LIMIT,
    resumeLimit: FREE_RESUME_LIMIT,
    maxRegenerationsPerDraft: FREE_REGEN_LIMIT,
    retentionDays: FREE_RETENTION_DAYS,
    allowFollowUps: false,
    features: [
      { text: `${FREE_MONTHLY_LIMIT} tailored letters per month` },
      { text: `${FREE_RESUME_LIMIT} active résumé PDF` },
      { text: `${FREE_REGEN_LIMIT} AI regenerations per draft` },
      { text: "Duplicate contact warning" },
      { text: `${FREE_RETENTION_DAYS}-day sent letters history` },
    ],
  },
  pro: {
    id: "pro",
    name: "Pro",
    badge: "Active Job Search",
    priceUsd: 9,
    priceInr: 499,
    priceFormatted: "$9",
    periodText: "(₹499) / mo",
    description: "For job seekers conducting active outreach with one-click follow-ups.",
    monthlyLimit: null,
    resumeLimit: PRO_RESUME_LIMIT,
    maxRegenerationsPerDraft: null,
    retentionDays: null,
    allowFollowUps: true,
    features: [
      { text: "Unlimited tailored letters", isHighlight: true },
      { text: "One-click follow-up letters in same thread" },
      { text: "Unlimited AI regenerations" },
      { text: "Full lifetime sent letters history" },
      { text: "Fast generation & priority email support" },
    ],
  },
};

export const FREE_PLAN = PLANS.free;
export const PRO_PLAN = PLANS.pro;
