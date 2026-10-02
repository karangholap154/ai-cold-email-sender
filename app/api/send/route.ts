import { NextRequest, NextResponse } from "next/server";
import nodemailer, { type SendMailOptions } from "nodemailer";
import crypto from "crypto";
import { createClient } from "@/lib/supabase/server";
import { decryptToken } from "@/lib/crypto";

interface SendRequestBody {
  hrEmail?: string;
  subject?: string;
  body?: string;
  jdText?: string;
  companyName?: string;
  roleTitle?: string;
  emailType?: "initial" | "followup";
  parentEmailId?: string | null;
  resumeId?: string | null;
}

/**
 * Builds an RFC 2822 MIME message buffer and returns it base64url encoded
 * along with its assigned RFC 2822 Message-ID for conversation threading.
 */
async function buildRawMimeMessage({
  from,
  to,
  subject,
  body,
  attachments = [],
  inReplyTo,
  references,
}: {
  from: string;
  to: string;
  subject: string;
  body: string;
  attachments?: Array<{ filename: string; content: Buffer }>;
  inReplyTo?: string;
  references?: string;
}): Promise<{ raw: string; rfcMessageId: string }> {
  const transporter = nodemailer.createTransport({
    streamTransport: true,
    newline: "windows",
  });

  const domain = from.includes("@")
    ? from.split("@")[1].replace(/[>]/g, "").trim()
    : "gmail.com";

  const assignedMessageId = `<${Date.now()}.${crypto.randomUUID()}@${domain}>`;

  const mailOptions: SendMailOptions = {
    from,
    to,
    subject,
    text: body,
    messageId: assignedMessageId,
    attachments: attachments.map((att) => ({
      filename: att.filename,
      content: att.content,
    })),
  };

  if (inReplyTo) {
    mailOptions.inReplyTo = inReplyTo.startsWith("<")
      ? inReplyTo
      : `<${inReplyTo}>`;
  }
  if (references) {
    mailOptions.references = references.startsWith("<")
      ? references
      : `<${references}>`;
  }

  return new Promise<{ raw: string; rfcMessageId: string }>((resolve, reject) => {
    transporter.sendMail(
      mailOptions,
      (err, info: { message: Buffer | NodeJS.ReadableStream }) => {
        if (err) return reject(err);

        if (Buffer.isBuffer(info.message)) {
          return resolve({
            raw: info.message.toString("base64url"),
            rfcMessageId: assignedMessageId,
          });
        }

        const stream = info.message;
        const chunks: Buffer[] = [];
        stream.on("data", (chunk: Buffer) => chunks.push(chunk));
        stream.on("end", () => {
          const rawBuffer = Buffer.concat(chunks);
          resolve({
            raw: rawBuffer.toString("base64url"),
            rfcMessageId: assignedMessageId,
          });
        });
        stream.on("error", (msgErr: Error) => reject(msgErr));
      }
    );
  });
}

export async function POST(req: NextRequest) {
  let bodyData: Partial<SendRequestBody> = {};

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
      resumeId = null,
    } = bodyData;

    if (!hrEmail || !hrEmail.includes("@")) {
      return NextResponse.json(
        { error: "Please provide a valid recipient email." },
        { status: 400 }
      );
    }

    const normalizedEmail = hrEmail.trim().toLowerCase();

    if (!subject || !body) {
      return NextResponse.json(
        { error: "Subject and email body are required." },
        { status: 400 }
      );
    }

    // 1. Fetch user's profile and plan
    const { data: profile } = await supabase
      .from("profiles")
      .select("plan, full_name")
      .eq("id", user.id)
      .maybeSingle();

    const plan = profile?.plan || "free";

    // Enforce Pro exclusivity for follow-up emails
    if (emailType === "followup" && plan !== "pro") {
      return NextResponse.json(
        {
          error: "Follow-ups are a Pro feature.",
          code: "PRO_FEATURE_REQUIRED",
        },
        { status: 403 }
      );
    }

    // Enforce Free-Tier Monthly Send Cap (5 sends/calendar month, UTC-normalized)
    if (plan === "free") {
      const now = new Date();
      const startOfMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString();
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
            error: "You've sent 5 letters this month on the free plan.",
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
        hr_email: normalizedEmail,
        company_name: companyName || null,
        role_title: roleTitle || null,
        generated_subject: subject,
        generated_body: body,
        final_subject: subject,
        final_body: body,
        status: "failed",
        error_message: "Connect your Gmail to start sending.",
      });

      return NextResponse.json(
        {
          error: "Connect your Gmail to start sending.",
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

    // 3. Fetch user's specified or default resume PDF from Supabase Storage
    let resumeQuery = supabase
      .from("resume")
      .select("*")
      .eq("user_id", user.id);

    if (resumeId) {
      resumeQuery = resumeQuery.eq("id", resumeId);
    } else {
      resumeQuery = resumeQuery
        .order("is_default", { ascending: false })
        .order("updated_at", { ascending: false });
    }

    const { data: resumeRow } = await resumeQuery.limit(1).maybeSingle();

    const attachments: Array<{ filename: string; content: Buffer }> = [];

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

    // 4. If this is a follow-up, retrieve parent email's threadId & RFC 2822 Message-ID for native conversation nesting
    let parentThreadId: string | null = null;
    let parentMessageId: string | null = null;
    let inReplyToHeader: string | undefined;
    let referencesHeader: string | undefined;
    let finalSubjectToSend = subject.trim();
    let resolvedParentEmailId: string | null = parentEmailId || null;

    if (emailType === "followup") {

      // If parentEmailId was not passed explicitly, auto-detect the most recent sent email to this hrEmail
      if (!resolvedParentEmailId) {
        try {
          const { data: recentEmail } = await supabase
            .from("sent_emails")
            .select("id, gmail_thread_id, gmail_message_id, final_subject")
            .eq("user_id", user.id)
            .ilike("hr_email", normalizedEmail)
            .eq("status", "sent")
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle();

          if (recentEmail) {
            resolvedParentEmailId = recentEmail.id;
            parentThreadId = recentEmail.gmail_thread_id;
            parentMessageId = recentEmail.gmail_message_id;
            if (recentEmail.final_subject) {
              const baseSub = recentEmail.final_subject.replace(/^re:\s*/i, "").trim();
              finalSubjectToSend = `Re: ${baseSub}`;
            }
          }
        } catch (findErr) {
          console.warn("Could not auto-detect previous email for thread:", findErr);
        }
      } else {
        try {
          const { data: parentEmail } = await supabase
            .from("sent_emails")
            .select("gmail_thread_id, gmail_message_id, final_subject")
            .eq("id", resolvedParentEmailId)
            .eq("user_id", user.id)
            .maybeSingle();

          if (parentEmail?.gmail_thread_id) {
            parentThreadId = parentEmail.gmail_thread_id;
          }
          if (parentEmail?.gmail_message_id) {
            parentMessageId = parentEmail.gmail_message_id;
          }
          if (parentEmail?.final_subject) {
            const baseSub = parentEmail.final_subject.replace(/^re:\s*/i, "").trim();
            finalSubjectToSend = `Re: ${baseSub}`;
          }
        } catch (parentErr) {
          console.warn("Could not query parent email thread ID:", parentErr);
        }
      }

      // If we don't have parent IDs from DB, query Gmail API directly for the latest message sent to this recipient
      if (!parentThreadId || !parentMessageId) {
        try {
          const listRes = await fetch(
            `https://gmail.googleapis.com/gmail/v1/users/me/messages?q=to:${encodeURIComponent(normalizedEmail)}&maxResults=1`,
            {
              headers: { Authorization: `Bearer ${accessToken}` },
            }
          );
          if (listRes.ok) {
            const listData = await listRes.json();
            const firstMsg = listData.messages?.[0];
            if (firstMsg) {
              parentThreadId = parentThreadId || firstMsg.threadId;
              parentMessageId = parentMessageId || firstMsg.id;
            }
          }
        } catch (gmailListErr) {
          console.warn("Could not query Gmail API for parent thread:", gmailListErr);
        }
      }

      // Format In-Reply-To and References headers from parent message ID
      if (parentMessageId) {
        const cleanParentId = parentMessageId.trim();
        inReplyToHeader = cleanParentId.startsWith("<") && cleanParentId.endsWith(">")
          ? cleanParentId
          : cleanParentId.includes("@")
          ? `<${cleanParentId}>`
          : `<${cleanParentId}@mail.gmail.com>`;
        referencesHeader = inReplyToHeader;
      }

      // Strictly ensure follow-up subject begins with "Re: "
      if (!finalSubjectToSend.toLowerCase().startsWith("re:")) {
        finalSubjectToSend = `Re: ${finalSubjectToSend}`;
      }
    }

    // 5. Construct RFC 2822 base64url MIME message
    const senderName = profile?.full_name?.trim();
    const fromAddress = senderName
      ? `"${senderName.replace(/"/g, '\\"')}" <${connection.gmail_address}>`
      : connection.gmail_address;

    const { raw: rawMime, rfcMessageId: currentRfcMessageId } = await buildRawMimeMessage({
      from: fromAddress,
      to: normalizedEmail,
      subject: finalSubjectToSend,
      body: body.trim(),
      attachments,
      inReplyTo: inReplyToHeader,
      references: referencesHeader,
    });

    // 6. Send message via Google Gmail API
    const gmailPayload: Record<string, string> = {
      raw: rawMime,
    };
    if (parentThreadId) {
      gmailPayload.threadId = parentThreadId;
    }

    const gmailSendRes = await fetch(
      "https://gmail.googleapis.com/gmail/v1/users/me/messages/send",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(gmailPayload),
      }
    );

    const gmailSendData = await gmailSendRes.json();

    if (!gmailSendRes.ok) {
      console.error("Gmail API sending error:", gmailSendData);
      throw new Error(
        gmailSendData.error?.message || "Failed to dispatch email via Gmail API."
      );
    }

    // Retrieve Google's authentic RFC 2822 Message-ID header from Gmail API
    let authenticMessageId: string = currentRfcMessageId;
    if (gmailSendData.id) {
      try {
        const getMsgRes = await fetch(
          `https://gmail.googleapis.com/gmail/v1/users/me/messages/${gmailSendData.id}?format=metadata&metadataHeaders=Message-ID`,
          {
            headers: { Authorization: `Bearer ${accessToken}` },
          }
        );
        if (getMsgRes.ok) {
          const msgDetails = await getMsgRes.json();
          const headers = (msgDetails.payload?.headers || []) as Array<{ name: string; value: string }>;
          const realId = headers.find(
            (h) => h.name.toLowerCase() === "message-id"
          )?.value;
          if (realId) {
            authenticMessageId = realId;
          }
        }
      } catch (getErr) {
        console.warn("Could not fetch sent message headers from Gmail API:", getErr);
      }
    }

    // 7. Log successful send to sent_emails table scoped to user
    const insertPayload: Record<string, unknown> = {
      user_id: user.id,
      jd_text: jdText || "",
      hr_email: normalizedEmail,
      company_name: companyName || null,
      role_title: roleTitle || null,
      generated_subject: finalSubjectToSend,
      generated_body: body,
      final_subject: finalSubjectToSend,
      final_body: body,
      status: "sent",
      error_message: null,
      email_type: emailType,
      parent_email_id: resolvedParentEmailId || null,
      resume_id: resumeRow?.id || null,
      gmail_message_id: authenticMessageId,
      gmail_thread_id: gmailSendData.threadId || parentThreadId || null,
    };

    const { error: insertErr } = await supabase.from("sent_emails").insert(insertPayload);
    if (insertErr) {
      // Graceful fallback if columns don't exist yet in older schema
      console.warn("Retrying sent_emails insert without new columns:", insertErr.message);
      delete insertPayload.gmail_message_id;
      delete insertPayload.gmail_thread_id;
      delete insertPayload.email_type;
      delete insertPayload.parent_email_id;
      delete insertPayload.resume_id;
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
            hr_email: bodyData.hrEmail.trim().toLowerCase(),
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
