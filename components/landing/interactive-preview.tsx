"use client";

import { useState } from "react";
import {
  Building2,
  Briefcase,
  FileText,
  Lock,
  Send,
} from "lucide-react";

export function InteractivePreview() {
  const [activeTab, setActiveTab] = useState<"preview" | "raw">("preview");

  return (
    <div className="space-y-6">
      {/* Header and Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <span className="text-[10px] sm:text-[11px] font-medium uppercase tracking-wider text-muted-ink">
            Live Preview
          </span>
          <h2 className="font-heading text-xl sm:text-2xl md:text-3xl text-ink mt-1">
            The Letter Frame
          </h2>
          <p className="mt-1.5 text-xs sm:text-sm text-muted-ink max-w-xl leading-relaxed">
            Designed to slow you down at the single moment that matters: before sending. Inspect extracted role context, hone the phrasing, and dispatch with genuine confidence.
          </p>
        </div>

        {/* Toggle tabs */}
        <div className="flex items-center rounded-sm border border-hairline bg-paper p-1 text-xs shrink-0 self-start sm:self-auto shadow-2xs">
          <button
            type="button"
            onClick={() => setActiveTab("preview")}
            className={`px-3 py-1.5 rounded-xs transition-all cursor-pointer ${
              activeTab === "preview"
                ? "bg-ink text-paper font-medium shadow-xs"
                : "text-muted-ink hover:text-ink"
            }`}
          >
            Tailored Letter
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("raw")}
            className={`px-3 py-1.5 rounded-xs transition-all cursor-pointer ${
              activeTab === "raw"
                ? "bg-ink text-paper font-medium shadow-xs"
                : "text-muted-ink hover:text-ink"
            }`}
          >
            Raw Job Posting
          </button>
        </div>
      </div>

      {activeTab === "preview" ? (
        <div className="space-y-4">
          {/* Extracted Entity Confirmation Strip */}
          <div className="border border-hairline bg-paper p-3.5 sm:p-4 rounded-sm shadow-2xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="flex flex-wrap items-center gap-3 sm:gap-4">
                <div className="flex items-center gap-1.5 text-ink">
                  <Building2 className="h-3.5 w-3.5 text-muted-ink shrink-0" />
                  <span className="text-muted-ink">Target:</span>
                  <span className="font-medium text-ink">Linear</span>
                </div>
                <div className="flex items-center gap-1.5 text-ink">
                  <Briefcase className="h-3.5 w-3.5 text-muted-ink shrink-0" />
                  <span className="text-muted-ink">Role:</span>
                  <span className="font-medium text-ink">Staff Frontend Engineer</span>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-1.5 pt-1 sm:pt-0">
                <span className="rounded-sm border border-hairline bg-[#EDEAE2] px-2 py-0.5 text-[10px] sm:text-[11px] text-muted-ink font-medium">
                  Design Systems
                </span>
                <span className="rounded-sm border border-hairline bg-[#EDEAE2] px-2 py-0.5 text-[10px] sm:text-[11px] text-muted-ink font-medium">
                  Next.js &amp; WebGL
                </span>
                <span className="rounded-sm border border-hairline bg-[#EDEAE2] px-2 py-0.5 text-[10px] sm:text-[11px] text-muted-ink font-medium">
                  Sub-50ms Latency
                </span>
              </div>
            </div>
          </div>

          {/* Physical Stationery Letter Frame Mockup */}
          <div className="border border-hairline bg-paper p-5 sm:p-8 md:p-12 rounded-sm shadow-[0_4px_24px_rgba(0,0,0,0.03)] relative overflow-hidden">
            {/* Decorative vintage postage stamp motif in top right */}
            <div className="absolute top-4 right-4 sm:top-6 sm:right-6 border border-dashed border-hairline bg-[#FAF9F5] px-2.5 py-1 text-[9px] font-mono uppercase tracking-widest text-muted-ink/80 select-none hidden sm:block">
              AIR MAIL • 1ST CLASS
            </div>

            {/* Recipient & Attachment Header */}
            <div className="border-b border-hairline pb-4 mb-5 sm:mb-6 text-xs text-muted-ink flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              <div className="flex items-center gap-2">
                <span className="text-muted-ink/70">To:</span>
                <span className="font-mono text-ink font-medium break-all">sarah.chen@linear.app</span>
              </div>
              <div className="inline-flex items-center gap-1.5 text-[11px] text-confirmed bg-confirmed/10 px-2.5 py-0.5 rounded-sm border border-confirmed/20 self-start sm:self-auto shrink-0 font-medium">
                <FileText className="h-3 w-3" />
                <span>Résumé attached (Resume_2026.pdf)</span>
              </div>
            </div>

            {/* Subject Line */}
            <div className="mb-5 sm:mb-6 space-y-1">
              <span className="block text-[11px] font-medium uppercase tracking-wider text-muted-ink/70">
                Subject Line
              </span>
              <div className="font-heading text-base sm:text-lg md:text-xl text-ink leading-snug">
                Linear Staff Frontend Engineer - background in high-performance design systems
              </div>
            </div>

            {/* Letter Body */}
            <div className="space-y-3.5 sm:space-y-4 text-sm sm:text-base leading-relaxed text-ink/90 font-serif">
              <p>Hi Sarah,</p>
              <p>
                I noticed Linear is expanding the web client team to rebuild core keyboard interactions and canvas-rendered timeline views. Given your focus on sub-50ms interaction latency, I wanted to reach out directly.
              </p>
              <p>
                Over the past four years leading design system architecture at Scale, I led our migration to headless primitives and built our real-time collaborative workspace, decreasing bundle weight by 42% and sustaining 60fps renders on complex graph views.
              </p>
              <p>
                I’ve attached my résumé with further project breakdowns. If you’re open to a brief 10-minute introductory conversation this week, I would welcome the chance to share notes on how we tackled similar rendering bottlenecks.
              </p>
              <p className="pt-2">
                Best regards,<br />
                <span className="font-sans text-sm font-medium text-ink">Karan Gholap</span>
              </p>
            </div>

            {/* Metadata stats */}
            <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 border-t border-hairline pt-3.5 text-[11px] text-muted-ink">
              <div className="flex items-center gap-2">
                <span className="font-mono text-ink font-medium">124 words</span>
                <span>•</span>
                <span>1 min reading time</span>
              </div>
              <span className="italic text-muted-ink/80 text-[10px] sm:text-[11px]">
                Restrained, direct, high-signal correspondence
              </span>
            </div>
          </div>

          {/* Action Delivery Preview Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
            <div className="flex items-center gap-2 text-xs text-muted-ink">
              <Lock className="h-3.5 w-3.5 text-seal shrink-0" />
              <span>Delivered natively from your authenticated personal Gmail account</span>
            </div>

            <div className="inline-flex items-center justify-center gap-2 rounded-sm bg-seal px-5 py-2.5 sm:py-2 text-xs font-medium text-paper shadow-xs min-h-[42px] sm:min-h-0">
              <Send className="h-3.5 w-3.5" />
              <span>Send letter</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="border border-hairline bg-paper p-6 sm:p-8 rounded-sm space-y-4 shadow-2xs">
          <div className="flex items-center justify-between border-b border-hairline pb-3">
            <span className="text-xs font-mono text-muted-ink">Pasted Job Posting Snippet</span>
            <span className="text-xs text-muted-ink">1,450 characters</span>
          </div>
          <pre className="text-xs font-mono text-muted-ink whitespace-pre-wrap leading-relaxed overflow-x-auto">
{`About the Role:
Linear is looking for a Staff Frontend Engineer to own our core client performance and design system architecture.

Responsibilities:
- Drive rendering architecture across web and desktop clients using Next.js, React, and WebGL.
- Architect our headless design system components for zero-latency interactions and full keyboard navigation.
- Partner with product designers to ship buttery-smooth transitions and real-time multiplayer states.

Qualifications:
- 6+ years building mission-critical web applications with high visual polish.
- Deep expertise in browser rendering pipelines, WebGL canvas performance, and bundle optimization.
- Strong product intuition and obsession with tactile micro-interactions.`}
          </pre>
        </div>
      )}
    </div>
  );
}
