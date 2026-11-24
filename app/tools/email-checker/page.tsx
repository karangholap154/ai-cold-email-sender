import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ShieldCheck, Mail, CheckCircle2 } from "lucide-react";
import { EmailCheckerTool } from "@/components/tools/email-checker-tool";
import { Footer } from "@/components/footer";

export const metadata: Metadata = {
  title: "Free Cold Email Deliverability & Spam Word Checker | Vina",
  description:
    "Test your cold job application or sales outreach email for spam trigger words, reading time, and verify recipient domain MX records instantly. 100% free with zero registration required.",
  alternates: {
    canonical: "https://www.meetvina.app/tools/email-checker",
  },
  openGraph: {
    title: "Cold Email Deliverability & Spam Trigger Checker - Free Tool",
    description:
      "Avoid spam filters. Check your email text against 180+ spam phrases and verify recipient MX servers in real-time.",
    url: "https://www.meetvina.app/tools/email-checker",
    type: "website",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  "name": "Cold Email Deliverability & Spam Word Checker",
  "url": "https://www.meetvina.app/tools/email-checker",
  "applicationCategory": "BusinessApplication",
  "operatingSystem": "All",
  "browserRequirements": "Requires JavaScript",
  "offers": {
    "@type": "Offer",
    "price": "0",
    "priceCurrency": "USD",
  },
  "description":
    "Real-time cold email deliverability analysis, MX DNS server lookup, and spam trigger word detection for job seekers and founders.",
};

export default function EmailCheckerPage() {
  return (
    <div className="min-h-screen bg-surface flex flex-col">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Main Content Area */}
      <main className="flex-1 mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 sm:py-12">
        {/* Navigation Breadcrumb */}
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
            <span>Zero AI cost • 100% Client-side privacy</span>
          </span>
        </div>

        {/* Header Block */}
        <div className="mb-8 max-w-2xl">
          <h1 className="font-heading text-2xl sm:text-3xl font-semibold tracking-tight text-ink mb-2">
            Cold Email Deliverability &amp; Spam Word Checker
          </h1>
          <p className="text-xs sm:text-sm text-muted-ink leading-relaxed">
            Scan your outreach pitch for over 180+ spam triggers, excessive capitalization, and test recipient domain DNS MX records to guarantee inbox placement.
          </p>
        </div>

        {/* Interactive Tool */}
        <EmailCheckerTool />

        {/* Educational Content Block for SEO & AI Crawlers */}
        <div className="mt-16 border-t border-hairline pt-12 space-y-10 text-ink">
          <section className="space-y-3">
            <h2 className="font-heading text-lg sm:text-xl font-semibold text-ink">
              Why do cold emails land in the spam folder?
            </h2>
            <p className="text-xs sm:text-sm text-muted-ink leading-relaxed">
              Modern email providers like Google Workspace and Microsoft 365 use automated heuristics to filter incoming messages. If your letter includes marketing buzzwords like &quot;100% guaranteed&quot;, fake replies (&quot;Re:&quot;), or contains broken domain MX routing, algorithms automatically divert your message away from the primary inbox.
            </p>
          </section>

          <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="rounded-lg border border-hairline bg-paper p-4 shadow-2xs space-y-2">
              <div className="inline-flex items-center justify-center p-2 rounded-md bg-surface text-seal">
                <ShieldCheck className="h-4 w-4" />
              </div>
              <h3 className="font-heading text-sm font-semibold text-ink">Zero Spam Traps</h3>
              <p className="text-xs text-muted-ink leading-relaxed">
                Remove high-pressure urgency triggers and commercial sales words that trigger automated mailbox filters.
              </p>
            </div>

            <div className="rounded-lg border border-hairline bg-paper p-4 shadow-2xs space-y-2">
              <div className="inline-flex items-center justify-center p-2 rounded-md bg-surface text-seal">
                <Mail className="h-4 w-4" />
              </div>
              <h3 className="font-heading text-sm font-semibold text-ink">Active MX Check</h3>
              <p className="text-xs text-muted-ink leading-relaxed">
                Ensure the hiring company’s domain actually receives emails, preventing hard 550 Host Not Found bounces.
              </p>
            </div>

            <div className="rounded-lg border border-hairline bg-paper p-4 shadow-2xs space-y-2">
              <div className="inline-flex items-center justify-center p-2 rounded-md bg-surface text-seal">
                <CheckCircle2 className="h-4 w-4" />
              </div>
              <h3 className="font-heading text-sm font-semibold text-ink">Optimal Word Length</h3>
              <p className="text-xs text-muted-ink leading-relaxed">
                Aim for 90–150 words. Concise emails respect the recipient&apos;s time and generate 3x higher response rates.
              </p>
            </div>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
