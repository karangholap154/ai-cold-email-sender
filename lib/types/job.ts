export type JobSource = "Hacker News" | "Arbeitnow" | "Remotive" | "Company ATS";

export interface JobPosting {
  id: string;
  title: string;
  company: string;
  companyUrl?: string;
  location: string;
  isRemote: boolean;
  salary?: string;
  postedAt: string;
  description: string;
  skills: string[];
  contactEmail: string | null;
  applyUrl: string;
  source: JobSource;
  matchScore?: number;
  matchedSkills?: string[];
}

export interface JobsResponse {
  jobs: JobPosting[];
  total: number;
  sources: string[];
  fetchedAt: string;
}

export type JobFilter = "all" | "email" | "remote" | "hn" | "arbeitnow" | "remotive";
