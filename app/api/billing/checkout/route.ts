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

    if (authError || !user || !user.email) {
      return NextResponse.json(
        { error: "You must be signed in to upgrade." },
        { status: 401 }
      );
    }

    const productId = process.env.DODO_PAYMENTS_PRODUCT_ID;
    if (!productId) {
      return NextResponse.json(
        { error: "Payment product is not configured in server environment." },
        { status: 500 }
      );
    }

    // Fetch user full name if available in profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name, plan")
      .eq("id", user.id)
      .maybeSingle();

    // Determine the base redirect URL
    const origin =
      req.headers.get("origin") ||
      req.nextUrl.origin ||
      process.env.NEXT_PUBLIC_APP_URL ||
      "http://localhost:3000";

    const returnUrl = `${origin}/settings?billing=success`;

    const session = await dodoClient.checkoutSessions.create({
      product_cart: [
        {
          product_id: productId,
          quantity: 1,
        },
      ],
      customer: {
        email: user.email,
        name: profile?.full_name || undefined,
      },
      return_url: returnUrl,
      metadata: {
        user_id: user.id,
      },
    });

    if (!session?.checkout_url) {
      return NextResponse.json(
        { error: "Could not generate checkout session URL from Dodo Payments." },
        { status: 502 }
      );
    }

    return NextResponse.json({ url: session.checkout_url });
  } catch (err: unknown) {
    console.error("Dodo checkout creation error:", err);
    const message = err instanceof Error ? err.message : "Failed to initiate checkout";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
