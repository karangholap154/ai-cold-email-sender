import { GoogleGenAI } from "@google/genai";
import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";
import type { AnalyzeResponse } from "./types/database";

export interface GenerateEmailParams {
  jdText: string;
  skillsSummary?: string;
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
     - Include a clean sign-off like "Best," or "Best regards,".
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

export async function analyzeJdAndDraftEmail({
  jdText,
  skillsSummary = "",
}: GenerateEmailParams): Promise<AnalyzeResponse> {
  const provider = (process.env.AI_PROVIDER || "gemini").toLowerCase();

  const userPrompt = `Applicant Background & Skills Summary:
${skillsSummary ? skillsSummary.trim() : "(No specific background provided; write a sharp, capable engineering cold email highlighting relevant strengths from the JD)"}

---

Job Description:
${jdText.trim()}`;

  if (provider === "gemini") {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not configured in environment variables.");
    }

    const ai = new GoogleGenAI({ apiKey });
    const models = ["gemini-3.6-flash", "gemini-3.5-flash"];
    let lastError: unknown = null;

    for (const model of models) {
      for (let attempt = 1; attempt <= 2; attempt++) {
        try {
          const response = await ai.models.generateContent({
            model,
            contents: `${SYSTEM_PROMPT}\n\n${userPrompt}`,
            config: {
              responseMimeType: "application/json",
            },
          });

          const responseText = response.text || "";
          return parseAiJson(responseText);
        } catch (err: unknown) {
          lastError = err;
          const errMsg = err instanceof Error ? err.message : String(err);
          const isDemandError =
            errMsg.includes("503") ||
            errMsg.includes("high demand") ||
            errMsg.includes("UNAVAILABLE");

          if (isDemandError && attempt < 2) {
            // Short backoff before retrying
            await new Promise((resolve) => setTimeout(resolve, 1200));
            continue;
          }

          // If demand error continues, break to next fallback model
          if (isDemandError) {
            break;
          }

          throw err;
        }
      }
    }

    throw lastError || new Error("Failed to generate content with Gemini.");
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
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: userPrompt }],
    });

    const text = message.content
      .filter((block) => block.type === "text")
      .map((block) => (block as { type: "text"; text: string }).text)
      .join("\n");

    return parseAiJson(text);
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
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userPrompt },
      ],
    });

    const text = completion.choices[0]?.message?.content || "";
    return parseAiJson(text);
  }

  throw new Error(`Unsupported AI_PROVIDER: "${provider}". Must be "gemini", "anthropic", or "openai".`);
}

function parseAiJson(rawText: string): AnalyzeResponse {
  let cleaned = rawText.trim();
  if (cleaned.startsWith("```json")) {
    cleaned = cleaned.replace(/^```json\s*/i, "").replace(/\s*```$/, "");
  } else if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```\s*/i, "").replace(/\s*```$/, "");
  }

  try {
    const parsed = JSON.parse(cleaned);
    return {
      subject: parsed.subject || "Application for role",
      body: parsed.body || "",
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
