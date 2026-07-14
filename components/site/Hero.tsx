import Link from "next/link";
import type { CSSProperties } from "react";
import type { ClientConfig } from "@/config/types";

interface HeroProps {
  hero: ClientConfig["presentation"]["hero"];
  slug: string;
  phone: string;
  photo?: string;
}

export default function Hero({ hero, slug, phone, photo }: HeroProps) {
  // Foto is optioneel: staat hij er niet, dan valt de hero terug op de
  // gradient uit de CSS. Als CSS-achtergrond (geen <img>) zodat een
  // ontbrekend bestand geen kapot plaatje geeft.
  const style: CSSProperties | undefined = photo
    ? { backgroundImage: `linear-gradient(135deg, rgba(20,48,31,.74), rgba(20,48,31,.55)), url('${photo}')` }
    : undefined;
  const telHref = `tel:${phone.replace(/[^0-9+]/g, "")}`;

  return (
    <section className="hero" style={style}>
      <div className="container hero__inner">
        <h1 className="hero__title">{hero.heading}</h1>
        <p className="hero__sub">{hero.subheading}</p>
        <div className="hero__actions">
          <Link href={`/${slug}/contact`} className="btn btn--accent btn--lg">{hero.ctaLabel}</Link>
          <a href={telHref} className="hero__call">of bel {phone}</a>
        </div>
      </div>
    </section>
  );
}
