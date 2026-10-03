"use client";

import TextareaAutosize from "react-textarea-autosize";
import {
  User,
  PenLine,
  Globe,
  Phone,
  Code2,
  Link2,
  AlertCircle,
  Copy,
  Save,
  Loader2,
} from "lucide-react";

export interface SignatureTabProps {
  fullName: string;
  setFullName: (val: string) => void;
  signOff: string;
  setSignOff: (val: string) => void;
  portfolioUrl: string;
  setPortfolioUrl: (val: string) => void;
  githubUrl: string;
  setGithubUrl: (val: string) => void;
  linkedinUrl: string;
  setLinkedinUrl: (val: string) => void;
  phone: string;
  setPhone: (val: string) => void;
  customSignature: string;
  setCustomSignature: (val: string) => void;
  activeLayout: "stack" | "inline" | "compact";
  applyPreset: (layout: "stack" | "inline" | "compact") => void;
  setIsCustomDirty: (val: boolean) => void;
  updateGeneratedSignature: (
    fn: string,
    so: string,
    po: string,
    gh: string,
    li: string,
    ph: string
  ) => void;
  migrationRequired: boolean;
  handleCopySql: () => void;
  migrationSql: string;
  isSaving: boolean;
}

export function SignatureTab({
  fullName,
  setFullName,
  signOff,
  setSignOff,
  portfolioUrl,
  setPortfolioUrl,
  githubUrl,
  setGithubUrl,
  linkedinUrl,
  setLinkedinUrl,
  phone,
  setPhone,
  customSignature,
  setCustomSignature,
  activeLayout,
  applyPreset,
  setIsCustomDirty,
  updateGeneratedSignature,
  migrationRequired,
  handleCopySql,
  migrationSql,
  isSaving,
}: SignatureTabProps) {
  return (
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
            To persist your signature fields in Supabase, run this query in your{" "}
            <strong>Supabase Dashboard → SQL Editor</strong>:
          </p>
          <div className="flex items-center justify-between gap-2 border border-hairline bg-paper p-2 rounded-xs overflow-x-auto font-mono text-[11px] text-ink">
            <span className="truncate">{migrationSql.replace(/\s+/g, " ")}</span>
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
            <label
              htmlFor="full-name"
              className="flex items-center gap-1.5 text-xs font-medium text-ink"
            >
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
                updateGeneratedSignature(
                  val,
                  signOff,
                  portfolioUrl,
                  githubUrl,
                  linkedinUrl,
                  phone
                );
              }}
              placeholder="e.g. Karan Gholap"
              className="w-full rounded-sm border border-hairline bg-paper px-3 py-2 text-xs text-ink placeholder:text-muted-ink/60 focus:border-seal focus:outline-none transition-colors"
            />
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="sign-off"
              className="flex items-center gap-1.5 text-xs font-medium text-ink"
            >
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
                updateGeneratedSignature(
                  fullName,
                  val,
                  portfolioUrl,
                  githubUrl,
                  linkedinUrl,
                  phone
                );
              }}
              placeholder="e.g. Best regards, / Best,"
              className="w-full rounded-sm border border-hairline bg-paper px-3 py-2 text-xs text-ink placeholder:text-muted-ink/60 focus:border-seal focus:outline-none transition-colors"
            />
          </div>
        </div>

        {/* Row 2: Portfolio / Website & Phone */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <div className="space-y-1.5">
            <label
              htmlFor="portfolio-url"
              className="flex items-center gap-1.5 text-xs font-medium text-ink"
            >
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
                updateGeneratedSignature(
                  fullName,
                  signOff,
                  val,
                  githubUrl,
                  linkedinUrl,
                  phone
                );
              }}
              placeholder="https://yourwebsite.com"
              className="w-full rounded-sm border border-hairline bg-paper px-3 py-2 text-xs text-ink placeholder:text-muted-ink/60 focus:border-seal focus:outline-none transition-colors font-mono"
            />
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="phone"
              className="flex items-center gap-1.5 text-xs font-medium text-ink"
            >
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
                updateGeneratedSignature(
                  fullName,
                  signOff,
                  portfolioUrl,
                  githubUrl,
                  linkedinUrl,
                  val
                );
              }}
              placeholder="+1 (555) 000-0000"
              className="w-full rounded-sm border border-hairline bg-paper px-3 py-2 text-xs text-ink placeholder:text-muted-ink/60 focus:border-seal focus:outline-none transition-colors font-mono"
            />
          </div>
        </div>

        {/* Row 3: GitHub & LinkedIn */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <div className="space-y-1.5">
            <label
              htmlFor="github-url"
              className="flex items-center gap-1.5 text-xs font-medium text-ink"
            >
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
                updateGeneratedSignature(
                  fullName,
                  signOff,
                  portfolioUrl,
                  val,
                  linkedinUrl,
                  phone
                );
              }}
              placeholder="https://github.com/yourhandle"
              className="w-full rounded-sm border border-hairline bg-paper px-3 py-2 text-xs text-ink placeholder:text-muted-ink/60 focus:border-seal focus:outline-none transition-colors font-mono"
            />
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="linkedin-url"
              className="flex items-center gap-1.5 text-xs font-medium text-ink"
            >
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
                updateGeneratedSignature(
                  fullName,
                  signOff,
                  portfolioUrl,
                  githubUrl,
                  val,
                  phone
                );
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
          {isSaving ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Save className="h-3.5 w-3.5" />
          )}
          <span>{isSaving ? "Saving..." : "Save profile & signature"}</span>
        </button>
      </div>
    </div>
  );
}
