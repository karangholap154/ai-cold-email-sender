# PRD: AI Cold Email Sender (Multi-User)

## 1. Overview

A web application where a user pastes a Job Description (JD) and an HR email address. An AI model analyzes the JD, generates a tailored, professional cold email, and sends it via the user's own connected Gmail account with their resume PDF attached. Built as a multi-user product with a freemium pricing model.

**Owner:** Karan
**Scope:** Multi-user product, freemium pricing
**Status:** Draft v3

## 2. Problem Statement

Manually writing a tailored cold email for every job application is repetitive and time-consuming. Emails often end up generic when done in bulk, or take too long when done carefully. This tool automates the writing step while keeping sending under each user's own control and identity (their own Gmail, their own resume) — and is priced to be accessible for free at low volume, with a paid tier for people applying at scale.

## 3. Goals

- Reduce time to send a tailored cold email from ~10-15 minutes to under 1 minute.
- Keep each generated email specific to the JD (skills mentioned, role title, company name if present).
- Let each user connect their own Gmail account safely (their credentials, their sending identity).
- Maintain a per-user log of every JD/email sent, to avoid duplicate outreach.
- A review step that actually gets read, not rubber-stamped — the design should slow the user down at the one moment that matters (before sending).
- A free tier accessible enough to prove value, with a paid tier that removes friction for high-volume job seekers.

## 4. Non-Goals (v1)

- No automated job scraping or auto-discovery of JDs (JD is manually pasted).
- No email tracking (opens/replies) in v1.
- No bulk/batch sending in v1 — one JD + one HR email per submission.
- No CRM-style pipeline view in v1 (may be a later feature).
- No team/organization accounts in v1 — individual users only.

## 5. User Stories

- As a new user, I want to sign up and connect my Gmail so I can start sending tailored emails under my own identity.
- As a user, I want to paste a JD and HR email so that I get a ready-to-send, tailored email without writing it myself.
- As a user, I want to review/edit the AI-generated email before sending, so I retain control over what goes out under my name.
- As a user, I want my resume automatically attached, so I don't have to re-upload it every time.
- As a user, I want a log of past sends, so I know which companies/roles I've already emailed.
- As a free-tier user, I want to try the tool with a reasonable number of sends before deciding to pay.
- As a paying user, I want higher/unlimited sends and priority support in exchange for a subscription.

## 6. Core Features

### 6.1 Account & Gmail Connection
- Email + password signup/login via Supabase Auth.
- Post-login, a Settings page lets the user connect their Gmail account via OAuth (`gmail.send` scope only — narrowest scope needed).
- Gmail connection status is shown clearly; sending is blocked with a clear "Connect Gmail" prompt if not yet connected.

### 6.2 JD Input & Analysis
- Textarea to paste raw JD text.
- On submit, JD is sent to an LLM with a prompt that extracts: role title, company name (if inferable), 2-4 key required skills, and seniority level.

### 6.3 Email Generation
- LLM generates: subject line + email body (professional, concise, references extracted skills, avoids generic filler).
- User's resume summary/key skills (stored once in settings) are included in the prompt so the email draws a genuine connection between JD requirements and the user's background.

### 6.4 Review & Edit
- Generated subject + body shown in an editable form before sending, rendered inside a letter-shaped frame (Section 8, Layout).
- Extracted role/company shown as a confirmation strip above the email, so misreads are caught before they're skimmed past.
- User can regenerate (re-run AI) or manually tweak text.

### 6.5 Send via Gmail
- On confirm, email is sent via the **Gmail API** using the user's stored OAuth token (not SMTP/app password — see Section 10).
- Resume PDF (pre-uploaded, stored in Supabase Storage) is attached automatically.
- HR email address entered per-submission (not stored as a contact list in v1).
- Send is a visually distinct, deliberate action — never styled the same as "Regenerate."
- Send is blocked (with a clear upgrade prompt) once a free-tier user hits their monthly cap.

### 6.6 Send Log
- Every send (or failed attempt) is recorded per user: timestamp, HR email, company/role (extracted), subject, body, status (sent/failed).
- Plain hairline-bordered list view (no cards, no shadows), searchable by company or HR email.
- Duplicate `hr_email` triggers an inline warning on the review screen, not buried in the table.

### 6.7 Resume Management
- One resume PDF per user (upload/replace in Settings). Free tier: one resume. Paid tier: multiple resume versions (v2 candidate, see Section 7).
- Optional short text summary of key skills/experience, editable, used to give the AI more context than the raw PDF.

### 6.8 Pricing & Plans
- Two tiers: **Free** and **Pro** (see Section 9 for full pricing table).
- Plan status stored per user; feature gates (send cap, resume versions, support level) enforced server-side, not just hidden in the UI.
- Upgrade flow via Stripe Checkout; downgrade/cancel handled via Stripe Customer Portal.

## 7. Out of Scope for v1 (Future Ideas)
- Multiple resume versions on the free tier.
- Follow-up email scheduling/reminders.
- Reply detection (via Gmail API) to mark leads as "responded."
- Basic analytics: response rate by role type/company size.
- Team/organization accounts.

## 8. Design System

### 8.1 Theme concept
The tool is framed as a **correspondence tool** — drafting and sending a letter that represents the user to a stranger — not as an "AI dashboard." Every visual choice below is grounded in that: ink-on-paper color, a letter-shaped review frame, and restraint everywhere color/motion isn't earned.

### 8.2 Color

| Token | Hex | Role |
|---|---|---|
| Paper | `#F6F5F1` | Background — cool, slightly warm-grey paper tone |
| Ink | `#1E2530` | Primary text — blue-black, fountain-pen ink |
| Muted ink | `#68655C` | Secondary text, timestamps, helper copy |
| Seal (accent) | `#B8823A` | The one warm accent — brass/wax-seal gold. Used only for the primary "Send" action and the generation-reveal moment |
| Confirmed | `#3F6357` | Quiet ink-teal, used only for "sent successfully" states |
| Hairline | `#DEDAD0` | Borders and dividers — thin, never heavy card outlines |

Rule: color is earned, not decorative. Gold appears only at send/generation; teal only on confirmed sends. No gradient washes anywhere — including on the pricing page.

### 8.3 Typography

- **Display/headline:** Fraunces — page title, rendered subject line inside the letter-frame, and pricing tier names.
- **Body/UI:** IBM Plex Sans — everything else, including timestamps, log data, and pricing fine print (tabular figures, no monospace face).
- No all-caps labels, no tracked-out eyebrows, no arrow-suffixed button text, no "MOST POPULAR" badge treatments that clash with the restrained theme — if a plan needs highlighting, use the Seal accent sparingly, not a loud ribbon.

### 8.4 Layout
- Left-aligned throughout — a working tool, not a marketing page (pricing page is the one exception, which can be centered as it's the closest thing to a landing surface).
- Review screen: generated email rendered inside a letter-shaped frame, ~65-70 character line length, generous margins.
- Log view: plain hairline-separated list, no card-per-row, no drop shadows.
- Pricing page: two plain columns (Free / Pro), hairline-separated, not glossy comparison cards.

### 8.5 Libraries

| Purpose | Library |
|---|---|
| Forms (JD input, HR email, resume upload, signup/login) | React Hook Form + Zod |
| Accessible primitives (dialogs, tooltips, dropdowns) | Radix UI Primitives |
| Component starting points | shadcn/ui (customized, not shipped as default look) |
| Editable email body | Plain `<textarea>` with autosize (`react-textarea-autosize`) — no rich text editor |
| Send-log table | TanStack Table |
| Feedback (sent/failed toasts) | Sonner |
| Icons | Lucide |
| Deliberate motion (generation-reveal only) | Motion (Framer Motion), used once, nowhere else |
| Payments | Stripe Checkout + Customer Portal (hosted, not custom-built billing UI) |
| Auth | Supabase Auth (email + password, email verification built-in) |

## 9. Pricing & Plans

| | **Free** | **Pro** |
|---|---|---|
| Price | $0 | $9/month (placeholder — validate before launch) |
| Emails sent | 5/month | Unlimited (or a high soft cap, e.g. 200/month, to protect Gmail sending health) |
| Resume versions | 1 | Multiple |
| AI regenerations per email | 2 | Unlimited |
| Send log history | Last 30 days | Full history |
| Duplicate-contact detection | Included | Included |
| Support | Community/self-serve | Priority (email, faster response) |

Notes:
- Free tier exists to let people prove value to themselves before paying — not as a crippled trial. 5 real, well-tailored sends is enough to judge whether the tool is worth it.
- "Unlimited" on Pro should still have a documented soft cap, both to protect against a single user's Gmail account getting flagged for spam-like volume, and to make server costs predictable.
- Billing state (`free` / `pro`, Stripe customer ID, current period end) stored on the user row in Supabase; all gating logic checks this server-side on every send, not just client-side UI hiding.

## 10. Tech Stack

| Layer | Choice |
|---|---|
| Frontend | Next.js (App Router) + TypeScript + Tailwind CSS |
| Backend | Next.js API Routes / Route Handlers |
| AI | Anthropic or OpenAI API (small/cheap model, e.g. Haiku or GPT-4o-mini class) |
| Email sending | Gmail API (per-user OAuth2 token), not SMTP/app password |
| Auth | Supabase Auth (email + password; built-in email verification) |
| Database | Supabase (Postgres) |
| File storage | Supabase Storage (resume PDFs, per user) |
| Payments | Stripe (Checkout + Customer Portal + webhooks) |
| Transactional email (post-MVP) | Resend, via Supabase custom SMTP — not needed for early development; Supabase's built-in 2 emails/hour cap is fine while testing solo, must be swapped in before real multi-user signups |
| Hosting | Vercel |

## 11. Data Model (Supabase)

**`users`** (managed by Supabase Auth, extended via a `profiles` table)
- `id` (matches `auth.users.id`)
- `plan` (enum: `free`, `pro`)
- `stripe_customer_id` (text, nullable)
- `stripe_subscription_status` (text, nullable)
- `current_period_end` (timestamp, nullable)
- `created_at`

**`gmail_connections`**
- `id`
- `user_id` (FK → profiles)
- `gmail_address` (text)
- `refresh_token_encrypted` (text — encrypted at rest, see Section 15)
- `connected_at`
- `revoked_at` (nullable)

**`resume`**
- `id`
- `user_id` (FK → profiles)
- `file_url` (Supabase Storage path)
- `skills_summary` (text, editable)
- `updated_at`

**`sent_emails`**
- `id`
- `user_id` (FK → profiles)
- `jd_text` (text)
- `hr_email` (text)
- `company_name` (text, nullable, AI-extracted)
- `role_title` (text, nullable, AI-extracted)
- `generated_subject` (text)
- `generated_body` (text)
- `final_subject` (text)
- `final_body` (text)
- `status` (enum: `sent`, `failed`, `draft`)
- `error_message` (text, nullable)
- `created_at`

## 12. System Flow

1. User signs up / logs in (Supabase Auth).
2. User connects Gmail via OAuth (`gmail.send` scope); refresh token stored encrypted.
3. User pastes JD text + HR email.
4. Frontend calls `POST /api/analyze` → AI returns `{ subject, body, companyName, roleTitle }`.
5. Frontend shows the letter-frame review screen with the confirmation strip.
6. User edits/regenerates as needed, clicks "Send."
7. Backend checks the user's plan limits (`sent_emails` count this month vs. plan cap).
8. If within limits: backend refreshes the user's Gmail access token, builds a MIME message with the resume attached, sends via `users.messages.send`.
9. Backend writes a row to `sent_emails` with status `sent` or `failed`.
10. Frontend shows a Sonner toast; log view refreshes.
11. If plan limit is hit: backend returns a specific "limit reached" response; frontend shows an inline upgrade prompt instead of a generic error.

## 13. API Design

**`POST /api/analyze`** — `{ jdText }` → `{ subject, body, companyName?, roleTitle? }`

**`POST /api/send`** — `{ hrEmail, subject, body, jdText, companyName?, roleTitle? }` → `{ success, error? }`

**`GET /api/emails`** — returns the logged-in user's `sent_emails` rows

**`POST /api/resume`** — uploads/replaces the logged-in user's resume + skills summary

**`GET /api/gmail/connect`** — starts the OAuth flow (redirect to Google consent screen)

**`GET /api/gmail/callback`** — handles the OAuth redirect, exchanges code for tokens, stores encrypted refresh token

**`POST /api/gmail/disconnect`** — revokes and removes the stored Gmail connection

**`POST /api/stripe/checkout`** — creates a Stripe Checkout session for upgrading to Pro

**`POST /api/stripe/webhook`** — handles subscription created/updated/cancelled events, updates `profiles.plan`

## 14. AI Prompt Design (Draft)

System-level instruction to the model:
> "You write short, professional cold emails to HR/recruiters applying for a role, based on a job description and the applicant's skill summary. Keep the email under 150 words, reference 2-3 specific skills from the JD that match the applicant's background, avoid generic phrases like 'I am writing to express my interest,' and end with a clear, low-friction call to action. Return the company name and role title if identifiable from the JD."

Input: JD text + stored skills summary. Output: structured JSON, parsed into the review form.

## 15. Security & Access

- Gmail refresh tokens are encrypted at rest (Supabase Vault / `pgsodium`, or app-level AES encryption before insert) — never stored as plaintext.
- `gmail.send` is the only scope requested — narrowest possible for the feature.
- Stripe webhook signature verification on every incoming webhook event.
- All plan-limit checks and Gmail-send logic happen server-side; nothing enforced only in the client.
- API keys (AI, Stripe secret key, Supabase service role key) never exposed client-side.

## 16. Cost Estimate

| Item | Cost |
|---|---|
| Vercel (Hobby → Pro if traffic grows) | Free to start |
| Supabase (Free tier → Pro as usage grows) | Free to start |
| AI API calls | Low-cost at MVP volume, scales with usage — track per-send cost against the free-tier cap to confirm free users don't cost more than they're worth |
| Stripe | No monthly fee, standard per-transaction fee on Pro subscriptions |
| Resend (once integrated) | Free tier: 3,000 emails/month, sufficient well past MVP |
| Google OAuth verification | Free, but time cost (privacy policy, homepage, possible CASA review) — see Risks |

## 17. Risks & Mitigations

| Risk | Mitigation |
|---|---|
| Gmail flags a user's account for spam-like sending patterns | Enforce plan caps server-side; encourage genuinely distinct, JD-driven emails, not templated blasts |
| AI generates inaccurate company/role extraction | Confirmation strip on review screen, always shown before sending |
| `gmail.send` requires Google app verification past ~100 test users | Start Google's OAuth consent screen verification process early (Phase 10), not after hitting the limit |
| Gmail refresh token exposure | Encrypt at rest; narrow scope; rotate/revoke on disconnect |
| Free tier costs more in AI/infra than it earns in conversions | Track AI cost per send against conversion rate; adjust free cap if needed |
| Supabase's built-in email (2/hour) blocks real signups | Integrate Resend via custom SMTP before opening signups beyond personal testing |
| Polished UI causes user to skim past AI errors | Distinct, deliberate "Send" styling; letter-frame rendering; duplicate warning inline |

## 18. Success Metrics

- Time from pasting JD to email sent: under 1 minute.
- Zero duplicate emails sent to the same HR contact per user.
- Free-to-paid conversion rate (track once live).
- Personal/subjective: emails "feel" tailored enough that recipients could plausibly think they were hand-written.

## 19. Build Phases

Broken into small, single-focus steps so each phase is a single sitting of work.

### Phase 0 — Project setup
1. Init Next.js (App Router) + TypeScript project.
2. Install and configure Tailwind CSS.
3. Set up Supabase project (Postgres + Storage bucket + Auth enabled).
4. Add environment variables (`.env.local`) for Supabase, AI API key, Stripe (test mode), Google OAuth client.
5. Deploy an empty shell to Vercel to confirm the pipeline works end to end.

### Phase 1 — Design foundation
6. Add Fraunces and IBM Plex Sans via next/font.
7. Define Tailwind theme tokens for the color palette (Paper, Ink, Muted ink, Seal, Confirmed, Hairline).
8. Build a base typography scale using the two typefaces.
9. Install Radix UI Primitives and shadcn/ui, customize base component styles to match the theme.
10. Install Lucide for icons.

### Phase 2 — Auth (multi-user)
11. Build signup page (email + password) using Supabase Auth.
12. Build login page.
13. Confirm built-in email verification flow works (fine at 2/hour while solo-testing).
14. Build session handling (protected routes, redirect unauthenticated users).
15. Create `profiles` table, auto-populate on signup (default `plan = free`).

### Phase 3 — Gmail connection
16. Create Google Cloud project, configure OAuth consent screen (testing mode).
17. Request `gmail.send` scope only.
18. Build `GET /api/gmail/connect` (redirect to Google consent).
19. Build `GET /api/gmail/callback` (exchange code, get refresh token).
20. Set up encryption for refresh tokens before storing (Supabase Vault or app-level AES).
21. Create `gmail_connections` table, save connection on successful callback.
22. Build Settings UI: "Connect Gmail" button, connected-state display, "Disconnect" action.

### Phase 4 — Resume management
23. Build resume upload UI (single file, PDF only), scoped to the logged-in user.
24. Wire upload to Supabase Storage with per-user paths.
25. Add `resume` table with `user_id`; save `file_url` on upload.
26. Build skills-summary text field (editable, saved alongside resume).

### Phase 5 — JD input & AI analysis
27. Build JD input form (textarea) with React Hook Form + Zod validation.
28. Add HR email field with validation.
29. Build `POST /api/analyze` route.
30. Write and test the AI prompt for extraction + generation (Section 14).
31. Parse AI response into structured `{ subject, body, companyName, roleTitle }`.
32. Handle AI errors/timeouts gracefully.

### Phase 6 — Review & edit screen
33. Build the letter-shaped frame component (line-length constrained, Fraunces subject line).
34. Render generated subject/body as editable fields (autosizing textarea).
35. Add the confirmation strip showing extracted company/role above the letter frame.
36. Add "Regenerate" action.
37. Style "Send" as a visually distinct primary action (Seal gold accent).
38. Add the one deliberate motion moment: fade/reveal animation on generated content.

### Phase 7 — Sending via Gmail API
39. Build token-refresh logic (exchange stored refresh token for a fresh access token).
40. Build `POST /api/send`: fetch resume from Storage, construct MIME message, attach PDF, call `users.messages.send`.
41. Handle send success/failure, return clear status to frontend.
42. Add Sonner toast for confirmation/failure states.
43. Disable/lock Send button while a request is in flight.

### Phase 8 — Logging & duplicate detection
44. Create `sent_emails` table with `user_id`.
45. Write a row on every send attempt (success or failure).
46. Build `GET /api/emails`, scoped to the logged-in user.
47. Build the log view: plain hairline-separated list.
48. Add search/filter by company name or HR email.
49. Add duplicate-detection check before send; show inline warning on the review screen.

### Phase 9 — Pricing & billing
50. Define final Free/Pro feature limits (confirm numbers in Section 9 before building).
51. Set up Stripe account, create a Pro subscription product/price.
52. Build the pricing page (two hairline-separated columns, no glossy cards).
53. Build `POST /api/stripe/checkout` and redirect flow.
54. Build `POST /api/stripe/webhook`, update `profiles.plan` on subscription events.
55. Add Stripe Customer Portal link for managing/cancelling a subscription.
56. Enforce the free-tier send cap server-side in `/api/send` (check current-month count against plan limit).
57. Build the inline "upgrade" prompt shown when a free user hits their cap.

### Phase 10 — Google OAuth verification
58. Write a privacy policy page (required for OAuth consent screen).
59. Build a public homepage describing the app (also required for verification).
60. Submit the OAuth consent screen for Google's verification review.
61. Prepare for a possible CASA security assessment if requested.

### Phase 11 — Transactional email upgrade
62. Create a Resend account, verify a sending domain.
63. Configure Resend as custom SMTP in Supabase Auth settings.
64. Raise the Supabase auth email rate limit accordingly.
65. Re-test signup/verification flow end-to-end at expected real-world volume.

### Phase 12 — Polish & QA
66. Full pass on empty states (no resume, no Gmail connected, no sends yet).
67. Full pass on error states (AI failure, send failure, upload failure, payment failure).
68. Responsive check down to mobile width.
69. Keyboard navigation and visible focus states check.
70. Reduced-motion check (Phase 6 reveal animation respects `prefers-reduced-motion`).
71. Final review: confirm no AI-tool chrome crept in anywhere, including the pricing page.

## 20. Open Questions

- Final Free/Pro pricing numbers — validate $9/month and the 5-email free cap against what similar tools charge before committing.
- Should duplicate `hr_email` entries be hard-blocked or just flagged with a warning?
- Should the skills summary be free text, or structured (list of skills + experience bullets)?
- Multiple resume versions on Pro — needed at launch, or a fast-follow?
- Annual pricing option, or monthly-only at launch?