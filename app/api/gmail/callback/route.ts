import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { encryptToken } from "@/lib/crypto";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const error = searchParams.get("error");
  const state = searchParams.get("state");

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  if (error || !code) {
    console.error("Google OAuth error response:", error);
    return NextResponse.redirect(
      new URL(`/settings?error=${encodeURIComponent(error || "no_code")}`, appUrl)
    );
  }

  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    // Verify user is authenticated
    if (authError || !user) {
      return NextResponse.redirect(
        new URL("/login?next=/settings", appUrl)
      );
    }

    // Optionally verify state user matches
    if (state) {
      try {
        const decoded = JSON.parse(Buffer.from(state, "base64url").toString("utf8"));
        if (decoded.userId && decoded.userId !== user.id) {
          console.error("OAuth state mismatch:", decoded.userId, "vs", user.id);
          return NextResponse.redirect(
            new URL("/settings?error=state_mismatch", appUrl)
          );
        }
      } catch (stateErr) {
        console.warn("Could not parse OAuth state parameter:", stateErr);
      }
    }

    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const redirectUri = `${appUrl}/api/gmail/callback`;

    if (!clientId || !clientSecret) {
      throw new Error("Missing Google OAuth credentials in environment.");
    }

    // Exchange authorization code for tokens
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    });

    const tokenData = await tokenResponse.json();

    if (!tokenResponse.ok || !tokenData.access_token) {
      console.error("Failed to exchange code for token:", tokenData);
      throw new Error(tokenData.error_description || "Failed to obtain tokens from Google.");
    }

    const { access_token, refresh_token } = tokenData;

    if (!refresh_token) {
      // If prompt=consent was used, refresh_token should always be present on first connect
      console.warn("No refresh_token returned by Google. User may have already granted access.");
    }

    // Fetch userinfo to get the connected Gmail address
    const userinfoResponse = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: { Authorization: `Bearer ${access_token}` },
    });

    const userinfo = await userinfoResponse.json();
    const gmailAddress = userinfo.email || user.email;

    if (!refresh_token) {
      // Check if we already have an active refresh token stored for this user
      const { data: existing } = await supabase
        .from("gmail_connections")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!existing) {
        return NextResponse.redirect(
          new URL("/settings?error=no_refresh_token", appUrl)
        );
      }

      // Update gmail_address and reset revoked_at
      await supabase
        .from("gmail_connections")
        .update({
          gmail_address: gmailAddress,
          revoked_at: null,
          connected_at: new Date().toISOString(),
        })
        .eq("user_id", user.id);

      return NextResponse.redirect(new URL("/settings?gmail=connected", appUrl));
    }

    // Encrypt the refresh token using AES-256-GCM
    const encrypted = encryptToken(refresh_token);

    // Upsert into gmail_connections table
    const { error: upsertError } = await supabase
      .from("gmail_connections")
      .upsert(
        {
          user_id: user.id,
          gmail_address: gmailAddress,
          refresh_token_encrypted: encrypted.ciphertext,
          iv: encrypted.iv,
          tag: encrypted.tag,
          connected_at: new Date().toISOString(),
          revoked_at: null,
        },
        { onConflict: "user_id" }
      );

    if (upsertError) {
      console.error("Database error saving Gmail connection:", upsertError);
      throw new Error(`Database error: ${upsertError.message}`);
    }

    return NextResponse.redirect(new URL("/settings?gmail=connected", appUrl));
  } catch (err: unknown) {
    console.error("Error in Gmail callback:", err);
    const msg = err instanceof Error ? err.message : "callback_failed";
    return NextResponse.redirect(
      new URL(`/settings?error=${encodeURIComponent(msg)}`, appUrl)
    );
  }
}
