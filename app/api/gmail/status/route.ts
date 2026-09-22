import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(_req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ connected: false }, { status: 401 });
    }

    const { data: connection, error: dbError } = await supabase
      .from("gmail_connections")
      .select("gmail_address, connected_at, revoked_at")
      .eq("user_id", user.id)
      .is("revoked_at", null)
      .maybeSingle();

    if (dbError) {
      console.warn("Could not query gmail_connections:", dbError.message);
      return NextResponse.json({ connected: false, error: dbError.message });
    }

    if (!connection) {
      return NextResponse.json({ connected: false });
    }

    return NextResponse.json({
      connected: true,
      email: connection.gmail_address,
      connectedAt: connection.connected_at,
    });
  } catch (err: unknown) {
    console.error("Error checking Gmail connection status:", err);
    return NextResponse.json({ connected: false }, { status: 500 });
  }
}
