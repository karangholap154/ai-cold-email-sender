"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Send, Loader2, CheckCircle2, MessageSquare } from "lucide-react";

const CATEGORIES = [
  "General Support",
  "Technical Support",
  "Billing & Refunds",
  "Privacy & Data",
  "Feature Feedback",
] as const;

export function ContactForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [category, setCategory] = useState<string>("General Support");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error("Please enter your name.");
      return;
    }

    if (!email.trim() || !email.includes("@")) {
      toast.error("Please enter a valid email address.");
      return;
    }

    if (!message.trim() || message.trim().length < 10) {
      toast.error("Please enter a message of at least 10 characters.");
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          category,
          message: message.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to send message.");
      }

      setIsSubmitted(true);
      toast.success("Message sent! We'll reply to your email within 24–48 hours.");
    } catch (err: unknown) {
      const errMessage =
        err instanceof Error ? err.message : "Something went wrong. Please try again.";
      toast.error(errMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setName("");
    setEmail("");
    setCategory("General Support");
    setMessage("");
    setIsSubmitted(false);
  };

  if (isSubmitted) {
    return (
      <div className="border border-confirmed/30 bg-[#FAF9F5] p-6 sm:p-8 rounded-sm space-y-4 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-confirmed/10 text-confirmed">
          <CheckCircle2 className="h-6 w-6" />
        </div>
        <div className="space-y-1">
          <h3 className="text-base sm:text-lg font-heading text-ink">
            Message Sent Successfully
          </h3>
          <p className="text-xs sm:text-sm text-muted-ink max-w-md mx-auto leading-relaxed">
            Thank you for reaching out, <strong>{name}</strong>. We have delivered your inquiry to{" "}
            <span className="font-mono text-ink">support@meetvina.app</span> and will reply directly to{" "}
            <span className="font-mono text-ink">{email}</span> within 24–48 hours.
          </p>
        </div>
        <div className="pt-2">
          <button
            type="button"
            onClick={handleReset}
            className="inline-flex items-center justify-center rounded-sm border border-hairline bg-paper px-4 py-2 text-xs font-medium text-ink hover:bg-[#EDEAE2] transition-colors"
          >
            Send another message
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="border border-seal/30 bg-[#FAF9F5] p-6 sm:p-8 rounded-sm space-y-6">
      <div className="flex items-center justify-between border-b border-hairline pb-4">
        <div className="flex items-center gap-2.5 text-ink font-medium text-sm sm:text-base">
          <MessageSquare className="h-4 w-4 text-seal shrink-0" />
          <span>Send Us a Message</span>
        </div>
        <span className="text-[11px] text-muted-ink">
          Replies sent to your email
        </span>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Name Field */}
          <div className="space-y-1.5">
            <label htmlFor="contact-name" className="block text-xs font-medium text-ink">
              Your Name <span className="text-seal">*</span>
            </label>
            <input
              id="contact-name"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Alex Smith"
              disabled={isSubmitting}
              className="w-full rounded-sm border border-hairline bg-paper px-3 py-2 text-xs sm:text-sm text-ink placeholder:text-muted-ink/60 focus:border-seal focus:outline-none transition-colors"
            />
          </div>

          {/* Email Field */}
          <div className="space-y-1.5">
            <label htmlFor="contact-email" className="block text-xs font-medium text-ink">
              Your Email Address <span className="text-seal">*</span>
            </label>
            <input
              id="contact-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="alex@example.com"
              disabled={isSubmitting}
              className="w-full rounded-sm border border-hairline bg-paper px-3 py-2 text-xs sm:text-sm text-ink placeholder:text-muted-ink/60 focus:border-seal focus:outline-none transition-colors"
            />
          </div>
        </div>

        {/* Category Field */}
        <div className="space-y-1.5">
          <label htmlFor="contact-category" className="block text-xs font-medium text-ink">
            Inquiry Topic
          </label>
          <select
            id="contact-category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            disabled={isSubmitting}
            className="w-full rounded-sm border border-hairline bg-paper px-3 py-2 text-xs sm:text-sm text-ink focus:border-seal focus:outline-none transition-colors"
          >
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        {/* Message Field */}
        <div className="space-y-1.5">
          <label htmlFor="contact-message" className="block text-xs font-medium text-ink">
            Message <span className="text-seal">*</span>
          </label>
          <textarea
            id="contact-message"
            required
            rows={5}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Tell us what you need help with, share feedback, or describe any issue you encountered..."
            disabled={isSubmitting}
            className="w-full rounded-sm border border-hairline bg-paper px-3 py-2 text-xs sm:text-sm text-ink placeholder:text-muted-ink/60 focus:border-seal focus:outline-none transition-colors resize-y leading-relaxed"
          />
          <p className="text-[10px] sm:text-[11px] text-muted-ink">
            Min 10 characters. Please do not share passwords or private Google credentials.
          </p>
        </div>

        {/* Action row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-hairline">
          <div className="text-[11px] text-muted-ink">
            Delivered directly to <span className="font-mono text-ink">support@meetvina.app</span>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex items-center justify-center gap-2 rounded-sm bg-seal hover:bg-seal/90 text-white px-5 py-2.5 text-xs sm:text-sm font-medium tracking-wide transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-xs"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span>Sending...</span>
              </>
            ) : (
              <>
                <Send className="h-3.5 w-3.5" />
                <span>Send Message</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
