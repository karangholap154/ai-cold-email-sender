"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Mail,
  FileText,
  ShieldCheck,
  Zap,
  Building2,
  Briefcase,
  AlertTriangle,
  Send,
  Lock,
  ChevronDown,
} from "lucide-react";

export default function LandingPage() {
  const [activeTab, setActiveTab] = useState<"preview" | "raw">("preview");
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const toggleFaq = (idx: number) => {
    setOpenFaq(openFaq === idx ? null : idx);
  };

  const faqs = [
    {
      q: "Does this application read or access my private Gmail inbox?",
      a: "Never. We request Google's narrowest possible sending permission (gmail.send) strictly to dispatch outgoing letters you have manually reviewed and approved. We do not read your inbox, access your contacts, or inspect your incoming mail.",
    },
    {
      q: "Can I inspect and edit every email before it is sent?",
      a: "Yes, absolutely. We designed Cold Email specifically as a deliberate correspondence tool, not an automated spam blaster. Every drafted letter is presented in an editable letter frame where you can adjust every single word, regenerate alternatives, or cancel before anything leaves your account.",
    },
    {
      q: "How does the resume attachment work?",
      a: "Upload your resume PDF once in your Settings. When drafting, our AI extracts the key requirements from the job posting and highlights genuine parallels from your background. When you click send, your PDF is automatically attached to the outgoing MIME email.",
    },
    {
      q: "What prevents me from emailing the same recruiter twice?",
      a: "The tool includes built-in duplicate contact detection. When you enter an HR email address you have previously reached out to, an inline warning immediately appears on the review screen to prevent embarrassing double-outreach.",
    },
    {
      q: "Why is sending from my personal Gmail better than an email automation tool?",
      a: "Cold recruitment outreach sent through automated third-party SMTP servers often gets relegated to Spam or Promotions. Sending directly from your authentic Gmail account preserves your sender reputation, passes SPF/DKIM verification, and arrives where hiring managers actually read it: in the primary inbox.",
    },
  ];

  return (
    <main className="flex flex-1 flex-col bg-paper text-ink selection:bg-[#E4DFD3]">
      {/* 1. HERO SECTION */}
      <section className="relative border-b border-hairline px-4 pt-12 pb-16 sm:px-6 sm:pt-20 sm:pb-24 md:pt-24 md:pb-28">
        <div className="mx-auto max-w-4xl">
          {/* Eyebrow badge */}
          <div className="inline-flex items-center gap-2 rounded-sm border border-hairline bg-[#EDEAE2] px-3 py-1 text-[10px] sm:text-[11px] font-medium tracking-wide uppercase text-muted-ink">
            <span className="h-1.5 w-1.5 rounded-full bg-seal shrink-0"></span>
            <span>Executive correspondence tool for candidates</span>
          </div>

          {/* Main Title */}
          <h1 className="font-heading mt-5 sm:mt-6 text-3xl sm:text-4xl md:text-5xl lg:text-6xl text-ink tracking-tight leading-[1.12]">
            Cold outreach that reads like you took the time.
          </h1>

          {/* Subheading */}
          <p className="mt-4 sm:mt-6 max-w-2xl text-sm sm:text-base md:text-lg text-muted-ink leading-relaxed">
            Paste any job description and the hiring manager’s email. We extract the core requirements, highlight genuine parallels with your background, and draft a high-signal letter—dispatched directly from your personal Gmail with your resume attached.
          </p>

          {/* Primary Action Group */}
          <div className="mt-7 sm:mt-8 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
            <Link
              href="/draft"
              className="inline-flex items-center justify-center gap-2 rounded-sm bg-seal px-6 py-3 text-xs sm:text-sm font-medium text-paper hover:bg-seal/90 shadow-xs transition-all min-h-[42px]"
            >
              <span>Start drafting letters</span>
              <ArrowRight className="h-4 w-4" />
            </Link>

            <Link
              href="/signup"
              className="inline-flex items-center justify-center gap-2 rounded-sm border border-hairline bg-paper px-6 py-3 text-xs sm:text-sm font-medium text-ink hover:bg-[#EDEAE2] transition-colors min-h-[42px]"
            >
              <span>Create free account</span>
            </Link>
          </div>

          {/* Value Proof Badges */}
          <div className="mt-8 sm:mt-10 flex flex-col sm:flex-row flex-wrap items-start sm:items-center gap-y-2.5 gap-x-6 md:gap-x-8 text-xs text-muted-ink border-t border-hairline pt-5 sm:pt-6">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-3.5 w-3.5 text-confirmed shrink-0" />
              <span>Direct Google OAuth sending</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-3.5 w-3.5 text-confirmed shrink-0" />
              <span>Automated PDF resume attachment</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-3.5 w-3.5 text-confirmed shrink-0" />
              <span>Duplicate outreach detection</span>
            </div>
          </div>
        </div>
      </section>

      {/* 2. THE SIGNATURE EXPERIENCE: INTERACTIVE CORRESPONDENCE SHOWCASE */}
      <section className="border-b border-hairline bg-[#FAF9F5] px-4 py-12 sm:px-6 sm:py-20 md:py-24">
        <div className="mx-auto max-w-4xl">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6 sm:mb-8">
            <div>
              <span className="text-[10px] sm:text-[11px] font-medium uppercase tracking-wider text-muted-ink">
                Human-in-the-loop workflow
              </span>
              <h2 className="font-heading text-xl sm:text-2xl md:text-3xl text-ink mt-1">
                The Letter Frame
              </h2>
              <p className="mt-1 text-xs sm:text-sm text-muted-ink max-w-xl">
                Designed to slow you down at the single moment that matters: before sending. Verify extracted entities, hone the phrasing, and ensure complete confidence.
              </p>
            </div>

            {/* Toggle tabs */}
            <div className="flex items-center rounded-sm border border-hairline bg-paper p-1 text-xs shrink-0 self-start sm:self-auto">
              <button
                type="button"
                onClick={() => setActiveTab("preview")}
                className={`px-3 py-1.5 rounded-xs transition-colors cursor-pointer ${
                  activeTab === "preview"
                    ? "bg-ink text-paper font-medium"
                    : "text-muted-ink hover:text-ink"
                }`}
              >
                Tailored Letter
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("raw")}
                className={`px-3 py-1.5 rounded-xs transition-colors cursor-pointer ${
                  activeTab === "raw"
                    ? "bg-ink text-paper font-medium"
                    : "text-muted-ink hover:text-ink"
                }`}
              >
                Raw Job Posting
              </button>
            </div>
          </div>

          {activeTab === "preview" ? (
            <div className="space-y-4">
              {/* Confirmation Strip */}
              <div className="border border-hairline bg-paper p-3.5 sm:p-4 rounded-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div className="flex flex-wrap items-center gap-3 sm:gap-4">
                    <div className="flex items-center gap-1.5 text-ink">
                      <Building2 className="h-3.5 w-3.5 text-muted-ink shrink-0" />
                      <span className="text-muted-ink">Target:</span>
                      <span className="font-medium text-ink">Linear</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-ink">
                      <Briefcase className="h-3.5 w-3.5 text-muted-ink shrink-0" />
                      <span className="text-muted-ink">Role:</span>
                      <span className="font-medium text-ink">Staff Frontend Engineer</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5 pt-1 sm:pt-0">
                    <span className="rounded-sm border border-hairline bg-[#EDEAE2] px-2 py-0.5 text-[10px] sm:text-[11px] text-muted-ink">
                      Design Systems
                    </span>
                    <span className="rounded-sm border border-hairline bg-[#EDEAE2] px-2 py-0.5 text-[10px] sm:text-[11px] text-muted-ink">
                      Next.js & WebGL
                    </span>
                    <span className="rounded-sm border border-hairline bg-[#EDEAE2] px-2 py-0.5 text-[10px] sm:text-[11px] text-muted-ink">
                      Performance
                    </span>
                  </div>
                </div>
              </div>

              {/* Physical Letter Frame Mockup */}
              <div className="border border-hairline bg-paper p-4 sm:p-7 md:p-10 rounded-sm shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
                {/* Meta Header */}
                <div className="border-b border-hairline pb-4 mb-5 sm:mb-6 text-xs text-muted-ink flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-muted-ink/70">To:</span>
                    <span className="font-mono text-ink font-medium break-all">sarah.chen@linear.app</span>
                  </div>
                  <div className="inline-flex items-center gap-1.5 text-[11px] text-confirmed bg-confirmed/5 px-2 py-0.5 rounded-sm border border-confirmed/20 self-start sm:self-auto shrink-0">
                    <FileText className="h-3 w-3" />
                    <span>Resume attached (CV_2026.pdf)</span>
                  </div>
                </div>

                {/* Subject */}
                <div className="mb-5 sm:mb-6 space-y-1">
                  <span className="block text-[11px] font-medium uppercase tracking-wider text-muted-ink/70">
                    Subject Line
                  </span>
                  <div className="font-heading text-base sm:text-lg md:text-xl text-ink leading-snug">
                    Linear Staff Frontend Engineer — background in high-performance design systems
                  </div>
                </div>

                {/* Letter Body */}
                <div className="space-y-3.5 sm:space-y-4 text-sm sm:text-base leading-relaxed text-ink/90 font-serif">
                  <p>Hi Sarah,</p>
                  <p>
                    I noticed Linear is expanding the web client team to rebuild core keyboard interactions and canvas-rendered timeline views. Given your focus on sub-50ms interaction latency, I wanted to reach out directly.
                  </p>
                  <p>
                    Over the past four years leading design system architecture at Scale, I led our migration to headless primitives and built our real-time collaborative workspace, decreasing bundle weight by 42% and sustaining 60fps renders on complex graph views.
                  </p>
                  <p>
                    I’ve attached my resume with further project breakdowns. If you’re open to a brief 10-minute introductory conversation this week, I would welcome the chance to share notes on how we tackled similar rendering bottlenecks.
                  </p>
                  <p className="pt-2">
                    Best regards,<br />
                    <span className="font-sans text-sm font-medium text-ink">Karan Gholap</span>
                  </p>
                </div>

                {/* Word count & Tone indicator */}
                <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row sm:items-center justify-between gap-1 border-t border-hairline pt-3 text-[11px] text-muted-ink">
                  <span>124 words • 1 min read</span>
                  <span className="italic text-muted-ink/80 text-[10px] sm:text-[11px]">Restrained, direct, high-signal correspondence</span>
                </div>
              </div>

              {/* Send Action Preview */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
                <div className="flex items-center gap-2 text-xs text-muted-ink">
                  <Lock className="h-3.5 w-3.5 text-muted-ink shrink-0" />
                  <span>Delivered via personal Gmail OAuth token</span>
                </div>

                <div className="inline-flex items-center justify-center gap-2 rounded-sm bg-seal px-5 py-2.5 sm:py-2 text-xs font-medium text-paper shadow-xs min-h-[40px] sm:min-h-0">
                  <Send className="h-3.5 w-3.5" />
                  <span>Send letter</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="border border-hairline bg-paper p-6 sm:p-8 rounded-sm space-y-4">
              <div className="flex items-center justify-between border-b border-hairline pb-3">
                <span className="text-xs font-mono text-muted-ink">Pasted Job Posting Snippet</span>
                <span className="text-xs text-muted-ink">1,450 characters</span>
              </div>
              <pre className="text-xs font-mono text-muted-ink whitespace-pre-wrap leading-relaxed">
{`About the Role:
Linear is looking for a Staff Frontend Engineer to own our core client performance and design system architecture.

Responsibilities:
- Drive rendering architecture across web and desktop clients using Next.js, React, and WebGL.
- Architect our headless design system components for zero-latency interactions and full keyboard navigation.
- Partner with product designers to ship buttery-smooth transitions and real-time multiplayer states.

Qualifications:
- 6+ years building mission-critical web applications with high visual polish.
- Deep expertise in browser rendering pipelines, WebGL canvas performance, and bundle optimization.
- Strong product intuition and obsession with tactile micro-interactions.`}
              </pre>
            </div>
          )}
        </div>
      </section>

      {/* 3. HOW IT WORKS */}
      <section className="border-b border-hairline px-4 py-12 sm:px-6 sm:py-20 md:py-24">
        <div className="mx-auto max-w-4xl">
          <div className="mb-8 sm:mb-12">
            <span className="text-[10px] sm:text-[11px] font-medium uppercase tracking-wider text-muted-ink">
              Three-step cadence
            </span>
            <h2 className="font-heading text-xl sm:text-2xl md:text-3xl text-ink mt-1">
              From job posting to dispatched letter in 60 seconds
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            {/* Step 1 */}
            <div className="border-t-2 border-ink pt-3.5 sm:pt-4 space-y-2">
              <span className="font-mono text-xs text-muted-ink">01</span>
              <h3 className="font-heading text-base sm:text-lg text-ink">Supply posting & contact</h3>
              <p className="text-xs sm:text-sm text-muted-ink leading-relaxed">
                Paste any raw job posting text and the hiring manager’s or recruiter’s email address. No complicated scraping or profile setup needed.
              </p>
            </div>

            {/* Step 2 */}
            <div className="border-t-2 border-seal pt-3.5 sm:pt-4 space-y-2">
              <span className="font-mono text-xs text-seal font-medium">02</span>
              <h3 className="font-heading text-base sm:text-lg text-ink">Inspect in Letter Frame</h3>
              <p className="text-xs sm:text-sm text-muted-ink leading-relaxed">
                The AI synthesizes the posting against your resume, drafting a tailored letter under 150 words. Tweak or regenerate with complete editorial control.
              </p>
            </div>

            {/* Step 3 */}
            <div className="border-t-2 border-confirmed pt-3.5 sm:pt-4 space-y-2">
              <span className="font-mono text-xs text-confirmed font-medium">03</span>
              <h3 className="font-heading text-base sm:text-lg text-ink">Dispatch via your Gmail</h3>
              <p className="text-xs sm:text-sm text-muted-ink leading-relaxed">
                Send directly through your authenticated Google account with your verified resume PDF automatically attached. Logged to prevent repeat sends.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. THE PHILOSOPHY: CONTRAST WITH MASS BLASTERS */}
      <section className="border-b border-hairline bg-[#FAF9F5] px-4 py-12 sm:px-6 sm:py-20 md:py-24">
        <div className="mx-auto max-w-4xl space-y-6 sm:space-y-8">
          <div>
            <span className="text-[10px] sm:text-[11px] font-medium uppercase tracking-wider text-muted-ink">
              Our philosophy
            </span>
            <h2 className="font-heading text-xl sm:text-2xl md:text-3xl text-ink mt-1">
              Why mass outreach tools fail—and why deliberate correspondence succeeds
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            {/* Conventional Tools */}
            <div className="border border-hairline bg-paper p-5 sm:p-6 rounded-sm space-y-3">
              <div className="flex items-center gap-2 text-xs font-medium text-amber-800">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <span>The Automated Spam Blaster Approach</span>
              </div>
              <ul className="space-y-2 text-xs text-muted-ink leading-relaxed">
                <li>• Generic mail-merge templates that recruiters spot in 2 seconds.</li>
                <li>• Dispatched from third-party SMTP servers that get flagged as Promotions or Spam.</li>
                <li>• Spray-and-pray volume that ruins candidate credibility and burns company bridges.</li>
                <li>• No deliberate review step—typos and hallucinations get sent out blindly.</li>
              </ul>
            </div>

            {/* Cold Email */}
            <div className="border border-hairline bg-paper p-5 sm:p-6 rounded-sm space-y-3">
              <div className="flex items-center gap-2 text-xs font-medium text-confirmed">
                <CheckCircle2 className="h-4 w-4 text-confirmed shrink-0" />
                <span>The Cold Email Standard</span>
              </div>
              <ul className="space-y-2 text-xs text-muted-ink leading-relaxed">
                <li>• 1-to-1 tailored correspondence referencing explicit company requirements.</li>
                <li>• Sent straight through your verified personal Gmail account with pristine deliverability.</li>
                <li>• Built-in duplicate detection ensures you never embarrassingly message someone twice.</li>
                <li>• Deliberate Letter Frame review step keeps you firmly in command of your reputation.</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* 5. ARCHITECTURAL FEATURES GRID */}
      <section className="border-b border-hairline px-4 py-12 sm:px-6 sm:py-20 md:py-24">
        <div className="mx-auto max-w-4xl space-y-8 sm:space-y-10">
          <div>
            <span className="text-[10px] sm:text-[11px] font-medium uppercase tracking-wider text-muted-ink">
              Architectural foundation
            </span>
            <h2 className="font-heading text-xl sm:text-2xl md:text-3xl text-ink mt-1">
              Engineered with restraint and technical integrity
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            <div className="border border-hairline bg-paper p-4 sm:p-5 rounded-sm space-y-2">
              <div className="flex items-center gap-2 text-ink">
                <Mail className="h-4 w-4 text-seal shrink-0" />
                <h3 className="text-sm font-medium">Google OAuth Sending</h3>
              </div>
              <p className="text-xs text-muted-ink leading-relaxed">
                Uses the official Gmail API with narrowest scope (gmail.send). Outgoing messages look authentic because they are authentic.
              </p>
            </div>

            <div className="border border-hairline bg-paper p-4 sm:p-5 rounded-sm space-y-2">
              <div className="flex items-center gap-2 text-ink">
                <FileText className="h-4 w-4 text-seal shrink-0" />
                <h3 className="text-sm font-medium">Automatic PDF Attachments</h3>
              </div>
              <p className="text-xs text-muted-ink leading-relaxed">
                Upload your resume once to private encrypted storage. We handle MIME multi-part encoding and attach the file on every send.
              </p>
            </div>

            <div className="border border-hairline bg-paper p-4 sm:p-5 rounded-sm space-y-2">
              <div className="flex items-center gap-2 text-ink">
                <ShieldCheck className="h-4 w-4 text-seal shrink-0" />
                <h3 className="text-sm font-medium">Duplicate Contact Shield</h3>
              </div>
              <p className="text-xs text-muted-ink leading-relaxed">
                Live lookup verifies whether you’ve previously messaged this recipient, preventing awkward follow-ups and duplicated applications.
              </p>
            </div>

            <div className="border border-hairline bg-paper p-4 sm:p-5 rounded-sm space-y-2">
              <div className="flex items-center gap-2 text-ink">
                <Zap className="h-4 w-4 text-seal shrink-0" />
                <h3 className="text-sm font-medium">High-Signal Prompting</h3>
              </div>
              <p className="text-xs text-muted-ink leading-relaxed">
                Tuned strictly against corporate jargon. Rejects generic filler phrases like “I am writing to express my passion” in favor of crisp facts.
              </p>
            </div>

            <div className="border border-hairline bg-paper p-4 sm:p-5 rounded-sm space-y-2">
              <div className="flex items-center gap-2 text-ink">
                <Building2 className="h-4 w-4 text-seal shrink-0" />
                <h3 className="text-sm font-medium">Comprehensive Send Log</h3>
              </div>
              <p className="text-xs text-muted-ink leading-relaxed">
                Full chronological ledger searchable by company, recipient, or subject line, complete with delivery statuses and exact sent timestamps.
              </p>
            </div>

            <div className="border border-hairline bg-paper p-4 sm:p-5 rounded-sm space-y-2">
              <div className="flex items-center gap-2 text-ink">
                <Lock className="h-4 w-4 text-seal shrink-0" />
                <h3 className="text-sm font-medium">Encrypted at Rest</h3>
              </div>
              <p className="text-xs text-muted-ink leading-relaxed">
                All OAuth tokens and credentials are securely encrypted. Your background and job searches remain private to your account.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 6. TRANSPARENT PRICING */}
      <section className="border-b border-hairline bg-[#FAF9F5] px-4 py-12 sm:px-6 sm:py-20 md:py-24">
        <div className="mx-auto max-w-4xl space-y-8 sm:space-y-12">
          <div className="text-center max-w-xl mx-auto space-y-2">
            <span className="text-[10px] sm:text-[11px] font-medium uppercase tracking-wider text-muted-ink">
              Transparent plans
            </span>
            <h2 className="font-heading text-2xl sm:text-3xl md:text-4xl text-ink">
              Simple, accessible pricing
            </h2>
            <p className="text-xs sm:text-sm text-muted-ink">
              Test with real applications before committing. Upgrade when you’re ready to run an active job search at scale.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 max-w-3xl mx-auto">
            {/* Free Tier */}
            <div className="border border-hairline bg-paper p-6 sm:p-8 rounded-sm flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <div className="flex items-baseline justify-between">
                  <h3 className="font-heading text-lg sm:text-xl text-ink">Free</h3>
                  <div className="text-right">
                    <span className="font-heading text-xl sm:text-2xl text-ink">$0</span>
                    <span className="text-xs text-muted-ink"> / month</span>
                  </div>
                </div>
                <p className="text-xs text-muted-ink leading-relaxed">
                  Ideal for trying out the correspondence workflow with your top target positions.
                </p>

                <div className="border-t border-hairline pt-4 space-y-2.5 text-xs text-ink/90">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 text-confirmed shrink-0" />
                    <span>5 tailored letters per month</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 text-confirmed shrink-0" />
                    <span>1 active resume PDF</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 text-confirmed shrink-0" />
                    <span>2 AI regenerations per draft</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 text-confirmed shrink-0" />
                    <span>Duplicate contact protection</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 text-confirmed shrink-0" />
                    <span>30-day send log history</span>
                  </div>
                </div>
              </div>

              <Link
                href="/signup"
                className="w-full text-center rounded-sm border border-hairline bg-[#EDEAE2] py-2.5 text-xs font-medium text-ink hover:bg-[#E4DFD3] transition-colors min-h-[40px] flex items-center justify-center"
              >
                Get started free
              </Link>
            </div>

            {/* Pro Tier */}
            <div className="border-2 border-seal bg-paper p-6 sm:p-8 rounded-sm flex flex-col justify-between space-y-6 relative">
              <div className="absolute -top-3 right-4 sm:right-6 bg-seal text-paper text-[10px] font-medium tracking-wide uppercase px-2 py-0.5 rounded-sm">
                Active Job Search
              </div>

              <div className="space-y-4">
                <div className="flex items-baseline justify-between">
                  <h3 className="font-heading text-lg sm:text-xl text-ink">Pro</h3>
                  <div className="text-right">
                    <span className="font-heading text-xl sm:text-2xl text-ink">$9</span>
                    <span className="text-xs text-muted-ink"> / month</span>
                  </div>
                </div>
                <p className="text-xs text-muted-ink leading-relaxed">
                  For high-cadence job seekers conducting extensive direct outreach.
                </p>

                <div className="border-t border-hairline pt-4 space-y-2.5 text-xs text-ink/90">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 text-confirmed shrink-0" />
                    <span className="font-medium">Unlimited tailored letters</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 text-confirmed shrink-0" />
                    <span>Multiple tailored resume versions</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 text-confirmed shrink-0" />
                    <span>Unlimited AI regenerations</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 text-confirmed shrink-0" />
                    <span>Full lifetime send log history</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 text-confirmed shrink-0" />
                    <span>Priority generation model & fast support</span>
                  </div>
                </div>
              </div>

              <Link
                href="/signup"
                className="w-full text-center rounded-sm bg-seal py-2.5 text-xs font-medium text-paper hover:bg-seal/90 shadow-xs transition-all min-h-[40px] flex items-center justify-center"
              >
                Upgrade to Pro
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 7. FREQUENTLY ASKED QUESTIONS */}
      <section className="border-b border-hairline px-4 py-12 sm:px-6 sm:py-20 md:py-24">
        <div className="mx-auto max-w-3xl space-y-6 sm:space-y-8">
          <div>
            <span className="text-[10px] sm:text-[11px] font-medium uppercase tracking-wider text-muted-ink">
              Common questions
            </span>
            <h2 className="font-heading text-xl sm:text-2xl md:text-3xl text-ink mt-1">
              Everything you need to know about our correspondence tool
            </h2>
          </div>

          <div className="border-t border-hairline divide-y divide-hairline">
            {faqs.map((faq, idx) => (
              <div key={idx} className="py-3.5 sm:py-4">
                <button
                  type="button"
                  onClick={() => toggleFaq(idx)}
                  className="flex w-full items-center justify-between text-left text-xs sm:text-sm font-medium text-ink hover:opacity-80 transition-opacity gap-3 cursor-pointer py-1"
                >
                  <span>{faq.q}</span>
                  <ChevronDown
                    className={`h-4 w-4 text-muted-ink shrink-0 transition-transform duration-200 ${
                      openFaq === idx ? "rotate-180" : ""
                    }`}
                  />
                </button>
                {openFaq === idx && (
                  <p className="mt-2 text-xs sm:text-sm text-muted-ink leading-relaxed">
                    {faq.a}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 8. BOTTOM INVITATION CTA */}
      <section className="border-b border-hairline bg-[#FAF9F5] px-4 py-12 sm:px-6 sm:py-16 md:py-20 text-center">
        <div className="mx-auto max-w-2xl space-y-5 sm:space-y-6">
          <h2 className="font-heading text-2xl sm:text-3xl md:text-4xl text-ink tracking-tight">
            Ready to stand out in the recruiter’s inbox?
          </h2>
          <p className="text-xs sm:text-sm text-muted-ink max-w-lg mx-auto leading-relaxed">
            Stop sending generic spray-and-pray applications. Draft genuine, high-signal correspondence that commands respect.
          </p>
          <div className="pt-2 flex items-center justify-center">
            <Link
              href="/draft"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-sm bg-seal px-6 py-3 text-xs sm:text-sm font-medium text-paper hover:bg-seal/90 shadow-xs transition-all min-h-[42px]"
            >
              <span>Launch correspondence draft</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* 9. RESTRAINED FOOTER */}
      <footer className="px-4 py-8 sm:px-6 sm:py-12 text-xs text-muted-ink">
        <div className="mx-auto max-w-4xl flex flex-col sm:flex-row items-center justify-between gap-5 sm:gap-6">
          <div className="space-y-1 text-center sm:text-left">
            <span className="font-heading text-base text-ink font-medium">Cold email</span>
            <p className="text-[11px] text-muted-ink">
              Tailored executive correspondence directly from your personal Gmail.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-[11px]">
            <Link href="/draft" className="hover:text-ink transition-colors py-1">
              Draft
            </Link>
            <Link href="/log" className="hover:text-ink transition-colors py-1">
              Send Log
            </Link>
            <Link href="/settings" className="hover:text-ink transition-colors py-1">
              Resume Settings
            </Link>
            <Link href="/login" className="hover:text-ink transition-colors py-1">
              Sign In
            </Link>
            <Link href="/signup" className="hover:text-ink transition-colors py-1">
              Create Account
            </Link>
          </div>
        </div>

        <div className="mx-auto max-w-4xl border-t border-hairline mt-6 sm:mt-8 pt-5 sm:pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4 text-[10px] text-muted-ink/80 text-center sm:text-left">
          <div>
            © {new Date().getFullYear()} Cold Email Sender. All rights reserved.
          </div>
          <div className="flex items-center justify-center gap-3 sm:gap-4">
            <span>Google API Verification Compliant</span>
            <span>•</span>
            <span>Encrypted at rest</span>
          </div>
        </div>
      </footer>
    </main>
  );
}
