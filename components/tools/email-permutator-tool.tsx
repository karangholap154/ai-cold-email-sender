"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Users,
  Copy,
  Check,
  Search,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Loader2,
  RefreshCw,
  ExternalLink,
} from "lucide-react";
import {
  generateEmailPermutations,
  cleanDomain,
  type EmailPermutation,
} from "@/lib/tools/email-permutator";

export function EmailPermutatorTool() {
  const [firstName, setFirstName] = useState("Alex");
  const [lastName, setLastName] = useState("Chen");
  const [middleName, setMiddleName] = useState("");
  const [companyDomain, setCompanyDomain] = useState("stripe.com");
  const [copiedEmail, setCopiedEmail] = useState<string | null>(null);
  const [copiedAll, setCopiedAll] = useState(false);

  // MX record validation state for the target domain
  const [isCheckingDomain, setIsCheckingDomain] = useState(false);
  const [domainStatus, setDomainStatus] = useState<{
    tested: boolean;
    isValid: boolean;
    mxHost?: string;
    error?: string;
  } | null>(null);

  const cleanedDomain = cleanDomain(companyDomain);
  const permutations: EmailPermutation[] = generateEmailPermutations(
    firstName,
    lastName,
    cleanedDomain,
    middleName
  );

  const handleCopySingle = (email: string) => {
    navigator.clipboard.writeText(email);
    setCopiedEmail(email);
    setTimeout(() => setCopiedEmail(null), 2000);
  };

  const handleCopyAll = (format: "comma" | "newline") => {
    const text = permutations
      .map((p) => p.email)
      .join(format === "comma" ? ", " : "\n");
    navigator.clipboard.writeText(text);
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2000);
  };

  const verifyDomain = async () => {
    if (!cleanedDomain) return;
    setIsCheckingDomain(true);
    try {
      const res = await fetch("/api/tools/check-mx", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: `test@${cleanedDomain}` }),
      });
      const data = await res.json();
      setDomainStatus({
        tested: true,
        isValid: Boolean(data.isValid),
        mxHost: data.mxHost,
        error: data.error,
      });
    } catch {
      setDomainStatus({
        tested: true,
        isValid: false,
        error: "Unable to query DNS MX servers.",
      });
    } finally {
      setIsCheckingDomain(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Form Input Grid */}
      <div className="rounded-lg border border-hairline bg-paper p-5 sm:p-6 shadow-2xs">
        <h2 className="font-heading text-sm font-semibold text-ink flex items-center gap-2 mb-4">
          <Users className="h-4 w-4 text-seal" />
          <span>Contact &amp; Target Company Details</span>
        </h2>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label htmlFor="perm-first-name" className="block text-xs font-medium text-muted-ink mb-1">
              First Name <span className="text-seal">*</span>
            </label>
            <input
              id="perm-first-name"
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="e.g. Alex"
              className="w-full rounded-md border border-hairline bg-surface px-3 py-2 text-xs text-ink focus:border-seal focus:outline-none focus:ring-1 focus:ring-seal"
            />
          </div>

          <div>
            <label htmlFor="perm-last-name" className="block text-xs font-medium text-muted-ink mb-1">
              Last Name <span className="text-seal">*</span>
            </label>
            <input
              id="perm-last-name"
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="e.g. Chen"
              className="w-full rounded-md border border-hairline bg-surface px-3 py-2 text-xs text-ink focus:border-seal focus:outline-none focus:ring-1 focus:ring-seal"
            />
          </div>

          <div>
            <label htmlFor="perm-middle-name" className="block text-xs font-medium text-muted-ink mb-1">
              Middle Name <span className="text-muted-ink/60">(Optional)</span>
            </label>
            <input
              id="perm-middle-name"
              type="text"
              value={middleName}
              onChange={(e) => setMiddleName(e.target.value)}
              placeholder="e.g. Marie"
              className="w-full rounded-md border border-hairline bg-surface px-3 py-2 text-xs text-ink focus:border-seal focus:outline-none focus:ring-1 focus:ring-seal"
            />
          </div>

          <div>
            <label htmlFor="perm-domain" className="block text-xs font-medium text-muted-ink mb-1">
              Company Domain <span className="text-seal">*</span>
            </label>
            <div className="flex gap-1.5">
              <input
                id="perm-domain"
                type="text"
                value={companyDomain}
                onChange={(e) => {
                  setCompanyDomain(e.target.value);
                  setDomainStatus(null);
                }}
                placeholder="e.g. stripe.com"
                className="w-full rounded-md border border-hairline bg-surface px-3 py-2 text-xs text-ink focus:border-seal focus:outline-none focus:ring-1 focus:ring-seal"
              />
              <button
                type="button"
                onClick={verifyDomain}
                disabled={isCheckingDomain || !cleanedDomain}
                title="Verify Domain MX Records"
                aria-label="Verify Domain MX Records"
                className="inline-flex items-center justify-center rounded-md border border-hairline bg-surface px-2.5 py-2 text-xs text-ink hover:bg-hairline/20 disabled:opacity-50 transition-colors shrink-0"
              >
                {isCheckingDomain ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <RefreshCw className="h-3.5 w-3.5" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Target Domain DNS Status Badge */}
        {domainStatus?.tested && (
          <div
            className={`mt-4 rounded-md border p-3 text-xs flex items-center justify-between ${
              domainStatus.isValid
                ? "border-emerald-200 bg-emerald-50 text-emerald-900"
                : "border-red-200 bg-red-50 text-red-900"
            }`}
          >
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 shrink-0 text-emerald-600" />
              <span>
                Domain <strong>@{cleanedDomain}</strong> is active and accepts mail (MX:{" "}
                <code className="rounded bg-emerald-100 px-1 py-0.5 font-mono text-[10px]">
                  {domainStatus.mxHost || "Configured"}
                </code>
                )
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Results Strip */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="lg:col-span-8 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="font-heading text-sm font-semibold text-ink">
              Generated Email Patterns ({permutations.length})
            </h3>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleCopyAll("comma")}
                className="inline-flex items-center gap-1.5 rounded-md border border-hairline bg-paper px-2.5 py-1 text-xs font-medium text-ink hover:bg-surface transition-colors shadow-2xs"
              >
                {copiedAll ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                <span>Copy for Gmail (BCC)</span>
              </button>
              <button
                type="button"
                onClick={() => handleCopyAll("newline")}
                className="inline-flex items-center gap-1.5 rounded-md border border-hairline bg-paper px-2.5 py-1 text-xs font-medium text-ink hover:bg-surface transition-colors shadow-2xs"
              >
                <Copy className="h-3.5 w-3.5" />
                <span>Copy List</span>
              </button>
            </div>
          </div>

          {permutations.length === 0 ? (
            <div className="rounded-lg border border-dashed border-hairline bg-paper p-8 text-center text-xs text-muted-ink">
              Enter a name and company domain to generate standard corporate email combinations.
            </div>
          ) : (
            <div className="divide-y divide-hairline rounded-lg border border-hairline bg-paper shadow-2xs overflow-hidden">
              {permutations.map((p, idx) => {
                const isCopied = copiedEmail === p.email;
                return (
                  <div
                    key={idx}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 hover:bg-surface/50 transition-colors gap-2"
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <code className="font-mono text-xs font-semibold text-ink">
                          {p.email}
                        </code>
                        <span
                          className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${
                            p.popularity === "Very High"
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : p.popularity === "High"
                              ? "bg-blue-50 text-blue-700 border border-blue-200"
                              : "bg-surface text-muted-ink border border-hairline"
                          }`}
                        >
                          {p.popularity}
                        </span>
                      </div>
                      <p className="text-[11px] text-muted-ink">{p.label}</p>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleCopySingle(p.email)}
                      className="inline-flex items-center justify-center gap-1 rounded border border-hairline bg-paper px-2.5 py-1 text-xs text-ink hover:bg-surface transition-colors self-start sm:self-auto"
                    >
                      {isCopied ? (
                        <>
                          <Check className="h-3.5 w-3.5 text-emerald-600" />
                          <span className="text-emerald-700 font-medium">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-3.5 w-3.5 text-muted-ink" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Sidebar Pro-Tip & Conversion */}
        <div className="lg:col-span-4 space-y-4">
          <div className="rounded-lg border border-hairline bg-paper p-5 shadow-2xs space-y-3">
            <h4 className="font-heading text-xs font-semibold uppercase tracking-wider text-ink">
              How to Find Which Pattern Works
            </h4>
            <ol className="space-y-2.5 text-xs text-muted-ink list-decimal pl-4 leading-relaxed">
              <li>
                <strong>Paste into Google:</strong> Wrap the email in quotes (e.g. <code className="font-mono text-[11px]">&quot;alex.chen@{cleanedDomain || "company.com"}&quot;</code>). If it appears in press releases or GitHub, it&apos;s live.
              </li>
              <li>
                <strong>Gmail Hover Inspection:</strong> Paste the top 3 combinations into the &quot;To&quot; field in Gmail. Hover over the address; if a Google profile photo appears, you found it.
              </li>
              <li>
                <strong>Check Company Pattern on Hunter/Apollo:</strong> Most tech companies standardize on either <code className="font-mono text-[11px]">first.last@</code> or <code className="font-mono text-[11px]">first@</code>.
              </li>
            </ol>
          </div>

          <div className="rounded-lg border border-seal/30 bg-paper p-5 shadow-xs relative overflow-hidden">
            <div className="flex items-center gap-2 text-xs font-semibold text-seal uppercase tracking-wider mb-1">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Personal 1-to-1 Sending</span>
            </div>
            <h4 className="font-heading text-base font-semibold text-ink mb-1.5">
              Ready to write to this person?
            </h4>
            <p className="text-xs text-muted-ink leading-relaxed mb-4">
              Don&apos;t send a generic template. Vina parses the job post, connects with your resume, and writes a personal, tailored letter that hiring managers actually read.
            </p>
            <Link
              href="/signup"
              className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-seal px-4 py-2.5 text-xs font-semibold text-white hover:bg-seal/90 transition-colors shadow-2xs"
            >
              <span>Draft a Letter with Vina</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
