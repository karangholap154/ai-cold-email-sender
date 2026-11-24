/**
 * Cold email subject line grader and mobile preview simulator logic.
 */

export interface SubjectLineAnalysis {
  score: number; // 0 - 100
  rating: "High Impact" | "Solid" | "Needs Polish" | "Poor";
  charCount: number;
  wordCount: number;
  casing: "Sentence case" | "lower case" | "Title Case" | "ALL CAPS" | "Mixed";
  isSpammy: boolean;
  spamTriggers: string[];
  feedback: {
    passed: boolean;
    title: string;
    description: string;
  }[];
  mobilePreview: {
    iphoneCutoff: string;
    isIphoneTruncated: boolean;
    gmailCutoff: string;
    isGmailTruncated: boolean;
  };
}

const SPAM_SUBJECT_WORDS = [
  "urgent",
  "free",
  "opportunity",
  "guarantee",
  "act now",
  "winner",
  "cash",
  "100%",
  "save",
  "deal",
  "miracle",
  "re:",
  "fwd:",
  "exclusive",
  "secret",
  "apply now",
  "help me",
  "desperate",
];

export function analyzeSubjectLine(subject: string): SubjectLineAnalysis {
  const trimmed = subject.trim();
  const charCount = trimmed.length;
  const words = trimmed.split(/\s+/).filter(Boolean);
  const wordCount = words.length;

  if (!trimmed) {
    return {
      score: 100,
      rating: "High Impact",
      charCount: 0,
      wordCount: 0,
      casing: "Sentence case",
      isSpammy: false,
      spamTriggers: [],
      feedback: [],
      mobilePreview: {
        iphoneCutoff: "",
        isIphoneTruncated: false,
        gmailCutoff: "",
        isGmailTruncated: false,
      },
    };
  }

  // Determine casing
  let casing: SubjectLineAnalysis["casing"] = "Sentence case";
  const lettersOnly = trimmed.replace(/[^a-zA-Z]/g, "");
  if (lettersOnly.length > 0 && lettersOnly === lettersOnly.toUpperCase()) {
    casing = "ALL CAPS";
  } else if (lettersOnly.length > 0 && lettersOnly === lettersOnly.toLowerCase()) {
    casing = "lower case";
  } else {
    // Check Title Case
    const isTitle = words.every((w) => {
      const cleanW = w.replace(/[^a-zA-Z]/g, "");
      if (!cleanW) return true;
      return cleanW[0] === cleanW[0].toUpperCase();
    });
    casing = isTitle ? "Title Case" : "Sentence case";
  }

  // Check spam words
  const lower = trimmed.toLowerCase();
  const foundSpam: string[] = [];
  for (const s of SPAM_SUBJECT_WORDS) {
    const regex = new RegExp(`\\b${s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i");
    if (regex.test(lower)) {
      foundSpam.push(s);
    }
  }

  // Fake Re: / Fwd: deception test
  const hasFakeReply = /^re:\s*/i.test(trimmed) || /^fwd:\s*/i.test(trimmed);

  // Scoring
  let score = 100;
  const feedback: SubjectLineAnalysis["feedback"] = [];

  // 1. Length Check (ideal: 25 - 50 characters, 3 - 7 words)
  if (charCount < 15) {
    score -= 15;
    feedback.push({
      passed: false,
      title: "Subject line is slightly too brief",
      description: `At ${charCount} characters, it might lack context for a busy hiring manager. Aim for 25–50 characters.`,
    });
  } else if (charCount > 60) {
    score -= 20;
    feedback.push({
      passed: false,
      title: "Subject line is too long for mobile screens",
      description: `At ${charCount} characters, over 65% of mobile inboxes will cut this off with '...'. Keep it under 50 characters.`,
    });
  } else {
    feedback.push({
      passed: true,
      title: "Ideal mobile length",
      description: `At ${charCount} characters (${wordCount} words), it displays completely on smartphones without truncation.`,
    });
  }

  // 2. Casing Check
  if (casing === "ALL CAPS") {
    score -= 30;
    feedback.push({
      passed: false,
      title: "ALL-CAPS detected",
      description: "Writing subject lines in ALL CAPS triggers aggressive corporate spam filters and feels aggressive.",
    });
  } else if (casing === "lower case") {
    score += 5; // lowercase tech subject lines perform noticeably better in engineering cold outreach
    feedback.push({
      passed: true,
      title: "Natural casual casing",
      description: "All-lowercase or conversational sentence-case subject lines feel like genuine personal messages rather than automated marketing blasts.",
    });
  } else {
    feedback.push({
      passed: true,
      title: "Standard readable casing",
      description: "Clean readability suitable for professional correspondence.",
    });
  }

  // 3. Spam Check
  if (hasFakeReply) {
    score -= 35;
    feedback.push({
      passed: false,
      title: "Deceptive 'Re:' prefix detected",
      description: "Using 'Re:' on a first cold email violates anti-spam guidelines (CAN-SPAM/GDPR) and destroys trust instantly.",
    });
  }

  if (foundSpam.length > 0) {
    score -= Math.min(30, foundSpam.length * 15);
    feedback.push({
      passed: false,
      title: "Spam trigger phrases found",
      description: `Contains high-risk words: ${foundSpam.map((w) => `"${w}"`).join(", ")}. Replace with neutral, specific nouns.`,
    });
  } else if (!hasFakeReply) {
    feedback.push({
      passed: true,
      title: "Zero spam trigger words",
      description: "Clean vocabulary that safely navigates past strict corporate MX filters.",
    });
  }

  // 4. Specificity & Punctuation
  const exclamationCount = (trimmed.match(/!/g) || []).length;
  if (exclamationCount > 0) {
    score -= 15;
    feedback.push({
      passed: false,
      title: "Exclamation point in subject line",
      description: "Exclamation marks in subject lines are standard markers of promotional spam. Use a period, question mark, or no terminal punctuation.",
    });
  }

  score = Math.max(10, Math.min(100, score));

  let rating: SubjectLineAnalysis["rating"] = "High Impact";
  if (score < 50) rating = "Poor";
  else if (score < 70) rating = "Needs Polish";
  else if (score < 85) rating = "Solid";

  // Mobile cut-offs
  // iPhone Mail app cuts off around ~38-42 chars depending on sender name
  const IPHONE_LIMIT = 38;
  const GMAIL_LIMIT = 54;

  const isIphoneTruncated = trimmed.length > IPHONE_LIMIT;
  const iphoneCutoff = isIphoneTruncated
    ? trimmed.slice(0, IPHONE_LIMIT).trim() + "..."
    : trimmed;

  const isGmailTruncated = trimmed.length > GMAIL_LIMIT;
  const gmailCutoff = isGmailTruncated
    ? trimmed.slice(0, GMAIL_LIMIT).trim() + "..."
    : trimmed;

  return {
    score,
    rating,
    charCount,
    wordCount,
    casing,
    isSpammy: foundSpam.length > 0 || hasFakeReply,
    spamTriggers: foundSpam,
    feedback,
    mobilePreview: {
      iphoneCutoff,
      isIphoneTruncated,
      gmailCutoff,
      isGmailTruncated,
    },
  };
}
