"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

export interface FaqItem {
  q: string;
  a: string;
}

interface FaqAccordionProps {
  faqs: FaqItem[];
}

export function FaqAccordion({ faqs }: FaqAccordionProps) {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const toggleFaq = (idx: number) => {
    setOpenFaq(openFaq === idx ? null : idx);
  };

  return (
    <div className="border-t border-hairline divide-y divide-hairline">
      {faqs.map((faq, idx) => {
        const isOpen = openFaq === idx;
        return (
          <div key={idx} className="py-3.5 sm:py-4">
            <button
              type="button"
              onClick={() => toggleFaq(idx)}
              className="flex w-full items-center justify-between text-left text-xs sm:text-sm font-medium text-ink hover:text-seal transition-colors gap-3 cursor-pointer py-1"
              aria-expanded={isOpen}
              aria-controls={`faq-answer-${idx}`}
            >
              <span>{faq.q}</span>
              <ChevronDown
                className={`h-4 w-4 text-muted-ink shrink-0 transition-transform duration-200 ${
                  isOpen ? "rotate-180 text-seal" : ""
                }`}
              />
            </button>
            <div
              id={`faq-answer-${idx}`}
              className={isOpen ? "mt-2 text-xs sm:text-sm text-muted-ink leading-relaxed" : "hidden"}
            >
              <p>{faq.a}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
