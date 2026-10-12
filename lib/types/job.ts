export type JobSource = "Hacker News" | "Arbeitnow" | "Company ATS";

export interface JobPosting {
  id: string;
  title: string;
  company: string;
  companyUrl?: string;
  location: string;
  isRemote: boolean;
  postedAt: string;
  description: string;
  skills: string[];
  contactEmail: string | null;
  applyUrl: string;
  source: JobSource;
}

export interface JobsResponse {
  jobs: JobPosting[];
  total: number;
  sources: string[];
  fetchedAt: string;
}

export type JobFilter = "all" | "email" | "remote" | "hn" | "arbeitnow";
