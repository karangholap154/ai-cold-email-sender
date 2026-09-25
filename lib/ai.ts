import { GoogleGenAI } from "@google/genai";
import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";
import type { AnalyzeResponse } from "./types/database";

export interface GenerateEmailParams {
  jdText: string;
  skillsSummary?: string;
  senderSignature?: string;
}

export interface GenerateFollowUpParams {
  companyName?: string;
  roleTitle?: string;
  originalSubject: string;
  originalBody?: string;
  originalSentDate?: string;
  skillsSummary?: string;
  senderSignature?: string;
}

const SYSTEM_PROMPT = `You are an expert career correspondence writer specializing in high-response, authentic cold outreach. Your task is to analyze a job description (JD) and the applicant's background/skills summary, and:

1. Extract key details about the role:
   - companyName: Company name if identifiable or mentioned (null if unknown)
   - roleTitle: Job title/role (e.g., "Senior Frontend Engineer")
   - skills: 2 to 4 key required technical or domain skills highlighted in the JD
   - seniority: Seniority level (e.g., "Senior", "Mid", "Lead", "Staff", "Junior", or "Not specified")

2. Write a cold, polite, genuine, and concise email directly to the recruiter or hiring team:
   - Greeting: Always start with a natural, polite greeting on the very first line: "Hi [Company Name] Hiring Team," or "Hi [Company Name] Team," (or "Hi there," if company is unknown), followed by a blank line.
   - Tone: Polite, direct, and genuine. Sounds like a thoughtful, competent professional writing a personal note—never like a sales template, AI generated hype, or generic filler.
   - Length: Between 80 and 130 words. Respect the recipient's time.
   - Content:
     - Start right away with an authentic connection between the company/role and your engineering focus.
     - Reference 2-3 specific technical skills or problem areas from the JD that match your experience.
     - Note that your resume is attached for their convenience.
     - End with a low-pressure, polite call to action (e.g., "I've attached my resume. Happy to share relevant work or chat briefly if this looks like a fit.").
     - Sign-off: Do NOT append a signature or personal sign-off block at the end (do NOT write "Best regards", names, or links). End the body text immediately after the call to action. The applicant's official signature is attached automatically.
   - Prohibited clichés: Do NOT use "I am writing to express my interest...", "I hope this email finds you well", "I was thrilled to see...", "I believe I am the perfect candidate", or inflated flattery.

You must respond ONLY with valid JSON in this exact structure:
{
  "companyName": string | null,
  "roleTitle": string | null,
  "skills": string[],
  "seniority": string,
  "subject": string,
  "body": string
}`;

const FOLLOWUP_SYSTEM_PROMPT = `You are an expert career correspondence writer specializing in high-response, respectful follow-up outreach for job applications.

Your task is to write a polite, concise, and high-signal follow-up email to the recruiter or hiring team regarding a previously sent application.

Key Rules:
1. Tone: Polite, confident, brief, and respectful of the recruiter's schedule. Never sound passive-aggressive, needy, or entitled.
2. Length: Strictly between 50 and 85 words. A follow-up must be readable in 20 seconds.
3. Content:
   - Greeting: "Hi [Company Name] Hiring Team," or "Hi [Company Name] Team," (or "Hi there," if company unknown), followed by a blank line.
   - Opening: Mention that you reached out previously regarding the [roleTitle] position (referencing the previous note/date naturally).
   - Core Value: Reiterate genuine interest with 1 concise, specific sentence about how your background directly addresses a core challenge or strength needed for the role.
   - Attachment: Note that your resume remains attached for their convenience.
   - Low-friction Call to Action: e.g., "Happy to share relevant project links or chat briefly if this aligns with your team's needs."
   - Closing: Do NOT append a signature or personal sign-off block at the end (do NOT write "Best regards", names, or links). End the email text immediately after the call to action. The applicant's official signature is attached automatically.
4. Subject line: Always provide a clear, recognized subject line like "Re: [Original Subject]" or "Following up: [Role Title] at [Company Name]".
5. Prohibited clichés: Do NOT use "Just following up", "Just checking in", "Per my previous email", "I know you're busy", "Did you get a chance to see my last email?", or guilt-tripping language. Keep it strictly value-focused and professional.

You must respond ONLY with valid JSON in this exact structure:
{
  "subject": string,
  "body": string,
  "companyName": string | null,
  "roleTitle": string | null
}`;

/**
 * Groq LLM caller using ultra-fast LPU inference (100% free tier).
 */
async function callGroqJson(systemPrompt: string, userPrompt: string): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error("GROQ_API_KEY is not configured in environment variables.");
  }

  const groq = new OpenAI({
    apiKey,
    baseURL: "https://api.groq.com/openai/v1",
  });

  const candidateModels = [
    process.env.GROQ_MODEL,
    "openai/gpt-oss-120b",
    "openai/gpt-oss-20b",
    "qwen/qwen3.8-27b",
    "llama-3.3-70b-versatile",
  ].filter(Boolean) as string[];

  let lastError: unknown = null;
  for (const model of candidateModels) {
    try {
      const completion = await groq.chat.completions.create({
        model,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.7,
      });

      const content = completion.choices[0]?.message?.content;
      if (content) {
        return content;
      }
    } catch (err: unknown) {
      lastError = err;
      console.warn(`Groq model ${model} failed, trying next candidate:`, err instanceof Error ? err.message : err);
    }
  }

  throw lastError || new Error("Failed to generate content with Groq.");
}

/**
 * Google Gemini caller with automatic model fallback and retry logic.
 */
async function callGeminiJson(systemPrompt: string, userPrompt: string): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured in environment variables.");
  }

  const ai = new GoogleGenAI({ apiKey });
  const models = [
    "gemini-flash-lite-latest",
    "gemini-3.5-flash-lite",
    "gemini-3.8-flash",
    "gemini-3.7-flash",
    "gemini-flash-latest",
  ];
  let lastError: unknown = null;

  for (const model of models) {
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents: `${systemPrompt}\n\n${userPrompt}`,
          config: {
            responseMimeType: "application/json",
          },
        });

        return response.text || "";
      } catch (err: unknown) {
        lastError = err;
        const errMsg = err instanceof Error ? err.message : String(err);
        const isRetryable =
          errMsg.includes("503") ||
          errMsg.includes("500") ||
          errMsg.includes("429") ||
          errMsg.includes("high demand") ||
          errMsg.includes("UNAVAILABLE") ||
          errMsg.includes("RESOURCE_EXHAUSTED");

        if (isRetryable && attempt < 2) {
          await new Promise((resolve) => setTimeout(resolve, 1500 * attempt));
          continue;
        }

        if (isRetryable || errMsg.includes("404") || errMsg.includes("NOT_FOUND")) {
          // Move to next model in the fallback array
          break;
        }

        throw err;
      }
    }
  }

  throw lastError || new Error("Failed to generate content with Gemini.");
}

/**
 * Universal JSON LLM caller supporting Groq (primary), Gemini (fallback), Anthropic, and OpenAI.
 */
async function callAiJson(systemPrompt: string, userPrompt: string): Promise<string> {
  const provider = (process.env.AI_PROVIDER || "groq").toLowerCase();

  // Primary: Groq with automatic Gemini fallback
  if (provider === "groq") {
    try {
      if (!process.env.GROQ_API_KEY) {
        console.warn("GROQ_API_KEY is missing. Falling back to Gemini...");
        return await callGeminiJson(systemPrompt, userPrompt);
      }
      return await callGroqJson(systemPrompt, userPrompt);
    } catch (groqErr) {
      console.warn("Groq encountered an error. Seamlessly falling back to Gemini:", groqErr);
      if (process.env.GEMINI_API_KEY) {
        return await callGeminiJson(systemPrompt, userPrompt);
      }
      throw groqErr;
    }
  }

  // Gemini primary (with Groq fallback if configured)
  if (provider === "gemini") {
    try {
      return await callGeminiJson(systemPrompt, userPrompt);
    } catch (geminiErr) {
      if (process.env.GROQ_API_KEY) {
        console.warn("Gemini overloaded. Seamlessly falling back to Groq:", geminiErr);
        return await callGroqJson(systemPrompt, userPrompt);
      }
      throw geminiErr;
    }
  }

  if (provider === "anthropic") {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error("ANTHROPIC_API_KEY is not configured in environment variables.");
    }

    const anthropic = new Anthropic({ apiKey });
    const message = await anthropic.messages.create({
      model: "claude-3-5-haiku-latest",
      max_tokens: 1024,
      system: systemPrompt,
      messages: [{ role: "user", content: userPrompt }],
    });

    return message.content
      .filter((block) => block.type === "text")
      .map((block) => (block as { type: "text"; text: string }).text)
      .join("\n");
  }

  if (provider === "openai") {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error("OPENAI_API_KEY is not configured in environment variables.");
    }

    const openai = new OpenAI({ apiKey });
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    });

    return completion.choices[0]?.message?.content || "";
  }

  throw new Error(`Unsupported AI_PROVIDER: "${provider}". Must be "groq", "gemini", "anthropic", or "openai".`);
}

export async function analyzeJdAndDraftEmail({
  jdText,
  skillsSummary = "",
  senderSignature = "",
}: GenerateEmailParams): Promise<AnalyzeResponse> {
  // Truncate excessively long JD text to ~3500 chars to avoid burning tokens on repetitive legal/benefit boilerplate
  const trimmedJd =
    jdText.length > 3500
      ? `${jdText.slice(0, 3500)}\n\n[...Job description truncated for length...]`
      : jdText;

  const userPrompt = `Applicant Background & Skills Summary:
${skillsSummary ? skillsSummary.trim() : "(No specific background provided; write a sharp, capable engineering cold email highlighting relevant strengths from the JD)"}

${senderSignature ? `Applicant Signature Block (attach this exact block at the bottom of the email):\n${senderSignature.trim()}\n` : ""}
---

Job Description:
${trimmedJd.trim()}`;

  const responseText = await callAiJson(SYSTEM_PROMPT, userPrompt);
  return parseAiJson(responseText, senderSignature);
}

export async function generateFollowUpEmail({
  companyName,
  roleTitle,
  originalSubject,
  originalBody,
  originalSentDate,
  skillsSummary = "",
  senderSignature = "",
}: GenerateFollowUpParams): Promise<AnalyzeResponse> {
  const cleanSubject = originalSubject.startsWith("Re:") || originalSubject.startsWith("re:")
    ? originalSubject
    : `Re: ${originalSubject}`;

  const userPrompt = `Context of Previous Outreach:
- Target Company: ${companyName || "Unknown / Not specified"}
- Target Role: ${roleTitle || "Not specified"}
- Original Subject Line: ${originalSubject}
- Original Outreach Date: ${originalSentDate || "A few days ago"}
${originalBody ? `- Original Email Sent:\n"${originalBody.slice(0, 500)}..."\n` : ""}

Applicant Background & Skills Summary:
${skillsSummary ? skillsSummary.trim() : "(No specific background provided; emphasize genuine interest and capability for the role)"}

${senderSignature ? `Applicant Signature Block (attach this exact block at the bottom of the email):\n${senderSignature.trim()}\n` : ""}`;

  const responseText = await callAiJson(FOLLOWUP_SYSTEM_PROMPT, userPrompt);
  const parsed = parseAiJson(responseText, senderSignature);

  return {
    ...parsed,
    subject: parsed.subject && parsed.subject.length > 5 ? parsed.subject : cleanSubject,
    companyName: companyName || parsed.companyName,
    roleTitle: roleTitle || parsed.roleTitle,
    isFollowUp: true,
  };
}

function applySignature(body: string, signature?: string): string {
  if (!signature || !signature.trim()) {
    const hasSignoff = /(?:Best regards|Warm regards|Kind regards|With appreciation|Best|Sincerely|Cheers|Thanks|Thank you|Regards),?\s*(?:\n+[^\n]+){0,2}\s*$/i.test(body);
    if (!hasSignoff) {
      return `${body.trim()}\n\nBest regards,`;
    }
    return body.trim();
  }

  const cleanSig = signature.trim();

  // If the body already ends with the exact full signature block, keep it as is
  if (body.endsWith(cleanSig)) {
    return body;
  }

  // Robustly strip any trailing sign-off the AI model might have generated at the end
  // Matches e.g. "Best regards,\nKaran Gholap", "Best regards,\n[Your Name]", "Sincerely,", "Cheers,\nKaran", etc.
  const trailingSignoffRegex = /(?:\n\s*)*(?:Best regards|Warm regards|Kind regards|With appreciation|Best|Sincerely|Cheers|Thanks|Thank you|Regards),?\s*(?:\n+[^\n]+){0,2}\s*$/i;
  const cleanedBody = body.replace(trailingSignoffRegex, "").trim();

  return `${cleanedBody}\n\n${cleanSig}`;
}

function parseAiJson(rawText: string, senderSignature?: string): AnalyzeResponse {
  let cleaned = rawText.trim();
  if (cleaned.startsWith("```json")) {
    cleaned = cleaned.replace(/^```json\s*/i, "").replace(/\s*```$/, "");
  } else if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```\s*/i, "").replace(/\s*```$/, "");
  }

  try {
    const parsed = JSON.parse(cleaned);
    const rawBody = parsed.body || "";
    return {
      subject: parsed.subject || "Application for role",
      body: applySignature(rawBody, senderSignature),
      companyName: parsed.companyName || undefined,
      roleTitle: parsed.roleTitle || undefined,
      skills: Array.isArray(parsed.skills) ? parsed.skills : [],
      seniority: parsed.seniority || undefined,
    };
  } catch (err) {
    console.error("Failed to parse AI JSON response:", rawText, err);
    throw new Error("AI returned an invalid response format. Please try again.");
  }
}
