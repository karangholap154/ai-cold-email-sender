import { NextRequest, NextResponse } from "next/server";
import { Webhook } from "svix";
import { getServiceSupabase } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const webhookSecret = process.env.DODO_PAYMENTS_WEBHOOK_KEY;
  if (!webhookSecret) {
    console.error("DODO_PAYMENTS_WEBHOOK_KEY is not configured.");
    return NextResponse.json(
      { error: "Webhook secret is not configured" },
      { status: 500 }
    );
  }

  const rawBody = await req.text();
  const webhookId = req.headers.get("webhook-id");
  const webhookTimestamp = req.headers.get("webhook-timestamp");
  const webhookSignature = req.headers.get("webhook-signature");

  if (!webhookId || !webhookTimestamp || !webhookSignature) {
    return NextResponse.json(
      { error: "Missing required webhook headers" },
      { status: 400 }
    );
  }

  let event: Record<string, unknown>;
  try {
    const wh = new Webhook(webhookSecret);
    event = wh.verify(rawBody, {
      "webhook-id": webhookId,
      "webhook-timestamp": webhookTimestamp,
      "webhook-signature": webhookSignature,
    }) as Record<string, unknown>;
  } catch (err: unknown) {
    console.error("Webhook signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const eventType = (event.type as string) || (event.event_type as string);
  const data = (event.data as Record<string, unknown>) || {};
  const metadata = data.metadata as Record<string, unknown> | undefined;
  const customer = data.customer as Record<string, unknown> | undefined;
  console.log(`[Dodo Webhook] Received event: ${eventType}`, {
    id: data.subscription_id || data.payment_id || data.id,
    metadata,
  });

  const supabase = getServiceSupabase();

  try {
    // 1. Identify User ID from metadata or customer email
    let userId: string | null =
      (metadata?.user_id as string) ||
      ((data.subscription as Record<string, unknown>)?.metadata as Record<string, unknown>)?.user_id as string ||
      ((data.customer as Record<string, unknown>)?.metadata as Record<string, unknown>)?.user_id as string ||
      null;

    const customerEmail: string | null =
      (customer?.email as string) ||
      (data.customer_email as string) ||
      (data.email as string) ||
      ((data.customer as Record<string, unknown>)?.email as string) ||
      null;

    if (!userId && customerEmail) {
      const { data: userRecord } = await supabase
        .from("profiles")
        .select("id")
        .eq("id", customerEmail) // in case email was used
        .maybeSingle();

      if (!userRecord) {
        // Look up by auth.users email via admin API
        const { data: adminUsers } = await supabase.auth.admin.listUsers();
        const matched = adminUsers?.users?.find(
          (u) => u.email?.toLowerCase() === customerEmail.toLowerCase()
        );
        if (matched) {
          userId = matched.id;
        }
      } else {
        userId = userRecord.id;
      }
    }

    if (!userId) {
      console.warn(
        `[Dodo Webhook] No matching user found for event ${eventType}`,
        data
      );
      // Return 200 so Dodo doesn't retry indefinitely
      return NextResponse.json({ received: true, note: "User not identified" });
    }

    // 2. Handle Subscription Activation & Renewals
    if (
      eventType === "subscription.active" ||
      eventType === "subscription.renewed" ||
      eventType === "subscription.updated" ||
      eventType === "subscription.unpaused" ||
      eventType === "payment.succeeded"
    ) {
      const subscriptionId =
        (data.subscription_id as string) || (data.id as string) || null;
      const customerId =
        (customer?.customer_id as string) ||
        (data.customer_id as string) ||
        null;
      const nextBillingDate =
        (data.next_billing_date as string | number | undefined) ||
        (data.expires_at as string | number | undefined) ||
        (data.current_period_end as string | number | undefined);

      const updatePayload: Record<string, unknown> = {
        plan: "pro",
      };

      if (nextBillingDate) {
        updatePayload.current_period_end = new Date(nextBillingDate).toISOString();
      }

      // Try updating with dodo fields first, fallback gracefully if columns not added yet
      const { error: fullUpdateError } = await supabase
        .from("profiles")
        .update({
          ...updatePayload,
          dodo_customer_id: customerId,
          dodo_subscription_id: subscriptionId,
        })
        .eq("id", userId);

      if (fullUpdateError) {
        console.warn(
          "Profiles table might be missing dodo columns, updating plan only:",
          fullUpdateError.message
        );
        await supabase
          .from("profiles")
          .update(updatePayload)
          .eq("id", userId);
      }

      console.log(`[Dodo Webhook] User ${userId} upgraded to Pro.`);
    }

    // 3. Handle Subscription Cancellations / Expirations
    else if (
      eventType === "subscription.cancelled" ||
      eventType === "subscription.expired" ||
      eventType === "subscription.paused" ||
      eventType === "subscription.failed" ||
      eventType === "subscription.on_hold"
    ) {
      await supabase
        .from("profiles")
        .update({
          plan: "free",
        })
        .eq("id", userId);

      console.log(`[Dodo Webhook] User ${userId} downgraded to Free.`);
    }

    return NextResponse.json({ received: true });
  } catch (err: unknown) {
    console.error("[Dodo Webhook] Error processing event:", err);
    return NextResponse.json(
      { error: "Internal processing error" },
      { status: 500 }
    );
  }
}
