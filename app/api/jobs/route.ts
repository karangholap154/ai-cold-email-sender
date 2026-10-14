import { NextRequest, NextResponse } from "next/server";
import { getLiveJobs, filterJobs } from "@/lib/jobs-feed";
import type { JobFilter } from "@/lib/types/job";

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const query = searchParams.get("q") || undefined;
    const filter = (searchParams.get("filter") || "all") as JobFilter;

    const allJobs = await getLiveJobs();
    const filteredJobs = filterJobs(allJobs, { query, filter });

    return NextResponse.json(
      {
        jobs: filteredJobs,
        total: filteredJobs.length,
        sources: ["Hacker News Who is Hiring", "Arbeitnow", "Remotive"],
        fetchedAt: new Date().toISOString(),
      },
      {
        headers: {
          "Cache-Control": "public, s-maxage=1800, stale-while-revalidate=86400",
        },
      }
    );
  } catch (error) {
    console.error("Error in /api/jobs route:", error);
    return NextResponse.json(
      { error: "Failed to fetch live job postings." },
      { status: 500 }
    );
  }
}
