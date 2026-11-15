"use client";

import { Check, Sparkles, RotateCcw } from "lucide-react";
import type { UserUsage } from "@/lib/types/database";
import { FREE_MONTHLY_LIMIT } from "@/lib/constants/plans";

export interface DraftHeaderProps {
  step: "input" | "review";
  usage: UserUsage | null;
  isMonthlyCapped: boolean;
  restoredNotice: string | null;
  onDiscardDraft: () => void;
}

export function DraftHeader({
  step,
  usage,
  isMonthlyCapped,
  restoredNotice,
  onDiscardDraft,
}: DraftHeaderProps) {
  return (
    <div className="space-y-4">
      {/* Studio Header & Progression Indicator */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-hairline/80 pb-6">
        <div className="space-y-1.5">
          {/* Step Breadcrumbs */}
          <div className="flex items-center gap-2 text-xs font-medium">
            <span
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-xs transition-colors ${
                step === "input"
                  ? "bg-ink text-paper"
                  : "bg-confirmed/10 text-confirmed border border-confirmed/30"
              }`}
            >
              {step === "review" && <Check className="h-3 w-3" />}
              1. Role & Recruiter
            </span>
            <span className="text-muted-ink/40">→</span>
            <span
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-xs transition-colors ${
                step === "review"
                  ? "bg-seal text-paper"
                  : "text-muted-ink border border-hairline bg-paper/60"
              }`}
            >
              2. Review & Dispatch
            </span>
          </div>

          <h1 className="font-heading text-2xl sm:text-3xl text-ink font-normal tracking-tight">
            {step === "input" ? "New Letter" : "Review Letter"}
          </h1>
          <p className="text-xs sm:text-sm text-muted-ink max-w-2xl leading-relaxed">
            {step === "input"
              ? "Paste the target job description and recipient email. Vina extracts key requirements and drafts a tailored pitch referencing your background."
              : "Carefully inspect your letter before dispatch. You can refine any phrasing directly - nothing leaves your Gmail without your approval."}
          </p>
        </div>

        {/* Quick Quota Pill */}
        {usage && (
          <div className="self-start sm:self-auto shrink-0 inline-flex items-center gap-2 rounded-sm border border-hairline bg-white/80 px-3 py-1.5 text-xs text-muted-ink shadow-2xs">
            <span
              className={`h-2 w-2 rounded-full shrink-0 ${
                isMonthlyCapped ? "bg-amber-600" : "bg-seal"
              }`}
            />
            {usage.plan === "pro" ? (
              <span className="font-medium text-ink">Pro Plan • Unlimited Letters</span>
            ) : (
              <span>
                <strong className="text-ink font-medium">
                  {usage.monthlySends} of {usage.monthlyLimit ?? FREE_MONTHLY_LIMIT}
                </strong>{" "}
                sent this month
              </span>
            )}
          </div>
        )}
      </div>

      {/* Restored Notice Strip (if present) */}
      {restoredNotice && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border border-seal/30 bg-[#FAF7F0] p-3.5 sm:px-4 sm:py-3 rounded-sm text-xs shadow-2xs">
          <div className="flex items-center gap-2.5 text-ink min-w-0">
            <Sparkles className="h-4 w-4 text-seal shrink-0" />
            <span className="font-medium text-ink">{restoredNotice}</span>
          </div>
          <button
            type="button"
            onClick={onDiscardDraft}
            className="inline-flex items-center gap-1 text-muted-ink hover:text-ink underline underline-offset-4 text-xs shrink-0 self-start sm:self-auto cursor-pointer"
          >
            <RotateCcw className="h-3 w-3" />
            <span>Discard & start fresh</span>
          </button>
        </div>
      )}
    </div>
  );
}
