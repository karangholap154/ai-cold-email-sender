"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { toast } from "sonner";
import {
  FileText,
  User,
  Mail,
  CreditCard,
  Loader2,
  Save,
} from "lucide-react";
import type { Resume, GmailConnectionStatus, UserUsage } from "@/lib/types/database";
import { generateFormattedSignature } from "@/lib/signature";
import { initiateCheckout } from "@/lib/billing";

// Modular settings components
import { SignatureTab } from "@/components/settings/signature-tab";
import { ResumeTab } from "@/components/settings/resume-tab";
import { GmailTab } from "@/components/settings/gmail-tab";
import { BillingTab } from "@/components/settings/billing-tab";
import { DisconnectModal } from "@/components/settings/disconnect-modal";
import { AddResumeModal } from "@/components/settings/add-resume-modal";

type SettingsTabType = "profile" | "resume" | "gmail" | "billing";

interface SettingsBaseline {
  skillsSummary: string;
  fullName: string;
  signOff: string;
  portfolioUrl: string;
  githubUrl: string;
  linkedinUrl: string;
  phone: string;
  customSignature: string;
}

const MIGRATION_SQL = `alter table public.profiles
  add column if not exists full_name text,
  add column if not exists sign_off text default 'Best regards,',
  add column if not exists portfolio_url text,
  add column if not exists github_url text,
  add column if not exists linkedin_url text,
  add column if not exists phone text,
  add column if not exists custom_signature text,
  add column if not exists dodo_customer_id text,
  add column if not exists dodo_subscription_id text;`;

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<SettingsTabType>("profile");
  const [resume, setResume] = useState<Resume | null>(null);
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [skillsSummary, setSkillsSummary] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Add résumé modal state
  const [showAddResumeModal, setShowAddResumeModal] = useState(false);
  const [newLabel, setNewLabel] = useState("");
  const [newFile, setNewFile] = useState<File | null>(null);
  const [newSkillsSummary, setNewSkillsSummary] = useState("");
  const [newIsDefault, setNewIsDefault] = useState(false);
  const [isSubmittingNewResume, setIsSubmittingNewResume] = useState(false);
  const newFileInputRef = useRef<HTMLInputElement>(null);

  // Edit inline résumé state
  const [editingResumeId, setEditingResumeId] = useState<string | null>(null);
  const [editingLabel, setEditingLabel] = useState("");
  const [editingSkillsSummary, setEditingSkillsSummary] = useState("");
  const [isUpdatingResume, setIsUpdatingResume] = useState(false);
  const [replaceTargetId, setReplaceTargetId] = useState<string | null>(null);
  const replaceFileInputRef = useRef<HTMLInputElement>(null);

  // Baseline state for unsaved dirty check
  const [baseline, setBaseline] = useState<SettingsBaseline | null>(null);

  // User Plan & Usage State
  const [usage, setUsage] = useState<UserUsage | null>(null);
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [isOpeningPortal, setIsOpeningPortal] = useState(false);

  // Gmail OAuth Connection State
  const [gmailStatus, setGmailStatus] = useState<GmailConnectionStatus>({ connected: false });
  const [isDisconnectingGmail, setIsDisconnectingGmail] = useState(false);
  const [showDisconnectModal, setShowDisconnectModal] = useState(false);

  // Profile & Sender Signature State
  const [fullName, setFullName] = useState("");
  const [signOff, setSignOff] = useState("Best regards,");
  const [portfolioUrl, setPortfolioUrl] = useState("");
  const [githubUrl, setGithubUrl] = useState("");
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [phone, setPhone] = useState("");
  const [customSignature, setCustomSignature] = useState("");
  const [activeLayout, setActiveLayout] = useState<"stack" | "inline" | "compact">("stack");
  const [isCustomDirty, setIsCustomDirty] = useState(false);
  const [migrationRequired, setMigrationRequired] = useState(false);

  // Handle URL query feedback from OAuth redirect, billing return, and tab selection
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const requestedTab = params.get("tab") as SettingsTabType | null;

      if (requestedTab && ["profile", "resume", "gmail", "billing"].includes(requestedTab)) {
        setActiveTab(requestedTab);
      } else if (params.get("billing")) {
        setActiveTab("billing");
      } else if (params.get("gmail") || params.get("error")) {
        setActiveTab("gmail");
      }

      if (params.get("billing") === "success") {
        toast.success("Welcome to Pro. You now have unlimited letters.");
        window.history.replaceState({}, "", "/settings?tab=billing");
      } else if (params.get("gmail") === "connected") {
        toast.success("Gmail connected. Letters will now send directly from your account.");
        window.history.replaceState({}, "", "/settings?tab=gmail");
      } else if (params.get("error")) {
        toast.error(`Could not connect Gmail: ${params.get("error")}`);
        window.history.replaceState({}, "", "/settings?tab=gmail");
      }
    }
  }, []);

  // Load existing resume, profile & gmail data
  useEffect(() => {
    async function loadData() {
      try {
        const [resumeRes, profileRes, gmailRes] = await Promise.all([
          fetch("/api/resume"),
          fetch("/api/profile"),
          fetch("/api/gmail/status"),
        ]);

        if (gmailRes.ok) {
          const gData = await gmailRes.json();
          setGmailStatus(gData);
        }

        let loadedSkillsSummary = "";
        if (resumeRes.ok) {
          const rData = await resumeRes.json();
          const list = rData.resumes || (rData.resume ? [rData.resume] : []);
          setResumes(list);
          const active = rData.activeResume || list.find((r: Resume) => r.is_default) || list[0] || null;
          if (active) {
            setResume(active);
            loadedSkillsSummary = active.skills_summary || "";
            setSkillsSummary(loadedSkillsSummary);
          }
        }

        if (profileRes.ok) {
          const pData = await profileRes.json();
          if (pData.usage) {
            setUsage(pData.usage);
          }
          if (pData.profile) {
            const fn = pData.profile.full_name || "";
            const so = pData.profile.sign_off || "Best regards,";
            const po = pData.profile.portfolio_url || "";
            const gh = pData.profile.github_url || "";
            const li = pData.profile.linkedin_url || "";
            const ph = pData.profile.phone || "";
            const cs = pData.profile.custom_signature || "";

            setFullName(fn);
            setSignOff(so);
            setPortfolioUrl(po);
            setGithubUrl(gh);
            setLinkedinUrl(li);
            setPhone(ph);

            if (cs) {
              setCustomSignature(cs);
              setIsCustomDirty(true);
            } else {
              const gen = generateFormattedSignature({
                full_name: fn,
                sign_off: so,
                portfolio_url: po,
                github_url: gh,
                linkedin_url: li,
                phone: ph,
              }, "stack");
              setCustomSignature(gen);
            }

            const initialSig = cs || generateFormattedSignature({
              full_name: fn,
              sign_off: so,
              portfolio_url: po,
              github_url: gh,
              linkedin_url: li,
              phone: ph,
            }, "stack");

            setBaseline({
              skillsSummary: loadedSkillsSummary,
              fullName: fn,
              signOff: so,
              portfolioUrl: po,
              githubUrl: gh,
              linkedinUrl: li,
              phone: ph,
              customSignature: initialSig,
            });
          }
          if (pData.migrationRequired) {
            setMigrationRequired(true);
          }
        }
      } catch (err: unknown) {
        console.warn("Could not load settings:", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [skillsSummary]);

  // Compute dirty (unsaved) modifications
  const isDirty = Boolean(
    selectedFile !== null ||
    (baseline && (
      skillsSummary !== baseline.skillsSummary ||
      fullName !== baseline.fullName ||
      signOff !== baseline.signOff ||
      portfolioUrl !== baseline.portfolioUrl ||
      githubUrl !== baseline.githubUrl ||
      linkedinUrl !== baseline.linkedinUrl ||
      phone !== baseline.phone ||
      customSignature !== baseline.customSignature
    ))
  );

  const handleResetChanges = () => {
    if (!baseline) return;
    setSkillsSummary(baseline.skillsSummary);
    setFullName(baseline.fullName);
    setSignOff(baseline.signOff);
    setPortfolioUrl(baseline.portfolioUrl);
    setGithubUrl(baseline.githubUrl);
    setLinkedinUrl(baseline.linkedinUrl);
    setPhone(baseline.phone);
    setCustomSignature(baseline.customSignature);
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    toast.info("Unsaved modifications reverted.");
  };

  const updateGeneratedSignature = useCallback((
    fn: string,
    so: string,
    po: string,
    gh: string,
    li: string,
    ph: string,
    layout: "stack" | "inline" | "compact" = activeLayout
  ) => {
    if (!isCustomDirty) {
      const generated = generateFormattedSignature({
        full_name: fn,
        sign_off: so,
        portfolio_url: po,
        github_url: gh,
        linkedin_url: li,
        phone: ph,
      }, layout);
      setCustomSignature(generated);
    }
  }, [activeLayout, isCustomDirty]);

  const applyPreset = (layout: "stack" | "inline" | "compact") => {
    setActiveLayout(layout);
    const text = generateFormattedSignature({
      full_name: fullName,
      sign_off: signOff,
      portfolio_url: portfolioUrl,
      github_url: githubUrl,
      linkedin_url: linkedinUrl,
      phone: phone,
    }, layout);
    setCustomSignature(text);
    setIsCustomDirty(true);
    toast.success(`Signature layout set to "${layout === "stack" ? "Line by line" : layout === "inline" ? "Single line" : "Compact"}"`);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== "application/pdf") {
      toast.error("Only PDF files are supported.");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error("File size cannot exceed 10MB.");
      return;
    }

    setSelectedFile(file);
  };

  const handleCopySql = async () => {
    try {
      await navigator.clipboard.writeText(MIGRATION_SQL);
      toast.success("SQL migration query copied to clipboard");
    } catch {
      toast.error("Failed to copy SQL to clipboard");
    }
  };

  const handleSetDefaultResume = async (id: string) => {
    try {
      const res = await fetch("/api/resume", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, is_default: true }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to set default résumé.");
      }
      setResumes((prev) =>
        prev.map((r) => ({ ...r, is_default: r.id === id }))
      );
      setResume(data.resume);
      setSkillsSummary(data.resume.skills_summary || "");
      toast.success("Default résumé updated.");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Error updating default résumé.");
    }
  };

  const handleDeleteResume = async (id: string) => {
    if (!confirm("Are you sure you want to delete this résumé version?")) return;
    try {
      const res = await fetch(`/api/resume?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to delete résumé.");
      }
      setResumes((prev) => {
        const next = prev.filter((r) => r.id !== id);
        if (resume?.id === id) {
          const newActive = next.find((r) => r.is_default) || next[0] || null;
          setResume(newActive);
          setSkillsSummary(newActive?.skills_summary || "");
        }
        return next;
      });
      toast.success("Résumé deleted.");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Error deleting résumé.");
    }
  };

  const handleStartEdit = (r: Resume) => {
    setEditingResumeId(r.id);
    setEditingLabel(r.label || "Primary Résumé");
    setEditingSkillsSummary(r.skills_summary || "");
  };

  const handleSaveEdit = async (id: string) => {
    setIsUpdatingResume(true);
    try {
      const res = await fetch("/api/resume", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id,
          label: editingLabel.trim(),
          skills_summary: editingSkillsSummary.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to update résumé details.");
      }
      setResumes((prev) =>
        prev.map((r) => (r.id === id ? data.resume : r))
      );
      if (resume?.id === id) {
        setResume(data.resume);
        setSkillsSummary(data.resume.skills_summary || "");
      }
      setEditingResumeId(null);
      toast.success("Résumé details updated.");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Error updating résumé.");
    } finally {
      setIsUpdatingResume(false);
    }
  };

  const handleTriggerReplace = (id: string) => {
    setReplaceTargetId(id);
    replaceFileInputRef.current?.click();
  };

  const handleReplaceFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !replaceTargetId) return;

    if (file.type !== "application/pdf") {
      toast.error("Only PDF files are supported.");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error("File size cannot exceed 10MB.");
      return;
    }

    const toastId = toast.loading("Replacing résumé PDF...");
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("resume_id", replaceTargetId);

      const res = await fetch("/api/resume", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to replace résumé file.");
      }

      setResumes((prev) =>
        prev.map((r) => (r.id === replaceTargetId ? data.resume : r))
      );
      if (resume?.id === replaceTargetId) {
        setResume(data.resume);
      }
      toast.success("Résumé PDF replaced.", { id: toastId });
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Error replacing file.", { id: toastId });
    } finally {
      setReplaceTargetId(null);
      if (replaceFileInputRef.current) {
        replaceFileInputRef.current.value = "";
      }
    }
  };

  const handleCreateNewResume = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFile) {
      toast.error("Please select a PDF file.");
      return;
    }

    if (newFile.type !== "application/pdf") {
      toast.error("Only PDF files are supported.");
      return;
    }

    if (newFile.size > 10 * 1024 * 1024) {
      toast.error("File size cannot exceed 10MB.");
      return;
    }

    const resumeLimit = usage?.plan === "pro" ? 3 : 1;
    if (resumes.length >= resumeLimit) {
      toast.error(
        usage?.plan === "pro"
          ? "Pro accounts can have up to 3 résumé versions. Delete one before adding another."
          : "Multiple résumé versions are a Pro feature. Please upgrade to Pro."
      );
      if (usage?.plan !== "pro") {
        setShowAddResumeModal(false);
        setActiveTab("billing");
      }
      return;
    }

    setIsSubmittingNewResume(true);
    try {
      const formData = new FormData();
      formData.append("file", newFile);
      formData.append("label", newLabel.trim() || "Targeted Résumé");
      formData.append("skills_summary", newSkillsSummary.trim());
      formData.append("is_default", String(newIsDefault));

      const res = await fetch("/api/resume", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to add résumé.");
      }

      if (data.resume.is_default) {
        setResumes((prev) => [
          data.resume,
          ...prev.map((r) => ({ ...r, is_default: false })),
        ]);
        setResume(data.resume);
        setSkillsSummary(data.resume.skills_summary || "");
      } else {
        setResumes((prev) => [...prev, data.resume]);
      }

      setShowAddResumeModal(false);
      setNewLabel("");
      setNewFile(null);
      setNewSkillsSummary("");
      setNewIsDefault(false);
      if (newFileInputRef.current) newFileInputRef.current.value = "";
      toast.success("Targeted résumé added.");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Error adding résumé.");
    } finally {
      setIsSubmittingNewResume(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      // 1. Save Resume & Skills Summary if changed or uploaded
      if (selectedFile || (resume && skillsSummary !== resume.skills_summary)) {
        const formData = new FormData();
        if (selectedFile) {
          formData.append("file", selectedFile);
        }
        if (resume?.id) {
          formData.append("resume_id", resume.id);
        }
        formData.append("skills_summary", skillsSummary);
        formData.append("label", resume?.label || "Primary Résumé");

        const res = await fetch("/api/resume", {
          method: "POST",
          body: formData,
        });

        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.error || "Failed to save résumé.");
        }

        setResume(data.resume);
        setResumes((prev) => {
          const idx = prev.findIndex((r) => r.id === data.resume.id);
          if (idx >= 0) {
            const next = [...prev];
            next[idx] = data.resume;
            return next;
          }
          return [data.resume, ...prev];
        });
        setSelectedFile(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      }

      // 2. Save Profile & Custom Sender Signature
      const profileRes = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: fullName,
          sign_off: signOff,
          portfolio_url: portfolioUrl,
          github_url: githubUrl,
          linkedin_url: linkedinUrl,
          phone: phone,
          custom_signature: customSignature,
        }),
      });

      const pData = await profileRes.json();
      if (!profileRes.ok) {
        if (pData.migrationRequired) {
          setMigrationRequired(true);
          toast.error("Database table missing columns. Please run the SQL migration below in Supabase.");
          return;
        }
        throw new Error(pData.error || "Failed to save sender signature.");
      }

      setMigrationRequired(false);
      setBaseline({
        skillsSummary,
        fullName,
        signOff,
        portfolioUrl,
        githubUrl,
        linkedinUrl,
        phone,
        customSignature,
      });
      setSelectedFile(null);
      toast.success("Settings and sender signature saved successfully.");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error saving settings";
      toast.error(msg);
    } finally {
      setIsSaving(false);
    }
  };

  const executeDisconnectGmail = async () => {
    setIsDisconnectingGmail(true);
    try {
      const res = await fetch("/api/gmail/disconnect", { method: "POST" });
      const data = await res.json();
      if (res.ok && data.success) {
        setGmailStatus({ connected: false });
        setShowDisconnectModal(false);
        toast.success("Gmail account disconnected.");
      } else {
        throw new Error(data.error || "Failed to disconnect Gmail.");
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Error disconnecting Gmail");
    } finally {
      setIsDisconnectingGmail(false);
    }
  };

  const handleUpgrade = async () => {
    setIsUpgrading(true);
    try {
      await initiateCheckout();
    } catch {
      setIsUpgrading(false);
    }
  };

  const handleManageBilling = async () => {
    setIsOpeningPortal(true);
    try {
      const res = await fetch("/api/billing/portal", { method: "POST" });
      const data = await res.json();
      if (data.url) {
        window.open(data.url, "_blank");
      }
    } catch {
      window.open("https://customer.dodopayments.com/login", "_blank");
    } finally {
      setIsOpeningPortal(false);
    }
  };

  const tabs = [
    {
      id: "profile" as SettingsTabType,
      label: "Signature",
      icon: User,
      badge: null,
    },
    {
      id: "resume" as SettingsTabType,
      label: "Résumé",
      icon: FileText,
      badge: resume?.file_url ? (
        <span className="h-1.5 w-1.5 rounded-full bg-confirmed shrink-0" title="Active résumé uploaded"></span>
      ) : (
        <span className="h-1.5 w-1.5 rounded-full bg-amber-600 shrink-0" title="No résumé uploaded"></span>
      ),
    },
    {
      id: "gmail" as SettingsTabType,
      label: "Gmail",
      icon: Mail,
      badge: gmailStatus.connected ? (
        <span className="h-1.5 w-1.5 rounded-full bg-confirmed shrink-0" title="Connected"></span>
      ) : (
        <span className="h-1.5 w-1.5 rounded-full bg-amber-600 shrink-0" title="Not connected"></span>
      ),
    },
    {
      id: "billing" as SettingsTabType,
      label: "Billing",
      icon: CreditCard,
      badge:
        usage?.plan === "pro" ? (
          <span className="rounded-xs border border-seal/40 bg-seal/10 px-1 py-0.2 text-[9px] font-bold text-seal uppercase tracking-wider shrink-0">
            Pro
          </span>
        ) : (
          <span className="text-[10px] text-muted-ink shrink-0 font-mono">
            {usage?.monthlySends ?? 0}/5
          </span>
        ),
    },
  ];

  return (
    <main className="flex flex-1 flex-col px-4 py-6 sm:px-6 sm:py-10 pb-36 md:pb-28">
      <div className="mx-auto w-full max-w-2xl">
        {/* Page Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="font-heading text-xl sm:text-2xl text-ink">Settings</h1>
          <p className="mt-1 text-xs sm:text-sm text-muted-ink">
            Configure your active résumé, sending identity, background skills summary, and automatic sender signature.
          </p>
        </div>

        {/* Tab Navigation Bar */}
        <div className="mb-6 sm:mb-8 border-b border-hairline flex items-center gap-1 sm:gap-2 overflow-x-auto no-scrollbar">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  setActiveTab(tab.id);
                  if (typeof window !== "undefined") {
                    window.history.replaceState({}, "", `/settings?tab=${tab.id}`);
                  }
                }}
                className={`inline-flex items-center gap-2 px-3 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm font-medium border-b-2 transition-all cursor-pointer shrink-0 ${
                  isActive
                    ? "border-ink text-ink font-semibold"
                    : "border-transparent text-muted-ink hover:text-ink hover:border-hairline"
                }`}
              >
                <Icon className={`h-3.5 w-3.5 ${isActive ? "text-ink" : "text-muted-ink"}`} />
                <span>{tab.label}</span>
                {tab.badge}
              </button>
            );
          })}
        </div>

        {isLoading ? (
          <div className="flex items-center gap-2 py-16 text-xs sm:text-sm text-muted-ink justify-center">
            <Loader2 className="h-4 w-4 animate-spin text-muted-ink" />
            <span>Loading your settings...</span>
          </div>
        ) : (
          <form onSubmit={handleSave} className="space-y-6">
            {/* TAB 1: Profile & Custom Signature */}
            {activeTab === "profile" && (
              <SignatureTab
                fullName={fullName}
                setFullName={setFullName}
                signOff={signOff}
                setSignOff={setSignOff}
                portfolioUrl={portfolioUrl}
                setPortfolioUrl={setPortfolioUrl}
                githubUrl={githubUrl}
                setGithubUrl={setGithubUrl}
                linkedinUrl={linkedinUrl}
                setLinkedinUrl={setLinkedinUrl}
                phone={phone}
                setPhone={setPhone}
                customSignature={customSignature}
                setCustomSignature={setCustomSignature}
                activeLayout={activeLayout}
                applyPreset={applyPreset}
                setIsCustomDirty={setIsCustomDirty}
                updateGeneratedSignature={updateGeneratedSignature}
                migrationRequired={migrationRequired}
                handleCopySql={handleCopySql}
                migrationSql={MIGRATION_SQL}
                isSaving={isSaving}
              />
            )}

            {/* TAB 2: Resume PDF & Skills Background */}
            {activeTab === "resume" && (
              <ResumeTab
                resumes={resumes}
                usage={usage}
                editingResumeId={editingResumeId}
                setEditingResumeId={setEditingResumeId}
                editingLabel={editingLabel}
                setEditingLabel={setEditingLabel}
                editingSkillsSummary={editingSkillsSummary}
                setEditingSkillsSummary={setEditingSkillsSummary}
                isUpdatingResume={isUpdatingResume}
                handleSetDefaultResume={handleSetDefaultResume}
                handleDeleteResume={handleDeleteResume}
                handleStartEdit={handleStartEdit}
                handleSaveEdit={handleSaveEdit}
                handleTriggerReplace={handleTriggerReplace}
                handleReplaceFileSelected={handleReplaceFileSelected}
                replaceFileInputRef={replaceFileInputRef}
                fileInputRef={fileInputRef}
                handleFileChange={handleFileChange}
                setShowAddResumeModal={setShowAddResumeModal}
                setActiveTab={setActiveTab}
              />
            )}

            {/* TAB 3: Sending Account (Gmail) */}
            {activeTab === "gmail" && (
              <GmailTab
                gmailStatus={gmailStatus}
                isDisconnectingGmail={isDisconnectingGmail}
                setShowDisconnectModal={setShowDisconnectModal}
              />
            )}

            {/* TAB 4: Plan & Membership */}
            {activeTab === "billing" && (
              <BillingTab
                usage={usage}
                isUpgrading={isUpgrading}
                handleUpgrade={handleUpgrade}
                isOpeningPortal={isOpeningPortal}
                handleManageBilling={handleManageBilling}
              />
            )}

            {/* Sticky Floating Save Bar: elevated with z-50 and offset on mobile above the mobile navigation dock */}
            {isDirty && (
              <div className="fixed bottom-16 sm:bottom-0 left-0 right-0 z-50 border-t border-hairline bg-paper/95 backdrop-blur-md px-4 py-3 sm:px-6 shadow-[0_-4px_16px_rgba(0,0,0,0.08)] animate-in slide-in-from-bottom duration-200">
                <div className="mx-auto flex max-w-2xl items-center justify-between gap-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="relative flex h-2 w-2 shrink-0">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-500 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-600"></span>
                    </span>
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-ink truncate">
                        Unsaved modifications
                      </p>
                      <p className="text-[10px] text-muted-ink hidden sm:block">
                        Remember to save your settings before leaving
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                    <button
                      type="button"
                      onClick={handleResetChanges}
                      disabled={isSaving}
                      className="text-xs text-muted-ink hover:text-ink underline underline-offset-4 px-2 py-1.5 cursor-pointer disabled:opacity-50"
                    >
                      Discard
                    </button>
                    <button
                      type="submit"
                      disabled={isSaving}
                      className="inline-flex items-center justify-center gap-1.5 rounded-sm bg-ink px-4 py-2 text-xs font-medium text-paper hover:bg-ink/90 shadow-xs transition-colors cursor-pointer disabled:opacity-50 min-h-[36px]"
                    >
                      {isSaving ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Save className="h-3.5 w-3.5" />
                      )}
                      <span>{isSaving ? "Saving..." : "Save settings"}</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </form>
        )}

        {/* In-App Styled Gmail Disconnect Modal */}
        <DisconnectModal
          open={showDisconnectModal}
          onOpenChange={setShowDisconnectModal}
          email={gmailStatus.email}
          isDisconnecting={isDisconnectingGmail}
          onDisconnect={executeDisconnectGmail}
        />

        {/* In-App Styled Add Résumé Modal (Pro) */}
        <AddResumeModal
          open={showAddResumeModal}
          onOpenChange={setShowAddResumeModal}
          newLabel={newLabel}
          setNewLabel={setNewLabel}
          newFile={newFile}
          setNewFile={setNewFile}
          newFileInputRef={newFileInputRef}
          newSkillsSummary={newSkillsSummary}
          setNewSkillsSummary={setNewSkillsSummary}
          newIsDefault={newIsDefault}
          setNewIsDefault={setNewIsDefault}
          isSubmitting={isSubmittingNewResume}
          onSubmit={handleCreateNewResume}
        />
      </div>
    </main>
  );
}
