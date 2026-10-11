import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { analyzeJdAndDraftEmail, generateFollowUpEmail } from "@/lib/ai";
import { formatSenderSignature } from "@/lib/signature";
import { FREE_REGEN_LIMIT } from "@/lib/constants/plans";
import { aiRateLimiter } from "@/lib/rate-limiter";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const type = body?.type || "initial";

    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    // 1. Enforce user authentication for all generation requests
    if (authError || !user) {
      return NextResponse.json(
        { error: "You must be signed in to generate tailored letters." },
        { status: 401 }
      );
    }

    // 2. Enforce AI generation rate limits (per user)
    const rateLimitStatus = aiRateLimiter.check(user.id);
    if (!rateLimitStatus.success) {
      return NextResponse.json(
        {
          error: "You are generating letters too quickly. Please wait a moment before trying again.",
          code: "RATE_LIMIT_EXCEEDED",
        },
        { status: 429 }
      );
    }

    // 3. Fetch user profile, plan & signature preferences in a single query
    const { data: profile } = await supabase
      .from("profiles")
      .select("plan, full_name, sign_off, portfolio_url, github_url, linkedin_url, phone, custom_signature")
      .eq("id", user.id)
      .maybeSingle();

    const plan = profile?.plan || "free";

    // 4. If this is a follow-up request, enforce Pro Plan server-side
    if (type === "followup") {
      if (plan !== "pro") {
        return NextResponse.json(
          {
            error: "Follow-ups are a Pro feature.",
            code: "PRO_FEATURE_REQUIRED",
          },
          { status: 403 }
        );
      }
    }

    // 5. Enforce Free-tier rewrite limits server-side
    if (
      plan === "free" &&
      body?.isRegeneration &&
      typeof body?.regenerationCount === "number" &&
      body.regenerationCount >= FREE_REGEN_LIMIT
    ) {
      return NextResponse.json(
        {
          error: "You've used both free rewrites for this draft. Upgrade to Pro for unlimited rewrites.",
          code: "REGEN_LIMIT_REACHED",
        },
        { status: 403 }
      );
    }

    // 6. Fetch authenticated user's background / skills summary from Supabase
    let skillsSummary = "";
    try {
      // Fetch resume skills summary (specific resumeId if provided, or default)
      let resumeQuery = supabase
        .from("resume")
        .select("id, skills_summary")
        .eq("user_id", user.id);

      if (body.resumeId) {
        resumeQuery = resumeQuery.eq("id", body.resumeId);
      } else {
        resumeQuery = resumeQuery
          .order("is_default", { ascending: false })
          .order("updated_at", { ascending: false });
      }

      const { data: resumeData } = await resumeQuery.limit(1).maybeSingle();

      if (resumeData?.skills_summary) {
        skillsSummary = resumeData.skills_summary;
      }
    } catch (dbErr) {
      console.warn("Could not fetch user resume from Supabase:", dbErr);
    }

    const senderSignature = profile ? formatSenderSignature(profile) : "";

    // 3. Handle Follow-up generation
    if (type === "followup") {
      const { parentEmailId } = body;
      let {
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

    if (jdText.length > 20000) {
      return NextResponse.json(
        { error: "Job description is too long (maximum 20,000 characters)." },
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
      message = "Google Gemini is currently experiencing a temporary traffic spike. Please try drafting again in a few seconds.";
    }

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
