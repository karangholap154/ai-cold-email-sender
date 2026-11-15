/**
 * Returns a human-friendly relative label (e.g. "Today", "1 day ago", "5 days ago")
 */
export function formatRelativeDays(dateString: string, now: number = Date.now()): string {
  const diffMs = now - new Date(dateString).getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays <= 0) return "Today";
  if (diffDays === 1) return "1 day ago";
  return `${diffDays} days ago`;
}

/**
 * Formats an ISO date string into an editorial short date (e.g. "Nov 15, 2026")
 */
export function formatShortDate(
  dateString?: string | null,
  fallback = "Recently"
): string {
  if (!dateString) return fallback;
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return fallback;
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return fallback;
  }
}

/**
 * Formats an ISO date string into date + time (e.g. "Nov 15, 2026, 08:12 PM")
 */
export function formatDateTime(
  dateString?: string | null,
  fallback = "Recently"
): string {
  if (!dateString) return fallback;
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return fallback;
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return fallback;
  }
}
