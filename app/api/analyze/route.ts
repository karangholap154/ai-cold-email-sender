import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { analyzeJdAndDraftEmail, generateFollowUpEmail } from "@/lib/ai";
import { formatSenderSignature } from "@/lib/signature";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const type = body?.type || "initial";

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // 1. If this is a follow-up request, enforce Pro Plan server-side
    if (type === "followup") {
      if (!user) {
        return NextResponse.json(
          { error: "You must be signed in to generate follow-up letters." },
          { status: 401 }
        );
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("plan")
        .eq("id", user.id)
        .maybeSingle();

      const plan = profile?.plan || "free";
      if (plan !== "pro") {
        return NextResponse.json(
          {
            error: "Follow-up correspondence is exclusive to Pro members. Upgrade your account to unlock one-click follow-ups.",
            code: "PRO_FEATURE_REQUIRED",
          },
          { status: 403 }
        );
      }
    }

    // 2. Fetch authenticated user's background / skills summary & sender signature from Supabase
    let skillsSummary = "";
    let senderSignature = "";
    if (user) {
      try {
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
      } catch (dbErr) {
        console.warn("Could not fetch user profile or resume from Supabase:", dbErr);
      }
    }

    // 3. Handle Follow-up generation
    if (type === "followup") {
      let {
        parentEmailId,
        companyName,
        roleTitle,
        originalSubject,
        originalBody,
        originalSentDate,
      } = body;

      // If parentEmailId is passed, fetch details directly from database to ensure high fidelity
      if (parentEmailId && user) {
        const { data: parentEmail } = await supabase
          .from("sent_emails")
          .select("*")
          .eq("id", parentEmailId)
          .eq("user_id", user.id)
          .maybeSingle();

        if (parentEmail) {
          companyName = companyName || parentEmail.company_name;
          roleTitle = roleTitle || parentEmail.role_title;
          originalSubject = originalSubject || parentEmail.final_subject || parentEmail.generated_subject;
          originalBody = originalBody || parentEmail.final_body || parentEmail.generated_body;
          originalSentDate = originalSentDate || new Date(parentEmail.created_at).toLocaleDateString(undefined, {
            month: "short",
            day: "numeric",
            year: "numeric",
          });
        }
      }

      if (!originalSubject) {
        return NextResponse.json(
          { error: "Original email subject is required to draft a follow-up." },
          { status: 400 }
        );
      }

      const result = await generateFollowUpEmail({
        companyName,
        roleTitle,
        originalSubject,
        originalBody,
        originalSentDate,
        skillsSummary,
        senderSignature,
      });

      return NextResponse.json({
        ...result,
        isFollowUp: true,
        parentEmailId,
        originalSentDate,
      });
    }

    // 4. Handle Initial cold email generation from Job Description
    const jdText = body?.jdText;
    if (!jdText || typeof jdText !== "string" || jdText.trim().length < 20) {
      return NextResponse.json(
        { error: "Please provide a valid job description (at least 20 characters)." },
        { status: 400 }
      );
    }

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
