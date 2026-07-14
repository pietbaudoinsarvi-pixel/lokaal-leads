"use client";

import { useRef, useState, type KeyboardEvent } from "react";
import Link from "next/link";

interface HeaderProps {
  businessName: string;
  phone: string;
  slug: string;
  logoMark?: string;
}

export default function Header({ businessName, phone, slug, logoMark }: HeaderProps) {
  const [open, setOpen] = useState(false);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const base = `/${slug}`;
  const nav = [
    { href: base, label: "Home" },
    { href: `${base}/diensten`, label: "Diensten" },
    { href: `${base}/over`, label: "Over ons" },
    { href: `${base}/contact`, label: "Contact" },
  ];
  const telHref = `tel:${phone.replace(/[^0-9+]/g, "")}`;

  function onKeyDown(e: KeyboardEvent<HTMLElement>) {
    if (e.key === "Escape" && open) {
      setOpen(false);
      toggleRef.current?.focus();
    }
  }

  return (
    <header className="site-header" onKeyDown={onKeyDown}>
      <div className="container site-header__inner">
        <Link href={base} className="site-header__logo" onClick={() => setOpen(false)}>
          {logoMark && <span className="site-header__mark" aria-hidden="true">{logoMark}</span>}
          {businessName}
        </Link>
        <button
          ref={toggleRef}
          className="site-header__toggle"
          aria-label={open ? "Menu sluiten" : "Menu openen"}
          aria-expanded={open}
          aria-controls="site-nav"
          type="button"
          onClick={() => setOpen((v) => !v)}
        >
          <span /><span /><span />
        </button>
        <nav id="site-nav" className={`site-nav ${open ? "is-open" : ""}`} aria-label="Hoofdmenu">
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
