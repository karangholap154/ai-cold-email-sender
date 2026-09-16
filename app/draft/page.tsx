"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import TextareaAutosize from "react-textarea-autosize";
import { toast } from "sonner";
import {
  Sparkles,
  Loader2,
  AlertCircle,
  ExternalLink,
} from "lucide-react";
import { LetterFrame } from "@/components/letter-frame";
import type { AnalyzeResponse, Resume } from "@/lib/types/database";

export default function DraftPage() {
  const [step, setStep] = useState<"input" | "review">("input");
  const [jdText, setJdText] = useState("");
  const [hrEmail, setHrEmail] = useState("");
  const [resume, setResume] = useState<Resume | null>(null);
  const [isResumeLoading, setIsResumeLoading] = useState(true);

  // Analysis / Generation state
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [analyzedData, setAnalyzedData] = useState<AnalyzeResponse | null>(null);

  // Sending state
  const [isSending, setIsSending] = useState(false);
  const [isDuplicateEmail, setIsDuplicateEmail] = useState(false);

  // Load active resume configuration
  useEffect(() => {
    async function checkResume() {
      try {
        const res = await fetch("/api/resume");
        if (res.ok) {
          const data = await res.json();
          if (data.resume) {
            setResume(data.resume);
          }
        }
      } catch (err) {
        console.warn("Could not check resume status:", err);
      } finally {
        setIsResumeLoading(false);
      }
    }
    checkResume();
  }, []);

  // Check duplicate email when hrEmail changes
  useEffect(() => {
    if (!hrEmail || !hrEmail.includes("@")) {
      setIsDuplicateEmail(false);
      return;
    }

    // Check duplicate against existing sent emails
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/emails?email=${encodeURIComponent(hrEmail.trim())}`);
        if (res.ok) {
          const data = await res.json();
          if (data.exists) {
            setIsDuplicateEmail(true);
          } else {
            setIsDuplicateEmail(false);
          }
        }
      } catch {
        // Silently continue if route isn't set up yet
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [hrEmail]);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!jdText.trim() || jdText.trim().length < 30) {
      toast.error("Please paste a more detailed Job Description (at least 30 characters).");
      return;
    }

    if (!hrEmail.trim() || !hrEmail.includes("@")) {
      toast.error("Please enter a valid recipient HR / hiring manager email address.");
      return;
    }

    setIsAnalyzing(true);
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jdText }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to analyze Job Description.");
      }

      setAnalyzedData(data);
      setStep("review");
      toast.success("Draft prepared. Review the letter before sending.");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error analyzing job description.";
      toast.error(msg);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleRegenerate = async () => {
    if (!jdText) return;
    setIsRegenerating(true);
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jdText }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to regenerate letter.");
      }

      setAnalyzedData(data);
      toast.success("New draft generated.");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error regenerating letter.";
      toast.error(msg);
    } finally {
      setIsRegenerating(false);
    }
  };

  const handleSend = async (finalData: {
    subject: string;
    body: string;
    companyName?: string;
    roleTitle?: string;
  }) => {
    setIsSending(true);
    try {
      const res = await fetch("/api/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          hrEmail: hrEmail.trim(),
          subject: finalData.subject,
          body: finalData.body,
          jdText,
          companyName: finalData.companyName,
          roleTitle: finalData.roleTitle,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to send email.");
      }

      toast.success(`Letter sent successfully to ${hrEmail.trim()}`);
      // Return to fresh input state
      setStep("input");
      setJdText("");
      setHrEmail("");
      setAnalyzedData(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error sending email.";
      toast.error(msg);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <main className="flex flex-1 flex-col px-6 py-10">
      <div className="mx-auto w-full max-w-2xl">
        {step === "input" && (
          <div className="space-y-8">
            {/* Header */}
            <div>
              <h1 className="font-heading text-2xl sm:text-3xl text-ink">
                Draft correspondence
              </h1>
              <p className="mt-1 text-sm text-muted-ink leading-relaxed">
                Paste a Job Description and recipient email. The AI will extract the key requirements, match them against your background, and draft a concise, tailored letter for your review.
              </p>
            </div>

            {/* Resume status banner */}
            {!isResumeLoading && !resume?.file_url && (
              <div className="flex items-start justify-between gap-4 border border-hairline bg-[#FAF9F5] p-4 rounded-sm">
                <div className="flex items-start gap-3">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-muted-ink" />
                  <div className="text-xs">
                    <p className="font-medium text-ink">No resume active yet</p>
                    <p className="text-muted-ink mt-0.5">
                      Uploaded PDFs are automatically attached to outgoing emails.
                    </p>
                  </div>
                </div>
                <Link
                  href="/settings"
                  className="inline-flex items-center gap-1 text-xs text-ink hover:underline underline-offset-4 shrink-0"
                >
                  <span>Configure resume</span>
                  <ExternalLink className="h-3 w-3" />
                </Link>
              </div>
            )}

            {/* Input Form */}
            <form onSubmit={handleGenerate} className="space-y-6">
              {/* Recipient HR Email */}
              <div className="space-y-2">
                <div className="flex items-baseline justify-between">
                  <label htmlFor="hr-email" className="block text-xs font-medium uppercase tracking-wider text-muted-ink">
                    Recipient Email
                  </label>
                  <span className="text-[11px] text-muted-ink">HR or hiring manager</span>
                </div>
                <input
                  id="hr-email"
                  type="email"
                  value={hrEmail}
                  onChange={(e) => setHrEmail(e.target.value)}
                  placeholder="recruiter@company.com"
                  required
                  className="w-full rounded-sm border border-hairline bg-paper px-3.5 py-2.5 text-sm text-ink placeholder:text-muted-ink/60 focus:border-seal focus:outline-none transition-colors font-mono"
                />
              </div>

              {/* Job Description */}
              <div className="space-y-2">
                <div className="flex items-baseline justify-between">
                  <label htmlFor="jd-text" className="block text-xs font-medium uppercase tracking-wider text-muted-ink">
                    Job Description
                  </label>
                  <span className="text-[11px] text-muted-ink">
                    {jdText.length > 0 ? `${jdText.length} characters` : "Raw text from posting"}
                  </span>
                </div>
                <TextareaAutosize
                  id="jd-text"
                  minRows={10}
                  value={jdText}
                  onChange={(e) => setJdText(e.target.value)}
                  placeholder="Paste the full job posting text here (roles, responsibilities, required qualifications)..."
                  required
                  className="w-full resize-none rounded-sm border border-hairline bg-paper px-3.5 py-3 text-sm text-ink placeholder:text-muted-ink/60 focus:border-seal focus:outline-none transition-colors leading-relaxed"
                />
              </div>

              {/* Submit Action */}
              <div className="flex items-center justify-end pt-2">
                <button
                  type="submit"
                  disabled={isAnalyzing || !jdText.trim() || !hrEmail.trim()}
                  className="inline-flex items-center gap-2 rounded-sm bg-ink px-5 py-2.5 text-xs font-medium text-paper hover:bg-ink/90 disabled:opacity-50 transition-all shadow-xs cursor-pointer"
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      <span>Analyzing & drafting letter...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-3.5 w-3.5" />
                      <span>Draft letter</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {step === "review" && analyzedData && (
          <LetterFrame
            initialData={analyzedData}
            hrEmail={hrEmail}
            isDuplicateEmail={isDuplicateEmail}
            onRegenerate={handleRegenerate}
            isRegenerating={isRegenerating}
            onBack={() => setStep("input")}
            onSend={handleSend}
            isSending={isSending}
          />
        )}
      </div>
    </main>
  );
}
