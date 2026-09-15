"use client";

import { useEffect, useState, useMemo } from "react";
import {
  Search,
  CheckCircle2,
  XCircle,
  Loader2,
  Calendar,
  Building2,
  Mail,
  FileText,
  AlertCircle,
} from "lucide-react";
import type { SentEmail } from "@/lib/types/database";

export default function LogPage() {
  const [emails, setEmails] = useState<SentEmail[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedEmail, setSelectedEmail] = useState<SentEmail | null>(null);

  useEffect(() => {
    async function loadEmails() {
      try {
        const res = await fetch("/api/emails");
        if (res.ok) {
          const data = await res.json();
          setEmails(data.emails || []);
        }
      } catch (err) {
        console.error("Error loading email logs:", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadEmails();
  }, []);

  const filteredEmails = useMemo(() => {
    if (!searchQuery.trim()) return emails;
    const query = searchQuery.toLowerCase().trim();
    return emails.filter(
      (item) =>
        item.hr_email.toLowerCase().includes(query) ||
        (item.company_name && item.company_name.toLowerCase().includes(query)) ||
        (item.role_title && item.role_title.toLowerCase().includes(query)) ||
        item.final_subject.toLowerCase().includes(query)
    );
  }, [emails, searchQuery]);

  return (
    <main className="flex flex-1 flex-col px-6 py-10">
      <div className="mx-auto w-full max-w-4xl space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-4">
          <div>
            <h1 className="font-heading text-2xl text-ink">Send log</h1>
            <p className="mt-1 text-sm text-muted-ink">
              All correspondence attempts, recorded with timestamps and delivery status.
            </p>
          </div>

          {/* Search Bar */}
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-ink" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search company or email..."
              className="w-full rounded-sm border border-hairline bg-paper py-2 pl-9 pr-3 text-xs text-ink placeholder:text-muted-ink/60 focus:border-seal focus:outline-none transition-colors"
            />
          </div>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="flex items-center gap-2 py-16 text-sm text-muted-ink justify-center">
            <Loader2 className="h-4 w-4 animate-spin text-muted-ink" />
            <span>Loading correspondence log...</span>
          </div>
        ) : filteredEmails.length === 0 ? (
          <div className="border border-hairline bg-paper p-12 text-center rounded-sm">
            <FileText className="mx-auto h-6 w-6 text-muted-ink/60 mb-3" />
            <p className="text-sm font-medium text-ink">
              {searchQuery ? "No matches found" : "No correspondence sent yet"}
            </p>
            <p className="text-xs text-muted-ink mt-1">
              {searchQuery
                ? "Try searching for a different company or email address."
                : "Your sent letters and delivery outcomes will be recorded here."}
            </p>
          </div>
        ) : (
          <div className="border border-hairline bg-paper rounded-sm overflow-hidden divide-y divide-hairline">
            {filteredEmails.map((item) => {
              const isSent = item.status === "sent";
              const isSelected = selectedEmail?.id === item.id;
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
                  className={`p-4 transition-colors cursor-pointer ${
                    isSelected ? "bg-[#EDEAE2]" : "hover:bg-[#F2EFE7]"
                  }`}
                  onClick={() => setSelectedEmail(isSelected ? null : item)}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-3 min-w-0">
                      {isSent ? (
                        <CheckCircle2 className="h-4 w-4 shrink-0 text-confirmed" />
                      ) : (
                        <XCircle className="h-4 w-4 shrink-0 text-amber-700" />
                      )}
                      <div className="truncate">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-ink truncate">
                            {item.company_name || "Unknown Company"}
                          </span>
                          {item.role_title && (
                            <span className="text-muted-ink text-[11px] truncate">
                              • {item.role_title}
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-muted-ink font-mono mt-0.5 truncate">
                          {item.hr_email}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 shrink-0 text-muted-ink text-[11px]">
                      <span>{formattedDate}</span>
                      <span
                        className={`capitalize px-2 py-0.5 rounded-sm border ${
                          isSent
                            ? "border-confirmed/30 text-confirmed bg-confirmed/5"
                            : "border-amber-700/30 text-amber-800 bg-amber-700/5"
                        }`}
                      >
                        {item.status}
                      </span>
                    </div>
                  </div>

                  {/* Expanded detail view */}
                  {isSelected && (
                    <div className="mt-4 border-t border-hairline pt-4 space-y-3 text-xs">
                      <div>
                        <span className="font-medium text-ink">Subject: </span>
                        <span className="text-ink">{item.final_subject}</span>
                      </div>

                      <div className="rounded-sm border border-hairline bg-[#FAF9F5] p-3 text-ink/90 whitespace-pre-wrap font-serif text-[13px] leading-relaxed">
                        {item.final_body}
                      </div>

                      {item.error_message && (
                        <div className="flex items-start gap-2 text-amber-800 text-xs bg-amber-50 p-2.5 rounded-sm border border-amber-200">
                          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                          <span>{item.error_message}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
