"use client";

import { useEffect, useState, useRef } from "react";
import TextareaAutosize from "react-textarea-autosize";
import { toast } from "sonner";
import {
  FileText,
  Upload,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Copy,
  PenLine,
  User,
  Globe,
  Code2,
  Link2,
  Phone,
  Mail,
  Unlink,
  CreditCard,
  Zap,
  Save,
  Plus,
  Trash2,
  Edit2,
  Star,
  ExternalLink,
  Check,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import type { Resume, GmailConnectionStatus, UserUsage } from "@/lib/types/database";
import { generateFormattedSignature } from "@/lib/signature";

type SettingsTab = "profile" | "resume" | "gmail" | "billing";

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
  const [activeTab, setActiveTab] = useState<SettingsTab>(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const requestedTab = params.get("tab") as SettingsTab | null;
      if (requestedTab && ["profile", "resume", "gmail", "billing"].includes(requestedTab)) {
        return requestedTab;
      } else if (params.get("billing")) {
        return "billing";
      } else if (params.get("gmail") || params.get("error")) {
        return "gmail";
      }
    }
    return "profile";
  });
  const [resume, setResume] = useState<Resume | null>(null);
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [skillsSummary, setSkillsSummary] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showAddResumeModal, setShowAddResumeModal] = useState(false);
  const [newLabel, setNewLabel] = useState("");
  const [newFile, setNewFile] = useState<File | null>(null);
  const [newSkillsSummary, setNewSkillsSummary] = useState("");
  const [newIsDefault, setNewIsDefault] = useState(false);
  const [isSubmittingNewResume, setIsSubmittingNewResume] = useState(false);
  const [editingResumeId, setEditingResumeId] = useState<string | null>(null);
  const [editingLabel, setEditingLabel] = useState("");
  const [editingSkillsSummary, setEditingSkillsSummary] = useState("");
  const [isUpdatingResume, setIsUpdatingResume] = useState(false);
  const [replaceTargetId, setReplaceTargetId] = useState<string | null>(null);
  const replaceFileInputRef = useRef<HTMLInputElement>(null);
  const newFileInputRef = useRef<HTMLInputElement>(null);
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

  // Handle URL query feedback from OAuth redirect & billing return
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);

      if (params.get("billing") === "success") {
        toast.success("Welcome to Pro. You now have unlimited letters.");
        window.history.replaceState({}, "", "/settings");
      } else if (params.get("gmail") === "connected") {
        toast.success("Gmail connected. Letters will now send directly from your account.");
        window.history.replaceState({}, "", "/settings");
      } else if (params.get("error")) {
        toast.error(`Could not connect Gmail: ${params.get("error")}`);
        window.history.replaceState({}, "", "/settings");
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

  // Update signature when fields change if user hasn't manually customized textarea
  const updateGeneratedSignature = (
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
  };

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
      const res = await fetch("/api/billing/checkout", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to initiate checkout");
      }
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Error initiating checkout";
      toast.error(message);
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
      id: "profile" as SettingsTab,
      label: "Signature",
      icon: User,
      badge: null,
    },
    {
      id: "resume" as SettingsTab,
      label: "Résumé",
      icon: FileText,
      badge: resume?.file_url ? (
        <span className="h-1.5 w-1.5 rounded-full bg-confirmed shrink-0" title="Active résumé uploaded"></span>
      ) : (
        <span className="h-1.5 w-1.5 rounded-full bg-amber-600 shrink-0" title="No résumé uploaded"></span>
      ),
    },
    {
      id: "gmail" as SettingsTab,
      label: "Gmail",
      icon: Mail,
      badge: gmailStatus.connected ? (
        <span className="h-1.5 w-1.5 rounded-full bg-confirmed shrink-0" title="Connected"></span>
      ) : (
        <span className="h-1.5 w-1.5 rounded-full bg-amber-600 shrink-0" title="Not connected"></span>
      ),
    },
    {
      id: "billing" as SettingsTab,
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
    <main className="flex flex-1 flex-col px-4 py-6 sm:px-6 sm:py-10 pb-28">
      <div className="mx-auto w-full max-w-2xl">
        {/* Page Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="font-heading text-xl sm:text-2xl text-ink">Settings & Account</h1>
          <p className="mt-1 text-xs sm:text-sm text-muted-ink">
            Configure your active resume, sending identity, background skills summary, and automatic sender signature.
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
                onClick={() => setActiveTab(tab.id)}
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
              <div className="space-y-6 animate-in fade-in-50 duration-150">
                <div>
                  <h2 className="font-heading text-lg sm:text-xl text-ink">
                    How you sign off
                  </h2>
                  <p className="mt-1 text-xs text-muted-ink leading-relaxed">
                    Added to the end of every letter automatically.
                  </p>
                </div>

                {/* Supabase migration alert if database columns not present */}
                {migrationRequired && (
                  <div className="border border-hairline bg-[#FAF9F5] p-3.5 sm:p-4 rounded-sm space-y-2.5 text-xs">
                    <div className="flex items-center gap-2 text-amber-800 font-medium">
                      <AlertCircle className="h-4 w-4 shrink-0" />
                      <span>One-time database migration query needed in Supabase</span>
                    </div>
                    <p className="text-[11px] text-muted-ink leading-relaxed">
                      To persist your signature fields in Supabase, run this query in your <strong>Supabase Dashboard → SQL Editor</strong>:
                    </p>
                    <div className="flex items-center justify-between gap-2 border border-hairline bg-paper p-2 rounded-xs overflow-x-auto font-mono text-[11px] text-ink">
                      <span className="truncate">{MIGRATION_SQL.replace(/\s+/g, " ")}</span>
                      <button
                        type="button"
                        onClick={handleCopySql}
                        className="inline-flex items-center gap-1 shrink-0 rounded-xs border border-hairline bg-[#EDEAE2] px-2 py-1 text-[10px] font-sans font-medium text-ink hover:bg-[#E2DDD3] cursor-pointer"
                      >
                        <Copy className="h-3 w-3" />
                        <span>Copy SQL</span>
                      </button>
                    </div>
                  </div>
                )}

                <div className="border border-hairline bg-paper p-4 sm:p-5 rounded-sm space-y-4">
                  {/* Row 1: Full Name & Sign-off Phrase */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div className="space-y-1.5">
                      <label htmlFor="full-name" className="flex items-center gap-1.5 text-xs font-medium text-ink">
                        <User className="h-3.5 w-3.5 text-muted-ink" />
                        <span>Full Name</span>
                      </label>
                      <input
                        id="full-name"
                        type="text"
                        value={fullName}
                        onChange={(e) => {
                          const val = e.target.value;
                          setFullName(val);
                          updateGeneratedSignature(val, signOff, portfolioUrl, githubUrl, linkedinUrl, phone);
                        }}
                        placeholder="e.g. Karan Gholap"
                        className="w-full rounded-sm border border-hairline bg-paper px-3 py-2 text-xs text-ink placeholder:text-muted-ink/60 focus:border-seal focus:outline-none transition-colors"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label htmlFor="sign-off" className="flex items-center gap-1.5 text-xs font-medium text-ink">
                        <PenLine className="h-3.5 w-3.5 text-muted-ink" />
                        <span>Sign-off Phrase</span>
                      </label>
                      <input
                        id="sign-off"
                        type="text"
                        value={signOff}
                        onChange={(e) => {
                          const val = e.target.value;
                          setSignOff(val);
                          updateGeneratedSignature(fullName, val, portfolioUrl, githubUrl, linkedinUrl, phone);
                        }}
                        placeholder="e.g. Best regards, / Best,"
                        className="w-full rounded-sm border border-hairline bg-paper px-3 py-2 text-xs text-ink placeholder:text-muted-ink/60 focus:border-seal focus:outline-none transition-colors"
                      />
                    </div>
                  </div>

                  {/* Row 2: Portfolio / Website & Phone */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div className="space-y-1.5">
                      <label htmlFor="portfolio-url" className="flex items-center gap-1.5 text-xs font-medium text-ink">
                        <Globe className="h-3.5 w-3.5 text-muted-ink" />
                        <span>Portfolio / Website</span>
                      </label>
                      <input
                        id="portfolio-url"
                        type="url"
                        value={portfolioUrl}
                        onChange={(e) => {
                          const val = e.target.value;
                          setPortfolioUrl(val);
                          updateGeneratedSignature(fullName, signOff, val, githubUrl, linkedinUrl, phone);
                        }}
                        placeholder="https://yourwebsite.com"
                        className="w-full rounded-sm border border-hairline bg-paper px-3 py-2 text-xs text-ink placeholder:text-muted-ink/60 focus:border-seal focus:outline-none transition-colors font-mono"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label htmlFor="phone" className="flex items-center gap-1.5 text-xs font-medium text-ink">
                        <Phone className="h-3.5 w-3.5 text-muted-ink" />
                        <span>Phone Number (optional)</span>
                      </label>
                      <input
                        id="phone"
                        type="tel"
                        value={phone}
                        onChange={(e) => {
                          const val = e.target.value;
                          setPhone(val);
                          updateGeneratedSignature(fullName, signOff, portfolioUrl, githubUrl, linkedinUrl, val);
                        }}
                        placeholder="+1 (555) 000-0000"
                        className="w-full rounded-sm border border-hairline bg-paper px-3 py-2 text-xs text-ink placeholder:text-muted-ink/60 focus:border-seal focus:outline-none transition-colors font-mono"
                      />
                    </div>
                  </div>

                  {/* Row 3: GitHub & LinkedIn */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div className="space-y-1.5">
                      <label htmlFor="github-url" className="flex items-center gap-1.5 text-xs font-medium text-ink">
                        <Code2 className="h-3.5 w-3.5 text-muted-ink" />
                        <span>GitHub URL</span>
                      </label>
                      <input
                        id="github-url"
                        type="url"
                        value={githubUrl}
                        onChange={(e) => {
                          const val = e.target.value;
                          setGithubUrl(val);
                          updateGeneratedSignature(fullName, signOff, portfolioUrl, val, linkedinUrl, phone);
                        }}
                        placeholder="https://github.com/yourhandle"
                        className="w-full rounded-sm border border-hairline bg-paper px-3 py-2 text-xs text-ink placeholder:text-muted-ink/60 focus:border-seal focus:outline-none transition-colors font-mono"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label htmlFor="linkedin-url" className="flex items-center gap-1.5 text-xs font-medium text-ink">
                        <Link2 className="h-3.5 w-3.5 text-muted-ink" />
                        <span>LinkedIn URL</span>
                      </label>
                      <input
                        id="linkedin-url"
                        type="url"
                        value={linkedinUrl}
                        onChange={(e) => {
                          const val = e.target.value;
                          setLinkedinUrl(val);
                          updateGeneratedSignature(fullName, signOff, portfolioUrl, githubUrl, val, phone);
                        }}
                        placeholder="https://linkedin.com/in/yourhandle"
                        className="w-full rounded-sm border border-hairline bg-paper px-3 py-2 text-xs text-ink placeholder:text-muted-ink/60 focus:border-seal focus:outline-none transition-colors font-mono"
                      />
                    </div>
                  </div>

                  {/* Interactive Signature Preview & Direct Editor */}
                  <div className="space-y-2.5 pt-3 border-t border-hairline">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <span className="block text-xs font-medium text-ink">
                          Signature Preview & Customizer
                        </span>
                        <span className="text-[11px] text-muted-ink">
                          Click a format preset or edit the text directly:
                        </span>
                      </div>

                      {/* Layout Preset Buttons */}
                      <div className="flex items-center gap-1.5 shrink-0 self-start sm:self-auto">
                        <button
                          type="button"
                          onClick={() => applyPreset("stack")}
                          title="Each link on its own line (clean, no broken wraps)"
                          className={`rounded-xs border border-hairline px-2.5 py-1 text-[11px] font-medium transition-colors cursor-pointer ${
                            activeLayout === "stack"
                              ? "bg-ink text-paper"
                              : "bg-paper text-ink hover:bg-[#EDEAE2]"
                          }`}
                        >
                          Line by line
                        </button>
                        <button
                          type="button"
                          onClick={() => applyPreset("inline")}
                          title="All links in a single line separated by pipes"
                          className={`rounded-xs border border-hairline px-2.5 py-1 text-[11px] font-medium transition-colors cursor-pointer ${
                            activeLayout === "inline"
                              ? "bg-ink text-paper"
                              : "bg-paper text-ink hover:bg-[#EDEAE2]"
                          }`}
                        >
                          Single line
                        </button>
                        <button
                          type="button"
                          onClick={() => applyPreset("compact")}
                          title="Clean domain handles separated by bullets"
                          className={`rounded-xs border border-hairline px-2.5 py-1 text-[11px] font-medium transition-colors cursor-pointer ${
                            activeLayout === "compact"
                              ? "bg-ink text-paper"
                              : "bg-paper text-ink hover:bg-[#EDEAE2]"
                          }`}
                        >
                          Compact
                        </button>
                      </div>
                    </div>

                    <TextareaAutosize
                      minRows={5}
                      value={customSignature}
                      onChange={(e) => {
                        setCustomSignature(e.target.value);
                        setIsCustomDirty(true);
                      }}
                      placeholder={`Best regards,\nKaran Gholap\n\nPortfolio: https://...\nGitHub: https://...`}
                      className="w-full resize-none rounded-xs border border-dashed border-hairline bg-[#FAF9F5] p-3 sm:p-4 font-mono text-xs text-ink placeholder:text-muted-ink/60 focus:border-seal focus:outline-none leading-relaxed transition-colors"
                    />
                    <p className="text-[11px] text-muted-ink">
                      This exact signature will be appended to the bottom of all drafted correspondence.
                    </p>
                  </div>
                </div>

                {/* Tab Action */}
                <div className="flex items-center justify-end pt-2 border-t border-hairline">
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-sm border border-hairline bg-ink px-5 py-2.5 sm:py-2 text-xs font-medium text-paper hover:bg-ink/90 disabled:opacity-50 transition-colors cursor-pointer min-h-[42px]"
                  >
                    {isSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                    <span>{isSaving ? "Saving..." : "Save profile & signature"}</span>
                  </button>
                </div>
              </div>
            )}

            {/* TAB 2: Resume PDF & Skills Background */}
            {activeTab === "resume" && (
              <div className="space-y-6 animate-in fade-in-50 duration-150">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h2 className="font-heading text-lg sm:text-xl text-ink">
                      Targeted Résumés & Backgrounds
                    </h2>
                    <p className="mt-1 text-xs text-muted-ink leading-relaxed">
                      Upload and label résumé versions for different roles (e.g. Frontend, Full-Stack). Vina references the active version to tailor each letter.
                    </p>
                  </div>

                  {usage?.plan === "pro" && resumes.length < 3 ? (
                    <button
                      type="button"
                      onClick={() => setShowAddResumeModal(true)}
                      className="inline-flex items-center justify-center gap-1.5 rounded-sm bg-seal hover:bg-seal/90 text-paper px-3.5 py-2 text-xs font-medium transition-colors shadow-xs shrink-0 self-start sm:self-auto cursor-pointer"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      <span>Add another résumé</span>
                    </button>
                  ) : usage?.plan === "pro" ? (
                    <span className="text-xs text-muted-ink">3 résumé versions maximum</span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setActiveTab("billing")}
                      className="inline-flex items-center justify-center gap-1.5 rounded-sm border border-seal/40 bg-seal/10 text-seal hover:bg-seal/20 px-3.5 py-2 text-xs font-medium transition-colors shrink-0 self-start sm:self-auto cursor-pointer"
                    >
                      <Star className="h-3.5 w-3.5" />
                      <span>Unlock multiple résumés</span>
                    </button>
                  )}
                </div>

                {/* Free plan info banner */}
                {usage?.plan === "free" && (
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border border-hairline bg-[#FAF9F5] p-3.5 sm:p-4 rounded-sm text-xs">
                    <div className="flex items-start gap-2.5 min-w-0">
                      <AlertCircle className="h-4 w-4 shrink-0 text-muted-ink mt-0.5" />
                      <div>
                        <p className="font-medium text-ink">
                          You&apos;re on the Free plan (1 résumé).
                        </p>
                        <p className="text-muted-ink mt-0.5">
                          Upgrade to Pro to manage multiple targeted versions for different roles and tech stacks.
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setActiveTab("billing")}
                      className="text-xs text-seal font-medium underline underline-offset-4 shrink-0 self-start sm:self-auto cursor-pointer"
                    >
                      View Pro features
                    </button>
                  </div>
                )}

                {/* Hidden file input for Replace action */}
                <input
                  ref={replaceFileInputRef}
                  type="file"
                  accept="application/pdf"
                  onChange={handleReplaceFileSelected}
                  className="hidden"
                />

                {/* Résumé List */}
                <div className="space-y-4">
                  {resumes.length === 0 ? (
                    <div className="border border-dashed border-hairline bg-[#FAF9F5] p-8 rounded-sm text-center space-y-3">
                      <FileText className="mx-auto h-8 w-8 text-muted-ink/60" />
                      <div>
                        <p className="text-sm font-medium text-ink">No résumé uploaded yet</p>
                        <p className="text-xs text-muted-ink mt-1">
                          Upload your résumé (PDF) so Vina can reference your experience when drafting letters.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="inline-flex items-center gap-2 border border-hairline px-4 py-2 text-xs font-medium text-ink hover:bg-[#ece9e1] transition-colors rounded-sm cursor-pointer"
                      >
                        <Upload className="h-3.5 w-3.5" />
                        <span>Upload résumé (PDF)</span>
                      </button>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="application/pdf"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                    </div>
                  ) : (
                    resumes.map((r) => {
                      const isDefault = Boolean(r.is_default);
                      const isEditing = editingResumeId === r.id;

                      return (
                        <div
                          key={r.id}
                          className={`border rounded-sm p-4 sm:p-5 transition-colors ${
                            isDefault
                              ? "border-seal/60 bg-paper shadow-2xs"
                              : "border-hairline bg-paper"
                          }`}
                        >
                          {/* Card Header */}
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-hairline pb-3.5">
                            <div className="flex items-center gap-2.5 min-w-0">
                              <h3 className="font-heading text-base font-medium text-ink truncate">
                                {r.label || "Primary Résumé"}
                              </h3>
                              {isDefault ? (
                                <span className="rounded-sm border border-seal/40 bg-seal/10 text-seal px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider shrink-0">
                                  Default
                                </span>
                              ) : null}
                            </div>

                            {/* Actions on Card Header */}
                            <div className="flex items-center gap-2 sm:gap-3 flex-wrap text-xs text-muted-ink">
                              {!isDefault && (
                                <button
                                  type="button"
                                  onClick={() => handleSetDefaultResume(r.id)}
                                  className="inline-flex items-center gap-1 hover:text-ink transition-colors cursor-pointer py-1"
                                >
                                  <Star className="h-3 w-3 text-muted-ink" />
                                  <span>Make default</span>
                                </button>
                              )}

                              <button
                                type="button"
                                onClick={() =>
                                  isEditing
                                    ? setEditingResumeId(null)
                                    : handleStartEdit(r)
                                }
                                className="inline-flex items-center gap-1 hover:text-ink transition-colors cursor-pointer py-1"
                              >
                                <Edit2 className="h-3 w-3" />
                                <span>{isEditing ? "Close" : "Edit details"}</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => handleTriggerReplace(r.id)}
                                className="inline-flex items-center gap-1 hover:text-ink transition-colors cursor-pointer py-1"
                              >
                                <Upload className="h-3 w-3" />
                                <span>Replace PDF</span>
                              </button>

                              {resumes.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => handleDeleteResume(r.id)}
                                  className="inline-flex items-center gap-1 text-muted-ink hover:text-red-700 transition-colors cursor-pointer py-1 ml-1"
                                  title="Delete this résumé"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              )}
                            </div>
                          </div>

                          {/* File info row */}
                          <div className="pt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-muted-ink">
                            <div className="flex items-center gap-2 min-w-0">
                              <FileText className="h-4 w-4 shrink-0 text-muted-ink" />
                              <span className="font-medium text-ink truncate">
                                {r.file_name || "resume.pdf"}
                              </span>
                              {r.file_size ? (
                                <span className="text-[11px] text-muted-ink shrink-0">
                                  ({Math.round(r.file_size / 1024)} KB)
                                </span>
                              ) : null}
                            </div>
                            <span className="text-[11px] text-muted-ink shrink-0">
                              Uploaded{" "}
                              {new Date(r.updated_at).toLocaleDateString(undefined, {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              })}
                            </span>
                          </div>

                          {/* Inline Edit Form OR Display Area */}
                          {isEditing ? (
                            <div className="mt-4 pt-3.5 border-t border-hairline space-y-3.5 animate-in fade-in-50 duration-100">
                              <div className="space-y-1">
                                <label className="block text-xs font-medium text-ink">
                                  Target Role Label
                                </label>
                                <input
                                  type="text"
                                  value={editingLabel}
                                  onChange={(e) => setEditingLabel(e.target.value)}
                                  placeholder="e.g. Frontend Specialist, Full-Stack Lead"
                                  className="w-full rounded-sm border border-hairline bg-paper px-3 py-1.5 text-xs text-ink placeholder:text-muted-ink/60 focus:border-seal focus:outline-none transition-colors"
                                />
                              </div>

                              <div className="space-y-1">
                                <label className="block text-xs font-medium text-ink">
                                  Role-Specific Background & Skills Summary
                                </label>
                                <TextareaAutosize
                                  minRows={4}
                                  value={editingSkillsSummary}
                                  onChange={(e) => setEditingSkillsSummary(e.target.value)}
                                  placeholder="Highlight the key skills and achievements relevant to this specific role target..."
                                  className="w-full resize-none rounded-sm border border-hairline bg-paper px-3 py-2 text-xs text-ink placeholder:text-muted-ink/60 focus:border-seal focus:outline-none transition-colors leading-relaxed"
                                />
                              </div>

                              <div className="flex items-center justify-end gap-2 pt-1">
                                <button
                                  type="button"
                                  onClick={() => setEditingResumeId(null)}
                                  className="text-xs text-muted-ink hover:text-ink px-2.5 py-1.5 cursor-pointer"
                                >
                                  Cancel
                                </button>
                                <button
                                  type="button"
                                  disabled={isUpdatingResume}
                                  onClick={() => handleSaveEdit(r.id)}
                                  className="inline-flex items-center gap-1.5 rounded-sm bg-ink hover:bg-ink/90 text-paper px-3.5 py-1.5 text-xs font-medium transition-colors cursor-pointer disabled:opacity-50"
                                >
                                  {isUpdatingResume && (
                                    <Loader2 className="h-3 w-3 animate-spin" />
                                  )}
                                  <span>Save details</span>
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="mt-3.5 pt-3 border-t border-hairline/70">
                              <p className="text-[11px] font-medium uppercase tracking-wider text-muted-ink">
                                Role Background & Skills
                              </p>
                              {r.skills_summary ? (
                                <p className="mt-1.5 text-xs text-ink/90 leading-relaxed bg-[#FAF9F5] p-3 rounded-xs border border-hairline/60">
                                  {r.skills_summary}
                                </p>
                              ) : (
                                <p className="mt-1 text-xs text-muted-ink italic">
                                  No background summary added yet for this version.
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}

            {/* TAB 3: Sending Account (Gmail) */}
            {activeTab === "gmail" && (
              <div className="space-y-6 animate-in fade-in-50 duration-150">
                <div>
                  <h2 className="font-heading text-lg sm:text-xl text-ink">
                    Gmail
                  </h2>
                  <p className="mt-1 text-xs text-muted-ink leading-relaxed">
                    Connect your Gmail to start sending letters directly from your personal address.
                  </p>
                </div>

                <div className="border border-hairline bg-paper p-3.5 sm:p-5 rounded-sm">
                  {gmailStatus.connected ? (
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-start gap-3 min-w-0">
                        <Mail className="mt-0.5 h-5 w-5 shrink-0 text-muted-ink" />
                        <div className="min-w-0">
                          <p className="text-xs sm:text-sm font-medium text-ink truncate font-mono">
                            Sending as {gmailStatus.email}
                          </p>
                          <p className="text-[11px] sm:text-xs text-muted-ink mt-0.5">
                            Connected {gmailStatus.connectedAt ? new Date(gmailStatus.connectedAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }) : ""}
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        disabled={isDisconnectingGmail}
                        onClick={() => setShowDisconnectModal(true)}
                        className="inline-flex items-center gap-1.5 text-xs text-muted-ink hover:text-red-700 underline underline-offset-4 self-start sm:self-auto py-1 cursor-pointer disabled:opacity-50 transition-colors"
                      >
                        {isDisconnectingGmail ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Unlink className="h-3.5 w-3.5" />
                        )}
                        <span>Disconnect</span>
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-start gap-3 min-w-0">
                        <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-muted-ink" />
                        <div>
                          <p className="text-xs sm:text-sm font-medium text-ink">
                            Connect your Gmail to start sending.
                          </p>
                          <p className="text-[11px] sm:text-xs text-muted-ink mt-0.5">
                            Vina asks for permission to send messages on your behalf and to find your own sent messages so follow-ups land in the same conversation. It never reads your incoming mail.
                          </p>
                        </div>
                      </div>

                      <a
                        href="/api/gmail/connect"
                        className="inline-flex items-center justify-center gap-2 rounded-sm border border-hairline bg-[#EDEAE2] hover:bg-[#E4DFD3] text-ink px-4 py-2 text-xs font-medium transition-colors shrink-0 self-start sm:self-auto min-h-[38px]"
                      >
                        <Mail className="h-3.5 w-3.5 text-seal" />
                        <span>Connect Gmail</span>
                      </a>
                    </div>
                  )}
                </div>

                {/* Scope disclosure banner */}
                <div className="border border-hairline bg-[#FAF9F5] p-4 sm:p-5 rounded-sm space-y-2 text-xs text-muted-ink leading-relaxed">
                  <div className="flex items-center gap-2 font-medium text-ink text-xs">
                    <CheckCircle2 className="h-4 w-4 text-confirmed shrink-0" />
                    <span>Scope disclosure</span>
                  </div>
                  <p>
                    Vina asks for permission to send messages on your behalf and to find your own sent messages so follow-ups land in the same conversation. It never reads your incoming mail.
                  </p>
                </div>
              </div>
            )}

            {/* TAB 4: Plan & Membership */}
            {activeTab === "billing" && (
              <div className="space-y-6 animate-in fade-in-50 duration-150">
                <div>
                  <h2 className="font-heading text-lg sm:text-xl text-ink">
                    Billing
                  </h2>
                  <p className="mt-1 text-xs text-muted-ink leading-relaxed">
                    View your monthly sending allowance or manage your subscription.
                  </p>
                </div>

                {/* Membership & Usage Card */}
                <div className="border border-hairline bg-paper p-3.5 sm:p-5 rounded-sm space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-start gap-3 min-w-0">
                      <CreditCard className="mt-0.5 h-5 w-5 shrink-0 text-muted-ink" />
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-xs sm:text-sm font-medium text-ink">
                            {usage?.plan === "pro"
                              ? "You're on Pro."
                              : "You're on the free plan — 5 letters this month."}
                          </p>
                          {usage?.plan === "pro" ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-medium text-seal bg-[#FAF6EE] px-1.5 py-0.5 rounded-sm border border-seal/30">
                              <Zap className="h-2.5 w-2.5 fill-seal text-seal" />
                              <span>Active</span>
                            </span>
                          ) : (
                            <span className="text-[10px] text-muted-ink bg-paper px-1.5 py-0.5 rounded-sm border border-hairline">
                              Free
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] sm:text-xs text-muted-ink mt-0.5 leading-relaxed">
                          {usage?.plan === "pro"
                            ? "Unlimited tailored letters, automated attachments, and follow-ups."
                            : `${usage?.monthlySends ?? 0} of ${usage?.monthlyLimit ?? 5} letters sent this month.`}
                        </p>
                      </div>
                    </div>

                    {usage?.plan === "pro" ? (
                      <button
                        type="button"
                        disabled={isOpeningPortal}
                        onClick={handleManageBilling}
                        className="inline-flex items-center justify-center gap-1.5 text-xs text-muted-ink hover:text-ink underline underline-offset-4 self-start sm:self-auto py-1 cursor-pointer"
                      >
                        {isOpeningPortal && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                        <span>Manage billing</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        disabled={isUpgrading}
                        onClick={handleUpgrade}
                        className="inline-flex items-center justify-center gap-2 rounded-sm bg-seal px-4 py-2 text-xs font-medium text-paper hover:bg-seal/90 shrink-0 self-start sm:self-auto min-h-[38px] transition-colors cursor-pointer shadow-xs disabled:opacity-50"
                      >
                        {isUpgrading ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Zap className="h-3.5 w-3.5 fill-paper" />
                        )}
                        <span>Upgrade to Pro</span>
                      </button>
                    )}
                  </div>

                  {/* Free quota progress bar */}
                  {usage?.plan !== "pro" && (
                    <div className="space-y-1.5 pt-2 border-t border-hairline">
                      <div className="flex justify-between text-[11px] text-muted-ink">
                        <span>Monthly quota usage</span>
                        <span>
                          {Math.min(usage?.monthlySends ?? 0, 5)} / 5 sends
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-[#EDEAE2] rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all duration-300 ${
                            (usage?.monthlySends ?? 0) >= 5 ? "bg-amber-700" : "bg-seal"
                          }`}
                          style={{
                            width: `${Math.min(
                              ((usage?.monthlySends ?? 0) / 5) * 100,
                              100
                            )}%`,
                          }}
                        />
                      </div>
                      <p className="text-[10px] text-muted-ink">
                        Payment methods accepted: UPI (PhonePe, GPay, Paytm) in India • Credit/Debit Cards, Apple Pay, Google Pay globally.
                      </p>
                    </div>
                  )}
                </div>

                {/* Plan Comparison Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-xs">
                  <div className="border border-hairline bg-paper p-4 rounded-sm space-y-2">
                    <span className="font-medium text-ink">Free Tier</span>
                    <ul className="space-y-1.5 text-muted-ink text-[11px]">
                      <li>• 5 tailored sends per month</li>
                      <li>• 1 active resume PDF</li>
                      <li>• 2 AI regenerations per draft</li>
                      <li>• 30-day send log history</li>
                      <li>• Duplicate contact protection</li>
                    </ul>
                  </div>

                  <div className="border border-seal/30 bg-[#FAF6EE] p-4 rounded-sm space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-seal">Pro Membership</span>
                      <span className="text-[10px] font-semibold text-seal uppercase tracking-wider">$9 (₹499) / mo</span>
                    </div>
                    <ul className="space-y-1.5 text-muted-ink text-[11px]">
                      <li>• Unlimited tailored letters</li>
                      <li>• 1-click follow-up correspondence</li>
                      <li>• Unlimited AI regenerations</li>
                      <li>• Full lifetime send log archive</li>
                      <li>• Priority model & fast support</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* Sticky Floating Save Bar when settings have unsaved modifications across any tab */}
            {isDirty && (
              <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-hairline bg-paper/95 backdrop-blur-md px-4 py-3 sm:px-6 shadow-[0_-4px_16px_rgba(0,0,0,0.06)] animate-in slide-in-from-bottom duration-200">
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
        <Dialog open={showDisconnectModal} onOpenChange={setShowDisconnectModal}>
          <DialogContent className="border border-hairline bg-paper text-ink sm:max-w-md p-5 sm:p-6">
            <DialogHeader className="space-y-2">
              <div className="inline-flex items-center gap-1.5 text-amber-800 text-xs font-semibold uppercase tracking-wider">
                <AlertCircle className="h-3.5 w-3.5" />
                <span>Disconnect Gmail</span>
              </div>
              <DialogTitle className="font-heading text-lg sm:text-xl text-ink">
                Disconnect sending account?
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-ink leading-relaxed">
                You will no longer be able to send tailored letters directly from your personal address until you reconnect Google OAuth in Settings.
              </DialogDescription>
            </DialogHeader>

            {gmailStatus.email && (
              <div className="my-2 rounded-sm border border-hairline bg-[#FAF9F5] p-3 text-xs flex items-center gap-2.5">
                <Mail className="h-4 w-4 text-muted-ink shrink-0" />
                <div className="min-w-0">
                  <p className="font-mono text-ink font-medium truncate">{gmailStatus.email}</p>
                  <p className="text-[11px] text-muted-ink mt-0.5">Direct personal OAuth dispatch</p>
                </div>
              </div>
            )}

            <div className="pt-3 flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2.5">
              <button
                type="button"
                disabled={isDisconnectingGmail}
                onClick={() => setShowDisconnectModal(false)}
                className="px-4 py-2 rounded-sm border border-hairline text-xs font-medium text-muted-ink hover:text-ink transition-colors cursor-pointer"
              >
                Keep connected
              </button>
              <button
                type="button"
                disabled={isDisconnectingGmail}
                onClick={executeDisconnectGmail}
                className="inline-flex items-center justify-center gap-1.5 rounded-sm bg-red-800 hover:bg-red-900 px-4 py-2 text-xs font-medium text-paper shadow-xs transition-colors cursor-pointer disabled:opacity-50"
              >
                {isDisconnectingGmail && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                <span>Disconnect account</span>
              </button>
            </div>
          </DialogContent>
        </Dialog>

        {/* In-App Styled Add Résumé Modal (Pro) */}
        <Dialog open={showAddResumeModal} onOpenChange={setShowAddResumeModal}>
          <DialogContent className="border border-hairline bg-paper text-ink sm:max-w-lg p-5 sm:p-6 max-h-[90vh] overflow-y-auto">
            <DialogHeader className="space-y-2">
              <div className="inline-flex items-center gap-1.5 text-seal text-xs font-semibold uppercase tracking-wider">
                <FileText className="h-3.5 w-3.5" />
                <span>New Résumé Version</span>
              </div>
              <DialogTitle className="font-heading text-lg sm:text-xl text-ink">
                Add Targeted Résumé
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-ink leading-relaxed">
                Add a specialized CV tailored for specific roles (e.g. Frontend Engineer, Founding Engineer). Your AI drafts will cite this version when selected.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 pt-2">
              <div>
                <label className="block text-xs font-medium text-ink mb-1.5">
                  Version Label <span className="text-red-700">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Frontend / Design Engineer"
                  value={newLabel}
                  onChange={(e) => setNewLabel(e.target.value)}
                  className="w-full text-xs font-mono bg-paper border border-hairline rounded-sm px-3 py-2 text-ink placeholder:text-muted-ink/50 focus:outline-none focus:border-ink transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-ink mb-1.5">
                  PDF Document <span className="text-red-700">*</span>
                </label>
                <input
                  type="file"
                  accept="application/pdf"
                  ref={newFileInputRef}
                  onChange={(e) => setNewFile(e.target.files?.[0] ?? null)}
                  className="block w-full text-xs text-muted-ink file:mr-3 file:py-1.5 file:px-3 file:rounded-sm file:border file:border-hairline file:text-xs file:font-medium file:bg-[#FAF9F5] file:text-ink hover:file:bg-[#F2EFE9] file:cursor-pointer cursor-pointer"
                />
                <p className="text-[10px] text-muted-ink mt-1">PDF format only, maximum 10MB.</p>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-medium text-ink">
                    Parsed Skills & Experience Summary
                  </label>
                  <span className="text-[10px] text-muted-ink">Optional manual notes</span>
                </div>
                <textarea
                  rows={4}
                  placeholder="Summarize key achievements, tech stack, or portfolio highlights relevant to this specific role target..."
                  value={newSkillsSummary}
                  onChange={(e) => setNewSkillsSummary(e.target.value)}
                  className="w-full text-xs font-mono bg-paper border border-hairline rounded-sm p-3 text-ink placeholder:text-muted-ink/50 focus:outline-none focus:border-ink transition-colors leading-relaxed"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="newIsDefault"
                  checked={newIsDefault}
                  onChange={(e) => setNewIsDefault(e.target.checked)}
                  className="rounded-xs border-hairline text-seal focus:ring-0 cursor-pointer"
                />
                <label htmlFor="newIsDefault" className="text-xs text-ink cursor-pointer select-none">
                  Set as default résumé version for new drafts
                </label>
              </div>
            </div>

            <div className="pt-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2.5 border-t border-hairline mt-3">
              <button
                type="button"
                disabled={isSubmittingNewResume}
                onClick={() => setShowAddResumeModal(false)}
                className="px-4 py-2 rounded-sm border border-hairline text-xs font-medium text-muted-ink hover:text-ink transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSubmittingNewResume || !newLabel.trim() || !newFile}
                onClick={handleCreateNewResume}
                className="inline-flex items-center justify-center gap-1.5 rounded-sm bg-seal hover:bg-seal/90 px-4 py-2 text-xs font-medium text-paper shadow-xs transition-colors cursor-pointer disabled:opacity-50"
              >
                {isSubmittingNewResume && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                <span>Add Version</span>
              </button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </main>
  );
}
