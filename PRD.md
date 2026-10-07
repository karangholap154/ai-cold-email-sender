# PRD: AI Cold Email Sender (Multi-User)

## 1. Overview

A web application where a user pastes a Job Description (JD) and an HR email address. An AI model analyzes the JD, generates a tailored, professional cold email, and sends it via the user's own connected Gmail account with their resume PDF attached. Built as a multi-user product with a freemium pricing model.

**Owner:** Karan  
**Scope:** Multi-user product, freemium pricing  
**Status:** Living v4 — aligned with the current product (Sep 2026). Unbuilt items stay listed as such.

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
- No bulk/batch sending in v1 — one JD + one HR email per submission (follow-ups are a separate, one-at-a-time Pro action).
- No CRM-style pipeline view in v1 (may be a later feature).
- No team/organization accounts in v1 — individual users only.

## 5. User Stories

- As a new user, I want to sign up and connect my Gmail so I can start sending tailored emails under my own identity.
- As a user, I want to paste a JD and HR email so that I get a ready-to-send, tailored email without writing it myself.
- As a user, I want to review/edit the AI-generated email before sending, so I retain control over what goes out under my name.
- As a user, I want my resume automatically attached, so I don't have to re-upload it every time.
- As a user, I want a saved sender signature (name, links, sign-off) appended consistently so I don't retype it on every draft.
- As a user, I want a log of past sends, so I know which companies/roles I've already emailed.
- As a Pro user, I want to draft a polite follow-up on a previous send so it lands in the same Gmail thread.
- As a free-tier user, I want to try the tool with a reasonable number of sends before deciding to pay.
- As a paying user, I want higher/unlimited sends and priority support in exchange for a subscription.

## 6. Core Features

### 6.1 Account & Gmail Connection
- Email + password signup/login via Supabase Auth (email verification when confirmation is enabled).
- Public marketing homepage (`/`), plus `/privacy` and `/terms` for Google OAuth / product compliance.
- Authenticated app surfaces: `/draft` (compose + review), `/log` (send history), `/settings` (Gmail, resume, signature, billing).
- Settings lets the user connect Gmail via OAuth. Requested scopes:
  - `gmail.send` — send user-approved messages via `users.messages.send`.
  - `gmail.readonly` — list/fetch **limited** message metadata so follow-ups can nest in the existing Gmail thread (search by recipient, read `threadId` / RFC 2822 `Message-ID` on messages we sent). Not used to scrape the inbox, contacts, or incoming mail for any other purpose.
  - `userinfo.email` — store the connected Gmail address for From/status UI.
- Gmail connection status is shown clearly (`GET /api/gmail/status`); sending is blocked with a clear "Connect Gmail" prompt if not yet connected.

### 6.2 JD Input & Analysis
- Textarea on `/draft` to paste raw JD text (minimum length enforced server-side).
- On generate, JD is sent to an LLM that extracts: role title, company name (if inferable), 2–4 key required skills, and seniority level, and drafts subject + body in one step.

### 6.3 Email Generation
- LLM generates: subject line + email body (professional, concise, references extracted skills, avoids generic filler).
- User's resume skills summary (Settings) and sender signature block are included so the email matches background and signs off correctly.
- Provider is configurable (`AI_PROVIDER`): **Groq** is the default (with automatic **Gemini** fallback); Anthropic and OpenAI remain supported via env keys.

### 6.4 Review & Edit
- Generated subject + body shown in an editable form before sending, rendered inside a letter-shaped frame (Section 8, Layout).
- Extracted role/company shown as a confirmation strip above the email, so misreads are caught before they're skimmed past.
- User can regenerate (re-run AI) or manually tweak text. Free tier: **2 regenerations per draft**; Pro: unlimited.
- Duplicate `hr_email` (already sent by this user) triggers an **inline warning** on the draft/review screen — not a hard block.

### 6.5 Send via Gmail
- On confirm, the backend builds an RFC 2822 MIME message (Nodemailer stream transport, including optional resume PDF) and sends it via the **Gmail API** using the user's stored OAuth token (not SMTP/app password — see Section 10).
- Resume PDF (pre-uploaded, stored in Supabase Storage bucket `resumes`) is attached automatically when present.
- HR email address entered per-submission (not stored as a contact list in v1).
- Send is a visually distinct, deliberate action — never styled the same as "Regenerate."
- Send is blocked (with a clear upgrade prompt) once a free-tier user hits their monthly cap.

### 6.6 Follow-up correspondence (Pro)
- From the send log, Pro users can draft a follow-up from a previous sent letter.
- Follow-up generation is a separate AI prompt (shorter body, `Re:` subject). Enforced server-side on analyze and send (`PRO_FEATURE_REQUIRED` for free users).
- Send path threads into Gmail: stored `gmail_thread_id` / `gmail_message_id`, `In-Reply-To` / `References` headers, and if needed a `gmail.readonly` messages list query (`q=to:{hrEmail}`).
- Logged as `email_type = followup` with optional `parent_email_id`. Log UI groups initial + follow-ups as a conversation.

### 6.7 Send Log
- Every send (or failed attempt) is recorded per user: timestamp, HR email, company/role (extracted), subject, body, status (sent/failed), plus follow-up/thread fields when present.
- Hairline-bordered list view, searchable by company or HR email; rows can open the Gmail thread when `gmail_thread_id` is known.
- Free plan: API returns the last **30 days** of history (older rows remain in the DB; UI can prompt to upgrade for lifetime history). Pro: full history.

### 6.8 Resume Management
- One resume PDF per user (upload/replace in Settings; PDF only, max 10MB). Unique `user_id` on `resume` in v1.
- Optional short text summary of key skills/experience, editable, used to give the AI more context than the raw PDF.
- Multiple resume versions remain a **Pro marketing / v2 candidate** — not implemented yet (see Section 7).

### 6.9 Sender signature
- Profile fields: full name, sign-off, portfolio / GitHub / LinkedIn URLs, phone, or a raw custom signature block.
- Appended after generation so the model is instructed not to invent a competing sign-off.

### 6.10 Pricing & Plans
- Two tiers: **Free** and **Pro** (see Section 9 for the pricing table).
- Plan status stored per user; feature gates (send cap, regenerations, follow-ups, log window) enforced server-side, not just hidden in the UI.
- Upgrade via **Dodo Payments** Checkout (`POST /api/billing/checkout`). Manage/cancel via Dodo Customer Portal (`POST /api/billing/portal`). Subscription lifecycle via `POST /api/billing/webhook` (Svix signature verification).

## 7. Out of Scope / still unbuilt (Future Ideas)

These were called out earlier and are **not** shipped yet — leave them as follow-on work:

- Multiple resume versions (homepage/settings may mention this; schema still enforces one resume per user).
- Follow-up **scheduling/reminders** (manual one-click follow-up **is** shipped for Pro; timed/auto send is not).
- Reply detection (via Gmail API) to mark leads as "responded."
- Basic analytics: response rate by role type/company size.
- Team/organization accounts.
- Open/click tracking.

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
- Pricing: two columns (Free / Pro) on the public homepage (`/#pricing`) and in Settings.

### 8.5 Libraries

| Purpose | Library |
|---|---|
| Forms (JD input, HR email, resume upload, signup/login) | React Hook Form + Zod (where used); native forms on auth |
| Accessible primitives (dialogs, tooltips, dropdowns) | Radix UI / shadcn |
| Component starting points | shadcn/ui (customized, not shipped as default look) |
| Editable email body | Plain `<textarea>` with autosize (`react-textarea-autosize`) — no rich text editor |
| Send-log table | TanStack Table |
| Feedback (sent/failed toasts) | Sonner |
| Icons | Lucide |
| Deliberate motion (generation-reveal only) | Motion (Framer Motion), used once, nowhere else |
| MIME construction | Nodemailer `streamTransport` (message is then sent through Gmail API, not SMTP) |
| Payments | Dodo Payments (Checkout + Customer Portal + webhooks); **not Stripe** |
| Auth | Supabase Auth (email + password, email verification when enabled) |

## 9. Pricing & Plans

| | **Free** | **Pro** |
|---|---|---|
| Price | $0 | $9/month (₹499/month listed on the homepage) |
| Emails sent | 5 per calendar month (UTC month on send; profile usage uses local month start) | Unlimited (no soft cap implemented yet) |
| Resume versions | 1 | Multiple (**not built yet** — still one resume in product) |
| AI regenerations per draft | 2 | Unlimited |
| Follow-up drafts/sends | Not included | Included (server-gated) |
| Send log history | Last 30 days in the log API | Full history |
| Duplicate-contact detection | Included (warning) | Included (warning) |
| Support | Community/self-serve | Priority (email, faster response) as stated on marketing |

Notes:
- Free tier exists to let people prove value to themselves before paying — not as a crippled trial. 5 real, well-tailored sends is enough to judge whether the tool is worth it.
- "Unlimited" on Pro should still have a **documented future soft cap** (e.g. 200/month) to protect Gmail sending health and server cost — **not enforced today**.
- Billing state (`free` / `pro`, Dodo customer/subscription IDs, current period end) stored on the user row in Supabase. Legacy `stripe_*` columns may still exist in older schema dumps; **runtime billing is Dodo**. All gating logic checks plan server-side on send/analyze, not just client-side UI hiding.
- Dodo Checkout supports UPI in India and cards / Apple Pay globally (as stated on the homepage).

## 10. Tech Stack

| Layer | Choice |
|---|---|
| Frontend | Next.js (App Router) + TypeScript + Tailwind CSS |
| Backend | Next.js Route Handlers (`app/api/...`); session refresh via `proxy.ts` + Supabase middleware |
| AI | `AI_PROVIDER`: Groq (default) with Gemini fallback; optional Anthropic (Haiku) or OpenAI (gpt-4o-mini) |
| Email sending | Gmail API (`users.messages.send`) with per-user OAuth2 refresh tokens; MIME via Nodemailer |
| Gmail extras | `users.messages.list` + `users.messages.get` (metadata) for threading — requires `gmail.readonly` |
| Auth | Supabase Auth (email + password; built-in email verification) |
| Database | Supabase (Postgres) + RLS |
| File storage | Supabase Storage bucket `resumes` (private, per-user folder) |
| Payments | Dodo Payments (Checkout sessions, customer portal, webhooks + Svix) |
| Transactional email (post-MVP) | Resend, via Supabase custom SMTP — **integrated** (`mail.meetvina.app`) |
| Hosting | Vercel |

## 11. Data Model (Supabase)

**`profiles`** (extends `auth.users`)
- `id` (matches `auth.users.id`)
- `plan` (enum-like: `free`, `pro`)
- `dodo_customer_id` (text, nullable)
- `dodo_subscription_id` (text, nullable)
- `current_period_end` (timestamp, nullable)
- Sender signature: `full_name`, `sign_off`, `portfolio_url`, `github_url`, `linkedin_url`, `phone`, `custom_signature`
- Legacy (unused by current billing): `stripe_customer_id`, `stripe_subscription_status` may still exist
- `created_at`, `updated_at`

**`gmail_connections`**
- `id`
- `user_id` (FK → auth user)
- `gmail_address` (text)
- `refresh_token_encrypted`, `iv`, `tag` (AES-256-GCM at rest)
- `connected_at`
- `revoked_at` (nullable)
- Unique active connection per user

**`resume`**
- `id`
- `user_id` (FK → profiles; unique — one row per user in v1)
- `file_url` (Supabase Storage path)
- `file_name` (text, nullable)
- `skills_summary` (text, editable)
- `created_at`, `updated_at`

**`sent_emails`**
- `id`
- `user_id` (FK → profiles)
- `jd_text` (text)
- `hr_email` (text)
- `company_name` (text, nullable, AI-extracted)
- `role_title` (text, nullable, AI-extracted)
- `generated_subject` / `generated_body`
- `final_subject` / `final_body`
- `status` (enum: `sent`, `failed`, `draft`)
- `error_message` (text, nullable)
- `email_type` (`initial` \| `followup`)
- `parent_email_id` (FK → sent_emails, nullable)
- `gmail_message_id`, `gmail_thread_id` (nullable)
- `created_at`

## 12. System Flow

1. User signs up / logs in (Supabase Auth); session cookies refreshed on matched routes.
2. User connects Gmail via OAuth (`gmail.send` + `gmail.readonly` + `userinfo.email`); refresh token stored encrypted (AES-256-GCM).
3. User optionally uploads a resume and saves a signature in Settings.
4. User pastes JD text + HR email on `/draft`.
5. Frontend calls `POST /api/analyze` (`{ jdText }`) → AI returns `{ subject, body, companyName, roleTitle, skills?, seniority? }`.
6. Frontend shows the letter-frame review screen with the confirmation strip; duplicate HR check via `GET /api/emails?email=`.
7. User edits/regenerates as needed, clicks "Send."
8. Backend checks plan limits (`sent_emails` count this month vs. free cap of 5).
9. If within limits: backend refreshes the Gmail access token, builds MIME (resume attached), sends via Gmail API, then may `messages.get` metadata for the real Message-ID.
10. Backend writes a row to `sent_emails` with status `sent` or `failed`.
11. Frontend shows a Sonner toast; log view refreshes.
12. If plan limit is hit: backend returns `PLAN_LIMIT_REACHED`; frontend shows an inline upgrade prompt.
13. **Follow-up (Pro):** log → generate with `POST /api/analyze` `{ type: "followup", parentEmailId, ... }` → send with `emailType: "followup"` so the message is threaded.

## 13. API Design

**`POST /api/analyze`** — `{ jdText }` or `{ type: "followup", parentEmailId, ... }` → `{ subject, body, companyName?, roleTitle?, ... }` (follow-up requires Pro)

**`POST /api/send`** — `{ hrEmail, subject, body, jdText?, companyName?, roleTitle?, emailType?, parentEmailId? }` → `{ success, messageId?, threadId?, error? }`

**`GET /api/emails`** — logged-in user's `sent_emails` (30-day window on free). Query `?email=` for duplicate check; `?id=` for a single row (follow-up context)

**`GET` / `POST /api/resume`** — fetch or upload/replace the logged-in user's resume + skills summary

**`GET` / `POST /api/profile`** — signature fields + `{ usage: { monthlySends, monthlyLimit, plan } }`

**`GET /api/gmail/connect`** — starts the OAuth flow (redirect to Google consent screen)

**`GET /api/gmail/callback`** — handles the OAuth redirect, exchanges code for tokens, stores encrypted refresh token + Gmail address

**`GET /api/gmail/status`** — `{ connected, email?, connectedAt? }`

**`POST /api/gmail/disconnect`** — revokes token with Google and marks/removes the stored connection

**`POST /api/billing/checkout`** — creates a Dodo Payments Checkout session for upgrading to Pro

**`POST /api/billing/webhook`** — Dodo subscription events (`subscription.active` / `renewed` / `updated` / `cancelled` / `expired` / `paused`); updates `profiles.plan` and Dodo IDs

**`POST /api/billing/portal`** — Dodo Customer Portal session (or fallback login URL)

**`GET /auth/callback`** — Supabase Auth email-confirm / OAuth callback into the app

## 14. AI Prompt Design

System-level instruction (initial outreach) lives in `lib/ai.ts`: extract company/role/skills/seniority; write 80–130 words; greeting on first line; no invented signature (appended in code); JSON-only response.

Follow-up system prompt: 50–85 words, `Re:` subject, no needy clichés; JSON-only.

Input: JD text (truncated ~3500 chars) + stored skills summary + signature. Output: structured JSON, parsed into the review form; signature applied in `applySignature`.

## 15. Security & Access

- Gmail refresh tokens are encrypted at rest with **AES-256-GCM** (`TOKEN_ENCRYPTION_KEY`, 32-byte hex) plus per-row `iv` and `tag` — never stored as plaintext.
- OAuth scopes are the minimum for **send + thread follow-ups + identify Gmail address**. `gmail.readonly` is used only for those threading/metadata calls, not for reading inbox contents into the product or for model training.
- Dodo webhook verification (Svix) on every incoming webhook event.
- All plan-limit checks, follow-up gates, and Gmail-send logic happen server-side; nothing enforced only in the client.
- API keys (AI, Dodo secret, Supabase service role, Google client secret, token encryption key) never exposed client-side.
- Storage and tables are RLS-scoped to `auth.uid()`.

## 16. Cost Estimate

| Item | Cost |
|---|---|
| Vercel (Hobby → Pro if traffic grows) | Free to start |
| Supabase (Free tier → Pro as usage grows) | Free to start |
| AI API calls | Groq/Gemini-class at MVP volume; track per-send cost against the free-tier cap |
| Dodo Payments | Per-transaction fees on Pro subscriptions (no Stripe monthly fee) |
| Resend (once integrated) | Free tier: 3,000 emails/month, sufficient well past MVP |
| Google OAuth verification | Free, but time cost (privacy policy, homepage, possible CASA review) — see Risks |

## 17. Risks & Mitigations

| Risk | Mitigation |
|---|---|
| Gmail flags a user's account for spam-like sending patterns | Enforce plan caps server-side; encourage genuinely distinct, JD-driven emails, not templated blasts |
| AI generates inaccurate company/role extraction | Confirmation strip on review screen, always shown before sending |
| Restricted Gmail scopes require Google app verification past ~100 test users | Start Google's OAuth consent screen verification early (Phase 10), not after hitting the limit; privacy policy must list **all** requested scopes including `gmail.readonly` |
| Gmail refresh token exposure | Encrypt at rest; revoke on disconnect |
| Free tier costs more in AI/infra than it earns in conversions | Track AI cost per send against conversion rate; adjust free cap if needed |
| Supabase's built-in email (2/hour) blocks real signups | Integrate Resend via custom SMTP before opening signups beyond personal testing |
| Polished UI causes user to skim past AI errors | Distinct, deliberate "Send" styling; letter-frame rendering; duplicate warning inline |
| `gmail.readonly` looks like inbox access to users | Copy and privacy policy should say it is for **threading follow-ups and sent-message metadata only** |

## 18. Success Metrics

- Time from pasting JD to email sent: under 1 minute.
- Zero unintentional duplicate emails sent to the same HR contact per user (warn, don't silently send a second "first" outreach without the user seeing the warning).
- Free-to-paid conversion rate (track once live).
- Personal/subjective: emails "feel" tailored enough that recipients could plausibly think they were hand-written.

## 19. Build Phases

Broken into small, single-focus steps. **Struck-through or "done" notes** mean the product already matches; remaining bullets are still open.

### Phase 0 — Project setup — done
1. Init Next.js (App Router) + TypeScript project.
2. Install and configure Tailwind CSS.
3. Set up Supabase project (Postgres + Storage bucket + Auth enabled).
4. Add environment variables (`.env.local`) for Supabase, AI API keys, **Dodo Payments**, Google OAuth client, `TOKEN_ENCRYPTION_KEY`.
5. Deploy an empty shell to Vercel to confirm the pipeline works end to end.

### Phase 1 — Design foundation — done
6. Add Fraunces and IBM Plex Sans via next/font.
7. Define Tailwind theme tokens for the color palette (Paper, Ink, Muted ink, Seal, Confirmed, Hairline).
8. Build a base typography scale using the two typefaces.
9. Install Radix / shadcn/ui, customize base component styles to match the theme.
10. Install Lucide for icons.

### Phase 2 — Auth (multi-user) — done
11. Build signup page (email + password) using Supabase Auth.
12. Build login page.
13. Confirm built-in email verification flow works (fine at 2/hour while solo-testing).
14. Build session handling (protected `/draft`, `/settings`, `/log`).
15. Create `profiles` table, auto-populate on signup (default `plan = free`).

### Phase 3 — Gmail connection — done
16. Create Google Cloud project, configure OAuth consent screen (testing mode).
17. Request `gmail.send`, `gmail.readonly`, and `userinfo.email`.
18. Build `GET /api/gmail/connect` (redirect to Google consent).
19. Build `GET /api/gmail/callback` (exchange code, get refresh token).
20. Encrypt refresh tokens before storing (app-level AES-256-GCM).
21. Create `gmail_connections` table, save connection on successful callback.
22. Build Settings UI: "Connect Gmail" button, connected-state display, "Disconnect" action.

### Phase 4 — Resume management — done (single resume)
23. Build resume upload UI (single file, PDF only), scoped to the logged-in user.
24. Wire upload to Supabase Storage with per-user paths.
25. Add `resume` table with `user_id`; save `file_url` on upload.
26. Build skills-summary text field (editable, saved alongside resume).

### Phase 5 — JD input & AI analysis — done
27. Build JD input form (textarea) with validation.
28. Add HR email field with validation.
29. Build `POST /api/analyze` route.
30. Write and test the AI prompt for extraction + generation (Section 14).
31. Parse AI response into structured `{ subject, body, companyName, roleTitle, ... }`.
32. Handle AI errors/timeouts gracefully (including Groq → Gemini fallback).

### Phase 6 — Review & edit screen — done
33. Build the letter-shaped frame component (line-length constrained, Fraunces subject line).
34. Render generated subject/body as editable fields (autosizing textarea).
35. Add the confirmation strip showing extracted company/role above the letter frame.
36. Add "Regenerate" action (capped on free).
37. Style "Send" as a visually distinct primary action (Seal gold accent).
38. Add the one deliberate motion moment: fade/reveal animation on generated content.

### Phase 7 — Sending via Gmail API — done
39. Build token-refresh logic (exchange stored refresh token for a fresh access token).
40. Build `POST /api/send`: fetch resume from Storage, construct MIME message, attach PDF, call `users.messages.send`.
41. Handle send success/failure, return clear status to frontend.
42. Add Sonner toast for confirmation/failure states.
43. Disable/lock Send button while a request is in flight.

### Phase 8 — Logging & duplicate detection — done
44. Create `sent_emails` table with `user_id`.
45. Write a row on every send attempt (success or failure).
46. Build `GET /api/emails`, scoped to the logged-in user.
47. Build the log view: plain hairline-separated list.
48. Add search/filter by company name or HR email.
49. Add duplicate-detection check before send; show inline warning on the review screen.

### Phase 8b — Signature + follow-ups — done
- Profile signature fields and `POST /api/profile`.
- Follow-up AI + Pro gates + Gmail threading + log grouping.

### Phase 9 — Pricing & billing — done (Dodo, not Stripe)
50. Define Free/Pro feature limits (Section 9).
51. Set up Dodo Payments product/price (`DODO_PAYMENTS_PRODUCT_ID`).
52. Pricing on homepage + Settings.
53. `POST /api/billing/checkout` and redirect flow.
54. `POST /api/billing/webhook`, update `profiles.plan` on subscription events.
55. Dodo Customer Portal for managing/cancelling a subscription.
56. Enforce the free-tier send cap server-side in `/api/send`.
57. Inline "upgrade" prompt when a free user hits their cap.

### Phase 10 — Google OAuth verification — still open
58. Write a privacy policy page (exists; **keep in sync** with actual scopes, including `gmail.readonly`).
59. Build a public homepage describing the app (exists).
60. Submit the OAuth consent screen for Google's verification review.
61. Prepare for a possible CASA security assessment if requested.

### Phase 11 — Transactional email upgrade — done
62. Create a Resend account, verify a sending domain (`mail.meetvina.app`).
63. Configure Resend as custom SMTP in Supabase Auth settings (`smtp.resend.com:587`).
64. Raise the Supabase auth email rate limit accordingly.
65. Re-test signup/verification flow end-to-end at expected real-world volume.

### Phase 12 — Polish & QA — ongoing
66. Full pass on empty states (no resume, no Gmail connected, no sends yet).
67. Full pass on error states (AI failure, send failure, upload failure, payment failure).
68. Responsive check down to mobile width.
69. Keyboard navigation and visible focus states check.
70. Reduced-motion check (Phase 6 reveal animation respects `prefers-reduced-motion`).
71. Final review: confirm no AI-tool chrome crept in anywhere, including the pricing page.
72. Align in-app copy (Settings/homepage FAQ) with real Gmail scopes — some UI still says "gmail.send only."

## 20. Open Questions

- Final Free/Pro pricing numbers — validate $9/month (₹499) and the 5-email free cap against what similar tools charge before committing.
- Should duplicate `hr_email` entries be hard-blocked or just flagged with a warning? (**Current: warning only.**)
- Should the skills summary be free text, or structured (list of skills + experience bullets)? (**Current: free text.**)
- Multiple resume versions on Pro — needed at launch, or a fast-follow? (**Still unbuilt.**)
- Annual pricing option, or monthly-only at launch? (**Monthly-only via Dodo product today.**)
- Enforce a Pro soft send cap for Gmail health?
- Tighten privacy policy + Settings copy so `gmail.readonly` is disclosed consistently.
