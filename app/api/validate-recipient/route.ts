import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/supabase/auth-helper";
import { validateRecipientEmail } from "@/lib/email-validator";

export async function POST(req: NextRequest) {
  try {
    const auth = await getAuthUser();
    if (auth.errorResponse) return auth.errorResponse;

    const body = await req.json();
    const email = typeof body?.email === "string" ? body.email : "";

    if (!email.trim()) {
      return NextResponse.json(
        { isValid: false, error: "Recipient email is required." },
        { status: 400 }
      );
    }

    const result = await validateRecipientEmail(email);

    return NextResponse.json(result);
  } catch (err: unknown) {
    console.error("Recipient validation error:", err);
    return NextResponse.json(
      { isValid: false, error: "Failed to validate recipient email address." },
      { status: 500 }
    );
  }
}
