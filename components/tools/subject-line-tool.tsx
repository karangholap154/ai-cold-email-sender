"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Smartphone,
  Monitor,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ArrowRight,
  Sparkles,
  Type,
  Sliders,
} from "lucide-react";
import {
  analyzeSubjectLine,
  type SubjectLineAnalysis,
} from "@/lib/tools/subject-line-analyzer";

const PRESET_EXAMPLES = [
  "Senior Backend Engineer - Alex Chen",
  "Quick question regarding Stripe payment infra",
  "URGENT: Application for Frontend Lead role!!!",
  "Re: Following up on your hiring post",
  "frontend systems & web performance fit",
];

export function SubjectLineTesterTool() {
  const [subject, setSubject] = useState("frontend systems & web performance fit");
  const [previewMode, setPreviewMode] = useState<"mobile" | "desktop">("mobile");

  const analysis: SubjectLineAnalysis = analyzeSubjectLine(subject);

  const getScoreBadge = (score: number) => {
    if (score >= 85) return "text-emerald-700 bg-emerald-50 border-emerald-200";
    if (score >= 70) return "text-blue-700 bg-blue-50 border-blue-200";
    if (score >= 50) return "text-amber-700 bg-amber-50 border-amber-200";
    return "text-red-700 bg-red-50 border-red-200";
  };

  return (
    <div className="space-y-8">
      {/* Editor & Presets */}
      <div className="rounded-lg border border-hairline bg-paper p-5 sm:p-6 shadow-2xs space-y-4">
        <div>
          <label htmlFor="subject-input" className="block text-xs font-semibold uppercase tracking-wider text-muted-ink mb-1.5">
            Test Subject Line
          </label>
          <div className="relative">
            <input
              id="subject-input"
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g. quick question regarding backend opening"
              maxLength={120}
              className="w-full rounded-md border border-hairline bg-surface px-4 py-3 text-sm text-ink focus:border-seal focus:outline-none focus:ring-1 focus:ring-seal"
            />
            <div className="absolute right-3 top-3 text-[11px] font-mono text-muted-ink">
              {subject.length} / 60 chars
            </div>
          </div>
        </div>

        {/* Quick Example Chips */}
        <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
          <span className="text-muted-ink font-medium">Try an example:</span>
          {PRESET_EXAMPLES.map((ex, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setSubject(ex)}
              className="rounded-full border border-hairline bg-surface px-2.5 py-1 text-[11px] text-muted-ink hover:text-ink hover:bg-hairline/20 transition-colors"
            >
              {ex}
            </button>
          ))}
        </div>
      </div>

      {/* Main Analysis and Simulation Split */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left: Score & Detailed Feedback (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="rounded-lg border border-hairline bg-paper p-5 shadow-2xs">
            {/* Header Score Row */}
            <div className="flex items-center justify-between pb-4 border-b border-hairline">
              <div>
                <span className="text-[11px] uppercase tracking-wider text-muted-ink font-medium">
                  Impact Grade
                </span>
                <h3 className="font-heading text-lg font-semibold text-ink">
                  {analysis.rating}
                </h3>
              </div>
              <div
                className={`inline-flex items-center justify-center rounded-full border px-4 py-2 font-heading text-2xl font-bold ${getScoreBadge(
                  analysis.score
                )}`}
              >
                {analysis.score}
                <span className="text-xs font-normal opacity-70">/100</span>
              </div>
            </div>

            {/* Quick Stats Bar */}
            <div className="grid grid-cols-3 gap-2 py-4 border-b border-hairline text-center">
              <div className="rounded border border-hairline bg-surface p-2">
                <span className="text-[10px] text-muted-ink block uppercase">Length</span>
                <strong className="text-sm font-semibold text-ink font-mono">
                  {analysis.charCount} chars
                </strong>
              </div>
              <div className="rounded border border-hairline bg-surface p-2">
                <span className="text-[10px] text-muted-ink block uppercase">Words</span>
                <strong className="text-sm font-semibold text-ink font-mono">
                  {analysis.wordCount} words
                </strong>
              </div>
              <div className="rounded border border-hairline bg-surface p-2">
                <span className="text-[10px] text-muted-ink block uppercase">Casing</span>
                <strong className="text-xs font-semibold text-ink">
                  {analysis.casing}
                </strong>
              </div>
            </div>

            {/* Heuristic Checklist */}
            <div className="pt-4 space-y-3">
              <h4 className="text-xs font-semibold text-ink">Scoring Criteria &amp; Rules</h4>
              <div className="space-y-2.5">
                {analysis.feedback.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-2.5 rounded border border-hairline bg-surface p-3 text-xs"
                  >
                    {item.passed ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
                    )}
                    <div className="space-y-0.5">
                      <p className="font-semibold text-ink">{item.title}</p>
                      <p className="text-muted-ink leading-relaxed">{item.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right: Realistic Device Preview Simulator (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="rounded-lg border border-hairline bg-paper p-5 shadow-2xs">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-hairline">
              <h4 className="font-heading text-xs font-semibold uppercase tracking-wider text-ink flex items-center gap-1.5">
                <Smartphone className="h-3.5 w-3.5 text-seal" />
                <span>Inbox Preview Simulator</span>
              </h4>
              <div className="flex items-center rounded-md border border-hairline bg-surface p-0.5 text-xs">
                <button
                  type="button"
                  onClick={() => setPreviewMode("mobile")}
                  className={`rounded px-2 py-0.5 font-medium transition-colors ${
                    previewMode === "mobile" ? "bg-paper text-ink shadow-2xs" : "text-muted-ink"
                  }`}
                >
                  iPhone
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewMode("desktop")}
                  className={`rounded px-2 py-0.5 font-medium transition-colors ${
                    previewMode === "desktop" ? "bg-paper text-ink shadow-2xs" : "text-muted-ink"
                  }`}
                >
                  Gmail Desktop
                </button>
              </div>
            </div>

            {/* Mobile / Desktop UI Mockup */}
            {previewMode === "mobile" ? (
              <div className="rounded-xl border-2 border-ink/20 bg-black/5 p-3.5 font-sans">
                <div className="rounded-lg bg-white p-3.5 shadow-sm space-y-1.5 border border-black/10">
                  <div className="flex items-center justify-between text-[11px] text-gray-500">
                    <span className="font-semibold text-gray-900">Alex Chen (You)</span>
                    <span>9:41 AM</span>
                  </div>
                  <div className="text-xs font-semibold text-gray-900 leading-snug">
                    {analysis.mobilePreview.iphoneCutoff || "(Empty subject)"}
                  </div>
                  <div className="text-[11px] text-gray-500 leading-snug line-clamp-2">
                    Hi Sarah, I noticed your team at Acme is scaling its distributed platform...
                  </div>
                </div>

                <div className="mt-2.5 text-center">
                  <span
                    className={`inline-block text-[11px] rounded px-2 py-0.5 ${
                      analysis.mobilePreview.isIphoneTruncated
                        ? "bg-amber-100 text-amber-900"
                        : "bg-emerald-100 text-emerald-900"
                    }`}
                  >
                    {analysis.mobilePreview.isIphoneTruncated
                      ? "⚠️ Cut off on standard iPhone mail screens"
                      : "✓ 100% visible on iPhone lockscreen & mail"}
                  </span>
                </div>
              </div>
            ) : (
              <div className="rounded-lg border border-hairline bg-white p-3 font-sans shadow-2xs">
                <div className="flex items-center gap-3 border-b border-gray-100 pb-2 text-[11px] text-gray-500">
                  <span className="font-semibold text-gray-800">Gmail Inbox Row</span>
                </div>
                <div className="flex items-center gap-2 py-2 text-xs">
                  <span className="w-24 font-bold text-gray-900 shrink-0 truncate">Alex Chen</span>
                  <span className="font-semibold text-gray-900 truncate">
                    {analysis.mobilePreview.gmailCutoff}
                  </span>
                  <span className="text-gray-400 truncate text-[11px]">
                    - Hi Sarah, I noticed your team...
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Call to Action */}
          <div className="rounded-lg border border-seal/30 bg-paper p-5 shadow-xs relative overflow-hidden">
            <div className="flex items-center gap-2 text-xs font-semibold text-seal uppercase tracking-wider mb-1">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Full Personalized Letter</span>
            </div>
            <h4 className="font-heading text-base font-semibold text-ink mb-1.5">
              Have the perfect subject line?
            </h4>
            <p className="text-xs text-muted-ink leading-relaxed mb-4">
              Combine your sharp subject line with a tailored, authentic body letter and attached PDF résumé in Vina.
            </p>
            <Link
              href="/signup"
              className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-seal px-4 py-2.5 text-xs font-semibold text-white hover:bg-seal/90 transition-colors shadow-2xs"
            >
              <span>Draft Free with Vina</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
