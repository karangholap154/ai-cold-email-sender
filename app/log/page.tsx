"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Search,
  CheckCircle2,
  XCircle,
  Loader2,
  FileText,
  AlertCircle,
  Clock,
  PenLine,
  Lock,
  ArrowRight,
  RotateCcw,
  Copy,
  Check,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  CornerDownRight,
  MessageSquare,
  X,
  RefreshCw,
} from "lucide-react";
import type { SentEmail } from "@/lib/types/database";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { initiateCheckout } from "@/lib/billing";
import { PRO_PLAN, FREE_RETENTION_DAYS } from "@/lib/constants/plans";

// Outreach follow-up threshold (in calendar days)
const STALE_FOLLOWUP_DAYS = 5;

function formatRelativeDays(dateString: string, now: number): string {
  const diffMs = now - new Date(dateString).getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays <= 0) return "Today";
  if (diffDays === 1) return "1 day ago";
  return `${diffDays} days ago`;
}

// Conversation group structure: an initial email plus any follow-ups attached to it
interface ConversationThread {
  threadKey: string;
  initialEmail: SentEmail;
  latestEmail: SentEmail;
  followUps: SentEmail[];
  allEmails: SentEmail[];
  companyName: string;
  roleTitle: string | null;
  hrEmail: string;
  latestDate: string;
  hasFailure: boolean;
  daysSinceLatest: number;
  needsFollowUp: boolean;
  isResponded: boolean;
  respondedAt?: string | null;
}

export default function LogPage() {
  const router = useRouter();
  const [currentTime] = useState(() => Date.now());
  const [emails, setEmails] = useState<SentEmail[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncingReplies, setIsSyncingReplies] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<
    "all" | "needs_followup" | "responded" | "initial" | "followup" | "failed"
  >("all");
  const [selectedEmailId, setSelectedEmailId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [plan, setPlan] = useState<"free" | "pro">("free");
  const [hasOlderEmails, setHasOlderEmails] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [isUpgrading, setIsUpgrading] = useState(false);

  const handleCopyBody = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success("Letter content copied to clipboard");
    setTimeout(() => setCopiedId((prev) => (prev === id ? null : prev)), 2000);
  };

  const handleSyncReplies = async () => {
    setIsSyncingReplies(true);
    try {
      const res = await fetch("/api/emails/sync-replies", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to check Gmail for replies.");
      }
      if (data.newRepliesCount > 0) {
        toast.success(
          `Detected ${data.newRepliesCount} new recruiter repl${data.newRepliesCount > 1 ? "ies" : "y"}!`
        );
      } else {
        toast.info(data.message || `Checked ${data.checkedCount || 0} applications. No new replies detected.`);
      }

      // Refresh email log records
      const refreshRes = await fetch("/api/emails");
      if (refreshRes.ok) {
        const refreshData = await refreshRes.json();
        setEmails(refreshData.emails || []);
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Error checking Gmail for replies");
    } finally {
      setIsSyncingReplies(false);
    }
  };

  const handleToggleResponded = async (emailId: string, currentStatus: boolean) => {
    const nextStatus = !currentStatus;
    try {
      const res = await fetch("/api/emails", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: emailId, isResponded: nextStatus }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to update response status");
      }
      toast.success(nextStatus ? "Marked as responded" : "Response mark cleared");
      setEmails((prev) =>
        prev.map((e) =>
          e.id === emailId
            ? {
                ...e,
                is_responded: nextStatus,
                responded_at: nextStatus ? new Date().toISOString() : null,
              }
            : e
        )
      );
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Error updating response status");
    }
  };

  const handleOpenGmailThread = (threadId?: string | null) => {
    if (threadId) {
      window.open(`https://mail.google.com/mail/u/0/#all/${threadId}`, "_blank", "noopener,noreferrer");
    } else {
      window.open("https://mail.google.com/mail/u/0/#sent", "_blank", "noopener,noreferrer");
    }
  };

  const handleUpgrade = async () => {
    setIsUpgrading(true);
    try {
      await initiateCheckout({ onFallback: () => router.push("/settings") });
    } finally {
      setIsUpgrading(false);
    }
  };

  useEffect(() => {
    async function loadEmails() {
      try {
        const res = await fetch("/api/emails");
        if (res.ok) {
          const data = await res.json();
          setEmails(data.emails || []);
          if (data.plan) setPlan(data.plan);
          if (data.hasOlderEmails !== undefined) setHasOlderEmails(data.hasOlderEmails);
          if (data.totalCount !== undefined) setTotalCount(data.totalCount);
        }
      } catch (err) {
        console.error("Error loading email logs:", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadEmails();
  }, []);

  // Aggregate all emails into threaded conversations
  const allConversations = useMemo(() => {
    const threadMap = new Map<string, ConversationThread>();
    const followUpsWithoutParent: SentEmail[] = [];

    // Step 1: Create threads for initial emails
    for (const email of emails) {
      if (email.email_type !== "followup") {
        const key = email.gmail_thread_id || email.id;
        threadMap.set(key, {
          threadKey: key,
          initialEmail: email,
          latestEmail: email,
          followUps: [],
          allEmails: [email],
          companyName: email.company_name || "Unknown Company",
          roleTitle: email.role_title,
          hrEmail: email.hr_email,
          latestDate: email.created_at,
          hasFailure: email.status === "failed",
          daysSinceLatest: 0,
          needsFollowUp: false,
          isResponded: Boolean(email.is_responded),
          respondedAt: email.responded_at || null,
        });
      }
    }

    // Step 2: Associate follow-ups with their parent thread
    for (const email of emails) {
      if (email.email_type === "followup") {
        let attached = false;

        // Try attaching by gmail_thread_id first
        if (email.gmail_thread_id && threadMap.has(email.gmail_thread_id)) {
          const thread = threadMap.get(email.gmail_thread_id)!;
          thread.followUps.push(email);
          thread.allEmails.push(email);
          if (new Date(email.created_at) > new Date(thread.latestDate)) {
            thread.latestDate = email.created_at;
            thread.latestEmail = email;
          }
          if (email.status === "failed") thread.hasFailure = true;
          attached = true;
        }

        // Try attaching by parent_email_id
        if (!attached && email.parent_email_id) {
          for (const thread of threadMap.values()) {
            if (
              thread.initialEmail.id === email.parent_email_id ||
              thread.followUps.some((f) => f.id === email.parent_email_id)
            ) {
              thread.followUps.push(email);
              thread.allEmails.push(email);
              if (new Date(email.created_at) > new Date(thread.latestDate)) {
                thread.latestDate = email.created_at;
                thread.latestEmail = email;
              }
              if (email.status === "failed") thread.hasFailure = true;
              attached = true;
              break;
            }
          }
        }

        // If parent wasn't found, treat as standalone
        if (!attached) {
          followUpsWithoutParent.push(email);
        }
      }
    }

    // Add unattached follow-ups as standalone threads
    for (const email of followUpsWithoutParent) {
      const key = email.gmail_thread_id || email.id;
      threadMap.set(key, {
        threadKey: key,
        initialEmail: email,
        latestEmail: email,
        followUps: [],
        allEmails: [email],
        companyName: email.company_name || "Unknown Company",
        roleTitle: email.role_title,
        hrEmail: email.hr_email,
        latestDate: email.created_at,
        hasFailure: email.status === "failed",
        daysSinceLatest: 0,
        needsFollowUp: false,
        isResponded: Boolean(email.is_responded),
        respondedAt: email.responded_at || null,
      });
    }

    const threads = Array.from(threadMap.values());
    for (const thread of threads) {
      // Sort emails in each thread chronologically
      thread.allEmails.sort(
        (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );
      // Ensure latestEmail points to the newest chronologically
      thread.latestEmail = thread.allEmails[thread.allEmails.length - 1] || thread.initialEmail;
      thread.latestDate = thread.latestEmail.created_at;

      // Thread is responded if any message within it has been flagged as responded
      thread.isResponded = thread.allEmails.some((e) => Boolean(e.is_responded));
      const respondedEmail = thread.allEmails.find((e) => Boolean(e.is_responded));
      thread.respondedAt = respondedEmail?.responded_at || null;

      const diffMs = currentTime - new Date(thread.latestDate).getTime();
      const daysSinceLatest = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
      thread.daysSinceLatest = daysSinceLatest;
      thread.needsFollowUp =
        !thread.isResponded &&
        daysSinceLatest >= STALE_FOLLOWUP_DAYS &&
        thread.latestEmail.status === "sent" &&
        thread.followUps.length < 2;
    }

    // Sort conversations by latest activity descending
    return threads.sort(
      (a, b) => new Date(b.latestDate).getTime() - new Date(a.latestDate).getTime()
    );
  }, [emails, currentTime]);

  // Statistics calculation
  const stats = useMemo(() => {
    const total = emails.length;
    const sentCount = emails.filter((e) => e.status === "sent").length;
    const followUpsCount = emails.filter((e) => e.email_type === "followup").length;
    const initialCount = total - followUpsCount;
    const failedCount = emails.filter((e) => e.status === "failed").length;
    const deliveryRate = total > 0 ? Math.round((sentCount / total) * 100) : 100;
    const needsFollowUpCount = allConversations.filter((t) => t.needsFollowUp).length;
    const respondedCount = allConversations.filter((t) => t.isResponded).length;
    return {
      total,
      sentCount,
      followUpsCount,
      initialCount,
      failedCount,
      deliveryRate,
      needsFollowUpCount,
      respondedCount,
    };
  }, [emails, allConversations]);

  // Filter conversations based on search query and active tab filter
  const conversations = useMemo(() => {
    let result = allConversations;

    // Filter by active tab
    if (activeFilter === "needs_followup") {
      result = result.filter((thread) => thread.needsFollowUp);
    } else if (activeFilter === "responded") {
      result = result.filter((thread) => thread.isResponded);
    } else if (activeFilter === "initial") {
      result = result.filter(
        (thread) => thread.followUps.length === 0 && thread.initialEmail.email_type !== "followup"
      );
    } else if (activeFilter === "followup") {
      result = result.filter(
        (thread) => thread.followUps.length > 0 || thread.initialEmail.email_type === "followup"
      );
    } else if (activeFilter === "failed") {
      result = result.filter((thread) => thread.hasFailure);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      result = result.filter(
        (thread) =>
          thread.hrEmail.toLowerCase().includes(query) ||
          thread.companyName.toLowerCase().includes(query) ||
          (thread.roleTitle && thread.roleTitle.toLowerCase().includes(query)) ||
          thread.allEmails.some(
            (item) =>
              item.final_subject.toLowerCase().includes(query) ||
              item.final_body.toLowerCase().includes(query)
          )
      );
    }

    return result;
  }, [allConversations, activeFilter, searchQuery]);

  return (
    <main className="min-h-[calc(100vh-4rem)] bg-paper px-4 py-8 sm:px-6 sm:py-10 pb-24 md:pb-12">
      <div className="mx-auto w-full max-w-5xl space-y-7">
        
        {/* --- Header Section --- */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-hairline/80 pb-6">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-xs text-muted-ink">
              <span className="font-heading font-semibold text-ink">Correspondence Archive</span>
              <span>•</span>
              <span>{emails.length} total letters</span>
            </div>
            <h1 className="font-heading text-2xl sm:text-3xl text-ink font-normal tracking-tight">
              Sent Letters
            </h1>
            <p className="text-xs sm:text-sm text-muted-ink max-w-2xl leading-relaxed">
              Threaded correspondence records, delivered letters, and follow-up chains dispatched via your personal Gmail.
            </p>
          </div>

          <div className="flex items-center gap-2.5 self-start md:self-end shrink-0">
            <button
              type="button"
              disabled={isSyncingReplies || isLoading}
              onClick={handleSyncReplies}
              className="inline-flex items-center gap-1.5 rounded-sm border border-hairline bg-white px-3.5 py-2 text-xs font-medium text-ink shadow-2xs hover:bg-paper transition-all cursor-pointer disabled:opacity-50"
              title="Query Gmail IMAP for replies from target HR contacts"
            >
              <RefreshCw
                className={`h-3.5 w-3.5 ${
                  isSyncingReplies ? "animate-spin text-seal" : "text-muted-ink"
                }`}
              />
              <span>{isSyncingReplies ? "Syncing..." : "Sync Replies"}</span>
            </button>

            <Link
              href="/draft"
              className="inline-flex items-center gap-1.5 rounded-sm bg-seal px-4 py-2 text-xs font-medium text-paper shadow-2xs hover:bg-seal/90 transition-all cursor-pointer"
            >
              <PenLine className="h-3.5 w-3.5" />
              <span>Compose letter</span>
            </Link>
          </div>
        </div>

        {/* --- Ledger Overview Bar --- */}
        {!isLoading && emails.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="rounded-md border border-hairline bg-white/70 p-4 shadow-2xs">
              <span className="text-[11px] font-medium text-muted-ink">All Letters</span>
              <p className="font-heading text-xl sm:text-2xl text-ink mt-1">
                {stats.total}
              </p>
              <span className="text-[10px] text-muted-ink">Lifetime dispatched</span>
            </div>

            <div className="rounded-md border border-hairline bg-white/70 p-4 shadow-2xs">
              <span className="text-[11px] font-medium text-muted-ink">Initial Outreaches</span>
              <p className="font-heading text-xl sm:text-2xl text-ink mt-1">
                {stats.initialCount}
              </p>
              <span className="text-[10px] text-muted-ink">First-contact pitches</span>
            </div>

            <div className="rounded-md border border-hairline bg-white/70 p-4 shadow-2xs">
              <span className="text-[11px] font-medium text-muted-ink">Follow-up Letters</span>
              <p className="font-heading text-xl sm:text-2xl text-ink mt-1">
                {stats.followUpsCount}
              </p>
              <span className="text-[10px] text-seal font-medium">Threaded follow-ups</span>
            </div>

            <div className="rounded-md border border-hairline bg-white/70 p-4 shadow-2xs">
              <span className="text-[11px] font-medium text-muted-ink">Delivery Accuracy</span>
              <div className="flex items-baseline gap-2 mt-1">
                <p className="font-heading text-xl sm:text-2xl text-ink">
                  {stats.deliveryRate}%
                </p>
                <span className="text-[10px] text-confirmed font-medium">
                  {stats.sentCount} delivered
                </span>
              </div>
              <span className="text-[10px] text-muted-ink">Sent via personal Gmail</span>
            </div>
          </div>
        )}

        {/* --- Retention Window Notice --- */}
        {!isLoading && (
          <div className="rounded-md border border-hairline bg-white/60 px-4 py-3 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
            <div className="flex items-center gap-2.5 text-muted-ink">
              {plan === "pro" ? (
                <>
                  <CheckCircle2 className="h-4 w-4 text-confirmed shrink-0" />
                  <span>
                    <strong className="text-ink font-medium">Pro Plan:</strong> Full lifetime correspondence archive active.
                  </span>
                </>
              ) : (
                <>
                  <Clock className="h-4 w-4 text-muted-ink shrink-0" />
                  <span>
                    Showing correspondence from the <strong className="text-ink font-medium">last {FREE_RETENTION_DAYS} days</strong> (Free tier archive).
                  </span>
                </>
              )}
            </div>

            {plan === "free" && (
              <Link
                href="/settings?tab=billing"
                className="inline-flex items-center gap-1 text-[11px] font-medium text-seal hover:underline shrink-0"
              >
                <span>Upgrade to Pro for full lifetime archive</span>
                <ArrowRight className="h-3 w-3" />
              </Link>
            )}
          </div>
        )}

        {/* --- Stale Applications Follow-Up Reminder Banner --- */}
        {!isLoading && stats.needsFollowUpCount > 0 && activeFilter !== "needs_followup" && (
          <div className="rounded-md border border-amber-300/80 bg-amber-50/70 p-3.5 px-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-amber-950 shadow-2xs">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 rounded-full bg-amber-200/70 text-amber-900 shrink-0">
                <Clock className="h-4 w-4" />
              </div>
              <div>
                <span className="font-medium text-ink">
                  {stats.needsFollowUpCount} application{stats.needsFollowUpCount > 1 ? "s" : ""} waiting for a follow-up
                </span>
                <p className="text-[11px] text-amber-900/80 mt-0.5">
                  Sent 5+ days ago without a follow-up. Polishing a brief follow-up significantly improves response rates.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setActiveFilter("needs_followup")}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-950 underline underline-offset-4 hover:text-ink self-start sm:self-auto cursor-pointer"
            >
              <span>Review pending outreach ({stats.needsFollowUpCount})</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        {/* --- Search & Filter Bar --- */}
        <div className="rounded-md border border-hairline bg-white/80 p-4 shadow-2xs space-y-3.5">
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
            
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-ink/70" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by company, role title, email, or letter body..."
                className="w-full rounded-sm border border-hairline bg-paper/60 pl-10 pr-9 py-2.5 text-xs sm:text-sm text-ink placeholder:text-muted-ink/60 focus:bg-white focus:border-seal focus:outline-none transition-colors"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  aria-label="Clear search"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-ink hover:text-ink p-0.5 cursor-pointer"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {/* Filter Tabs */}
            <div className="flex flex-wrap items-center gap-1.5 shrink-0 text-xs">
              <button
                type="button"
                onClick={() => setActiveFilter("all")}
                className={`rounded-sm px-3 py-2 text-xs transition-colors cursor-pointer ${
                  activeFilter === "all"
                    ? "bg-ink text-paper font-medium"
                    : "border border-hairline bg-paper/60 text-muted-ink hover:text-ink hover:bg-paper"
                }`}
              >
                All ({emails.length})
              </button>
              {stats.needsFollowUpCount > 0 && (
                <button
                  type="button"
                  onClick={() => setActiveFilter("needs_followup")}
                  className={`rounded-sm px-3 py-2 text-xs transition-colors cursor-pointer inline-flex items-center gap-1.5 ${
                    activeFilter === "needs_followup"
                      ? "bg-amber-900 text-paper font-medium"
                      : "border border-amber-300 bg-amber-50 text-amber-900 hover:bg-amber-100 font-medium"
                  }`}
                >
                  <Clock className="h-3.5 w-3.5 text-amber-700" />
                  <span>Needs Follow-up ({stats.needsFollowUpCount})</span>
                </button>
              )}
              {stats.respondedCount > 0 && (
                <button
                  type="button"
                  onClick={() => setActiveFilter("responded")}
                  className={`rounded-sm px-3 py-2 text-xs transition-colors cursor-pointer inline-flex items-center gap-1.5 ${
                    activeFilter === "responded"
                      ? "bg-confirmed text-paper font-medium"
                      : "border border-confirmed/30 bg-confirmed/10 text-confirmed hover:bg-confirmed/15 font-medium"
                  }`}
                >
                  <CheckCircle2 className="h-3.5 w-3.5 text-confirmed" />
                  <span>Responded ({stats.respondedCount})</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => setActiveFilter("initial")}
                className={`rounded-sm px-3 py-2 text-xs transition-colors cursor-pointer ${
                  activeFilter === "initial"
                    ? "bg-ink text-paper font-medium"
                    : "border border-hairline bg-paper/60 text-muted-ink hover:text-ink hover:bg-paper"
                }`}
              >
                Initial ({stats.initialCount})
              </button>
              <button
                type="button"
                onClick={() => setActiveFilter("followup")}
                className={`rounded-sm px-3 py-2 text-xs transition-colors cursor-pointer ${
                  activeFilter === "followup"
                    ? "bg-ink text-paper font-medium"
                    : "border border-hairline bg-paper/60 text-muted-ink hover:text-ink hover:bg-paper"
                }`}
              >
                Follow-ups ({stats.followUpsCount})
              </button>
              {stats.failedCount > 0 && (
                <button
                  type="button"
                  onClick={() => setActiveFilter("failed")}
                  className={`rounded-sm px-3 py-2 text-xs transition-colors cursor-pointer ${
                    activeFilter === "failed"
                      ? "bg-amber-800 text-paper font-medium"
                      : "border border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100"
                  }`}
                >
                  Failed ({stats.failedCount})
                </button>
              )}
            </div>

          </div>
        </div>

        {/* --- Correspondence Threads Feed --- */}
        {isLoading ? (
          <div className="rounded-md border border-hairline bg-white/50 p-16 text-center space-y-3">
            <Loader2 className="mx-auto h-6 w-6 animate-spin text-seal" />
            <h3 className="font-heading text-lg text-ink font-normal">
              Loading correspondence history...
            </h3>
            <p className="text-xs text-muted-ink max-w-sm mx-auto">
              Compiling threaded letters and delivery outcomes from your account.
            </p>
          </div>
        ) : conversations.length === 0 ? (
          <div className="rounded-md border border-dashed border-hairline bg-white/40 p-12 text-center space-y-3">
            <FileText className="mx-auto h-8 w-8 text-muted-ink/60" />
            <h3 className="font-heading text-lg text-ink font-normal">
              {searchQuery || activeFilter !== "all" ? "No matching correspondence" : "Nothing sent yet"}
            </h3>
            <p className="text-xs text-muted-ink max-w-md mx-auto">
              {searchQuery || activeFilter !== "all"
                ? "We couldn't find any letters matching your current search query or active filter."
                : "Your sent letters, threaded follow-up histories, and delivery outcomes will be neatly recorded here."}
            </p>
            {searchQuery || activeFilter !== "all" ? (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  setActiveFilter("all");
                }}
                className="mt-2 inline-flex items-center gap-1.5 rounded-sm border border-hairline bg-white px-3.5 py-1.5 text-xs font-medium text-ink hover:border-ink/40 transition-colors shadow-2xs cursor-pointer"
              >
                Clear search & filters
              </button>
            ) : (
              <Link
                href="/draft"
                className="mt-2 inline-flex items-center gap-1.5 rounded-sm bg-seal px-4 py-2 text-xs font-medium text-paper hover:bg-seal/90 transition-colors shadow-2xs"
              >
                <PenLine className="h-3.5 w-3.5" />
                <span>Draft your first letter</span>
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {conversations.map((thread) => {
              const threadLetterCount = thread.allEmails.length;
              const hasMultiple = threadLetterCount > 1;
              const companyInitials = thread.companyName
                .replace(/^the\s+/i, "")
                .slice(0, 2)
                .toUpperCase();

              return (
                <div
                  key={thread.threadKey}
                  className="rounded-md border border-hairline bg-white/85 shadow-2xs overflow-hidden transition-all duration-200 hover:border-ink/25"
                >
                  {/* Thread Group Header: Company dossier strip */}
                  <div className="px-5 py-3.5 bg-[#FAF8F3] border-b border-hairline/80 flex flex-wrap items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-3 min-w-0">
                      {/* Company Monogram Seal */}
                      <div className="h-8 w-8 rounded-sm bg-seal/10 border border-seal/20 text-seal font-heading font-semibold text-xs flex items-center justify-center shrink-0">
                        {companyInitials}
                      </div>

                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-heading font-medium text-ink text-sm sm:text-base leading-snug">
                            {thread.companyName}
                          </span>
                          {thread.roleTitle && (
                            <span className="text-muted-ink text-[11px] hidden sm:inline">
                              • {thread.roleTitle}
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-muted-ink font-mono truncate">
                          Recipient: {thread.hrEmail}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 text-[11px]">
                      {/* Responded status badge */}
                      {thread.isResponded ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-sm border border-confirmed/30 bg-confirmed/10 text-confirmed font-medium text-[11px] shadow-2xs">
                          <CheckCircle2 className="h-3 w-3 text-confirmed shrink-0" />
                          <span>Responded</span>
                        </span>
                      ) : thread.needsFollowUp ? (
                        /* Stale application indicator badge */
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-sm border border-amber-300 bg-amber-50 text-amber-900 font-medium text-[11px] shadow-2xs">
                          <Clock className="h-3 w-3 text-amber-700 shrink-0" />
                          <span>
                            {thread.daysSinceLatest}d ago · Follow-up recommended
                          </span>
                        </span>
                      ) : null}

                      {/* Direct 1-Click Follow-Up Action */}
                      {thread.needsFollowUp && (
                        plan === "pro" ? (
                          <button
                            type="button"
                            onClick={() => router.push(`/draft?followUpId=${thread.latestEmail.id}`)}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-sm bg-seal text-paper font-medium text-[11px] hover:bg-seal/90 shadow-2xs transition-all cursor-pointer"
                            title="Draft a threaded follow-up letter to this recipient"
                          >
                            <RotateCcw className="h-3 w-3" />
                            <span>Write follow-up</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setShowUpgradeModal(true)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-sm border border-seal/30 bg-seal/10 text-seal font-medium text-[11px] hover:bg-seal/20 transition-colors cursor-pointer"
                            title="Follow-ups are a Pro feature"
                          >
                            <RotateCcw className="h-3 w-3" />
                            <span>Follow-up (Pro)</span>
                          </button>
                        )
                      )}

                      {hasMultiple && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-xs border border-seal/30 bg-seal/10 text-seal font-medium text-[11px]">
                          <MessageSquare className="h-3 w-3" />
                          <span>{threadLetterCount} letters in thread</span>
                        </span>
                      )}

                      {/* Gmail thread shortcut */}
                      {thread.initialEmail.gmail_thread_id && (
                        <button
                          type="button"
                          onClick={() => handleOpenGmailThread(thread.initialEmail.gmail_thread_id)}
                          className="inline-flex items-center gap-1 text-muted-ink hover:text-ink px-2.5 py-1 rounded-sm border border-hairline bg-white transition-colors cursor-pointer"
                          title="Open full conversation directly in Gmail"
                        >
                          <ExternalLink className="h-3 w-3 text-muted-ink" />
                          <span>View in Gmail</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Messages within this conversation thread */}
                  <div className="divide-y divide-hairline">
                    {thread.allEmails.map((item, idx) => {
                      const isSent = item.status === "sent";
                      const isSelected = selectedEmailId === item.id;
                      const isFollowUp = item.email_type === "followup";
                      const isCopied = copiedId === item.id;

                      const formattedDate = new Date(item.created_at).toLocaleDateString(
                        undefined,
                        {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        }
                      );

                      return (
                        <div
                          key={item.id}
                          className={`p-4 sm:p-5 transition-colors cursor-pointer ${
                            isSelected ? "bg-[#F7F5EE]" : "hover:bg-[#FAF9F5]"
                          }`}
                          onClick={() => setSelectedEmailId(isSelected ? null : item.id)}
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                            <div className="flex items-start sm:items-center gap-3 min-w-0">
                              {/* Thread Type Icon */}
                              <div className="mt-0.5 sm:mt-0 shrink-0">
                                {isFollowUp ? (
                                  <CornerDownRight className="h-4 w-4 text-seal" />
                                ) : isSent ? (
                                  <CheckCircle2 className="h-4 w-4 text-confirmed" />
                                ) : (
                                  <XCircle className="h-4 w-4 text-amber-700" />
                                )}
                              </div>

                              <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className="font-medium text-ink truncate text-sm">
                                    {item.final_subject}
                                  </span>

                                  {isFollowUp ? (
                                    <span className="rounded-xs border border-seal/30 bg-seal/10 text-seal px-1.5 py-0.5 text-[10px] font-medium">
                                      Follow-up #{idx}
                                    </span>
                                  ) : (
                                    <span className="rounded-xs border border-hairline bg-paper text-muted-ink px-1.5 py-0.5 text-[10px] font-medium">
                                      Initial Letter
                                    </span>
                                  )}
                                </div>

                                <p className="text-[11px] text-muted-ink mt-1 line-clamp-1 italic font-serif text-ink/75">
                                  &ldquo;{item.final_body.slice(0, 110)}...&rdquo;
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 text-muted-ink text-[11px] pt-1.5 sm:pt-0 border-t sm:border-t-0 border-hairline/60">
                              <span className="whitespace-nowrap">{formattedDate}</span>
                              <span
                                className={`px-2 py-0.5 rounded-xs border text-[10px] font-medium capitalize ${
                                  isSent
                                    ? "border-confirmed/30 text-confirmed bg-confirmed/10"
                                    : "border-amber-700/30 text-amber-800 bg-amber-700/10"
                                }`}
                              >
                                {item.status}
                              </span>
                              {isSelected ? (
                                <ChevronUp className="h-4 w-4 text-ink" />
                              ) : (
                                <ChevronDown className="h-4 w-4 text-muted-ink" />
                              )}
                            </div>
                          </div>

                          {/* Expanded Letter Preview Sheet */}
                          {isSelected && (
                            <div
                              className="mt-4 border-t border-hairline/80 pt-4 space-y-4 text-xs"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {/* Subject Line & Copy Action */}
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-[#FAF8F3] p-3 rounded-sm border border-hairline/80">
                                <div className="min-w-0">
                                  <span className="text-[11px] text-muted-ink block">Subject:</span>
                                  <span className="font-heading text-sm text-ink font-medium break-words">
                                    {item.final_subject}
                                  </span>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => handleCopyBody(item.id, item.final_body)}
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-sm border border-hairline bg-white text-xs text-ink hover:border-ink/40 transition-colors cursor-pointer shrink-0 self-start sm:self-auto shadow-2xs"
                                >
                                  {isCopied ? (
                                    <>
                                      <Check className="h-3.5 w-3.5 text-confirmed" />
                                      <span className="text-confirmed font-medium">Copied</span>
                                    </>
                                  ) : (
                                    <>
                                      <Copy className="h-3.5 w-3.5 text-muted-ink" />
                                      <span>Copy body</span>
                                    </>
                                  )}
                                </button>
                              </div>

                              {/* Formatted Letter Body */}
                              <div className="rounded-sm border border-hairline bg-white p-5 text-ink/90 whitespace-pre-wrap font-serif text-sm leading-relaxed break-words shadow-2xs">
                                {item.final_body}
                              </div>

                              {/* Error Notice (if any) */}
                              {item.error_message && (
                                <div className="flex items-start gap-2.5 text-amber-800 text-xs bg-amber-50 p-3 rounded-sm border border-amber-200">
                                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                                  <span className="break-words">{item.error_message}</span>
                                </div>
                              )}

                              {/* Action Footer */}
                              {isSent && (
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-hairline/70">
                                  <div className="flex items-center gap-3 text-[11px] text-muted-ink">
                                    <span>Sent {formatRelativeDays(item.created_at, currentTime)}</span>
                                    {item.gmail_thread_id && (
                                      <button
                                        type="button"
                                        onClick={() => handleOpenGmailThread(item.gmail_thread_id)}
                                        className="inline-flex items-center gap-1 hover:text-ink transition-colors cursor-pointer underline underline-offset-4"
                                      >
                                        <ExternalLink className="h-3 w-3" />
                                        <span>View thread in Gmail</span>
                                      </button>
                                    )}
                                  </div>

                                  <div className="flex flex-wrap items-center gap-2">
                                    <button
                                      type="button"
                                      onClick={() => handleToggleResponded(item.id, Boolean(item.is_responded))}
                                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-sm border text-xs transition-colors cursor-pointer ${
                                        item.is_responded
                                          ? "border-confirmed/30 bg-confirmed/10 text-confirmed hover:bg-confirmed/15"
                                          : "border-hairline bg-white text-muted-ink hover:text-ink hover:border-ink/40"
                                      }`}
                                      title="Toggle response status"
                                    >
                                      {item.is_responded ? (
                                        <>
                                          <Check className="h-3.5 w-3.5 text-confirmed" />
                                          <span>Responded (Click to unmark)</span>
                                        </>
                                      ) : (
                                        <>
                                          <MessageSquare className="h-3.5 w-3.5 text-muted-ink" />
                                          <span>Mark as responded</span>
                                        </>
                                      )}
                                    </button>

                                    {plan === "pro" ? (
                                      <button
                                        type="button"
                                        onClick={() => router.push(`/draft?followUpId=${item.id}`)}
                                        className="inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-sm text-xs font-medium bg-seal text-paper hover:bg-seal/90 shadow-2xs transition-all cursor-pointer"
                                      >
                                        <RotateCcw className="h-3.5 w-3.5" />
                                        <span>Write a follow-up</span>
                                      </button>
                                    ) : (
                                      <div className="flex items-center gap-2">
                                        <span className="text-[11px] text-muted-ink">
                                          Follow-ups are a Pro feature.
                                        </span>
                                        <button
                                          type="button"
                                          onClick={() => setShowUpgradeModal(true)}
                                          className="text-xs font-medium text-seal hover:underline cursor-pointer"
                                        >
                                          Upgrade →
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}

                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                </div>
              );
            })}
          </div>
        )}

        {/* Older Emails Retention Notice (Free tier) */}
        {!isLoading && hasOlderEmails && plan === "free" && (
          <div className="border border-dashed border-hairline bg-white/50 p-4 text-center rounded-sm text-xs text-muted-ink space-y-1">
            <div className="flex items-center justify-center gap-1.5 text-ink font-medium">
              <Lock className="h-3.5 w-3.5 text-seal" />
              <span>Older correspondence archived ({totalCount - emails.length} earlier sends)</span>
            </div>
            <p>
              Free accounts display correspondence from the last {FREE_RETENTION_DAYS} days.{" "}
              <Link href="/settings?tab=billing" className="text-seal underline underline-offset-4 hover:opacity-80">
                Upgrade to Pro
              </Link>{" "}
              to unlock and search your complete lifetime correspondence archive.
            </p>
          </div>
        )}

        {/* Pro Upgrade Dialog for Follow-Up Feature */}
        <Dialog open={showUpgradeModal} onOpenChange={setShowUpgradeModal}>
          <DialogContent className="border border-hairline bg-paper text-ink sm:max-w-md p-6">
            <DialogHeader className="space-y-2">
              <div className="inline-flex items-center gap-1.5 text-seal text-xs font-semibold">
                <PenLine className="h-3.5 w-3.5" />
                <span>Pro Feature</span>
              </div>
              <DialogTitle className="font-heading text-xl text-ink font-normal">
                Unlock One-Click Follow-Ups
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-ink leading-relaxed">
                Over 50% of interview responses come from the first follow-up. Pro accounts include automatic context-aware follow-up drafting, unlimited letters, and lifetime log archives.
              </DialogDescription>
            </DialogHeader>

            <div className="border-t border-b border-hairline py-4 my-2 space-y-2.5 text-xs text-ink">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-3.5 w-3.5 text-confirmed shrink-0" />
                <span>1-click polite, high-signal follow-up correspondence</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-3.5 w-3.5 text-confirmed shrink-0" />
                <span>Unlimited tailored letters per month</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-3.5 w-3.5 text-confirmed shrink-0" />
                <span>Full lifetime send log & duplicate contact protection</span>
              </div>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setShowUpgradeModal(false)}
                className="px-4 py-2 rounded-sm border border-hairline text-xs font-medium text-muted-ink hover:text-ink transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isUpgrading}
                onClick={handleUpgrade}
                className="inline-flex items-center justify-center gap-1.5 rounded-sm bg-seal px-5 py-2 text-xs font-medium text-paper hover:bg-seal/90 shadow-2xs transition-all cursor-pointer disabled:opacity-50"
              >
                {isUpgrading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                <span>Upgrade to Pro - {PRO_PLAN.priceFormatted} {PRO_PLAN.periodText}</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </DialogContent>
        </Dialog>

      </div>
    </main>
  );
}
