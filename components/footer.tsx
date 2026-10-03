import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight, ShieldCheck, Mail, Sparkles, CheckCircle2 } from "lucide-react";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-hairline bg-[#F8F7F3] text-muted-ink">
      {/* Main Footer Container */}
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 md:grid-cols-12 lg:gap-12">
          {/* Brand Column (Col 1-5 on desktop) */}
          <div className="space-y-4 md:col-span-5 lg:col-span-5">
            <Link
              href="/"
              className="inline-flex items-center gap-2.5 group transition-opacity hover:opacity-90"
              aria-label="Vina home"
            >
              <Image
                src="/logo.png"
                alt="Vina logo"
                width={28}
                height={28}
                className="h-7 w-auto transition-transform group-hover:scale-105"
              />
              <span className="font-heading text-lg sm:text-xl font-medium tracking-tight text-ink">
                Vina
              </span>
              <span className="rounded-full border border-hairline bg-paper px-2 py-0.5 font-mono text-[10px] text-muted-ink">
                meetvina.app
              </span>
            </Link>

            <p className="text-xs sm:text-sm text-muted-ink leading-relaxed max-w-sm">
              Personal correspondence for thoughtful job applications. Vina turns a job description into a genuine, targeted letter worth sending.
            </p>

            {/* Reassurance pills */}
            <div className="pt-2 flex flex-wrap items-center gap-2.5 text-[11px]">
              <div className="inline-flex items-center gap-1.5 rounded-sm border border-hairline bg-paper px-2.5 py-1 text-ink/80 shadow-2xs">
                <span className="h-1.5 w-1.5 rounded-full bg-confirmed animate-pulse" />
                <span>Zero AI training on your data</span>
              </div>
              <div className="inline-flex items-center gap-1.5 rounded-sm border border-hairline bg-paper px-2.5 py-1 text-ink/80 shadow-2xs">
                <ShieldCheck className="h-3 w-3 text-seal" />
                <span>AES-256-GCM Encrypted</span>
              </div>
            </div>

            {/* Support micro-box */}
            <div className="pt-1 text-xs">
              <span className="text-[11px] uppercase tracking-wider text-muted-ink/80 font-medium block">
                Have a question or feedback?
              </span>
              <a
                href="mailto:karangholap154@gmail.com"
                className="inline-flex items-center gap-1.5 text-xs text-ink font-medium hover:text-seal transition-colors mt-0.5 group"
              >
                <Mail className="h-3.5 w-3.5 text-muted-ink group-hover:text-seal transition-colors" />
                <span>karangholap154@gmail.com</span>
                <ArrowUpRight className="h-3 w-3 opacity-60 group-hover:opacity-100 transition-opacity" />
              </a>
            </div>
          </div>

          {/* Links Grid (Col 6-12 on desktop: 3 organized columns) */}
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3 md:col-span-7 lg:col-span-7 pt-2 md:pt-0">
            {/* 1. Product Column */}
            <div className="space-y-3.5">
              <h3 className="font-heading text-xs font-semibold uppercase tracking-wider text-ink">
                Product
              </h3>
              <ul className="space-y-2 text-xs" role="list">
                <li>
                  <Link
                    href="/draft"
                    className="inline-block py-0.5 text-muted-ink hover:text-ink transition-colors"
                  >
                    Draft a letter
                  </Link>
                </li>
                <li>
                  <Link
                    href="/log"
                    className="inline-block py-0.5 text-muted-ink hover:text-ink transition-colors"
                  >
                    Sent history
                  </Link>
                </li>
                <li>
                  <Link
                    href="/settings"
                    className="inline-block py-0.5 text-muted-ink hover:text-ink transition-colors"
                  >
                    Account settings
                  </Link>
                </li>
                <li>
                  <Link
                    href="/#pricing"
                    className="inline-block py-0.5 text-muted-ink hover:text-ink transition-colors"
                  >
                    Pricing &amp; plans
                  </Link>
                </li>
                <li>
                  <Link
                    href="/login"
                    className="inline-block py-0.5 text-muted-ink hover:text-ink transition-colors"
                  >
                    Sign in
                  </Link>
                </li>
              </ul>
            </div>

            {/* 2. Legal & Trust Column */}
            <div className="space-y-3.5">
              <h3 className="font-heading text-xs font-semibold uppercase tracking-wider text-ink">
                Compliance
              </h3>
              <ul className="space-y-2 text-xs" role="list">
                <li>
                  <Link
                    href="/privacy"
                    className="inline-block py-0.5 text-muted-ink hover:text-ink transition-colors"
                  >
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link
                    href="/terms"
                    className="inline-block py-0.5 text-muted-ink hover:text-ink transition-colors"
                  >
                    Terms of Service
                  </Link>
                </li>
                <li>
                  <Link
                    href="/refund"
                    className="inline-block py-0.5 text-muted-ink hover:text-ink transition-colors"
                  >
                    Refund Policy
                  </Link>
                </li>
                <li>
                  <Link
                    href="/privacy"
                    className="inline-block py-0.5 text-muted-ink hover:text-ink transition-colors"
                  >
                    Google API Disclosure
                  </Link>
                </li>
              </ul>
            </div>

            {/* 3. Support & Community Column */}
            <div className="space-y-3.5 col-span-2 sm:col-span-1">
              <h3 className="font-heading text-xs font-semibold uppercase tracking-wider text-ink">
                Support
              </h3>
              <ul className="space-y-2 text-xs" role="list">
                <li>
                  <Link
                    href="/contact"
                    className="inline-block py-0.5 text-muted-ink hover:text-ink transition-colors"
                  >
                    Contact desk
                  </Link>
                </li>
                <li>
                  <Link
                    href="/#faq"
                    className="inline-block py-0.5 text-muted-ink hover:text-ink transition-colors"
                  >
                    Common questions
                  </Link>
                </li>
                <li>
                  <Link
                    href="/refund"
                    className="inline-block py-0.5 text-muted-ink hover:text-ink transition-colors"
                  >
                    14-Day Guarantee
                  </Link>
                </li>
                <li>
                  <Link
                    href="/settings?tab=gmail"
                    className="inline-block py-0.5 text-muted-ink hover:text-ink transition-colors"
                  >
                    Gmail connection
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom Utility Bar */}
        <div className="mt-12 border-t border-hairline pt-6 sm:mt-16 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-muted-ink/80 text-center sm:text-left">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-x-2 gap-y-1">
            <span>© {currentYear} Vina (meetvina.app).</span>
            <span className="hidden sm:inline">•</span>
            <span>Crafted for deliberate, 1-to-1 candidate outreach.</span>
          </div>

          <div className="flex items-center justify-center gap-3 text-[11px]">
            <Link
              href="/privacy"
              className="text-muted-ink hover:text-ink underline underline-offset-4 transition-colors"
            >
              Google OAuth Verified
            </Link>
            <span>•</span>
            <Link
              href="/refund"
              className="text-muted-ink hover:text-ink underline underline-offset-4 transition-colors"
            >
              Money-Back Guarantee
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
