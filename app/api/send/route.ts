import { NextRequest, NextResponse } from "next/server";
import nodemailer, { type SendMailOptions } from "nodemailer";
import crypto from "crypto";
import { createClient } from "@/lib/supabase/server";
import { decryptToken } from "@/lib/crypto";
import { FREE_MONTHLY_LIMIT } from "@/lib/constants/plans";

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

    // 1. Fetch user's profile and plan (Preserves 100% of subscription checks)
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
      const startOfMonth = new Date(
        Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)
      ).toISOString();
      const { count, error: countError } = await supabase
        .from("sent_emails")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("status", "sent")
        .gte("created_at", startOfMonth);

      const sentCount = count ?? 0;

      if (!countError && sentCount >= FREE_MONTHLY_LIMIT) {
        return NextResponse.json(
          {
            error: `You've sent ${FREE_MONTHLY_LIMIT} letters this month on the free plan.`,
            code: "PLAN_LIMIT_REACHED",
            sentCount,
            limit: FREE_MONTHLY_LIMIT,
          },
          { status: 403 }
        );
      }
    }

    // 2. Fetch user's active Gmail connection
    const { data: connection, error: connError } = await supabase
      .from("gmail_connections")
      .select("*")
      .eq("user_id", user.id)
      .is("revoked_at", null)
      .maybeSingle();

    if (connError || !connection) {
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
        error_message: "Connect your Gmail in Settings to start sending.",
      });

      return NextResponse.json(
        {
          error: "Connect your Gmail in Settings to start sending.",
          code: "GMAIL_NOT_CONNECTED",
        },
        { status: 400 }
      );
    }

    // 3. Decrypt stored Google App Password
    let decryptedPassword: string;
    try {
      decryptedPassword = decryptToken(
        connection.refresh_token_encrypted,
        connection.iv,
        connection.tag
      );
    } catch (decryptErr) {
      console.error("Token decryption error:", decryptErr);
      return NextResponse.json(
        {
          error:
            "Could not decrypt your Gmail credentials. Please reconnect your Gmail in Settings.",
          code: "GMAIL_AUTH_EXPIRED",
        },
        { status: 500 }
      );
    }

    // 4. Fetch user's specified or default resume PDF from Supabase Storage
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

    // 5. If this is a follow-up, retrieve parent email's Message-ID for native conversation nesting
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
              const baseSub = recentEmail.final_subject
                .replace(/^re:\s*/i, "")
                .trim();
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
            const baseSub = parentEmail.final_subject
              .replace(/^re:\s*/i, "")
              .trim();
            finalSubjectToSend = `Re: ${baseSub}`;
          }
        } catch (parentErr) {
          console.warn("Could not query parent email thread ID:", parentErr);
        }
      }

      // Format In-Reply-To and References headers from parent message ID
      if (parentMessageId) {
        const cleanParentId = parentMessageId.trim();
        inReplyToHeader =
          cleanParentId.startsWith("<") && cleanParentId.endsWith(">")
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

    // 6. Initialize Nodemailer SMTP Transport using Gmail App Password
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: {
        user: connection.gmail_address,
        pass: decryptedPassword,
      },
      connectionTimeout: 15000,
      greetingTimeout: 15000,
    });

    const senderName = profile?.full_name?.trim();
    const fromAddress = senderName
      ? `"${senderName.replace(/"/g, '\\"')}" <${connection.gmail_address}>`
      : connection.gmail_address;

    const mailOptions: SendMailOptions = {
      from: fromAddress,
      to: normalizedEmail,
      subject: finalSubjectToSend,
      text: body.trim(),
      attachments: attachments.map((att) => ({
        filename: att.filename,
        content: att.content,
      })),
    };

    if (inReplyToHeader) {
      mailOptions.inReplyTo = inReplyToHeader;
      mailOptions.references = referencesHeader;
    }

    // 7. Send the email via Gmail SMTP
    let sendResult;
    try {
      sendResult = await transporter.sendMail(mailOptions);
    } catch (smtpErr: unknown) {
      console.error("SMTP sending error:", smtpErr);
      const errMsg =
        smtpErr instanceof Error ? smtpErr.message : "Failed to send email via SMTP.";

      // Check if credentials failed (e.g. app password was removed)
      if (
        errMsg.includes("535") ||
        errMsg.includes("Username and Password not accepted") ||
        errMsg.includes("BadCredentials") ||
        errMsg.includes("Invalid login")
      ) {
        return NextResponse.json(
          {
            error:
              "Gmail rejected your connection. Please verify your App Password in Settings.",
            code: "GMAIL_AUTH_EXPIRED",
          },
          { status: 401 }
        );
      }

      throw new Error(errMsg);
    }

    // Capture the authentic RFC 2822 Message-ID returned by Google's SMTP server
    const authenticMessageId =
      sendResult.messageId ||
      `<${Date.now()}.${crypto.randomUUID()}@gmail.com>`;

    const threadIdentifier = parentThreadId || authenticMessageId;

    // 8. Log successful send to sent_emails table scoped to user
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
      gmail_thread_id: threadIdentifier,
    };

    const { error: insertErr } = await supabase
      .from("sent_emails")
      .insert(insertPayload);

    if (insertErr) {
      console.warn(
        "Retrying sent_emails insert without new columns:",
        insertErr.message
      );
      delete insertPayload.gmail_message_id;
      delete insertPayload.gmail_thread_id;
      delete insertPayload.email_type;
      delete insertPayload.parent_email_id;
      delete insertPayload.resume_id;
      await supabase.from("sent_emails").insert(insertPayload);
    }

    return NextResponse.json({
      success: true,
      messageId: authenticMessageId,
      threadId: threadIdentifier,
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
