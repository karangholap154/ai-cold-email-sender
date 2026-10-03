"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
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
  Sparkles,
  CornerDownRight,
  MessageSquare,
  Check,
} from "lucide-react";
import { FREE_PLAN, PRO_PLAN } from "@/lib/constants/plans";
import { Footer } from "@/components/footer";

export default function LandingPage() {
  const [activeTab, setActiveTab] = useState<"preview" | "raw">("preview");
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const toggleFaq = (idx: number) => {
    setOpenFaq(openFaq === idx ? null : idx);
  };

  const faqs = [
    {
      q: "Does Vina read or access my private Gmail inbox?",
      a: "Never. Vina only ever sends what you approve, from your own Gmail account. We don't read your inbox, and we don't send anything automatically.",
    },
    {
      q: "Can I inspect and edit every letter before it is sent?",
      a: "Yes. Vina is built for people applying to real roles at real companies — not for blasting the same message to a hundred inboxes. Every letter is editable before anything goes out.",
    },
    {
      q: "How does the résumé attachment work?",
      a: "Upload your résumé (PDF) once in Settings so Vina can reference it in your letters. When you send, your résumé is attached automatically.",
    },
    {
      q: "What prevents me from emailing the same recruiter twice?",
      a: "Vina includes built-in duplicate contact detection. When you enter an HR email address you have previously written to, an inline warning reminds you before sending.",
    },
    {
      q: "Why is sending from my personal Gmail better than an email automation tool?",
      a: "Outreach sent through third-party marketing servers often lands in Spam or Promotions. Sending directly from your authentic Gmail account preserves your sender reputation and reaches the primary inbox.",
    },
  ];

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": "https://meetvina.app/#website",
        "url": "https://meetvina.app",
        "name": "Vina",
        "description": "Turn a job description into a letter worth sending.",
        "publisher": {
          "@type": "Organization",
          "name": "Vina",
          "url": "https://meetvina.app",
          "logo": "https://meetvina.app/logo.png",
        },
      },
      {
        "@type": "SoftwareApplication",
        "@id": "https://meetvina.app/#software",
        "name": "Vina",
        "applicationCategory": "BusinessApplication",
        "operatingSystem": "All",
        "url": "https://meetvina.app",
        "description":
          "Vina reads the job description, drafts a short, specific letter to go with your résumé, and hands it back to you to review before anything is sent.",
        "offers": [
          {
            "@type": "Offer",
            "name": `${FREE_PLAN.name} Tier`,
            "price": String(FREE_PLAN.priceUsd),
            "priceCurrency": "USD",
            "description": FREE_PLAN.features.map((f) => f.text).join(", "),
          },
          {
            "@type": "Offer",
            "name": `${PRO_PLAN.name} Membership`,
            "price": `${PRO_PLAN.priceUsd}.00`,
            "priceCurrency": "USD",
            "description": PRO_PLAN.features.map((f) => f.text).join(", "),
          },
        ],
      },
      {
        "@type": "FAQPage",
        "@id": "https://meetvina.app/#faq",
        "mainEntity": faqs.map((faq) => ({
          "@type": "Question",
          "name": faq.q,
          "acceptedAnswer": {
            "@type": "Answer",
            "text": faq.a,
          },
        })),
      },
    ],
  };

  return (
    <main className="flex flex-1 flex-col bg-paper text-ink selection:bg-[#E4DFD3]">
      {/* Schema.org Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* 1. HERO SECTION */}
      <section className="relative border-b border-hairline px-4 pt-12 pb-16 sm:px-6 sm:pt-20 sm:pb-24 md:pt-28 md:pb-32 overflow-hidden">
        <div className="mx-auto max-w-4xl text-left">
          {/* Eyebrow badge */}
          <div className="inline-flex items-center gap-2 rounded-full border border-hairline bg-[#FAF9F5] px-3.5 py-1 text-[11px] font-medium tracking-wide text-ink/80 shadow-2xs">
            <span className="h-1.5 w-1.5 rounded-full bg-confirmed animate-pulse" />
            <span>Deliberate Candidate Outreach • 0% Mass Automated Spam</span>
          </div>

          {/* Main Title */}
          <h1 className="font-heading mt-6 text-3xl sm:text-5xl md:text-6xl lg:text-[66px] text-ink tracking-tight leading-[1.08]">
            Turn a job description into a letter worth sending.
          </h1>

          {/* Subheading */}
          <p className="mt-5 sm:mt-6 max-w-2xl text-sm sm:text-base md:text-lg text-muted-ink leading-relaxed">
            Paste the job post. Vina drafts a short, tailored email and attaches your résumé. You review it, then send it from your own Gmail.
          </p>

          {/* Primary Action Group */}
          <div className="mt-8 sm:mt-10 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
            <Link
              href="/login?mode=signup"
              className="inline-flex items-center justify-center gap-2 rounded-sm bg-seal px-6 py-3 text-xs sm:text-sm font-medium text-paper hover:bg-seal/90 shadow-xs transition-all min-h-[44px]"
            >
              <span>Get started free</span>
              <ArrowRight className="h-4 w-4" />
            </Link>

            <a
              href="#how-it-works"
              className="inline-flex items-center justify-center gap-2 rounded-sm border border-hairline bg-paper px-6 py-3 text-xs sm:text-sm font-medium text-ink hover:bg-[#EDEAE2] transition-colors min-h-[44px]"
            >
              <span>See how it works</span>
            </a>
          </div>

          {/* Value Proof Badges */}
          <div className="mt-10 sm:mt-12 flex flex-col sm:flex-row flex-wrap items-start sm:items-center gap-y-3 gap-x-6 sm:gap-x-8 text-xs text-muted-ink border-t border-hairline pt-6">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-3.5 w-3.5 text-confirmed shrink-0" />
              <span>Sent from your personal Gmail</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-3.5 w-3.5 text-confirmed shrink-0" />
              <span>Résumé PDF attached automatically</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-3.5 w-3.5 text-confirmed shrink-0" />
              <span>Nothing sent without your approval</span>
            </div>
          </div>
        </div>
      </section>

      {/* 2. THE SIGNATURE EXPERIENCE: THE LETTER FRAME SHOWCASE */}
      <section className="border-b border-hairline bg-[#FAF9F5] px-4 py-12 sm:px-6 sm:py-20 md:py-24">
        <div className="mx-auto max-w-4xl">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6 sm:mb-8">
            <div>
              <span className="text-[10px] sm:text-[11px] font-medium uppercase tracking-wider text-muted-ink">
                Human-in-the-loop correspondence
              </span>
              <h2 className="font-heading text-xl sm:text-2xl md:text-3xl text-ink mt-1">
                The Letter Frame
              </h2>
              <p className="mt-1.5 text-xs sm:text-sm text-muted-ink max-w-xl leading-relaxed">
                Designed to slow you down at the single moment that matters: before sending. Inspect extracted role context, hone the phrasing, and dispatch with genuine confidence.
              </p>
            </div>

            {/* Toggle tabs */}
            <div className="flex items-center rounded-sm border border-hairline bg-paper p-1 text-xs shrink-0 self-start sm:self-auto shadow-2xs">
              <button
                type="button"
                onClick={() => setActiveTab("preview")}
                className={`px-3 py-1.5 rounded-xs transition-all cursor-pointer ${
                  activeTab === "preview"
                    ? "bg-ink text-paper font-medium shadow-xs"
                    : "text-muted-ink hover:text-ink"
                }`}
              >
                Tailored Letter
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("raw")}
                className={`px-3 py-1.5 rounded-xs transition-all cursor-pointer ${
                  activeTab === "raw"
                    ? "bg-ink text-paper font-medium shadow-xs"
                    : "text-muted-ink hover:text-ink"
                }`}
              >
                Raw Job Posting
              </button>
            </div>
          </div>

          {activeTab === "preview" ? (
            <div className="space-y-4">
              {/* Extracted Entity Confirmation Strip */}
              <div className="border border-hairline bg-paper p-3.5 sm:p-4 rounded-sm shadow-2xs">
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
                    <span className="rounded-sm border border-hairline bg-[#EDEAE2] px-2 py-0.5 text-[10px] sm:text-[11px] text-muted-ink font-medium">
                      Design Systems
                    </span>
                    <span className="rounded-sm border border-hairline bg-[#EDEAE2] px-2 py-0.5 text-[10px] sm:text-[11px] text-muted-ink font-medium">
                      Next.js &amp; WebGL
                    </span>
                    <span className="rounded-sm border border-hairline bg-[#EDEAE2] px-2 py-0.5 text-[10px] sm:text-[11px] text-muted-ink font-medium">
                      Sub-50ms Latency
                    </span>
                  </div>
                </div>
              </div>

              {/* Physical Stationery Letter Frame Mockup */}
              <div className="border border-hairline bg-paper p-5 sm:p-8 md:p-12 rounded-sm shadow-[0_4px_24px_rgba(0,0,0,0.03)] relative overflow-hidden">
                {/* Decorative vintage postage stamp motif in top right */}
                <div className="absolute top-4 right-4 sm:top-6 sm:right-6 border border-dashed border-hairline bg-[#FAF9F5] px-2.5 py-1 text-[9px] font-mono uppercase tracking-widest text-muted-ink/80 select-none hidden sm:block">
                  AIR MAIL • 1ST CLASS
                </div>

                {/* Recipient & Attachment Header */}
                <div className="border-b border-hairline pb-4 mb-5 sm:mb-6 text-xs text-muted-ink flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                  <div className="flex items-center gap-2">
                    <span className="text-muted-ink/70">To:</span>
                    <span className="font-mono text-ink font-medium break-all">sarah.chen@linear.app</span>
                  </div>
                  <div className="inline-flex items-center gap-1.5 text-[11px] text-confirmed bg-confirmed/10 px-2.5 py-0.5 rounded-sm border border-confirmed/20 self-start sm:self-auto shrink-0 font-medium">
                    <FileText className="h-3 w-3" />
                    <span>Résumé attached (Resume_2026.pdf)</span>
                  </div>
                </div>

                {/* Subject Line */}
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
                    I’ve attached my résumé with further project breakdowns. If you’re open to a brief 10-minute introductory conversation this week, I would welcome the chance to share notes on how we tackled similar rendering bottlenecks.
                  </p>
                  <p className="pt-2">
                    Best regards,<br />
                    <span className="font-sans text-sm font-medium text-ink">Karan Gholap</span>
                  </p>
                </div>

                {/* Metadata stats */}
                <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 border-t border-hairline pt-3.5 text-[11px] text-muted-ink">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-ink font-medium">124 words</span>
                    <span>•</span>
                    <span>1 min reading time</span>
                  </div>
                  <span className="italic text-muted-ink/80 text-[10px] sm:text-[11px]">
                    Restrained, direct, high-signal correspondence
                  </span>
                </div>
              </div>

              {/* Action Delivery Preview Bar */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
                <div className="flex items-center gap-2 text-xs text-muted-ink">
                  <Lock className="h-3.5 w-3.5 text-seal shrink-0" />
                  <span>Delivered natively via your personal Gmail OAuth token</span>
                </div>

                <div className="inline-flex items-center justify-center gap-2 rounded-sm bg-seal px-5 py-2.5 sm:py-2 text-xs font-medium text-paper shadow-xs min-h-[42px] sm:min-h-0">
                  <Send className="h-3.5 w-3.5" />
                  <span>Send letter</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="border border-hairline bg-paper p-6 sm:p-8 rounded-sm space-y-4 shadow-2xs">
              <div className="flex items-center justify-between border-b border-hairline pb-3">
                <span className="text-xs font-mono text-muted-ink">Pasted Job Posting Snippet</span>
                <span className="text-xs text-muted-ink">1,450 characters</span>
              </div>
              <pre className="text-xs font-mono text-muted-ink whitespace-pre-wrap leading-relaxed overflow-x-auto">
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

      {/* 3. HOW IT WORKS (VISUAL 3-STEP SEQUENCE) */}
      <section id="how-it-works" className="border-b border-hairline px-4 py-12 sm:px-6 sm:py-20 md:py-24">
        <div className="mx-auto max-w-4xl space-y-8 sm:space-y-12">
          <div>
            <span className="text-[10px] sm:text-[11px] font-medium uppercase tracking-wider text-muted-ink">
              How it works
            </span>
            <h2 className="font-heading text-xl sm:text-2xl md:text-3xl text-ink mt-1">
              Three deliberate steps. You remain in command.
            </h2>
            <p className="mt-1 text-xs sm:text-sm text-muted-ink max-w-xl leading-relaxed">
              Nothing goes out automatically. Vina handles synthesis and drafting, while you hold the final signature and approval.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            {/* Step 1 */}
            <div className="border border-hairline bg-paper p-5 sm:p-6 rounded-sm flex flex-col justify-between space-y-4 shadow-2xs">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs text-muted-ink font-semibold">01</span>
                  <span className="text-[10px] uppercase font-mono tracking-wider text-muted-ink/70">Input</span>
                </div>
                <h3 className="font-heading text-base sm:text-lg text-ink">
                  Paste the job posting
                </h3>
                <p className="text-xs sm:text-sm text-muted-ink leading-relaxed">
                  Vina reads the posting, identifies the true priorities of the hiring team, and maps them to your background.
                </p>
              </div>

              {/* Step 1 Micro-Visual */}
              <div className="rounded-sm border border-hairline/80 bg-[#FAF9F5] p-3 text-[11px] font-mono text-muted-ink space-y-1.5">
                <div className="text-ink font-medium">Detected entities:</div>
                <div className="flex items-center gap-1.5 text-[10px] text-confirmed font-sans">
                  <Check className="h-3 w-3" />
                  <span>Company &amp; role identified</span>
                </div>
                <div className="flex items-center gap-1.5 text-[10px] text-confirmed font-sans">
                  <Check className="h-3 w-3" />
                  <span>3 core technical requirements</span>
                </div>
              </div>
            </div>

            {/* Step 2 */}
            <div className="border border-hairline bg-paper p-5 sm:p-6 rounded-sm flex flex-col justify-between space-y-4 shadow-2xs border-t-2 border-t-seal">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs text-seal font-semibold">02</span>
                  <span className="text-[10px] uppercase font-mono tracking-wider text-seal">Craft</span>
                </div>
                <h3 className="font-heading text-base sm:text-lg text-ink">
                  Review &amp; refine the draft
                </h3>
                <p className="text-xs sm:text-sm text-muted-ink leading-relaxed">
                  A short, specific letter appears in the Letter Frame. Edit every sentence, hone the tone, or regenerate with one click.
                </p>
              </div>

              {/* Step 2 Micro-Visual */}
              <div className="rounded-sm border border-hairline/80 bg-[#FAF9F5] p-3 text-[11px] font-mono text-muted-ink space-y-1.5">
                <div className="text-ink font-medium">Letter attributes:</div>
                <div className="flex items-center justify-between text-[10px] font-sans">
                  <span className="text-muted-ink">Length:</span>
                  <span className="font-medium text-ink">80–130 words</span>
                </div>
                <div className="flex items-center justify-between text-[10px] font-sans">
                  <span className="text-muted-ink">Cliché filter:</span>
                  <span className="font-medium text-confirmed">100% active</span>
                </div>
              </div>
            </div>

            {/* Step 3 */}
            <div className="border border-hairline bg-paper p-5 sm:p-6 rounded-sm flex flex-col justify-between space-y-4 shadow-2xs border-t-2 border-t-confirmed">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs text-confirmed font-semibold">03</span>
                  <span className="text-[10px] uppercase font-mono tracking-wider text-confirmed">Dispatch</span>
                </div>
                <h3 className="font-heading text-base sm:text-lg text-ink">
                  Send from your Gmail
                </h3>
                <p className="text-xs sm:text-sm text-muted-ink leading-relaxed">
                  Dispatched directly from your authenticated Gmail account with your résumé attached and duplicate protection engaged.
                </p>
              </div>

              {/* Step 3 Micro-Visual */}
              <div className="rounded-sm border border-hairline/80 bg-[#FAF9F5] p-3 text-[11px] font-mono text-muted-ink space-y-1.5">
                <div className="text-ink font-medium">Delivery details:</div>
                <div className="flex items-center gap-1.5 text-[10px] text-ink font-sans">
                  <Mail className="h-3 w-3 text-seal shrink-0" />
                  <span className="truncate">Your personal @gmail.com</span>
                </div>
                <div className="flex items-center gap-1.5 text-[10px] text-confirmed font-sans">
                  <FileText className="h-3 w-3 shrink-0" />
                  <span>PDF résumé attached</span>
                </div>
              </div>
            </div>
          </div>

          {/* Trust reassurance banner */}
          <div className="rounded-sm border border-hairline bg-[#FAF9F5] p-4 sm:p-5 flex items-start sm:items-center gap-3.5 shadow-2xs">
            <ShieldCheck className="h-5 w-5 text-confirmed shrink-0 mt-0.5 sm:mt-0" />
            <p className="text-xs sm:text-sm text-muted-ink leading-relaxed">
              <strong className="text-ink font-medium">Our privacy promise:</strong> Vina only ever sends what you approve, from your own Gmail account. We never read your inbox, and we never send anything automatically.
            </p>
          </div>
        </div>
      </section>

      {/* 4. THE PHILOSOPHY: CONTRAST WITH MASS SPAM BLASTERS */}
      <section className="border-b border-hairline bg-[#FAF9F5] px-4 py-12 sm:px-6 sm:py-20 md:py-24">
        <div className="mx-auto max-w-4xl space-y-6 sm:space-y-8">
          <div>
            <span className="text-[10px] sm:text-[11px] font-medium uppercase tracking-wider text-muted-ink">
              Our philosophy
            </span>
            <h2 className="font-heading text-xl sm:text-2xl md:text-3xl text-ink mt-1">
              Why mass blast tools fail — and why deliberate letters succeed
            </h2>
            <p className="mt-1 text-xs sm:text-sm text-muted-ink max-w-xl leading-relaxed">
              Recruiters receive hundreds of template emails each week. Vina is designed to stand out through restraint, specificity, and authenticity.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
            {/* The Automated Spam Blaster Approach */}
            <div className="border border-hairline bg-paper p-5 sm:p-7 rounded-sm space-y-4 shadow-2xs">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-amber-900 border-b border-hairline pb-3">
                <AlertTriangle className="h-4 w-4 text-amber-700 shrink-0" />
                <span>The Automated Spam Blaster Approach</span>
              </div>
              <ul className="space-y-2.5 text-xs text-muted-ink leading-relaxed">
                <li className="flex items-start gap-2">
                  <span className="text-amber-800 shrink-0 font-bold">✕</span>
                  <span><strong>Generic mail-merges:</strong> Obvious mail-merge templates that recruiters spot and delete in two seconds.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-800 shrink-0 font-bold">✕</span>
                  <span><strong>Spam server delivery:</strong> Sent from third-party SMTP servers that get flagged into Spam or Promotions tabs.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-800 shrink-0 font-bold">✕</span>
                  <span><strong>Ruined credibility:</strong> Spray-and-pray volume burns company bridges and marks your email domain permanently.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-800 shrink-0 font-bold">✕</span>
                  <span><strong>Zero review:</strong> Fabricated experience and AI hallucinations get broadcasted automatically.</span>
                </li>
              </ul>
            </div>

            {/* The Vina Standard */}
            <div className="border-2 border-seal/40 bg-paper p-5 sm:p-7 rounded-sm space-y-4 shadow-2xs relative">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-confirmed border-b border-hairline pb-3">
                <CheckCircle2 className="h-4 w-4 text-confirmed shrink-0" />
                <span>The Vina Standard</span>
              </div>
              <ul className="space-y-2.5 text-xs text-muted-ink leading-relaxed">
                <li className="flex items-start gap-2">
                  <Check className="h-3.5 w-3.5 text-confirmed shrink-0 mt-0.5" />
                  <span><strong>1-to-1 tailored notes:</strong> Directly connects your genuine background to the specific problems outlined in the JD.</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-3.5 w-3.5 text-confirmed shrink-0 mt-0.5" />
                  <span><strong>Pristine Gmail deliverability:</strong> Dispatched from your real Gmail account directly into the hiring manager’s primary inbox.</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-3.5 w-3.5 text-confirmed shrink-0 mt-0.5" />
                  <span><strong>Duplicate contact shield:</strong> Real-time recipient detection ensures you never message the same recruiter twice.</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-3.5 w-3.5 text-confirmed shrink-0 mt-0.5" />
                  <span><strong>Total editorial control:</strong> Every word is editable in the Letter Frame before anything leaves your account.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* 5. ARCHITECTURAL BENTO GRID */}
      <section className="border-b border-hairline px-4 py-12 sm:px-6 sm:py-20 md:py-24">
        <div className="mx-auto max-w-4xl space-y-8 sm:space-y-12">
          <div>
            <span className="text-[10px] sm:text-[11px] font-medium uppercase tracking-wider text-muted-ink">
              Architectural foundation
            </span>
            <h2 className="font-heading text-xl sm:text-2xl md:text-3xl text-ink mt-1">
              Engineered with technical restraint and privacy
            </h2>
            <p className="mt-1 text-xs sm:text-sm text-muted-ink max-w-xl leading-relaxed">
              Every architectural decision is grounded in deliverability, security, and respect for the recipient&apos;s inbox.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6">
            {/* Feature 1 (Spans 2 cols) */}
            <div className="md:col-span-2 border border-hairline bg-paper p-5 sm:p-6 rounded-sm space-y-3 shadow-2xs">
              <div className="flex items-center gap-2.5 text-ink font-medium text-sm sm:text-base">
                <Mail className="h-4 w-4 text-seal shrink-0" />
                <h3>Native Gmail API &amp; Conversation Threading</h3>
              </div>
              <p className="text-xs sm:text-sm text-muted-ink leading-relaxed">
                Connects through official Google OAuth 2.0 with minimal scopes (<code className="text-[11px] font-mono bg-[#FAF9F5] px-1.5 py-0.5 border border-hairline rounded-xs">gmail.send</code>). Outgoing messages are genuine Gmail API sends with full RFC 2822 headers, ensuring you reach the primary inbox rather than promotional filters.
              </p>
              <div className="pt-2 flex flex-wrap gap-2 text-[10px] font-mono text-muted-ink">
                <span className="border border-hairline bg-[#FAF9F5] px-2 py-0.5 rounded-xs">Primary Inbox Guarantee</span>
                <span className="border border-hairline bg-[#FAF9F5] px-2 py-0.5 rounded-xs">Same-Thread Replies</span>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="border border-hairline bg-paper p-5 sm:p-6 rounded-sm space-y-3 shadow-2xs">
              <div className="flex items-center gap-2.5 text-ink font-medium text-sm">
                <FileText className="h-4 w-4 text-seal shrink-0" />
                <h3>Automatic PDF Attachments</h3>
              </div>
              <p className="text-xs text-muted-ink leading-relaxed">
                Upload your résumé once to your private Supabase bucket. Vina handles multi-part MIME encoding and attaches your PDF cleanly to every send.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="border border-hairline bg-paper p-5 sm:p-6 rounded-sm space-y-3 shadow-2xs">
              <div className="flex items-center gap-2.5 text-ink font-medium text-sm">
                <ShieldCheck className="h-4 w-4 text-seal shrink-0" />
                <h3>Duplicate Contact Shield</h3>
              </div>
              <p className="text-xs text-muted-ink leading-relaxed">
                Live recipient lookup verifies whether you’ve messaged this recruiter previously, guarding against duplicated or uncoordinated applications.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="border border-hairline bg-paper p-5 sm:p-6 rounded-sm space-y-3 shadow-2xs">
              <div className="flex items-center gap-2.5 text-ink font-medium text-sm">
                <Zap className="h-4 w-4 text-seal shrink-0" />
                <h3>Jargon-Free Prompting</h3>
              </div>
              <p className="text-xs text-muted-ink leading-relaxed">
                Tuned strictly against hype. Rejects clichés like “I was thrilled to see this opening” in favor of concise, professional facts.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="border border-hairline bg-paper p-5 sm:p-6 rounded-sm space-y-3 shadow-2xs">
              <div className="flex items-center gap-2.5 text-ink font-medium text-sm">
                <CornerDownRight className="h-4 w-4 text-seal shrink-0" />
                <h3>One-Click Follow-Ups</h3>
              </div>
              <p className="text-xs text-muted-ink leading-relaxed">
                Over 50% of recruiter replies occur on the follow-up. Pro accounts generate polite, contextual follow-ups in the exact same Gmail thread.
              </p>
            </div>

            {/* Feature 6 (Spans 3 cols or wide bar) */}
            <div className="md:col-span-3 border border-hairline bg-[#FAF9F5] p-5 sm:p-6 rounded-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xs">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-ink font-medium text-sm">
                  <Lock className="h-4 w-4 text-seal shrink-0" />
                  <h3>AES-256-GCM Token Encryption At Rest</h3>
                </div>
                <p className="text-xs text-muted-ink leading-relaxed max-w-xl">
                  OAuth refresh tokens are encrypted at rest with cryptographic initialization vectors and authentication tags. Plaintext credentials are never written to disk.
                </p>
              </div>
              <Link
                href="/privacy"
                className="inline-flex items-center gap-1 text-xs text-seal font-medium hover:underline underline-offset-4 shrink-0"
              >
                <span>Read security disclosures</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 6. TRANSPARENT PRICING */}
      <section id="pricing" className="border-b border-hairline bg-[#FAF9F5] px-4 py-12 sm:px-6 sm:py-20 md:py-24">
        <div className="mx-auto max-w-4xl space-y-8 sm:space-y-12">
          <div className="text-center max-w-xl mx-auto space-y-2">
            <span className="text-[10px] sm:text-[11px] font-medium uppercase tracking-wider text-muted-ink">
              Pricing
            </span>
            <h2 className="font-heading text-2xl sm:text-3xl md:text-4xl text-ink">
              Start free. Upgrade when you&apos;re applying at volume.
            </h2>
            <p className="text-xs sm:text-sm text-muted-ink">
              Test with real applications before committing. Upgrade when you need higher capacity and one-click follow-ups.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 max-w-3xl mx-auto">
            {/* Free Tier */}
            <div className="border border-hairline bg-paper p-6 sm:p-8 rounded-sm flex flex-col justify-between space-y-6 shadow-2xs">
              <div className="space-y-4">
                <div className="flex items-baseline justify-between">
                  <h3 className="font-heading text-lg sm:text-xl text-ink">{FREE_PLAN.name}</h3>
                  <div className="text-right">
                    <span className="font-heading text-xl sm:text-2xl text-ink">{FREE_PLAN.priceFormatted}</span>
                    <span className="text-xs text-muted-ink"> {FREE_PLAN.periodText}</span>
                  </div>
                </div>
                <p className="text-xs text-muted-ink leading-relaxed">
                  {FREE_PLAN.description}
                </p>

                <div className="border-t border-hairline pt-4 space-y-2.5 text-xs text-ink/90">
                  {FREE_PLAN.features.map((feature, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <CheckCircle2 className="h-3.5 w-3.5 text-confirmed shrink-0" />
                      <span className={feature.isHighlight ? "font-medium" : ""}>{feature.text}</span>
                    </div>
                  ))}
                </div>
              </div>

              <Link
                href="/login?mode=signup"
                className="w-full text-center rounded-sm border border-hairline bg-[#EDEAE2] py-2.5 text-xs font-medium text-ink hover:bg-[#E4DFD3] transition-colors min-h-[42px] flex items-center justify-center cursor-pointer"
              >
                Get started free
              </Link>
            </div>

            {/* Pro Tier */}
            <div className="border-2 border-seal bg-paper p-6 sm:p-8 rounded-sm flex flex-col justify-between space-y-6 relative shadow-xs">
              {PRO_PLAN.badge && (
                <div className="absolute -top-3 right-4 sm:right-6 bg-seal text-paper text-[10px] font-medium tracking-wide uppercase px-2.5 py-0.5 rounded-sm shadow-2xs">
                  {PRO_PLAN.badge}
                </div>
              )}

              <div className="space-y-4">
                <div className="flex items-baseline justify-between">
                  <h3 className="font-heading text-lg sm:text-xl text-ink">{PRO_PLAN.name}</h3>
                  <div className="text-right">
                    <span className="font-heading text-xl sm:text-2xl text-ink">{PRO_PLAN.priceFormatted}</span>
                    <span className="text-xs text-muted-ink"> {PRO_PLAN.periodText}</span>
                  </div>
                </div>
                <p className="text-xs text-muted-ink leading-relaxed">
                  {PRO_PLAN.description}
                </p>

                <div className="border-t border-hairline pt-4 space-y-2.5 text-xs text-ink/90">
                  {PRO_PLAN.features.map((feature, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <CheckCircle2 className="h-3.5 w-3.5 text-confirmed shrink-0" />
                      <span className={feature.isHighlight ? "font-medium" : ""}>{feature.text}</span>
                    </div>
                  ))}
                  <div className="pt-1.5 text-[11px] text-muted-ink flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-confirmed shrink-0" />
                    <span>Supports UPI in India &amp; Cards / Apple Pay globally</span>
                  </div>
                </div>
              </div>

              <Link
                href="/settings"
                className="w-full text-center rounded-sm bg-seal py-2.5 text-xs font-medium text-paper hover:bg-seal/90 shadow-xs transition-all min-h-[42px] flex items-center justify-center cursor-pointer"
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
              Everything you need to know about Vina
            </h2>
          </div>

          <div className="border-t border-hairline divide-y divide-hairline">
            {faqs.map((faq, idx) => (
              <div key={idx} className="py-3.5 sm:py-4">
                <button
                  type="button"
                  onClick={() => toggleFaq(idx)}
                  className="flex w-full items-center justify-between text-left text-xs sm:text-sm font-medium text-ink hover:text-seal transition-colors gap-3 cursor-pointer py-1"
                >
                  <span>{faq.q}</span>
                  <ChevronDown
                    className={`h-4 w-4 text-muted-ink shrink-0 transition-transform duration-200 ${
                      openFaq === idx ? "rotate-180 text-seal" : ""
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

          {/* Direct Support Question Prompt */}
          <div className="border-t border-hairline pt-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-muted-ink">
            <span>Still have questions about how Vina works?</span>
            <Link href="/contact" className="text-seal underline underline-offset-4 hover:opacity-80 font-medium">
              Reach our support desk
            </Link>
          </div>
        </div>
      </section>

      {/* 8. CLOSING INVITATION CTA */}
      <section className="border-b border-hairline bg-[#FAF9F5] px-4 py-12 sm:px-6 sm:py-16 md:py-20 text-center">
        <div className="mx-auto max-w-2xl space-y-5 sm:space-y-6">
          <div className="inline-flex items-center justify-center h-10 w-10 rounded-full border border-hairline bg-paper text-seal shadow-2xs mx-auto">
            <Sparkles className="h-4 w-4" />
          </div>
          <h2 className="font-heading text-2xl sm:text-3xl md:text-4xl text-ink tracking-tight">
            Turn your next application into a letter worth sending.
          </h2>
          <p className="text-xs sm:text-sm text-muted-ink max-w-lg mx-auto leading-relaxed">
            Free accounts include 5 tailored sends every month. No credit card required to start.
          </p>
          <div className="pt-2 flex items-center justify-center">
            <Link
              href="/login?mode=signup"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-sm bg-seal px-7 py-3 text-xs sm:text-sm font-medium text-paper hover:bg-seal/90 shadow-xs transition-all min-h-[44px]"
            >
              <span>Get started free</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* 9. MODERN RESPONSIVE FOOTER */}
      <Footer />
    </main>
  );
}
