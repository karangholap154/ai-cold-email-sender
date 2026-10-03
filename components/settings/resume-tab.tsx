"use client";

import { RefObject } from "react";
import TextareaAutosize from "react-textarea-autosize";
import {
  FileText,
  Upload,
  AlertCircle,
  Plus,
  Star,
  Edit2,
  Trash2,
  Loader2,
} from "lucide-react";
import type { Resume, UserUsage } from "@/lib/types/database";

export interface ResumeTabProps {
  resumes: Resume[];
  usage: UserUsage | null;
  editingResumeId: string | null;
  setEditingResumeId: (id: string | null) => void;
  editingLabel: string;
  setEditingLabel: (val: string) => void;
  editingSkillsSummary: string;
  setEditingSkillsSummary: (val: string) => void;
  isUpdatingResume: boolean;
  handleSetDefaultResume: (id: string) => void;
  handleDeleteResume: (id: string) => void;
  handleStartEdit: (r: Resume) => void;
  handleSaveEdit: (id: string) => void;
  handleTriggerReplace: (id: string) => void;
  handleReplaceFileSelected: (e: React.ChangeEvent<HTMLInputElement>) => void;
  replaceFileInputRef: RefObject<HTMLInputElement | null>;
  fileInputRef: RefObject<HTMLInputElement | null>;
  handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  setShowAddResumeModal: (val: boolean) => void;
  setActiveTab: (tab: "profile" | "resume" | "gmail" | "billing") => void;
}

export function ResumeTab({
  resumes,
  usage,
  editingResumeId,
  setEditingResumeId,
  editingLabel,
  setEditingLabel,
  editingSkillsSummary,
  setEditingSkillsSummary,
  isUpdatingResume,
  handleSetDefaultResume,
  handleDeleteResume,
  handleStartEdit,
  handleSaveEdit,
  handleTriggerReplace,
  handleReplaceFileSelected,
  replaceFileInputRef,
  fileInputRef,
  handleFileChange,
  setShowAddResumeModal,
  setActiveTab,
}: ResumeTabProps) {
  return (
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
  );
}
