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
  // Foto aanwezig: een overlay (afgeleid van de themekleur) boven de foto, met
  // de thema-gradient als laatste laag. Ontbreekt het fotobestand, dan valt de
  // hero netjes terug op de themekleuren in plaats van een kaal plaatje.
  // Geen foto: de CSS-gradient uit .hero geldt.
  const style: CSSProperties | undefined = photo
    ? {
        backgroundImage:
          "linear-gradient(135deg, color-mix(in srgb, var(--dark) 74%, transparent), color-mix(in srgb, var(--dark) 55%, transparent)), " +
          `url('${photo}'), ` +
          "linear-gradient(135deg, var(--primary), var(--dark))",
      }
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
