import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { decryptToken } from "@/lib/crypto";

export async function POST(_req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch existing connection
    const { data: connection } = await supabase
      .from("gmail_connections")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    if (connection) {
      // Attempt to revoke with Google
      try {
        const refreshToken = decryptToken(
          connection.refresh_token_encrypted,
          connection.iv,
          connection.tag
        );

        await fetch(`https://oauth2.googleapis.com/revoke?token=${encodeURIComponent(refreshToken)}`, {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
        });
      } catch (revokeErr) {
        console.warn("Could not revoke token with Google:", revokeErr);
      }

      // Remove from database
      await supabase
        .from("gmail_connections")
        .delete()
        .eq("user_id", user.id);
    }

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    console.error("Error disconnecting Gmail:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to disconnect Gmail." },
      { status: 500 }
    );
  }
}
