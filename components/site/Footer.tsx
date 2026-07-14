import Link from "next/link";
import type { ClientConfig } from "@/config/types";

interface FooterProps {
  business: ClientConfig["business"];
  slug: string;
  year: number;
  logoMark?: string;
}

export default function Footer({ business, slug, year, logoMark }: FooterProps) {
  const base = `/${slug}`;
  const telHref = `tel:${business.phone.replace(/[^0-9+]/g, "")}`;

  return (
    <footer className="site-footer">
      <div className="container site-footer__grid">
        <div className="site-footer__col">
          <div className="site-footer__brand">
            {logoMark && <span aria-hidden="true">{logoMark} </span>}
            {business.name}
          </div>
          <p>{business.tagline}</p>
        </div>
        <div className="site-footer__col">
          <h2>Navigatie</h2>
          <Link href={base}>Home</Link>
          <Link href={`${base}/diensten`}>Diensten</Link>
          <Link href={`${base}/over`}>Over ons</Link>
          <Link href={`${base}/contact`}>Contact</Link>
        </div>
        <div className="site-footer__col">
          <h2>Contact</h2>
          <a href={telHref}>{business.phone}</a>
          <a href={`mailto:${business.email}`}>{business.email}</a>
          <span>{business.serviceArea}</span>
          {business.kvk && <span>KVK {business.kvk}</span>}
        </div>
      </div>
      <div className="site-footer__bar">
        <div className="container">© {year} {business.name}. Alle rechten voorbehouden.</div>
      </div>
    </footer>
  );
}
