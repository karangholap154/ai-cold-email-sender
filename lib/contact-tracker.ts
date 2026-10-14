/**
 * Contact Tracker & Role Semantic Matching Utility
 * Cross-references job openings with past sent outreach emails.
 */

import type { JobPosting } from "@/lib/types/job";

export interface SentEmailSummary {
  id: string;
  hr_email: string;
  role_title?: string | null;
  company_name?: string | null;
  created_at: string;
  status?: string;
}

export type JobContactStatus =
  | {
      type: "applied_this_role";
      date: string;
      emailId: string;
      roleTitle: string;
    }
  | {
      type: "contacted_recruiter_other_role";
      date: string;
      emailId: string;
      otherRole: string;
    };

// Noise words and seniority prefixes to strip for normalized matching
const NOISE_WORDS = new RegExp(
  "\\b(senior|sr\\.?|junior|jr\\.?|lead|staff|principal|head of|director|vp|intern|internship|associate|entry level|mid level|full stack|fullstack)\\b",
  "gi"
);

/**
 * Normalizes role title by removing seniority prefixes and standardizing synonyms
 */
export function normalizeRoleTitle(title?: string | null): string {
  if (!title) return "";

  return title
    .toLowerCase()
    .replace(NOISE_WORDS, "")
    .replace(/\b(developer|programmer)\b/g, "engineer")
    .replace(/\bfront[\s-]?end\b/g, "frontend")
    .replace(/\bback[\s-]?end\b/g, "backend")
    .replace(/[^a-z0-9]/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

/**
 * Determines whether two job titles refer to the same functional role
 */
export function isRoleMatch(jobTitle: string, sentTitle?: string | null): boolean {
  if (!jobTitle || !sentTitle) return false;

  const normJob = normalizeRoleTitle(jobTitle);
  const normSent = normalizeRoleTitle(sentTitle);

  if (!normJob || !normSent) return false;

  // Exact normalized match
  if (normJob === normSent) return true;

  // Substring match: e.g. "software engineer" vs "software engineer ii"
  if (normJob.includes(normSent) || normSent.includes(normJob)) return true;

  // Word token overlap (e.g. "frontend" and "engineer")
  const jobTokens = new Set(normJob.split(" ").filter((t) => t.length > 2));
  const sentTokens = normSent.split(" ").filter((t) => t.length > 2);

  if (jobTokens.size === 0 || sentTokens.length === 0) return false;

  let commonTokens = 0;
  for (const token of sentTokens) {
    if (jobTokens.has(token)) commonTokens++;
  }

  // If at least 50% of the significant words match
  const minTokens = Math.min(jobTokens.size, sentTokens.length);
  return commonTokens >= Math.max(1, Math.ceil(minTokens * 0.5));
}

/**
 * Determines whether the user has already contacted the recruiter for this role or another role
 */
export function getJobContactStatus(
  job: JobPosting,
  sentEmails: SentEmailSummary[]
): JobContactStatus | null {
  if (!job.contactEmail || !Array.isArray(sentEmails) || sentEmails.length === 0) {
    return null;
  }

  const jobEmail = job.contactEmail.trim().toLowerCase();

  // Find all emails sent to this recruiter (case-insensitive)
  const matchingEmails = sentEmails.filter(
    (sent) => sent.hr_email && sent.hr_email.trim().toLowerCase() === jobEmail
  );

  if (matchingEmails.length === 0) {
    return null;
  }

  // 1. Check if user already applied for THIS specific role
  const sameRoleEmail = matchingEmails.find((sent) =>
    isRoleMatch(job.title, sent.role_title)
  );

  if (sameRoleEmail) {
    return {
      type: "applied_this_role",
      date: sameRoleEmail.created_at,
      emailId: sameRoleEmail.id,
      roleTitle: sameRoleEmail.role_title || job.title,
    };
  }

  // 2. Otherwise, user emailed this recruiter for a different role
  const recentOther = matchingEmails[0];
  return {
    type: "contacted_recruiter_other_role",
    date: recentOther.created_at,
    emailId: recentOther.id,
    otherRole: recentOther.role_title || "another opening",
  };
}
