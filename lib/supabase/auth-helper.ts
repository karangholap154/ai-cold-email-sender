import { NextResponse } from "next/server";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

export type AuthSuccessResult = {
  user: User;
  supabase: Awaited<ReturnType<typeof createClient>>;
  errorResponse: null;
};

export type AuthFailureResult = {
  user: null;
  supabase: null;
  errorResponse: NextResponse<{ error: string }>;
};

export type AuthResult = AuthSuccessResult | AuthFailureResult;

/**
 * Standardized authentication resolver for Route Handlers.
 * Returns either an authenticated User and Supabase client, or a 401 Unauthorized NextResponse.
 */
export async function getAuthUser(
  unauthorizedMessage = "Unauthorized"
): Promise<AuthResult> {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return {
      user: null,
      supabase: null,
      errorResponse: NextResponse.json(
        { error: unauthorizedMessage },
        { status: 401 }
      ),
    };
  }

  return {
    user,
    supabase,
    errorResponse: null,
  };
}
