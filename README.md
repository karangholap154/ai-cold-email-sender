# Vina — Thoughtful, Tailored Job Application Letters

> **Production URL:** [https://meetvina.app](https://meetvina.app)  
> Personal correspondence for thoughtful job applications. Vina reads the job posting, drafts a genuine, targeted letter to go with your résumé, and hands it back to you to review and edit before sending directly from your personal Gmail.

---

## 1. System Architecture & Tech Stack

| Layer | Technology | Details |
|---|---|---|
| **Framework** | **Next.js 16.3.5 (App Router)** | React 19, Turbopack, Tailwind CSS v4, Motion |
| **Database & Auth** | **Supabase (PostgreSQL)** | Row-Level Security (RLS), Auth triggers, Private Storage |
| **Email Dispatch** | **Google Gmail API / Nodemailer** | OAuth 2.0 with offline access, RFC 2822 thread-aware MIME encoding |
| **Security & Cryptography** | **Node.js `crypto` (AES-256-GCM)** | Encrypted Gmail refresh tokens with unique IV and authentication tags |
| **Billing & Subscriptions** | **Dodo Payments** | Global Cards, Apple Pay & India UPI ($9 USD / ₹499 INR monthly) |
| **AI Generation** | **Groq (Primary) + Google Gemini (Fallback)** | Llama 3.3 70B Versatile with auto-failover to Gemini 2.5 Flash |
| **Typography & Theme** | **Fraunces + IBM Plex Sans** | Restrained editorial stationery aesthetic (Paper `#F6F5F1`, Ink `#1E2530`, Seal `#B8823A`) |

---

## 2. Directory Structure

```text
ai-cold-email-sender/
├── app/
│   ├── api/
│   │   ├── analyze/            # Extracts role skills & drafts tailored application letter
│   │   ├── billing/            # Dodo checkout, customer portal, & webhook handler
│   │   ├── emails/             # User's sent correspondence history
│   │   ├── gmail/              # Google OAuth connect, callback, status, & disconnect
│   │   ├── profile/            # Sender signature & contact metadata
│   │   ├── resume/             # PDF upload to private Supabase bucket & parsing
│   │   └── send/               # Gmail MIME builder, resume attach, thread sender & quotas
│   ├── auth/callback/          # Supabase Auth code exchange handler
│   ├── draft/                  # Letter composer, live edit, regeneration, & send review
│   ├── log/                    # Sent letters archive & 1-click follow-up thread launcher
│   ├── login/ & signup/        # Branded authentication pages
│   ├── settings/               # Modular tabs: Signature, Résumé, Gmail, & Billing
│   ├── layout.tsx              # Root HTML, fonts, SEO tags, & Google verification
│   ├── manifest.ts             # PWA manifest
│   ├── not-found.tsx           # Custom branded 404 page
│   ├── opengraph-image.tsx     # Dynamic server-generated OpenGraph card
│   ├── page.tsx                # Public editorial landing page with JSON-LD schema
│   ├── privacy/ & terms/       # Legal agreements & Google API user data disclosures
│   ├── proxy.ts                # Next.js 16 session refresh & route protection proxy
│   ├── robots.ts               # Search crawler directives
│   └── sitemap.ts              # Dynamic sitemap index for search engines
├── components/
│   ├── settings/               # Split subcomponents (Signature, Résumé, Gmail, Billing)
│   ├── ui/                     # Accessible UI primitives (Dialog, Tooltip, Sonner)
│   ├── header.tsx              # Header with live plan badge and responsive mobile dock
│   └── letter-frame.tsx        # Physical stationery card preview with live editing
├── lib/
│   ├── constants/
│   │   └── plans.ts            # Centralized Free/Pro quotas, pricing & feature gates
│   ├── supabase/               # Server & browser Supabase clients with cookies
│   ├── ai.ts                   # LLM orchestration (Groq primary, Gemini fallback)
│   ├── billing.ts              # Dodo Payments checkout client
│   └── crypto.ts               # AES-256-GCM token encryption / decryption helpers
└── supabase/
    └── schema.sql              # Complete idempotent database schema, RLS, and triggers
```

---

## 3. Environment Variables

Create a `.env.local` file in your project root or configure these in your deployment dashboard:

```bash
# ==========================================
# 1. Supabase Configuration
# ==========================================
NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"

# ==========================================
# 2. App URL & Verification
# ==========================================
NEXT_PUBLIC_APP_URL="https://meetvina.app"
NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION="your-google-search-console-verification-code"

# ==========================================
# 3. AI Providers
# ==========================================
# Supported: "groq" (recommended), "gemini", "anthropic", or "openai"
AI_PROVIDER="groq"
GROQ_API_KEY="gsk_..."
GEMINI_API_KEY="AIzaSy..."
# Optional alternatives:
ANTHROPIC_API_KEY=""
OPENAI_API_KEY=""

# ==========================================
# 4. Google Cloud OAuth (Gmail API Sending)
# ==========================================
GOOGLE_CLIENT_ID="your-client-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="GOCSPX-..."

# ==========================================
# 5. Security & Refresh Token Encryption
# ==========================================
# 32-byte (64-character hex) key for AES-256-GCM token encryption at rest
# Generate on Linux/macOS with: openssl rand -hex 32
TOKEN_ENCRYPTION_KEY="your-64-character-hex-encryption-key"

# ==========================================
# 6. Dodo Payments (Subscriptions)
# ==========================================
DODO_PAYMENTS_API_KEY="live_... or test_..."
DODO_PAYMENTS_WEBHOOK_KEY="whsec_..."
DODO_PAYMENTS_PRODUCT_ID="pdt_..."
DODO_PAYMENTS_ENVIRONMENT="live_mode" # 'test_mode' for local testing, 'live_mode' for production

# ==========================================
# 7. Resend (Contact Form & Transactional)
# ==========================================
RESEND_API_KEY="re_..."
CONTACT_RECEIVER_EMAIL="support@meetvina.app"
```

---

## 4. Database Setup (Supabase)

1. Open your [Supabase Dashboard](https://supabase.com/dashboard).
2. Go to the **SQL Editor**.
3. Paste and run the entire contents of [`supabase/schema.sql`](supabase/schema.sql).
4. The script automatically configures:
   - **`profiles`**: User metadata, plan tier (`free` / `pro`), sender signatures, and Dodo IDs.
   - **`resume`**: PDF references, parsed skills summary, and limits (1 version for Free, up to 3 for Pro).
   - **`sent_emails`**: Complete audit log of sent letters, Gmail message/thread IDs, and follow-up chains.
   - **`gmail_connections`**: Encrypted refresh tokens, IVs, and auth tags.
   - **Row-Level Security (RLS)**: Enforces that users can only view and mutate their own data.
   - **Storage Bucket (`resumes`)**: Creates a private bucket with RLS isolating files to `resumes/{user_id}/*`.

---

## 5. Google Cloud Console Setup (Gmail API)

To allow users to send application letters directly from their own Gmail accounts:

1. Open the [Google Cloud Console](https://console.cloud.google.com).
2. Create or select a project (e.g. `Vina - Job Application Letters`).
3. Enable the **Gmail API**:
   - Go to **APIs & Services** > **Library** > Search for **Gmail API** > Click **Enable**.
4. Configure **OAuth Consent Screen**:
   - User Type: **External**
   - App Name: `Vina`
   - User Support Email: `your-email@meetvina.app`
   - App Domain Homepage: `https://meetvina.app`
   - Privacy Policy: `https://meetvina.app/privacy`
   - Terms of Service: `https://meetvina.app/terms`
   - Authorized Domains: `meetvina.app`
5. Add OAuth Scopes:
   - `https://www.googleapis.com/auth/gmail.send` *(Sensitive - Send emails on behalf of user)*
   - `https://www.googleapis.com/auth/gmail.readonly` *(Verify connection)*
   - `https://www.googleapis.com/auth/userinfo.email` *(Identify user email address)*
6. Create **OAuth 2.0 Client ID**:
   - Application Type: **Web Application**
   - Name: `Vina Production Web Client`
   - **Authorized JavaScript Origins**:
     - `https://meetvina.app`
     - `http://localhost:3000` *(for local development)*
   - **Authorized Redirect URIs**:
     - `https://meetvina.app/api/gmail/callback`
     - `http://localhost:3000/api/gmail/callback` *(for local development)*

> **Note on Verification**: In Google's "Testing" status, users explicitly added under "Test Users" in the Google Cloud Console can authorize Gmail immediately. To accept general public users, submit the app for verification. Because Vina links directly to its privacy policy disclosing limited Google API use, verification typically completes smoothly.

---

## 6. Dodo Payments Setup

1. Log into your [Dodo Payments Dashboard](https://app.dodopayments.com).
2. Create a Product:
   - Title: `Vina Pro`
   - Billing: Recurring Monthly Subscription
   - Price: `$9.00 USD` (or INR equivalent for Indian customers)
   - Copy the Product ID into `DODO_PAYMENTS_PRODUCT_ID`.
3. Configure Webhook:
   - Endpoint URL: `https://meetvina.app/api/billing/webhook`
   - Events subscribed:
     - `subscription.active`
     - `subscription.cancelled`
     - `subscription.failed`
     - `payment.succeeded`
   - Copy the Webhook Secret into `DODO_PAYMENTS_WEBHOOK_KEY`.

---

## 7. Supabase Custom SMTP (Crucial Pre-Launch Step)

> **Important**: Supabase's default email service has a strict rate limit of **2 emails per hour** for user signups, email confirmations, and password resets. Any third user will receive a `429 Too Many Requests` error.

Before launching to the public on `meetvina.app`:
1. In your [Supabase Dashboard](https://supabase.com/dashboard), navigate to **Authentication** > **Settings** > **SMTP Settings**.
2. Toggle on **Enable Custom SMTP**.
3. Use a provider like **Resend**, **Postmark**, or **SendGrid**:
   - Host: `smtp.resend.com`
   - Port: `587`
   - User: `resend`
   - Password: `re_...` (Resend API Key)
   - Sender Email: `auth@mail.meetvina.app` (or `noreply@mail.meetvina.app`)
   - Sender Name: `Vina`

---

## 8. Deployment to Vercel

1. Push your repository to GitHub.
2. In [Vercel](https://vercel.com), click **Add New Project** and import `ai-cold-email-sender`.
3. Add all environment variables from Section 3.
4. Deploy the project.
5. In **Project Settings** > **Domains**:
   - Add `meetvina.app` and `www.meetvina.app`.
   - Update your domain DNS records (A Record `@` -> `76.76.21.21` or CNAME `cname.vercel-dns.com`).

---

## 9. Google Search Console & SEO Submission

1. Open [Google Search Console](https://search.google.com/search-console).
2. Add Property: `https://meetvina.app`.
3. Verification:
   - **Method A (HTML Tag)**: Copy the verification code and set `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION="your-code"` in Vercel environment variables, then redeploy.
   - **Method B (DNS TXT)**: Add the Google TXT record to your `meetvina.app` DNS provider.
4. Once verified, go to **Sitemaps** and submit:
   ```text
   https://meetvina.app/sitemap.xml
   ```

---

## 10. Local Development

```bash
# 1. Install dependencies
npm install

# 2. Start development server
npm run dev

# 3. Compile and verify production build
npm run build
```

Open [http://localhost:3000](http://localhost:3000) to start testing.
