"use client";

import { useState, useEffect } from "react";
import TextareaAutosize from "react-textarea-autosize";
import { motion } from "motion/react";
import { toast } from "sonner";
import Link from "next/link";
import {
  Building2,
  Briefcase,
  Sparkles,
  Send,
  RotateCcw,
  ArrowLeft,
  ArrowRight,
  Loader2,
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  Copy,
  Check,
  Lock,
} from "lucide-react";
import type { AnalyzeResponse, UserUsage } from "@/lib/types/database";

export interface LetterFrameProps {
  initialData: AnalyzeResponse;
  hrEmail: string;
  isDuplicateEmail?: boolean;
  senderEmail?: string;
  isGmailConnected?: boolean;
  usage?: UserUsage;
  regenerationCount?: number;
  maxRegenerations?: number;
  isCapped?: boolean;
  onRegenerate: () => void;
  isRegenerating: boolean;
  onBack: () => void;
  onSend: (data: {
    subject: string;
    body: string;
    companyName?: string;
    roleTitle?: string;
    hrEmail?: string;
  }) => void;
  onEmailChange?: (email: string) => void;
  isSending?: boolean;
}

export function LetterFrame({
  initialData,
  hrEmail,
  isDuplicateEmail = false,
  senderEmail,
  isGmailConnected = true,
  usage,
  regenerationCount = 0,
  maxRegenerations = 2,
  isCapped = false,
  onRegenerate,
  isRegenerating,
  onBack,
  onSend,
  onEmailChange,
  isSending = false,
}: LetterFrameProps) {
  const [recipientEmail, setRecipientEmail] = useState(hrEmail);
  const [isDuplicate, setIsDuplicate] = useState(isDuplicateEmail);
  const [duplicateEmailMatched, setDuplicateEmailMatched] = useState(
    isDuplicateEmail ? hrEmail : ""
  );
  const [isCheckingDuplicate, setIsCheckingDuplicate] = useState(false);

  const [subject, setSubject] = useState(initialData.subject);
  const [body, setBody] = useState(initialData.body);
  const [companyName, setCompanyName] = useState(initialData.companyName || "");
  const [roleTitle, setRoleTitle] = useState(initialData.roleTitle || "");
  const [copied, setCopied] = useState(false);

  const isFreePlan = usage ? usage.plan === "free" : true;
  const monthlyLimit = usage?.monthlyLimit ?? 5;
  const monthlySends = usage?.monthlySends ?? 0;
  const reachedSendCap = isCapped || (isFreePlan && monthlySends >= monthlyLimit);

  const reachedRegenCap =
    isFreePlan &&
    typeof regenerationCount === "number" &&
    typeof maxRegenerations === "number" &&
    regenerationCount >= maxRegenerations;

  // Sync initial duplicate state if props change
  useEffect(() => {
    setIsDuplicate(isDuplicateEmail);
    if (isDuplicateEmail) {
      setDuplicateEmailMatched(hrEmail);
    }
  }, [isDuplicateEmail, hrEmail]);

  // Dynamic server checking when recipient email changes
  useEffect(() => {
    const trimmed = recipientEmail.trim();
    if (onEmailChange) {
      onEmailChange(trimmed);
    }

    if (!trimmed || !trimmed.includes("@") || trimmed.length < 5) {
      setIsDuplicate(false);
      setDuplicateEmailMatched("");
      return;
    }

    const timer = setTimeout(async () => {
      setIsCheckingDuplicate(true);
      try {
        const res = await fetch(`/api/emails?email=${encodeURIComponent(trimmed)}`);
        if (res.ok) {
          const data = await res.json();
          if (data.exists) {
            setIsDuplicate(true);
            setDuplicateEmailMatched(trimmed);
          } else {
            setIsDuplicate(false);
            setDuplicateEmailMatched("");
          }
        }
      } catch {
        // Silently continue if network check fails
      } finally {
        setIsCheckingDuplicate(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [recipientEmail, onEmailChange]);

  const handleEmailChange = (val: string) => {
    setRecipientEmail(val);
    // If the user modified the email away from the flagged duplicate, immediately clear warning flag
    if (val.trim().toLowerCase() !== duplicateEmailMatched.toLowerCase()) {
      setIsDuplicate(false);
    }
  };

  const wordCount = body.trim() ? body.trim().split(/\s+/).length : 0;
  const readTimeSeconds = Math.max(10, Math.round((wordCount / 180) * 60));

  const handleCopy = async () => {
    const fullContent = `Subject: ${subject}\n\n${body}`;
    try {
      await navigator.clipboard.writeText(fullContent);
      setCopied(true);
      toast.success("Letter & subject copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy to clipboard");
    }
  };

  const handleSend = () => {
    onSend({
      subject,
      body,
      companyName: companyName.trim() || undefined,
      roleTitle: roleTitle.trim() || undefined,
      hrEmail: recipientEmail.trim() || undefined,
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
      <div className="border border-hairline bg-paper/60 p-3.5 sm:p-4 rounded-sm space-y-3">
        {/* Company & Role Fields */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-5 text-xs">
          <div className="flex items-center gap-2 text-ink min-w-0">
            <Building2 className="h-3.5 w-3.5 text-muted-ink shrink-0" />
            <span className="text-muted-ink shrink-0 text-xs font-medium">Company:</span>
            <input
              type="text"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="e.g. Linear, Acme Corp"
              className="w-full min-w-0 bg-transparent border-b border-dashed border-hairline hover:border-muted-ink focus:border-seal focus:outline-none pb-0.5 font-medium text-ink transition-colors text-xs"
            />
          </div>

          <div className="flex items-center gap-2 text-ink min-w-0">
            <Briefcase className="h-3.5 w-3.5 text-muted-ink shrink-0" />
            <span className="text-muted-ink shrink-0 text-xs font-medium">Role:</span>
            <input
              type="text"
              value={roleTitle}
              onChange={(e) => setRoleTitle(e.target.value)}
              placeholder="e.g. Software Engineer"
              className="w-full min-w-0 bg-transparent border-b border-dashed border-hairline hover:border-muted-ink focus:border-seal focus:outline-none pb-0.5 font-medium text-ink transition-colors text-xs"
            />
          </div>
        </div>

        {/* Skills Matched Row */}
        {initialData.skills && initialData.skills.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-hairline/60 text-xs">
            <span className="text-[11px] text-muted-ink shrink-0 font-medium mr-1">
              Skills:
            </span>
            {initialData.skills.map((skill, idx) => (
              <span
                key={idx}
                className="rounded-sm border border-hairline bg-[#EDEAE2] px-2 py-0.5 text-[10px] sm:text-[11px] text-ink font-normal"
              >
                {skill}
              </span>
            ))}
          </div>
        )}

        {/* Dynamic Duplicate Outreach Warning */}
        {isDuplicate && (
          <div className="flex items-start sm:items-center gap-2 border-t border-hairline pt-3 text-xs text-amber-700">
            <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5 sm:mt-0" />
            <span className="leading-snug">
              You have previously sent outreach to <strong className="break-all">{duplicateEmailMatched || recipientEmail}</strong>. Proceed only if following up.
            </span>
          </div>
        )}
      </div>

      {/* 2. Monthly Quota Alert Banner when send cap is reached */}
      {reachedSendCap && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-sm border border-seal/30 bg-[#FAF9F5] p-3.5 sm:p-4 text-xs">
          <div className="flex items-start gap-2.5 min-w-0">
            <AlertCircle className="h-4 w-4 shrink-0 text-seal mt-0.5" />
            <div>
              <p className="font-medium text-ink">
                Monthly send limit reached ({monthlySends}/{monthlyLimit})
              </p>
              <p className="text-muted-ink mt-0.5">
                Free accounts include 5 sent letters per calendar month. Upgrade to Pro for unlimited correspondence.
              </p>
            </div>
          </div>
          <Link
            href="/#pricing"
            className="inline-flex items-center justify-center gap-1.5 rounded-sm bg-seal px-3 py-1.5 text-xs font-medium text-paper hover:bg-seal/90 shrink-0 self-start sm:self-auto transition-colors"
          >
            <span>Upgrade to Pro</span>
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      )}

      {/* 3. Letter Frame: The Actual Correspondence Sheet */}
      <div className="relative border border-hairline bg-paper p-4 sm:p-7 md:p-10 rounded-sm shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
        {/* Recipient Metadata Header & Quick Copy */}
        <div className="border-b border-hairline pb-4 sm:pb-5 mb-5 sm:mb-6 text-xs text-muted-ink space-y-2.5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            {senderEmail ? (
              <div className="flex items-center gap-2">
                <span className="text-muted-ink/70 shrink-0 font-medium">From:</span>
                <span className="font-mono text-ink font-medium">{senderEmail}</span>
                <span className="text-[10px] text-confirmed bg-confirmed/5 px-1.5 py-0.5 rounded-sm border border-confirmed/20">
                  Personal Gmail
                </span>
              </div>
            ) : !isGmailConnected ? (
              <div className="flex items-center gap-2 text-amber-700 bg-amber-50/60 border border-amber-200/70 px-2.5 py-1.5 rounded-sm">
                <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                <span>No Gmail connected. Connect in Settings before sending.</span>
              </div>
            ) : <div />}

            {usage && (
              <div className="inline-flex items-center gap-1.5 text-[11px] text-muted-ink self-start sm:self-auto">
                <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${reachedSendCap ? "bg-amber-700" : "bg-seal"}`}></span>
                {usage.plan === "pro" ? (
                  <span className="font-medium text-ink">Pro Plan • Unlimited</span>
                ) : (
                  <span>
                    Monthly quota: <strong className="font-medium text-ink">{monthlySends} of {monthlyLimit}</strong> used
                  </span>
                )}
              </div>
            )}
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <span className="text-muted-ink/70 shrink-0 font-medium">To:</span>
              <input
                type="email"
                value={recipientEmail}
                onChange={(e) => handleEmailChange(e.target.value)}
                placeholder="recruiter@company.com"
                title="Edit recipient email address"
                className="w-full max-w-xs sm:max-w-md bg-transparent border-b border-dashed border-hairline hover:border-muted-ink focus:border-seal focus:outline-none pb-0.5 font-mono font-medium text-ink transition-colors text-xs"
              />
              {isCheckingDuplicate && (
                <Loader2 className="h-3 w-3 animate-spin text-muted-ink shrink-0" />
              )}
            </div>
            <div className="flex items-center gap-3 shrink-0 self-start sm:self-auto">
              <span className="text-[11px] text-muted-ink hidden sm:inline">
                Resume attached
              </span>
              <button
                type="button"
                onClick={handleCopy}
                title="Copy subject and letter body to clipboard"
                className="inline-flex items-center gap-1.5 rounded-sm border border-hairline bg-paper px-2.5 py-1 text-xs text-ink hover:bg-[#EDEAE2] transition-colors cursor-pointer"
              >
                {copied ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-confirmed" />
                    <span className="text-confirmed font-medium">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5 text-muted-ink" />
                    <span>Copy letter</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {isDuplicate && (
            <div className="mt-2.5 flex items-center gap-1.5 text-[11px] text-amber-700 font-sans">
              <AlertTriangle className="h-3 w-3 shrink-0" />
              <span>Prior outreach sent to <strong className="break-all">{duplicateEmailMatched || recipientEmail}</strong>.</span>
            </div>
          )}
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

        {/* Signal & Reading Gauge */}
        <div className="mt-6 flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-t border-hairline pt-3 text-[11px] text-muted-ink">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-medium text-ink">{wordCount} words</span>
            <span className="text-muted-ink/40">•</span>
            <span>~{readTimeSeconds}s read</span>
            <span className="text-muted-ink/40">•</span>
            <span
              className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-xs border text-[10px] ${
                wordCount >= 70 && wordCount <= 130
                  ? "border-confirmed/30 bg-confirmed/5 text-confirmed font-medium"
                  : wordCount > 130
                  ? "border-amber-700/30 bg-amber-700/5 text-amber-800"
                  : "border-hairline bg-[#EDEAE2] text-muted-ink"
              }`}
            >
              {wordCount >= 70 && wordCount <= 130 ? (
                <>
                  <CheckCircle2 className="h-3 w-3 text-confirmed" />
                  <span>Optimal response zone (75–125w)</span>
                </>
              ) : wordCount > 130 ? (
                <>
                  <AlertCircle className="h-3 w-3 text-amber-700" />
                  <span>On the longer side ({">"}130w)</span>
                </>
              ) : (
                <span>Concise note</span>
              )}
            </span>
          </div>
          <span className="italic text-muted-ink/80 text-[10px] sm:text-[11px]">
            Executive correspondence standard
          </span>
        </div>
      </div>

      {/* 4. Action Bar: Distinct deliberate Send vs. Secondary Regenerate / Back */}
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
            disabled={isRegenerating || isSending || reachedRegenCap}
            title={
              reachedRegenCap
                ? `Free plan limit reached: ${maxRegenerations} regenerations per draft. Edit text directly or upgrade to Pro.`
                : "Generate a new variation"
            }
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 rounded-sm border border-hairline px-3.5 py-2.5 sm:py-2 text-xs font-medium text-ink hover:bg-[#ECE9E1] transition-colors disabled:opacity-50 cursor-pointer min-h-[40px] sm:min-h-0"
          >
            {isRegenerating ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <RotateCcw className="h-3.5 w-3.5 text-muted-ink" />
            )}
            <span>
              {isRegenerating
                ? "Regenerating..."
                : reachedRegenCap
                ? `Regenerate (${maxRegenerations}/${maxRegenerations} used)`
                : isFreePlan && typeof regenerationCount === "number" && regenerationCount > 0
                ? `Regenerate (${regenerationCount}/${maxRegenerations})`
                : "Regenerate"}
            </span>
          </button>

          <button
            type="button"
            onClick={handleSend}
            disabled={
              isSending ||
              isRegenerating ||
              reachedSendCap ||
              !subject.trim() ||
              !body.trim() ||
              !recipientEmail.trim()
            }
            title={
              reachedSendCap
                ? "Monthly free send limit reached. Upgrade to Pro to send."
                : "Send letter directly via Gmail"
            }
            className={`flex-1 sm:flex-none inline-flex items-center justify-center gap-2 rounded-sm px-5 py-2.5 sm:py-2 text-xs font-medium shadow-xs transition-all disabled:opacity-50 min-h-[40px] sm:min-h-0 ${
              reachedSendCap
                ? "bg-muted-ink/30 text-paper cursor-not-allowed"
                : "bg-seal text-paper hover:bg-seal/90 cursor-pointer"
            }`}
          >
            {isSending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : reachedSendCap ? (
              <Lock className="h-3.5 w-3.5" />
            ) : (
              <Send className="h-3.5 w-3.5" />
            )}
            <span>
              {isSending
                ? "Sending..."
                : reachedSendCap
                ? `Limit reached (${monthlyLimit}/${monthlyLimit})`
                : "Send letter"}
            </span>
          </button>
        </div>
      </div>
    </motion.div>
  );
}
