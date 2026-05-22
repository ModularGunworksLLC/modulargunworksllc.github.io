"use client";

import { useState } from "react";

type FaqItem = { question: string; answer: React.ReactNode };

type FaqCategory = { title: string; items: FaqItem[] };

export function FaqAccordion({ categories }: { categories: FaqCategory[] }) {
  const [openKey, setOpenKey] = useState<string | null>(null);

  return (
    <>
      {categories.map((cat) => (
        <div className="faq-category" key={cat.title}>
          <h2 className="faq-category-title">{cat.title}</h2>
          {cat.items.map((item, i) => {
            const key = `${cat.title}-${i}`;
            const active = openKey === key;
            return (
              <div className={`faq-item${active ? " active" : ""}`} key={key}>
                <button
                  type="button"
                  className="faq-question"
                  onClick={() => setOpenKey(active ? null : key)}
                  aria-expanded={active}
                >
                  <span>{item.question}</span>
                  <i className="fas fa-chevron-down" aria-hidden />
                </button>
                <div className="faq-answer">{item.answer}</div>
              </div>
            );
          })}
        </div>
      ))}
    </>
  );
}
