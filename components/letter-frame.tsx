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
      className="mx-auto w-full max-w-2xl space-y-6"
    >
      {/* 1. Confirmation Strip: Extracted Entity Review */}
      <div className="border border-hairline bg-paper/60 p-4 rounded-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-1.5 text-ink">
              <Building2 className="h-3.5 w-3.5 text-muted-ink" />
              <span className="text-muted-ink">Company:</span>
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="Company Name"
                className="bg-transparent border-b border-dashed border-hairline pb-0.5 font-medium text-ink focus:border-seal focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-1.5 text-ink">
              <Briefcase className="h-3.5 w-3.5 text-muted-ink" />
              <span className="text-muted-ink">Role:</span>
              <input
                type="text"
                value={roleTitle}
                onChange={(e) => setRoleTitle(e.target.value)}
                placeholder="Role Title"
                className="bg-transparent border-b border-dashed border-hairline pb-0.5 font-medium text-ink focus:border-seal focus:outline-none"
              />
            </div>
          </div>

          {initialData.skills && initialData.skills.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5">
              {initialData.skills.slice(0, 3).map((skill, idx) => (
                <span
                  key={idx}
                  className="rounded-sm border border-hairline bg-[#EDEAE2] px-2 py-0.5 text-[11px] text-muted-ink"
                >
                  {skill}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Duplicate Outreach Warning */}
        {isDuplicateEmail && (
          <div className="mt-3 flex items-center gap-2 border-t border-hairline pt-3 text-xs text-amber-700">
            <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
            <span>
              You have previously sent outreach to <strong>{hrEmail}</strong>. Proceed only if following up.
            </span>
          </div>
        )}
      </div>

      {/* 2. Letter Frame: The Actual Correspondence Sheet */}
      <div className="relative border border-hairline bg-paper p-8 sm:p-10 rounded-sm shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
        {/* Recipient Metadata Header */}
        <div className="border-b border-hairline pb-5 mb-6 text-xs text-muted-ink space-y-1">
          <div className="flex items-baseline justify-between">
            <div>
              <span className="text-muted-ink/70">To: </span>
              <span className="font-medium text-ink font-mono">{hrEmail}</span>
            </div>
            <div className="text-[11px] text-muted-ink">
              Resume attached automatically
            </div>
          </div>
        </div>

        {/* Subject Line (Rendered in Fraunces headline font) */}
        <div className="mb-6 space-y-1">
          <label className="block text-[11px] font-medium uppercase tracking-wider text-muted-ink/70">
            Subject
          </label>
          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="font-heading text-lg sm:text-xl text-ink w-full bg-transparent border-b border-transparent hover:border-hairline focus:border-seal focus:outline-none transition-colors pb-1"
            placeholder="Subject line..."
          />
        </div>

        {/* Letter Body (Plain Autosizing Textarea with editorial typography) */}
        <div className="space-y-1">
          <label className="block text-[11px] font-medium uppercase tracking-wider text-muted-ink/70">
            Letter Body
          </label>
          <TextareaAutosize
            minRows={8}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            className="w-full resize-none bg-transparent text-sm sm:text-base leading-relaxed text-ink focus:outline-none transition-colors selection:bg-[#E4DFD3]"
            placeholder="Email body..."
          />
        </div>

        {/* Word count & Tone indicator */}
        <div className="mt-6 flex items-center justify-between border-t border-hairline pt-3 text-[11px] text-muted-ink">
          <span>
            {body.trim() ? body.trim().split(/\s+/).length : 0} words
          </span>
          <span className="italic">
            Restrained, direct, high-signal correspondence
          </span>
        </div>
      </div>

      {/* 3. Action Bar: Distinct deliberate Send vs. Secondary Regenerate / Back */}
      <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
        <button
          type="button"
          onClick={onBack}
          disabled={isRegenerating || isSending}
          className="inline-flex items-center gap-1.5 text-xs text-muted-ink hover:text-ink transition-colors disabled:opacity-50"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Edit Job Description</span>
        </button>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onRegenerate}
            disabled={isRegenerating || isSending}
            className="inline-flex items-center gap-1.5 rounded-sm border border-hairline px-3.5 py-2 text-xs font-medium text-ink hover:bg-[#ECE9E1] transition-colors disabled:opacity-50"
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
            className="inline-flex items-center gap-2 rounded-sm bg-seal px-5 py-2 text-xs font-medium text-paper hover:bg-seal/90 shadow-xs transition-all disabled:opacity-50"
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
