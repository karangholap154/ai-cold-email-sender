import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { dodoClient } from "@/lib/dodo";

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

    const { data: profile } = await supabase
      .from("profiles")
      .select("dodo_customer_id, plan")
      .eq("id", user.id)
      .maybeSingle();

    const origin =
      req.headers.get("origin") ||
      req.nextUrl.origin ||
      process.env.NEXT_PUBLIC_APP_URL ||
      "http://localhost:3000";

    const returnUrl = `${origin}/settings`;

    if (profile?.dodo_customer_id) {
      try {
        const portal = await dodoClient.customers.customerPortal.create(
          profile.dodo_customer_id,
          { return_url: returnUrl }
        );
        if (portal && (portal as any).url) {
          return NextResponse.json({ url: (portal as any).url });
        }
      } catch (portalErr) {
        console.warn("Could not create specific customer portal session:", portalErr);
      }
    }

    // Default fallback to Dodo Customer Portal login
    return NextResponse.json({ url: "https://customer.dodopayments.com/login" });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to open customer portal";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
