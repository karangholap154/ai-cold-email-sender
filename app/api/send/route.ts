import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { getServiceSupabase } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const supabase = getServiceSupabase();
  let bodyData: any = {};

  try {
    bodyData = await req.json();
    const { hrEmail, subject, body, jdText, companyName, roleTitle } = bodyData;

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

    // 1. Verify Gmail SMTP credentials
    const gmailUser = process.env.GMAIL_USER;
    const gmailAppPassword = process.env.GMAIL_APP_PASSWORD;

    if (!gmailUser || !gmailAppPassword) {
      // Record failed attempt in database
      await supabase.from("sent_emails").insert({
        jd_text: jdText || "",
        hr_email: hrEmail,
        company_name: companyName || null,
        role_title: roleTitle || null,
        generated_subject: subject,
        generated_body: body,
        final_subject: subject,
        final_body: body,
        status: "failed",
        error_message: "GMAIL_USER or GMAIL_APP_PASSWORD is not configured in .env.local",
      });

      return NextResponse.json(
        {
          error:
            "Gmail credentials are not configured. Please set GMAIL_USER and GMAIL_APP_PASSWORD in .env.local.",
        },
        { status: 500 }
      );
    }

    // 2. Fetch latest resume PDF from Supabase Storage
    const { data: resumeRow } = await supabase
      .from("resume")
      .select("*")
      .order("updated_at", { ascending: false })
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

    // 3. Send email via Nodemailer Gmail SMTP
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: gmailUser,
        pass: gmailAppPassword,
      },
    });

    const info = await transporter.sendMail({
      from: gmailUser,
      to: hrEmail.trim(),
      subject: subject.trim(),
      text: body.trim(),
      attachments,
    });

    // 4. Log successful send to sent_emails table
    await supabase.from("sent_emails").insert({
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
    });

    return NextResponse.json({
      success: true,
      messageId: info.messageId,
    });
  } catch (err: unknown) {
    console.error("Send route error:", err);
    const message = err instanceof Error ? err.message : "Failed to send email.";

    // Log failure to database if possible
    try {
      if (bodyData?.hrEmail) {
        await supabase.from("sent_emails").insert({
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
    } catch (logErr) {
      console.error("Failed to log error to sent_emails table:", logErr);
    }

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
