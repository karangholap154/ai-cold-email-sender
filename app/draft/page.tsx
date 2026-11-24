"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { LetterFrame } from "@/components/letter-frame";
import { DraftHeader } from "@/components/draft/draft-header";
import { DraftInputForm } from "@/components/draft/draft-input-form";
import { DraftReadinessSidebar } from "@/components/draft/draft-readiness-sidebar";
import type { AnalyzeResponse, Resume, UserUsage } from "@/lib/types/database";
import { initiateCheckout } from "@/lib/billing";
import { isMonthlyCapped as checkMonthlyCapped, isDailySafetyCapped } from "@/lib/usage";
import { formatShortDate } from "@/lib/date";
import { useRecipientValidation } from "@/hooks/use-recipient-validation";
import { type OutreachTone } from "@/lib/tone";
import { INCOMING_JOB_STORAGE_KEY } from "@/app/jobs/page";

const DRAFT_STORAGE_KEY = "cold_email_draft_session";

export default function DraftPage() {
  const router = useRouter();
  const [step, setStep] = useState<"input" | "review">("input");
  const [jdText, setJdText] = useState("");
  const [hrEmail, setHrEmail] = useState("");
  const [tone, setTone] = useState<OutreachTone>("crisp");
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

  // Recipient validation and duplicate outreach tracking hook
  const {
    recipientValidation,
    isValidatingEmail,
    isDuplicate: isDuplicateEmail,
  } = useRecipientValidation(hrEmail, {
    skipDuplicateCheck: Boolean(followUpContext),
  });

  // Sending state
  const [isSending, setIsSending] = useState(false);
  const [isUpgrading, setIsUpgrading] = useState(false);

  // Load active resume, user usage & Gmail connection status
  useEffect(() => {
    async function loadResume() {
      try {
        const res = await fetch("/api/resume");
        if (res.ok) {
          const data = await res.json();
          if (data.resumes && Array.isArray(data.resumes)) {
            setResumes(data.resumes);
            const def = data.resumes.find((r: Resume) => r.is_default) || data.resumes[0];
            setSelectedResume(def || null);
            setResume(def || null);
          } else if (data.resume) {
            setResume(data.resume);
            setSelectedResume(data.resume);
            setResumes([data.resume]);
          }
        }
      } catch (err) {
        console.error("Failed to load user resume:", err);
      } finally {
        setIsResumeLoading(false);
      }
    }

    async function loadUsage() {
      try {
        const res = await fetch("/api/emails");
        if (res.ok) {
          const data = await res.json();
          if (data.usage) {
            setUsage(data.usage);
            if (data.usage.isCapped) setIsCapped(true);
            if (data.usage.isDailyCapped) setIsDailyCapped(true);
          }
        }
      } catch (err) {
        console.error("Failed to load usage status:", err);
      }
    }

    loadResume();
    loadUsage();
  }, []);

  useEffect(() => {
    async function loadStatus() {
      try {
        const res = await fetch("/api/gmail/status");
        if (res.ok) {
          const data = await res.json();
          setIsGmailConnected(data.connected);
          setGmailAddress(data.emailAddress);
        }
      } catch (err) {
        console.error("Failed to check Gmail status:", err);
      } finally {
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
        const incomingJobRaw = sessionStorage.getItem(INCOMING_JOB_STORAGE_KEY);
        if (incomingJobRaw) {
          sessionStorage.removeItem(INCOMING_JOB_STORAGE_KEY);
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

        // Read saved draft prioritizing localStorage with sessionStorage fallback
        let saved: string | null = null;
        try {
          saved = localStorage.getItem(DRAFT_STORAGE_KEY) || sessionStorage.getItem(DRAFT_STORAGE_KEY);
        } catch {
          saved = sessionStorage.getItem(DRAFT_STORAGE_KEY);
        }

        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed && (parsed.jdText?.trim() || parsed.hrEmail?.trim() || parsed.analyzedData)) {
            setTimeout(() => {
              if (parsed.jdText) setJdText(parsed.jdText);
              if (parsed.hrEmail) setHrEmail(parsed.hrEmail);
              if (parsed.tone && ["crisp", "technical", "startup", "warm"].includes(parsed.tone)) {
                setTone(parsed.tone);
              }
              if (parsed.step === "review" && parsed.analyzedData) {
                setAnalyzedData(parsed.analyzedData);
                setStep("review");
                setRestoredNotice("Unsaved draft restored.");
              } else if (parsed.jdText?.trim()) {
                setRestoredNotice("Unsaved job description restored.");
              }
            }, 0);
          }
        }
      } catch (err) {
        console.warn("Could not read draft session from storage:", err);
      }
    }
    isHydratedRef.current = true;
  }, []);

  // Autosave active draft to localStorage (with sessionStorage sync) on changes
  useEffect(() => {
    if (!isHydratedRef.current || typeof window === "undefined") return;

    // In follow-up mode, do not overwrite regular draft session
    if (followUpContext) return;

    if (!jdText.trim() && !hrEmail.trim() && !analyzedData) {
      try {
        localStorage.removeItem(DRAFT_STORAGE_KEY);
        sessionStorage.removeItem(DRAFT_STORAGE_KEY);
      } catch {}
      return;
    }

    try {
      const sessionPayload = {
        step,
        jdText,
        hrEmail,
        tone,
        analyzedData,
        savedAt: Date.now(),
      };
      const serialized = JSON.stringify(sessionPayload);
      localStorage.setItem(DRAFT_STORAGE_KEY, serialized);
      sessionStorage.setItem(DRAFT_STORAGE_KEY, serialized);
    } catch (err) {
      console.warn("Could not save draft session to storage:", err);
    }
  }, [step, jdText, hrEmail, tone, analyzedData, followUpContext]);

  const handleDiscardDraft = () => {
    setJdText("");
    setHrEmail("");
    setAnalyzedData(null);
    setFollowUpContext(null);
    setStep("input");
    setRestoredNotice(null);
    setRegenerationCount(0);
    try {
      localStorage.removeItem(DRAFT_STORAGE_KEY);
      sessionStorage.removeItem(DRAFT_STORAGE_KEY);
    } catch {}
    toast.info("Draft discarded.");
  };

  const handleDraftChange = useCallback(
    (updated: {
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
          companyName: updated.companyName !== undefined ? updated.companyName : prev.companyName,
          roleTitle: updated.roleTitle !== undefined ? updated.roleTitle : prev.roleTitle,
        };
      });
    },
    [hrEmail]
  );

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
        const formattedDate = formatShortDate(email.created_at);

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
            tone,
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
  }, [router, tone]);

  const handleUpgrade = async () => {
    setIsUpgrading(true);
    try {
      await initiateCheckout({ onFallback: () => router.push("/settings") });
    } finally {
      setIsUpgrading(false);
    }
  };

  const isMonthlyCapped = isCapped || checkMonthlyCapped(usage);
  const isSafetyDailyCapped = isDailyCapped || isDailySafetyCapped(usage);

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
        toast.error(
          `Please check the recipient address: Did you mean ${recipientValidation.suggestion}?`
        );
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
          tone,
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
      toast.error(
        "You've used both free rewrites for this draft. Send this version, or upgrade for unlimited rewrites."
      );
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
            tone,
          }
        : {
            type: "initial",
            jdText,
            resumeId: selectedResume?.id,
            isRegeneration: true,
            regenerationCount,
            tone,
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
          jdText:
            jdText ||
            (followUpContext ? `Follow-up regarding ${followUpContext.originalSubject}` : ""),
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
      setUsage((prev) => (prev ? { ...prev, monthlySends: prev.monthlySends + 1 } : null));
      // Clear draft storage on successful send
      try {
        localStorage.removeItem(DRAFT_STORAGE_KEY);
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

  return (
    <main className="min-h-[calc(100vh-4rem)] bg-paper px-4 py-8 sm:px-6 sm:py-10 pb-24 md:pb-12">
      <div className="mx-auto w-full max-w-5xl space-y-8">
        {/* Top Header & Breadcrumbs */}
        <DraftHeader
          step={step}
          usage={usage}
          isMonthlyCapped={isMonthlyCapped}
          restoredNotice={restoredNotice}
          onDiscardDraft={handleDiscardDraft}
        />

        {/* STEP 1: INPUT WORKSPACE */}
        {step === "input" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-start">
            <div className="lg:col-span-8">
              <DraftInputForm
                isSafetyDailyCapped={isSafetyDailyCapped}
                isMonthlyCapped={isMonthlyCapped}
                isUpgrading={isUpgrading}
                onUpgrade={handleUpgrade}
                hrEmail={hrEmail}
                onHrEmailChange={setHrEmail}
                isValidatingEmail={isValidatingEmail}
                recipientValidation={recipientValidation}
                isDuplicateEmail={isDuplicateEmail}
                jdText={jdText}
                onJdTextChange={setJdText}
                tone={tone}
                onToneChange={setTone}
                isAnalyzing={isAnalyzing}
                onSubmit={handleGenerate}
              />
            </div>

            <DraftReadinessSidebar
              isGmailLoading={isGmailLoading}
              isGmailConnected={isGmailConnected}
              gmailAddress={gmailAddress}
              isResumeLoading={isResumeLoading}
              resume={resume}
              resumes={resumes}
              selectedResume={selectedResume}
              onSelectResume={(target) => {
                setSelectedResume(target);
                setResume(target);
              }}
              usage={usage}
              isMonthlyCapped={isMonthlyCapped}
              onUpgrade={handleUpgrade}
            />
          </div>
        )}

        {/* STEP 2: REVIEW WORKSPACE */}
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
              originalSubject={followUpContext?.originalSubject}
              originalBody={followUpContext?.originalBody}
              tone={tone}
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
              onEmailChange={(newEmail) => setHrEmail(newEmail)}
              onDraftChange={handleDraftChange}
              isSending={isSending}
              resumeLabel={selectedResume?.label || selectedResume?.file_name || undefined}
            />
          </div>
        )}
      </div>
    </main>
  );
}
