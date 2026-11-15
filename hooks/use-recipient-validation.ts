"use client";

import { useState, useEffect, useRef } from "react";
import type { RecipientValidationResult } from "@/lib/email-validator";
export type { RecipientValidationResult };

export interface UseRecipientValidationOptions {
  skipDuplicateCheck?: boolean;
  initialDuplicate?: boolean;
  onEmailChange?: (email: string) => void;
  debounceMs?: number;
}

export interface UseRecipientValidationReturn {
  recipientValidation: RecipientValidationResult | null;
  isValidatingEmail: boolean;
  isCheckingDuplicate: boolean;
  isDuplicate: boolean;
  duplicateEmailMatched: string;
  setRecipientValidation: React.Dispatch<
    React.SetStateAction<RecipientValidationResult | null>
  >;
  setIsDuplicate: React.Dispatch<React.SetStateAction<boolean>>;
  reset: () => void;
}

/**
 * Custom hook to handle debounced syntax, domain typo, and DNS MX record validation
 * along with past-outreach duplicate checks for HR email recipients.
 */
export function useRecipientValidation(
  email: string,
  options: UseRecipientValidationOptions = {}
): UseRecipientValidationReturn {
  const {
    skipDuplicateCheck = false,
    initialDuplicate = false,
    onEmailChange,
    debounceMs = 400,
  } = options;

  const [recipientValidation, setRecipientValidation] =
    useState<RecipientValidationResult | null>(null);
  const [isValidatingEmail, setIsValidatingEmail] = useState(false);
  const [isCheckingDuplicate, setIsCheckingDuplicate] = useState(false);
  const [isDuplicate, setIsDuplicate] = useState(initialDuplicate);
  const [duplicateEmailMatched, setDuplicateEmailMatched] = useState(
    initialDuplicate ? email : ""
  );

  const onEmailChangeRef = useRef(onEmailChange);
  useEffect(() => {
    onEmailChangeRef.current = onEmailChange;
  }, [onEmailChange]);

  useEffect(() => {
    const trimmed = (email || "").trim();
    if (onEmailChangeRef.current) {
      onEmailChangeRef.current(trimmed);
    }

    if (!trimmed || !trimmed.includes("@") || trimmed.length < 5) {
      const timer = setTimeout(() => {
        setIsDuplicate(false);
        setDuplicateEmailMatched("");
        setRecipientValidation(null);
        setIsValidatingEmail(false);
        setIsCheckingDuplicate(false);
      }, 0);
      return () => clearTimeout(timer);
    }

    const timer = setTimeout(async () => {
      setIsValidatingEmail(true);
      if (!skipDuplicateCheck) {
        setIsCheckingDuplicate(true);
      }

      try {
        const promises: [Promise<Response>, Promise<Response> | null] = [
          fetch("/api/validate-recipient", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: trimmed }),
          }),
          !skipDuplicateCheck
            ? fetch(`/api/emails?email=${encodeURIComponent(trimmed)}`)
            : null,
        ];

        const [valRes, emailRes] = await Promise.all([
          promises[0],
          promises[1] ? promises[1] : Promise.resolve(null),
        ]);

        if (valRes && valRes.ok) {
          const vData = await valRes.json();
          setRecipientValidation(vData);
        }

        if (emailRes && emailRes.ok) {
          const data = await emailRes.json();
          if (data.exists) {
            setIsDuplicate(true);
            setDuplicateEmailMatched(trimmed);
          } else {
            setIsDuplicate(false);
            setDuplicateEmailMatched("");
          }
        } else if (skipDuplicateCheck) {
          setIsDuplicate(false);
          setDuplicateEmailMatched("");
        }
      } catch {
        // Silently continue if network check fails
      } finally {
        setIsValidatingEmail(false);
        setIsCheckingDuplicate(false);
      }
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [email, skipDuplicateCheck, debounceMs]);

  const reset = () => {
    setRecipientValidation(null);
    setIsDuplicate(false);
    setDuplicateEmailMatched("");
    setIsValidatingEmail(false);
    setIsCheckingDuplicate(false);
  };

  return {
    recipientValidation,
    isValidatingEmail,
    isCheckingDuplicate,
    isDuplicate,
    duplicateEmailMatched,
    setRecipientValidation,
    setIsDuplicate,
    reset,
  };
}
