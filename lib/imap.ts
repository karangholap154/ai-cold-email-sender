import { ImapFlow } from "imapflow";

export interface RecipientToCheck {
  id: string; // sent_emails row id
  hrEmail: string;
  sentAt: string; // ISO string
  messageId?: string | null;
}

export interface CheckRepliesOptions {
  gmailAddress: string;
  appPassword: string;
  recipients: RecipientToCheck[];
}

export interface ReplyCheckResult {
  emailId: string;
  hrEmail: string;
  hasReply: boolean;
  repliedAt?: string;
}

/**
 * Checks IMAP (imap.gmail.com:993) for replies from specific HR recipients.
 * Privacy & Security Guarantees:
 * - Only queries: FROM <hrEmail> SINCE <sentDate>
 * - Never fetches, parses, or stores the body of any email message.
 * - Only checks existence (UID count) of matching incoming messages.
 */
export async function checkRepliesForRecipients({
  gmailAddress,
  appPassword,
  recipients,
}: CheckRepliesOptions): Promise<ReplyCheckResult[]> {
  if (!recipients || recipients.length === 0) {
    return [];
  }

  // Remove any spaces that users may copy-paste from Google's 4x4 app password display
  const cleanPassword = appPassword.replace(/\s+/g, "");

  const client = new ImapFlow({
    host: "imap.gmail.com",
    port: 993,
    secure: true,
    auth: {
      user: gmailAddress,
      pass: cleanPassword,
    },
    logger: false,
    emitLogs: false,
  });

  const results: ReplyCheckResult[] = [];

  try {
    await client.connect();
    const lock = await client.getMailboxLock("INBOX");

    try {
      for (const item of recipients) {
        try {
          const sentDate = new Date(item.sentAt);
          // 24-hour buffer prior to sent date to account for server timezone boundaries
          const sinceDate = new Date(sentDate.getTime() - 24 * 60 * 60 * 1000);

          // Targeted search: only search for messages FROM this specific HR email received SINCE sentDate
          const searchCriteria = {
            from: item.hrEmail.trim().toLowerCase(),
            since: sinceDate,
          };

          const matchedUids = await client.search(searchCriteria, { uid: true });

          if (matchedUids && matchedUids.length > 0) {
            let newestDateStr = new Date().toISOString();
            try {
              const lastUid = matchedUids[matchedUids.length - 1];
              const msg = await client.fetchOne(lastUid, { internalDate: true });
              if (msg && msg.internalDate) {
                newestDateStr = new Date(msg.internalDate).toISOString();
              }
            } catch {
              // Internal date fetch is optional; fall back to current timestamp
            }

            results.push({
              emailId: item.id,
              hrEmail: item.hrEmail,
              hasReply: true,
              repliedAt: newestDateStr,
            });
          } else {
            results.push({
              emailId: item.id,
              hrEmail: item.hrEmail,
              hasReply: false,
            });
          }
        } catch (itemErr) {
          console.error(`Error searching IMAP for ${item.hrEmail}:`, itemErr);
          results.push({
            emailId: item.id,
            hrEmail: item.hrEmail,
            hasReply: false,
          });
        }
      }
    } finally {
      lock.release();
    }

    await client.logout();
  } catch (err) {
    console.error("IMAP connection error:", err);
    throw new Error(
      err instanceof Error
        ? `Gmail IMAP sync error: ${err.message}`
        : "Failed to connect to Gmail IMAP"
    );
  }

  return results;
}
