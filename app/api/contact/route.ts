import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { contactRateLimiter, getClientIp } from "@/lib/rate-limiter";

const VALID_CATEGORIES = [
  "Technical Support",
  "Billing & Refunds",
  "Privacy & Data",
  "General Support",
  "Feature Feedback",
] as const;

export async function POST(req: NextRequest) {
  try {
    const clientIp = getClientIp(req);

    // 1. IP Rate Limiting (5 messages per 15 minutes per IP)
    const limitStatus = contactRateLimiter.check(clientIp);
    if (!limitStatus.success) {
      return NextResponse.json(
        {
          error: `Too many submissions from your network. Please wait a few minutes before trying again or email support@meetvina.app directly.`,
        },
        { status: 429 }
      );
    }

    // 2. Validate payload
    const body = await req.json();
    const name = typeof body?.name === "string" ? body.name.trim() : "";
    const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
    const category = typeof body?.category === "string" ? body.category.trim() : "General Support";
    const message = typeof body?.message === "string" ? body.message.trim() : "";

    if (!name || name.length < 2 || name.length > 100) {
      return NextResponse.json(
        { error: "Please enter your name (2 to 100 characters)." },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email) || email.length > 254) {
      return NextResponse.json(
        { error: "Please provide a valid email address." },
        { status: 400 }
      );
    }

    if (!message || message.length < 10 || message.length > 5000) {
      return NextResponse.json(
        { error: "Message must be between 10 and 5,000 characters." },
        { status: 400 }
      );
    }

    const sanitizedCategory = (VALID_CATEGORIES as readonly string[]).includes(category)
      ? category
      : "General Support";

    // 3. Verify Resend Configuration
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      console.error("[Contact API] RESEND_API_KEY is not defined in environment variables.");
      return NextResponse.json(
        {
          error:
            "Support contact system is temporarily unavailable. Please email support@meetvina.app directly.",
        },
        { status: 503 }
      );
    }

    const resend = new Resend(apiKey);
    const receiverEmail = process.env.CONTACT_RECEIVER_EMAIL || "support@meetvina.app";

    // Escape HTML to prevent injection in the email body
    const escapeHtml = (str: string) =>
      str
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>New Inquiry from Vina Contact Form</title>
</head>
<body style="margin: 0; padding: 24px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #F6F5F1; color: #1E2530;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #DEDAD0; border-radius: 4px; padding: 32px;">
    <div style="border-bottom: 1px solid #DEDAD0; padding-bottom: 16px; margin-bottom: 24px;">
      <span style="font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: #B8823A;">
        Vina Support Request
      </span>
      <h2 style="margin: 8px 0 0; font-size: 20px; font-weight: 600; color: #1E2530;">
        ${escapeHtml(sanitizedCategory)}
      </h2>
    </div>

    <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px; font-size: 14px;">
      <tr>
        <td style="padding: 6px 0; color: #68655C; width: 100px;">From:</td>
        <td style="padding: 6px 0; color: #1E2530; font-weight: 500;">${escapeHtml(name)}</td>
      </tr>
      <tr>
        <td style="padding: 6px 0; color: #68655C;">Email:</td>
        <td style="padding: 6px 0;"><a href="mailto:${escapeHtml(email)}" style="color: #B8823A; text-decoration: none;">${escapeHtml(email)}</a></td>
      </tr>
      <tr>
        <td style="padding: 6px 0; color: #68655C;">Category:</td>
        <td style="padding: 6px 0; color: #1E2530;">${escapeHtml(sanitizedCategory)}</td>
      </tr>
      <tr>
        <td style="padding: 6px 0; color: #68655C;">Sent At:</td>
        <td style="padding: 6px 0; color: #68655C;">${new Date().toUTCString()}</td>
      </tr>
    </table>

    <div style="background-color: #FAF9F5; border: 1px solid #DEDAD0; border-radius: 4px; padding: 20px; margin-bottom: 24px;">
      <p style="margin: 0 0 8px 0; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: #68655C;">
        Message
      </p>
      <div style="font-size: 14px; line-height: 1.6; color: #1E2530; white-space: pre-wrap;">
        ${escapeHtml(message)}
      </div>
    </div>

    <div style="border-top: 1px solid #DEDAD0; padding-top: 16px; font-size: 12px; color: #68655C;">
      <p style="margin: 0;">
        💡 <strong>Quick Reply:</strong> Hitting <em>Reply</em> in your email client will reply directly to <strong>${escapeHtml(email)}</strong>.
      </p>
    </div>
  </div>
</body>
</html>
    `.trim();

    const { data, error } = await resend.emails.send({
      from: "Vina Support Form <noreply@mail.meetvina.app>",
      to: [receiverEmail],
      replyTo: email,
      subject: `[Vina Support: ${sanitizedCategory}] ${name}`,
      html: htmlContent,
      text: `New Vina support inquiry:\n\nFrom: ${name} (${email})\nCategory: ${sanitizedCategory}\n\nMessage:\n${message}`,
    });

    if (error) {
      console.error("[Contact API] Resend error:", error);
      return NextResponse.json(
        { error: error.message || "Failed to send message via email provider." },
        { status: 502 }
      );
    }

    return NextResponse.json({
      success: true,
      messageId: data?.id,
      message: "Your message has been sent successfully. We will reply within 24–48 hours.",
    });
  } catch (err: unknown) {
    console.error("[Contact API] Unexpected error:", err);
    return NextResponse.json(
      { error: "An unexpected error occurred while processing your message." },
      { status: 500 }
    );
  }
}
