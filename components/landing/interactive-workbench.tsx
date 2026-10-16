"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Building2,
  Briefcase,
  FileText,
  Lock,
  Send,
  Sparkles,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Check,
  ChevronRight,
  ExternalLink,
  MapPin,
  Clock,
  BadgeCheck,
} from "lucide-react";

interface SampleJob {
  id: string;
  role: string;
  company: string;
  location: string;
  recruiter: string;
  source: string;
  skills: string[];
  snippet: string;
  subject: string;
  body: string[];
}

const SAMPLE_JOBS: SampleJob[] = [
  {
    id: "linear-staff",
    role: "Staff Frontend Engineer",
    company: "Linear",
    location: "San Francisco / Remote",
    recruiter: "tuomas@linear.app",
    source: "Hacker News (Who is Hiring)",
    skills: ["Next.js", "WebGL & Canvas", "Design Systems", "Sub-50ms Latency"],
    snippet:
      "We're expanding our web client team to rebuild core keyboard interactions and canvas-rendered timeline views. Looking for a Staff engineer obsessed with zero-latency desktop feel and robust state management.",
    subject: "Linear Staff Frontend Engineer - background in high-performance design systems",
    body: [
      "Hi Tuomas,",
      "I saw Linear's post looking for a Staff Frontend Engineer to scale your canvas views and keyboard-driven workflows. Given your focus on sub-50ms interaction latency, I wanted to reach out directly.",
      "Over the past four years leading design system architecture, I rebuilt our core grid primitives and virtualized tree tables, reducing bundle size by 42% and keeping 60fps frame rates on 50,000+ simultaneous nodes.",
      "I've attached my résumé with breakdown metrics. If you're open to a brief 10-minute introductory conversation this week, I'd welcome the chance to share notes on how we eliminated similar rendering bottlenecks.",
    ],
  },
  {
    id: "stripe-backend",
    role: "Senior Distributed Systems Engineer",
    company: "Stripe",
    location: "Seattle / Remote",
    recruiter: "eng-leads@stripe.com",
    source: "Arbeitnow Verified",
    skills: ["Go", "Distributed Consensus", "PostgreSQL", "High Throughput"],
    snippet:
      "Help us build next-gen global ledger primitives handling $1T+ in annual volume. Strong experience in idempotent state machines, Raft consensus, and zero-downtime database migrations required.",
    subject: "Stripe Ledger Systems - experience with idempotent settlement engines",
    body: [
      "Hi Stripe Team,",
      "I noticed your opening for the Core Ledger team focusing on idempotent transaction processing at scale. Having spent the last three years designing high-throughput payment settlement pipelines, I wanted to introduce myself.",
      "At my previous role, I re-architected our transaction processor using Go and distributed write-ahead logs, eliminating split-brain reconciliation errors and safely processing 18,000 TPS during peak surges.",
      "My résumé is attached below. Would you be open to a 10-minute conversation this Thursday to discuss how my background aligns with your current ledger scaling roadmap?",
    ],
  },
  {
    id: "modal-infra",
    role: "Systems & Cloud Infrastructure Engineer",
    company: "Modal Labs",
    location: "New York / Remote",
    recruiter: "erik@modal.com",
    source: "Remotive Tech",
    skills: ["Rust", "Linux Containers", "eBPF", "Kubernetes Internals"],
    snippet:
      "We run serverless containers with cold starts under 800ms for AI workloads. Seeking low-level Linux systems engineers with deep experience in namespaces, cgroups v2, and container runtimes.",
    subject: "Modal Infrastructure Engineer - container sandboxing & low-latency boot",
    body: [
      "Hi Erik,",
      "I follow Modal's technical writeups closely-especially your work around fast-boot microVMs and custom cgroup schedulers. Seeing your open systems role, I wanted to reach out directly.",
      "In my current role, I built a custom container isolation layer in Rust using Linux namespaces and eBPF network telemetry, bringing average container cold-start latency down from 4.2s to 390ms for real-time inference.",
      "I have attached my résumé with the repository link and benchmarks. I'd appreciate 10 minutes to connect if you are currently interviewing candidates with low-level systems backgrounds.",
    ],
  },
];

export function InteractiveWorkbench() {
  const [selectedJobId, setSelectedJobId] = useState<string>("linear-staff");
  const [viewMode, setViewMode] = useState<"letter" | "analysis">("letter");

  const activeJob =
    SAMPLE_JOBS.find((j) => j.id === selectedJobId) || SAMPLE_JOBS[0];

  return (
    <div className="w-full space-y-6">
      {/* Workbench Header Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-hairline/80 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-confirmed animate-pulse" />
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-ink">
              Interactive Dispatch Desk
            </span>
          </div>
          <p className="text-xs text-muted-ink mt-0.5">
            Select an opportunity to test extraction, letter drafting, and deliverability verification.
          </p>
        </div>

        {/* View mode toggle */}
        <div className="flex items-center rounded-sm border border-hairline bg-paper p-1 text-xs shrink-0 self-start sm:self-auto shadow-2xs">
          <button
            type="button"
            onClick={() => setViewMode("letter")}
            className={`px-3 py-1.5 rounded-xs transition-all cursor-pointer font-medium ${
              viewMode === "letter"
                ? "bg-ink text-paper shadow-2xs"
                : "text-muted-ink hover:text-ink"
            }`}
          >
            Tailored Letter View
          </button>
          <button
            type="button"
            onClick={() => setViewMode("analysis")}
            className={`px-3 py-1.5 rounded-xs transition-all cursor-pointer font-medium ${
              viewMode === "analysis"
                ? "bg-ink text-paper shadow-2xs"
                : "text-muted-ink hover:text-ink"
            }`}
          >
            Extraction &amp; Match
          </button>
        </div>
      </div>

      {/* Main 2-Column Split Workbench */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column: Live Jobs Opportunity Picker (5 cols) */}
        <div className="lg:col-span-5 space-y-3">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-semibold text-ink uppercase tracking-wider">
              1. Pick an Opportunity
            </span>
            <Link
              href="/jobs"
              className="text-xs text-seal hover:underline inline-flex items-center gap-1 font-medium"
            >
              <span>Live feed (1,000+ jobs)</span>
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          <div className="space-y-2.5">
            {SAMPLE_JOBS.map((job) => {
              const isSelected = job.id === selectedJobId;
              return (
                <button
                  key={job.id}
                  type="button"
                  onClick={() => setSelectedJobId(job.id)}
                  className={`w-full text-left p-4 rounded-sm border transition-all cursor-pointer ${
                    isSelected
                      ? "border-seal bg-white shadow-sm ring-1 ring-seal/20"
                      : "border-hairline bg-white/70 hover:bg-white hover:border-ink/20"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-heading text-base font-medium text-ink">
                          {job.company}
                        </span>
                        <span className="inline-flex items-center gap-1 text-[10px] font-mono text-confirmed bg-confirmed/10 px-1.5 py-0.5 rounded-xs">
                          <BadgeCheck className="h-3 w-3" />
                          <span>Direct lead</span>
                        </span>
                      </div>
                      <div className="text-xs font-medium text-ink/90">
                        {job.role}
                      </div>
                    </div>
                    <span className="text-[10px] font-mono text-muted-ink bg-paper px-2 py-0.5 rounded-xs border border-hairline/60 shrink-0">
                      {job.source.split(" ")[0]}
                    </span>
                  </div>

                  <div className="mt-2.5 text-[11px] text-muted-ink line-clamp-2 leading-relaxed">
                    {job.snippet}
                  </div>

                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {job.skills.slice(0, 3).map((skill, sIdx) => (
                      <span
                        key={sIdx}
                        className="rounded-xs border border-hairline bg-[#FAF9F5] px-2 py-0.5 text-[10px] font-medium text-muted-ink"
                      >
                        {skill}
                      </span>
                    ))}
                    {job.skills.length > 3 && (
                      <span className="text-[10px] text-muted-ink/70 px-1 py-0.5">
                        +{job.skills.length - 3}
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Quick Direct Compose Box */}
          <div className="rounded-sm border border-dashed border-hairline bg-[#FAF9F5] p-3.5 text-center space-y-2">
            <span className="text-xs text-muted-ink block">
              Have a job post from LinkedIn or elsewhere?
            </span>
            <Link
              href="/draft"
              className="inline-flex items-center justify-center gap-1.5 w-full py-2 px-3 text-xs font-medium text-ink bg-white border border-hairline rounded-sm hover:border-ink/30 transition-colors shadow-2xs"
            >
              <span>Paste custom job description</span>
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </div>

        {/* Right Column: Dynamic Letter Desk Frame (7 cols) */}
        <div className="lg:col-span-7">
          <div className="rounded-sm border border-hairline bg-paper p-5 sm:p-7 shadow-[0_4px_24px_rgba(0,0,0,0.03)] space-y-5 relative">
            
            {/* Top Postage & Status Ribbon */}
            <div className="flex items-center justify-between border-b border-hairline/80 pb-3.5">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-ink uppercase tracking-wider">
                  2. Editorial Review &amp; Dispatch
                </span>
              </div>
              <div className="border border-dashed border-hairline bg-white/80 px-2 py-0.5 text-[10px] font-mono text-muted-ink uppercase tracking-widest hidden sm:inline-block">
                OFFICIAL RFC 2822 DISPATCH
              </div>
            </div>

            {viewMode === "letter" ? (
              <div className="space-y-4">
                {/* Recipient & PDF attachment strip */}
                <div className="space-y-2 text-xs bg-white/80 p-3.5 rounded-sm border border-hairline/80">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2 text-ink">
                      <span className="text-muted-ink">To:</span>
                      <span className="font-mono font-medium text-ink bg-paper px-2 py-0.5 rounded-xs border border-hairline">
                        {activeJob.recruiter}
                      </span>
                    </div>
                    <div className="inline-flex items-center gap-1 text-[11px] text-confirmed font-medium bg-confirmed/10 px-2.5 py-0.5 rounded-xs border border-confirmed/20">
                      <FileText className="h-3.5 w-3.5" />
                      <span>Resume_Karan_Gholap.pdf attached</span>
                    </div>
                  </div>

                  <div className="flex items-baseline gap-2 pt-1 border-t border-hairline/60">
                    <span className="text-muted-ink shrink-0">Subject:</span>
                    <span className="font-heading text-sm text-ink font-medium leading-snug">
                      {activeJob.subject}
                    </span>
                  </div>
                </div>

                {/* Letter Body (Simulated real stationery) */}
                <div className="p-4 sm:p-5 rounded-sm bg-white border border-hairline shadow-2xs space-y-3 font-serif text-sm leading-relaxed text-ink/95">
                  {activeJob.body.map((paragraph, pIdx) => (
                    <p key={pIdx}>{paragraph}</p>
                  ))}
                  <div className="pt-2 font-sans text-xs text-muted-ink">
                    <span>Best regards,</span>
                    <div className="text-sm font-medium text-ink mt-0.5">Karan Gholap</div>
                    <div className="text-[11px] text-muted-ink/80">Full-Stack Engineer • github.com/karangholap154</div>
                  </div>
                </div>

                {/* Letter Metric & Restraint Bar */}
                <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-muted-ink pt-1">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-ink font-medium">118 words</span>
                    <span>•</span>
                    <span className="text-confirmed flex items-center gap-1 font-medium">
                      <Check className="h-3.5 w-3.5" />
                      <span>0 generic fluff detected</span>
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-muted-ink">
                    <Lock className="h-3 w-3 text-seal" />
                    <span className="text-[11px]">Sent from your real @gmail.com</span>
                  </div>
                </div>

                {/* Action CTA */}
                <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                  <div className="text-[11px] text-muted-ink">
                    Free tier includes 5 tailored sends every month.
                  </div>
                  <Link
                    href="/login?mode=signup"
                    className="inline-flex items-center justify-center gap-2 rounded-sm bg-seal px-5 py-2.5 text-xs font-medium text-paper hover:bg-seal/90 shadow-2xs transition-all cursor-pointer"
                  >
                    <span>Start drafting with Vina</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            ) : (
              /* Extraction & Match view */
              <div className="space-y-4">
                <div className="rounded-sm border border-hairline bg-white p-4 space-y-3">
                  <span className="text-xs font-semibold text-ink uppercase tracking-wider block">
                    Synthesized Job Entity Data
                  </span>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="p-2.5 rounded-xs bg-[#FAF9F5] border border-hairline/60">
                      <span className="text-muted-ink block text-[10px] uppercase">Company</span>
                      <span className="font-heading font-medium text-sm text-ink">{activeJob.company}</span>
                    </div>
                    <div className="p-2.5 rounded-xs bg-[#FAF9F5] border border-hairline/60">
                      <span className="text-muted-ink block text-[10px] uppercase">Seniority Level</span>
                      <span className="font-medium text-ink">Staff / Senior Level</span>
                    </div>
                  </div>
                </div>

                <div className="rounded-sm border border-hairline bg-white p-4 space-y-3">
                  <span className="text-xs font-semibold text-ink uppercase tracking-wider block">
                    Extracted Priority Skills &amp; Keywords
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {activeJob.skills.map((skill, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xs border border-confirmed/30 bg-confirmed/10 text-xs font-medium text-ink"
                      >
                        <Check className="h-3 w-3 text-confirmed" />
                        <span>{skill}</span>
                      </span>
                    ))}
                  </div>
                  <p className="text-xs text-muted-ink leading-relaxed pt-1">
                    Vina highlights these requirements against your uploaded résumé summary, omitting unmatched buzzwords so every sentence remains truthful.
                  </p>
                </div>

                <div className="rounded-sm border border-hairline bg-white p-4 space-y-2">
                  <span className="text-xs font-semibold text-ink uppercase tracking-wider block">
                    Duplicate Contact Protection
                  </span>
                  <div className="flex items-center gap-2 text-xs text-confirmed">
                    <ShieldCheck className="h-4 w-4" />
                    <span>0 previous messages sent to {activeJob.recruiter}</span>
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>

      </div>

    </div>
  );
}
