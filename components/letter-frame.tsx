"use client";

import { useState } from "react";
import TextareaAutosize from "react-textarea-autosize";
import { motion } from "motion/react";
import {
  Building2,
  Briefcase,
  Sparkles,
  Send,
  RotateCcw,
  ArrowLeft,
  Loader2,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";
import type { AnalyzeResponse } from "@/lib/types/database";

export interface LetterFrameProps {
  initialData: AnalyzeResponse;
  hrEmail: string;
  isDuplicateEmail?: boolean;
  onRegenerate: () => void;
  isRegenerating: boolean;
  onBack: () => void;
  onSend: (data: { subject: string; body: string; companyName?: string; roleTitle?: string }) => void;
  isSending?: boolean;
}

export function LetterFrame({
  initialData,
  hrEmail,
  isDuplicateEmail = false,
  onRegenerate,
  isRegenerating,
  onBack,
  onSend,
  isSending = false,
}: LetterFrameProps) {
  const [subject, setSubject] = useState(initialData.subject);
  const [body, setBody] = useState(initialData.body);
  const [companyName, setCompanyName] = useState(initialData.companyName || "");
  const [roleTitle, setRoleTitle] = useState(initialData.roleTitle || "");

  const handleSend = () => {
    onSend({
      subject,
      body,
      companyName: companyName.trim() || undefined,
      roleTitle: roleTitle.trim() || undefined,
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="mx-auto w-full max-w-2xl space-y-4 sm:space-y-6"
    >
      {/* 1. Confirmation Strip: Extracted Entity Review */}
      <div className="border border-hairline bg-paper/60 p-3 sm:p-4 rounded-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-4 flex-1">
            <div className="flex items-center gap-2 text-ink min-w-0">
              <Building2 className="h-3.5 w-3.5 text-muted-ink shrink-0" />
              <span className="text-muted-ink shrink-0 text-[11px] sm:text-xs">Company:</span>
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="Company Name"
                className="w-full min-w-0 bg-transparent border-b border-dashed border-hairline pb-0.5 font-medium text-ink focus:border-seal focus:outline-none text-xs"
              />
            </div>

            <div className="flex items-center gap-2 text-ink min-w-0">
              <Briefcase className="h-3.5 w-3.5 text-muted-ink shrink-0" />
              <span className="text-muted-ink shrink-0 text-[11px] sm:text-xs">Role:</span>
              <input
                type="text"
                value={roleTitle}
                onChange={(e) => setRoleTitle(e.target.value)}
                placeholder="Role Title"
                className="w-full min-w-0 bg-transparent border-b border-dashed border-hairline pb-0.5 font-medium text-ink focus:border-seal focus:outline-none text-xs"
              />
            </div>
          </div>

          {initialData.skills && initialData.skills.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 pt-1 sm:pt-0 shrink-0">
              {initialData.skills.slice(0, 3).map((skill, idx) => (
                <span
                  key={idx}
                  className="rounded-sm border border-hairline bg-[#EDEAE2] px-2 py-0.5 text-[10px] sm:text-[11px] text-muted-ink"
                >
                  {skill}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Duplicate Outreach Warning */}
        {isDuplicateEmail && (
          <div className="mt-3 flex items-start sm:items-center gap-2 border-t border-hairline pt-3 text-xs text-amber-700">
            <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5 sm:mt-0" />
            <span className="leading-snug">
              You have previously sent outreach to <strong className="break-all">{hrEmail}</strong>. Proceed only if following up.
            </span>
          </div>
        )}
      </div>

      {/* 2. Letter Frame: The Actual Correspondence Sheet */}
      <div className="relative border border-hairline bg-paper p-4 sm:p-7 md:p-10 rounded-sm shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
        {/* Recipient Metadata Header */}
        <div className="border-b border-hairline pb-4 sm:pb-5 mb-5 sm:mb-6 text-xs text-muted-ink">
          <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1.5">
            <div className="min-w-0">
              <span className="text-muted-ink/70">To: </span>
              <span className="font-medium text-ink font-mono break-all">{hrEmail}</span>
            </div>
            <div className="text-[11px] text-muted-ink shrink-0">
              Resume attached automatically
            </div>
          </div>
        </div>

        {/* Subject Line (Rendered in Fraunces headline font) */}
        <div className="mb-5 sm:mb-6 space-y-1">
          <label className="block text-[11px] font-medium uppercase tracking-wider text-muted-ink/70">
            Subject
          </label>
          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="font-heading text-base sm:text-lg md:text-xl text-ink w-full bg-transparent border-b border-transparent hover:border-hairline focus:border-seal focus:outline-none transition-colors pb-1 leading-snug"
            placeholder="Subject line..."
          />
        </div>

        {/* Letter Body (Plain Autosizing Textarea with editorial typography) */}
        <div className="space-y-1">
          <label className="block text-[11px] font-medium uppercase tracking-wider text-muted-ink/70">
            Letter Body
          </label>
          <TextareaAutosize
            minRows={7}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            className="w-full resize-none bg-transparent text-sm sm:text-base leading-relaxed text-ink focus:outline-none transition-colors selection:bg-[#E4DFD3]"
            placeholder="Email body..."
          />
        </div>

        {/* Word count & Tone indicator */}
        <div className="mt-6 flex flex-col sm:flex-row sm:items-center justify-between gap-1 border-t border-hairline pt-3 text-[11px] text-muted-ink">
          <span>
            {body.trim() ? body.trim().split(/\s+/).length : 0} words
          </span>
          <span className="italic text-muted-ink/80 text-[10px] sm:text-[11px]">
            Restrained, direct, high-signal correspondence
          </span>
        </div>
      </div>

      {/* 3. Action Bar: Distinct deliberate Send vs. Secondary Regenerate / Back */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
        <button
          type="button"
          onClick={onBack}
          disabled={isRegenerating || isSending}
          className="inline-flex items-center justify-center sm:justify-start gap-1.5 py-2 text-xs text-muted-ink hover:text-ink transition-colors disabled:opacity-50 cursor-pointer order-2 sm:order-1"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Edit Job Description</span>
        </button>

        <div className="flex items-center gap-2 sm:gap-3 order-1 sm:order-2">
          <button
            type="button"
            onClick={onRegenerate}
            disabled={isRegenerating || isSending}
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 rounded-sm border border-hairline px-3.5 py-2.5 sm:py-2 text-xs font-medium text-ink hover:bg-[#ECE9E1] transition-colors disabled:opacity-50 cursor-pointer min-h-[40px] sm:min-h-0"
          >
            {isRegenerating ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <RotateCcw className="h-3.5 w-3.5 text-muted-ink" />
            )}
            <span>{isRegenerating ? "Regenerating..." : "Regenerate"}</span>
          </button>

          <button
            type="button"
            onClick={handleSend}
            disabled={isSending || isRegenerating || !subject.trim() || !body.trim()}
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 rounded-sm bg-seal px-5 py-2.5 sm:py-2 text-xs font-medium text-paper hover:bg-seal/90 shadow-xs transition-all disabled:opacity-50 cursor-pointer min-h-[40px] sm:min-h-0"
          >
            {isSending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Send className="h-3.5 w-3.5" />
            )}
            <span>{isSending ? "Sending..." : "Send letter"}</span>
          </button>
        </div>
      </div>
    </motion.div>
  );
}
