"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import TextareaAutosize from "react-textarea-autosize";
import { toast } from "sonner";
import {
  PenLine,
  Loader2,
  AlertCircle,
  ExternalLink,
  Mail,
  ArrowRight,
  CheckCircle2,
  FileText,
} from "lucide-react";
import { LetterFrame } from "@/components/letter-frame";
import type { AnalyzeResponse, Resume, UserUsage } from "@/lib/types/database";
import { initiateCheckout } from "@/lib/billing";

const DRAFT_STORAGE_KEY = "cold_email_draft_session";

export default function DraftPage() {
  const router = useRouter();
  const [step, setStep] = useState<"input" | "review">("input");
  const [jdText, setJdText] = useState("");
  const [hrEmail, setHrEmail] = useState("");
  const [resume, setResume] = useState<Resume | null>(null);
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [selectedResume, setSelectedResume] = useState<Resume | null>(null);
  const [isResumeLoading, setIsResumeLoading] = useState(true);

  // Autosave and restore notice state
  const [restoredNotice, setRestoredNotice] = useState<string | null>(null);
  const isHydratedRef = useRef(false);

  // User Plan & Monthly Quota state
  const [usage, setUsage] = useState<UserUsage | null>(null);
  const [regenerationCount, setRegenerationCount] = useState(0);
  const [isCapped, setIsCapped] = useState(false);

  // Gmail connection state
  const [isGmailConnected, setIsGmailConnected] = useState(false);
  const [gmailAddress, setGmailAddress] = useState<string | undefined>(undefined);
  const [isGmailLoading, setIsGmailLoading] = useState(true);

  // Analysis / Generation state
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [analyzedData, setAnalyzedData] = useState<AnalyzeResponse | null>(null);

  // Follow-up context state
  const [followUpContext, setFollowUpContext] = useState<{
    parentEmailId: string;
    companyName?: string;
    roleTitle?: string;
    originalSubject: string;
    originalSentDate?: string;
    originalBody?: string;
  } | null>(null);

  // Sending state
  const [isSending, setIsSending] = useState(false);
  const [isDuplicateEmail, setIsDuplicateEmail] = useState(false);
  const [isUpgrading, setIsUpgrading] = useState(false);

  // Load active resume, user usage & Gmail connection status
  useEffect(() => {
    async function loadStatus() {
      try {
        const [profileRes, resumeRes, gmailRes] = await Promise.all([
          fetch("/api/profile"),
          fetch("/api/resume"),
          fetch("/api/gmail/status"),
        ]);

        if (profileRes.ok) {
          const pData = await profileRes.json();
          if (pData.usage) {
            setUsage(pData.usage);
            if (pData.usage.plan === "free" && pData.usage.monthlySends >= (pData.usage.monthlyLimit ?? 5)) {
              setIsCapped(true);
            }
          }
        }

        if (resumeRes.ok) {
          const data = await resumeRes.json();
          const list = data.resumes || (data.resume ? [data.resume] : []);
          setResumes(list);
          const active = data.activeResume || list[0] || null;
          setSelectedResume(active);
          setResume(active);
        }

        if (gmailRes.ok) {
          const gData = await gmailRes.json();
          setIsGmailConnected(Boolean(gData.connected));
          setGmailAddress(gData.email);
        }
      } catch (err) {
        console.warn("Could not check settings status:", err);
      } finally {
        setIsResumeLoading(false);
        setIsGmailLoading(false);
      }
    }
    loadStatus();
  }, []);

  // Restore unsaved draft session on initial load (unless arriving via follow-up deep-link)
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const fId = params.get("followUpId");

    if (!fId) {
      try {
        const saved = sessionStorage.getItem(DRAFT_STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed && (parsed.jdText?.trim() || parsed.hrEmail?.trim() || parsed.analyzedData)) {
            setTimeout(() => {
              if (parsed.jdText) setJdText(parsed.jdText);
              if (parsed.hrEmail) setHrEmail(parsed.hrEmail);
              if (parsed.step === "review" && parsed.analyzedData) {
                setAnalyzedData(parsed.analyzedData);
                setStep("review");
                setRestoredNotice("Unsaved draft restored from your current session.");
              } else if (parsed.jdText?.trim()) {
                setRestoredNotice("Unsaved job description restored from your current session.");
              }
            }, 0);
          }
        }
      } catch (err) {
        console.warn("Could not read draft session from sessionStorage:", err);
      }
    }
    isHydratedRef.current = true;
  }, []);

  // Autosave active draft to sessionStorage on changes
  useEffect(() => {
    if (!isHydratedRef.current || typeof window === "undefined") return;

    // In follow-up mode, do not overwrite regular draft session
    if (followUpContext) return;

    if (!jdText.trim() && !hrEmail.trim() && !analyzedData) {
      try {
        sessionStorage.removeItem(DRAFT_STORAGE_KEY);
      } catch {}
      return;
    }

    try {
      const sessionPayload = {
        step,
        jdText,
        hrEmail,
        analyzedData,
        savedAt: Date.now(),
      };
      sessionStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(sessionPayload));
    } catch (err) {
      console.warn("Could not save draft session to sessionStorage:", err);
    }
  }, [step, jdText, hrEmail, analyzedData, followUpContext]);

  const handleDiscardDraft = () => {
    setJdText("");
    setHrEmail("");
    setAnalyzedData(null);
    setFollowUpContext(null);
    setStep("input");
    setRestoredNotice(null);
    setRegenerationCount(0);
    try {
      sessionStorage.removeItem(DRAFT_STORAGE_KEY);
    } catch {}
    toast.info("Draft discarded.");
  };

  const handleDraftChange = useCallback((updated: {
    subject: string;
    body: string;
    companyName?: string;
    roleTitle?: string;
    hrEmail?: string;
  }) => {
    if (updated.hrEmail && updated.hrEmail !== hrEmail) {
      setHrEmail(updated.hrEmail);
    }
    setAnalyzedData((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        subject: updated.subject,
        body: updated.body,
        companyName: updated.companyName ?? prev.companyName,
        roleTitle: updated.roleTitle ?? prev.roleTitle,
      };
    });
  }, [hrEmail]);

  // Check URL for followUpId to trigger One-Click Follow-Up generation
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const fId = params.get("followUpId");
    if (!fId) return;

    async function loadFollowUp(id: string) {
      setIsAnalyzing(true);
      try {
        const res = await fetch(`/api/emails?id=${encodeURIComponent(id)}`);
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || "Failed to load previous email.");
        }

        if (data.plan !== "pro") {
          toast.error("Follow-ups are a Pro feature.");
          router.push("/settings");
          return;
        }

        const email = data.email;
        setHrEmail(email.hr_email);
        const formattedDate = new Date(email.created_at).toLocaleDateString(undefined, {
          month: "short",
          day: "numeric",
          year: "numeric",
        });

        const ctx = {
          parentEmailId: email.id,
          companyName: email.company_name || undefined,
          roleTitle: email.role_title || undefined,
          originalSubject: email.final_subject || email.generated_subject,
          originalBody: email.final_body || email.generated_body,
          originalSentDate: formattedDate,
        };
        setFollowUpContext(ctx);

        // Trigger follow-up generation
        const analyzeRes = await fetch("/api/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "followup",
            parentEmailId: email.id,
          }),
        });

        const analyzeData = await analyzeRes.json();
        if (!analyzeRes.ok) {
          throw new Error(analyzeData.error || "Failed to draft follow-up.");
        }

        setAnalyzedData(analyzeData);
        setStep("review");
        toast.success("Follow-up draft prepared.");
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Error drafting follow-up.";
        toast.error(msg);
      } finally {
        setIsAnalyzing(false);
      }
    }

    loadFollowUp(fId);
  }, [router]);

  // Check duplicate email when hrEmail changes
  useEffect(() => {
    if (followUpContext) {
      // In follow-up mode, duplicate check against previous email is intended
      const timer = setTimeout(() => setIsDuplicateEmail(false), 0);
      return () => clearTimeout(timer);
    }

    if (!hrEmail || !hrEmail.includes("@")) {
      const timer = setTimeout(() => setIsDuplicateEmail(false), 0);
      return () => clearTimeout(timer);
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
  }, [hrEmail, followUpContext]);

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
        body: JSON.stringify({
          jdText,
          type: "initial",
          resumeId: selectedResume?.id,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to analyze Job Description.");
      }

      setAnalyzedData(data);
      setFollowUpContext(null);
      setRegenerationCount(0);
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
    const isFreePlan = usage ? usage.plan === "free" : true;
    const maxRegens = isFreePlan ? 2 : Infinity;

    if (regenerationCount >= maxRegens) {
      toast.error("You've used both free rewrites for this draft. Send this version, or upgrade for unlimited rewrites.");
      return;
    }

    setIsRegenerating(true);
    try {
      const payload = followUpContext
        ? {
            type: "followup",
            parentEmailId: followUpContext.parentEmailId,
            resumeId: selectedResume?.id,
          }
        : {
            type: "initial",
            jdText,
            resumeId: selectedResume?.id,
          };

      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to draft a new version.");
      }

      setAnalyzedData(data);
      setRegenerationCount((prev) => prev + 1);
      toast.success("New draft ready.");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error drafting a new version.";
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
    hrEmail?: string;
  }) => {
    const targetEmail = (finalData.hrEmail || hrEmail).trim();
    if (!targetEmail) {
      toast.error("Please provide a recipient email address.");
      return;
    }

    if (!isGmailConnected) {
      toast.error("Please connect your Gmail account in Settings before sending.", {
        action: {
          label: "Connect",
          onClick: () => {
            router.push("/settings");
          },
        },
      });
      return;
    }

    setIsSending(true);
    try {
      const res = await fetch("/api/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          hrEmail: targetEmail,
          subject: finalData.subject,
          body: finalData.body,
          jdText: jdText || (followUpContext ? `Follow-up regarding ${followUpContext.originalSubject}` : ""),
          companyName: finalData.companyName,
          roleTitle: finalData.roleTitle,
          emailType: followUpContext ? "followup" : "initial",
          parentEmailId: followUpContext?.parentEmailId,
          resumeId: selectedResume?.id,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        if (data.code === "PLAN_LIMIT_REACHED") {
          setIsCapped(true);
          if (data.sentCount && usage) {
            setUsage({ ...usage, monthlySends: data.sentCount });
          }
        }
        throw new Error(data.error || "Failed to send letter.");
      }

      toast.success(`Sent. It's on its way to ${targetEmail}.`);
      // Increment local monthly sends count
      setUsage((prev) =>
        prev ? { ...prev, monthlySends: prev.monthlySends + 1 } : null
      );
      // Clear session storage on successful send
      try {
        sessionStorage.removeItem(DRAFT_STORAGE_KEY);
      } catch {}
      setRestoredNotice(null);

      // Return to fresh input state
      setStep("input");
      setJdText("");
      setHrEmail("");
      setAnalyzedData(null);
      setFollowUpContext(null);
      setRegenerationCount(0);
      if (typeof window !== "undefined") {
        window.history.replaceState({}, "", "/draft");
      }
    } catch {
      toast.error("That didn't go through. Nothing was sent — try again.");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <main className="flex flex-1 flex-col px-4 py-6 sm:px-6 sm:py-10 pb-24 md:pb-10">
      <div className="mx-auto w-full max-w-2xl">
        {step === "input" && (
          <div className="space-y-6 sm:space-y-8">
            {/* Header */}
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <h1 className="font-heading text-xl sm:text-2xl md:text-3xl text-ink">
                  New letter
                </h1>
                {usage && (
                  <div className="inline-flex items-center gap-1.5 text-xs text-muted-ink">
                    <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${usage.plan === "free" && usage.monthlySends >= (usage.monthlyLimit ?? 5) ? "bg-amber-700" : "bg-seal"}`}></span>
                    {usage.plan === "pro" ? (
                      <span className="font-medium text-ink">Pro Plan • Unlimited</span>
                    ) : (
                      <span>
                        <strong className="font-medium text-ink">{usage.monthlySends} of {usage.monthlyLimit ?? 5}</strong> letters sent this month
                      </span>
                    )}
                  </div>
                )}
              </div>
              <p className="mt-1 text-xs sm:text-sm text-muted-ink leading-relaxed">
                Paste the job description and recipient email. Vina drafts a tailored letter for you to review before anything is sent.
              </p>
            </div>

            {/* Restored draft notice banner */}
            {restoredNotice && (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border border-hairline bg-[#FAF9F5] p-3.5 sm:p-4 rounded-sm text-xs">
                <div className="flex items-center gap-2 text-ink min-w-0">
                  <CheckCircle2 className="h-4 w-4 text-confirmed shrink-0" />
                  <span className="font-medium text-ink">{restoredNotice}</span>
                </div>
                <button
                  type="button"
                  onClick={handleDiscardDraft}
                  className="text-muted-ink hover:text-ink underline underline-offset-4 text-xs shrink-0 self-start sm:self-auto cursor-pointer"
                >
                  Discard & start fresh
                </button>
              </div>
            )}

            {/* Quota reached callout banner if capped on free tier */}
            {usage?.plan === "free" && usage.monthlySends >= (usage.monthlyLimit ?? 5) && (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border border-seal/30 bg-[#FAF9F5] p-3.5 sm:p-4 rounded-sm text-xs">
                <div className="flex items-start gap-2.5 min-w-0">
                  <AlertCircle className="h-4 w-4 shrink-0 text-seal mt-0.5" />
                  <div>
                    <p className="font-medium text-ink">
                      You&apos;ve sent 5 letters this month on the free plan.
                    </p>
                    <p className="text-muted-ink mt-0.5">
                      Upgrade to Pro to send more letters and unlock follow-ups.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  disabled={isUpgrading}
                  onClick={async () => {
                    setIsUpgrading(true);
                    try {
                      await initiateCheckout({ onFallback: () => router.push("/settings") });
                    } finally {
                      setIsUpgrading(false);
                    }
                  }}
                  className="inline-flex items-center justify-center gap-1.5 rounded-sm bg-seal px-3.5 py-1.5 text-xs font-medium text-paper hover:bg-seal/90 shrink-0 self-start sm:self-auto transition-colors cursor-pointer disabled:opacity-50"
                >
                  {isUpgrading && <Loader2 className="h-3 w-3 animate-spin" />}
                  <span>Upgrade to send more</span>
                  <ArrowRight className="h-3 w-3" />
                </button>
              </div>
            )}

            {/* Gmail connection status banner */}
            {!isGmailLoading && !isGmailConnected && (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border border-hairline bg-[#FAF9F5] p-3.5 sm:p-4 rounded-sm">
                <div className="flex items-start gap-3 min-w-0">
                  <Mail className="mt-0.5 h-4 w-4 shrink-0 text-muted-ink" />
                  <div className="text-xs">
                    <p className="font-medium text-ink">Connect your Gmail to start sending.</p>
                    <p className="text-muted-ink mt-0.5">
                      Vina asks for permission to send messages on your behalf and never reads your incoming mail.
                    </p>
                  </div>
                </div>
                <Link
                  href="/settings?tab=gmail"
                  className="inline-flex items-center gap-1 text-xs text-ink hover:underline underline-offset-4 shrink-0 self-start sm:self-auto py-1"
                >
                  <span>Connect Gmail</span>
                  <ExternalLink className="h-3 w-3" />
                </Link>
              </div>
            )}

            {/* Resume status banner */}
            {!isResumeLoading && !resume?.file_url && (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border border-hairline bg-[#FAF9F5] p-3.5 sm:p-4 rounded-sm">
                <div className="flex items-start gap-3 min-w-0">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-muted-ink" />
                  <div className="text-xs">
                    <p className="font-medium text-ink">No résumé uploaded yet</p>
                    <p className="text-muted-ink mt-0.5">
                      Upload your résumé (PDF) so Vina can reference it in your letters.
                    </p>
                  </div>
                </div>
                <Link
                  href="/settings?tab=resume"
                  className="inline-flex items-center gap-1 text-xs text-ink hover:underline underline-offset-4 shrink-0 self-start sm:self-auto py-1"
                >
                  <span>Upload résumé</span>
                  <ExternalLink className="h-3 w-3" />
                </Link>
              </div>
            )}

            {/* Active Résumé Indicator / Selector */}
            {!isResumeLoading && resumes.length > 0 && (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-4 border border-hairline bg-[#FAF9F5] p-3 sm:px-3.5 sm:py-2.5 rounded-sm text-xs">
                <div className="flex items-start sm:items-center gap-2.5 min-w-0 flex-1">
                  <FileText className="h-4 w-4 text-muted-ink shrink-0 mt-0.5 sm:mt-0" />
                  <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 min-w-0 flex-1">
                    <span className="text-muted-ink shrink-0 font-medium sm:font-normal">
                      Attached résumé:
                    </span>
                    {resumes.length > 1 ? (
                      <select
                        value={selectedResume?.id || ""}
                        onChange={(e) => {
                          const target = resumes.find((r) => r.id === e.target.value);
                          if (target) {
                            setSelectedResume(target);
                            setResume(target);
                          }
                        }}
                        className="w-full sm:w-auto bg-paper border border-hairline rounded-sm px-2 py-1 text-xs font-medium text-ink focus:border-seal focus:outline-none cursor-pointer truncate"
                      >
                        {resumes.map((r) => (
                          <option key={r.id} value={r.id}>
                            {r.label || "Primary Résumé"} {r.is_default ? "• Default" : ""} ({r.file_name || "PDF"})
                          </option>
                        ))}
                      </select>
                    ) : (
                      <span className="font-medium text-ink truncate text-xs">
                        {selectedResume?.label || "Primary Résumé"}{" "}
                        <span className="text-muted-ink font-normal">
                          ({selectedResume?.file_name || "PDF"})
                        </span>
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 pt-1.5 sm:pt-0 border-t border-hairline/60 sm:border-t-0 text-[11px]">
                  {usage?.plan === "pro" ? (
                    <Link
                      href="/settings?tab=resume"
                      className="text-muted-ink hover:text-ink underline underline-offset-2"
                    >
                      Manage résumés
                    </Link>
                  ) : (
                    <Link
                      href="/settings?tab=billing"
                      className="text-seal hover:underline underline-offset-2 font-medium"
                    >
                      Upgrade for role-specific résumés
                    </Link>
                  )}
                </div>
              </div>
            )}

            {/* Input Form */}
            <form onSubmit={handleGenerate} className="space-y-5 sm:space-y-6">
              {/* Recipient HR Email */}
              <div className="space-y-1.5 sm:space-y-2">
                <div className="flex items-baseline justify-between gap-2">
                  <label htmlFor="hr-email" className="block text-xs font-medium uppercase tracking-wider text-muted-ink">
                    Send to
                  </label>
                  <span className="text-[11px] text-muted-ink shrink-0">HR or hiring manager email</span>
                </div>
                <input
                  id="hr-email"
                  type="email"
                  value={hrEmail}
                  onChange={(e) => setHrEmail(e.target.value)}
                  placeholder="recruiter@company.com"
                  required
                  className="w-full rounded-sm border border-hairline bg-paper px-3.5 py-2.5 text-sm text-ink placeholder:text-muted-ink/60 focus:border-seal focus:outline-none transition-colors font-mono min-h-[42px]"
                />
              </div>

              {/* Job Description */}
              <div className="space-y-1.5 sm:space-y-2">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <label htmlFor="jd-text" className="block text-xs font-medium uppercase tracking-wider text-muted-ink">
                    Job Description
                  </label>
                  <div className="flex items-center gap-2.5 text-[11px] text-muted-ink shrink-0">
                    {jdText.length > 0 && (
                      <button
                        type="button"
                        onClick={handleDiscardDraft}
                        className="hover:text-ink underline underline-offset-2 cursor-pointer"
                      >
                        Clear
                      </button>
                    )}
                    <span>
                      {jdText.length > 0 ? `${jdText.length} characters` : "Full posting"}
                    </span>
                  </div>
                </div>
                <TextareaAutosize
                  id="jd-text"
                  minRows={8}
                  value={jdText}
                  onChange={(e) => setJdText(e.target.value)}
                  placeholder="Paste the full job description here."
                  required
                  className="w-full resize-none rounded-sm border border-hairline bg-paper px-3.5 py-3 text-sm text-ink placeholder:text-muted-ink/60 focus:border-seal focus:outline-none transition-colors leading-relaxed"
                />
              </div>

              {/* Submit Action */}
              <div className="flex items-center justify-end pt-1 sm:pt-2">
                <button
                  type="submit"
                  disabled={isAnalyzing || !jdText.trim() || !hrEmail.trim()}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-sm bg-ink px-5 py-2.5 text-xs font-medium text-paper hover:bg-ink/90 disabled:opacity-50 transition-all shadow-xs cursor-pointer min-h-[42px]"
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      <span>Reading the job description...</span>
                    </>
                  ) : (
                    <>
                      <PenLine className="h-3.5 w-3.5" />
                      <span>Draft this letter</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {step === "review" && analyzedData && (
          <div className="space-y-4">
            {restoredNotice && (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border border-hairline bg-[#FAF9F5] p-3.5 sm:p-4 rounded-sm text-xs">
                <div className="flex items-center gap-2 text-ink min-w-0">
                  <CheckCircle2 className="h-4 w-4 text-confirmed shrink-0" />
                  <span className="font-medium text-ink">{restoredNotice}</span>
                </div>
                <button
                  type="button"
                  onClick={handleDiscardDraft}
                  className="text-muted-ink hover:text-ink underline underline-offset-4 text-xs shrink-0 self-start sm:self-auto cursor-pointer"
                >
                  Discard & start fresh
                </button>
              </div>
            )}
            <LetterFrame
              key={followUpContext ? `followup-${followUpContext.parentEmailId}` : "main-draft"}
              initialData={analyzedData}
              hrEmail={hrEmail}
              isDuplicateEmail={isDuplicateEmail}
              senderEmail={gmailAddress}
              isGmailConnected={isGmailConnected}
              usage={usage ?? undefined}
              regenerationCount={regenerationCount}
              maxRegenerations={usage?.plan === "pro" ? Infinity : 2}
              isCapped={isCapped}
              isFollowUp={Boolean(followUpContext)}
              originalSentDate={followUpContext?.originalSentDate}
              onRegenerate={handleRegenerate}
              isRegenerating={isRegenerating}
              onBack={() => {
                if (followUpContext) {
                  setFollowUpContext(null);
                  setAnalyzedData(null);
                  setStep("input");
                  if (typeof window !== "undefined") {
                    window.history.replaceState({}, "", "/draft");
                  }
                } else {
                  setStep("input");
                }
              }}
              onSend={handleSend}
              onEmailChange={setHrEmail}
              onDraftChange={handleDraftChange}
              isSending={isSending}
              resumeLabel={
                selectedResume?.label
                  ? `${selectedResume.label}`
                  : selectedResume?.file_name || undefined
              }
            />
          </div>
        )}
      </div>
    </main>
  );
}
