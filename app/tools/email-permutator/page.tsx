import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Users, Mail, Sparkles } from "lucide-react";
import { EmailPermutatorTool } from "@/components/tools/email-permutator-tool";
import { Footer } from "@/components/footer";

export const metadata: Metadata = {
  title: "Free Email Permutator & Recruiter Address Finder | Vina",
  description:
    "Generate all standard corporate email address variations for hiring managers and recruiters from a name and company domain. 100% free with 1-click Gmail BCC copying.",
  alternates: {
    canonical: "https://www.meetvina.app/tools/email-permutator",
  },
  openGraph: {
    title: "Free Recruiter Email Permutator & Pattern Finder",
    description:
      "Guess any recruiter or hiring manager's work email. Generates 14 industry-standard email patterns with instant DNS verification.",
    url: "https://www.meetvina.app/tools/email-permutator",
    type: "website",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  "name": "Corporate Email Permutator & Pattern Finder",
  "url": "https://www.meetvina.app/tools/email-permutator",
  "applicationCategory": "BusinessApplication",
  "operatingSystem": "All",
  "browserRequirements": "Requires JavaScript",
  "offers": {
    "@type": "Offer",
    "price": "0",
    "priceCurrency": "USD",
  },
  "description":
    "Generate all possible email address permutations for hiring managers and sales prospects using first name, last name, and corporate domain.",
};

export default function EmailPermutatorPage() {
  return (
    <div className="min-h-screen bg-surface flex flex-col">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <main className="flex-1 mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 sm:py-12">
        <div className="mb-6 flex items-center justify-between">
          <Link
            href="/tools"
            className="inline-flex items-center gap-1.5 text-xs text-muted-ink hover:text-ink transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>All Free Outreach Tools</span>
          </Link>
          <span className="inline-flex items-center gap-1 rounded-full border border-hairline bg-paper px-2.5 py-1 text-[11px] text-muted-ink">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>No signup required • 100% Free</span>
          </span>
        </div>

        <div className="mb-8 max-w-2xl">
          <h1 className="font-heading text-2xl sm:text-3xl font-semibold tracking-tight text-ink mb-2">
            Recruiter Email Permutator &amp; Address Finder
          </h1>
          <p className="text-xs sm:text-sm text-muted-ink leading-relaxed">
            Need to reach a specific engineering manager or recruiter? Enter their name and company website to generate all 14 standard corporate email patterns used across modern tech companies.
          </p>
        </div>

        <EmailPermutatorTool />

        {/* SEO Educational Content */}
        <div className="mt-16 border-t border-hairline pt-12 space-y-10 text-ink">
          <section className="space-y-3">
            <h2 className="font-heading text-lg sm:text-xl font-semibold text-ink">
              What is an email permutation?
            </h2>
            <p className="text-xs sm:text-sm text-muted-ink leading-relaxed">
              When companies set up Google Workspace or Microsoft 365, IT administrators choose a standard corporate pattern for all employee inboxes—such as <code className="font-mono text-xs">first.last@company.com</code> or <code className="font-mono text-xs">first@company.com</code>. By running a candidate or manager&apos;s name through standard corporate formulas, you can predict their exact direct inbox without paying for expensive database scrapers.
            </p>
          </section>

          <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="rounded-lg border border-hairline bg-paper p-4 shadow-2xs space-y-2">
              <h3 className="font-heading text-sm font-semibold text-ink">Startups (&lt;50 team)</h3>
              <p className="text-xs text-muted-ink leading-relaxed">
                Early-stage companies almost universally prefer <code className="font-mono text-[11px]">first@company.com</code>.
              </p>
            </div>
            <div className="rounded-lg border border-hairline bg-paper p-4 shadow-2xs space-y-2">
              <h3 className="font-heading text-sm font-semibold text-ink">Scale-ups (50–500 team)</h3>
              <p className="text-xs text-muted-ink leading-relaxed">
                Fast-growing venture-backed tech teams standardize heavily on <code className="font-mono text-[11px]">first.last@company.com</code>.
              </p>
            </div>
            <div className="rounded-lg border border-hairline bg-paper p-4 shadow-2xs space-y-2">
              <h3 className="font-heading text-sm font-semibold text-ink">Enterprises (1,000+ team)</h3>
              <p className="text-xs text-muted-ink leading-relaxed">
                Legacy corporations frequently employ <code className="font-mono text-[11px]">flast@company.com</code> to resolve duplicate common names.
              </p>
            </div>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
