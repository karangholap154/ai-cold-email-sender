import { NextRequest, NextResponse } from "next/server";
import { validateEmailAddress } from "@/lib/email-validator";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const email = typeof body?.email === "string" ? body.email : "";

    const result = validateEmailAddress(email);

    if (!result.isValid) {
      return NextResponse.json(
        { valid: false, error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({ valid: true });
  } catch (error: unknown) {
    return NextResponse.json(
      { valid: false, error: "Invalid request payload." },
      { status: 400 }
    );
  }
}
