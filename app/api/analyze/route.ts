import { NextRequest, NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase/server";
import { analyzeJdAndDraftEmail } from "@/lib/ai";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const jdText = body?.jdText;

    if (!jdText || typeof jdText !== "string" || jdText.trim().length < 20) {
      return NextResponse.json(
        { error: "Please provide a valid job description (at least 20 characters)." },
        { status: 400 }
      );
    }

    // 1. Fetch user's background / skills summary from Supabase
    let skillsSummary = "";
    try {
      const supabase = getServiceSupabase();
      const { data: resumeData } = await supabase
        .from("resume")
        .select("skills_summary")
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (resumeData?.skills_summary) {
        skillsSummary = resumeData.skills_summary;
      }
    } catch (dbErr) {
      console.warn("Could not fetch skills summary from Supabase, proceeding with JD only:", dbErr);
    }

    // 2. Call AI extraction and email generation
    const result = await analyzeJdAndDraftEmail({
      jdText: jdText.trim(),
      skillsSummary,
    });

    return NextResponse.json(result);
  } catch (err: unknown) {
    console.error("Analysis route error:", err);
    const message = err instanceof Error ? err.message : "Failed to analyze job description.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
