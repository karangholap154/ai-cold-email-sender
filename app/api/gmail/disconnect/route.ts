import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/supabase/auth-helper";

export async function POST() {
  try {
    const auth = await getAuthUser();
    if (auth.errorResponse) return auth.errorResponse;
    const { user, supabase } = auth;

    // Fetch existing connection
    const { data: connection } = await supabase
      .from("gmail_connections")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    if (connection) {
      // Remove connection from database
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
