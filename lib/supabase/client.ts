import { createBrowserClient } from "@supabase/ssr";

function getProjectRef(): string | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url) return null;
  try {
    return new URL(url).hostname.split(".")[0] || null;
  } catch {
    return null;
  }
}

export function createClient() {
  const supabaseUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/supabase`
      : (process.env.NEXT_PUBLIC_SUPABASE_URL || "");

  const projectRef = getProjectRef();

  return createBrowserClient(
    supabaseUrl,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookieOptions: projectRef ? { name: `sb-${projectRef}-auth-token` } : undefined,
    }
  );
}

export const supabase = createClient();
