import type { FaqItem } from "@/config/types";

interface FaqProps {
  items: FaqItem[];
  heading?: string;
}

export default function Faq({ items, heading }: FaqProps) {
  if (!items || items.length === 0) return null;

  return (
    <section className="section" id="faq">
      <div className="container faq">
        <div className="section__head">
          <span className="eyebrow">Veelgestelde vragen</span>
          <h2 className="section__title">{heading ?? "Veelgestelde vragen"}</h2>
        </div>
        <div className="faq-list">
          {items.map((item, i) => (
            <details className="faq-item" key={i}>
              <summary className="faq-item__q">
                {item.q}
                <span className="faq-item__icon" aria-hidden="true" />
              </summary>
              <p className="faq-item__a">{item.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
