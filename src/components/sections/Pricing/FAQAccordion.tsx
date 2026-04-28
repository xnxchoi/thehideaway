"use client";

import { useState } from "react";
import s from "./Pricing.module.scss";

type FAQ = { q: string; a: string };

const FAQS: FAQ[] = [
  {
    q: "Which cards do you accept?",
    a: "All Korean domestic cards, plus international Visa, Mastercard, and Amex. KakaoPay, Toss Pay, and bank transfer are also supported."
  },
  {
    q: "Can I cancel anytime?",
    a: "Yes. Cancel from your account; access continues until the end of the current billing cycle. No retention calls, no friction."
  },
  {
    q: "Refunds?",
    a: "Within 7 days of first charge, no questions. After that, prorated for technical issues only."
  },
  {
    q: "Korean tax invoice (세금계산서)?",
    a: "Available on request for Patron annual plans. Email concierge@hideawayseoul.com after subscribing."
  },
  {
    q: "Pay in cash or by bank transfer?",
    a: "Yes — pick the bank-transfer option at checkout and we'll send instructions. Your subscription activates once we confirm receipt."
  }
];

export function FAQAccordion() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <section
      aria-labelledby="faq"
      style={{
        padding: "60px 24px 100px",
        maxWidth: "780px",
        margin: "0 auto"
      }}
    >
      <header style={{ marginBottom: 24 }}>
        <p className={s.eyebrow} style={{ marginBottom: 8 }}>
          Questions
        </p>
        <h2
          id="faq"
          style={{
            fontSize: "clamp(28px, 3vw, 36px)",
            fontWeight: 300,
            letterSpacing: "-0.02em",
            margin: 0
          }}
        >
          Things people ask
        </h2>
      </header>
      <div>
        {FAQS.map((f, i) => {
          const expanded = open === i;
          const answerId = `faq-answer-${i}`;
          return (
            <div key={i} className={s.faqItem}>
              <button
                type="button"
                className={s.faqQuestion}
                aria-expanded={expanded}
                aria-controls={answerId}
                onClick={() => setOpen(expanded ? null : i)}
              >
                <span>{f.q}</span>
                <span
                  aria-hidden
                  style={{
                    fontFamily: "var(--font-mono, ui-monospace, monospace)",
                    fontSize: 18,
                    transform: expanded ? "rotate(45deg)" : "rotate(0)",
                    transition: "transform 220ms",
                    display: "inline-block"
                  }}
                >
                  +
                </span>
              </button>
              <div
                id={answerId}
                role="region"
                className={s.faqAnswer}
                hidden={!expanded}
              >
                {f.a}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
