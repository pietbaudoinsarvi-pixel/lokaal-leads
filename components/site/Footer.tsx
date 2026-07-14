import Link from "next/link";
import type { ClientConfig } from "@/config/types";

interface FooterProps {
  business: ClientConfig["business"];
  slug: string;
  year: number;
}

export default function Footer({ business, slug, year }: FooterProps) {
  const base = `/${slug}`;
  const telHref = `tel:${business.phone.replace(/[^0-9+]/g, "")}`;

  return (
    <footer className="site-footer">
      <div className="container site-footer__grid">
        <div className="site-footer__col">
          <div className="site-footer__brand">🌿 {business.name}</div>
          <p>{business.tagline}</p>
        </div>
        <div className="site-footer__col">
          <h4>Navigatie</h4>
          <Link href={base}>Home</Link>
          <Link href={`${base}/diensten`}>Diensten</Link>
          <Link href={`${base}/over`}>Over ons</Link>
          <Link href={`${base}/contact`}>Contact</Link>
        </div>
        <div className="site-footer__col">
          <h4>Contact</h4>
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
