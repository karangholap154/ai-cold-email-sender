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

    // 2. Otherwise return past send logs for this user
    const { data: emails, error } = await supabase
      .from("sent_emails")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ emails: emails || [] });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to fetch emails";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
