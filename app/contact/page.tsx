import Link from "next/link";
import { Mail, ArrowLeft, MessageSquare, ShieldCheck, Clock, FileQuestion, HelpCircle } from "lucide-react";

export const metadata = {
  title: "Contact & Support | Vina",
  description: "Get in touch with the Vina team for technical support, billing inquiries, or privacy questions (meetvina.app).",
};

export default function ContactPage() {
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
            <Mail className="h-3 w-3 text-seal" />
            <span>Support &amp; Inquiries</span>
          </div>
          <h1 className="font-heading text-2xl sm:text-3xl md:text-4xl text-ink">
            Contact Us
          </h1>
          <p className="text-xs sm:text-sm text-muted-ink">
            We are here to help you tailor thoughtful job application correspondence.
          </p>
        </div>

        {/* Primary Contact Card */}
        <div className="border border-seal/30 bg-[#FAF9F5] p-6 rounded-sm space-y-4">
          <div className="flex items-center gap-2.5 text-ink font-medium text-sm sm:text-base">
            <MessageSquare className="h-4 w-4 text-seal shrink-0" />
            <span>Direct Email Support</span>
          </div>
          <p className="text-xs sm:text-sm text-muted-ink leading-relaxed">
            Have a question about your account, need assistance connecting Gmail, or want help with a subscription? Drop us a line directly:
          </p>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-hairline">
            <div>
              <span className="text-[11px] uppercase tracking-wider text-muted-ink font-medium block">
                Official Support Desk
              </span>
              <a
                href="mailto:karangholap154@gmail.com"
                className="font-mono text-sm sm:text-base text-seal font-medium hover:underline underline-offset-4"
              >
                karangholap154@gmail.com
              </a>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted-ink">
              <Clock className="h-3.5 w-3.5 text-confirmed shrink-0" />
              <span>Response within 24–48 hours</span>
            </div>
          </div>
        </div>

        {/* Support Categories */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="border border-hairline bg-paper p-4 rounded-sm space-y-2">
            <div className="flex items-center gap-2 text-ink font-medium text-xs">
              <HelpCircle className="h-3.5 w-3.5 text-seal shrink-0" />
              <span>Technical Support</span>
            </div>
            <p className="text-[11px] text-muted-ink leading-relaxed">
              Assistance with Google OAuth authorization, PDF résumé attachments, or email sending errors.
            </p>
          </div>

          <div className="border border-hairline bg-paper p-4 rounded-sm space-y-2">
            <div className="flex items-center gap-2 text-ink font-medium text-xs">
              <FileQuestion className="h-3.5 w-3.5 text-seal shrink-0" />
              <span>Billing &amp; Refunds</span>
            </div>
            <p className="text-[11px] text-muted-ink leading-relaxed">
              Invoices, Pro upgrades, 14-day money-back guarantee requests, or subscription management.
            </p>
          </div>

          <div className="border border-hairline bg-paper p-4 rounded-sm space-y-2">
            <div className="flex items-center gap-2 text-ink font-medium text-xs">
              <ShieldCheck className="h-3.5 w-3.5 text-seal shrink-0" />
              <span>Privacy &amp; Data</span>
            </div>
            <p className="text-[11px] text-muted-ink leading-relaxed">
              Questions regarding Google API limited use compliance, data export, or account deletion.
            </p>
          </div>
        </div>

        {/* FAQ Quick Link */}
        <div className="border border-dashed border-hairline bg-paper p-5 rounded-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div>
            <p className="font-medium text-ink">
              Looking for quick answers to common questions?
            </p>
            <p className="text-muted-ink text-[11px] mt-0.5">
              Check our FAQ for details on inbox privacy, résumé parsing, and letter editing.
            </p>
          </div>
          <Link
            href="/#faq"
            className="inline-flex items-center justify-center rounded-sm border border-hairline bg-[#EDEAE2] px-3.5 py-1.5 text-xs font-medium text-ink hover:bg-[#E4DFD3] transition-colors shrink-0"
          >
            Visit FAQ
          </Link>
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
            <Link href="/refund" className="hover:text-ink underline underline-offset-4">
              Refund Policy
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
