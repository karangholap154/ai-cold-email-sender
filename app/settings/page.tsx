"use client";

import { useEffect, useState, useRef } from "react";
import TextareaAutosize from "react-textarea-autosize";
import { toast } from "sonner";
import { FileText, Upload, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import type { Resume } from "@/lib/types/database";

export default function SettingsPage() {
  const [resume, setResume] = useState<Resume | null>(null);
  const [skillsSummary, setSkillsSummary] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load existing resume data
  useEffect(() => {
    async function loadResume() {
      try {
        const res = await fetch("/api/resume");
        if (!res.ok) throw new Error("Failed to load resume");
        const data = await res.json();
        if (data.resume) {
          setResume(data.resume);
          setSkillsSummary(data.resume.skills_summary || "");
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Error loading resume";
        toast.error(msg);
      } finally {
        setIsLoading(false);
      }
    }
    loadResume();
  }, []);

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

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!resume && !selectedFile) {
      toast.error("Please select a resume PDF to upload.");
      return;
    }

    setIsSaving(true);
    try {
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
        throw new Error(data.error || "Failed to save changes.");
      }

      setResume(data.resume);
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      toast.success("Resume and skills summary updated.");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error saving";
      toast.error(msg);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <main className="flex flex-1 flex-col px-4 py-6 sm:px-6 sm:py-10">
      <div className="mx-auto w-full max-w-2xl">
        <div className="mb-6 sm:mb-8">
          <h1 className="font-heading text-xl sm:text-2xl text-ink">Resume & Background</h1>
          <p className="mt-1 text-xs sm:text-sm text-muted-ink">
            Configure the resume PDF attached to outgoing letters and provide your key background summary for the AI.
          </p>
        </div>

        {isLoading ? (
          <div className="flex items-center gap-2 py-12 text-xs sm:text-sm text-muted-ink">
            <Loader2 className="h-4 w-4 animate-spin text-muted-ink" />
            <span>Loading resume settings...</span>
          </div>
        ) : (
          <form onSubmit={handleSave} className="space-y-6 sm:space-y-8">
            {/* 1. Resume File Section */}
            <section className="space-y-2.5 sm:space-y-3">
              <label className="block text-xs sm:text-sm font-medium text-ink">
                Resume PDF
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

            {/* 2. Skills & Background Summary Section */}
            <section className="space-y-2">
              <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1">
                <label htmlFor="skills-summary" className="block text-xs sm:text-sm font-medium text-ink">
                  Skills & Background Summary
                </label>
                <span className="text-[11px] text-muted-ink">Passed into AI prompt</span>
              </div>
              <p className="text-xs text-muted-ink leading-relaxed">
                Provide 3–6 sentences or bullet points highlighting your years of experience, core technologies, notable achievements, and primary domains. The AI uses this context to genuinely link your background to each job description.
              </p>
              <TextareaAutosize
                id="skills-summary"
                minRows={5}
                value={skillsSummary}
                onChange={(e) => setSkillsSummary(e.target.value)}
                placeholder="e.g. 5+ years building full-stack web applications with React, Next.js, Node.js, and PostgreSQL. Experienced in distributed systems, real-time architectures, and developer tooling. Previously reduced page load latency by 40% at..."
                className="w-full resize-none border border-hairline bg-paper px-3.5 py-3 text-sm text-ink placeholder:text-muted-ink/60 focus:border-seal focus:outline-none rounded-sm transition-colors leading-relaxed"
              />
            </section>

            {/* 3. Submit Action */}
            <div className="flex items-center justify-end border-t border-hairline pt-5 sm:pt-6">
              <button
                type="submit"
                disabled={isSaving}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-sm border border-hairline bg-ink px-5 py-2.5 sm:py-2 text-xs font-medium text-paper hover:bg-ink/90 disabled:opacity-50 transition-colors cursor-pointer min-h-[42px]"
              >
                {isSaving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                <span>{isSaving ? "Saving..." : "Save changes"}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </main>
  );
}
