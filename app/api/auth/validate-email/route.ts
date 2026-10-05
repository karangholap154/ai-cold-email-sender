import { NextRequest, NextResponse } from "next/server";
import { validateEmailWithDns } from "@/lib/email-validator";
import { signupRateLimiter, getClientIp } from "@/lib/rate-limiter";

export async function POST(req: NextRequest) {
  try {
    const clientIp = getClientIp(req);

    // 1. IP Rate Limiting: Max 3 registration attempts per IP per 24 hours
    const limitStatus = signupRateLimiter.check(clientIp);
    if (!limitStatus.success) {
      return NextResponse.json(
        {
          valid: false,
          error: `Too many registration attempts from this network. Please try again in ${limitStatus.resetInHours} hour(s) or contact support.`,
        },
        { status: 429 }
      );
    }

    const body = await req.json();
    const email = typeof body?.email === "string" ? body.email : "";

    // 2. Deep Validation: Syntax, 120,000+ domain list, DNS MX records, and mail cluster IPs
    const result = await validateEmailWithDns(email);

    if (!result.isValid) {
      return NextResponse.json(
        { valid: false, error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({ valid: true });
  } catch {
    return NextResponse.json(
      { valid: false, error: "Invalid request payload." },
      { status: 400 }
    );
  }
}
