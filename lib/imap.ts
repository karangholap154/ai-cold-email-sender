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
 *
 * Performance & Privacy Guarantees:
 * - Batched single-query architecture: 1 search + 1 envelope stream instead of N sequential searches.
 * - Privacy: ONLY inspects standard RFC envelope headers (From address, Date).
 * - Never fetches, parses, reads, or stores any email body content.
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

  // Map normalized recipient email -> array of RecipientToCheck
  const recipientMap = new Map<string, RecipientToCheck[]>();
  let earliestSentTime = Infinity;

  for (const r of recipients) {
    const key = r.hrEmail.trim().toLowerCase();
    const existing = recipientMap.get(key) || [];
    existing.push(r);
    recipientMap.set(key, existing);

    const sentTime = new Date(r.sentAt).getTime();
    if (!isNaN(sentTime) && sentTime < earliestSentTime) {
      earliestSentTime = sentTime;
    }
  }

  if (earliestSentTime === Infinity) {
    earliestSentTime = Date.now() - 60 * 24 * 60 * 60 * 1000;
  }

  // 24-hour buffer prior to earliest sent date to account for server timezone boundaries
  const oldestSinceDate = new Date(earliestSentTime - 24 * 60 * 60 * 1000);

  // Map of recipientId -> { hasReply: true, repliedAt: string }
  const replyMap = new Map<string, { hasReply: boolean; repliedAt?: string }>();

  try {
    await client.connect();
    const lock = await client.getMailboxLock("INBOX");

    try {
      // Step 1: Search for all message UIDs received in INBOX since oldestSinceDate in 1 query
      const matchedUids = await client.search({ since: oldestSinceDate }, { uid: true });

      if (Array.isArray(matchedUids) && matchedUids.length > 0) {
        // Bound peak memory by slicing up to 500 latest incoming messages if inbox has high volume
        const uidsToFetch = matchedUids.length > 500 ? matchedUids.slice(-500) : matchedUids;

        // Step 2: Stream only header envelopes (From, Date) for matched UIDs in 1 network operation
        for await (const message of client.fetch(
          uidsToFetch,
          { envelope: true, internalDate: true, uid: true },
          { uid: true }
        )) {
          const fromAddresses = message.envelope?.from || [];
          const messageDate = message.internalDate
            ? new Date(message.internalDate)
            : message.envelope?.date
            ? new Date(message.envelope.date)
            : new Date();

          for (const addrObj of fromAddresses) {
            const senderEmail = (addrObj.address || "").trim().toLowerCase();
            const matchedRecipients = recipientMap.get(senderEmail);

            if (matchedRecipients) {
              for (const recipient of matchedRecipients) {
                const recipientSentTime = new Date(recipient.sentAt).getTime();
                // Check if incoming reply was received after or around the sent time (1 hour leeway)
                if (messageDate.getTime() >= recipientSentTime - 60 * 60 * 1000) {
                  const existing = replyMap.get(recipient.id);
                  const newIso = messageDate.toISOString();
                  if (
                    !existing ||
                    (existing.repliedAt && new Date(newIso) > new Date(existing.repliedAt))
                  ) {
                    replyMap.set(recipient.id, {
                      hasReply: true,
                      repliedAt: newIso,
                    });
                  }
                }
              }
            }
          }
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

  // Construct final results preserving original input order
  return recipients.map((r) => {
    const matched = replyMap.get(r.id);
    return {
      emailId: r.id,
      hrEmail: r.hrEmail,
      hasReply: Boolean(matched?.hasReply),
      repliedAt: matched?.repliedAt,
    };
  });
}
