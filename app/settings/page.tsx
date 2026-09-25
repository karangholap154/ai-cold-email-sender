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
  Sparkles,
  User,
  Globe,
  Code2,
  Link2,
  Phone,
  Mail,
  Unlink,
  CreditCard,
  Zap,
  ExternalLink,
  Save,
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
  const [activeTab, setActiveTab] = useState<SettingsTab>("profile");
  const [resume, setResume] = useState<Resume | null>(null);
  const [skillsSummary, setSkillsSummary] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const baselineRef = useRef<SettingsBaseline | null>(null);

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

  // Handle URL query feedback from OAuth redirect, billing return & tab parameter
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const requestedTab = params.get("tab") as SettingsTab | null;
      if (requestedTab && ["profile", "resume", "gmail", "billing"].includes(requestedTab)) {
        setActiveTab(requestedTab);
      } else if (params.get("billing")) {
        setActiveTab("billing");
      } else if (params.get("gmail") || params.get("error")) {
        setActiveTab("gmail");
      }

      if (params.get("billing") === "success") {
        toast.success("Welcome to Pro! Your account now has unlimited email sends.");
        window.history.replaceState({}, "", "/settings");
      } else if (params.get("gmail") === "connected") {
        toast.success("Gmail account connected! Emails will now be sent directly from your account.");
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
          if (rData.resume) {
            setResume(rData.resume);
            loadedSkillsSummary = rData.resume.skills_summary || "";
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

            baselineRef.current = {
              skillsSummary: loadedSkillsSummary,
              fullName: fn,
              signOff: so,
              portfolioUrl: po,
              githubUrl: gh,
              linkedinUrl: li,
              phone: ph,
              customSignature: initialSig,
            };
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
  }, []);

  // Compute dirty (unsaved) modifications
  const isDirty = Boolean(
    selectedFile !== null ||
    (baselineRef.current && (
      skillsSummary !== baselineRef.current.skillsSummary ||
      fullName !== baselineRef.current.fullName ||
      signOff !== baselineRef.current.signOff ||
      portfolioUrl !== baselineRef.current.portfolioUrl ||
      githubUrl !== baselineRef.current.githubUrl ||
      linkedinUrl !== baselineRef.current.linkedinUrl ||
      phone !== baselineRef.current.phone ||
      customSignature !== baselineRef.current.customSignature
    ))
  );

  const handleResetChanges = () => {
    if (!baselineRef.current) return;
    setSkillsSummary(baselineRef.current.skillsSummary);
    setFullName(baselineRef.current.fullName);
    setSignOff(baselineRef.current.signOff);
    setPortfolioUrl(baselineRef.current.portfolioUrl);
    setGithubUrl(baselineRef.current.githubUrl);
    setLinkedinUrl(baselineRef.current.linkedinUrl);
    setPhone(baselineRef.current.phone);
    setCustomSignature(baselineRef.current.customSignature);
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
        formData.append("skills_summary", skillsSummary);

        const res = await fetch("/api/resume", {
          method: "POST",
          body: formData,
        });

        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.error || "Failed to save resume.");
        }

        setResume(data.resume);
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
      baselineRef.current = {
        skillsSummary,
        fullName,
        signOff,
        portfolioUrl,
        githubUrl,
        linkedinUrl,
        phone,
        customSignature,
      };
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
      label: "Profile & Signature",
      icon: User,
      badge: null,
    },
    {
      id: "resume" as SettingsTab,
      label: "Resume & Skills",
      icon: FileText,
      badge: resume?.file_url ? (
        <span className="h-1.5 w-1.5 rounded-full bg-confirmed shrink-0" title="Active resume uploaded"></span>
      ) : (
        <span className="h-1.5 w-1.5 rounded-full bg-amber-600 shrink-0" title="No resume uploaded"></span>
      ),
    },
    {
      id: "gmail" as SettingsTab,
      label: "Sending Gmail",
      icon: Mail,
      badge: gmailStatus.connected ? (
        <span className="h-1.5 w-1.5 rounded-full bg-confirmed shrink-0" title="Connected"></span>
      ) : (
        <span className="h-1.5 w-1.5 rounded-full bg-amber-600 shrink-0" title="Not connected"></span>
      ),
    },
    {
      id: "billing" as SettingsTab,
      label: "Plan & Usage",
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
                    Profile & Sender Signature
                  </h2>
                  <p className="mt-1 text-xs text-muted-ink leading-relaxed">
                    Set your professional sign-off, portfolio, and contact links. Choose a layout preset or directly edit the signature box below.
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
                        <Sparkles className="h-3.5 w-3.5 text-muted-ink" />
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
                        placeholder="https://www.karangholap.com/"
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
                        placeholder="8421955664"
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
                        placeholder="https://github.com/karangholap154/"
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
                        placeholder="https://www.linkedin.com/in/karangholap/"
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
                <div>
                  <h2 className="font-heading text-lg sm:text-xl text-ink">
                    Resume & Candidate Context
                  </h2>
                  <p className="mt-1 text-xs text-muted-ink leading-relaxed">
                    Upload your active resume PDF (attached to outgoing emails) and provide background skills referenced during letter generation.
                  </p>
                </div>

                {/* Resume PDF File Section */}
                <section className="space-y-2.5 sm:space-y-3">
                  <label className="block text-xs sm:text-sm font-medium text-ink">
                    Active Resume PDF
                  </label>

                  <div className="border border-hairline bg-paper p-3.5 sm:p-5 rounded-sm">
                    {resume?.file_url ? (
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                        <div className="flex items-start gap-3 min-w-0">
                          <FileText className="mt-0.5 h-5 w-5 shrink-0 text-muted-ink" />
                          <div className="min-w-0">
                            <p className="text-xs sm:text-sm font-medium text-ink truncate">
                              {resume.file_name || "resume.pdf"}
                            </p>
                            <p className="text-[11px] sm:text-xs text-muted-ink mt-0.5">
                              Active resume • Updated{" "}
                              {new Date(resume.updated_at).toLocaleDateString(undefined, {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              })}
                            </p>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="text-xs text-muted-ink hover:text-ink underline underline-offset-4 self-start sm:self-auto py-1 cursor-pointer"
                        >
                          Replace PDF
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-start sm:items-center gap-3">
                        <AlertCircle className="mt-0.5 sm:mt-0 h-5 w-5 shrink-0 text-muted-ink" />
                        <div>
                          <p className="text-xs sm:text-sm font-medium text-ink">No resume uploaded yet</p>
                          <p className="text-[11px] sm:text-xs text-muted-ink mt-0.5">
                            Outgoing emails require an attached PDF.
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Staged file notice */}
                    {selectedFile && (
                      <div className="mt-3 sm:mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-t border-hairline pt-3">
                        <div className="flex items-center gap-2 text-xs text-ink min-w-0">
                          <CheckCircle2 className="h-4 w-4 text-confirmed shrink-0" />
                          <span className="truncate">Ready to upload: <strong className="font-medium">{selectedFile.name}</strong></span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedFile(null);
                            if (fileInputRef.current) fileInputRef.current.value = "";
                          }}
                          className="text-xs text-muted-ink hover:text-ink self-start sm:self-auto py-1 cursor-pointer"
                        >
                          Cancel
                        </button>
                      </div>
                    )}

                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="application/pdf"
                      onChange={handleFileChange}
                      className="hidden"
                    />

                    {!resume?.file_url && !selectedFile && (
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="mt-3 sm:mt-4 inline-flex items-center gap-2 border border-hairline px-3 py-2 text-xs text-ink hover:bg-[#ece9e1] transition-colors rounded-sm cursor-pointer min-h-[38px]"
                      >
                        <Upload className="h-3.5 w-3.5" />
                        <span>Choose PDF file</span>
                      </button>
                    )}
                  </div>
                </section>

                {/* Skills & Background Summary */}
                <section className="space-y-2">
                  <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1">
                    <label htmlFor="skills-summary" className="block text-xs sm:text-sm font-medium text-ink">
                      Skills & Background Summary
                    </label>
                    <span className="text-[11px] text-muted-ink">Passed into AI prompt</span>
                  </div>
                  <p className="text-xs text-muted-ink leading-relaxed">
                    Provide 3–6 sentences or bullet points highlighting your years of experience, core technologies, notable achievements, and primary domains.
                  </p>
                  <TextareaAutosize
                    id="skills-summary"
                    minRows={5}
                    value={skillsSummary}
                    onChange={(e) => setSkillsSummary(e.target.value)}
                    placeholder="e.g. 5+ years building full-stack web applications with React, Next.js, Node.js, and PostgreSQL..."
                    className="w-full resize-none border border-hairline bg-paper px-3.5 py-3 text-sm text-ink placeholder:text-muted-ink/60 focus:border-seal focus:outline-none rounded-sm transition-colors leading-relaxed"
                  />
                </section>

                {/* Tab Action */}
                <div className="flex items-center justify-end pt-2 border-t border-hairline">
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-sm border border-hairline bg-ink px-5 py-2.5 sm:py-2 text-xs font-medium text-paper hover:bg-ink/90 disabled:opacity-50 transition-colors cursor-pointer min-h-[42px]"
                  >
                    {isSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                    <span>{isSaving ? "Saving..." : "Save resume & skills"}</span>
                  </button>
                </div>
              </div>
            )}

            {/* TAB 3: Sending Account (Gmail) */}
            {activeTab === "gmail" && (
              <div className="space-y-6 animate-in fade-in-50 duration-150">
                <div>
                  <h2 className="font-heading text-lg sm:text-xl text-ink">
                    Sending Account (Gmail)
                  </h2>
                  <p className="mt-1 text-xs text-muted-ink leading-relaxed">
                    Connect your Google account so correspondence sends directly from your personal address with verified deliverability.
                  </p>
                </div>

                <div className="border border-hairline bg-paper p-3.5 sm:p-5 rounded-sm">
                  {gmailStatus.connected ? (
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-start gap-3 min-w-0">
                        <Mail className="mt-0.5 h-5 w-5 shrink-0 text-muted-ink" />
                        <div className="min-w-0">
                          <p className="text-xs sm:text-sm font-medium text-ink truncate font-mono">
                            {gmailStatus.email}
                          </p>
                          <p className="text-[11px] sm:text-xs text-muted-ink mt-0.5">
                            Direct personal OAuth dispatch • Connected {gmailStatus.connectedAt ? new Date(gmailStatus.connectedAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }) : ""}
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
                            No Gmail account connected
                          </p>
                          <p className="text-[11px] sm:text-xs text-muted-ink mt-0.5">
                            Connect your Google account so correspondence sends directly from your personal address. We only request permission to send approved drafts (<span className="font-mono">gmail.send</span>).
                          </p>
                        </div>
                      </div>

                      <a
                        href="/api/gmail/connect"
                        className="inline-flex items-center justify-center gap-2 rounded-sm border border-hairline bg-[#EDEAE2] hover:bg-[#E4DFD3] text-ink px-4 py-2 text-xs font-medium transition-colors shrink-0 self-start sm:self-auto min-h-[38px]"
                      >
                        <Mail className="h-3.5 w-3.5 text-seal" />
                        <span>Connect with Google</span>
                      </a>
                    </div>
                  )}
                </div>

                {/* Transparency and security guarantee */}
                <div className="border border-hairline bg-[#FAF9F5] p-4 sm:p-5 rounded-sm space-y-2 text-xs text-muted-ink leading-relaxed">
                  <div className="flex items-center gap-2 font-medium text-ink text-xs">
                    <CheckCircle2 className="h-4 w-4 text-confirmed shrink-0" />
                    <span>Strict Google API Least-Privilege Scope</span>
                  </div>
                  <p>
                    We request Google&apos;s narrowest sending permission (<span className="font-mono text-ink bg-paper px-1 py-0.5 rounded-xs border border-hairline">gmail.send</span>).
                    We never read your inbox, access your incoming emails, or inspect your contacts. Your account is used strictly to dispatch correspondence you have manually approved.
                  </p>
                </div>
              </div>
            )}

            {/* TAB 4: Plan & Membership */}
            {activeTab === "billing" && (
              <div className="space-y-6 animate-in fade-in-50 duration-150">
                <div>
                  <h2 className="font-heading text-lg sm:text-xl text-ink">
                    Membership & Usage
                  </h2>
                  <p className="mt-1 text-xs text-muted-ink leading-relaxed">
                    View your monthly sending allowance, upgrade to Pro, or manage your active subscription.
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
                              ? "Pro Plan • Unlimited Correspondence"
                              : `Monthly Quota: ${usage?.monthlySends ?? 0} of ${usage?.monthlyLimit ?? 5} letters sent`}
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
                            ? "You have unrestricted AI drafts, automated Gmail attachments, 1-click follow-ups, and full log history."
                            : "Free accounts include 5 tailored letters per calendar month. Upgrade for unlimited sending."}
                        </p>
                      </div>
                    </div>

                    {usage?.plan === "pro" ? (
                      <button
                        type="button"
                        disabled={isOpeningPortal}
                        onClick={handleManageBilling}
                        className="inline-flex items-center justify-center gap-1.5 text-xs text-muted-ink hover:text-ink border border-hairline px-3.5 py-2 rounded-sm self-start sm:self-auto min-h-[38px] cursor-pointer hover:bg-[#FAF9F5] transition-colors"
                      >
                        {isOpeningPortal ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <ExternalLink className="h-3.5 w-3.5" />
                        )}
                        <span>Manage Subscription</span>
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
                        <span>Upgrade to Pro ($9 / ₹499)</span>
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
      </div>
    </main>
  );
}
