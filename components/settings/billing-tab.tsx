"use client";

import { CreditCard, Zap, Loader2 } from "lucide-react";
import type { UserUsage } from "@/lib/types/database";

export interface BillingTabProps {
  usage: UserUsage | null;
  isUpgrading: boolean;
  handleUpgrade: () => void;
  isOpeningPortal: boolean;
  handleManageBilling: () => void;
}

export function BillingTab({
  usage,
  isUpgrading,
  handleUpgrade,
  isOpeningPortal,
  handleManageBilling,
}: BillingTabProps) {
  return (
    <div className="space-y-6 animate-in fade-in-50 duration-150">
      <div>
        <h2 className="font-heading text-lg sm:text-xl text-ink">
          Billing
        </h2>
        <p className="mt-1 text-xs text-muted-ink leading-relaxed">
          View your monthly sending allowance or manage your subscription.
        </p>
      </div>

      {/* Membership & Usage Card */}
      <div className="border border-hairline bg-paper p-3.5 sm:p-5 rounded-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3 min-w-0">
            <CreditCard className="mt-0.5 h-5 w-5 shrink-0 text-muted-ink" />
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-xs sm:text-sm font-medium text-ink">
                  {usage?.plan === "pro"
                    ? "You're on Pro."
                    : "You're on the free plan — 5 letters this month."}
                </p>
                {usage?.plan === "pro" ? (
                  <span className="inline-flex items-center gap-1 text-[10px] font-medium text-seal bg-[#FAF6EE] px-1.5 py-0.5 rounded-sm border border-seal/30">
                    <Zap className="h-2.5 w-2.5 fill-seal text-seal" />
                    <span>Active</span>
                  </span>
                ) : (
                  <span className="text-[10px] text-muted-ink bg-paper px-1.5 py-0.5 rounded-sm border border-hairline">
                    Free
                  </span>
                )}
              </div>
              <p className="text-[11px] sm:text-xs text-muted-ink mt-0.5 leading-relaxed">
                {usage?.plan === "pro"
                  ? "Unlimited tailored letters, automated attachments, and follow-ups."
                  : `${usage?.monthlySends ?? 0} of ${usage?.monthlyLimit ?? 5} letters sent this month.`}
              </p>
            </div>
          </div>

          {usage?.plan === "pro" ? (
            <button
              type="button"
              disabled={isOpeningPortal}
              onClick={handleManageBilling}
              className="inline-flex items-center justify-center gap-1.5 text-xs text-muted-ink hover:text-ink underline underline-offset-4 self-start sm:self-auto py-1 cursor-pointer"
            >
              {isOpeningPortal && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              <span>Manage billing</span>
            </button>
          ) : (
            <button
              type="button"
              disabled={isUpgrading}
              onClick={handleUpgrade}
              className="inline-flex items-center justify-center gap-2 rounded-sm bg-seal px-4 py-2 text-xs font-medium text-paper hover:bg-seal/90 shrink-0 self-start sm:self-auto min-h-[38px] transition-colors cursor-pointer shadow-xs disabled:opacity-50"
            >
              {isUpgrading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Zap className="h-3.5 w-3.5 fill-paper" />
              )}
              <span>Upgrade to Pro</span>
            </button>
          )}
        </div>

        {/* Free quota progress bar */}
        {usage?.plan !== "pro" && (
          <div className="space-y-1.5 pt-2 border-t border-hairline">
            <div className="flex justify-between text-[11px] text-muted-ink">
              <span>Monthly quota usage</span>
              <span>
                {Math.min(usage?.monthlySends ?? 0, 5)} / 5 sends
              </span>
            </div>
            <div className="w-full h-1.5 bg-[#EDEAE2] rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${
                  (usage?.monthlySends ?? 0) >= 5 ? "bg-amber-700" : "bg-seal"
                }`}
                style={{
                  width: `${Math.min(
                    ((usage?.monthlySends ?? 0) / 5) * 100,
                    100
                  )}%`,
                }}
              />
            </div>
            <p className="text-[10px] text-muted-ink">
              Payment methods accepted: UPI (PhonePe, GPay, Paytm) in India • Credit/Debit Cards, Apple Pay, Google Pay globally.
            </p>
          </div>
        )}
      </div>

      {/* Plan Comparison Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-xs">
        <div className="border border-hairline bg-paper p-4 rounded-sm space-y-2">
          <span className="font-medium text-ink">Free Tier</span>
          <ul className="space-y-1.5 text-muted-ink text-[11px]">
            <li>• 5 tailored letters per month</li>
            <li>• 1 active résumé PDF</li>
            <li>• 2 AI regenerations per draft</li>
            <li>• 30-day sent letters history</li>
            <li>• Duplicate contact detection</li>
          </ul>
        </div>

        <div className="border border-seal/30 bg-[#FAF6EE] p-4 rounded-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-medium text-seal">Pro Membership</span>
            <span className="text-[10px] font-semibold text-seal uppercase tracking-wider">$9 (₹499) / mo</span>
          </div>
          <ul className="space-y-1.5 text-muted-ink text-[11px]">
            <li>• Unlimited tailored letters</li>
            <li>• 1-click follow-up correspondence</li>
            <li>• Unlimited AI regenerations</li>
            <li>• Full lifetime sent letters history</li>
            <li>• Priority model & fast support</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
