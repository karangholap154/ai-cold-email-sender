"use client";

import Link from "next/link";
import { Mail, FileText, FileCheck, Check } from "lucide-react";
import type { Resume, UserUsage } from "@/lib/types/database";
import { FREE_MONTHLY_LIMIT } from "@/lib/constants/plans";

export interface DraftReadinessSidebarProps {
  isGmailLoading: boolean;
  isGmailConnected: boolean;
  gmailAddress: string | undefined;
  isResumeLoading: boolean;
  resume: Resume | null;
  resumes: Resume[];
  selectedResume: Resume | null;
  onSelectResume: (resume: Resume) => void;
  usage: UserUsage | null;
  isMonthlyCapped: boolean;
  onUpgrade: () => void;
}

export function DraftReadinessSidebar({
  isGmailLoading,
  isGmailConnected,
  gmailAddress,
  isResumeLoading,
  resume,
  resumes,
  selectedResume,
  onSelectResume,
  usage,
  isMonthlyCapped,
  onUpgrade,
}: DraftReadinessSidebarProps) {
  return (
    <aside aria-label="Sending Setup and Readiness" className="lg:col-span-4 space-y-4">
      {/* Sender Setup Card */}
      <div className="rounded-md border border-hairline bg-white/70 p-5 shadow-2xs space-y-4">
        <div className="border-b border-hairline/80 pb-3">
          <h2 className="font-heading text-sm text-ink font-medium">Dispatch Readiness</h2>
          <p className="text-[11px] text-muted-ink mt-0.5">
            Verified configuration for outgoing correspondence.
          </p>
        </div>

        {/* 1. Gmail Status */}
        <div className="flex items-start justify-between gap-3 text-xs">
          <div className="flex items-start gap-2.5 min-w-0">
            <Mail className="h-4 w-4 text-muted-ink mt-0.5 shrink-0" />
            <div className="min-w-0">
              <p className="font-medium text-ink">Gmail Account</p>
              {isGmailLoading ? (
                <p className="text-[11px] text-muted-ink">Checking connection...</p>
              ) : isGmailConnected ? (
                <p className="text-[11px] text-muted-ink truncate font-mono">
                  {gmailAddress || "Connected"}
                </p>
              ) : (
                <p className="text-[11px] text-amber-700">Not connected</p>
              )}
            </div>
          </div>

          <div className="shrink-0 pt-0.5">
            {isGmailConnected ? (
              <span className="inline-flex items-center gap-1 text-[10px] text-confirmed bg-confirmed/10 px-1.5 py-0.5 rounded-xs border border-confirmed/25 font-medium">
                <Check className="h-2.5 w-2.5" /> Ready
              </span>
            ) : (
              <Link
                href="/settings?tab=gmail"
                className="text-[11px] text-seal hover:underline font-medium"
              >
                Connect →
              </Link>
            )}
          </div>
        </div>

        {/* 2. Résumé Status */}
        <div className="flex items-start justify-between gap-3 text-xs border-t border-hairline/60 pt-3">
          <div className="flex items-start gap-2.5 min-w-0">
            <FileText className="h-4 w-4 text-muted-ink mt-0.5 shrink-0" />
            <div className="min-w-0">
              <p className="font-medium text-ink">Attached Résumé</p>
              {isResumeLoading ? (
                <p className="text-[11px] text-muted-ink">Loading résumé...</p>
              ) : resume?.file_url ? (
                <div className="mt-1">
                  {resumes.length > 1 ? (
                    <select
                      value={selectedResume?.id || ""}
                      onChange={(e) => {
                        const target = resumes.find((r) => r.id === e.target.value);
                        if (target) {
                          onSelectResume(target);
                        }
                      }}
                      className="w-full bg-paper border border-hairline rounded-xs px-2 py-1 text-[11px] text-ink focus:border-seal focus:outline-none cursor-pointer truncate"
                    >
                      {resumes.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.label || "Primary"} ({r.file_name || "PDF"})
                        </option>
                      ))}
                    </select>
                  ) : (
                    <p className="text-[11px] text-muted-ink truncate">
                      {selectedResume?.label || selectedResume?.file_name || "Uploaded PDF"}
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-[11px] text-amber-700">No résumé uploaded</p>
              )}
            </div>
          </div>

          <div className="shrink-0 pt-0.5">
            {resume?.file_url ? (
              <span className="inline-flex items-center gap-1 text-[10px] text-confirmed bg-confirmed/10 px-1.5 py-0.5 rounded-xs border border-confirmed/25 font-medium">
                <Check className="h-2.5 w-2.5" /> Attached
              </span>
            ) : (
              <Link
                href="/settings?tab=resume"
                className="text-[11px] text-seal hover:underline font-medium"
              >
                Upload →
              </Link>
            )}
          </div>
        </div>

        {/* 3. Monthly Sends Quota */}
        <div className="flex items-start justify-between gap-3 text-xs border-t border-hairline/60 pt-3">
          <div className="flex items-start gap-2.5 min-w-0">
            <FileCheck className="h-4 w-4 text-muted-ink mt-0.5 shrink-0" />
            <div className="min-w-0">
              <p className="font-medium text-ink">Monthly Dispatch Quota</p>
              {usage ? (
                <p className="text-[11px] text-muted-ink">
                  {usage.plan === "pro"
                    ? "Unlimited letters on Pro"
                    : `${usage.monthlySends} of ${usage.monthlyLimit ?? FREE_MONTHLY_LIMIT} letters used`}
                </p>
              ) : (
                <p className="text-[11px] text-muted-ink">5 free letters / month</p>
              )}
            </div>
          </div>

          <div className="shrink-0 pt-0.5">
            {usage?.plan === "pro" ? (
              <span className="inline-flex items-center gap-1 text-[10px] text-confirmed bg-confirmed/10 px-1.5 py-0.5 rounded-xs border border-confirmed/25 font-medium">
                Pro Active
              </span>
            ) : isMonthlyCapped ? (
              <button
                type="button"
                onClick={onUpgrade}
                className="text-[11px] text-seal hover:underline font-medium cursor-pointer"
              >
                Upgrade →
              </button>
            ) : (
              <span className="text-[11px] text-muted-ink">
                {(usage?.monthlyLimit ?? FREE_MONTHLY_LIMIT) - (usage?.monthlySends ?? 0)} left
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Informative Guidance Card */}
      <div className="rounded-md border border-hairline bg-[#FAF9F5] p-5 shadow-2xs space-y-2.5 text-xs">
        <h3 className="font-heading text-xs font-semibold text-ink">How Vina drafts your letter</h3>
        <ul className="space-y-2 text-[11px] text-muted-ink leading-relaxed">
          <li className="flex items-start gap-2">
            <span className="text-seal font-semibold shrink-0">•</span>
            <span>
              Extracts the exact hiring team requirements and core responsibilities from the
              posting.
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-seal font-semibold shrink-0">•</span>
            <span>
              Correlates your actual work history and skills from your uploaded résumé.
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-seal font-semibold shrink-0">•</span>
            <span>
              Formats an executive, concise note (75–125 words) that respects hiring managers&apos;
              time.
            </span>
          </li>
        </ul>
      </div>
    </aside>
  );
}
