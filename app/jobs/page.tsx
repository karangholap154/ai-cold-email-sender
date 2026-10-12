"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Search,
  Mail,
  ExternalLink,
  PenLine,
  FileText,
  Briefcase,
  Globe,
  Loader2,
  RefreshCw,
  Sparkles,
  ChevronDown,
  ChevronUp,
  ArrowUpDown,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";
import type { JobPosting, JobFilter } from "@/lib/types/job";
import { calculateJobMatch } from "@/lib/matcher";

export const INCOMING_JOB_STORAGE_KEY = "vina_incoming_job";

export default function JobsPage() {
  const router = useRouter();
  const [jobs, setJobs] = useState<JobPosting[]>([]);
  const [userSkills, setUserSkills] = useState<string[]>([]);
  const [hasResume, setHasResume] = useState(false);
  const [sortBy, setSortBy] = useState<"match" | "newest">("match");

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<JobFilter>("all");
  const [expandedJobId, setExpandedJobId] = useState<string | null>(null);

  const fetchData = async (isManualRefresh = false) => {
    if (isManualRefresh) setIsRefreshing(true);
    else setIsLoading(true);

    try {
      const [jobsRes, profileRes] = await Promise.all([
        fetch("/api/jobs"),
        fetch("/api/profile"),
      ]);

      let skills: string[] = [];
      if (profileRes.ok) {
        const pData = await profileRes.json();
        if (Array.isArray(pData.profile?.skills) && pData.profile.skills.length > 0) {
          skills = pData.profile.skills;
        }
      }

      setUserSkills(skills);
      setHasResume(skills.length > 0);

      if (jobsRes.ok) {
        const data = await jobsRes.json();
        const rawJobs: JobPosting[] = data.jobs || [];

        // Score each job against user's resume skills
        const scoredJobs = rawJobs.map((j) => {
          if (skills.length > 0) {
            const match = calculateJobMatch(j, skills);
            return {
              ...j,
              matchScore: match.score,
              matchedSkills: match.matchedSkills,
            };
          }
          return j;
        });

        setJobs(scoredJobs);
        if (isManualRefresh) {
          toast.success("Job board refreshed with the latest postings.");
        }
      }
    } catch (err) {
      console.error("Failed to load jobs or resume:", err);
      toast.error("Could not load latest job postings. Please try again.");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Filtered and sorted jobs calculation
  const filteredJobs = useMemo(() => {
    let result = [...jobs];

    // Source and status filters
    if (activeFilter === "email") {
      result = result.filter((j) => Boolean(j.contactEmail));
    } else if (activeFilter === "remote") {
      result = result.filter((j) => j.isRemote);
    } else if (activeFilter === "hn") {
      result = result.filter((j) => j.source === "Hacker News");
    } else if (activeFilter === "arbeitnow") {
      result = result.filter((j) => j.source === "Arbeitnow");
    }

    // Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (j) =>
          j.title.toLowerCase().includes(q) ||
          j.company.toLowerCase().includes(q) ||
          j.location.toLowerCase().includes(q) ||
          j.skills.some((s) => s.toLowerCase().includes(q)) ||
          j.description.toLowerCase().includes(q)
      );
    }

    // Sorting: Best Match vs Newest
    if (sortBy === "match" && userSkills.length > 0) {
      result.sort((a, b) => {
        const scoreA = a.matchScore || 0;
        const scoreB = b.matchScore || 0;
        if (scoreB !== scoreA) {
          return scoreB - scoreA;
        }
        return new Date(b.postedAt).getTime() - new Date(a.postedAt).getTime();
      });
    } else {
      result.sort((a, b) => new Date(b.postedAt).getTime() - new Date(a.postedAt).getTime());
    }

    return result;
  }, [jobs, activeFilter, searchQuery, sortBy, userSkills]);

  // Counts for tabs
  const emailJobsCount = useMemo(
    () => jobs.filter((j) => Boolean(j.contactEmail)).length,
    [jobs]
  );
  const hnJobsCount = useMemo(
    () => jobs.filter((j) => j.source === "Hacker News").length,
    [jobs]
  );
  const arbeitnowJobsCount = useMemo(
    () => jobs.filter((j) => j.source === "Arbeitnow").length,
    [jobs]
  );
  const remoteJobsCount = useMemo(
    () => jobs.filter((j) => j.isRemote).length,
    [jobs]
  );

  const handleDraftWithJob = (job: JobPosting, mode: "email" | "note") => {
    try {
      sessionStorage.setItem(
        INCOMING_JOB_STORAGE_KEY,
        JSON.stringify({
          title: job.title,
          company: job.company,
          jdText: `${job.title} at ${job.company}\n\nLocation: ${job.location}\n\n${job.description}`,
          hrEmail: job.contactEmail || "",
          mode,
          timestamp: Date.now(),
        })
      );
      toast.info(`Preparing draft for ${job.title}...`);
      router.push("/draft");
    } catch (err) {
      console.error("Failed to store incoming job:", err);
      router.push("/draft");
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedJobId((prev) => (prev === id ? null : id));
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-paper py-8 sm:py-12">
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        {/* Header Section */}
        <div className="mb-8 flex flex-col md:flex-row md:items-end md:justify-between gap-4 border-b border-hairline/80 pb-6">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full border border-[#B8823A]/30 bg-[#B8823A]/10 px-2.5 py-0.5 text-[11px] font-medium tracking-wide text-[#8E632A] uppercase mb-3">
              <Sparkles className="h-3 w-3" />
              Live Opportunities
            </div>
            <h1 className="font-heading text-2xl sm:text-3xl font-normal tracking-tight text-ink">
              Curated Active Positions
            </h1>
            <p className="mt-1.5 text-xs sm:text-sm text-muted-ink max-w-2xl leading-relaxed">
              Real-time openings aggregated directly from tech leaders and applicant tracking systems.
              Ranked by alignment with your background.
            </p>
          </div>

          <button
            type="button"
            onClick={() => fetchData(true)}
            disabled={isLoading || isRefreshing}
            className="inline-flex items-center gap-1.5 self-start md:self-auto rounded-md border border-hairline bg-white/70 px-3 py-1.5 text-xs font-medium text-ink shadow-2xs hover:bg-white hover:border-ink/20 transition-all cursor-pointer disabled:opacity-50"
          >
            <RefreshCw
              className={`h-3.5 w-3.5 ${isRefreshing ? "animate-spin text-[#B8823A]" : ""}`}
            />
            <span>Refresh Feed</span>
          </button>
        </div>

        {/* Missing Skills Alert Banner */}
        {!hasResume && !isLoading && (
          <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-md border border-hairline/90 bg-[#FAF9F5] p-4 text-xs shadow-2xs">
            <div className="flex items-center gap-2.5 text-muted-ink">
              <Sparkles className="h-4 w-4 text-[#B8823A] shrink-0" />
              <span>
                Add your key skills in Settings to unlock personalized match scores and rank jobs by alignment.
              </span>
            </div>
            <Link
              href="/settings?tab=resume"
              className="inline-flex items-center gap-1 font-medium text-ink hover:underline shrink-0"
            >
              Manage Skills in Settings →
            </Link>
          </div>
        )}

        {/* Search & Filter Controls */}
        <div className="mb-6 space-y-4">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-ink" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by role, company, or tech stack (e.g. Next.js, Python, Lead)..."
              className="w-full rounded-md border border-hairline bg-white/80 pl-10 pr-4 py-2.5 text-xs sm:text-sm text-ink placeholder:text-muted-ink/60 focus:border-ink/40 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-ink/20 shadow-2xs transition-all"
            />
          </div>

          {/* Filter Tabs */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveFilter("all")}
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-all cursor-pointer ${
                activeFilter === "all"
                  ? "bg-ink text-paper shadow-xs font-semibold"
                  : "border border-hairline/80 bg-white/60 text-muted-ink hover:text-ink hover:bg-white"
              }`}
            >
              <Briefcase className="h-3 w-3" />
              <span>All Openings ({jobs.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveFilter("email")}
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-all cursor-pointer ${
                activeFilter === "email"
                  ? "bg-[#B8823A] text-white shadow-xs font-semibold"
                  : "border border-hairline/80 bg-white/60 text-muted-ink hover:text-ink hover:bg-white"
              }`}
            >
              <Mail className="h-3 w-3 text-[#B8823A]" />
              <span>Direct Outreach Available ({emailJobsCount})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveFilter("hn")}
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-all cursor-pointer ${
                activeFilter === "hn"
                  ? "bg-ink text-paper shadow-xs font-semibold"
                  : "border border-hairline/80 bg-white/60 text-muted-ink hover:text-ink hover:bg-white"
              }`}
            >
              <Sparkles className="h-3 w-3 text-[#B8823A]" />
              <span>Hacker News ({hnJobsCount})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveFilter("arbeitnow")}
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-all cursor-pointer ${
                activeFilter === "arbeitnow"
                  ? "bg-ink text-paper shadow-xs font-semibold"
                  : "border border-hairline/80 bg-white/60 text-muted-ink hover:text-ink hover:bg-white"
              }`}
            >
              <ExternalLink className="h-3 w-3" />
              <span>Arbeitnow Portals ({arbeitnowJobsCount})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveFilter("remote")}
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-all cursor-pointer ${
                activeFilter === "remote"
                  ? "bg-ink text-paper shadow-xs font-semibold"
                  : "border border-hairline/80 bg-white/60 text-muted-ink hover:text-ink hover:bg-white"
              }`}
            >
              <Globe className="h-3 w-3" />
              <span>Remote Only ({remoteJobsCount})</span>
            </button>
          </div>

          {/* Sort bar & Results count */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-hairline/60">
            <span className="text-[11px] text-muted-ink">
              Showing {filteredJobs.length} {filteredJobs.length === 1 ? "position" : "positions"}
            </span>

            {userSkills.length > 0 && (
              <div className="flex items-center gap-1.5 text-xs">
                <span className="text-muted-ink text-[11px]">Rank by:</span>
                <button
                  type="button"
                  onClick={() => setSortBy("match")}
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-sm text-[11px] font-medium transition-all cursor-pointer ${
                    sortBy === "match"
                      ? "bg-[#B8823A]/15 text-[#8E632A] font-semibold border border-[#B8823A]/30"
                      : "text-muted-ink hover:text-ink"
                  }`}
                >
                  <Sparkles className="h-3 w-3 text-[#B8823A]" />
                  <span>Best Match</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSortBy("newest")}
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-sm text-[11px] font-medium transition-all cursor-pointer ${
                    sortBy === "newest"
                      ? "bg-black/10 text-ink font-semibold"
                      : "text-muted-ink hover:text-ink"
                  }`}
                >
                  <ArrowUpDown className="h-3 w-3" />
                  <span>Newest</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Job Listings List */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Loader2 className="h-6 w-6 animate-spin text-[#B8823A] mb-3" />
            <p className="font-heading text-base font-normal text-ink">
              Gathering active opportunities...
            </p>
            <p className="mt-1 text-xs text-muted-ink">
              Scanning verified tech listings and scoring alignment against your background.
            </p>
          </div>
        ) : filteredJobs.length === 0 ? (
          <div className="rounded-md border border-dashed border-hairline bg-white/40 p-12 text-center">
            <Briefcase className="mx-auto h-8 w-8 text-muted-ink/50 mb-3" />
            <h3 className="font-heading text-lg font-normal text-ink">
              No matching positions found
            </h3>
            <p className="mt-1 text-xs sm:text-sm text-muted-ink max-w-md mx-auto">
              We couldn&apos;t find any active listings matching your current search query or filter.
            </p>
            {(searchQuery || activeFilter !== "all") && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  setActiveFilter("all");
                }}
                className="mt-4 inline-flex items-center gap-1.5 rounded-md border border-hairline bg-white px-3 py-1.5 text-xs font-medium text-ink shadow-2xs hover:border-ink/20 transition-all cursor-pointer"
              >
                Clear Filters
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredJobs.map((job) => {
              const isExpanded = expandedJobId === job.id;
              const hasEmail = Boolean(job.contactEmail);
              const hasMatchScore =
                userSkills.length > 0 &&
                typeof job.matchScore === "number" &&
                job.matchScore >= 60;

              return (
                <div
                  key={job.id}
                  className="group rounded-md border border-hairline/90 bg-white/70 p-5 sm:p-6 shadow-[0_1px_3px_rgba(0,0,0,0.02)] hover:border-ink/25 hover:bg-white transition-all duration-200"
                >
                  {/* Top Meta & Badges */}
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="font-heading text-lg sm:text-xl font-medium text-ink">
                          {job.title}
                        </h2>
                        {job.isRemote && (
                          <span className="inline-flex items-center rounded-sm bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700 border border-emerald-200/60">
                            Remote
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-ink">
                        <span className="font-medium text-ink/80">{job.company}</span>
                        <span>•</span>
                        <span>{job.location}</span>
                        <span>•</span>
                        <span>via {job.source}</span>
                      </div>
                    </div>

                    {/* Right Badges: Match Score & Contact status */}
                    <div className="flex flex-wrap items-center gap-2">
                      {hasMatchScore && (
                        <div className="inline-flex items-center gap-1.5 rounded-full border border-[#B8823A]/30 bg-[#B8823A]/10 px-2.5 py-1 text-[11px] font-semibold text-[#8E632A]">
                          <Sparkles className="h-3 w-3 text-[#B8823A]" />
                          <span>{job.matchScore}% Match</span>
                        </div>
                      )}

                      {hasEmail ? (
                        <div className="inline-flex items-center gap-1.5 rounded-full border border-[#B8823A]/30 bg-[#B8823A]/10 px-2.5 py-1 text-[11px] font-medium text-[#8E632A]">
                          <Mail className="h-3 w-3 text-[#B8823A]" />
                          <span>Direct: {job.contactEmail}</span>
                        </div>
                      ) : (
                        <div className="inline-flex items-center gap-1.5 rounded-full border border-stone-200 bg-stone-100/70 px-2.5 py-1 text-[11px] font-medium text-stone-600">
                          <ExternalLink className="h-3 w-3 text-stone-500" />
                          <span>Official Portal</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Skills tags */}
                  {job.skills && job.skills.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {job.skills.map((skill) => (
                        <span
                          key={skill}
                          className="rounded-xs border border-hairline/70 bg-[#FAF9F5] px-2 py-0.5 text-[11px] text-muted-ink"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Matched skills highlight */}
                  {job.matchedSkills && job.matchedSkills.length > 0 && (
                    <div className="mt-2.5 flex flex-wrap items-center gap-1.5 text-[11px]">
                      <span className="text-muted-ink">Matches your résumé:</span>
                      {job.matchedSkills.map((skill) => (
                        <span
                          key={skill}
                          className="inline-flex items-center gap-0.5 rounded-xs border border-[#B8823A]/25 bg-[#B8823A]/8 px-1.5 py-0.5 font-medium text-[#8E632A]"
                        >
                          <CheckCircle2 className="h-2.5 w-2.5" />
                          <span>{skill}</span>
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Description preview / expandable */}
                  <div className="mt-3 text-xs sm:text-sm text-ink/80 leading-relaxed">
                    <p className={isExpanded ? "whitespace-pre-line" : "line-clamp-2"}>
                      {job.description}
                    </p>
                    <button
                      type="button"
                      onClick={() => toggleExpand(job.id)}
                      className="mt-1.5 inline-flex items-center gap-1 text-[11px] font-medium text-muted-ink hover:text-ink transition-colors cursor-pointer"
                    >
                      {isExpanded ? (
                        <>
                          <span>Show less</span>
                          <ChevronUp className="h-3 w-3" />
                        </>
                      ) : (
                        <>
                          <span>Read full posting</span>
                          <ChevronDown className="h-3 w-3" />
                        </>
                      )}
                    </button>
                  </div>

                  {/* Dual Action Footer */}
                  <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-hairline/60 pt-4">
                    <div className="text-[11px] text-muted-ink">
                      Posted {new Date(job.postedAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                    </div>

                    <div className="flex items-center gap-2">
                      {hasEmail ? (
                        <>
                          {/* Case A: Direct Outreach Available */}
                          <a
                            href={job.applyUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 rounded-md border border-hairline bg-white px-3 py-1.5 text-xs font-medium text-muted-ink hover:text-ink hover:border-ink/20 transition-all"
                          >
                            <ExternalLink className="h-3 w-3" />
                            <span>View Source</span>
                          </a>

                          <button
                            type="button"
                            onClick={() => handleDraftWithJob(job, "email")}
                            className="inline-flex items-center gap-1.5 rounded-md bg-[#B8823A] px-3.5 py-1.5 text-xs font-medium text-white shadow-xs hover:bg-[#A37232] transition-all cursor-pointer"
                          >
                            <PenLine className="h-3.5 w-3.5" />
                            <span>Draft & Send Letter</span>
                          </button>
                        </>
                      ) : (
                        <>
                          {/* Case B: Apply Link / ATS Portal */}
                          <button
                            type="button"
                            onClick={() => handleDraftWithJob(job, "note")}
                            className="inline-flex items-center gap-1.5 rounded-md border border-hairline bg-white px-3 py-1.5 text-xs font-medium text-ink hover:border-ink/20 hover:bg-[#FAF9F5] transition-all cursor-pointer"
                          >
                            <FileText className="h-3.5 w-3.5 text-muted-ink" />
                            <span>Draft Application Note</span>
                          </button>

                          <a
                            href={job.applyUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 rounded-md bg-ink px-3.5 py-1.5 text-xs font-medium text-paper shadow-xs hover:bg-ink/90 transition-all"
                          >
                            <span>Apply on Website</span>
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
