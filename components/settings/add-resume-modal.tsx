"use client";

import { RefObject } from "react";
import { FileText, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

export interface AddResumeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  newLabel: string;
  setNewLabel: (val: string) => void;
  newFile: File | null;
  setNewFile: (file: File | null) => void;
  newFileInputRef: RefObject<HTMLInputElement | null>;
  newSkillsSummary: string;
  setNewSkillsSummary: (val: string) => void;
  newIsDefault: boolean;
  setNewIsDefault: (val: boolean) => void;
  isSubmitting: boolean;
  onSubmit: (e: React.FormEvent) => void;
}

export function AddResumeModal({
  open,
  onOpenChange,
  newLabel,
  setNewLabel,
  newFile,
  setNewFile,
  newFileInputRef,
  newSkillsSummary,
  setNewSkillsSummary,
  newIsDefault,
  setNewIsDefault,
  isSubmitting,
  onSubmit,
}: AddResumeModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
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

        <form onSubmit={onSubmit} className="space-y-4 pt-2">
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

          <div className="pt-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2.5 border-t border-hairline mt-3">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => onOpenChange(false)}
              className="px-4 py-2 rounded-sm border border-hairline text-xs font-medium text-muted-ink hover:text-ink transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !newLabel.trim() || !newFile}
              className="inline-flex items-center justify-center gap-1.5 rounded-sm bg-seal hover:bg-seal/90 px-4 py-2 text-xs font-medium text-paper shadow-xs transition-colors cursor-pointer disabled:opacity-50"
            >
              {isSubmitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              <span>Add Version</span>
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
