import { createRequire } from "module";

const requireModule = createRequire(import.meta.url);
const disposableDomainsList: string[] = requireModule("disposable-email-domains");

// Fast O(1) lookup set initialized once in server memory
const disposableSet: Set<string> = new Set(
  disposableDomainsList.map((d) => d.toLowerCase().trim())
);

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
 * Validates whether an email is well-formed and does not originate from a disposable/temporary email provider.
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
