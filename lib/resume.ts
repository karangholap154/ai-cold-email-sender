import type { SupabaseClient } from "@supabase/supabase-js";
import type { Resume } from "@/lib/types/database";

/**
 * Resolves the active resume for a user.
 * If resumeId is specified, fetches that specific resume.
 * Otherwise, falls back to the default resume, or the most recently updated resume.
 */
export async function getActiveResume(
  supabase: SupabaseClient,
  userId: string,
  resumeId?: string | null
): Promise<Resume | null> {
  let resumeQuery = supabase
    .from("resume")
    .select("*")
    .eq("user_id", userId);

  if (resumeId) {
    resumeQuery = resumeQuery.eq("id", resumeId);
  } else {
    resumeQuery = resumeQuery
      .order("is_default", { ascending: false })
      .order("updated_at", { ascending: false });
  }

  const { data, error } = await resumeQuery.limit(1).maybeSingle();

  if (error) {
    console.warn("Could not fetch user resume from Supabase:", error.message);
    return null;
  }

  return (data as Resume) || null;
}
