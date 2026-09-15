# PRD: AI Cold Email Sender (Path A — Personal Use)

## 1. Overview

A personal-use web tool where the user pastes a Job Description (JD) and an HR email address. An AI model analyzes the JD, generates a tailored, professional cold email, and sends it via the user's own Gmail account with a pre-uploaded resume PDF attached.

**Owner:** Karan
**Scope:** Single-user (personal use only, not multi-tenant)
**Status:** Draft v2

## 2. Problem Statement

Manually writing a tailored cold email for every job application is repetitive and time-consuming. Emails often end up generic when done in bulk, or take too long when done carefully. This tool automates the writing step while keeping sending under the user's own control and identity (own Gmail, own resume).

## 3. Goals

- Reduce time to send a tailored cold email from ~10-15 minutes to under 1 minute.
- Keep each generated email specific to the JD (skills mentioned, role title, company name if present).
- Maintain a log of every JD/email sent, to avoid duplicate outreach and track response patterns later.
- Zero/near-zero running cost.
- A review step that actually gets read, not rubber-stamped — the design should slow the user down at the one moment that matters (before sending).

## 4. Non-Goals (Path A specifically)

- No multi-user support, no OAuth login for other people's Gmail accounts.
- No automated job scraping or auto-discovery of JDs (JD is manually pasted).
- No email tracking (opens/replies) in v1.
- No bulk/batch sending in v1 — one JD + one HR email per submission.
- No CRM-style pipeline view in v1 (may be a later feature).

## 5. User Stories

- As the user, I want to paste a JD and HR email so that I get a ready-to-send, tailored email without writing it myself.
- As the user, I want to review/edit the AI-generated email before sending, so I retain control over what goes out under my name.
- As the user, I want my resume automatically attached, so I don't have to re-upload it every time.
- As the user, I want a log of past sends, so I know which companies/roles I've already emailed.
- As the user, I want the email sent from my real Gmail address, so replies land directly in my inbox.
- As the user, I want the review screen to look like an actual letter, so I can judge tone and length the way the recipient will experience it.

## 6. Core Features

### 6.1 JD Input & Analysis
- Textarea to paste raw JD text.
- On submit, JD is sent to an LLM (Claude/GPT) with a prompt that extracts: role title, company name (if inferable), 2-4 key required skills, and seniority level.

### 6.2 Email Generation
- LLM generates: subject line + email body (professional, concise, references the extracted skills, avoids generic filler).
- User's resume summary/key skills (stored once in settings) are included in the prompt so the email can draw a genuine connection between JD requirements and the user's background.

### 6.3 Review & Edit
- Generated subject + body shown in an editable form before sending, rendered inside a letter-shaped frame (see Section 8, Layout).
- Extracted role/company shown as a confirmation strip above the email, so misreads are caught before they're skimmed past.
- User can regenerate (re-run AI) or manually tweak text.

### 6.4 Send via Gmail
- On confirm, email is sent via SMTP using the user's Gmail + App Password.
- Resume PDF (pre-uploaded, stored in Supabase Storage) is attached automatically.
- HR email address entered per-submission (not stored as a contact list in v1).
- Send is a visually distinct, deliberate action — never styled the same as "Regenerate."

### 6.5 Send Log
- Every send (or failed attempt) is recorded: timestamp, HR email, company/role (extracted), subject, body, status (sent/failed).
- Simple hairline-bordered list view (no cards, no shadows) to browse past sends, searchable by company or HR email.
- Duplicate `hr_email` triggers an inline warning shown directly on the review screen, not buried in the table.

### 6.6 Resume Management
- One resume PDF stored at a time (upload/replace in a settings page).
- Optional: short text summary of key skills/experience, editable, used to give the AI more context than the raw PDF.

## 7. Out of Scope for v1 (Future Ideas)
- Multiple resume versions (e.g., per role type).
- Follow-up email scheduling/reminders.
- Reply detection (via Gmail API) to mark leads as "responded."
- Basic analytics: response rate by role type/company size.

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

Rule: color is earned, not decorative. Gold appears only at send/generation; teal only on confirmed sends. No gradient washes anywhere.

### 8.3 Typography

- **Display/headline:** Fraunces — used sparingly: page title, and the rendered subject line inside the letter-frame on the review screen.
- **Body/UI:** IBM Plex Sans — everything else, including timestamps and log data (tabular figures, no monospace face).
- No all-caps labels, no tracked-out eyebrows, no arrow-suffixed button text.

### 8.4 Layout
- Left-aligned throughout — a working tool, not a marketing page.
- Review screen: generated email rendered inside a letter-shaped frame, ~65-70 character line length, generous margins — so it visually resembles what actually lands in an inbox.
- Log view: plain hairline-separated list, no card-per-row, no drop shadows.

### 8.5 Libraries

| Purpose | Library |
|---|---|
| Forms (JD input, HR email, resume upload) | React Hook Form + Zod |
| Accessible primitives (dialogs, tooltips, dropdowns) | Radix UI Primitives |
| Component starting points | shadcn/ui (customized, not shipped as default look) |
| Editable email body | Plain `<textarea>` with autosize (`react-textarea-autosize`) — no rich text editor |
| Send-log table | TanStack Table |
| Feedback (sent/failed toasts) | Sonner |
| Icons | Lucide |
| Deliberate motion (generation-reveal only) | Motion (Framer Motion), used once, nowhere else |

## 9. Tech Stack

| Layer | Choice |
|---|---|
| Frontend | Next.js (App Router) + TypeScript + Tailwind CSS |
| Backend | Next.js API Routes / Route Handlers |
| AI | Anthropic or OpenAI API (small/cheap model, e.g. Haiku or GPT-4o-mini class) |
| Email sending | Nodemailer via Gmail SMTP + App Password |
| Database | Supabase (Postgres) |
| File storage | Supabase Storage (resume PDF) |
| Hosting | Vercel |
| Auth | None needed (single user, protected by Vercel deployment protection or a simple login gate) |

## 10. Data Model (Supabase)

**`resume`** (single row, or latest-wins)
- `id`
- `file_url` (Supabase Storage path)
- `skills_summary` (text, editable)
- `updated_at`

**`sent_emails`**
- `id`
- `jd_text` (text)
- `hr_email` (text)
- `company_name` (text, nullable, AI-extracted)
- `role_title` (text, nullable, AI-extracted)
- `generated_subject` (text)
- `generated_body` (text)
- `final_subject` (text) — after any user edits
- `final_body` (text)
- `status` (enum: `sent`, `failed`, `draft`)
- `error_message` (text, nullable)
- `created_at`

## 11. System Flow

1. User pastes JD text + HR email into the form.
2. Frontend calls `POST /api/analyze` → sends JD + stored resume skills summary to the AI → returns `{ subject, body, company_name, role_title }`.
3. Frontend displays generated subject/body inside the letter-frame, editable, with the confirmation strip above it.
4. User reviews, edits if needed, clicks "Send."
5. Frontend calls `POST /api/send` with `{ hr_email, subject, body }`.
6. Backend fetches resume PDF from Supabase Storage, builds MIME email with Nodemailer, sends via Gmail SMTP.
7. Backend writes a row to `sent_emails` with status `sent` or `failed`.
8. Frontend shows success/failure toast (Sonner); log table refreshes.

## 12. API Design

**`POST /api/analyze`**
Request: `{ jdText: string }`
Response: `{ subject: string, body: string, companyName?: string, roleTitle?: string }`

**`POST /api/send`**
Request: `{ hrEmail: string, subject: string, body: string, jdText: string, companyName?: string, roleTitle?: string }`
Response: `{ success: boolean, error?: string }`

**`GET /api/emails`**
Response: list of past `sent_emails` rows (for the log view).

**`POST /api/resume`**
Uploads/replaces resume PDF + skills summary.

## 13. AI Prompt Design (Draft)

System-level instruction to the model:
> "You write short, professional cold emails to HR/recruiters applying for a role, based on a job description and the applicant's skill summary. Keep the email under 150 words, reference 2-3 specific skills from the JD that match the applicant's background, avoid generic phrases like 'I am writing to express my interest,' and end with a clear, low-friction call to action. Return the company name and role title if identifiable from the JD."

Input: JD text + stored skills summary.
Output: structured JSON (subject, body, companyName, roleTitle) — parsed and shown in the review form.

## 14. Environment Variables

- `GMAIL_USER` — sender Gmail address
- `GMAIL_APP_PASSWORD` — Gmail App Password (2FA required to generate)
- `ANTHROPIC_API_KEY` or `OPENAI_API_KEY`
- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

## 15. Security & Access

- Protect the deployed app with either Vercel's built-in deployment protection (password), or a simple login gate (hardcoded credential check via env var) before the form loads.
- Never expose `GMAIL_APP_PASSWORD` or API keys client-side — all sending/AI calls happen server-side in API routes.

## 16. Cost Estimate

| Item | Cost |
|---|---|
| Vercel (Hobby) | Free |
| Supabase (Free tier) | Free |
| Gmail SMTP sending | Free |
| AI API calls | Estimated < $1-2/month at low-to-moderate volume (small model, short prompts) |

## 17. Risks & Mitigations

| Risk | Mitigation |
|---|---|
| Gmail flags account for spam-like sending patterns | Keep volume low, avoid rapid-fire sends, ensure each email is genuinely distinct (JD-driven, not templated) |
| AI generates inaccurate company/role extraction | Confirmation strip on review screen — always shown for user review before sending, never auto-sent |
| Gmail daily sending limit (~500/day) | Non-issue at personal-use volume, but worth noting if usage grows |
| App Password exposure | Store only in Vercel env vars, never commit to repo |
| Polished UI causes user to skim past AI errors | Distinct, deliberate "Send" styling; letter-frame rendering; duplicate warning inline |

## 18. Success Metrics

- Time from pasting JD to email sent: under 1 minute.
- Zero duplicate emails sent to the same HR contact.
- Personal/subjective: emails "feel" tailored enough that recipients could plausibly think they were hand-written.

## 19. Build Phases

Broken into small, single-focus steps so each phase is a single sitting of work.

### Phase 0 — Project setup
1. Init Next.js (App Router) + TypeScript project.
2. Install and configure Tailwind CSS.
3. Set up Supabase project (Postgres + Storage bucket).
4. Add environment variables (`.env.local`) for Supabase, Gmail, AI API key.
5. Deploy an empty shell to Vercel to confirm the pipeline works end to end.

### Phase 1 — Design foundation
6. Add Fraunces and IBM Plex Sans via next/font.
7. Define Tailwind theme tokens for the color palette (Paper, Ink, Muted ink, Seal, Confirmed, Hairline).
8. Build a base typography scale (headline, body, small/meta text) using the two typefaces.
9. Install Radix UI Primitives and shadcn/ui, customize base component styles to match the theme (remove default shadcn look).
10. Install Lucide for icons.

### Phase 2 — Resume management
11. Build resume upload UI (single file, PDF only).
12. Wire upload to Supabase Storage.
13. Add `resume` table in Supabase; save `file_url` on upload.
14. Build skills-summary text field (editable, saved alongside resume).
15. Build a minimal settings page combining resume + skills summary.

### Phase 3 — JD input & AI analysis
16. Build JD input form (textarea) with React Hook Form + Zod validation.
17. Add HR email field with email-format validation.
18. Build `POST /api/analyze` route.
19. Write and test the AI prompt for extraction + generation (Section 13).
20. Parse AI response into structured `{ subject, body, companyName, roleTitle }`.
21. Handle AI errors/timeouts gracefully (retry button, clear error state).

### Phase 4 — Review & edit screen
22. Build the letter-shaped frame component (line-length constrained, Fraunces subject line).
23. Render generated subject/body inside the frame as editable fields (autosizing textarea).
24. Add the confirmation strip showing extracted company name/role title above the letter frame.
25. Add "Regenerate" action (re-calls `/api/analyze`).
26. Style "Send" as a visually distinct primary action (Seal gold accent).
27. Add the one deliberate motion moment: fade/reveal animation when generated content first appears.

### Phase 5 — Sending
28. Set up Nodemailer with Gmail SMTP + App Password.
29. Build `POST /api/send` route: fetch resume PDF from Storage, attach, send email.
30. Handle send success/failure and return clear status to frontend.
31. Add Sonner toast for send confirmation and failure states.
32. Disable/lock the Send button while a request is in flight (prevent double-send).

### Phase 6 — Logging & duplicate detection
33. Create `sent_emails` table in Supabase.
34. On every send attempt (success or failure), write a row.
35. Build `GET /api/emails` route.
36. Build the log view: plain hairline-separated list (no cards/shadows).
37. Add search/filter by company name or HR email.
38. Add duplicate-detection check: before sending, query `sent_emails` for existing `hr_email`; show inline warning on the review screen if found.

### Phase 7 — Access protection
39. Add a simple login gate (env-var credential check) or enable Vercel deployment protection.
40. Confirm API routes are not publicly callable without the gate.

### Phase 8 — Polish & QA
41. Full pass on empty states (no resume uploaded yet, no sends yet) — written in the interface's voice, clear next action.
42. Full pass on error states (AI failure, send failure, upload failure) — specific, not vague.
43. Responsive check down to mobile width.
44. Keyboard navigation and visible focus states check (Radix handles most of this, verify custom components).
45. Reduced-motion check (the Phase 4 reveal animation respects `prefers-reduced-motion`).
46. Final review: confirm no AI-tool chrome crept in (no all-caps eyebrows, no arrow-suffixed buttons, no gradient decoration).

## 20. Open Questions

- Should duplicate `hr_email` entries be hard-blocked or just flagged with a warning?
- Should the skills summary be free text, or structured (list of skills + experience bullets) for more reliable AI matching?
- Any need to support multiple resume versions later, or is one resume sufficient long-term?