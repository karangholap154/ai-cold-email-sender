import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  Mail,
  FileText,
  ShieldCheck,
  Zap,
  Lock,
  Sparkles,
  Check,
  Briefcase,
  ChevronRight,
  PenLine,
  SlidersHorizontal,
  History,
  FileCheck2,
  Building2,
  BadgeCheck,
  Search,
  ExternalLink,
  MapPin,
  Clock,
  Send,
  AlertCircle,
  HelpCircle,
  RefreshCw,
} from "lucide-react";
import { FREE_PLAN, PRO_PLAN } from "@/lib/constants/plans";
import { Footer } from "@/components/footer";
import { FaqAccordion } from "@/components/landing/faq-accordion";

export const metadata: Metadata = {
  title: "Vina — Turn a Job Description into a Letter Worth Sending",
  description:
    "A personal correspondence desk for thoughtful job seekers. Paste any job posting to draft concise, tailored letters with your PDF résumé attached, sent directly from your own Gmail.",
  alternates: {
    canonical: "https://www.meetvina.app",
  },
  openGraph: {
    title: "Vina — Turn a Job Description into a Letter Worth Sending",
    description:
      "Vina reads the job description, drafts a short, specific letter to go with your résumé, and hands it back to you to review before anything is sent.",
    url: "https://www.meetvina.app",
    type: "website",
  },
};

const faqs = [
  {
    q: "Does Vina send emails automatically without my review?",
    a: "Never. The fundamental principle of Vina is that every single outreach letter must be reviewed, edited, and approved by you in the Letter Frame before anything is dispatched. There are no automated bots or background queues sending mail on your behalf.",
  },
  {
    q: "How does Vina send from my personal Gmail?",
    a: "You connect your personal Google account or configure an App Password via Settings. Vina uses official Google SMTP / Gmail API to send the approved message directly under your personal identity. This guarantees your messages land in the primary inbox, completely bypassing mass marketing spam filters.",
  },
  {
    q: "Does Vina read or inspect my private inbox?",
    a: "No. Vina only requests the exact permissions needed to transmit your approved letters and to identify the thread ID of past outreach so Pro users can send polite follow-ups in the same email conversation. We never scrape, index, or read your incoming correspondence.",
  },
  {
    q: "How does my résumé attach to the letter?",
    a: "You upload your résumé PDF once in Settings. When you draft a letter, Vina reads your background and experience to ground the pitch in your actual accomplishments. When you click send, your PDF résumé is automatically attached via RFC 2822 MIME.",
  },
  {
    q: "What prevents duplicate outreach to the same recruiter?",
    a: "Vina maintains an active correspondence ledger. If you paste an HR email address that you've previously written to, the Draft desk displays an inline notice showing the exact date and role you previously discussed.",
  },
  {
    q: "Can I use Vina for free?",
    a: "Yes. Every account starts with 5 free letters each month, complete with résumé attachment, duplicate recruiter warnings, and full access to our curated jobs feed.",
  },
];

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      "@id": "https://www.meetvina.app/#website",
      "url": "https://www.meetvina.app",
      "name": "Vina",
      "description": "Turn a job description into a letter worth sending.",
      "publisher": {
        "@type": "Organization",
        "@id": "https://www.meetvina.app/#organization",
      },
    },
    {
      "@type": "Organization",
      "@id": "https://www.meetvina.app/#organization",
      "name": "Vina",
      "url": "https://www.meetvina.app",
      "logo": "https://www.meetvina.app/logo.png",
      "sameAs": ["https://github.com/karangholap154/ai-cold-email-sender"],
    },
    {
      "@type": "SoftwareApplication",
      "@id": "https://www.meetvina.app/#software",
      "name": "Vina",
      "applicationCategory": "BusinessApplication",
      "operatingSystem": "All",
      "url": "https://www.meetvina.app",
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
      "@type": "HowTo",
      "@id": "https://www.meetvina.app/#howto",
      "name": "How to draft and send a tailored job application letter with Vina",
      "description":
        "A 3-step process to generate a concise, tailored outreach email from a job posting, attach your résumé, and dispatch it via your personal Gmail.",
      "totalTime": "PT2M",
      "step": [
        {
          "@type": "HowToStep",
          "position": 1,
          "name": "Paste the job description",
          "text": "Paste any job posting or select an open engineering role from the live feed.",
          "url": "https://www.meetvina.app/#how-it-works",
        },
        {
          "@type": "HowToStep",
          "position": 2,
          "name": "Review the tailored draft",
          "text": "Inspect the generated letter in the Letter Frame. Adjust wording, verify role details, and sign off in your voice.",
          "url": "https://www.meetvina.app/#how-it-works",
        },
        {
          "@type": "HowToStep",
          "position": 3,
          "name": "Send from your Gmail with résumé attached",
          "text": "One click sends the letter directly from your authentic Gmail account with your résumé PDF attached.",
          "url": "https://www.meetvina.app/#how-it-works",
        },
      ],
    },
    {
      "@type": "FAQPage",
      "@id": "https://www.meetvina.app/#faq",
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

export default function LandingPage() {
  return (
    <main className="flex flex-1 flex-col bg-paper text-ink selection:bg-[#E4DFD3] overflow-x-hidden">
      {/* Schema.org Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* ─────────────────────────────────────────────────────────────
          1. EDITORIAL MASTHEAD & HERO
          Fully fluid on 320px mobile up to ultra-wide 4K
          ───────────────────────────────────────────────────────────── */}
      <section className="relative border-b border-hairline px-4 pt-8 pb-14 sm:px-6 sm:pt-16 sm:pb-20 lg:pt-20 lg:pb-24">
        <div className="mx-auto max-w-5xl">
          {/* Top metadata strip */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b border-hairline/80 pb-3.5 mb-6 sm:mb-8 text-xs font-mono text-muted-ink">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-confirmed animate-pulse shrink-0" />
              <span className="uppercase tracking-widest text-[10px] sm:text-[11px] font-medium text-ink">
                Vina Desk • Personal Correspondence
              </span>
            </div>
            <div className="flex items-center gap-2 sm:gap-4 text-[11px] sm:text-xs">
              <span className="hidden md:inline">RFC 2822 Deliverability</span>
              <span className="hidden md:inline text-hairline">|</span>
              <Link
                href="/jobs"
                className="text-seal hover:underline inline-flex items-center gap-1 font-sans font-medium"
              >
                <span>Live Feed (1,000+ Verified Leads)</span>
                <span aria-hidden="true">→</span>
              </Link>
            </div>
          </div>

          {/* Hero Core Copy */}
          <div className="space-y-4 sm:space-y-6 max-w-3xl">
            <h1 className="font-heading text-3xl sm:text-5xl md:text-6xl lg:text-7xl text-ink font-normal tracking-tight leading-[1.12] sm:leading-[1.08] break-words">
              Turn a job description into a letter worth sending.
            </h1>
            <p className="text-sm sm:text-lg md:text-xl text-muted-ink leading-relaxed font-sans max-w-2xl">
              Paste the job post. Vina drafts a short, specific letter to go with your résumé, and hands it back to you to review before anything is sent. It&apos;s built for people applying to real roles at real companies &mdash; not for blasting the same message to a hundred inboxes.
            </p>
          </div>

          {/* Primary CTA and Authentication Guarantees */}
          <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3.5 pt-1">
            <Link
              href="/login?mode=signup"
              className="inline-flex items-center justify-center gap-2.5 rounded-sm bg-seal px-6 sm:px-8 py-3 text-xs sm:text-sm font-medium text-paper hover:bg-seal/90 shadow-2xs transition-all min-h-[44px] sm:min-h-[48px] cursor-pointer"
            >
              <span>Get started free</span>
              <ArrowRight className="h-4 w-4" />
            </Link>

            <Link
              href="/draft"
              className="inline-flex items-center justify-center gap-2 rounded-sm border border-hairline bg-white hover:bg-[#FAF9F5] px-5 sm:px-6 py-3 text-xs sm:text-sm font-medium text-ink transition-colors min-h-[44px] sm:min-h-[48px] shadow-2xs"
            >
              <PenLine className="h-4 w-4 text-seal" />
              <span>Try drafting a letter</span>
            </Link>

            <Link
              href="/jobs"
              className="inline-flex items-center justify-center gap-2 rounded-sm border border-hairline/80 bg-paper hover:bg-white px-4 sm:px-5 py-3 text-xs font-medium text-muted-ink hover:text-ink transition-colors min-h-[44px] sm:min-h-[48px]"
            >
              <Briefcase className="h-3.5 w-3.5" />
              <span>Browse jobs feed</span>
            </Link>
          </div>

          {/* Core Product Trust Tenets */}
          <div className="mt-10 sm:mt-12 pt-6 border-t border-hairline grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 text-xs text-muted-ink">
            <div className="flex items-start gap-2.5">
              <Check className="h-4 w-4 text-confirmed shrink-0 mt-0.5" />
              <div>
                <strong className="text-ink font-medium block">Sent from your own Gmail</strong>
                <span className="leading-relaxed">Preserves your authentic sender reputation and reaches the primary inbox.</span>
              </div>
            </div>
            <div className="flex items-start gap-2.5">
              <Check className="h-4 w-4 text-confirmed shrink-0 mt-0.5" />
              <div>
                <strong className="text-ink font-medium block">Résumé attached automatically</strong>
                <span className="leading-relaxed">Upload your PDF once; Vina attaches it to every approved letter.</span>
              </div>
            </div>
            <div className="flex items-start gap-2.5 sm:col-span-2 lg:col-span-1">
              <Check className="h-4 w-4 text-confirmed shrink-0 mt-0.5" />
              <div>
                <strong className="text-ink font-medium block">Duplicate recruiter warning</strong>
                <span className="leading-relaxed">Never accidentally reach out to the same contact twice.</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          2. ANATOMY OF A LETTER (Realistic Letter Frame Demonstration)
          Graceful responsive downscaling for mobile letter reading
          ───────────────────────────────────────────────────────────── */}
      <section className="border-b border-hairline bg-[#FAF9F5] px-4 py-10 sm:px-6 sm:py-16 lg:py-20">
        <div className="mx-auto max-w-5xl space-y-6 sm:space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 sm:gap-4">
            <div className="space-y-1">
              <span className="text-[10px] sm:text-[11px] font-mono uppercase tracking-widest text-muted-ink">
                In-Product Demonstration
              </span>
              <h2 className="font-heading text-2xl sm:text-3xl md:text-4xl text-ink font-normal tracking-tight">
                The Letter Frame
              </h2>
              <p className="text-xs sm:text-sm text-muted-ink max-w-xl leading-relaxed">
                Designed to slow you down at the single moment that matters: before sending. You inspect extracted role context, hone the phrasing, and dispatch with genuine confidence.
              </p>
            </div>
            <div className="flex items-center gap-2 self-start sm:self-auto text-xs font-mono text-muted-ink">
              <span className="rounded-xs border border-hairline bg-white px-2.5 py-1">
                Linear • Staff Frontend
              </span>
            </div>
          </div>

          {/* The Physical Letter Sheet */}
          <div className="rounded-sm border border-hairline bg-paper p-4 sm:p-7 md:p-10 shadow-[0_4px_30px_rgba(0,0,0,0.04)] space-y-5 sm:space-y-6 relative overflow-hidden">
            {/* Top Postmark Strip */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-hairline pb-3.5 sm:pb-4 text-xs">
              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                <span className="font-mono text-[10px] sm:text-[11px] text-muted-ink uppercase">TO:</span>
                <span className="font-mono text-ink font-medium bg-white px-2 py-0.5 rounded-xs border border-hairline text-xs break-all">
                  tuomas@linear.app
                </span>
                <span className="text-muted-ink hidden sm:inline">&bull;</span>
                <span className="text-muted-ink text-[11px] sm:text-xs">Recruiter &amp; Engineering Lead</span>
              </div>
              <div className="self-start sm:self-auto border border-dashed border-hairline bg-white/60 px-2 py-0.5 text-[9px] font-mono uppercase tracking-widest text-muted-ink">
                GMAIL OAUTH &bull; VERIFIED SENDER
              </div>
            </div>

            {/* Extracted Role & Skills Banner */}
            <div className="rounded-xs border border-hairline bg-white/80 p-3 sm:p-3.5 flex flex-col md:flex-row md:items-center justify-between gap-2.5 sm:gap-3 text-xs">
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-seal shrink-0" />
                <span className="font-medium text-ink">Applying to:</span>
                <span className="text-ink">Staff Frontend Engineer at Linear</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                <span className="px-2 py-0.5 rounded-xs bg-paper border border-hairline text-[10px] font-mono text-muted-ink">
                  Canvas &amp; WebGL
                </span>
                <span className="px-2 py-0.5 rounded-xs bg-paper border border-hairline text-[10px] font-mono text-muted-ink">
                  Keyboard Workflows
                </span>
                <span className="px-2 py-0.5 rounded-xs bg-paper border border-hairline text-[10px] font-mono text-muted-ink">
                  Sub-50ms Latency
                </span>
              </div>
            </div>

            {/* Subject Line Field */}
            <div className="space-y-1 border-b border-hairline pb-3 sm:pb-4">
              <label className="text-[10px] font-mono uppercase text-muted-ink">Subject Line</label>
              <div className="font-heading text-sm sm:text-base md:text-lg text-ink font-medium leading-snug break-words">
                Linear Staff Frontend Engineer &mdash; background in high-performance canvas systems
              </div>
            </div>

            {/* Letter Body */}
            <div className="space-y-3 sm:space-y-4 text-xs sm:text-sm text-ink leading-relaxed max-w-3xl font-sans">
              <p>Hi Tuomas,</p>
              <p>
                I saw Linear&apos;s opening for a Staff Frontend Engineer focused on scaling canvas views and keyboard-driven workflows. Given your team&apos;s emphasis on sub-50ms interaction latency, I wanted to reach out directly.
              </p>
              <p>
                Over the past four years leading design system architecture at my previous company, I rebuilt our core grid primitives and virtualized tree tables, reducing bundle size by 42% and sustaining consistent 60fps frame rates across 50,000+ simultaneous nodes.
              </p>
              <p>
                I&apos;ve attached my résumé with breakdown metrics. If you&apos;re open to a brief 10-minute introductory conversation this week, I&apos;d welcome the chance to share notes on how we eliminated similar rendering bottlenecks.
              </p>
              <div className="pt-2 space-y-0.5">
                <p>Best regards,</p>
                <p className="font-medium text-ink">Alex Chen</p>
                <p className="text-muted-ink text-[11px] sm:text-xs font-mono break-words">alexchen.dev &bull; github.com/alexchen &bull; (415) 890-2341</p>
              </div>
            </div>

            {/* Letter Bottom Toolbar */}
            <div className="border-t border-hairline pt-3 sm:pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs">
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 text-muted-ink">
                <FileText className="h-4 w-4 text-seal shrink-0" />
                <span className="font-medium text-ink break-all">alex-chen-resume-2026.pdf</span>
                <span className="text-[10px] sm:text-[11px] font-mono text-confirmed">(Attached via Storage)</span>
              </div>
              <div className="flex items-center gap-2 self-start sm:self-auto text-[11px]">
                <span className="text-muted-ink">114 words</span>
                <span className="text-hairline">|</span>
                <span className="text-confirmed font-medium flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  Ready to send
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          3. HOW IT WORKS (The 3-Step Sequence Aligned with BRANDING.md)
          Responsive 1-col on mobile -> 3-col on desktop
          ───────────────────────────────────────────────────────────── */}
      <section id="how-it-works" className="border-b border-hairline px-4 py-10 sm:px-6 sm:py-16 lg:py-20">
        <div className="mx-auto max-w-5xl space-y-8 sm:space-y-12">
          <div className="space-y-1.5">
            <span className="text-[10px] sm:text-[11px] font-mono uppercase tracking-widest text-muted-ink">
              The Correspondence Process
            </span>
            <h2 className="font-heading text-2xl sm:text-3xl md:text-4xl text-ink font-normal tracking-tight">
              Three steps from job posting to the recruiter&apos;s primary inbox.
            </h2>
            <p className="text-xs sm:text-sm text-muted-ink max-w-2xl leading-relaxed">
              Vina turns cold emailing into an intentional, dignified workflow. No blind queues, no mass-scraping, no generic fill-in-the-blank templates.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6 lg:gap-8">
            {/* Step 1 */}
            <div className="rounded-sm border border-hairline bg-white p-5 sm:p-6 lg:p-7 space-y-4 shadow-2xs hover:border-ink/20 transition-all flex flex-col justify-between">
              <div className="space-y-2.5 sm:space-y-3">
                <div className="flex items-center justify-between border-b border-hairline pb-2.5 sm:pb-3">
                  <span className="font-mono text-xs font-semibold text-seal">01</span>
                  <span className="font-mono text-[10px] text-muted-ink uppercase">Input</span>
                </div>
                <h3 className="font-heading text-base sm:text-lg text-ink font-medium">
                  Paste the job description.
                </h3>
                <p className="text-xs text-muted-ink leading-relaxed">
                  Paste any job post from LinkedIn, Greenhouse, or Lever &mdash; or pick one from our live feed of 1,000+ verified engineering roles. Vina reads it and picks out the role, the company, and what actually matters.
                </p>
              </div>
              <div className="pt-3 border-t border-hairline/60 font-mono text-[10px] sm:text-[11px] text-muted-ink flex items-center gap-1.5">
                <Building2 className="h-3.5 w-3.5 text-seal shrink-0" />
                <span>Extracts company, role &amp; skills</span>
              </div>
            </div>

            {/* Step 2 */}
            <div className="rounded-sm border border-hairline bg-white p-5 sm:p-6 lg:p-7 space-y-4 shadow-2xs hover:border-ink/20 transition-all flex flex-col justify-between">
              <div className="space-y-2.5 sm:space-y-3">
                <div className="flex items-center justify-between border-b border-hairline pb-2.5 sm:pb-3">
                  <span className="font-mono text-xs font-semibold text-seal">02</span>
                  <span className="font-mono text-[10px] text-muted-ink uppercase">Review</span>
                </div>
                <h3 className="font-heading text-base sm:text-lg text-ink font-medium">
                  Review the tailored draft.
                </h3>
                <p className="text-xs text-muted-ink leading-relaxed">
                  A short, specific letter appears in the Letter Frame &mdash; editable, not a template with blanks filled in. It draws on your uploaded background, highlights relevant technical wins, and stays concise (under 125 words).
                </p>
              </div>
              <div className="pt-3 border-t border-hairline/60 font-mono text-[10px] sm:text-[11px] text-muted-ink flex items-center gap-1.5">
                <PenLine className="h-3.5 w-3.5 text-seal shrink-0" />
                <span>Zero buzzwords &bull; In your voice</span>
              </div>
            </div>

            {/* Step 3 */}
            <div className="rounded-sm border border-hairline bg-white p-5 sm:p-6 lg:p-7 space-y-4 shadow-2xs hover:border-ink/20 transition-all flex flex-col justify-between">
              <div className="space-y-2.5 sm:space-y-3">
                <div className="flex items-center justify-between border-b border-hairline pb-2.5 sm:pb-3">
                  <span className="font-mono text-xs font-semibold text-seal">03</span>
                  <span className="font-mono text-[10px] text-muted-ink uppercase">Dispatch</span>
                </div>
                <h3 className="font-heading text-base sm:text-lg text-ink font-medium">
                  Send it yourself.
                </h3>
                <p className="text-xs text-muted-ink leading-relaxed">
                  One deliberate click sends it from your own Gmail, with your résumé attached. Nothing goes out without you seeing it first. Every outreach is saved to your ledger to prevent duplicate emails.
                </p>
              </div>
              <div className="pt-3 border-t border-hairline/60 font-mono text-[10px] sm:text-[11px] text-confirmed flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                <span>Delivered via Google SMTP</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          4. THE LIVE JOBS FEED SHOWCASE
          Card grid adapting cleanly on phones and widescreen
          ───────────────────────────────────────────────────────────── */}
      <section className="border-b border-hairline bg-[#FAF9F5] px-4 py-10 sm:px-6 sm:py-16 lg:py-20">
        <div className="mx-auto max-w-5xl space-y-6 sm:space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 sm:gap-4">
            <div className="space-y-1">
              <span className="text-[10px] sm:text-[11px] font-mono uppercase tracking-widest text-muted-ink">
                Verified Leads Network
              </span>
              <h2 className="font-heading text-2xl sm:text-3xl md:text-4xl text-ink font-normal tracking-tight">
                Don&apos;t have a job posting? Browse our verified feed.
              </h2>
              <p className="text-xs sm:text-sm text-muted-ink max-w-xl leading-relaxed">
                Vina indexes over 1,000 active opportunities daily across Hacker News Who is Hiring, Arbeitnow, and Remotive &mdash; with direct engineering manager contact emails extracted automatically.
              </p>
            </div>
            <Link
              href="/jobs"
              className="inline-flex items-center gap-2 rounded-sm border border-hairline bg-white hover:bg-paper px-3.5 sm:px-4 py-2 sm:py-2.5 text-xs font-medium text-ink transition-colors shadow-2xs shrink-0 self-start sm:self-auto"
            >
              <Briefcase className="h-3.5 w-3.5 text-seal" />
              <span>Explore full 1,000+ jobs feed</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {/* Sample Real Job Feed Rows */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Card 1 */}
            <div className="rounded-sm border border-hairline bg-white p-4 sm:p-5 space-y-3 shadow-2xs hover:border-seal/40 transition-all flex flex-col justify-between">
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="font-heading text-base font-medium text-ink">Modal Labs</span>
                    <div className="text-xs font-medium text-ink/90">Systems &amp; Container Infrastructure</div>
                  </div>
                  <span className="rounded-xs border border-hairline bg-paper px-2 py-0.5 font-mono text-[10px] text-muted-ink shrink-0">
                    Hacker News
                  </span>
                </div>
                <p className="text-xs text-muted-ink line-clamp-2 leading-relaxed">
                  Building serverless container infrastructure with sub-800ms boot times for GPU and AI inference workloads. Deep Linux cgroups and Rust experience required.
                </p>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  <span className="rounded-xs border border-hairline bg-[#FAF9F5] px-2 py-0.5 text-[10px] font-mono text-muted-ink">Rust</span>
                  <span className="rounded-xs border border-hairline bg-[#FAF9F5] px-2 py-0.5 text-[10px] font-mono text-muted-ink">eBPF</span>
                  <span className="rounded-xs border border-hairline bg-[#FAF9F5] px-2 py-0.5 text-[10px] font-mono text-muted-ink">Linux Containers</span>
                </div>
              </div>
              <div className="pt-3 border-t border-hairline/70 flex flex-wrap items-center justify-between gap-2 text-xs">
                <span className="font-mono text-[10px] sm:text-[11px] text-confirmed flex items-center gap-1">
                  <BadgeCheck className="h-3.5 w-3.5 shrink-0" />
                  erik@modal.com
                </span>
                <Link
                  href="/jobs"
                  className="text-seal hover:underline font-medium inline-flex items-center gap-1 text-[11px]"
                >
                  <span>Draft letter for this role</span>
                  <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            </div>

            {/* Card 2 */}
            <div className="rounded-sm border border-hairline bg-white p-4 sm:p-5 space-y-3 shadow-2xs hover:border-seal/40 transition-all flex flex-col justify-between">
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="font-heading text-base font-medium text-ink">Stripe</span>
                    <div className="text-xs font-medium text-ink/90">Senior Distributed Systems Engineer</div>
                  </div>
                  <span className="rounded-xs border border-hairline bg-paper px-2 py-0.5 font-mono text-[10px] text-muted-ink shrink-0">
                    Arbeitnow
                  </span>
                </div>
                <p className="text-xs text-muted-ink line-clamp-2 leading-relaxed">
                  Help scale our global ledger infrastructure processing over $1T annually. Strong background in idempotent state machines and distributed consensus.
                </p>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  <span className="rounded-xs border border-hairline bg-[#FAF9F5] px-2 py-0.5 text-[10px] font-mono text-muted-ink">Go</span>
                  <span className="rounded-xs border border-hairline bg-[#FAF9F5] px-2 py-0.5 text-[10px] font-mono text-muted-ink">Raft Consensus</span>
                  <span className="rounded-xs border border-hairline bg-[#FAF9F5] px-2 py-0.5 text-[10px] font-mono text-muted-ink">PostgreSQL</span>
                </div>
              </div>
              <div className="pt-3 border-t border-hairline/70 flex flex-wrap items-center justify-between gap-2 text-xs">
                <span className="font-mono text-[10px] sm:text-[11px] text-confirmed flex items-center gap-1">
                  <BadgeCheck className="h-3.5 w-3.5 shrink-0" />
                  eng-hiring@stripe.com
                </span>
                <Link
                  href="/jobs"
                  className="text-seal hover:underline font-medium inline-flex items-center gap-1 text-[11px]"
                >
                  <span>Draft letter for this role</span>
                  <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          5. THE PHILOSOPHY: Mass Email Scrapers vs. The Vina Letter
          Side-by-side on desktop, stacked on mobile
          ───────────────────────────────────────────────────────────── */}
      <section className="border-b border-hairline px-4 py-10 sm:px-6 sm:py-16 lg:py-20">
        <div className="mx-auto max-w-5xl space-y-8 sm:space-y-10">
          <div className="space-y-1.5">
            <span className="text-[10px] sm:text-[11px] font-mono uppercase tracking-widest text-muted-ink">
              The Philosophy
            </span>
            <h2 className="font-heading text-2xl sm:text-3xl md:text-4xl text-ink font-normal tracking-tight">
              Why mass email scrapers fail &mdash; and why tailored letters work.
            </h2>
            <p className="text-xs sm:text-sm text-muted-ink max-w-2xl leading-relaxed">
              Recruiters and engineering directors receive dozens of automated template emails every morning. They can spot a bot in three seconds. Here is how Vina approaches outreach differently.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6 lg:gap-8">
            {/* The Old Automated Bot Way */}
            <div className="rounded-sm border border-hairline bg-[#FAF9F5] p-5 sm:p-7 lg:p-8 space-y-4 shadow-2xs">
              <div className="font-mono text-xs font-semibold text-muted-ink uppercase tracking-wider border-b border-hairline pb-3 flex items-center justify-between">
                <span>Mass Scrapers</span>
                <span className="text-amber-800 text-[11px]">Burns Reputation</span>
              </div>
              <ul className="space-y-3 text-xs text-muted-ink leading-relaxed">
                <li className="flex items-start gap-2.5">
                  <span className="text-amber-800 font-bold shrink-0">&times;</span>
                  <span><strong>Shared marketing IP servers:</strong> Dispatches from third-party server farms that email filters automatically route into Spam or Promotions.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-amber-800 font-bold shrink-0">&times;</span>
                  <span><strong>Obvious boilerplate tokens:</strong> Mail-merged templates like &ldquo;I admire your work at [Company]&rdquo; that recruiters flag and delete instantly.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-amber-800 font-bold shrink-0">&times;</span>
                  <span><strong>No review or oversight:</strong> Fluffy claims and hallucinated skills sent autonomously under your name without you seeing the text.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-amber-800 font-bold shrink-0">&times;</span>
                  <span><strong>Accidental duplicate outreach:</strong> Blasts 3 different engineers at the same startup with the same template on the same day.</span>
                </li>
              </ul>
            </div>

            {/* The Vina Standard */}
            <div className="rounded-sm border-2 border-seal bg-white p-5 sm:p-7 lg:p-8 space-y-4 shadow-sm relative">
              <div className="font-mono text-xs font-semibold text-confirmed uppercase tracking-wider border-b border-hairline pb-3 flex items-center justify-between">
                <span>The Vina Standard</span>
                <span className="text-confirmed font-bold text-[11px]">Dignified Outreach</span>
              </div>
              <ul className="space-y-3 text-xs text-muted-ink leading-relaxed">
                <li className="flex items-start gap-2.5">
                  <Check className="h-4 w-4 text-confirmed shrink-0 mt-0.5" />
                  <span><strong>Authentic Google SMTP delivery:</strong> Sent directly through your own @gmail.com account straight into the recipient&apos;s primary inbox.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check className="h-4 w-4 text-confirmed shrink-0 mt-0.5" />
                  <span><strong>Problem-specific pitch:</strong> Reads the exact technical challenges mentioned in the JD and connects them directly to your actual achievements.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check className="h-4 w-4 text-confirmed shrink-0 mt-0.5" />
                  <span><strong>Deliberate Letter Frame review:</strong> Full control to refine wording, tone, and signature before anything leaves your mailbox.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check className="h-4 w-4 text-confirmed shrink-0 mt-0.5" />
                  <span><strong>Correspondence ledger protection:</strong> Real-time lookup detects if you&apos;ve reached out to this recruiter before and shows previous send dates.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          6. SECURITY, OAUTH, & PRIVACY TENETS
          Card grid wrapping neatly on small mobile screens
          ───────────────────────────────────────────────────────────── */}
      <section className="border-b border-hairline bg-[#FAF9F5] px-4 py-10 sm:px-6 sm:py-16">
        <div className="mx-auto max-w-5xl rounded-sm border border-hairline bg-white p-5 sm:p-7 lg:p-8 space-y-6 shadow-2xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-hairline pb-4">
            <div className="space-y-1">
              <h3 className="font-heading text-lg sm:text-xl text-ink font-medium flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-seal shrink-0" />
                <span>Our Privacy &amp; Deliverability Pledge</span>
              </h3>
              <p className="text-xs text-muted-ink">
                We believe job correspondence requires strict technical restraint.
              </p>
            </div>
            <Link
              href="/privacy"
              className="text-xs font-mono text-seal hover:underline inline-flex items-center gap-1 self-start sm:self-auto"
            >
              <span>Read complete privacy policy</span>
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6 text-xs text-muted-ink">
            <div className="space-y-1.5">
              <span className="font-mono text-[10px] sm:text-[11px] text-ink font-semibold uppercase block">
                No Autonomous Sending
              </span>
              <p className="leading-relaxed">
                Vina only ever sends messages that you explicitly review and approve. Nothing is sent on a timer, in the background, or without your manual click.
              </p>
            </div>
            <div className="space-y-1.5">
              <span className="font-mono text-[10px] sm:text-[11px] text-ink font-semibold uppercase block">
                We Never Read Your Inbox
              </span>
              <p className="leading-relaxed">
                We request minimal Gmail permissions solely to transmit your approved letters and detect thread IDs for replies. We never read or store incoming private mail.
              </p>
            </div>
            <div className="space-y-1.5 sm:col-span-2 lg:col-span-1">
              <span className="font-mono text-[10px] sm:text-[11px] text-ink font-semibold uppercase block">
                Zero AI Training on Your Résumé
              </span>
              <p className="leading-relaxed">
                Your résumé PDF and correspondence history are private to your user account and are strictly never used to train public machine learning models.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          7. PRICING DESK: Honest, Simple, Transparent
          Free Tier (5 letters/mo) & Pro ($9/mo)
          ───────────────────────────────────────────────────────────── */}
      <section id="pricing" className="border-b border-hairline px-4 py-10 sm:px-6 sm:py-16 lg:py-20">
        <div className="mx-auto max-w-4xl space-y-8 sm:space-y-10">
          <div className="text-center max-w-xl mx-auto space-y-1.5 sm:space-y-2">
            <span className="text-[10px] sm:text-[11px] font-mono uppercase tracking-widest text-muted-ink">
              Transparent Membership
            </span>
            <h2 className="font-heading text-2xl sm:text-3xl md:text-4xl text-ink font-normal tracking-tight">
              Start free. Upgrade when you&apos;re applying at scale.
            </h2>
            <p className="text-xs sm:text-sm text-muted-ink leading-relaxed">
              Experience the quality of Vina with real job applications before spending anything.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6 lg:gap-8 max-w-3xl mx-auto">
            {/* Free Tier Card */}
            <div className="rounded-sm border border-hairline bg-white p-5 sm:p-7 lg:p-8 flex flex-col justify-between space-y-6 shadow-2xs">
              <div className="space-y-4">
                <div className="flex items-baseline justify-between border-b border-hairline pb-4">
                  <div>
                    <h3 className="font-heading text-xl text-ink font-medium">{FREE_PLAN.name}</h3>
                    <span className="text-[10px] sm:text-[11px] font-mono text-muted-ink">For casual job seekers</span>
                  </div>
                  <div className="text-right">
                    <span className="font-heading text-2xl sm:text-3xl text-ink font-medium">{FREE_PLAN.priceFormatted}</span>
                    <span className="text-xs text-muted-ink"> {FREE_PLAN.periodText}</span>
                  </div>
                </div>

                <p className="text-xs text-muted-ink leading-relaxed">
                  {FREE_PLAN.description}
                </p>

                <div className="space-y-2.5 text-xs text-ink/90 pt-1 sm:pt-2">
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
                className="w-full text-center rounded-sm border border-hairline bg-paper py-2.5 sm:py-3 text-xs font-medium text-ink hover:bg-[#EDEAE2] transition-colors min-h-[44px] flex items-center justify-center cursor-pointer shadow-2xs"
              >
                Get started free
              </Link>
            </div>

            {/* Pro Tier Card */}
            <div className="rounded-sm border-2 border-seal bg-white p-5 sm:p-7 lg:p-8 flex flex-col justify-between space-y-6 relative shadow-xs">
              {PRO_PLAN.badge && (
                <div className="absolute -top-3 right-4 sm:right-6 bg-seal text-paper text-[9px] sm:text-[10px] font-mono font-semibold tracking-wider uppercase px-2 py-0.5 rounded-xs shadow-2xs">
                  {PRO_PLAN.badge}
                </div>
              )}

              <div className="space-y-4">
                <div className="flex items-baseline justify-between border-b border-hairline pb-4">
                  <div>
                    <h3 className="font-heading text-xl text-ink font-medium">{PRO_PLAN.name}</h3>
                    <span className="text-[10px] sm:text-[11px] font-mono text-seal font-medium">For active job hunters</span>
                  </div>
                  <div className="text-right">
                    <span className="font-heading text-2xl sm:text-3xl text-ink font-medium">{PRO_PLAN.priceFormatted}</span>
                    <span className="text-xs text-muted-ink"> {PRO_PLAN.periodText}</span>
                  </div>
                </div>

                <p className="text-xs text-muted-ink leading-relaxed">
                  {PRO_PLAN.description}
                </p>

                <div className="space-y-2.5 text-xs text-ink/90 pt-1 sm:pt-2">
                  {PRO_PLAN.features.map((feature, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <CheckCircle2 className="h-3.5 w-3.5 text-confirmed shrink-0" />
                      <span className={feature.isHighlight ? "font-medium" : ""}>{feature.text}</span>
                    </div>
                  ))}
                  <div className="pt-2 text-[10px] sm:text-[11px] text-muted-ink flex items-center gap-1.5 border-t border-hairline">
                    <span className="h-1.5 w-1.5 rounded-full bg-confirmed shrink-0" />
                    <span>Supports UPI in India &bull; Cards &amp; Apple Pay globally</span>
                  </div>
                </div>
              </div>

              <Link
                href="/settings?tab=billing"
                className="w-full text-center rounded-sm bg-seal py-2.5 sm:py-3 text-xs font-medium text-paper hover:bg-seal/90 shadow-2xs transition-all min-h-[44px] flex items-center justify-center cursor-pointer"
              >
                Upgrade to Pro
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          8. FREQUENTLY ASKED QUESTIONS
          Responsive accordion layout
          ───────────────────────────────────────────────────────────── */}
      <section id="faq" className="border-b border-hairline bg-[#FAF9F5] px-4 py-10 sm:px-6 sm:py-16 lg:py-20">
        <div className="mx-auto max-w-3xl space-y-6 sm:space-y-8">
          <div className="space-y-1.5">
            <span className="text-[10px] sm:text-[11px] font-mono uppercase tracking-widest text-muted-ink">
              Questions &amp; Details
            </span>
            <h2 className="font-heading text-2xl sm:text-3xl md:text-4xl text-ink font-normal tracking-tight">
              Everything you need to know about Vina.
            </h2>
          </div>

          <FaqAccordion faqs={faqs} />

          {/* Direct Support Desk Link */}
          <div className="border-t border-hairline pt-5 sm:pt-6 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs text-muted-ink">
            <span>Need help configuring Gmail or have custom feedback?</span>
            <Link href="/contact" className="text-seal underline underline-offset-4 hover:opacity-80 font-medium">
              Write to our support desk
            </Link>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          9. FINAL INVITATION
          Calm, dignified closing invitation
          ───────────────────────────────────────────────────────────── */}
      <section className="border-b border-hairline px-4 py-12 sm:px-6 sm:py-20 lg:py-24 text-center">
        <div className="mx-auto max-w-2xl space-y-4 sm:space-y-6">
          <div className="inline-flex items-center justify-center h-9 w-9 sm:h-10 sm:w-10 rounded-full border border-hairline bg-white text-seal shadow-2xs mx-auto">
            <Sparkles className="h-4 w-4" />
          </div>
          <h2 className="font-heading text-2xl sm:text-4xl md:text-5xl text-ink font-normal tracking-tight break-words">
            Turn your next application into a letter worth sending.
          </h2>
          <p className="text-xs sm:text-base text-muted-ink max-w-lg mx-auto leading-relaxed">
            Free accounts include 5 tailored letters each month with automatic résumé attachment and duplicate recruiter detection.
          </p>
          <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-2.5 sm:gap-3">
            <Link
              href="/login?mode=signup"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-sm bg-seal px-6 sm:px-8 py-3 sm:py-3.5 text-xs sm:text-sm font-medium text-paper hover:bg-seal/90 shadow-2xs transition-all min-h-[44px] sm:min-h-[48px] cursor-pointer"
            >
              <span>Get started free</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/jobs"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-sm border border-hairline bg-white hover:bg-paper px-5 sm:px-6 py-3 sm:py-3.5 text-xs sm:text-sm font-medium text-ink transition-colors min-h-[44px] sm:min-h-[48px] shadow-2xs"
            >
              <Briefcase className="h-4 w-4 text-seal" />
              <span>Browse 1,000+ jobs feed</span>
            </Link>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          10. FOOTER
          ───────────────────────────────────────────────────────────── */}
      <Footer />
    </main>
  );
}
