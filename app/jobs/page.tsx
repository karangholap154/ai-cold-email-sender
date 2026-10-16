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
  MapPin,
  Info,
  Building2,
  Send,
  SlidersHorizontal,
  X,
  BadgeCheck,
} from "lucide-react";
import { toast } from "sonner";
import type { JobPosting, JobFilter } from "@/lib/types/job";
import type { UserUsage } from "@/lib/types/database";
import { calculateJobMatch } from "@/lib/matcher";
import {
  resolveJobCountry,
  matchJobLocation,
  OTHER_LOCATIONS,
} from "@/lib/countries";
import {
  getJobContactStatus,
  type SentEmailSummary,
} from "@/lib/contact-tracker";
import {
  detectSeniority,
  type SeniorityLevel,
} from "@/lib/seniority";

export const INCOMING_JOB_STORAGE_KEY = "vina_incoming_job";

const INITIAL_VISIBLE_COUNT = 30;
const LOAD_MORE_INCREMENT = 30;

export default function JobsPage() {
  const router = useRouter();
  const [jobs, setJobs] = useState<JobPosting[]>([]);
  const [userSkills, setUserSkills] = useState<string[]>([]);
  const [hasSkills, setHasSkills] = useState(false);
  const [usage, setUsage] = useState<UserUsage | null>(null);
  const [sentEmails, setSentEmails] = useState<SentEmailSummary[]>([]);
  const [sortBy, setSortBy] = useState<"match" | "newest">("match");
  const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE_COUNT);

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<JobFilter>("all");
  const [selectedLocation, setSelectedLocation] = useState<string>("all");
  const [seniorityFilter, setSeniorityFilter] = useState<SeniorityLevel>("all");
  const [expandedJobId, setExpandedJobId] = useState<string | null>(null);

  const [prevFilterKey, setPrevFilterKey] = useState("");
  const currentFilterKey = `${searchQuery}|${activeFilter}|${sortBy}|${selectedLocation}|${seniorityFilter}`;
  if (currentFilterKey !== prevFilterKey) {
    setPrevFilterKey(currentFilterKey);
    setVisibleCount(INITIAL_VISIBLE_COUNT);
  }

  const fetchData = async (isManualRefresh = false) => {
    if (isManualRefresh) setIsRefreshing(true);

    try {
      const [jobsRes, profileRes, emailsRes] = await Promise.all([
        fetch("/api/jobs"),
        fetch("/api/profile"),
        fetch("/api/emails"),
      ]);

      let skills: string[] = [];
      if (profileRes.ok) {
        const pData = await profileRes.json();
        if (Array.isArray(pData.profile?.skills) && pData.profile.skills.length > 0) {
          skills = pData.profile.skills;
        }
        if (pData.usage) {
          setUsage(pData.usage);
        }
      }

      if (emailsRes.ok) {
        const eData = await emailsRes.json();
        if (Array.isArray(eData.emails)) {
          setSentEmails(eData.emails);
        }
      }

      setUserSkills(skills);
      setHasSkills(skills.length > 0);

      if (jobsRes.ok) {
        const data = await jobsRes.json();
        const rawJobs: JobPosting[] = data.jobs || [];

        // Score each job against user's skills
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
      console.error("Failed to load jobs or profile skills:", err);
      toast.error("Could not load latest job postings. Please try again.");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    let active = true;
    const run = async () => {
      await fetchData();
    };
    void run();
    return () => {
      active = false;
    };
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
    } else if (activeFilter === "remotive") {
      result = result.filter((j) => j.source === "Remotive");
    } else if (activeFilter === "applied") {
      result = result.filter(
        (j) => getJobContactStatus(j, sentEmails)?.type === "applied_this_role"
      );
    }

    // Location / Country filter
    if (selectedLocation !== "all") {
      result = result.filter((j) => matchJobLocation(j.location, selectedLocation));
    }

    // Seniority level filter
    if (seniorityFilter !== "all") {
      result = result.filter(
        (j) => detectSeniority(j.title).level === seniorityFilter
      );
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
  }, [jobs, activeFilter, selectedLocation, seniorityFilter, searchQuery, sortBy, userSkills, sentEmails]);

  // Sliced jobs for incremental rendering performance (prevents mounting 400+ DOM cards at once)
  const displayedJobs = useMemo(() => {
    return filteredJobs.slice(0, visibleCount);
  }, [filteredJobs, visibleCount]);

  // Dynamic location counts for dropdown (only includes countries with at least 1 active job)
  const locationCounts = useMemo(() => {
    const countsMap = new Map<string, number>();

    for (const job of jobs) {
      const country = resolveJobCountry(job.location);
      countsMap.set(country, (countsMap.get(country) || 0) + 1);
    }

    const items: { name: string; count: number }[] = [];
    let otherCount = 0;

    for (const [name, count] of countsMap.entries()) {
      if (name === OTHER_LOCATIONS) {
        otherCount = count;
      } else {
        items.push({ name, count });
      }
    }

    // Sort active countries by job count descending
    items.sort((a, b) => b.count - a.count);

    // Place "Other Locations" at the end if present
    if (otherCount > 0) {
      items.push({ name: OTHER_LOCATIONS, count: otherCount });
    }

    return items;
  }, [jobs]);

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
  const remotiveJobsCount = useMemo(
    () => jobs.filter((j) => j.source === "Remotive").length,
    [jobs]
  );
  const remoteJobsCount = useMemo(
    () => jobs.filter((j) => j.isRemote).length,
    [jobs]
  );
  const appliedJobsCount = useMemo(
    () =>
      jobs.filter(
        (j) => getJobContactStatus(j, sentEmails)?.type === "applied_this_role"
      ).length,
    [jobs, sentEmails]
  );
  const seniorityCounts = useMemo(() => {
    const counts = { senior: 0, mid: 0, junior: 0 };
    for (const job of jobs) {
      const { level } = detectSeniority(job.title);
      counts[level]++;
    }
    return counts;
  }, [jobs]);

  const handleDraftWithJob = (job: JobPosting, mode: "email" | "note") => {
    if (usage?.plan === "free" && usage.monthlySends >= (usage.monthlyLimit ?? 5)) {
      toast.error(
        "You've sent all 5 free letters this month. Please upgrade to Pro to draft new letters."
      );
      router.push("/draft");
      return;
    }

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

  const clearAllFilters = () => {
    setSearchQuery("");
    setActiveFilter("all");
    setSelectedLocation("all");
    setSeniorityFilter("all");
  };

  const hasActiveFilters =
    Boolean(searchQuery) ||
    activeFilter !== "all" ||
    selectedLocation !== "all" ||
    seniorityFilter !== "all";

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-paper pb-20 pt-8 sm:pt-10">
      <div className="mx-auto max-w-5xl lg:max-w-6xl xl:max-w-7xl px-4 sm:px-6 space-y-7">
        
        {/* --- Job Board Header --- */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-hairline/80 pb-6">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-xs text-seal font-medium">
              <span className="inline-block h-2 w-2 rounded-full bg-seal animate-pulse" />
              <span>Live Job Feed</span>
              <span className="text-muted-ink">•</span>
              <span className="text-muted-ink">{jobs.length} verified listings</span>
            </div>
            <h1 className="font-heading text-2xl sm:text-3xl text-ink font-normal tracking-tight">
              Opportunities & Openings
            </h1>
            <p className="text-xs sm:text-sm text-muted-ink max-w-2xl leading-relaxed">
              Find positions with direct recruiter contacts to pitch with tailored letters, or explore curated tech openings.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start md:self-end shrink-0">
            <button
              type="button"
              onClick={() => fetchData(true)}
              disabled={isLoading || isRefreshing}
              className="inline-flex items-center gap-1.5 rounded-sm border border-hairline bg-white/80 hover:bg-white px-3 py-1.5 text-xs font-medium text-ink transition-all shadow-2xs hover:border-ink/30 cursor-pointer disabled:opacity-50"
            >
              <RefreshCw
                className={`h-3.5 w-3.5 text-muted-ink ${isRefreshing ? "animate-spin text-seal" : ""}`}
              />
              <span>Refresh feed</span>
            </button>
          </div>
        </div>

        {/* --- Missing Skills Guidance Callout --- */}
        {!hasSkills && !isLoading && (
          <div className="rounded-md border border-seal/30 bg-[#FDFBF7] p-4 text-xs shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start sm:items-center gap-2.5">
              <Sparkles className="h-4 w-4 text-seal shrink-0 mt-0.5 sm:mt-0" />
              <div className="text-muted-ink">
                <span className="font-medium text-ink">Personalize your match scores:</span> Add your key technical skills in Settings to highlight relevant openings and rank jobs by profile alignment.
              </div>
            </div>
            <Link
              href="/settings?tab=resume"
              className="inline-flex items-center gap-1 font-medium text-seal hover:text-seal/80 hover:underline shrink-0 text-xs self-start sm:self-auto"
            >
              <span>Add skills in Settings</span>
              <span aria-hidden="true">→</span>
            </Link>
          </div>
        )}

        {/* --- Search & Filter Command Panel --- */}
        <section aria-label="Job Search and Filters" className="rounded-md border border-hairline bg-white/70 p-4 sm:p-5 shadow-2xs space-y-4">
          
          {/* Main Search & Location Row */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
            {/* Search Input */}
            <div className="relative md:col-span-8">
              <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-ink/70" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by job title, company name, skill, or keyword..."
                className="w-full rounded-sm border border-hairline bg-paper/60 pl-10 pr-9 py-2.5 text-xs sm:text-sm text-ink placeholder:text-muted-ink/60 focus:bg-white focus:border-seal focus:outline-none transition-colors"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  aria-label="Clear search query"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-ink hover:text-ink p-0.5 cursor-pointer"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {/* Country / Location Selector */}
            <div className="relative md:col-span-4">
              <MapPin className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-ink pointer-events-none" />
              <select
                value={selectedLocation}
                onChange={(e) => setSelectedLocation(e.target.value)}
                aria-label="Filter by location or country"
                className="w-full appearance-none rounded-sm border border-hairline bg-paper/60 pl-8.5 pr-8 py-2.5 text-xs font-medium text-ink focus:bg-white focus:border-seal focus:outline-none transition-colors cursor-pointer truncate"
              >
                <option value="all">Everywhere ({jobs.length})</option>
                {locationCounts.map(({ name, count }) => (
                  <option key={name} value={name}>
                    {name} ({count})
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-ink pointer-events-none" />
            </div>
          </div>

          {/* Primary Source Filter Tabs */}
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            <button
              type="button"
              onClick={() => setActiveFilter("all")}
              className={`rounded-sm px-3 py-1.5 text-xs transition-all cursor-pointer ${
                activeFilter === "all"
                  ? "bg-ink text-paper font-medium shadow-2xs"
                  : "border border-hairline/80 bg-paper/50 text-muted-ink hover:text-ink hover:bg-paper"
              }`}
            >
              All Openings ({jobs.length})
            </button>

            <button
              type="button"
              onClick={() => setActiveFilter("email")}
              className={`inline-flex items-center gap-1.5 rounded-sm px-3 py-1.5 text-xs transition-all cursor-pointer ${
                activeFilter === "email"
                  ? "bg-seal text-paper font-medium shadow-2xs"
                  : "border border-seal/30 bg-[#FDFBF7] text-seal hover:bg-seal/10 font-medium"
              }`}
            >
              <Mail className="h-3 w-3" />
              <span>Direct outreach ({emailJobsCount})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveFilter("remote")}
              className={`inline-flex items-center gap-1.5 rounded-sm px-3 py-1.5 text-xs transition-all cursor-pointer ${
                activeFilter === "remote"
                  ? "bg-ink text-paper font-medium shadow-2xs"
                  : "border border-hairline/80 bg-paper/50 text-muted-ink hover:text-ink hover:bg-paper"
              }`}
            >
              <Globe className="h-3 w-3" />
              <span>Remote only ({remoteJobsCount})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveFilter("hn")}
              className={`rounded-sm px-3 py-1.5 text-xs transition-all cursor-pointer ${
                activeFilter === "hn"
                  ? "bg-ink text-paper font-medium shadow-2xs"
                  : "border border-hairline/80 bg-paper/50 text-muted-ink hover:text-ink hover:bg-paper"
              }`}
            >
              Hacker News ({hnJobsCount})
            </button>

            <button
              type="button"
              onClick={() => setActiveFilter("remotive")}
              className={`rounded-sm px-3 py-1.5 text-xs transition-all cursor-pointer ${
                activeFilter === "remotive"
                  ? "bg-ink text-paper font-medium shadow-2xs"
                  : "border border-hairline/80 bg-paper/50 text-muted-ink hover:text-ink hover:bg-paper"
              }`}
            >
              Remotive ({remotiveJobsCount})
            </button>

            <button
              type="button"
              onClick={() => setActiveFilter("arbeitnow")}
              className={`rounded-sm px-3 py-1.5 text-xs transition-all cursor-pointer ${
                activeFilter === "arbeitnow"
                  ? "bg-ink text-paper font-medium shadow-2xs"
                  : "border border-hairline/80 bg-paper/50 text-muted-ink hover:text-ink hover:bg-paper"
              }`}
            >
              Arbeitnow ({arbeitnowJobsCount})
            </button>

            {appliedJobsCount > 0 && (
              <button
                type="button"
                onClick={() => setActiveFilter("applied")}
                className={`inline-flex items-center gap-1.5 rounded-sm px-3 py-1.5 text-xs transition-all cursor-pointer ${
                  activeFilter === "applied"
                    ? "bg-confirmed text-paper font-medium shadow-2xs"
                    : "border border-confirmed/30 bg-confirmed/10 text-confirmed hover:bg-confirmed/20"
                }`}
              >
                <CheckCircle2 className="h-3 w-3 text-confirmed" />
                <span>Applied ({appliedJobsCount})</span>
              </button>
            )}
          </div>

          {/* Seniority Filter & Sort Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-hairline/80 text-xs">
            {/* Seniority options */}
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] text-muted-ink mr-1 font-medium">Level:</span>
              <button
                type="button"
                onClick={() => setSeniorityFilter("all")}
                className={`rounded-xs px-2 py-0.5 text-[11px] transition-colors cursor-pointer ${
                  seniorityFilter === "all"
                    ? "bg-ink text-paper font-medium"
                    : "bg-paper/70 text-muted-ink hover:text-ink border border-hairline/70"
                }`}
              >
                All
              </button>
              <button
                type="button"
                onClick={() => setSeniorityFilter("senior")}
                className={`rounded-xs px-2 py-0.5 text-[11px] transition-colors cursor-pointer ${
                  seniorityFilter === "senior"
                    ? "bg-ink text-paper font-medium"
                    : "bg-paper/70 text-muted-ink hover:text-ink border border-hairline/70"
                }`}
              >
                Senior / Lead ({seniorityCounts.senior})
              </button>
              <button
                type="button"
                onClick={() => setSeniorityFilter("mid")}
                className={`rounded-xs px-2 py-0.5 text-[11px] transition-colors cursor-pointer ${
                  seniorityFilter === "mid"
                    ? "bg-ink text-paper font-medium"
                    : "bg-paper/70 text-muted-ink hover:text-ink border border-hairline/70"
                }`}
              >
                Mid-Level ({seniorityCounts.mid})
              </button>
              <button
                type="button"
                onClick={() => setSeniorityFilter("junior")}
                className={`rounded-xs px-2 py-0.5 text-[11px] transition-colors cursor-pointer ${
                  seniorityFilter === "junior"
                    ? "bg-ink text-paper font-medium"
                    : "bg-paper/70 text-muted-ink hover:text-ink border border-hairline/70"
                }`}
              >
                Junior / Entry ({seniorityCounts.junior})
              </button>
            </div>

            {/* Sort & Quick Status */}
            <div className="flex items-center gap-3">
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={clearAllFilters}
                  className="text-[11px] text-muted-ink hover:text-ink underline cursor-pointer"
                >
                  Reset filters
                </button>
              )}

              {userSkills.length > 0 && (
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] text-muted-ink font-medium">Rank:</span>
                  <button
                    type="button"
                    onClick={() => setSortBy("match")}
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-xs text-[11px] transition-colors cursor-pointer ${
                      sortBy === "match"
                        ? "bg-seal/15 text-seal font-medium border border-seal/30"
                        : "text-muted-ink hover:text-ink"
                    }`}
                  >
                    <Sparkles className="h-3 w-3 text-seal" />
                    <span>Best match</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSortBy("newest")}
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-xs text-[11px] transition-colors cursor-pointer ${
                      sortBy === "newest"
                        ? "bg-ink/10 text-ink font-medium border border-hairline"
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
        </section>

        {/* --- Results Count Banner --- */}
        <div className="flex items-center justify-between text-xs text-muted-ink px-1">
          <span>
            Showing <strong className="text-ink font-medium">{Math.min(visibleCount, filteredJobs.length)}</strong> of <strong className="text-ink font-medium">{filteredJobs.length}</strong> matching positions
          </span>
          {activeFilter === "email" && (
            <span className="text-seal font-medium flex items-center gap-1">
              <Mail className="h-3 w-3" />
              Direct recruiter addresses verified
            </span>
          )}
        </div>

        {/* --- Job Listings Section --- */}
        {isLoading ? (
          <div className="rounded-md border border-hairline bg-white/50 p-16 text-center space-y-3">
            <Loader2 className="mx-auto h-6 w-6 animate-spin text-seal" />
            <h3 className="font-heading text-lg text-ink font-normal">
              Loading active positions...
            </h3>
            <p className="text-xs text-muted-ink max-w-sm mx-auto">
              Fetching verified tech roles from Hacker News, Remotive, and Arbeitnow portals.
            </p>
          </div>
        ) : filteredJobs.length === 0 ? (
          <div className="rounded-md border border-dashed border-hairline bg-white/40 p-12 text-center space-y-3">
            <Briefcase className="mx-auto h-8 w-8 text-muted-ink/60" />
            <h3 className="font-heading text-lg text-ink font-normal">
              No matching positions found
            </h3>
            <p className="text-xs text-muted-ink max-w-md mx-auto">
              We couldn&apos;t find any active listings matching your current search query or applied filters.
            </p>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={clearAllFilters}
                className="mt-2 inline-flex items-center gap-1.5 rounded-sm border border-hairline bg-white px-3.5 py-1.5 text-xs font-medium text-ink hover:border-ink/40 transition-colors shadow-2xs cursor-pointer"
              >
                Clear all filters
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-5 items-stretch">
            {displayedJobs.map((job) => {
              const isExpanded = expandedJobId === job.id;
              const hasEmail = Boolean(job.contactEmail);
              const hasMatchScore =
                userSkills.length > 0 &&
                typeof job.matchScore === "number" &&
                job.matchScore >= 60;
              const contactStatus = hasEmail
                ? getJobContactStatus(job, sentEmails)
                : null;
              const seniority = detectSeniority(job.title);

              return (
                <div
                  key={job.id}
                  className="group relative flex flex-col justify-between rounded-md border border-hairline bg-white/85 p-5 sm:p-6 shadow-2xs hover:shadow-xs hover:border-ink/30 transition-all duration-200"
                >
                  {/* Card Header & Essential Details */}
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="space-y-1.5 min-w-0">
                      
                      {/* Top Badges / Source & Match Score */}
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-heading text-xs font-semibold text-ink bg-paper px-2 py-0.5 rounded-xs border border-hairline/80">
                          {job.company}
                        </span>

                        <span className="text-[11px] text-muted-ink">
                          via {job.source}
                        </span>

                        {hasMatchScore && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-seal/10 border border-seal/30 px-2.5 py-0.5 text-[10px] font-semibold text-seal">
                            <Sparkles className="h-2.5 w-2.5" />
                            <span>{job.matchScore}% Match</span>
                          </span>
                        )}

                        {contactStatus?.type === "applied_this_role" && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-confirmed/10 border border-confirmed/30 px-2.5 py-0.5 text-[10px] font-medium text-confirmed">
                            <CheckCircle2 className="h-2.5 w-2.5" />
                            <span>
                              Applied {new Date(contactStatus.date).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                            </span>
                          </span>
                        )}
                      </div>

                      {/* Position Title */}
                      <h2 className="font-heading text-lg sm:text-xl text-ink font-medium leading-snug pt-0.5">
                        {job.title}
                      </h2>

                      {/* Location, Work Mode & Salary Meta Row */}
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-ink pt-0.5">
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5 text-muted-ink/80" />
                          <span>{job.location}</span>
                        </div>

                        {job.isRemote && (
                          <div className="flex items-center gap-1 text-emerald-800">
                            <Globe className="h-3.5 w-3.5" />
                            <span>Remote</span>
                          </div>
                        )}

                        <div className="flex items-center gap-1">
                          <Briefcase className="h-3.5 w-3.5 text-muted-ink/80" />
                          <span>{seniority.badgeLabel}</span>
                        </div>

                        {job.salary && (
                          <span className="rounded-xs bg-[#FAF9F5] border border-hairline px-1.5 py-0.5 text-[11px] font-medium text-ink">
                            {job.salary}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Right Tag: Direct Email vs Portal Tag */}
                    <div className="shrink-0 self-start">
                      {hasEmail ? (
                        <div className="inline-flex items-center gap-1.5 rounded-sm border border-seal/30 bg-[#FDFBF7] px-2.5 py-1 text-xs font-medium text-seal">
                          <Mail className="h-3.5 w-3.5" />
                          <span>Direct outreach available</span>
                        </div>
                      ) : (
                        <div className="inline-flex items-center gap-1.5 rounded-sm border border-hairline bg-paper/80 px-2.5 py-1 text-xs text-muted-ink">
                          <ExternalLink className="h-3.5 w-3.5 text-muted-ink/80" />
                          <span>ATS Portal</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Direct Contact Callout Bar (when email is available) */}
                  {hasEmail && (
                    <div className="mt-3.5 rounded-sm border border-seal/20 bg-[#FAF6EE] px-3.5 py-2 flex flex-wrap items-center justify-between gap-2 text-xs">
                      <div className="flex items-center gap-2 text-ink">
                        <Mail className="h-3.5 w-3.5 text-seal shrink-0" />
                        <span>
                          Recruiter address: <strong className="font-mono text-[11px] text-seal">{job.contactEmail}</strong>
                        </span>
                      </div>
                      <span className="text-[11px] text-muted-ink">
                        Pitch directly - bypass applicant tracking queues
                      </span>
                    </div>
                  )}

                  {/* Previous Outreach Notice for Other Roles at same recruiter */}
                  {contactStatus?.type === "contacted_recruiter_other_role" && (
                    <div className="mt-2.5 rounded-sm border border-hairline bg-[#FAF9F5] px-3 py-1.5 text-xs text-muted-ink flex items-center gap-2">
                      <Info className="h-3.5 w-3.5 text-muted-ink shrink-0" />
                      <span>
                        Note: You previously contacted this hiring address for <strong>&ldquo;{contactStatus.otherRole}&rdquo;</strong>.
                      </span>
                    </div>
                  )}

                  {/* Skills Pill Cloud */}
                  {job.skills && job.skills.length > 0 && (
                    <div className="mt-3.5 flex flex-wrap gap-1.5 items-center">
                      <span className="text-[11px] text-muted-ink font-medium mr-1">Skills:</span>
                      {job.skills.map((skill) => {
                        const isUserSkill = userSkills.some(
                          (us) => us.toLowerCase() === skill.toLowerCase()
                        );
                        return (
                          <span
                            key={skill}
                            className={`rounded-xs px-2 py-0.5 text-[11px] transition-colors ${
                              isUserSkill
                                ? "bg-seal/10 border border-seal/30 text-seal font-medium"
                                : "bg-paper/70 border border-hairline/80 text-muted-ink"
                            }`}
                          >
                            {isUserSkill && "✓ "}
                            {skill}
                          </span>
                        );
                      })}
                    </div>
                  )}

                  {/* Job Description Excerpt / Expandable Body */}
                  <div className="mt-3 text-xs sm:text-sm text-ink/80 leading-relaxed border-t border-hairline/50 pt-2.5">
                    <p className={isExpanded ? "whitespace-pre-line" : "line-clamp-2"}>
                      {job.description}
                    </p>
                    <button
                      type="button"
                      onClick={() => toggleExpand(job.id)}
                      className="mt-1.5 inline-flex items-center gap-1 text-[11px] font-medium text-seal hover:text-seal/80 transition-colors cursor-pointer"
                    >
                      {isExpanded ? (
                        <>
                          <span>Show less</span>
                          <ChevronUp className="h-3 w-3" />
                        </>
                      ) : (
                        <>
                          <span>Read full job description</span>
                          <ChevronDown className="h-3 w-3" />
                        </>
                      )}
                    </button>
                  </div>

                  {/* Card Action Footer */}
                  <div className="mt-auto flex flex-wrap items-center justify-between gap-3 border-t border-hairline pt-3.5">
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
                            className="inline-flex items-center gap-1 rounded-sm border border-hairline bg-white px-3 py-1.5 text-xs font-medium text-muted-ink hover:text-ink hover:border-ink/30 transition-all"
                          >
                            <ExternalLink className="h-3 w-3" />
                            <span>View source</span>
                          </a>

                          {contactStatus?.type === "applied_this_role" ? (
                            <Link
                              href="/log"
                              className="inline-flex items-center gap-1.5 rounded-sm border border-confirmed/30 bg-confirmed/10 px-3.5 py-1.5 text-xs font-medium text-confirmed hover:bg-confirmed/20 transition-all cursor-pointer"
                            >
                              <CheckCircle2 className="h-3.5 w-3.5 text-confirmed" />
                              <span>View in sent log</span>
                            </Link>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleDraftWithJob(job, "email")}
                              className="inline-flex items-center gap-1.5 rounded-sm bg-seal px-4 py-1.5 text-xs font-medium text-paper shadow-2xs hover:bg-seal/90 transition-all cursor-pointer"
                            >
                              <PenLine className="h-3.5 w-3.5" />
                              <span>Draft & send letter</span>
                            </button>
                          )}
                        </>
                      ) : (
                        <>
                          {/* Case B: Apply Link / ATS Portal */}
                          <button
                            type="button"
                            onClick={() => handleDraftWithJob(job, "note")}
                            className="inline-flex items-center gap-1.5 rounded-sm border border-hairline bg-white px-3 py-1.5 text-xs font-medium text-ink hover:border-ink/30 hover:bg-paper/50 transition-all cursor-pointer"
                          >
                            <FileText className="h-3.5 w-3.5 text-muted-ink" />
                            <span>Draft application note</span>
                          </button>

                          <a
                            href={job.applyUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 rounded-sm bg-ink px-4 py-1.5 text-xs font-medium text-paper shadow-2xs hover:bg-ink/90 transition-all"
                          >
                            <span>Apply on website</span>
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

        {/* --- Incremental Load More Trigger --- */}
        {!isLoading && visibleCount < filteredJobs.length && (
          <div className="pt-6 pb-2 text-center">
            <button
              type="button"
              onClick={() => setVisibleCount((prev) => prev + LOAD_MORE_INCREMENT)}
              className="inline-flex items-center gap-2 rounded-sm border border-hairline bg-white/80 hover:bg-white hover:border-ink/30 px-6 py-2.5 text-xs font-medium text-ink shadow-2xs transition-all cursor-pointer"
            >
              <span>Load more opportunities</span>
              <span className="text-muted-ink text-[11px]">
                ({filteredJobs.length - visibleCount} remaining)
              </span>
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
