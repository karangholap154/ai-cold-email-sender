import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Sliders, Smartphone, CheckCircle2 } from "lucide-react";
import { SubjectLineTesterTool } from "@/components/tools/subject-line-tool";
import { Footer } from "@/components/footer";

export const metadata: Metadata = {
  title: "Cold Email Subject Line Tester & Mobile Preview Simulator | Vina",
  description:
    "Test your cold email subject line score, avoid spam trigger words, and see the exact mobile iPhone & Gmail desktop preview cut-off before sending. 100% free.",
  alternates: {
    canonical: "https://www.meetvina.app/tools/subject-line-tester",
  },
  openGraph: {
    title: "Free Cold Email Subject Line Tester & Mobile Preview",
    description:
      "Grade your outreach subject line. Preview character cut-offs for iPhone and Gmail desktop, scan for spam, and boost open rates.",
    url: "https://www.meetvina.app/tools/subject-line-tester",
    type: "website",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  "name": "Cold Email Subject Line Tester & Mobile Simulator",
  "url": "https://www.meetvina.app/tools/subject-line-tester",
  "applicationCategory": "BusinessApplication",
  "operatingSystem": "All",
  "browserRequirements": "Requires JavaScript",
  "offers": {
    "@type": "Offer",
    "price": "0",
    "priceCurrency": "USD",
  },
  "description":
    "Evaluate cold email subject lines for open rate probability, spam triggers, mobile screen truncation, and case styling.",
};

export default function SubjectLineTesterPage() {
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
            <span>Instant Evaluation • 100% Free</span>
          </span>
        </div>

        <div className="mb-8 max-w-2xl">
          <h1 className="font-heading text-2xl sm:text-3xl font-semibold tracking-tight text-ink mb-2">
            Cold Email Subject Line Tester &amp; Mobile Simulator
          </h1>
          <p className="text-xs sm:text-sm text-muted-ink leading-relaxed">
            Over 65% of hiring managers open emails on mobile devices first. Grade your subject line for character length, casing, curiosity, and preview how it cuts off on iOS and Gmail.
          </p>
        </div>

        <SubjectLineTesterTool />

        {/* SEO Educational Section */}
        <div className="mt-16 border-t border-hairline pt-12 space-y-10 text-ink">
          <section className="space-y-3">
            <h2 className="font-heading text-lg sm:text-xl font-semibold text-ink">
              What makes a high-converting cold email subject line?
            </h2>
            <p className="text-xs sm:text-sm text-muted-ink leading-relaxed">
              Recruiters and executives spend an average of 3 seconds scanning inbox notifications. High-performing cold email subject lines are typically short (3 to 6 words), avoid generic buzzwords or aggressive capitalization, and reference a specific technical or team context.
            </p>
          </section>

          <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="rounded-lg border border-hairline bg-paper p-4 shadow-2xs space-y-2">
              <h3 className="font-heading text-sm font-semibold text-ink">Under 40 Characters</h3>
              <p className="text-xs text-muted-ink leading-relaxed">
                Guarantees the full subject line is readable on iPhone Lock Screen notifications without ellipses truncation.
              </p>
            </div>
            <div className="rounded-lg border border-hairline bg-paper p-4 shadow-2xs space-y-2">
              <h3 className="font-heading text-sm font-semibold text-ink">Conversational Casing</h3>
              <p className="text-xs text-muted-ink leading-relaxed">
                Lowercase and standard sentence-case generate up to 22% higher open rates by signaling authentic human correspondence rather than a mass marketing campaign.
              </p>
            </div>
            <div className="rounded-lg border border-hairline bg-paper p-4 shadow-2xs space-y-2">
              <h3 className="font-heading text-sm font-semibold text-ink">No Promotional Tricks</h3>
              <p className="text-xs text-muted-ink leading-relaxed">
                Avoid deceptive prefixes like &quot;Re:&quot; or words like &quot;Urgent&quot;. Modern spam filters flag these immediately.
              </p>
            </div>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
