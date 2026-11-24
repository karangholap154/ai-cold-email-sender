import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/supabase/auth-helper";
import { DAILY_SAFETY_LIMIT } from "@/lib/constants/plans";
import { getUserSendCounts } from "@/lib/usage";

export async function GET() {
  try {
    const auth = await getAuthUser();
    if (auth.errorResponse) return auth.errorResponse;
    const { user, supabase } = auth;

    let { data, error } = await supabase
      .from("profiles")
      .select("id, full_name, sign_off, portfolio_url, github_url, linkedin_url, phone, custom_signature, plan, dodo_customer_id, dodo_subscription_id, skills")
      .eq("id", user.id)
      .maybeSingle();

    if (error && (error.code === "42703" || error.message?.includes("skills"))) {
      const fallback = await supabase
        .from("profiles")
        .select("id, full_name, sign_off, portfolio_url, github_url, linkedin_url, phone, custom_signature, plan, dodo_customer_id, dodo_subscription_id")
        .eq("id", user.id)
        .maybeSingle();
      data = fallback.data ? { ...fallback.data, skills: [] } : null;
      error = fallback.error;
    }

    const plan = (data?.plan || "free") as "free" | "pro";
    const { monthlySends, dailySends } = await getUserSendCounts(supabase, user.id, plan);

    if (error) {
      // If columns don't exist yet in the database, return graceful fallback
      if (error.code === "42703" || error.message?.includes("column")) {
        return NextResponse.json({
          profile: {
            id: user.id,
            full_name: "",
            sign_off: "Best regards,",
            portfolio_url: "",
            github_url: "",
            linkedin_url: "",
            phone: "",
            custom_signature: "",
            skills: [],
            plan: "free",
          },
          usage: {
            monthlySends: monthlySends ?? 0,
            monthlyLimit: 5,
            dailySends,
            dailyLimit: DAILY_SAFETY_LIMIT,
            plan: "free",
          },
          migrationRequired: true,
        });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      profile: data || {
        id: user.id,
        full_name: "",
        sign_off: "Best regards,",
        portfolio_url: "",
        github_url: "",
        linkedin_url: "",
        phone: "",
        custom_signature: "",
        plan: "free",
      },
      usage: {
        monthlySends: monthlySends ?? 0,
        monthlyLimit: plan === "pro" ? null : 5,
        dailySends,
        dailyLimit: DAILY_SAFETY_LIMIT,
        plan,
      },
      migrationRequired: false,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to fetch profile";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await getAuthUser();
    if (auth.errorResponse) return auth.errorResponse;
    const { user, supabase } = auth;

    const body = await req.json();
    const {
      full_name,
      sign_off,
      portfolio_url,
      github_url,
      linkedin_url,
      phone,
      custom_signature,
      skills,
    } = body;

    const payload: Record<string, unknown> = {
      full_name: typeof full_name === "string" ? full_name.trim() : null,
      sign_off: typeof sign_off === "string" && sign_off.trim() ? sign_off.trim() : "Best regards,",
      portfolio_url: typeof portfolio_url === "string" ? portfolio_url.trim() : null,
      github_url: typeof github_url === "string" ? github_url.trim() : null,
      linkedin_url: typeof linkedin_url === "string" ? linkedin_url.trim() : null,
      phone: typeof phone === "string" ? phone.trim() : null,
      custom_signature: typeof custom_signature === "string" ? custom_signature.trim() : null,
      updated_at: new Date().toISOString(),
    };

    if (Array.isArray(skills)) {
      payload.skills = skills
        .map((s: unknown) => (typeof s === "string" ? s.trim() : ""))
        .filter(Boolean);
    }

    const { data, error } = await supabase
      .from("profiles")
      .update(payload)
      .eq("id", user.id)
      .select()
      .single();

    if (error) {
      if (error.code === "42703" || error.message?.includes("column")) {
        return NextResponse.json(
          {
            error: "Database columns not found in 'profiles'. Please run the migration query in your Supabase SQL editor.",
            migrationRequired: true,
          },
          { status: 400 }
        );
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      profile: data,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to save profile";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
