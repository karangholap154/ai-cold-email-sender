import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const email = searchParams.get("email");

    // 1. Check duplicate email query for this user
    if (email) {
      const { data, error } = await supabase
        .from("sent_emails")
        .select("id, created_at, company_name, role_title")
        .eq("user_id", user.id)
        .ilike("hr_email", email.trim())
        .eq("status", "sent")
        .limit(1)
        .maybeSingle();

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({
        exists: !!data,
        previousSend: data || null,
      });
    }

    // 2. Fetch user's plan to determine log retention window
    const { data: profile } = await supabase
      .from("profiles")
      .select("plan")
      .eq("id", user.id)
      .maybeSingle();

    const plan = (profile?.plan || "free") as "free" | "pro";

    let emailQuery = supabase
      .from("sent_emails")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    // Free plan: enforce 30-day retention window
    if (plan === "free") {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      emailQuery = emailQuery.gte("created_at", thirtyDaysAgo.toISOString());
    }

    const { data: emails, error } = await emailQuery;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Check if there are older lifetime emails that were filtered out
    let hasOlderEmails = false;
    let totalLifetimeCount = emails?.length ?? 0;

    if (plan === "free") {
      const { count: totalCount } = await supabase
        .from("sent_emails")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id);

      totalLifetimeCount = totalCount ?? (emails?.length ?? 0);
      hasOlderEmails = totalLifetimeCount > (emails?.length ?? 0);
    }

    return NextResponse.json({
      emails: emails || [],
      plan,
      hasOlderEmails,
      totalCount: totalLifetimeCount,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to fetch emails";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
