import type { JobPosting } from "@/lib/types/job";

export interface MatchResult {
  score: number;
  matchedSkills: string[];
}

/**
 * Dynamically computes alignment score and matching skills between a job posting
 * and the candidate's manually defined skills list.
 */
export function calculateJobMatch(
  job: Pick<JobPosting, "title" | "skills" | "description">,
  userSkills: string[]
): MatchResult {
  if (!userSkills || userSkills.length === 0) {
    return { score: 0, matchedSkills: [] };
  }

  const matchedSet = new Set<string>();
  let titleBonus = 0;
  let tagBonus = 0;

  const jobTitle = (job.title || "").toLowerCase();
  const jobDescription = (job.description || "").toLowerCase();
  const jobTags = (job.skills || []).map((s) => s.toLowerCase());

  for (const skill of userSkills) {
    const sLower = skill.toLowerCase();
    // Escape special regex characters (like C++, Node.js, C#, etc.)
    const escaped = skill.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
    const skillRegex = new RegExp(`(^|[^a-zA-Z0-9])${escaped}([^a-zA-Z0-9]|$)`, "i");

    const matchesTitle = skillRegex.test(jobTitle);
    const matchesTags = jobTags.some((t) => t.includes(sLower) || sLower.includes(t));
    const matchesDesc = skillRegex.test(jobDescription);

    if (matchesTitle || matchesTags || matchesDesc) {
      matchedSet.add(skill);

      if (matchesTitle) titleBonus += 15;
      if (matchesTags) tagBonus += 10;
    }
  }

  const matchedSkills = Array.from(matchedSet);
  if (matchedSkills.length === 0) {
    return { score: 45, matchedSkills: [] };
  }

  // Calculate percentage: base of 55 + ratio of skills matched + bonus for title/tag matches
  const matchRatio = Math.min(1, matchedSkills.length / Math.min(userSkills.length, 6));
  let calculatedScore = 55 + Math.round(matchRatio * 30) + Math.min(15, titleBonus + tagBonus);

  // Cap score reasonably between 60% and 98%
  calculatedScore = Math.max(60, Math.min(98, calculatedScore));

  return {
    score: calculatedScore,
    matchedSkills: matchedSkills.slice(0, 5), // top 5 matching skills
  };
}
