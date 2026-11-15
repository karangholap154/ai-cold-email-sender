export type OutreachTone = "crisp" | "technical" | "startup" | "warm";

export interface ToneOption {
  id: OutreachTone;
  label: string;
  badge: string;
  target: string;
  wordCountRange: string;
  description: string;
  instruction: string;
}

export const TONE_OPTIONS: Record<OutreachTone, ToneOption> = {
  crisp: {
    id: "crisp",
    label: "Direct & Crisp",
    badge: "Executive",
    target: "Founders & Execs",
    wordCountRange: "65–95w",
    description: "Maximum signal density, zero fluff. Reads in under 30 seconds on mobile.",
    instruction: `Tone & Style Directive:
- Target Persona: Busy Founder / C-Suite Executive / Managing Partner.
- Tone: Restrained, confident, direct, and zero fluff. Highest signal density, immediate relevance. Plain language without breathless adjectives or marketing hype.
- Length: Strictly between 65 and 95 words. Respect the recipient's busy schedule.
- Focus: Immediate connection between applicant background and the company's core mission.`,
  },
  technical: {
    id: "technical",
    label: "Deep Technical",
    badge: "Engineering",
    target: "Eng Managers & Tech Leads",
    wordCountRange: "95–130w",
    description: "Architectural rigor, tech stack alignment, and concrete engineering problem solving.",
    instruction: `Tone & Style Directive:
- Target Persona: Engineering Manager / Tech Lead / VP of Engineering.
- Tone: Rigorous, thoughtful engineer-to-engineer conversation. Demonstrates deep understanding of software craftsmanship and architecture.
- Length: Between 95 and 130 words.
- Focus: Cite 2-3 specific technical components, libraries, or architectural challenges from the JD and describe directly how the applicant's hands-on experience addresses them.`,
  },
  startup: {
    id: "startup",
    label: "Startup & Builder",
    badge: "0 → 1 Pace",
    target: "Early-stage Founders",
    wordCountRange: "75–110w",
    description: "High agency, fast shipping velocity, and excitement for building from 0 to 1.",
    instruction: `Tone & Style Directive:
- Target Persona: Early-stage Startup Founder / Lead Builder / Core Team.
- Tone: High-agency builder mindset. Emphasize speed of execution, ownership, adaptability, and excitement about building the core product.
- Length: Between 75 and 110 words.
- Focus: Scrappy, direct, and energetic without artificial hype. Conveys genuine excitement about building and shipping rapidly.`,
  },
  warm: {
    id: "warm",
    label: "Warm & Collaborative",
    badge: "People & Talent",
    target: "Recruiters & People Ops",
    wordCountRange: "85–120w",
    description: "Conversational, empathetic, and collegial while remaining thoroughly professional.",
    instruction: `Tone & Style Directive:
- Target Persona: Recruiter / Talent Acquisition Partner / Head of People.
- Tone: Warm, conversational, respectful, and collegial while remaining thoroughly professional.
- Length: Between 85 and 120 words.
- Focus: Clear alignment with qualifications, team culture, and a low-friction invitation to connect.`,
  },
};

export const TONE_LIST: ToneOption[] = [
  TONE_OPTIONS.crisp,
  TONE_OPTIONS.technical,
  TONE_OPTIONS.startup,
  TONE_OPTIONS.warm,
];

export function getTonePromptDirective(tone: OutreachTone = "crisp"): string {
  const opt = TONE_OPTIONS[tone] || TONE_OPTIONS.crisp;
  return opt.instruction;
}
