import { createRequire } from "module";
import dns from "node:dns/promises";

const requireModule = createRequire(import.meta.url);
const disposableDomainsList: string[] = requireModule("disposable-email-domains");

// Fast O(1) lookup set initialized once in server memory (120,000+ domains)
const disposableSet: Set<string> = new Set(
  disposableDomainsList.map((d) => d.toLowerCase().trim())
);

// High-frequency temporary domains recently spun up by temp-mail clusters
const RECENT_DISPOSABLE_DOMAINS = [
  "hudzer.com",
  "aminavin.com",
  "bitproy.com",
  "caps7.com",
  "cwsgear.com",
  "deertees.com",
  "flakeian.com",
  "meshelp.com",
  "sssonar.com",
  "sweepser.com",
  "xiunt.com",
  "maxxspace.com",
  "inboxbear.com",
  "tmpbox.net",
  "mohmal.im",
  "mohmal.in",
];

for (const d of RECENT_DISPOSABLE_DOMAINS) {
  disposableSet.add(d.toLowerCase());
}

// Known disposable mail server clusters (MX host substrings)
const KNOWN_DISPOSABLE_MX_CLUSTERS = [
  "mail.tm",
  "mail.gw",
  "temp-mail",
  "inboxes.com",
  "mailpoof.com",
  "guerrillamail",
  "sharklasers",
  "yopmail",
  "trashmail",
  "dispostable",
  "dropmail",
  "10minutemail",
  "burnermail",
  "generator.email",
  "inboxkitten",
  "crazymailing",
  "throwaway",
  "fakeinbox",
  "mytemp.email",
  "mohmal",
  "nada.ltd",
  "mailcatch",
  "tempinbox",
  "emailondeck",
];

// IP addresses belonging to temp-mail infrastructure clusters (e.g. temp-mail.org mail servers)
const KNOWN_DISPOSABLE_MAIL_IPS = new Set([
  "134.199.179.131", // temp-mail.org cluster hosting hudzer.com, aminavin.com, etc.
]);

// High-confidence keywords found in disposable email services that frequently spin up dynamic domains
const DISPOSABLE_KEYWORDS = [
  "tempmail",
  "disposable",
  "10minutemail",
  "guerrillamail",
  "mailinator",
  "sharklasers",
  "yopmail",
  "trashmail",
  "dispostable",
  "getairmail",
  "mohmal",
  "inboxkitten",
  "throwaway",
  "mytempemail",
  "burnermail",
];

const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

export interface EmailValidationResult {
  isValid: boolean;
  error?: string;
}

/**
 * Fast synchronous format and blocklist validation
 */
export function validateEmailAddress(email: string): EmailValidationResult {
  const trimmed = email.trim().toLowerCase();

  if (!trimmed) {
    return { isValid: false, error: "Email address is required." };
  }

  if (!EMAIL_REGEX.test(trimmed)) {
    return { isValid: false, error: "Please enter a valid email address." };
  }

  const parts = trimmed.split("@");
  if (parts.length !== 2) {
    return { isValid: false, error: "Invalid email format." };
  }

  const domain = parts[1];

  // 1. Exact match check against comprehensive 120,000+ disposable domain database
  if (disposableSet.has(domain)) {
    return {
      isValid: false,
      error: "Temporary and disposable email addresses are not permitted. Please use your permanent email.",
    };
  }

  // 2. Subdomain check (e.g. random.mailinator.com -> mailinator.com)
  const segments = domain.split(".");
  if (segments.length > 2) {
    const rootDomain = segments.slice(-2).join(".");
    if (disposableSet.has(rootDomain)) {
      return {
        isValid: false,
        error: "Temporary and disposable email addresses are not permitted. Please use your permanent email.",
      };
    }
  }

  // 3. Heuristic keyword check on domain name
  for (const keyword of DISPOSABLE_KEYWORDS) {
    if (domain.includes(keyword)) {
      return {
        isValid: false,
        error: "Temporary and disposable email addresses are not permitted. Please use your permanent email.",
      };
    }
  }

  return { isValid: true };
}

/**
 * Deep asynchronous DNS MX Record verification
 * Verifies that the domain can legitimately receive mail and doesn't route to disposable mail clusters
 */
export async function validateEmailWithDns(email: string): Promise<EmailValidationResult> {
  // Step 1: Fast in-memory & syntax checks
  const initialCheck = validateEmailAddress(email);
  if (!initialCheck.isValid) {
    return initialCheck;
  }

  const domain = email.trim().toLowerCase().split("@")[1];

  try {
    // Step 2: Query DNS MX records with a 2500ms safety timeout
    const mxRecordsPromise = dns.resolveMx(domain);
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("DNS_TIMEOUT")), 2500)
    );

    const mxRecords = await Promise.race([mxRecordsPromise, timeoutPromise]);

    if (!mxRecords || mxRecords.length === 0) {
      return {
        isValid: false,
        error: "This email domain does not have active mail servers to receive emails.",
      };
    }

    // Step 3: Inspect each MX exchange record
    for (const record of mxRecords) {
      const exchange = (record.exchange || "").toLowerCase().trim();

      // Check for Null MX record (RFC 7505 - domain explicitly announces it does not accept email)
      if (!exchange || exchange === ".") {
        return {
          isValid: false,
          error: "This email domain does not accept incoming emails.",
        };
      }

      // Check if the MX host belongs to a known disposable email server cluster
      for (const cluster of KNOWN_DISPOSABLE_MX_CLUSTERS) {
        if (exchange.includes(cluster)) {
          return {
            isValid: false,
            error: "Temporary and disposable email addresses are not permitted. Please use your personal or work email.",
          };
        }
      }

      // Check if MX server resolves to known disposable mail server IPs
      try {
        const lookup = await dns.lookup(exchange);
        if (lookup && KNOWN_DISPOSABLE_MAIL_IPS.has(lookup.address)) {
          return {
            isValid: false,
            error: "Temporary and disposable email addresses are not permitted. Please use your personal or work email.",
          };
        }
      } catch {
        // Continue if single lookup fails
      }
    }

    // Step 4: Check for bogus dummy SPF records commonly set by disposable services (e.g. ip4:1.1.1.1)
    try {
      const txtRecords = await dns.resolveTxt(domain);
      const allTxt = txtRecords.flat().join(" ");
      if (allTxt.includes("ip4:1.1.1.1")) {
        return {
          isValid: false,
          error: "Temporary and disposable email addresses are not permitted. Please use your personal or work email.",
        };
      }
    } catch {
      // SPF TXT record missing is normal for some domains
    }

    return { isValid: true };
  } catch (err: unknown) {
    const error = err as { code?: string; message?: string };

    // If the domain truly doesn't exist in DNS, reject it
    if (error.code === "ENOTFOUND" || error.code === "ENODATA") {
      return {
        isValid: false,
        error: "The domain for this email address does not exist or cannot receive mail.",
      };
    }

    // If timeout or network resolution glitch, fail open so legitimate users aren't locked out
    return { isValid: true };
  }
}
