# BRANDING.md — Vina (meetvina.com)

Companion to PRD.md. PRD.md is the technical/product source of truth (data model, APIs, build phases). This file is the voice/copy/identity source of truth — how Vina sounds and what it says, page by page. When the two disagree on visual system basics (color, type), PRD.md Section 8 wins; this file expands it into actual words.

**Status:** Draft v1 — written ahead of domain purchase. Update once meetvina.com is live and Google OAuth consent screen name is locked in.

---

## 1. Brand Identity

### 1.1 The name
- **Vina** — the product name.
- **meetvina.com** — the domain (once purchased).
- Read aloud as "VEE-nuh." Worth deciding this explicitly and using it consistently in any spoken/video content, since ambiguous pronunciation undercuts word-of-mouth.

### 1.2 What Vina *is* — the decision this file assumes

There are two ways to frame Vina, and it changes copy tone everywhere, so it needs to be decided once, up front, rather than drifting page to page:

- **Option A — Vina is the product name.** "Sign up for Vina." "Vina generates your draft." Neutral, product-first, like Notion or Linear. Copy refers to "the app" or "Vina" as a thing you use.
- **Option B — Vina is a persona/agent.** "Vina drafts your letter for you." "Vina noticed you haven't followed up." First-person or agent-flavored copy, like a named assistant.

**Recommendation: Option A, with a light personified touch, not a full persona.** Reasoning:
- A tool that sends real emails to real HR contacts under the user's name needs to feel like *infrastructure the user controls*, not an autonomous agent acting on their behalf. Full-agent framing ("Vina sent your email") can undercut the trust message that the user reviews and approves every send — which is a core product principle in PRD.md Section 6.4.
- A light touch (Vina *drafts*, the user *sends*) keeps a bit of personality without implying autonomy it doesn't have.
- This also avoids the OAuth consent screen ("Vina wants to access your Google Account") reading like a chatbot agent asking for scary permissions — a plain product name is more reassuring at that exact moment.

**Rule going forward:** Vina drafts, suggests, prepares. The user decides, edits, sends. Never write copy where Vina is the subject of the verb "send."

### 1.3 One-line positioning statement

> Vina turns a job description into a letter worth sending.

Use this as the canonical one-liner anywhere a single sentence is needed (meta description, social bio, OAuth consent screen tagline if one is allowed, elevator pitch).

### 1.4 Longer positioning (2-3 sentences, for About/homepage subhead use)

> Vina reads the job description, drafts a short, specific letter to go with your résumé, and hands it back to you to review before anything is sent. It's built for people applying to real roles at real companies — not for blasting the same message to a hundred inboxes.

---

## 2. Voice & Tone

### 2.1 The core metaphor
Every piece of copy should sound like it belongs to a **correspondence tool** — someone writing and sending a real letter — not an "AI productivity platform." This mirrors PRD.md's design theme (ink, paper, wax seal) at the word level, not just the visual level.

### 2.2 Tone attributes

| Vina sounds like | Vina does not sound like |
|---|---|
| A careful, literate colleague helping you draft something important | A hype-driven SaaS landing page |
| Plain, specific, quietly confident | Exclamation-heavy, "Let's go!" energy |
| Respectful of the reader's time (both the user's and the HR recipient's) | Pushy, growth-hacky, urgency-manufacturing |
| Honest about what it does and doesn't do | Overpromising ("guaranteed interviews," "10x your callbacks") |

### 2.3 Words and phrases to avoid
- "Supercharge," "unlock," "revolutionize," "game-changer," "10x"
- "AI-powered" as a headline crutch — show it, don't announce it
- "Spam," "blast," "bulk" — even descriptively, these undercut the tool's actual design intent (tailored, one-at-a-time outreach)
- Emoji in transactional copy (buttons, confirmations, errors) — fine, sparingly, only in optional marketing/social copy, never in-product
- Exclamation marks in error or system messages ("Oops! Something went wrong!") — state the problem plainly instead

### 2.4 Words and phrases that fit
- Draft, letter, send, correspondence, tailored, review, sign, thread
- "Ready to send" instead of "Generation complete"
- "In your words" / "in your voice" when referring to edits the user makes
- Plain verbs: write, draft, review, send, follow up — not "leverage," "optimize," "streamline"

### 2.5 A worked example (before/after)
- **Generic AI-tool voice:** "🚀 Supercharge your job search with AI-powered cold emails! Generate unlimited personalized outreach in seconds!"
- **Vina voice:** "Paste the job description. Vina drafts a short, specific letter. You read it, fix anything that's off, and send it yourself."

---

## 3. Page-by-Page Copy Map

Draft copy below is a starting point, not final — treat it as the right *register*, to be refined once real screenshots/flows exist.

### 3.1 Homepage (`/`)

**Hero headline:**
> Turn a job description into a letter worth sending.

**Hero subheadline:**
> Paste the job post. Vina drafts a short, tailored email and attaches your résumé. You review it, then send it from your own Gmail.

**Primary CTA button:** `Get started free` (not "Sign up now!" — plain, no urgency manufacturing)
**Secondary link:** `See how it works`

**"How it works" section (3 steps, matches PRD's actual flow):**
1. **Paste the job description.** Vina reads it and picks out the role, the company, and what actually matters.
2. **Review the draft.** A short, specific letter appears — editable, not a template with blanks filled in.
3. **Send it yourself.** One click sends it from your own Gmail, with your résumé attached. Nothing goes out without you seeing it first.

**Trust/reassurance line** (important given Gmail OAuth ask):
> Vina only ever sends what you approve, from your own Gmail account. We don't read your inbox, and we don't send anything automatically.

**Pricing section intro:**
> Start free. Upgrade when you're applying at volume.

**Footer tagline:** `Vina — meetvina.com`

### 3.2 Signup / Login (`/signup`, `/login`)

- Signup header: `Create your account`
- Helper text under email field: `We'll only use this to sign you in — no marketing emails.`
- Post-signup email verification notice: `Check your inbox to confirm your email before you continue.`
- Login header: `Welcome back`

### 3.3 Draft/compose screen (`/draft`)

- Page header: `New letter`
- JD textarea placeholder: `Paste the full job description here.`
- HR email field label: `Send to`
- Generate button: `Draft this letter` (not "Generate" — ties to the correspondence metaphor)
- Loading state (during AI call): `Reading the job description...`
- Confirmation strip (above generated draft): `Applying to: {roleTitle} at {companyName}` — with a small `Not right? Edit below.` note if extraction confidence is low
- Regenerate button: `Try again`
- Regeneration limit reached (free tier): `You've used both free rewrites for this draft. Send this version, or upgrade for unlimited rewrites.`
- Send button: `Send this letter`
- Duplicate warning (inline, not a blocking modal): `You've already written to this address on {date}. Sending again?`
- Send success toast: `Sent. It's on its way to {hrEmail}.`
- Send failure toast: `That didn't go through. Nothing was sent — try again.`

### 3.4 Settings (`/settings`)

**Gmail connection section**
- Not connected: `Connect your Gmail to start sending.` / Button: `Connect Gmail`
- Connected: `Sending as {gmailAddress}` / Link: `Disconnect`
- Scope disclosure (near the connect button, plain language — also feeds Phase 10's OAuth verification requirement):
  > Vina asks for permission to send messages on your behalf and to find your own sent messages so follow-ups land in the same conversation. It never reads your incoming mail.

**Resume section**
- Empty state: `Upload your résumé (PDF) so Vina can reference it in your letters.`
- Uploaded state: `{fileName} — uploaded {date}` / Link: `Replace`
- Skills summary field label: `A few lines about your background` — helper: `Vina uses this to connect your experience to what the job actually asks for.`

**Signature section**
- Label: `How you sign off`
- Helper: `Added to the end of every letter automatically.`

**Billing section**
- Free plan: `You're on the free plan — 5 letters this month.` / Button: `Upgrade to Pro`
- Pro plan: `You're on Pro.` / Link: `Manage billing`

### 3.5 Send log (`/log`)

- Page header: `Sent letters`
- Empty state: `Nothing sent yet. Your first letter will show up here.`
- Search placeholder: `Search by company or email`
- Row status labels: `Sent`, `Failed` (plain text, color-coded via the Confirmed teal token — no icons-as-decoration)
- Follow-up action (Pro): `Write a follow-up`
- Follow-up gate (free tier): `Follow-ups are a Pro feature.` / Link: `Upgrade`

### 3.6 Privacy & Terms (`/privacy`, `/terms`)

- Not brand-voice-driven — these need to be precise and legally accurate, matching PRD.md Section 15's actual scope list (`gmail.send`, `gmail.readonly`, `userinfo.email`) exactly. Plain, clear language is still preferred over legalese where possible, but accuracy overrides tone here.
- Must explicitly disclose `gmail.readonly` usage in plain terms per PRD.md's Phase 10 / Risks note — reuse the Settings scope-disclosure wording (Section 3.4 above) as the basis for the fuller privacy policy clause.

### 3.7 System/transactional microcopy (cross-page)

- Generic error fallback: `Something went wrong on our end. Try again in a moment.`
- Session expired: `You've been signed out. Log back in to continue.`
- Plan limit reached (send blocked): `You've sent 5 letters this month on the free plan.` / Button: `Upgrade to send more`

---

## 4. Visual Brand Assets

(Extends PRD.md Section 8's design system into brand-specific assets — colors/type already defined there, not repeated here.)

### 4.1 Logo / wordmark direction
- Wordmark-first, not an icon-heavy logo — "Vina" set in Fraunces, since the brand's whole identity rests on the ink/letter metaphor and a serif wordmark reads as considered rather than templated.
- Consider a small mark alongside the wordmark evoking a wax seal or a fold — echoes the Seal gold accent color, used sparingly (e.g. favicon only, not repeated everywhere the wordmark appears).
- Avoid: gradient logo treatments, abstract geometric "AI" icons (neural-net dots, sparkle/star icons) — these are the exact visual cliché PRD.md's design system was built to avoid.

### 4.2 Favicon
- A simple monogram ("V") or the seal mark, in Ink (`#1E2530`) on Paper (`#F6F5F1`), or inverted for dark-mode favicon variants if supported.

### 4.3 OG image / link preview (for shared links)
- Paper background, Ink text, headline in Fraunces: "Vina — meetvina.com"
- Subline in Plex Sans: the one-line positioning statement (Section 1.3)
- No stock photography, no gradient background — consistent with the "no decoration that isn't earned" rule from PRD.md 8.2.

---

## 5. Naming Conventions (keep consistent everywhere)

| Use this | Not this |
|---|---|
| Letter | Email, message (when referring to the generated content specifically) |
| Draft | Generate, output |
| Send | Submit, fire, blast |
| Follow-up | Reminder, nudge |
| Sent letters (log) | History, activity, records |
| Connect Gmail | Authorize, link account, integrate |
| Résumé | CV — pick one and stay consistent; "résumé" fits a US-leaning audience, "CV" fits the global-audience goal noted in PRD.md. **Decide before launch copy is finalized** — see Open Questions. |

---

## 6. Open Questions

- Confirm "Vina" pronunciation and whether it's ever spelled out phonetically anywhere (About page, social bios).
- Résumé vs. CV — PRD.md targets a global audience; pick the term that reads naturally to the broadest first-launch market and use it everywhere, including error messages and the Settings label.
- Does the OAuth consent screen app name field allow the full tagline, or just "Vina"? Confirm during Phase 10 setup and update Section 1.3 usage notes accordingly.
- Logo/wordmark: DIY in Figma, or commission once there's revenue to justify it?
- Should the trust/reassurance homepage line (Section 3.1) be tested against a version that also mentions the resume attachment explicitly, to reduce OAuth drop-off?