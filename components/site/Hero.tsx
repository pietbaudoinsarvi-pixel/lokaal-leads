import Link from "next/link";
import type { CSSProperties } from "react";
import type { ClientConfig } from "@/config/types";

interface HeroProps {
  hero: ClientConfig["presentation"]["hero"];
  slug: string;
  phone: string;
  photo?: string;
  eyebrow?: string;
  reviews?: ClientConfig["presentation"]["reviews"];
}

export default function Hero({ hero, slug, phone, photo, eyebrow, reviews }: HeroProps) {
  // Full-bleed foto met CSS-scrim (::after) voor leesbaarheid. Ontbreekt het
  // fotobestand, dan valt de hero terug op de thema-gradient.
  const style: CSSProperties | undefined = photo
    ? { backgroundImage: `url('${photo}'), linear-gradient(135deg, var(--primary), var(--dark))` }
    : undefined;
  const telHref = `tel:${phone.replace(/[^0-9+]/g, "")}`;

  return (
    <section className="hero" style={style}>
      <div className="container hero__inner">
        {eyebrow && <span className="eyebrow">{eyebrow}</span>}
        <h1 className="hero__title">{hero.heading}</h1>
        <p className="hero__sub">{hero.subheading}</p>
        <div className="hero__actions">
          <Link href={`/${slug}/contact`} className="btn btn--accent btn--lg">{hero.ctaLabel}</Link>
          {phone && <a href={telHref} className="hero__call">of bel {phone}</a>}
        </div>
        {reviews?.rating && (
          <a href="#reviews" className="hero__rating">
            <span aria-hidden="true">★★★★★</span>
            <strong>{reviews.rating.toString().replace(".", ",")}</strong>
            {reviews.count && (
              <>
                uit {reviews.count} beoordelingen
                {reviews.source ? ` op ${reviews.source}` : ""}
              </>
            )}
          </a>
        )}
      </div>
    </section>
  );
}
