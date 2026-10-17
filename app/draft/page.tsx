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
  Sparkles,
  ShieldCheck,
  RotateCcw,
  Check,
  Lock,
  Building2,
  X,
  FileCheck,
} from "lucide-react";
import { LetterFrame } from "@/components/letter-frame";
import type { AnalyzeResponse, Resume, UserUsage } from "@/lib/types/database";
import { initiateCheckout } from "@/lib/billing";
import { FREE_MONTHLY_LIMIT } from "@/lib/constants/plans";

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
  const [isDailyCapped, setIsDailyCapped] = useState(false);
  const [recipientValidation, setRecipientValidation] = useState<{
    isValid: boolean;
    error?: string;
    suggestion?: string;
    domain?: string;
    mxHost?: string;
  } | null>(null);
  const [isValidatingEmail, setIsValidatingEmail] = useState(false);

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
            if (
              typeof pData.usage.dailySends === "number" &&
              typeof pData.usage.dailyLimit === "number" &&
              pData.usage.dailySends >= pData.usage.dailyLimit
            ) {
              setIsDailyCapped(true);
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
        // Check if user clicked "Draft & Send Letter" from the Opportunities / Jobs feed
        const incomingJobRaw = sessionStorage.getItem("vina_incoming_job");
        if (incomingJobRaw) {
          sessionStorage.removeItem("vina_incoming_job");
          const incoming = JSON.parse(incomingJobRaw);
          if (incoming?.jdText) {
            setTimeout(() => {
              setJdText(incoming.jdText || "");
              setHrEmail(incoming.hrEmail || "");
              setStep("input");
              setAnalyzedData(null);
              setRestoredNotice(
                `Imported position: ${incoming.title || "Job"} at ${incoming.company || "Company"}`
              );
              toast.success(`Loaded "${incoming.title || "Job"}" from Opportunities.`);
            }, 0);
            isHydratedRef.current = true;
            return;
          }
        }

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

  // Check duplicate email & validate recipient MX when hrEmail changes
  useEffect(() => {
    if (!hrEmail || !hrEmail.includes("@") || hrEmail.length < 5) {
      const timer = setTimeout(() => {
        setIsDuplicateEmail(false);
        setRecipientValidation(null);
        setIsValidatingEmail(false);
      }, 0);
      return () => clearTimeout(timer);
    }

    const timer = setTimeout(async () => {
      setIsValidatingEmail(true);
      try {
        const trimmed = hrEmail.trim();
        const promises: Promise<Response>[] = [
          fetch("/api/validate-recipient", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: trimmed }),
          }),
        ];

        if (!followUpContext) {
          promises.push(fetch(`/api/emails?email=${encodeURIComponent(trimmed)}`));
        }

        const [valRes, dupRes] = await Promise.all(promises);

        if (valRes && valRes.ok) {
          const vData = await valRes.json();
          setRecipientValidation(vData);
        }

        if (dupRes && dupRes.ok) {
          const dData = await dupRes.json();
          setIsDuplicateEmail(Boolean(dData.exists));
        } else if (!dupRes) {
          setIsDuplicateEmail(false);
        }
      } catch {
        // Silently continue if network check fails
      } finally {
        setIsValidatingEmail(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [hrEmail, followUpContext]);

  const handleUpgrade = async () => {
    setIsUpgrading(true);
    try {
      await initiateCheckout({ onFallback: () => router.push("/settings") });
    } finally {
      setIsUpgrading(false);
    }
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isMonthlyCapped) {
      toast.error(
        "You've reached your free limit of 5 letters this month. Please upgrade to Pro to continue drafting."
      );
      await handleUpgrade();
      return;
    }

    if (isSafetyDailyCapped) {
      toast.error(
        "Gmail Safety Shield: Safe daily limit reached (50/50 letters). Dispatches pause to protect your account reputation and will resume tomorrow."
      );
      return;
    }

    if (!jdText.trim() || jdText.trim().length < 30) {
      toast.error("Please paste a more detailed Job Description (at least 30 characters).");
      return;
    }

    if (!hrEmail.trim() || !hrEmail.includes("@")) {
      toast.error("Please enter a valid recipient HR / hiring manager email address.");
      return;
    }

    if (recipientValidation && !recipientValidation.isValid) {
      if (recipientValidation.suggestion) {
        toast.error(`Please check the recipient address: Did you mean ${recipientValidation.suggestion}?`);
      } else {
        toast.error(recipientValidation.error || "Please verify the recipient email address.");
      }
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
            isRegeneration: true,
            regenerationCount,
          }
        : {
            type: "initial",
            jdText,
            resumeId: selectedResume?.id,
            isRegeneration: true,
            regenerationCount,
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
      toast.error("That didn't go through. Nothing was sent - try again.");
    } finally {
      setIsSending(false);
    }
  };

  const isFreePlan = usage ? usage.plan === "free" : true;
  const isMonthlyCapped = isCapped || (isFreePlan && usage ? usage.monthlySends >= (usage.monthlyLimit ?? FREE_MONTHLY_LIMIT) : false);
  const isSafetyDailyCapped = isDailyCapped || (usage && typeof usage.dailySends === "number" && typeof usage.dailyLimit === "number" && usage.dailySends >= usage.dailyLimit);

  return (
    <main className="min-h-[calc(100vh-4rem)] bg-paper px-4 py-8 sm:px-6 sm:py-10 pb-24 md:pb-12">
      <div className="mx-auto w-full max-w-5xl space-y-8">
        
        {/* --- Studio Header & Progression Indicator --- */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-hairline/80 pb-6">
          <div className="space-y-1.5">
            {/* Step Breadcrumbs */}
            <div className="flex items-center gap-2 text-xs font-medium">
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-xs transition-colors ${
                step === "input"
                  ? "bg-ink text-paper"
                  : "bg-confirmed/10 text-confirmed border border-confirmed/30"
              }`}>
                {step === "review" && <Check className="h-3 w-3" />}
                1. Role & Recruiter
              </span>
              <span className="text-muted-ink/40">→</span>
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-xs transition-colors ${
                step === "review"
                  ? "bg-seal text-paper"
                  : "text-muted-ink border border-hairline bg-paper/60"
              }`}>
                2. Review & Dispatch
              </span>
            </div>

            <h1 className="font-heading text-2xl sm:text-3xl text-ink font-normal tracking-tight">
              {step === "input" ? "New Letter" : "Review Letter"}
            </h1>
            <p className="text-xs sm:text-sm text-muted-ink max-w-2xl leading-relaxed">
              {step === "input"
                ? "Paste the target job description and recipient email. Vina extracts key requirements and drafts a tailored pitch referencing your background."
                : "Carefully inspect your letter before dispatch. You can refine any phrasing directly - nothing leaves your Gmail without your approval."}
            </p>
          </div>

          {/* Quick Quota Pill */}
          {usage && (
            <div className="self-start sm:self-auto shrink-0 inline-flex items-center gap-2 rounded-sm border border-hairline bg-white/80 px-3 py-1.5 text-xs text-muted-ink shadow-2xs">
              <span className={`h-2 w-2 rounded-full shrink-0 ${isMonthlyCapped ? "bg-amber-600" : "bg-seal"}`} />
              {usage.plan === "pro" ? (
                <span className="font-medium text-ink">Pro Plan • Unlimited Letters</span>
              ) : (
                <span>
                  <strong className="text-ink font-medium">{usage.monthlySends} of {usage.monthlyLimit ?? FREE_MONTHLY_LIMIT}</strong> sent this month
                </span>
              )}
            </div>
          )}
        </div>

        {/* --- Restored Notice Strip (if present) --- */}
        {restoredNotice && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border border-seal/30 bg-[#FAF7F0] p-3.5 sm:px-4 sm:py-3 rounded-sm text-xs shadow-2xs">
            <div className="flex items-center gap-2.5 text-ink min-w-0">
              <Sparkles className="h-4 w-4 text-seal shrink-0" />
              <span className="font-medium text-ink">{restoredNotice}</span>
            </div>
            <button
              type="button"
              onClick={handleDiscardDraft}
              className="inline-flex items-center gap-1 text-muted-ink hover:text-ink underline underline-offset-4 text-xs shrink-0 self-start sm:self-auto cursor-pointer"
            >
              <RotateCcw className="h-3 w-3" />
              <span>Discard & start fresh</span>
            </button>
          </div>
        )}

        {/* --- STEP 1: INPUT WORKSPACE --- */}
        {step === "input" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-start">
            
            {/* Left Main Form Column or Monthly Limit Upgrade Card */}
            <div className="lg:col-span-8">
              {isSafetyDailyCapped ? (
                <div className="rounded-md border border-amber-300/80 bg-[#FAF7F0] p-6 sm:p-8 shadow-xs space-y-5">
                  <div className="flex items-start gap-3.5">
                    <div className="rounded-full bg-amber-500/15 p-2.5 text-amber-800 shrink-0 mt-0.5">
                      <ShieldCheck className="h-5 w-5 text-amber-800" />
                    </div>
                    <div className="space-y-1">
                      <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-xs text-[11px] font-medium bg-amber-100 text-amber-900 border border-amber-300/60 mb-1">
                        Gmail Safety Shield Active (50 of 50 Dispatched)
                      </div>
                      <h2 className="font-heading text-xl sm:text-2xl text-ink font-normal tracking-tight">
                        Safe daily sending ceiling reached
                      </h2>
                      <p className="text-xs sm:text-sm text-muted-ink leading-relaxed">
                        To guarantee your personal Google account reputation is protected against algorithmic spam flags and bulk throttling, Vina caps dispatches at <strong>50 letters per 24 hours</strong>.
                      </p>
                      <p className="text-xs text-muted-ink pt-1">
                        Your safe daily window resets automatically in a few hours. In the meantime, you can review past conversations or prepare notes.
                      </p>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-hairline flex items-center justify-between">
                    <Link
                      href="/log"
                      className="text-xs text-ink hover:text-seal underline underline-offset-4 font-medium"
                    >
                      View your sent letters in History →
                    </Link>
                  </div>
                </div>
              ) : isMonthlyCapped ? (
                <div className="rounded-md border border-seal/30 bg-[#FAF7F0] p-6 sm:p-8 shadow-xs space-y-6">
                  <div className="flex items-start gap-3.5">
                    <div className="rounded-full bg-seal/15 p-2.5 text-seal shrink-0 mt-0.5">
                      <Sparkles className="h-5 w-5" />
                    </div>
                    <div className="space-y-1">
                      <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-xs text-[11px] font-medium bg-amber-100 text-amber-900 border border-amber-300/60 mb-1">
                        Free Monthly Limit Reached (5 of 5 Sent)
                      </div>
                      <h2 className="font-heading text-xl sm:text-2xl text-ink font-normal tracking-tight">
                        You&apos;ve reached your limit of 5 free letters
                      </h2>
                      <p className="text-xs sm:text-sm text-muted-ink leading-relaxed">
                        Free accounts include 5 sent letters per calendar month. To continue drafting and sending tailored applications directly from your Gmail, upgrade to <strong>Vina Pro</strong>.
                      </p>
                    </div>
                  </div>

                  {/* Pro Value Props Checklist */}
                  <div className="rounded-sm border border-hairline bg-paper/80 p-4 sm:p-5 space-y-2.5 text-xs">
                    <p className="text-[11px] font-semibold text-ink uppercase tracking-wider">
                      Included with Vina Pro - $9 / month (₹499)
                    </p>
                    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-ink">
                      <li className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-confirmed shrink-0" />
                        <span><strong>Unlimited</strong> tailored letters</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-confirmed shrink-0" />
                        <span><strong>1-Click follow-ups</strong> in same thread</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-confirmed shrink-0" />
                        <span><strong>Up to 3</strong> résumé versions</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-confirmed shrink-0" />
                        <span><strong>Unlimited</strong> AI regenerations</span>
                      </li>
                    </ul>
                  </div>

                  {/* Upgrade Actions */}
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
                    <button
                      type="button"
                      disabled={isUpgrading}
                      onClick={handleUpgrade}
                      className="inline-flex items-center justify-center gap-2 rounded-sm bg-seal px-6 py-3 text-xs sm:text-sm font-medium text-white hover:bg-seal/90 disabled:opacity-50 transition-all shadow-xs cursor-pointer min-h-[44px]"
                    >
                      {isUpgrading ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span>Connecting to secure checkout...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-4 w-4" />
                          <span>Upgrade to Pro - $9 / month</span>
                          <ArrowRight className="h-4 w-4 ml-1" />
                        </>
                      )}
                    </button>

                    <Link
                      href="/log"
                      className="text-xs text-muted-ink hover:text-ink underline underline-offset-4 text-center sm:text-right py-1 font-medium"
                    >
                      View your sent letters in History →
                    </Link>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleGenerate} className="rounded-md border border-hairline bg-white/85 p-5 sm:p-7 shadow-2xs space-y-6">
                
                {/* Send To Input */}
                <div className="space-y-2">
                  <div className="flex items-baseline justify-between gap-2">
                    <label htmlFor="hr-email" className="block text-xs font-semibold text-ink">
                      Send to <span className="text-seal">*</span>
                    </label>
                    <span className="text-[11px] text-muted-ink">Recruiter, founder, or hiring manager</span>
                  </div>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-ink/70" />
                    <input
                      id="hr-email"
                      type="email"
                      value={hrEmail}
                      onChange={(e) => setHrEmail(e.target.value)}
                      placeholder="e.g. alex@company.com or hiring@startup.io"
                      required
                      className="w-full rounded-sm border border-hairline bg-paper/60 pl-10 pr-4 py-2.5 text-xs sm:text-sm text-ink placeholder:text-muted-ink/60 focus:bg-white focus:border-seal focus:outline-none transition-colors font-mono"
                    />
                  </div>

                  {isValidatingEmail && (
                    <div className="flex items-center gap-1.5 text-[11px] text-muted-ink pt-0.5">
                      <Loader2 className="h-3 w-3 animate-spin shrink-0" />
                      <span>Checking recipient mail server (DNS MX)...</span>
                    </div>
                  )}

                  {recipientValidation?.suggestion && (
                    <div className="flex items-center justify-between gap-2 text-[11px] text-amber-900 bg-amber-50/90 border border-amber-200/80 px-2.5 py-1.5 rounded-sm">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <AlertCircle className="h-3.5 w-3.5 shrink-0 text-amber-700" />
                        <span className="truncate">
                          Did you mean{" "}
                          <button
                            type="button"
                            onClick={() => setHrEmail(recipientValidation.suggestion!)}
                            className="font-mono font-semibold underline hover:text-amber-950 cursor-pointer"
                          >
                            {recipientValidation.suggestion}
                          </button>
                          ?
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setHrEmail(recipientValidation.suggestion!)}
                        className="text-[10px] font-semibold text-amber-900 hover:text-amber-950 underline shrink-0 cursor-pointer"
                      >
                        Apply fix
                      </button>
                    </div>
                  )}

                  {recipientValidation && !recipientValidation.isValid && !recipientValidation.suggestion && (
                    <div className="flex items-center gap-1.5 text-[11px] text-red-700 bg-red-50/80 border border-red-200/70 px-2.5 py-1.5 rounded-sm">
                      <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                      <span>{recipientValidation.error}</span>
                    </div>
                  )}

                  {recipientValidation?.isValid && !isDuplicateEmail && (
                    <div className="flex items-center gap-1.5 text-[11px] text-confirmed pt-0.5">
                      <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-confirmed" />
                      <span>Mail server verified (active MX records found)</span>
                    </div>
                  )}

                  {isDuplicateEmail && (
                    <div className="flex items-center gap-1.5 text-[11px] text-amber-700 pt-0.5">
                      <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                      <span>Note: You have previously sent a letter to this recipient address.</span>
                    </div>
                  )}
                </div>

                {/* Job Description Textarea */}
                <div className="space-y-2">
                  <div className="flex items-baseline justify-between gap-2">
                    <label htmlFor="jd-text" className="block text-xs font-semibold text-ink">
                      Job Description <span className="text-seal">*</span>
                    </label>
                    <div className="flex items-center gap-3 text-[11px] text-muted-ink">
                      {jdText.length > 0 && (
                        <button
                          type="button"
                          onClick={() => setJdText("")}
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
                    minRows={10}
                    value={jdText}
                    onChange={(e) => setJdText(e.target.value)}
                    placeholder="Paste the full job posting here (responsibilities, required qualifications, tech stack, company context)..."
                    required
                    className="w-full resize-none rounded-sm border border-hairline bg-paper/60 p-3.5 text-xs sm:text-sm text-ink placeholder:text-muted-ink/60 focus:bg-white focus:border-seal focus:outline-none transition-colors leading-relaxed"
                  />
                  <p className="text-[11px] text-muted-ink">
                    Vina reads the entire JD to identify the specific problems this team is hiring to solve.
                  </p>
                </div>

                {/* Submit Action Strip */}
                <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-t border-hairline/80">
                  <div className="text-[11px] text-muted-ink flex items-center gap-1.5">
                    <ShieldCheck className="h-3.5 w-3.5 text-confirmed" />
                    <span>Nothing is sent automatically. You review everything first.</span>
                  </div>

                  <button
                    type="submit"
                    disabled={isAnalyzing || !jdText.trim() || !hrEmail.trim()}
                    className="inline-flex items-center justify-center gap-2 rounded-sm bg-ink px-6 py-2.5 text-xs font-medium text-paper hover:bg-ink/90 disabled:opacity-50 transition-all shadow-xs cursor-pointer min-h-[42px]"
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
              )}
            </div>

            {/* Right Sidebar: Sender Profile & Readiness Checklist */}
            <aside aria-label="Sending Setup and Readiness" className="lg:col-span-4 space-y-4">
              
              {/* Sender Setup Card */}
              <div className="rounded-md border border-hairline bg-white/70 p-5 shadow-2xs space-y-4">
                <div className="border-b border-hairline/80 pb-3">
                  <h2 className="font-heading text-sm text-ink font-medium">
                    Dispatch Readiness
                  </h2>
                  <p className="text-[11px] text-muted-ink mt-0.5">
                    Verified configuration for outgoing correspondence.
                  </p>
                </div>

                {/* 1. Gmail Status */}
                <div className="flex items-start justify-between gap-3 text-xs">
                  <div className="flex items-start gap-2.5 min-w-0">
                    <Mail className="h-4 w-4 text-muted-ink mt-0.5 shrink-0" />
                    <div className="min-w-0">
                      <p className="font-medium text-ink">Gmail Account</p>
                      {isGmailLoading ? (
                        <p className="text-[11px] text-muted-ink">Checking connection...</p>
                      ) : isGmailConnected ? (
                        <p className="text-[11px] text-muted-ink truncate font-mono">
                          {gmailAddress || "Connected"}
                        </p>
                      ) : (
                        <p className="text-[11px] text-amber-700">Not connected</p>
                      )}
                    </div>
                  </div>

                  <div className="shrink-0 pt-0.5">
                    {isGmailConnected ? (
                      <span className="inline-flex items-center gap-1 text-[10px] text-confirmed bg-confirmed/10 px-1.5 py-0.5 rounded-xs border border-confirmed/25 font-medium">
                        <Check className="h-2.5 w-2.5" /> Ready
                      </span>
                    ) : (
                      <Link
                        href="/settings?tab=gmail"
                        className="text-[11px] text-seal hover:underline font-medium"
                      >
                        Connect →
                      </Link>
                    )}
                  </div>
                </div>

                {/* 2. Résumé Status */}
                <div className="flex items-start justify-between gap-3 text-xs border-t border-hairline/60 pt-3">
                  <div className="flex items-start gap-2.5 min-w-0">
                    <FileText className="h-4 w-4 text-muted-ink mt-0.5 shrink-0" />
                    <div className="min-w-0">
                      <p className="font-medium text-ink">Attached Résumé</p>
                      {isResumeLoading ? (
                        <p className="text-[11px] text-muted-ink">Loading résumé...</p>
                      ) : resume?.file_url ? (
                        <div className="mt-1">
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
                              className="w-full bg-paper border border-hairline rounded-xs px-2 py-1 text-[11px] text-ink focus:border-seal focus:outline-none cursor-pointer truncate"
                            >
                              {resumes.map((r) => (
                                <option key={r.id} value={r.id}>
                                  {r.label || "Primary"} ({r.file_name || "PDF"})
                                </option>
                              ))}
                            </select>
                          ) : (
                            <p className="text-[11px] text-muted-ink truncate">
                              {selectedResume?.label || selectedResume?.file_name || "Uploaded PDF"}
                            </p>
                          )}
                        </div>
                      ) : (
                        <p className="text-[11px] text-amber-700">No résumé uploaded</p>
                      )}
                    </div>
                  </div>

                  <div className="shrink-0 pt-0.5">
                    {resume?.file_url ? (
                      <span className="inline-flex items-center gap-1 text-[10px] text-confirmed bg-confirmed/10 px-1.5 py-0.5 rounded-xs border border-confirmed/25 font-medium">
                        <Check className="h-2.5 w-2.5" /> Attached
                      </span>
                    ) : (
                      <Link
                        href="/settings?tab=resume"
                        className="text-[11px] text-seal hover:underline font-medium"
                      >
                        Upload →
                      </Link>
                    )}
                  </div>
                </div>

                {/* 3. Monthly Sends Quota */}
                <div className="flex items-start justify-between gap-3 text-xs border-t border-hairline/60 pt-3">
                  <div className="flex items-start gap-2.5 min-w-0">
                    <FileCheck className="h-4 w-4 text-muted-ink mt-0.5 shrink-0" />
                    <div className="min-w-0">
                      <p className="font-medium text-ink">Monthly Dispatch Quota</p>
                      {usage ? (
                        <p className="text-[11px] text-muted-ink">
                          {usage.plan === "pro"
                            ? "Unlimited letters on Pro"
                            : `${usage.monthlySends} of ${usage.monthlyLimit ?? FREE_MONTHLY_LIMIT} letters used`}
                        </p>
                      ) : (
                        <p className="text-[11px] text-muted-ink">5 free letters / month</p>
                      )}
                    </div>
                  </div>

                  <div className="shrink-0 pt-0.5">
                    {usage?.plan === "pro" ? (
                      <span className="inline-flex items-center gap-1 text-[10px] text-confirmed bg-confirmed/10 px-1.5 py-0.5 rounded-xs border border-confirmed/25 font-medium">
                        Pro Active
                      </span>
                    ) : isMonthlyCapped ? (
                      <button
                        type="button"
                        onClick={handleUpgrade}
                        className="text-[11px] text-seal hover:underline font-medium cursor-pointer"
                      >
                        Upgrade →
                      </button>
                    ) : (
                      <span className="text-[11px] text-muted-ink">
                        {(usage?.monthlyLimit ?? FREE_MONTHLY_LIMIT) - (usage?.monthlySends ?? 0)} left
                      </span>
                    )}
                  </div>
                </div>

              </div>

              {/* Informative Guidance Card */}
              <div className="rounded-md border border-hairline bg-[#FAF9F5] p-5 shadow-2xs space-y-2.5 text-xs">
                <h3 className="font-heading text-xs font-semibold text-ink">
                  How Vina drafts your letter
                </h3>
                <ul className="space-y-2 text-[11px] text-muted-ink leading-relaxed">
                  <li className="flex items-start gap-2">
                    <span className="text-seal font-semibold shrink-0">•</span>
                    <span>Extracts the exact hiring team requirements and core responsibilities from the posting.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-seal font-semibold shrink-0">•</span>
                    <span>Correlates your actual work history and skills from your uploaded résumé.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-seal font-semibold shrink-0">•</span>
                    <span>Formats an executive, concise note (75–125 words) that respects hiring managers&apos; time.</span>
                  </li>
                </ul>
              </div>

            </aside>

          </div>
        )}

        {/* --- STEP 2: REVIEW WORKSPACE --- */}
        {step === "review" && analyzedData && (
          <div className="space-y-6">
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
