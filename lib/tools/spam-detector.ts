/**
 * Comprehensive spam trigger dictionary categorised by outreach risk type.
 * Used for zero-AI, client-side deliverability scoring.
 */

export interface SpamCategory {
  name: string;
  description: string;
  words: string[];
  severity: "high" | "medium" | "low";
}

export const SPAM_CATEGORIES: SpamCategory[] = [
  {
    name: "Urgency & Pressure",
    description: "Creating artificial pressure triggers spam filters and annoys busy hiring managers.",
    severity: "high",
    words: [
      "urgent",
      "act now",
      "apply now",
      "don't delete",
      "do it today",
      "expire",
      "expires today",
      "immediate response",
      "limited time",
      "now or never",
      "once in a lifetime",
      "time sensitive",
      "hurry",
      "action required",
      "final notice",
    ],
  },
  {
    name: "Commercial & Sales Buzzwords",
    description: "Words that look like affiliate marketing or mass marketing pitches.",
    severity: "high",
    words: [
      "100% free",
      "free trial",
      "money back",
      "no catch",
      "no cost",
      "no fees",
      "no obligation",
      "no purchase necessary",
      "risk free",
      "save big",
      "special promotion",
      "best price",
      "click here",
      "click below",
      "guaranteed",
      "guarantee",
      "winner",
      "cash prize",
      "make money",
      "earn extra cash",
      "double your income",
      "billion",
      "millions",
    ],
  },
  {
    name: "Over-promising & Exaggeration",
    description: "Superlatives make candidate outreach sound fake and unsubstantiated.",
    severity: "medium",
    words: [
      "miracle",
      "revolutionary",
      "unbelievable",
      "fantastic",
      "groundbreaking",
      "secret trick",
      "hidden secret",
      "cure all",
      "magic",
      "rockstar developer",
      "10x engineer",
      "guru",
      "ninja",
      "genius",
      "unbeatable",
      "flawless",
    ],
  },
  {
    name: "Deceptive & Suspicious Triggers",
    description: "Language that mimics scams, phishing, or bulk scraper templates.",
    severity: "high",
    words: [
      "dear friend",
      "dear sir or madam",
      "to whom it may concern",
      "confidential",
      "not spam",
      "this isn't spam",
      "opt in",
      "unsubscribe",
      "mass email",
      "automated message",
      "billing issue",
      "account suspended",
      "verify your account",
      "security alert",
    ],
  },
  {
    name: "Vague or Desperate Language",
    description: "Phrases that weaken candidate authority or sound generic.",
    severity: "low",
    words: [
      "desperate",
      "begging",
      "any job",
      "anything available",
      "please help me",
      "humbly request",
      "kindly do the needful",
      "as per your convenience",
      "just checking in",
      "circling back to top of inbox",
    ],
  },
];

export interface SpamMatch {
  word: string;
  category: string;
  severity: "high" | "medium" | "low";
  index: number;
}

export interface DeliverabilityAnalysis {
  score: number; // 0 - 100
  rating: "Excellent" | "Good" | "Needs Attention" | "High Spam Risk";
  wordCount: number;
  readingTimeSeconds: number;
  allCapsCount: number;
  exclamationCount: number;
  spamMatches: SpamMatch[];
  suggestions: string[];
}

export function analyzeEmailDeliverability(text: string): DeliverabilityAnalysis {
  const clean = text.trim();
  if (!clean) {
    return {
      score: 100,
      rating: "Excellent",
      wordCount: 0,
      readingTimeSeconds: 0,
      allCapsCount: 0,
      exclamationCount: 0,
      spamMatches: [],
      suggestions: ["Type or paste your email body to analyze its deliverability."],
    };
  }

  const words = clean.split(/\s+/).filter(Boolean);
  const wordCount = words.length;
  // Average reading speed: 200 words per minute
  const readingTimeSeconds = Math.max(1, Math.round((wordCount / 200) * 60));

  // Count ALL-CAPS words (length >= 3, excluding acronyms like API, AWS, CSS, HTML, PDF, AI, UI, UX, SQL)
  const commonTechAcronyms = new Set(["API", "AWS", "CSS", "HTML", "PDF", "AI", "UI", "UX", "SQL", "DNS", "LLM", "GCP", "SDK"]);
  const allCapsWords = words.filter(
    (w) => w.length >= 3 && /^[A-Z0-9]+$/.test(w.replace(/[^A-Za-z0-9]/g, "")) && !commonTechAcronyms.has(w.replace(/[^A-Za-z0-9]/g, ""))
  );
  const allCapsCount = allCapsWords.length;

  // Count exclamation marks
  const exclamationCount = (clean.match(/!/g) || []).length;

  // Search for spam trigger words (case-insensitive boundary match)
  const spamMatches: SpamMatch[] = [];

  for (const cat of SPAM_CATEGORIES) {
    for (const phrase of cat.words) {
      // Word boundary regex
      const escaped = phrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const regex = new RegExp(`\\b${escaped}\\b`, "gi");
      let match;
      while ((match = regex.exec(clean)) !== null) {
        spamMatches.push({
          word: match[0],
          category: cat.name,
          severity: cat.severity,
          index: match.index,
        });
      }
    }
  }

  // Calculate score deduction:
  // Base: 100
  let score = 100;
  const suggestions: string[] = [];

  // Deduct for spam words
  for (const m of spamMatches) {
    if (m.severity === "high") score -= 12;
    else if (m.severity === "medium") score -= 6;
    else score -= 3;
  }

  // Deduct for excessive all-caps
  if (allCapsCount > 2) {
    score -= Math.min(20, allCapsCount * 4);
    suggestions.push(`Avoid excessive ALL-CAPS words (${allCapsCount} found). Spam filters treat capitalized words as shouting.`);
  }

  // Deduct for too many exclamation marks
  if (exclamationCount > 2) {
    score -= Math.min(15, (exclamationCount - 1) * 3);
    suggestions.push(`Reduce exclamation marks (${exclamationCount} found). High-converting professional cold emails rarely use more than 1.`);
  }

  // Word length check for cold job outreach
  if (wordCount < 40 && wordCount > 0) {
    score -= 5;
    suggestions.push("Your email is very short (<40 words). Ensure you briefly mention your specific fit or attach context.");
  } else if (wordCount > 250) {
    score -= 10;
    suggestions.push(`Your email is ${wordCount} words. Executive recruiters and engineering leads prefer concise letters between 90–160 words.`);
  }

  if (spamMatches.length > 0) {
    const uniqueSpamWords = Array.from(new Set(spamMatches.map((s) => `"${s.word}"`)));
    suggestions.push(`Replace high-risk trigger phrases: ${uniqueSpamWords.slice(0, 4).join(", ")}${uniqueSpamWords.length > 4 ? "..." : ""}.`);
  }

  if (suggestions.length === 0) {
    suggestions.push("Your outreach text has excellent tone and zero spam trigger patterns detected.");
  }

  score = Math.max(5, Math.min(100, score));

  let rating: DeliverabilityAnalysis["rating"] = "Excellent";
  if (score < 50) rating = "High Spam Risk";
  else if (score < 75) rating = "Needs Attention";
  else if (score < 90) rating = "Good";

  return {
    score,
    rating,
    wordCount,
    readingTimeSeconds,
    allCapsCount,
    exclamationCount,
    spamMatches,
    suggestions,
  };
}
