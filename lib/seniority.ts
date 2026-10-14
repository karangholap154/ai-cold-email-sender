/**
 * Seniority Level Classification Engine
 * Detects career stage (Senior/Lead, Mid-Level, Junior/Entry) from job titles.
 */

export type SeniorityLevel = "all" | "senior" | "mid" | "junior";

export interface SeniorityInfo {
  level: "senior" | "mid" | "junior";
  label: string;
  badgeLabel: string;
}

const SENIOR_REGEX =
  /\b(senior|sr\.?|lead|staff|principal|architect|head\s+of|director|vp|team\s+lead|tech\s+lead|engineering\s+manager|group\s+lead|distinguished)\b/i;

const JUNIOR_REGEX =
  /\b(junior|jr\.?|entry[\s-]level|associate|intern|internship|graduate|early[\s-]career|trainee|apprentice)\b/i;

/**
 * Classifies a job opening into a standardized seniority tier based on its title
 */
export function detectSeniority(title?: string | null): SeniorityInfo {
  if (!title) {
    return { level: "mid", label: "Mid-Level", badgeLabel: "Mid-Level" };
  }

  // Priority 1: Junior/Entry-level (checked first to avoid "Junior Lead" edge cases)
  if (JUNIOR_REGEX.test(title)) {
    return { level: "junior", label: "Junior / Entry", badgeLabel: "Junior / Entry" };
  }

  // Priority 2: Senior/Lead/Staff/Principal
  if (SENIOR_REGEX.test(title)) {
    return { level: "senior", label: "Senior / Lead", badgeLabel: "Senior" };
  }

  // Default: Standard Mid-Level (roles like "Software Engineer", "Full Stack Developer", etc.)
  return { level: "mid", label: "Mid-Level", badgeLabel: "Mid-Level" };
}
