"use client";

import { Mail, Unlink, AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import type { GmailConnectionStatus } from "@/lib/types/database";

export interface GmailTabProps {
  gmailStatus: GmailConnectionStatus;
  isDisconnectingGmail: boolean;
  setShowDisconnectModal: (val: boolean) => void;
}

export function GmailTab({
  gmailStatus,
  isDisconnectingGmail,
  setShowDisconnectModal,
}: GmailTabProps) {
  return (
    <div className="space-y-6 animate-in fade-in-50 duration-150">
      <div>
        <h2 className="font-heading text-lg sm:text-xl text-ink">
          Gmail
        </h2>
        <p className="mt-1 text-xs text-muted-ink leading-relaxed">
          Connect your Gmail to start sending letters directly from your personal address.
        </p>
      </div>

      <div className="border border-hairline bg-paper p-3.5 sm:p-5 rounded-sm">
        {gmailStatus.connected ? (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-3 min-w-0">
              <Mail className="mt-0.5 h-5 w-5 shrink-0 text-muted-ink" />
              <div className="min-w-0">
                <p className="text-xs sm:text-sm font-medium text-ink truncate font-mono">
                  Sending as {gmailStatus.email}
                </p>
                <p className="text-[11px] sm:text-xs text-muted-ink mt-0.5">
                  Connected{" "}
                  {gmailStatus.connectedAt
                    ? new Date(gmailStatus.connectedAt).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })
                    : ""}
                </p>
              </div>
            </div>

            <button
              type="button"
              disabled={isDisconnectingGmail}
              onClick={() => setShowDisconnectModal(true)}
              className="inline-flex items-center gap-1.5 text-xs text-muted-ink hover:text-red-700 underline underline-offset-4 self-start sm:self-auto py-1 cursor-pointer disabled:opacity-50 transition-colors"
            >
              {isDisconnectingGmail ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Unlink className="h-3.5 w-3.5" />
              )}
              <span>Disconnect</span>
            </button>
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3 min-w-0">
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-muted-ink" />
              <div>
                <p className="text-xs sm:text-sm font-medium text-ink">
                  Connect your Gmail to start sending.
                </p>
                <p className="text-[11px] sm:text-xs text-muted-ink mt-0.5">
                  Vina asks for permission to send messages on your behalf and to find your own sent messages so follow-ups land in the same conversation. It never reads your incoming mail.
                </p>
              </div>
            </div>

            <a
              href="/api/gmail/connect"
              className="inline-flex items-center justify-center gap-2 rounded-sm border border-hairline bg-[#EDEAE2] hover:bg-[#E4DFD3] text-ink px-4 py-2 text-xs font-medium transition-colors shrink-0 self-start sm:self-auto min-h-[38px]"
            >
              <Mail className="h-3.5 w-3.5 text-seal" />
              <span>Connect Gmail</span>
            </a>
          </div>
        )}
      </div>

      {/* Scope disclosure banner */}
      <div className="border border-hairline bg-[#FAF9F5] p-4 sm:p-5 rounded-sm space-y-2 text-xs text-muted-ink leading-relaxed">
        <div className="flex items-center gap-2 font-medium text-ink text-xs">
          <CheckCircle2 className="h-4 w-4 text-confirmed shrink-0" />
          <span>Scope disclosure</span>
        </div>
        <p>
          Vina asks for permission to send messages on your behalf and to find your own sent messages so follow-ups land in the same conversation. It never reads your incoming mail.
        </p>
      </div>
    </div>
  );
}
