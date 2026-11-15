"use client";

import Link from "next/link";
import TextareaAutosize from "react-textarea-autosize";
import {
  Mail,
  Loader2,
  AlertCircle,
  CheckCircle2,
  ShieldCheck,
  PenLine,
  Sparkles,
  Check,
  ArrowRight,
  Zap,
  Terminal,
  Rocket,
  HeartHandshake,
} from "lucide-react";
import { type OutreachTone, TONE_LIST } from "@/lib/tone";
import type { RecipientValidationResult } from "@/hooks/use-recipient-validation";

export interface DraftInputFormProps {
  isSafetyDailyCapped: boolean;
  isMonthlyCapped: boolean;
  isUpgrading: boolean;
  onUpgrade: () => void;
  hrEmail: string;
  onHrEmailChange: (email: string) => void;
  isValidatingEmail: boolean;
  recipientValidation: RecipientValidationResult | null;
  isDuplicateEmail: boolean;
  jdText: string;
  onJdTextChange: (text: string) => void;
  tone: OutreachTone;
  onToneChange: (tone: OutreachTone) => void;
  isAnalyzing: boolean;
  onSubmit: (e: React.FormEvent) => void;
}

export function DraftInputForm({
  isSafetyDailyCapped,
  isMonthlyCapped,
  isUpgrading,
  onUpgrade,
  hrEmail,
  onHrEmailChange,
  isValidatingEmail,
  recipientValidation,
  isDuplicateEmail,
  jdText,
  onJdTextChange,
  tone,
  onToneChange,
  isAnalyzing,
  onSubmit,
}: DraftInputFormProps) {
  if (isSafetyDailyCapped) {
    return (
      <div className="rounded-md border border-amber-300/80 bg-[#FAF7F0] p-6 sm:p-8 shadow-xs space-y-5">
        <div className="flex items-start gap-3.5">
          <div className="rounded-full bg-amber-500/15 p-2.5 text-amber-800 shrink-0 mt-0.5">
            <ShieldCheck className="h-5 w-5 text-amber-800" />
          </div>
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-xs text-[11px] font-medium bg-amber-100 text-amber-900 border border-amber-300/60 mb-1">
              Gmail Safety Shield Active (50 of 50 Dispatched)
            </div>
            <h2 className="font-heading text-xl sm:text-2xl text-ink font-normal tracking-tight">
              Safe daily sending ceiling reached
            </h2>
            <p className="text-xs sm:text-sm text-muted-ink leading-relaxed">
              To guarantee your personal Google account reputation is protected against
              algorithmic spam flags and bulk throttling, Vina caps dispatches at{" "}
              <strong>50 letters per 24 hours</strong>.
            </p>
            <p className="text-xs text-muted-ink pt-1">
              Your safe daily window resets automatically in a few hours. In the meantime, you
              can review past conversations or prepare notes.
            </p>
          </div>
        </div>

        <div className="pt-2 border-t border-hairline flex items-center justify-between">
          <Link
            href="/log"
            className="text-xs text-ink hover:text-seal underline underline-offset-4 font-medium"
          >
            View your sent letters in History →
          </Link>
        </div>
      </div>
    );
  }

  if (isMonthlyCapped) {
    return (
      <div className="rounded-md border border-seal/30 bg-[#FAF7F0] p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex items-start gap-3.5">
          <div className="rounded-full bg-seal/15 p-2.5 text-seal shrink-0 mt-0.5">
            <Sparkles className="h-5 w-5" />
          </div>
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-xs text-[11px] font-medium bg-amber-100 text-amber-900 border border-amber-300/60 mb-1">
              Free Monthly Limit Reached (5 of 5 Sent)
            </div>
            <h2 className="font-heading text-xl sm:text-2xl text-ink font-normal tracking-tight">
              You&apos;ve reached your limit of 5 free letters
            </h2>
            <p className="text-xs sm:text-sm text-muted-ink leading-relaxed">
              Free accounts include 5 sent letters per calendar month. To continue drafting and
              sending tailored applications directly from your Gmail, upgrade to{" "}
              <strong>Vina Pro</strong>.
            </p>
          </div>
        </div>

        {/* Pro Value Props Checklist */}
        <div className="rounded-sm border border-hairline bg-paper/80 p-4 sm:p-5 space-y-2.5 text-xs">
          <p className="text-[11px] font-semibold text-ink uppercase tracking-wider">
            Included with Vina Pro - $9 / month (₹499)
          </p>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-ink">
            <li className="flex items-center gap-2">
              <Check className="h-4 w-4 text-confirmed shrink-0" />
              <span>
                <strong>Unlimited</strong> tailored letters
              </span>
            </li>
            <li className="flex items-center gap-2">
              <Check className="h-4 w-4 text-confirmed shrink-0" />
              <span>
                <strong>1-Click follow-ups</strong> in same thread
              </span>
            </li>
            <li className="flex items-center gap-2">
              <Check className="h-4 w-4 text-confirmed shrink-0" />
              <span>
                <strong>Up to 3</strong> résumé versions
              </span>
            </li>
            <li className="flex items-center gap-2">
              <Check className="h-4 w-4 text-confirmed shrink-0" />
              <span>
                <strong>Unlimited</strong> AI regenerations
              </span>
            </li>
          </ul>
        </div>

        {/* Upgrade Actions */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
          <button
            type="button"
            disabled={isUpgrading}
            onClick={onUpgrade}
            className="inline-flex items-center justify-center gap-2 rounded-sm bg-seal px-6 py-3 text-xs sm:text-sm font-medium text-white hover:bg-seal/90 disabled:opacity-50 transition-all shadow-xs cursor-pointer min-h-[44px]"
          >
            {isUpgrading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Connecting to secure checkout...</span>
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                <span>Upgrade to Pro - $9 / month</span>
                <ArrowRight className="h-4 w-4 ml-1" />
              </>
            )}
          </button>

          <Link
            href="/log"
            className="text-xs text-muted-ink hover:text-ink underline underline-offset-4 text-center sm:text-right py-1 font-medium"
          >
            View your sent letters in History →
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      className="rounded-md border border-hairline bg-white/85 p-5 sm:p-7 shadow-2xs space-y-6"
    >
      {/* Send To Input */}
      <div className="space-y-2">
        <div className="flex items-baseline justify-between gap-2">
          <label htmlFor="hr-email" className="block text-xs font-semibold text-ink">
            Send to <span className="text-seal">*</span>
          </label>
          <span className="text-[11px] text-muted-ink">Recruiter, founder, or hiring manager</span>
        </div>
        <div className="relative">
          <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-ink/70" />
          <input
            id="hr-email"
            type="email"
            value={hrEmail}
            onChange={(e) => onHrEmailChange(e.target.value)}
            placeholder="e.g. alex@company.com or hiring@startup.io"
            required
            className="w-full rounded-sm border border-hairline bg-paper/60 pl-10 pr-4 py-2.5 text-xs sm:text-sm text-ink placeholder:text-muted-ink/60 focus:bg-white focus:border-seal focus:outline-none transition-colors font-mono"
          />
        </div>

        {isValidatingEmail && (
          <div className="flex items-center gap-1.5 text-[11px] text-muted-ink pt-0.5">
            <Loader2 className="h-3 w-3 animate-spin shrink-0" />
            <span>Checking recipient mail server (DNS MX)...</span>
          </div>
        )}

        {recipientValidation?.suggestion && (
          <div className="flex items-center justify-between gap-2 text-[11px] text-amber-900 bg-amber-50/90 border border-amber-200/80 px-2.5 py-1.5 rounded-sm">
            <div className="flex items-center gap-1.5 min-w-0">
              <AlertCircle className="h-3.5 w-3.5 shrink-0 text-amber-700" />
              <span className="truncate">
                Did you mean{" "}
                <button
                  type="button"
                  onClick={() => onHrEmailChange(recipientValidation.suggestion!)}
                  className="font-mono font-semibold underline hover:text-amber-950 cursor-pointer"
                >
                  {recipientValidation.suggestion}
                </button>
                ?
              </span>
            </div>
            <button
              type="button"
              onClick={() => onHrEmailChange(recipientValidation.suggestion!)}
              className="text-[10px] font-semibold text-amber-900 hover:text-amber-950 underline shrink-0 cursor-pointer"
            >
              Apply fix
            </button>
          </div>
        )}

        {recipientValidation &&
          !recipientValidation.isValid &&
          !recipientValidation.suggestion && (
            <div className="flex items-center gap-1.5 text-[11px] text-red-700 bg-red-50/80 border border-red-200/70 px-2.5 py-1.5 rounded-sm">
              <AlertCircle className="h-3.5 w-3.5 shrink-0" />
              <span>{recipientValidation.error}</span>
            </div>
          )}

        {recipientValidation?.isValid && !isDuplicateEmail && (
          <div className="flex items-center gap-1.5 text-[11px] text-confirmed pt-0.5">
            <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-confirmed" />
            <span>Mail server verified (active MX records found)</span>
          </div>
        )}

        {isDuplicateEmail && (
          <div className="flex items-center gap-1.5 text-[11px] text-amber-700 pt-0.5">
            <AlertCircle className="h-3.5 w-3.5 shrink-0" />
            <span>Note: You have previously sent a letter to this recipient address.</span>
          </div>
        )}
      </div>

      {/* Job Description Textarea */}
      <div className="space-y-2">
        <div className="flex items-baseline justify-between gap-2">
          <label htmlFor="jd-text" className="block text-xs font-semibold text-ink">
            Job Description <span className="text-seal">*</span>
          </label>
          <div className="flex items-center gap-3 text-[11px] text-muted-ink">
            {jdText.length > 0 && (
              <button
                type="button"
                onClick={() => onJdTextChange("")}
                className="hover:text-ink underline underline-offset-2 cursor-pointer"
              >
                Clear
              </button>
            )}
            <span>
              {jdText.length > 0 ? `${jdText.length} characters` : "Full posting"}
            </span>
          </div>
        </div>
        <TextareaAutosize
          id="jd-text"
          minRows={10}
          value={jdText}
          onChange={(e) => onJdTextChange(e.target.value)}
          placeholder="Paste the full job posting here (responsibilities, required qualifications, tech stack, company context)..."
          required
          className="w-full resize-none rounded-sm border border-hairline bg-paper/60 p-3.5 text-xs sm:text-sm text-ink placeholder:text-muted-ink/60 focus:bg-white focus:border-seal focus:outline-none transition-colors leading-relaxed"
        />
        <p className="text-[11px] text-muted-ink">
          Vina reads the entire JD to identify the specific problems this team is hiring to solve.
        </p>
      </div>

      {/* Tone & Persona Directive Selector */}
      <div className="space-y-2 pt-1">
        <div className="flex items-baseline justify-between gap-2">
          <label className="block text-xs font-semibold text-ink">
            Letter Persona & Tone
          </label>
          <span className="text-[11px] text-muted-ink">
            Tailor signal and length to your recipient
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {TONE_LIST.map((t) => {
            const isSelected = tone === t.id;
            const Icon =
              t.id === "crisp"
                ? Zap
                : t.id === "technical"
                ? Terminal
                : t.id === "startup"
                ? Rocket
                : HeartHandshake;

            return (
              <button
                key={t.id}
                type="button"
                onClick={() => onToneChange(t.id)}
                className={`relative flex flex-col items-start p-3 rounded-sm border text-left transition-all cursor-pointer ${
                  isSelected
                    ? "border-seal bg-seal/5 shadow-2xs"
                    : "border-hairline bg-paper/40 hover:bg-paper/80 hover:border-ink/20"
                }`}
              >
                <div className="flex items-center justify-between w-full mb-1">
                  <div className="flex items-center gap-1.5">
                    <Icon
                      className={`h-3.5 w-3.5 ${
                        isSelected ? "text-seal" : "text-muted-ink"
                      }`}
                    />
                    <span
                      className={`text-xs font-medium ${
                        isSelected ? "text-seal font-semibold" : "text-ink"
                      }`}
                    >
                      {t.label}
                    </span>
                  </div>
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded-xs font-mono font-medium ${
                      isSelected ? "bg-seal text-paper" : "bg-ink/5 text-muted-ink"
                    }`}
                  >
                    {t.wordCountRange}
                  </span>
                </div>
                <p className="text-[11px] text-muted-ink leading-snug">{t.description}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Submit Action Strip */}
      <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-t border-hairline/80">
        <div className="text-[11px] text-muted-ink flex items-center gap-1.5">
          <ShieldCheck className="h-3.5 w-3.5 text-confirmed" />
          <span>Nothing is sent automatically. You review everything first.</span>
        </div>

        <button
          type="submit"
          disabled={isAnalyzing || !jdText.trim() || !hrEmail.trim()}
          className="inline-flex items-center justify-center gap-2 rounded-sm bg-ink px-6 py-2.5 text-xs font-medium text-paper hover:bg-ink/90 disabled:opacity-50 transition-all shadow-xs cursor-pointer min-h-[42px]"
        >
          {isAnalyzing ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              <span>Reading the job description...</span>
            </>
          ) : (
            <>
              <PenLine className="h-3.5 w-3.5" />
              <span>Draft this letter</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
}
