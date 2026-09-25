import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { createClient } from "@/lib/supabase/server";
import { decryptToken } from "@/lib/crypto";

/**
 * Builds an RFC 2822 MIME message buffer and returns it base64url encoded
 * for the Google Gmail API messages.send endpoint.
 */
async function buildRawMimeMessage({
  from,
  to,
  subject,
  body,
  attachments = [],
}: {
  from: string;
  to: string;
  subject: string;
  body: string;
  attachments?: Array<{ filename: string; content: Buffer }>;
}): Promise<string> {
  const transporter = nodemailer.createTransport({
    streamTransport: true,
    newline: "windows",
  });

  return new Promise<string>((resolve, reject) => {
    transporter.sendMail(
      {
        from,
        to,
        subject,
        text: body,
        attachments: attachments.map((att) => ({
          filename: att.filename,
          content: att.content,
        })),
      },
      (err, info: any) => {
        if (err) return reject(err);

        if (Buffer.isBuffer(info.message)) {
          return resolve(info.message.toString("base64url"));
        }

        const stream = info.message;
        const chunks: Buffer[] = [];
        stream.on("data", (chunk: Buffer) => chunks.push(chunk));
        stream.on("end", () => {
          const rawBuffer = Buffer.concat(chunks);
          resolve(rawBuffer.toString("base64url"));
        });
        stream.on("error", (msgErr: Error) => reject(msgErr));
      }
    );
  });
}

export async function POST(req: NextRequest) {
  let bodyData: any = {};

  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "You must be signed in to send emails." },
        { status: 401 }
      );
    }

    bodyData = await req.json();
    const {
      hrEmail,
      subject,
      body,
      jdText,
      companyName,
      roleTitle,
      emailType = "initial",
      parentEmailId = null,
    } = bodyData;

    if (!hrEmail || !hrEmail.includes("@")) {
      return NextResponse.json(
        { error: "Please provide a valid recipient email." },
        { status: 400 }
      );
    }

    if (!subject || !body) {
      return NextResponse.json(
        { error: "Subject and email body are required." },
        { status: 400 }
      );
    }

    // 1. Fetch user's profile and plan
    const { data: profile } = await supabase
      .from("profiles")
      .select("plan")
      .eq("id", user.id)
      .maybeSingle();

    const plan = profile?.plan || "free";

    // Enforce Pro exclusivity for follow-up emails
    if (emailType === "followup" && plan !== "pro") {
      return NextResponse.json(
        {
          error: "Follow-up correspondence is exclusive to Pro members. Upgrade your account to unlock one-click follow-ups.",
          code: "PRO_FEATURE_REQUIRED",
        },
        { status: 403 }
      );
    }

    // Enforce Free-Tier Monthly Send Cap (5 sends/calendar month)
    if (plan === "free") {
      const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();
      const { count, error: countError } = await supabase
        .from("sent_emails")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("status", "sent")
        .gte("created_at", startOfMonth);

      const sentCount = count ?? 0;
      const FREE_TIER_LIMIT = 5;

      if (!countError && sentCount >= FREE_TIER_LIMIT) {
        return NextResponse.json(
          {
            error: `Monthly quota reached: Free accounts include ${FREE_TIER_LIMIT} sent letters per calendar month. Upgrade to Pro for unlimited correspondence.`,
            code: "PLAN_LIMIT_REACHED",
            sentCount,
            limit: FREE_TIER_LIMIT,
          },
          { status: 403 }
        );
      }
    }

    // 2. Fetch user's active Gmail OAuth connection
    const { data: connection, error: connError } = await supabase
      .from("gmail_connections")
      .select("*")
      .eq("user_id", user.id)
      .is("revoked_at", null)
      .maybeSingle();

    if (connError || !connection) {
      // Record failed attempt in sent_emails for audit
      await supabase.from("sent_emails").insert({
        user_id: user.id,
        jd_text: jdText || "",
        hr_email: hrEmail.trim(),
        company_name: companyName || null,
        role_title: roleTitle || null,
        generated_subject: subject,
        generated_body: body,
        final_subject: subject,
        final_body: body,
        status: "failed",
        error_message: "No Gmail account connected. Connect your Gmail in Settings before sending.",
      });

      return NextResponse.json(
        {
          error: "No Gmail account connected. Please connect your Gmail in Settings before sending.",
          code: "GMAIL_NOT_CONNECTED",
        },
        { status: 400 }
      );
    }

    // 2. Decrypt refresh token and obtain a fresh access token from Google
    let refreshToken: string;
    try {
      refreshToken = decryptToken(
        connection.refresh_token_encrypted,
        connection.iv,
        connection.tag
      );
    } catch (decryptErr) {
      console.error("Token decryption error:", decryptErr);
      return NextResponse.json(
        {
          error: "Could not decrypt your Gmail credentials. Please reconnect your Gmail in Settings.",
          code: "GMAIL_AUTH_EXPIRED",
        },
        { status: 500 }
      );
    }

    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      return NextResponse.json(
        { error: "Google OAuth credentials are not properly configured on server." },
        { status: 500 }
      );
    }

    const tokenRefreshRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: refreshToken,
        grant_type: "refresh_token",
      }),
    });

    const tokenRefreshData = await tokenRefreshRes.json();

    if (!tokenRefreshRes.ok || !tokenRefreshData.access_token) {
      console.error("Google token refresh error:", tokenRefreshData);

      // If token was revoked or expired, mark revoked in DB
      if (tokenRefreshData.error === "invalid_grant") {
        await supabase
          .from("gmail_connections")
          .update({ revoked_at: new Date().toISOString() })
          .eq("user_id", user.id);
      }

      return NextResponse.json(
        {
          error: "Your Gmail connection session has expired or was revoked. Please reconnect your Gmail account in Settings.",
          code: "GMAIL_AUTH_EXPIRED",
        },
        { status: 401 }
      );
    }

    const accessToken = tokenRefreshData.access_token;

    // 3. Fetch user's latest resume PDF from Supabase Storage
    const { data: resumeRow } = await supabase
      .from("resume")
      .select("*")
      .eq("user_id", user.id)
      .limit(1)
      .maybeSingle();

    let attachments: Array<{ filename: string; content: Buffer }> = [];

    if (resumeRow?.file_url) {
      const { data: fileBlob, error: downloadError } = await supabase.storage
        .from("resumes")
        .download(resumeRow.file_url);

      if (!downloadError && fileBlob) {
        const arrayBuffer = await fileBlob.arrayBuffer();
        attachments.push({
          filename: resumeRow.file_name || "Resume.pdf",
          content: Buffer.from(arrayBuffer),
        });
      } else {
        console.warn("Could not download resume file from storage:", downloadError);
      }
    }

    // 4. Construct RFC 2822 base64url MIME message
    const rawMime = await buildRawMimeMessage({
      from: connection.gmail_address,
      to: hrEmail.trim(),
      subject: subject.trim(),
      body: body.trim(),
      attachments,
    });

    // 5. Send message via Google Gmail API
    const gmailSendRes = await fetch(
      "https://gmail.googleapis.com/gmail/v1/users/me/messages/send",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ raw: rawMime }),
      }
    );

    const gmailSendData = await gmailSendRes.json();

    if (!gmailSendRes.ok) {
      console.error("Gmail API sending error:", gmailSendData);
      throw new Error(
        gmailSendData.error?.message || "Failed to dispatch email via Gmail API."
      );
    }

    // 6. Log successful send to sent_emails table scoped to user
    const insertPayload: Record<string, any> = {
      user_id: user.id,
      jd_text: jdText || "",
      hr_email: hrEmail.trim(),
      company_name: companyName || null,
      role_title: roleTitle || null,
      generated_subject: subject,
      generated_body: body,
      final_subject: subject,
      final_body: body,
      status: "sent",
      error_message: null,
      email_type: emailType,
      parent_email_id: parentEmailId || null,
    };

    const { error: insertErr } = await supabase.from("sent_emails").insert(insertPayload);
    if (insertErr) {
      // Graceful fallback if columns email_type or parent_email_id don't exist yet
      delete insertPayload.email_type;
      delete insertPayload.parent_email_id;
      await supabase.from("sent_emails").insert(insertPayload);
    }

    return NextResponse.json({
      success: true,
      messageId: gmailSendData.id,
      threadId: gmailSendData.threadId,
    });
  } catch (err: unknown) {
    console.error("Send route error:", err);
    const message = err instanceof Error ? err.message : "Failed to send email.";

    // Log failure to database if possible
    try {
      if (bodyData?.hrEmail) {
        const supabase = await createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user) {
          await supabase.from("sent_emails").insert({
            user_id: user.id,
            jd_text: bodyData.jdText || "",
            hr_email: bodyData.hrEmail,
            company_name: bodyData.companyName || null,
            role_title: bodyData.roleTitle || null,
            generated_subject: bodyData.subject || "Unknown",
            generated_body: bodyData.body || "Unknown",
            final_subject: bodyData.subject || "Unknown",
            final_body: bodyData.body || "Unknown",
            status: "failed",
            error_message: message,
          });
        }
      }
    } catch (logErr) {
      console.error("Failed to log error to sent_emails table:", logErr);
    }

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
