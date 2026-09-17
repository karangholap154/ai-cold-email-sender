import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { analyzeJdAndDraftEmail } from "@/lib/ai";
import { formatSenderSignature } from "@/lib/signature";

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

    // 1. Fetch authenticated user's background / skills summary & sender signature from Supabase if logged in
    let skillsSummary = "";
    let senderSignature = "";
    try {
      const supabase = await createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        // Fetch resume skills summary
        const { data: resumeData } = await supabase
          .from("resume")
          .select("skills_summary")
          .eq("user_id", user.id)
          .limit(1)
          .maybeSingle();

        if (resumeData?.skills_summary) {
          skillsSummary = resumeData.skills_summary;
        }

        // Fetch profile signature
        const { data: profileData } = await supabase
          .from("profiles")
          .select("full_name, sign_off, portfolio_url, github_url, linkedin_url, phone, custom_signature")
          .eq("id", user.id)
          .limit(1)
          .maybeSingle();

        if (profileData) {
          senderSignature = formatSenderSignature(profileData);
        }
      }
    } catch (dbErr) {
      console.warn("Could not fetch user profile or resume from Supabase, proceeding with JD only:", dbErr);
    }

    // 2. Call AI extraction and email generation
    const result = await analyzeJdAndDraftEmail({
      jdText: jdText.trim(),
      skillsSummary,
      senderSignature,
    });

    return NextResponse.json(result);
  } catch (err: unknown) {
    console.error("Analysis route error:", err);
    let message = err instanceof Error ? err.message : "Failed to analyze job description.";

    // If message contains a stringified JSON error from Google, parse it
    try {
      if (message.includes('"message":') || message.startsWith("{")) {
        const parsed = JSON.parse(message);
        if (parsed?.error?.message) {
          message = parsed.error.message;
        }
      }
    } catch {}

    if (message.includes("high demand") || message.includes("503") || message.includes("UNAVAILABLE")) {
      message = "Google Gemini is currently experiencing a temporary traffic spike. Please try clicking Generate again in a few seconds.";
    }

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
