"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  ArrowRight,
  Sparkles,
  Info,
  Clock,
  FileText,
  Mail,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { analyzeEmailDeliverability, type DeliverabilityAnalysis } from "@/lib/tools/spam-detector";

const SAMPLE_BODY = `Hi Sarah,

I noticed your team at Acme is scaling its distributed platform and looking for a Senior Backend Engineer. Over the last three years at Fintech Co, I helped reduce our payment API p99 latency by 38% while scaling to 4M daily transactions using Go and PostgreSQL.

I've attached my one-page résumé with specific architecture breakdowns. I'd love to share two concrete ways we solved database connection bottlenecks if you're open to a brief 10-minute chat this Thursday.

Best,
Alex`;

export function EmailCheckerTool() {
  const [emailText, setEmailText] = useState(SAMPLE_BODY);
  const [recipientEmail, setRecipientEmail] = useState("recruiting@stripe.com");
  const [isCheckingMx, setIsCheckingMx] = useState(false);
  const [mxResult, setMxResult] = useState<{
    tested: boolean;
    isValid: boolean;
    mxHost?: string;
    domain?: string;
    error?: string;
    suggestion?: string;
  } | null>(null);

  const analysis: DeliverabilityAnalysis = analyzeEmailDeliverability(emailText);

  const checkMxRecord = async () => {
    if (!recipientEmail.trim()) return;
    setIsCheckingMx(true);
    try {
      const res = await fetch("/api/tools/check-mx", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: recipientEmail.trim() }),
      });
      const data = await res.json();
      setMxResult({
        tested: true,
        isValid: Boolean(data.isValid),
        mxHost: data.mxHost,
        domain: data.domain,
        error: data.error,
        suggestion: data.suggestion,
      });
    } catch {
      setMxResult({
        tested: true,
        isValid: false,
        error: "Could not reach DNS server. Please verify your connection.",
      });
    } finally {
      setIsCheckingMx(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return "text-emerald-700 bg-emerald-50 border-emerald-200";
    if (score >= 75) return "text-blue-700 bg-blue-50 border-blue-200";
    if (score >= 50) return "text-amber-700 bg-amber-50 border-amber-200";
    return "text-red-700 bg-red-50 border-red-200";
  };

  return (
    <div className="space-y-8">
      {/* Top Banner & Quick Controls */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Editor Area (7 cols) */}
        <div className="space-y-4 lg:col-span-7">
          <div className="rounded-lg border border-hairline bg-paper p-5 shadow-2xs">
            <div className="flex items-center justify-between pb-3">
              <label htmlFor="email-body" className="font-heading text-sm font-semibold text-ink flex items-center gap-2">
                <FileText className="h-4 w-4 text-seal" />
                <span>Outreach Email Body</span>
              </label>
              <button
                type="button"
                onClick={() => setEmailText("")}
                className="text-xs text-muted-ink hover:text-ink transition-colors"
              >
                Clear text
              </button>
            </div>

            <textarea
              id="email-body"
              value={emailText}
              onChange={(e) => setEmailText(e.target.value)}
              rows={12}
              placeholder="Paste your cold email draft here to inspect deliverability and spam risk..."
              className="w-full resize-y rounded-md border border-hairline bg-surface p-3.5 font-mono text-xs leading-relaxed text-ink focus:border-seal focus:outline-none focus:ring-1 focus:ring-seal"
            />

            {/* Live Metrics Strip */}
            <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-hairline pt-3 text-xs text-muted-ink">
              <div className="flex items-center gap-4">
                <span>
                  Words: <strong className="font-semibold text-ink">{analysis.wordCount}</strong>
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  <span>~{analysis.readingTimeSeconds}s read</span>
                </span>
              </div>
              <div className="flex items-center gap-3">
                {analysis.allCapsCount > 0 && (
                  <span className="text-amber-700 bg-amber-50 px-2 py-0.5 rounded text-[11px]">
                    {analysis.allCapsCount} ALL-CAPS
                  </span>
                )}
                {analysis.exclamationCount > 0 && (
                  <span className="text-amber-700 bg-amber-50 px-2 py-0.5 rounded text-[11px]">
                    {analysis.exclamationCount} Exclamations
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Recipient Domain MX Tester */}
          <div className="rounded-lg border border-hairline bg-paper p-5 shadow-2xs">
            <label htmlFor="recipient-email" className="font-heading text-sm font-semibold text-ink flex items-center gap-2 mb-2">
              <Mail className="h-4 w-4 text-seal" />
              <span>Recipient Email &amp; DNS MX Verification</span>
            </label>
            <p className="text-xs text-muted-ink mb-3 leading-relaxed">
              Verify if the recipient&apos;s corporate email domain exists and has active MX mail exchange servers before sending.
            </p>

            <div className="flex flex-col sm:flex-row gap-2">
              <input
                id="recipient-email"
                type="text"
                value={recipientEmail}
                onChange={(e) => {
                  setRecipientEmail(e.target.value);
                  setMxResult(null);
                }}
                placeholder="e.g. recruiter@company.com or company.com"
                className="flex-1 rounded-md border border-hairline bg-surface px-3 py-2 text-xs text-ink focus:border-seal focus:outline-none focus:ring-1 focus:ring-seal"
              />
              <button
                type="button"
                onClick={checkMxRecord}
                disabled={isCheckingMx || !recipientEmail.trim()}
                className="inline-flex items-center justify-center gap-1.5 rounded-md bg-ink px-4 py-2 text-xs font-medium text-paper hover:bg-ink/90 disabled:opacity-50 transition-colors"
              >
                {isCheckingMx ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>Checking DNS...</span>
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-3.5 w-3.5" />
                    <span>Check MX Record</span>
                  </>
                )}
              </button>
            </div>

            {/* MX Result Feedback */}
            {mxResult?.tested && (
              <div
                className={`mt-3 rounded-md border p-3 text-xs ${
                  mxResult.isValid
                    ? "border-emerald-200 bg-emerald-50 text-emerald-900"
                    : "border-red-200 bg-red-50 text-red-900"
                }`}
              >
                {mxResult.isValid ? (
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold">Active Mail Exchange Server Found</p>
                      <p className="text-[11px] text-emerald-800 mt-0.5">
                        Domain <strong>@{mxResult.domain}</strong> can receive emails. MX Server:{" "}
                        <code className="rounded bg-emerald-100 px-1 py-0.5 font-mono text-[10px]">
                          {mxResult.mxHost || "Verified"}
                        </code>
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start gap-2">
                    <XCircle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold">Deliverability Issue Detected</p>
                      <p className="text-[11px] text-red-800 mt-0.5">{mxResult.error}</p>
                      {mxResult.suggestion && (
                        <button
                          type="button"
                          onClick={() => {
                            setRecipientEmail(mxResult.suggestion!);
                            setMxResult(null);
                          }}
                          className="mt-1.5 inline-block text-[11px] font-medium underline hover:text-red-950"
                        >
                          Click to fix: Use {mxResult.suggestion}
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Deliverability Analysis Panel (5 cols) */}
        <div className="space-y-4 lg:col-span-5">
          {/* Main Score Card */}
          <div className="rounded-lg border border-hairline bg-paper p-5 shadow-2xs">
            <div className="flex items-center justify-between pb-4 border-b border-hairline">
              <div>
                <span className="text-[11px] uppercase tracking-wider text-muted-ink font-medium">
                  Deliverability Score
                </span>
                <h3 className="font-heading text-lg font-semibold text-ink">
                  {analysis.rating}
                </h3>
              </div>
              <div
                className={`inline-flex items-center justify-center rounded-full border px-4 py-2 font-heading text-2xl font-bold ${getScoreColor(
                  analysis.score
                )}`}
              >
                {analysis.score}
                <span className="text-xs font-normal opacity-70">/100</span>
              </div>
            </div>

            {/* Spam Triggers Detected */}
            <div className="py-4 border-b border-hairline">
              <div className="flex items-center justify-between text-xs font-semibold text-ink mb-2">
                <span>Spam Triggers Found</span>
                <span className="rounded bg-surface px-2 py-0.5 text-[11px] font-mono">
                  {analysis.spamMatches.length} flagged
                </span>
              </div>

              {analysis.spamMatches.length === 0 ? (
                <div className="flex items-center gap-2 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded p-2.5">
                  <ShieldCheck className="h-4 w-4 shrink-0 text-emerald-600" />
                  <span>No commercial or deceptive spam triggers found.</span>
                </div>
              ) : (
                <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                  {analysis.spamMatches.map((m, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between rounded border border-hairline bg-surface p-2 text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <AlertTriangle
                          className={`h-3.5 w-3.5 shrink-0 ${
                            m.severity === "high"
                              ? "text-red-500"
                              : m.severity === "medium"
                              ? "text-amber-500"
                              : "text-blue-500"
                          }`}
                        />
                        <code className="font-mono text-ink font-semibold">&ldquo;{m.word}&rdquo;</code>
                      </div>
                      <span className="text-[10px] text-muted-ink">{m.category}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Recommendations */}
            <div className="pt-4">
              <h4 className="text-xs font-semibold text-ink mb-2">Recommendations</h4>
              <ul className="space-y-2 text-xs text-muted-ink">
                {analysis.suggestions.map((s, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-seal font-bold">•</span>
                    <span>{s}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Conversion CTA to Vina Application */}
          <div className="rounded-lg border border-seal/30 bg-paper p-5 shadow-xs relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-seal/5 rounded-full blur-xl pointer-events-none" />
            <div className="flex items-center gap-2 text-xs font-semibold text-seal uppercase tracking-wider mb-1">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Send Without Landing in Spam</span>
            </div>
            <h4 className="font-heading text-base font-semibold text-ink mb-1.5">
              Tired of copy-pasting manually?
            </h4>
            <p className="text-xs text-muted-ink leading-relaxed mb-4">
              Vina drafts personalized letters grounded in the job posting, automatically attaches your PDF résumé, and sends directly via your personal Gmail with verified 1-to-1 RFC 2822 headers.
            </p>
            <Link
              href="/signup"
              className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-seal px-4 py-2.5 text-xs font-semibold text-white hover:bg-seal/90 transition-colors shadow-2xs"
            >
              <span>Draft &amp; Send Free with Vina</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
