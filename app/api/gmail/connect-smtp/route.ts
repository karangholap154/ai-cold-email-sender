import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { createClient } from "@/lib/supabase/server";
import { encryptToken } from "@/lib/crypto";

interface ConnectSmtpBody {
  email?: string;
  appPassword?: string;
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "You must be signed in to connect an email account." },
        { status: 401 }
      );
    }

    const body: ConnectSmtpBody = await req.json();
    const { email, appPassword } = body;

    if (!email || !email.includes("@")) {
      return NextResponse.json(
        { error: "Please enter a valid email address." },
        { status: 400 }
      );
    }

    if (!appPassword || appPassword.trim().length === 0) {
      return NextResponse.json(
        { error: "Please enter your 16-character Google App Password." },
        { status: 400 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();
    // Google app passwords are generated as 16 characters (often with spaces like "abcd efgh ijkl mnop")
    const cleanAppPassword = appPassword.replace(/\s+/g, "").trim();

    if (cleanAppPassword.length < 16) {
      return NextResponse.json(
        {
          error:
            "Google App Passwords are 16 characters long. Please check your password at myaccount.google.com/apppasswords.",
        },
        { status: 400 }
      );
    }

    // 1. Verify SMTP handshake with Google's mail server
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: {
        user: normalizedEmail,
        pass: cleanAppPassword,
      },
      connectionTimeout: 10000,
      greetingTimeout: 10000,
    });

    try {
      await transporter.verify();
    } catch (verifyErr: unknown) {
      console.warn("SMTP verification failed:", verifyErr);
      const errMsg =
        verifyErr instanceof Error ? verifyErr.message : "Verification failed";

      if (
        errMsg.includes("535") ||
        errMsg.includes("Username and Password not accepted") ||
        errMsg.includes("BadCredentials") ||
        errMsg.includes("Invalid login")
      ) {
        return NextResponse.json(
          {
            error:
              "Google rejected these credentials. Make sure 2-Step Verification is enabled on your Google account and you created a 16-character App Password (not your normal Google account password).",
          },
          { status: 400 }
        );
      }

      return NextResponse.json(
        {
          error:
            "Could not connect to Gmail SMTP. Please verify your email and app password and try again.",
        },
        { status: 400 }
      );
    }

    // 2. Encrypt App Password with AES-256-GCM before saving
    let encryptedPayload;
    try {
      encryptedPayload = encryptToken(cleanAppPassword);
    } catch (cryptErr) {
      console.error("Encryption error:", cryptErr);
      return NextResponse.json(
        { error: "Internal server error configuring security encryption." },
        { status: 500 }
      );
    }

    // 3. Upsert into public.gmail_connections
    const { error: upsertErr } = await supabase.from("gmail_connections").upsert(
      {
        user_id: user.id,
        gmail_address: normalizedEmail,
        refresh_token_encrypted: encryptedPayload.ciphertext,
        iv: encryptedPayload.iv,
        tag: encryptedPayload.tag,
        connected_at: new Date().toISOString(),
        revoked_at: null,
      },
      { onConflict: "user_id" }
    );

    if (upsertErr) {
      console.error("Error storing connection:", upsertErr);
      return NextResponse.json(
        { error: "Failed to save connection in database." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      email: normalizedEmail,
      connectedAt: new Date().toISOString(),
    });
  } catch (err: unknown) {
    console.error("Error in connect-smtp route:", err);
    return NextResponse.json(
      { error: "An unexpected error occurred while connecting your email." },
      { status: 500 }
    );
  }
}
