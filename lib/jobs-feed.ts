import type { JobPosting, JobsResponse, JobFilter } from "@/lib/types/job";

// In-memory cache to guarantee fast response times (<20ms) and protect upstream free APIs
interface CacheEntry {
  data: JobPosting[];
  timestamp: number;
}

let jobsCache: CacheEntry | null = null;
const CACHE_TTL_MS = 45 * 60 * 1000; // 45 minutes

function decodeEntities(str: string): string {
  return str
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&#39;/g, "'")
    .replace(/&#x2F;/g, "/")
    .replace(/&nbsp;/g, " ");
}

/**
 * Robustly strips HTML tags, formats block elements, and decodes HTML entities
 */
function cleanHtml(html: string): string {
  if (!html) return "";

  // Step 1: Decode entities once so escaped tags like &lt;h1&gt; become real tags
  let text = decodeEntities(html);

  // If there was double encoding (e.g. &amp;lt;), decode once more
  if (text.includes("&lt;") || text.includes("&gt;")) {
    text = decodeEntities(text);
  }

  // Step 2: Format links to keep text (url)
  text = text.replace(/<a\s+[^>]*href=["']([^"']*)["'][^>]*>(.*?)<\/a>/gi, "$2 ($1)");

  // Step 3: Convert structural tags to readable spacing and bullets
  text = text
    .replace(/<\/(h[1-6]|p|div|section|article)>/gi, "\n\n")
    .replace(/<(h[1-6]|p|div|section|article)[^>]*>/gi, "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<li>/gi, "\n• ")
    .replace(/<\/li>/gi, "")
    .replace(/<\/?(ul|ol)[^>]*>/gi, "\n");

  // Step 4: Strip all remaining HTML tags (like <strong>, <em>, <span>, etc.)
  text = text.replace(/<[^>]+>/g, "");

  // Step 5: Final entity decode and whitespace normalization
  text = decodeEntities(text);

  return text
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/**
 * Extracts valid email addresses from text, ignoring common file extensions or placeholder emails
 */
function extractEmail(text: string): string | null {
  if (!text) return null;
  const emailRegex = /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/gi;
  const matches = text.match(emailRegex);
  if (!matches) return null;

  for (const email of matches) {
    const lower = email.toLowerCase();
    // Exclude false positives like example.com or image assets
    if (
      !lower.includes("example.com") &&
      !lower.includes("yourcompany.com") &&
      !lower.endsWith(".png") &&
      !lower.endsWith(".jpg")
    ) {
      return email;
    }
  }
  return null;
}

// Pre-compiled skills taxonomy for Hacker News postings to avoid allocating 2,400 regexes per refresh
const PRECOMPILED_HN_SKILLS: { name: string; regex: RegExp }[] = [
  "React",
  "Next.js",
  "TypeScript",
  "JavaScript",
  "Python",
  "Go",
  "Rust",
  "Node.js",
  "AWS",
  "PostgreSQL",
  "Tailwind",
  "GraphQL",
  "Docker",
  "Kubernetes",
  "AI",
  "LLM",
].map((skill) => ({
  name: skill,
  regex: new RegExp(
    `(^|[^a-zA-Z0-9])${skill.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&")}([^a-zA-Z0-9]|$)`,
    "i"
  ),
}));

/**
 * Fetches latest postings from Hacker News "Who is Hiring?" thread
 */
async function fetchHackerNewsJobs(): Promise<JobPosting[]> {
  try {
    // 1. First retrieve the latest "Ask HN: Who is hiring?" story ID
    const storyRes = await fetch(
      "https://hn.algolia.com/api/v1/search_by_date?query=Ask%20HN:%20Who%20is%20hiring&tags=story,author_whoishiring&hitsPerPage=1",
      { next: { revalidate: 3600 } }
    );

    if (!storyRes.ok) {
      console.warn("Hacker News Algolia API story lookup error:", storyRes.status);
      return [];
    }

    const storyData = await storyRes.json();
    const storyId = storyData?.hits?.[0]?.objectID;
    if (!storyId) {
      console.warn("Could not find active Hacker News Who is Hiring story");
      return [];
    }

    // 2. Fetch the top job posting comments belonging to that story
    const commentsRes = await fetch(
      `https://hn.algolia.com/api/v1/search?tags=comment,story_${storyId}&hitsPerPage=150`,
      { next: { revalidate: 3600 } }
    );

    if (!commentsRes.ok) {
      console.warn("Hacker News Algolia comments lookup error:", commentsRes.status);
      return [];
    }

    const data = await commentsRes.json();
    const hits = data?.hits || [];
    const jobs: JobPosting[] = [];

    for (const hit of hits) {
      const rawText = hit.comment_text || "";
      if (!rawText || rawText.length < 60) continue;

      const plainText = cleanHtml(rawText);
      const lines = plainText.split("\n").map((l: string) => l.trim()).filter(Boolean);
      const firstLine = lines[0] || "";

      // HN Who is hiring typically formats the header line as:
      // Company | Role | Location | REMOTE / ONSITE | Salary | Tech
      // Or: Company | https://company.com | Role | Location
      const parts = firstLine.split("|").map((p: string) => p.trim()).filter(Boolean);
      if (parts.length < 2) continue; // Skip general user replies / questions

      const company = parts[0]?.replace(/\(.*?\)/g, "").trim() || "Technology Company";
      let title = parts[1] || "Software Engineer";
      let locationRaw = parts[2] || "Remote";
      let companyUrl: string | undefined = undefined;

      // Handle cases where second part is website URL
      if (parts[1] && (/^https?:\/\//i.test(parts[1]) || /^www\./i.test(parts[1]))) {
        companyUrl = parts[1];
        title = parts[2] || "Software Engineer";
        locationRaw = parts[3] || "Remote";
      }

      const isRemote =
        plainText.toLowerCase().includes("remote") ||
        firstLine.toLowerCase().includes("remote");

      const contactEmail = extractEmail(plainText);
      const applyUrl = `https://news.ycombinator.com/item?id=${hit.objectID}`;

      // Extract skills/tags using pre-compiled regexes
      const matchedSkills = PRECOMPILED_HN_SKILLS
        .filter(({ regex }) => regex.test(plainText))
        .map(({ name }) => name);

      jobs.push({
        id: `hn-${hit.objectID}`,
        title: title.length > 80 ? title.substring(0, 80) + "..." : title,
        company: company.length > 50 ? company.substring(0, 50) : company,
        companyUrl,
        location: locationRaw.length > 60 ? locationRaw.substring(0, 60) : locationRaw,
        isRemote,
        postedAt: hit.created_at || new Date().toISOString(),
        description: plainText,
        skills: matchedSkills.length > 0 ? matchedSkills.slice(0, 5) : ["Engineering"],
        contactEmail,
        applyUrl,
        source: "Hacker News",
      });
    }

    return jobs;
  } catch (err) {
    console.error("Error fetching Hacker News jobs:", err);
    return [];
  }
}

/**
 * Fetches latest remote tech postings from Arbeitnow public API
 */
async function fetchArbeitnowJobs(): Promise<JobPosting[]> {
  try {
    const res = await fetch("https://www.arbeitnow.com/api/job-board-api", {
      next: { revalidate: 3600 },
    });

    if (!res.ok) {
      console.warn("Arbeitnow API returned error status:", res.status);
      return [];
    }

    const data = await res.json();
    const items = data?.data || [];
    const jobs: JobPosting[] = [];

    for (const item of items) {
      const plainDescription = cleanHtml(item.description || "");
      const contactEmail = extractEmail(plainDescription);

      jobs.push({
        id: `arbeitnow-${item.slug || Math.random().toString(36).substring(7)}`,
        title: item.title || "Software Engineer",
        company: item.company_name || "Modern Tech",
        companyUrl: undefined,
        location: item.location || (item.remote ? "Remote" : "Global"),
        isRemote: Boolean(item.remote),
        postedAt: item.created_at
          ? new Date(item.created_at * 1000).toISOString()
          : new Date().toISOString(),
        description: plainDescription,
        skills: Array.isArray(item.tags) ? item.tags.slice(0, 5) : ["Tech"],
        contactEmail,
        applyUrl: item.url,
        source: "Arbeitnow",
      });
    }

    return jobs;
  } catch (err) {
    console.error("Error fetching Arbeitnow jobs:", err);
    return [];
  }
}

/**
 * Returns merged and deduplicated list of active jobs, caching results
 */
export async function getLiveJobs(): Promise<JobPosting[]> {
  const now = Date.now();
  if (jobsCache && now - jobsCache.timestamp < CACHE_TTL_MS) {
    return jobsCache.data;
  }

  // Fetch concurrently from both free sources
  const [hnJobs, arbeitnowJobs] = await Promise.all([
    fetchHackerNewsJobs(),
    fetchArbeitnowJobs(),
  ]);

  const allJobs = [...hnJobs, ...arbeitnowJobs];

  // Sort by freshness (newest first)
  allJobs.sort((a, b) => new Date(b.postedAt).getTime() - new Date(a.postedAt).getTime());

  jobsCache = {
    data: allJobs,
    timestamp: now,
  };

  return allJobs;
}

/**
 * Filters jobs by user search query and filter tab
 */
export function filterJobs(
  jobs: JobPosting[],
  options: {
    query?: string;
    filter?: JobFilter;
  }
): JobPosting[] {
  let filtered = [...jobs];

  if (options.filter === "email") {
    filtered = filtered.filter((job) => Boolean(job.contactEmail));
  } else if (options.filter === "remote") {
    filtered = filtered.filter((job) => job.isRemote);
  } else if (options.filter === "hn") {
    filtered = filtered.filter((job) => job.source === "Hacker News");
  } else if (options.filter === "arbeitnow") {
    filtered = filtered.filter((job) => job.source === "Arbeitnow");
  }

  if (options.query && options.query.trim()) {
    const q = options.query.toLowerCase().trim();
    filtered = filtered.filter(
      (job) =>
        job.title.toLowerCase().includes(q) ||
        job.company.toLowerCase().includes(q) ||
        job.location.toLowerCase().includes(q) ||
        job.skills.some((skill) => skill.toLowerCase().includes(q)) ||
        job.description.toLowerCase().includes(q)
    );
  }

  return filtered;
}
