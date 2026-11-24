import { NextRequest, NextResponse } from "next/server";
import { validateRecipientEmail } from "@/lib/email-validator";

// Rate-limiting can be handled by cloudflare/edge or simple in-memory IP tracker
const ipHits = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(ip: string, limit = 40, windowMs = 60000): boolean {
  const now = Date.now();
  const record = ipHits.get(ip);
  if (!record || record.resetAt < now) {
    ipHits.set(ip, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (record.count >= limit) return false;
  record.count += 1;
  return true;
}

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0] || "unknown";
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { isValid: false, error: "Too many requests. Please wait a moment." },
        { status: 429 }
      );
    }

    const body = await req.json();
    const email = typeof body?.email === "string" ? body.email.trim() : "";

    if (!email) {
      return NextResponse.json(
        { isValid: false, error: "Email or domain is required." },
        { status: 400 }
      );
    }

    // Support domain only or full email
    const queryEmail = email.includes("@") ? email : `test@${email}`;
    const result = await validateRecipientEmail(queryEmail);

    return NextResponse.json({
      isValid: result.isValid,
      domain: result.domain,
      mxHost: result.mxHost,
      suggestion: result.suggestion,
      error: result.error,
    });
  } catch (err: unknown) {
    console.error("Public MX check error:", err);
    return NextResponse.json(
      { isValid: false, error: "Failed to verify mail server." },
      { status: 500 }
    );
  }
}
