import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { decryptToken } from "@/lib/crypto";
import { checkRepliesForRecipients } from "@/lib/imap";

export async function POST() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 1. Fetch user's active Gmail connection
    const { data: connection, error: connError } = await supabase
      .from("gmail_connections")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    if (connError || !connection) {
      return NextResponse.json(
        {
          error: "No connected Gmail account found. Please connect your Gmail in Settings.",
          code: "GMAIL_NOT_CONNECTED",
        },
        { status: 400 }
      );
    }

    // 2. Decrypt Google App Password
    let appPassword: string;
    try {
      appPassword = decryptToken(
        connection.refresh_token_encrypted,
        connection.iv,
        connection.tag
      );
    } catch (decryptErr) {
      console.error("Failed to decrypt credentials for IMAP sync:", decryptErr);
      return NextResponse.json(
        {
          error: "Could not decrypt your Gmail credentials. Please reconnect in Settings.",
          code: "GMAIL_AUTH_EXPIRED",
        },
        { status: 500 }
      );
    }

    // 3. Find sent emails to check (last 60 days, sent status, not already marked as responded)
    const sixtyDaysAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString();
    const { data: sentRecords, error: fetchError } = await supabase
      .from("sent_emails")
      .select("id, hr_email, created_at, gmail_message_id")
      .eq("user_id", user.id)
      .eq("status", "sent")
      .eq("is_responded", false)
      .gte("created_at", sixtyDaysAgo)
      .order("created_at", { ascending: false })
      .limit(30);

    if (fetchError) {
      return NextResponse.json({ error: fetchError.message }, { status: 500 });
    }

    if (!sentRecords || sentRecords.length === 0) {
      return NextResponse.json({
        checkedCount: 0,
        newRepliesCount: 0,
        message: "All sent applications are already marked as responded or none found.",
      });
    }

    const recipientsToCheck = sentRecords.map((r) => ({
      id: r.id,
      hrEmail: r.hr_email,
      sentAt: r.created_at,
      messageId: r.gmail_message_id,
    }));

    // 4. Run isolated targeted IMAP search
    const results = await checkRepliesForRecipients({
      gmailAddress: connection.gmail_address,
      appPassword,
      recipients: recipientsToCheck,
    });

    const repliedResults = results.filter((r) => r.hasReply);

    // 5. Update database for any matches
    if (repliedResults.length > 0) {
      for (const item of repliedResults) {
        await supabase
          .from("sent_emails")
          .update({
            is_responded: true,
            responded_at: item.repliedAt || new Date().toISOString(),
          })
          .eq("id", item.emailId)
          .eq("user_id", user.id);
      }
    }

    return NextResponse.json({
      checkedCount: sentRecords.length,
      newRepliesCount: repliedResults.length,
      newlyResponded: repliedResults.map((r) => r.hrEmail),
    });
  } catch (err: unknown) {
    console.error("Error in /api/emails/sync-replies:", err);
    const message = err instanceof Error ? err.message : "Failed to sync email replies";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
