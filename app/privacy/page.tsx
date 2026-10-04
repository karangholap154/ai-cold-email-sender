import Link from "next/link";
import { Shield, Lock, CheckCircle2, ArrowLeft } from "lucide-react";

export const metadata = {
  title: "Privacy Policy | Vina",
  description: "Privacy policy and Google API user data disclosure for Vina (meetvina.app).",
};

export default function PrivacyPolicyPage() {
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
            <Shield className="h-3 w-3 text-seal" />
            <span>Transparency & Compliance</span>
          </div>
          <h1 className="font-heading text-2xl sm:text-3xl md:text-4xl text-ink">
            Privacy Policy
          </h1>
          <p className="text-xs sm:text-sm text-muted-ink">
            Last updated: September 30, 2026 • Effective immediately
          </p>
        </div>

        {/* Google User Data Disclosure Notice Box */}
        <section className="border border-seal/30 bg-[#FAF9F5] p-5 sm:p-6 rounded-sm space-y-3">
          <div className="flex items-center gap-2 text-ink font-medium text-xs sm:text-sm">
            <Lock className="h-4 w-4 text-seal shrink-0" />
            <span>Google API Services User Data Policy Compliance</span>
          </div>
          <p className="text-xs leading-relaxed text-muted-ink">
            Vina adheres strictly to the{" "}
            <a
              href="https://developers.google.com/terms/api-services-user-data-policy"
              target="_blank"
              rel="noopener noreferrer"
              className="text-ink underline underline-offset-2 hover:text-seal font-medium"
            >
              Google API Services User Data Policy
            </a>
            , including the <strong>Limited Use</strong> requirements. Our use and transfer of information received from Google APIs to any other app will adhere to these requirements.
          </p>
          <div className="pt-1 flex flex-wrap gap-x-6 gap-y-2 text-[11px] text-muted-ink">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-confirmed shrink-0" />
              <span>No incoming inbox reading</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-confirmed shrink-0" />
              <span>No data sold or shared</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-confirmed shrink-0" />
              <span>Not used for AI model training</span>
            </div>
          </div>
        </section>

        {/* Detailed Policy Content */}
        <div className="space-y-6 text-xs sm:text-sm leading-relaxed text-ink/90">
          <section className="space-y-2">
            <h2 className="font-heading text-base sm:text-lg text-ink">
              1. Information We Collect
            </h2>
            <p className="text-muted-ink">
              We collect only the minimum necessary information required to operate our correspondence service:
            </p>
            <ul className="list-disc list-inside space-y-1 text-muted-ink pl-1">
              <li>
                <strong className="text-ink">Account Credentials:</strong> Your email address and hashed password when creating a Supabase Auth account.
              </li>
              <li>
                <strong className="text-ink">Résumé & Profile Details:</strong> Your uploaded PDF résumé, background skills summary, and sign-off preferences stored in your private account.
              </li>
              <li>
                <strong className="text-ink">Google OAuth Tokens:</strong> When you connect your Gmail account, we receive an OAuth 2.0 authorization code exchanged for access and refresh tokens, alongside your verified Gmail address.
              </li>
              <li>
                <strong className="text-ink">Correspondence Log:</strong> The recipient’s email address, company name, extracted role title, and final sent subject/body for your personal records to prevent duplicate outreach.
              </li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="font-heading text-base sm:text-lg text-ink">
              2. How We Use Google User Data
            </h2>
            <p className="text-muted-ink">
              When you authenticate with Google, Vina requests the following permissions:
            </p>
            <div className="space-y-1.5 rounded-sm border border-hairline bg-[#FAF9F5] p-3 font-mono text-xs text-ink">
              <div>https://www.googleapis.com/auth/gmail.send</div>
              <div>https://www.googleapis.com/auth/gmail.readonly</div>
              <div>https://www.googleapis.com/auth/userinfo.email</div>
            </div>
            <p className="text-muted-ink">
              Vina asks for permission to send messages on your behalf and to find your own sent messages so follow-ups land in the same conversation. It never reads your incoming mail.
            </p>
            <ul className="list-disc list-inside space-y-1 text-muted-ink pl-1">
              <li>We <strong>never read, inspect, or store</strong> incoming mail from your inbox.</li>
              <li>We <strong>never access</strong> your address book, contact lists, or personal calendar.</li>
              <li>We <strong>never send</strong> automated bulk blasts or messages that you have not explicitly approved.</li>
              <li>We <strong>never sell, lease, or monetize</strong> your personal information or Google account data.</li>
              <li>Your Google data is <strong>never used</strong> to train artificial intelligence (AI) models.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="font-heading text-base sm:text-lg text-ink">
              3. Security & Token Encryption
            </h2>
            <p className="text-muted-ink">
              Security and data privacy are foundational to our architecture:
            </p>
            <ul className="list-disc list-inside space-y-1 text-muted-ink pl-1">
              <li>
                <strong className="text-ink">Encrypted at Rest:</strong> All Google OAuth refresh tokens are encrypted at rest using industry-standard <strong>AES-256-GCM</strong> encryption with unique initialization vectors and authentication tags. Plaintext credentials are never written to disk or logged.
              </li>
              <li>
                <strong className="text-ink">Isolated Storage:</strong> Your uploaded résumé PDF files are stored in private, user-isolated Supabase Storage buckets secured by Row Level Security (RLS). They are never publicly accessible.
              </li>
              <li>
                <strong className="text-ink">Encrypted in Transit:</strong> All data transferred between your browser, our servers, Supabase, AI providers, and Google APIs is encrypted using modern TLS (HTTPS).
              </li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="font-heading text-base sm:text-lg text-ink">
              4. Artificial Intelligence & LLM Data Protection
            </h2>
            <p className="text-muted-ink">
              Vina uses advanced language models provided by enterprise partners (Groq Inc. and Google Cloud Vertex AI) to synthesize job descriptions and draft personalized application letters.
            </p>
            <ul className="list-disc list-inside space-y-1 text-muted-ink pl-1">
              <li>
                <strong className="text-ink">Zero Model Training:</strong> Under our enterprise API terms with Groq and Google, <strong>your inputs (job descriptions, résumés, profile summaries) and generated letters are never used to train, retrain, or improve public AI models</strong>.
              </li>
              <li>
                <strong className="text-ink">Ephemeral Processing:</strong> Prompts sent to AI endpoints are processed ephemerally in memory to generate your draft and are not retained by AI vendors beyond immediate completion.
              </li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="font-heading text-base sm:text-lg text-ink">
              5. Cookies & Local Storage
            </h2>
            <p className="text-muted-ink">
              We do not use tracking cookies or third-party advertising trackers. We utilize only essential browser storage technologies:
            </p>
            <ul className="list-disc list-inside space-y-1 text-muted-ink pl-1">
              <li>
                <strong className="text-ink">Essential Authentication Cookies:</strong> Cryptographically signed HTTP-only cookies provided by Supabase to maintain your secure session.
              </li>
              <li>
                <strong className="text-ink">Local Storage (Draft Auto-Recovery):</strong> Temporary client-side caching in your browser so you do not lose in-progress job description drafts if your tab is refreshed. This data remains on your local device.
              </li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="font-heading text-base sm:text-lg text-ink">
              6. Third-Party Sub-Processors
            </h2>
            <p className="text-muted-ink">
              We engage only trusted infrastructure and compliance vendors:
            </p>
            <ul className="list-disc list-inside space-y-1 text-muted-ink pl-1">
              <li><strong className="text-ink">Google Cloud Platform:</strong> Gmail API delivery and Google OAuth authentication.</li>
              <li><strong className="text-ink">Supabase Inc.:</strong> Encrypted PostgreSQL database, authentication, and file storage.</li>
              <li><strong className="text-ink">Dodo Payments Inc.:</strong> Merchant of Record for global checkout, recurring subscriptions, tax compliance, Apple Pay, and UPI processing. (We never handle or store raw credit card numbers).</li>
              <li><strong className="text-ink">Groq Inc. & Google Cloud:</strong> AI letter generation and job description analysis (stateless API, zero model training).</li>
              <li><strong className="text-ink">Vercel Inc.:</strong> Application edge hosting, serverless functions, and SSL delivery.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="font-heading text-base sm:text-lg text-ink">
              7. Regional Privacy Rights (GDPR, CCPA/CPRA & India DPDP)
            </h2>
            <p className="text-muted-ink">
              Depending on your location, you may have specific statutory rights regarding your personal information:
            </p>
            <ul className="list-disc list-inside space-y-1 text-muted-ink pl-1">
              <li><strong className="text-ink">Right to Access & Portability:</strong> You may request an export of all your correspondence history, résumé files, and profile details.</li>
              <li><strong className="text-ink">Right to Erasure (Right to be Forgotten):</strong> You may request the permanent deletion of your account and all associated data at any time.</li>
              <li><strong className="text-ink">Right to Disconnect:</strong> You can revoke Gmail OAuth permissions at any time from your Settings page or Google Security Settings, immediately purging stored tokens.</li>
              <li><strong className="text-ink">No Sale of Personal Data:</strong> We do not sell, rent, or trade user data to data brokers or third parties.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="font-heading text-base sm:text-lg text-ink">
              8. Contact & Data Protection Inquiries
            </h2>
            <p className="text-muted-ink">
              For any questions, requests for data export, or deletion inquiries regarding this Privacy Policy, please reach out to:
            </p>
            <p className="text-ink font-medium">
              Privacy & Data Protection<br />
              Email: <a href="mailto:support@meetvina.app" className="underline underline-offset-2 hover:text-seal">support@meetvina.app</a><br />
              Response time: Typically within 24 to 48 hours.
            </p>
          </section>
        </div>

        {/* Footer info */}
        <div className="border-t border-hairline pt-6 text-xs text-muted-ink flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>© {new Date().getFullYear()} Vina (meetvina.app). All rights reserved.</p>
          <div className="flex flex-wrap items-center gap-4">
            <Link href="/terms" className="hover:text-ink underline underline-offset-4">
              Terms of Service
            </Link>
            <Link href="/refund" className="hover:text-ink underline underline-offset-4">
              Refund Policy
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
