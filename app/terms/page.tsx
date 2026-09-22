import Link from "next/link";
import { FileText, ArrowLeft, AlertCircle } from "lucide-react";

export const metadata = {
  title: "Terms of Service | Cold Email",
  description: "Terms and acceptable use policy for Cold Email Sender.",
};

export default function TermsOfServicePage() {
  return (
    <main className="flex flex-1 flex-col px-4 py-8 sm:px-6 sm:py-12 md:py-16 bg-paper text-ink">
      <div className="mx-auto w-full max-w-3xl space-y-8">
        {/* Navigation link */}
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs text-muted-ink hover:text-ink transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to overview</span>
        </Link>

        {/* Header */}
        <div className="border-b border-hairline pb-6 space-y-2">
          <div className="inline-flex items-center gap-2 rounded-sm border border-hairline bg-[#EDEAE2] px-2.5 py-0.5 text-[10px] sm:text-[11px] font-medium tracking-wide uppercase text-muted-ink">
            <FileText className="h-3 w-3 text-seal" />
            <span>Legal Agreement</span>
          </div>
          <h1 className="font-heading text-2xl sm:text-3xl md:text-4xl text-ink">
            Terms of Service
          </h1>
          <p className="text-xs sm:text-sm text-muted-ink">
            Last updated: September 23, 2026 • Effective immediately
          </p>
        </div>

        {/* Core Acceptable Use Banner */}
        <div className="border border-hairline bg-[#FAF9F5] p-5 sm:p-6 rounded-sm space-y-2">
          <div className="flex items-center gap-2 text-ink font-medium text-xs sm:text-sm">
            <AlertCircle className="h-4 w-4 text-seal shrink-0" />
            <span>Executive Correspondence Standard</span>
          </div>
          <p className="text-xs text-muted-ink leading-relaxed">
            Cold Email is strictly intended as a deliberate 1-to-1 correspondence instrument for individual candidates contacting hiring managers. It may not be used for mass automated marketing, spam, scraping, or bulk message dissemination.
          </p>
        </div>

        {/* Terms Content */}
        <div className="space-y-6 text-xs sm:text-sm leading-relaxed text-ink/90">
          <section className="space-y-2">
            <h2 className="font-heading text-base sm:text-lg text-ink">
              1. Agreement to Terms
            </h2>
            <p className="text-muted-ink">
              By accessing or using Cold Email (&quot;the Service&quot;), you agree to be bound by these Terms of Service and our Privacy Policy. If you disagree with any portion of these terms, you may not access or use the Service.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="font-heading text-base sm:text-lg text-ink">
              2. Acceptable Use Policy
            </h2>
            <p className="text-muted-ink">
              You agree to use Cold Email solely for lawful, bona fide job search, networking, and professional correspondence. You specifically represent and warrant that you will not:
            </p>
            <ul className="list-disc list-inside space-y-1.5 text-muted-ink pl-1">
              <li>Use the Service to transmit unsolicited commercial advertisements or spam in violation of the CAN-SPAM Act, CASL, GDPR, or applicable regional electronic communications laws.</li>
              <li>Impersonate any person or entity or misrepresent your qualifications, employment history, or identity in drafted correspondence or uploaded resumes.</li>
              <li>Harass, stalk, threaten, or abuse recruiters, hiring managers, or any recipient.</li>
              <li>Attempt to reverse engineer, decompile, or exploit our software, API endpoints, or database infrastructure.</li>
              <li>Use automated scripts or bots to bypass application rate limits or monthly plan quotas.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="font-heading text-base sm:text-lg text-ink">
              3. User Editorial Responsibility
            </h2>
            <p className="text-muted-ink">
              Cold Email provides AI-assisted synthesis and draft preparation. However, <strong>you retain sole and ultimate responsibility</strong> for reviewing, editing, verifying, and approving every email, subject line, and attachment before clicking &quot;Send letter.&quot;
            </p>
            <p className="text-muted-ink">
              We make no guarantee regarding interview invitations, hiring outcomes, or response rates. You acknowledge that correspondence is dispatched under your authentic personal identity and that you are solely responsible for all communications sent from your connected accounts.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="font-heading text-base sm:text-lg text-ink">
              4. Accounts & Google Connection
            </h2>
            <p className="text-muted-ink">
              When connecting your Gmail account via Google OAuth 2.0, you authorize the Service to dispatch individual emails as directed by you. You may revoke this access at any time through your account Settings or via Google’s account security panel. We reserve the right to suspend or terminate accounts that violate Google’s Acceptable Use Policies or our anti-spam standards.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="font-heading text-base sm:text-lg text-ink">
              5. Intellectual Property
            </h2>
            <p className="text-muted-ink">
              You retain all ownership rights to your uploaded resume documents, personal skill summaries, and finalized correspondence text. We retain all rights, title, and interest in and to the Cold Email software, design tokens, interfaces, and branding.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="font-heading text-base sm:text-lg text-ink">
              6. Limitation of Liability & Disclaimers
            </h2>
            <p className="text-muted-ink">
              The Service is provided on an &quot;AS IS&quot; and &quot;AS AVAILABLE&quot; basis without warranties of any kind, whether express or implied. Under no circumstances shall Cold Email, its owners, or affiliates be liable for any indirect, incidental, consequential, or punitive damages arising from the use or inability to use the Service.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="font-heading text-base sm:text-lg text-ink">
              7. Changes to Terms
            </h2>
            <p className="text-muted-ink">
              We reserve the right to modify these Terms at any time. Material modifications will be posted to this page with an updated effective date. Continued use of the Service following revisions constitutes acceptance of the new terms.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="font-heading text-base sm:text-lg text-ink">
              8. Contact
            </h2>
            <p className="text-muted-ink">
              For any questions regarding these Terms of Service, please reach out to:
            </p>
            <p className="text-ink font-medium">
              Legal & Support Team<br />
              Email: <a href="mailto:karangholap154@gmail.com" className="underline underline-offset-2 hover:text-seal">karangholap154@gmail.com</a>
            </p>
          </section>
        </div>

        {/* Footer info */}
        <div className="border-t border-hairline pt-6 text-xs text-muted-ink flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>© {new Date().getFullYear()} Cold Email. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <Link href="/privacy" className="hover:text-ink underline underline-offset-4">
              Privacy Policy
            </Link>
            <Link href="/" className="hover:text-ink underline underline-offset-4">
              Home
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
