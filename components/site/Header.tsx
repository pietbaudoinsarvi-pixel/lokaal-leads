"use client";

import { useState } from "react";
import Link from "next/link";

interface HeaderProps {
  businessName: string;
  phone: string;
  slug: string;
}

export default function Header({ businessName, phone, slug }: HeaderProps) {
  const [open, setOpen] = useState(false);
  const base = `/${slug}`;
  const nav = [
    { href: base, label: "Home" },
    { href: `${base}/diensten`, label: "Diensten" },
    { href: `${base}/over`, label: "Over ons" },
    { href: `${base}/contact`, label: "Contact" },
  ];
  const telHref = `tel:${phone.replace(/[^0-9+]/g, "")}`;

  return (
    <header className="site-header">
      <div className="container site-header__inner">
        <Link href={base} className="site-header__logo" onClick={() => setOpen(false)}>
          <span className="site-header__mark" aria-hidden="true">🌿</span>
          {businessName}
        </Link>
        <button
          className="site-header__toggle"
          aria-label="Menu openen of sluiten"
          aria-expanded={open}
          type="button"
          onClick={() => setOpen((v) => !v)}
        >
          <span /><span /><span />
        </button>
        <nav className={`site-nav ${open ? "is-open" : ""}`}>
          {nav.map((n) => (
            <Link key={n.href} href={n.href} className="site-nav__link" onClick={() => setOpen(false)}>
              {n.label}
            </Link>
          ))}
          <a href={telHref} className="btn btn--sm btn--accent site-nav__cta">Bel {phone}</a>
        </nav>
      </div>
    </header>
  );
}
