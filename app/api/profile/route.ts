import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data, error } = await supabase
      .from("profiles")
      .select("id, full_name, sign_off, portfolio_url, github_url, linkedin_url, phone, custom_signature, plan")
      .eq("id", user.id)
      .maybeSingle();

    const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();
    const { count: monthlySends } = await supabase
      .from("sent_emails")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("status", "sent")
      .gte("created_at", startOfMonth);

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
            plan: "free",
          },
          usage: {
            monthlySends: monthlySends ?? 0,
            monthlyLimit: 5,
            plan: "free",
          },
          migrationRequired: true,
        });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const plan = (data?.plan || "free") as "free" | "pro";

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
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const {
      full_name,
      sign_off,
      portfolio_url,
      github_url,
      linkedin_url,
      phone,
      custom_signature,
    } = body;

    const payload = {
      full_name: typeof full_name === "string" ? full_name.trim() : null,
      sign_off: typeof sign_off === "string" && sign_off.trim() ? sign_off.trim() : "Best regards,",
      portfolio_url: typeof portfolio_url === "string" ? portfolio_url.trim() : null,
      github_url: typeof github_url === "string" ? github_url.trim() : null,
      linkedin_url: typeof linkedin_url === "string" ? linkedin_url.trim() : null,
      phone: typeof phone === "string" ? phone.trim() : null,
      custom_signature: typeof custom_signature === "string" ? custom_signature.trim() : null,
      updated_at: new Date().toISOString(),
    };

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
