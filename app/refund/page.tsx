import Link from "next/link";
import { RotateCcw, ArrowLeft, CheckCircle2, CreditCard } from "lucide-react";

export const metadata = {
  title: "Refund & Cancellation Policy | Vina",
  description: "Clear, transparent refund and cancellation policy for Vina Pro subscriptions (meetvina.app).",
};

export default function RefundPolicyPage() {
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
            <RotateCcw className="h-3 w-3 text-seal" />
            <span>Customer Fair-Play Guarantee</span>
          </div>
          <h1 className="font-heading text-2xl sm:text-3xl md:text-4xl text-ink">
            Refund &amp; Cancellation Policy
          </h1>
          <p className="text-xs sm:text-sm text-muted-ink">
            Last updated: October 3, 2026 • Effective immediately
          </p>
        </div>

        {/* Highlight Guarantee Box */}
        <section className="border border-seal/30 bg-[#FAF9F5] p-5 sm:p-6 rounded-sm space-y-3">
          <div className="flex items-center gap-2 text-ink font-medium text-xs sm:text-sm">
            <CreditCard className="h-4 w-4 text-seal shrink-0" />
            <span>14-Day Money-Back Guarantee for New Subscribers</span>
          </div>
          <p className="text-xs leading-relaxed text-muted-ink">
            We want you to be completely satisfied with your cold outreach. If you upgrade to Vina Pro and find that the tailored letters or follow-up tools do not suit your job search workflow, you can request a full refund within <strong>14 days of your initial purchase</strong>—no interrogation, no hurdles.
          </p>
          <div className="pt-1 flex flex-wrap gap-x-6 gap-y-2 text-[11px] text-muted-ink">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-confirmed shrink-0" />
              <span>100% full refund on first month</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-confirmed shrink-0" />
              <span>Cancel anytime in 1 click</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-confirmed shrink-0" />
              <span>Processed in 5–7 business days</span>
            </div>
          </div>
        </section>

        {/* Policy Details */}
        <div className="space-y-6 text-xs sm:text-sm leading-relaxed text-ink/90">
          <section className="space-y-2">
            <h2 className="font-heading text-base sm:text-lg text-ink">
              1. Subscription Cancellation
            </h2>
            <p className="text-muted-ink">
              You maintain complete control over your subscription at all times:
            </p>
            <ul className="list-disc list-inside space-y-1 text-muted-ink pl-1">
              <li>
                <strong className="text-ink">Self-Service Cancellation:</strong> You can cancel your Pro membership at any time by navigating to your <em>Settings &gt; Billing</em> tab and clicking <em>Manage Subscription</em>, or by logging into the Dodo Payments Customer Portal.
              </li>
              <li>
                <strong className="text-ink">No Hidden Penalties:</strong> We do not charge cancellation fees. Your cancellation takes effect immediately.
              </li>
              <li>
                <strong className="text-ink">Retention of Access:</strong> When you cancel your subscription, you retain full Pro access (unlimited tailored letters, multi-resume storage, and threaded follow-ups) through the remainder of your prepaid billing period.
              </li>
              <li>
                <strong className="text-ink">Post-Period Downgrade:</strong> At the conclusion of your billing cycle, your account automatically returns to the Free plan (5 letters/month limit). Your previously sent letter history remains intact.
              </li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="font-heading text-base sm:text-lg text-ink">
              2. Refund Eligibility &amp; Guidelines
            </h2>
            <p className="text-muted-ink">
              Our refund rules are designed to be clear and straightforward:
            </p>
            <ul className="list-disc list-inside space-y-1.5 text-muted-ink pl-1">
              <li>
                <strong className="text-ink">Initial Purchase (First 14 Days):</strong> Full refund upon request within 14 calendar days of your initial upgrade to Vina Pro ($9 USD / ₹499 INR).
              </li>
              <li>
                <strong className="text-ink">Subsequent Renewals:</strong> Renewal charges are billed automatically each month. If your subscription renewed and you forgot to cancel, you may contact us within <strong>48 hours of the renewal charge</strong> for an exception refund, provided you have not generated additional letters during the renewed cycle.
              </li>
              <li>
                <strong className="text-ink">Technical Malfunctions:</strong> In the rare event of persistent system failure (e.g. Gmail API dispatch errors caused by our servers or inability to access paid features), you are entitled to a prorated or full refund regardless of timeline.
              </li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="font-heading text-base sm:text-lg text-ink">
              3. Merchant of Record &amp; Payment Processing
            </h2>
            <p className="text-muted-ink">
              All payment transactions, invoice delivery, tax calculations, and refund distributions are handled securely by our Merchant of Record, <strong>Dodo Payments Inc.</strong>:
            </p>
            <ul className="list-disc list-inside space-y-1 text-muted-ink pl-1">
              <li>
                <strong className="text-ink">Payment Methods:</strong> Refunds are always remitted directly to the original payment instrument used at checkout (Credit/Debit Card, UPI, or Apple Pay).
              </li>
              <li>
                <strong className="text-ink">Processing Timeline:</strong> Once initiated, refunds typically reflect in your bank account or card balance within <strong>5 to 7 business days</strong>, depending on your banking provider.
              </li>
              <li>
                <strong className="text-ink">Currency &amp; Taxes:</strong> Any sales tax or GST collected at checkout is refunded in accordance with applicable tax regulations.
              </li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="font-heading text-base sm:text-lg text-ink">
              4. How to Request a Refund
            </h2>
            <p className="text-muted-ink">
              To request a refund under our guarantee, simply email our support team with:
            </p>
            <div className="rounded-sm border border-hairline bg-[#FAF9F5] p-3 text-xs text-ink space-y-1">
              <div>1. Your account email address</div>
              <div>2. The date of the charge or invoice number</div>
              <div>3. (Optional) A brief note about what didn&apos;t meet your expectations</div>
            </div>
            <p className="text-muted-ink pt-2">
              Send your request to:
            </p>
            <p className="text-ink font-medium">
              Billing &amp; Refunds Support<br />
              Email: <a href="mailto:support@meetvina.app" className="underline underline-offset-2 hover:text-seal">support@meetvina.app</a><br />
              Turnaround: All requests are acknowledged and processed within 24 to 48 hours.
            </p>
          </section>
        </div>

        {/* Footer info */}
        <div className="border-t border-hairline pt-6 text-xs text-muted-ink flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>© {new Date().getFullYear()} Vina (meetvina.app). All rights reserved.</p>
          <div className="flex flex-wrap items-center gap-4">
            <Link href="/privacy" className="hover:text-ink underline underline-offset-4">
              Privacy Policy
            </Link>
            <Link href="/terms" className="hover:text-ink underline underline-offset-4">
              Terms of Service
            </Link>
            <Link href="/contact" className="hover:text-ink underline underline-offset-4">
              Contact
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
