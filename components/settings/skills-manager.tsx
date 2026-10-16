"use client";

import { useState, useEffect } from "react";
import { Sparkles, X, Plus, Save, Loader2, Check } from "lucide-react";
import { toast } from "sonner";

interface SkillsManagerProps {
  initialSkills?: string[];
  onSave?: (skills: string[]) => Promise<void>;
  isSaving?: boolean;
}

const COMMON_SUGGESTIONS = [
  "React",
  "Next.js",
  "TypeScript",
  "JavaScript",
  "Bootstrap",
  "Tailwind CSS",
  "Node.js",
  "Python",
  "PostgreSQL",
  "Docker",
  "AWS",
  "Figma",
  "REST APIs",
  "GraphQL",
  "Git",
];

export function SkillsManager({
  initialSkills = [],
  onSave,
  isSaving = false,
}: SkillsManagerProps) {
  const [skills, setSkills] = useState<string[]>(initialSkills);
  const [prevInitialSkills, setPrevInitialSkills] = useState(initialSkills);
  const [inputValue, setInputValue] = useState("");
  const [hasChanges, setHasChanges] = useState(false);
  const [localSaving, setLocalSaving] = useState(false);

  if (initialSkills !== prevInitialSkills) {
    setPrevInitialSkills(initialSkills);
    setSkills(initialSkills);
    setHasChanges(false);
  }

  const addSkill = (newSkill: string) => {
    const trimmed = newSkill.trim().replace(/^[,./;]+|[,./;]+$/g, "");
    if (!trimmed) return;

    // Check case-insensitive duplicate
    const exists = skills.some((s) => s.toLowerCase() === trimmed.toLowerCase());
    if (exists) {
      toast.info(`"${trimmed}" is already in your skills list.`);
      setInputValue("");
      return;
    }

    const updated = [...skills, trimmed];
    setSkills(updated);
    setInputValue("");
    setHasChanges(true);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addSkill(inputValue);
    }
  };

  const removeSkill = (indexToRemove: number) => {
    const updated = skills.filter((_, idx) => idx !== indexToRemove);
    setSkills(updated);
    setHasChanges(true);
  };

  const handleSave = async () => {
    setLocalSaving(true);
    try {
      if (onSave) {
        await onSave(skills);
      } else {
        // Direct save to /api/profile
        const res = await fetch("/api/profile", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ skills }),
        });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || "Failed to save skills");
        }
        toast.success("Skills updated successfully!");
      }
      setHasChanges(false);
    } catch (err: unknown) {
      console.error(err);
      const message = err instanceof Error ? err.message : "Could not save skills.";
      toast.error(message);
    } finally {
      setLocalSaving(false);
    }
  };

  const unselectedSuggestions = COMMON_SUGGESTIONS.filter(
    (s) => !skills.some((userSkill) => userSkill.toLowerCase() === s.toLowerCase())
  );

  return (
    <div className="rounded-sm border border-hairline bg-paper p-5 sm:p-6 space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-heading text-base font-medium text-ink">
              Key Skills & Tech Stack
            </h3>
            <span className="rounded-full bg-[#B8823A]/10 text-[#8E632A] px-2 py-0.5 text-[10px] font-semibold border border-[#B8823A]/20">
              {skills.length} {skills.length === 1 ? "skill" : "skills"}
            </span>
          </div>
          <p className="mt-1 text-xs text-muted-ink leading-relaxed">
            Manage the skills you want to highlight. These are dynamically matched against all job postings to calculate your alignment score and power cold emails.
          </p>
        </div>

        <button
          type="button"
          onClick={handleSave}
          disabled={!hasChanges || isSaving || localSaving}
          className="inline-flex items-center justify-center gap-1.5 rounded-sm bg-seal hover:bg-seal/90 text-paper px-4 py-2 text-xs font-medium transition-colors shadow-xs shrink-0 self-start sm:self-auto cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {isSaving || localSaving ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Save className="h-3.5 w-3.5" />
          )}
          <span>{hasChanges ? "Save Skills" : "Saved"}</span>
        </button>
      </div>

      {/* Input Field for adding skills */}
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type any skill (e.g. Bootstrap, Next.js, Figma, Solidity) and press Enter..."
          className="flex-1 rounded-sm border border-hairline bg-white/80 px-3 py-2 text-xs text-ink placeholder:text-muted-ink/60 focus:border-ink/40 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-ink/20 shadow-2xs transition-all"
        />
        <button
          type="button"
          onClick={() => addSkill(inputValue)}
          className="inline-flex items-center gap-1 rounded-sm border border-hairline bg-white px-3.5 py-2 text-xs font-medium text-ink hover:bg-[#FAF9F5] hover:border-ink/20 transition-all cursor-pointer shadow-2xs shrink-0"
        >
          <Plus className="h-3.5 w-3.5 text-muted-ink" />
          <span>Add</span>
        </button>
      </div>

      {/* Current Skills Tags */}
      <div>
        <label className="block text-[11px] font-medium text-muted-ink uppercase tracking-wider mb-2">
          Your Active Skills ({skills.length})
        </label>
        {skills.length === 0 ? (
          <p className="text-xs text-muted-ink italic bg-[#FAF9F5] p-3 rounded-sm border border-dashed border-hairline">
            No skills added yet. Type your skills above or click suggestions below.
          </p>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {skills.map((skill, index) => (
              <span
                key={`${skill}-${index}`}
                className="group inline-flex items-center gap-1.5 rounded-sm border border-seal/30 bg-seal/10 px-2.5 py-1 text-xs font-medium text-[#8E632A] transition-all hover:border-seal/60"
              >
                <span>{skill}</span>
                <button
                  type="button"
                  onClick={() => removeSkill(index)}
                  className="rounded-xs text-muted-ink hover:text-red-700 hover:bg-black/5 p-0.5 transition-colors cursor-pointer"
                  title={`Remove ${skill}`}
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Suggested Skills Pill Row */}
      {unselectedSuggestions.length > 0 && (
        <div className="pt-2 border-t border-hairline/60">
          <label className="block text-[11px] font-medium text-muted-ink mb-1.5">
            Quick Suggestions:
          </label>
          <div className="flex flex-wrap gap-1.5">
            {unselectedSuggestions.slice(0, 10).map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                onClick={() => addSkill(suggestion)}
                className="inline-flex items-center gap-1 rounded-sm border border-hairline/80 bg-white/60 hover:bg-white hover:border-ink/20 px-2 py-0.5 text-[11px] text-muted-ink hover:text-ink transition-all cursor-pointer"
              >
                <Plus className="h-2.5 w-2.5" />
                <span>{suggestion}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
