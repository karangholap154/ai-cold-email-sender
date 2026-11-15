import type { SentEmail } from "@/lib/types/database";

/**
 * Escapes a single field according to RFC 4180 rules:
 * - Wrap with double quotes if field contains commas, double quotes, or newlines.
 * - Double quotes inside values are escaped by doubling them ("").
 */
export function escapeCsvField(val: unknown): string {
  if (val === null || val === undefined) {
    return '""';
  }
  const str = String(val);
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return `"${str}"`;
}

/**
 * Converts a list of sent emails into RFC 4180 compliant CSV format.
 */
export function formatOutreachAsCsv(emails: SentEmail[]): string {
  const headers = [
    "Company Name",
    "Role Title",
    "Recipient Email",
    "Email Type",
    "Subject",
    "Status",
    "Sent Date (UTC)",
    "Responded",
    "Response Date (UTC)",
    "Word Count",
  ];

  const rows = emails.map((email) => {
    const wordCount = email.final_body
      ? email.final_body.trim().split(/\s+/).filter(Boolean).length
      : 0;

    return [
      escapeCsvField(email.company_name || "Unknown Company"),
      escapeCsvField(email.role_title || "Not specified"),
      escapeCsvField(email.hr_email),
      escapeCsvField(email.email_type === "followup" ? "Follow-up" : "Initial"),
      escapeCsvField(email.final_subject),
      escapeCsvField(email.status === "sent" ? "Delivered" : "Failed"),
      escapeCsvField(email.created_at),
      escapeCsvField(email.is_responded ? "Yes" : "No"),
      escapeCsvField(email.responded_at || ""),
      escapeCsvField(wordCount),
    ].join(",");
  });

  return [headers.map((h) => `"${h}"`).join(","), ...rows].join("\r\n");
}

/**
 * Triggers a browser download of the given CSV content.
 */
export function downloadCsv(filename: string, csvContent: string): void {
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
