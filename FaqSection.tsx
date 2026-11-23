import { useId, useState } from "react";

type QA = { question: string; answer: string };

export default function FaqSection({ items }: { items: QA[] }) {
  const uid = useId();
  const [open, setOpen] = useState<number | null>(0);
  return (
    <ul className="faq-list" role="list">
      {items.map((qa, i) => {
        const isOpen = open === i;
        const bid = `${uid}-q${i}`;
        const pid = `${uid}-a${i}`;
        return (
          <li key={qa.question} className={`faq-item${isOpen ? " is-open" : ""}`}>
            <h3>
              <button type="button" id={bid} className="faq-q" aria-expanded={isOpen} aria-controls={pid}
                onClick={() => setOpen(isOpen ? null : i)}>
                <span className="faq-idx" aria-hidden="true">{String(i + 1).padStart(2, "0")}</span>
                <span>{qa.question}</span>
                <span className="faq-icon" aria-hidden="true" />
              </button>
            </h3>
            <div id={pid} role="region" aria-labelledby={bid} className="faq-a" inert={!isOpen}>
              <div className="faq-a-inner"><p>{qa.answer}</p></div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
