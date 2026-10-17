"use client";

import { useState } from "react";
import {
  Mail,
  Unlink,
  CheckCircle2,
  Loader2,
  ExternalLink,
  Key,
  ShieldCheck,
  Eye,
  EyeOff,
  HelpCircle,
} from "lucide-react";
import { toast } from "sonner";
import type { GmailConnectionStatus } from "@/lib/types/database";

export interface GmailTabProps {
  gmailStatus: GmailConnectionStatus;
  isDisconnectingGmail: boolean;
  setShowDisconnectModal: (val: boolean) => void;
  onConnectSuccess?: (status: { email: string; connectedAt: string }) => void;
}

export function GmailTab({
  gmailStatus,
  isDisconnectingGmail,
  setShowDisconnectModal,
  onConnectSuccess,
}: GmailTabProps) {
  const [emailInput, setEmailInput] = useState("");
  const [passwordInput, setPasswordInput] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [showHelpGuide, setShowHelpGuide] = useState(false);

  const handleConnectSmtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (!emailInput.trim() || !emailInput.includes("@")) {
      toast.error("Please enter a valid Gmail address.");
      return;
    }

    if (!passwordInput.trim()) {
      toast.error("Please enter your 16-character Google App Password.");
      return;
    }

    setIsConnecting(true);
    try {
      const res = await fetch("/api/gmail/connect-smtp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: emailInput.trim(),
          appPassword: passwordInput.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to connect Gmail account.");
      }

      toast.success(
        `Connected as ${data.email}. Your letters will send directly from your personal address.`
      );
      setEmailInput("");
      setPasswordInput("");

      if (onConnectSuccess) {
        onConnectSuccess({
          email: data.email,
          connectedAt: data.connectedAt,
        });
      }
    } catch (err: unknown) {
      toast.error(
        err instanceof Error
          ? err.message
          : "Error connecting to Gmail. Please check your credentials."
      );
    } finally {
      setIsConnecting(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-150">
      <div>
        <h2 className="font-heading text-lg sm:text-xl text-ink">
          Gmail Sending Account
        </h2>
        <p className="mt-1 text-xs text-muted-ink leading-relaxed">
          Connect your personal Gmail address to send tailored letters and follow-up threads directly from your identity.
        </p>
      </div>

      {gmailStatus.connected ? (
        /* CONNECTED STATE */
        <div className="border border-hairline bg-paper p-4 sm:p-5 rounded-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3 min-w-0">
              <div className="mt-0.5 rounded-full bg-confirmed/15 p-1.5 text-confirmed shrink-0">
                <CheckCircle2 className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-xs sm:text-sm font-medium text-ink truncate font-mono">
                    {gmailStatus.email}
                  </p>
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded-xs text-[10px] font-medium bg-confirmed/15 text-confirmed">
                    Active
                  </span>
                </div>
                <p className="text-[11px] sm:text-xs text-muted-ink mt-0.5">
                  Connected on{" "}
                  {gmailStatus.connectedAt
                    ? new Date(gmailStatus.connectedAt).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })
                    : "Recently"}
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

          {/* Gmail Safety Shield Safeguards Card */}
          <div className="pt-3 border-t border-hairline/80 space-y-2.5">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-ink">
              <ShieldCheck className="h-4 w-4 text-confirmed shrink-0" />
              <span>Gmail Safety Shield Active</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-[11px]">
              <div className="rounded-sm border border-hairline/60 bg-paper/70 p-2.5">
                <span className="text-muted-ink block text-[10px] uppercase font-semibold tracking-wider">Safe Daily Ceiling</span>
                <span className="font-mono font-medium text-ink text-xs">50 letters / 24h</span>
                <p className="text-[10px] text-muted-ink mt-0.5">10x below Google spam limit</p>
              </div>
              <div className="rounded-sm border border-hairline/60 bg-paper/70 p-2.5">
                <span className="text-muted-ink block text-[10px] uppercase font-semibold tracking-wider">DNS MX Verification</span>
                <span className="font-medium text-confirmed text-xs">Pre-Send Active</span>
                <p className="text-[10px] text-muted-ink mt-0.5">Zero non-existent domain bounces</p>
              </div>
              <div className="rounded-sm border border-hairline/60 bg-paper/70 p-2.5">
                <span className="text-muted-ink block text-[10px] uppercase font-semibold tracking-wider">Inbox Placement</span>
                <span className="font-medium text-ink text-xs">100% Primary Tab</span>
                <p className="text-[10px] text-muted-ink mt-0.5">No shared IP cold-blast pool</p>
              </div>
            </div>
            <p className="text-[10px] text-muted-ink leading-relaxed">
              Outbound correspondence and follow-ups originate directly from your authenticated Gmail address. All credentials are encrypted with AES-256-GCM.
            </p>
          </div>
        </div>
      ) : (
        /* DISCONNECTED / CONNECT FORM STATE */
        <div className="space-y-4">
          <div className="border border-hairline bg-paper p-4 sm:p-6 rounded-sm space-y-5">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-2.5">
                <Mail className="mt-0.5 h-4 w-4 text-seal shrink-0" />
                <div>
                  <h3 className="text-xs sm:text-sm font-medium text-ink">
                    Connect your Gmail with an App Password
                  </h3>
                  <p className="text-[11px] sm:text-xs text-muted-ink mt-0.5 leading-relaxed">
                    Uses a dedicated 16-character Google App Password. No Google approval required, zero permission warnings, and 100% private.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowHelpGuide(!showHelpGuide)}
                className="text-[11px] text-muted-ink hover:text-ink inline-flex items-center gap-1 shrink-0 underline underline-offset-2"
              >
                <HelpCircle className="h-3 w-3" />
                <span>{showHelpGuide ? "Hide instructions" : "How to generate?"}</span>
              </button>
            </div>

            {/* Quick 3-Step Setup Guide */}
            {(showHelpGuide || true) && (
              <div className="rounded-sm border border-hairline bg-[#FAF9F5] p-3.5 sm:p-4 text-xs space-y-2.5 text-muted-ink">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-ink text-[11px] uppercase tracking-wider">
                    Quick 1-Minute Setup
                  </span>
                  <a
                    href="https://myaccount.google.com/apppasswords"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] text-seal hover:underline font-medium"
                  >
                    <span>Open Google App Passwords</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>

                <ol className="list-decimal list-inside space-y-1.5 text-[11px] leading-relaxed text-ink/80">
                  <li>
                    Ensure <strong>2-Step Verification</strong> is enabled on your Google account.
                  </li>
                  <li>
                    Go to{" "}
                    <a
                      href="https://myaccount.google.com/apppasswords"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-seal underline underline-offset-2"
                    >
                      myaccount.google.com/apppasswords
                    </a>
                    .
                  </li>
                  <li>
                    Enter <code className="bg-hairline/60 px-1 py-0.5 rounded-xs text-[10px]">Cold Email Sender</code> as the app name and click <strong>Create</strong>.
                  </li>
                  <li>
                    Copy the <strong>16-character password</strong> (e.g. <code className="bg-hairline/60 px-1 py-0.5 rounded-xs text-[10px]">abcd efgh ijkl mnop</code>) and paste it below.
                  </li>
                </ol>
              </div>
            )}

            {/* Connection Credentials Container */}
            <div className="space-y-4 pt-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="space-y-1.5">
                  <label
                    htmlFor="gmail-address-input"
                    className="block text-[11px] font-medium text-ink uppercase tracking-wider"
                  >
                    Your Gmail Address
                  </label>
                  <input
                    id="gmail-address-input"
                    type="email"
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleConnectSmtp();
                      }
                    }}
                    placeholder="you@gmail.com"
                    required
                    className="w-full rounded-sm border border-hairline bg-white/70 px-3 py-2 text-xs text-ink placeholder:text-muted-ink/60 focus:border-seal focus:outline-none focus:ring-1 focus:ring-seal/30"
                  />
                </div>

                <div className="space-y-1.5">
                  <label
                    htmlFor="gmail-app-password-input"
                    className="block text-[11px] font-medium text-ink uppercase tracking-wider"
                  >
                    16-Character App Password
                  </label>
                  <div className="relative">
                    <input
                      id="gmail-app-password-input"
                      type={showPassword ? "text" : "password"}
                      value={passwordInput}
                      onChange={(e) => setPasswordInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleConnectSmtp();
                        }
                      }}
                      placeholder="xxxx xxxx xxxx xxxx"
                      required
                      autoComplete="off"
                      className="w-full rounded-sm border border-hairline bg-white/70 px-3 py-2 pr-9 text-xs text-ink font-mono placeholder:text-muted-ink/60 focus:border-seal focus:outline-none focus:ring-1 focus:ring-seal/30"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-ink hover:text-ink cursor-pointer p-0.5"
                      title={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? (
                        <EyeOff className="h-3.5 w-3.5" />
                      ) : (
                        <Eye className="h-3.5 w-3.5" />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <p className="text-[11px] text-muted-ink flex items-center gap-1.5">
                  <Key className="h-3.5 w-3.5 text-muted-ink/80 shrink-0" />
                  <span>Encrypted at rest using AES-256-GCM.</span>
                </p>

                <button
                  type="button"
                  disabled={isConnecting}
                  onClick={() => handleConnectSmtp()}
                  className="inline-flex items-center justify-center gap-2 rounded-sm bg-seal hover:bg-seal/90 text-white px-4 py-2 text-xs font-medium transition-colors cursor-pointer disabled:opacity-50 min-h-[36px]"
                >
                  {isConnecting ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      <span>Verifying with Google...</span>
                    </>
                  ) : (
                    <>
                      <Mail className="h-3.5 w-3.5" />
                      <span>Connect Gmail Account</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Security & Scope Disclosure Banner */}
      <div className="border border-hairline bg-[#FAF9F5] p-4 sm:p-5 rounded-sm space-y-2 text-xs text-muted-ink leading-relaxed">
        <div className="flex items-center gap-2 font-medium text-ink text-xs">
          <ShieldCheck className="h-4 w-4 text-confirmed shrink-0" />
          <span>Security & Privacy Guarantee</span>
        </div>
        <p>
          Your credentials are encrypted at rest with AES-256-GCM and used exclusively to send your reviewed letters and thread follow-up correspondence. Your inbox and incoming emails are never accessed.
        </p>
      </div>
    </div>
  );
}
