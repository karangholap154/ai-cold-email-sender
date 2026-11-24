import type { Metadata } from "next";
import Link from "next/link";
import { ShieldCheck, Users, Sliders, ArrowRight, Sparkles, CheckCircle2 } from "lucide-react";
import { Footer } from "@/components/footer";

export const metadata: Metadata = {
  title: "Free Cold Email & Outreach Tools for Job Seekers | Vina",
  description:
    "Free, unauthenticated outreach utilities: Spam Word & MX Deliverability Checker, Recruiter Email Permutator, and Subject Line Mobile Simulator.",
  alternates: {
    canonical: "https://www.meetvina.app/tools",
  },
  openGraph: {
    title: "Free Cold Email & Job Outreach Tools - Vina",
    description:
      "A collection of zero-friction, client-side tools to perfect cold outreach, avoid spam folders, and find recruiter emails.",
    url: "https://www.meetvina.app/tools",
    type: "website",
  },
};

const TOOLS = [
  {
    title: "Email Deliverability & Spam Word Checker",
    slug: "email-checker",
    badge: "Most Popular",
    description:
      "Scan your outreach email against 180+ spam phrases, check reading time, and test recipient domain DNS MX records in real-time.",
    icon: ShieldCheck,
  },
  {
    title: "Recruiter Email Permutator & Pattern Finder",
    slug: "email-permutator",
    badge: "Zero Auth",
    description:
      "Enter a contact name and company website to generate all 14 corporate email address patterns with 1-click Gmail BCC copying.",
    icon: Users,
  },
  {
    title: "Subject Line Tester & Mobile Simulator",
    slug: "subject-line-tester",
    badge: "High Open Rates",
    description:
      "Grade your subject line for character length, spam risk, casing, and preview the exact cutoff on iPhone and desktop Gmail.",
    icon: Sliders,
  },
];

export default function ToolsDirectoryPage() {
  return (
    <div className="min-h-screen bg-surface flex flex-col">
      <main className="flex-1 mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 sm:py-16">
        <div className="mb-10 text-center max-w-2xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-hairline bg-paper px-3 py-1 text-xs text-muted-ink shadow-2xs">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>100% Free • No Sign-up Required</span>
          </div>
          <h1 className="font-heading text-3xl sm:text-4xl font-semibold tracking-tight text-ink">
            Free Cold Email &amp; Outreach Utilities
          </h1>
          <p className="text-xs sm:text-sm text-muted-ink leading-relaxed">
            Fast, client-side tools designed to make personal outreach clean, professional, and deliverable without spam triggers.
          </p>
        </div>

        {/* Tools Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {TOOLS.map((tool) => {
            const Icon = tool.icon;
            return (
              <Link
                key={tool.slug}
                href={`/tools/${tool.slug}`}
                className="group relative flex flex-col justify-between rounded-xl border border-hairline bg-paper p-6 shadow-2xs hover:border-seal hover:shadow-xs transition-all"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="inline-flex items-center justify-center p-2.5 rounded-lg bg-surface text-seal group-hover:scale-105 transition-transform">
                      <Icon className="h-5 w-5" />
                    </div>
                    <span className="rounded-full border border-hairline bg-surface px-2.5 py-0.5 text-[10px] font-medium text-muted-ink">
                      {tool.badge}
                    </span>
                  </div>

                  <div className="space-y-2">
                    <h2 className="font-heading text-base font-semibold text-ink group-hover:text-seal transition-colors">
                      {tool.title}
                    </h2>
                    <p className="text-xs text-muted-ink leading-relaxed">
                      {tool.description}
                    </p>
                  </div>
                </div>

                <div className="mt-6 flex items-center gap-1.5 text-xs font-medium text-seal group-hover:translate-x-0.5 transition-transform">
                  <span>Launch Tool</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </div>
              </Link>
            );
          })}
        </div>

        {/* Cross Promotion Callout */}
        <div className="mt-16 rounded-xl border border-seal/30 bg-paper p-8 shadow-xs text-center max-w-2xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-seal">
            <Sparkles className="h-4 w-4" />
            <span>Automate With Vina</span>
          </div>
          <h2 className="font-heading text-xl sm:text-2xl font-semibold text-ink">
            Turn any job post into a letter worth sending
          </h2>
          <p className="text-xs sm:text-sm text-muted-ink leading-relaxed">
            Vina reads any job description, drafts an authentic personalized outreach letter grounded in your résumé, and sends directly via your personal Gmail with verified 1-to-1 RFC 2822 headers.
          </p>
          <div className="pt-2">
            <Link
              href="/signup"
              className="inline-flex items-center justify-center gap-2 rounded-md bg-seal px-6 py-3 text-xs font-semibold text-white hover:bg-seal/90 transition-colors shadow-2xs"
            >
              <span>Get Started Free (5 Letters/Month)</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
