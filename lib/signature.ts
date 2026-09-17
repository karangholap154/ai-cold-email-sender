export interface SignatureData {
  full_name?: string | null;
  sign_off?: string | null;
  portfolio_url?: string | null;
  github_url?: string | null;
  linkedin_url?: string | null;
  phone?: string | null;
  custom_signature?: string | null;
  layout?: "stack" | "inline" | "compact";
}

/**
 * Generates a formatted signature string according to a layout preset:
 * - 'stack': Line-by-line (each link on its own line, no broken wrapping)
 * - 'inline': Full URLs separated on a single line
 * - 'compact': Clean domain handles (no https://) separated by bullet points
 */
export function generateFormattedSignature(
  sig: SignatureData,
  layout: "stack" | "inline" | "compact" = "stack"
): string {
  const parts: string[] = [];
  const signOff = sig.sign_off?.trim() || "Best regards,";
  parts.push(signOff);

  if (sig.full_name?.trim()) {
    parts.push(sig.full_name.trim());
  }

  const items: string[] = [];

  if (layout === "stack") {
    if (sig.portfolio_url?.trim()) items.push(`Portfolio: ${sig.portfolio_url.trim()}`);
    if (sig.github_url?.trim()) items.push(`GitHub: ${sig.github_url.trim()}`);
    if (sig.linkedin_url?.trim()) items.push(`LinkedIn: ${sig.linkedin_url.trim()}`);
    if (sig.phone?.trim()) items.push(`Tel: ${sig.phone.trim()}`);

    if (items.length > 0) {
      return `${parts.join("\n")}\n\n${items.join("\n")}`;
    }
  } else if (layout === "compact") {
    const cleanUrl = (url: string) => url.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "");
    if (sig.portfolio_url?.trim()) items.push(cleanUrl(sig.portfolio_url.trim()));
    if (sig.github_url?.trim()) items.push(cleanUrl(sig.github_url.trim()));
    if (sig.linkedin_url?.trim()) items.push(cleanUrl(sig.linkedin_url.trim()));
    if (sig.phone?.trim()) items.push(sig.phone.trim());

    if (items.length > 0) {
      return `${parts.join("\n")}\n${items.join(" • ")}`;
    }
  } else {
    // inline
    if (sig.portfolio_url?.trim()) items.push(sig.portfolio_url.trim());
    if (sig.github_url?.trim()) items.push(sig.github_url.trim());
    if (sig.linkedin_url?.trim()) items.push(sig.linkedin_url.trim());
    if (sig.phone?.trim()) items.push(`Tel: ${sig.phone.trim()}`);

    if (items.length > 0) {
      return `${parts.join("\n")}\n${items.join(" | ")}`;
    }
  }

  // If only sign_off is present and nothing else, return empty
  if (parts.length === 1 && !sig.full_name?.trim() && items.length === 0) {
    return "";
  }

  return parts.join("\n");
}

/**
 * Returns either the explicitly saved custom_signature or the generated signature.
 */
export function formatSenderSignature(sig?: SignatureData | null): string {
  if (!sig) return "";

  // If a raw custom signature block is provided, respect it directly
  if (sig.custom_signature && sig.custom_signature.trim()) {
    return sig.custom_signature.trim();
  }

  return generateFormattedSignature(sig, sig.layout || "stack");
}
