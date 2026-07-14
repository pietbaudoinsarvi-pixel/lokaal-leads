import Link from "next/link";
import { agency } from "@/config/agency";
import LeadForm from "@/components/LeadForm";
import "./agency.css";

export const metadata = {
  title: `${agency.name} | ${agency.tagline}`,
  description:
    "Websites voor hoveniers en andere vakmensen: aanvragen direct op je telefoon, automatische Google-reviews en onderhoud inbegrepen. Demo eerst, betalen daarna.",
};

export default function AgencyHome() {
  const demoPath = `/${agency.demoSlug}`;

  return (
    <div className="agency">
      <header className="a-header">
        <div className="a-container a-header__inner">
          <Link href="/" className="a-header__logo">
            <span aria-hidden="true">{agency.mark}</span> {agency.name}
          </Link>
          <nav className="a-header__nav" aria-label="Hoofdmenu">
            <a className="a-header__link" href="#voorbeeld">Voorbeeld</a>
            <a className="a-header__link" href="#wat-je-krijgt">Wat je krijgt</a>
            <a className="a-header__link" href="#werkwijze">Werkwijze</a>
            <a className="a-header__link" href="#prijs">Prijs</a>
            <a className="a-header__link" href="#vragen">Vragen</a>
            <a href="#demo-aanvragen" className="a-btn a-btn--accent a-header__cta">
              Gratis demo
            </a>
          </nav>
        </div>
      </header>

      <main>
        <section className="a-hero">
          <div className="a-container a-hero__inner">
            <span className="a-eyebrow">{agency.hero.eyebrow}</span>
            <h1 className="a-hero__title">{agency.hero.heading}</h1>
            <p className="a-hero__sub">{agency.hero.sub}</p>
            <div className="a-hero__actions">
              <a href="#demo-aanvragen" className="a-btn a-btn--accent a-btn--lg">
                {agency.hero.ctaPrimary}
              </a>
              <a href="#voorbeeld" className="a-btn a-btn--ghost">
                {agency.hero.ctaSecondary}
              </a>
            </div>
            <p className="a-hero__trust">{agency.hero.trustLine}</p>
          </div>
        </section>

        <section className="a-usps" aria-label="Kernpunten">
          <div className="a-container a-usps__inner">
            {agency.usps.map((u) => (
              <span className="a-usps__item" key={u}>
                <span className="a-usps__check" aria-hidden="true">✓</span>
                {u}
              </span>
            ))}
          </div>
        </section>

        <section className="a-section" id="voorbeeld">
          <div className="a-container">
            <div className="a-section__head">
              <span className="a-eyebrow">Voorbeeld</span>
              <h2 className="a-section__title">{agency.voorbeeld.heading}</h2>
              <p className="a-section__intro">{agency.voorbeeld.intro}</p>
            </div>
            <div className="a-browser">
              <div className="a-browser__bar" aria-hidden="true">
                <span className="a-browser__dot" />
                <span className="a-browser__dot" />
                <span className="a-browser__dot" />
                <span className="a-browser__url">degroenevinger.nl (demo)</span>
              </div>
              <iframe
                className="a-browser__frame"
                src={demoPath}
                title="Voorbeeld van een klant-website (demo-hovenier)"
                loading="lazy"
              />
            </div>
            <div className="a-voorbeeld__more">
              <Link
                href={demoPath}
                target="_blank"
                rel="noopener"
                className="a-btn a-btn--primary"
              >
                {agency.voorbeeld.linkLabel}
              </Link>
            </div>
          </div>
        </section>

        <section className="a-section a-section--warm" id="wat-je-krijgt">
          <div className="a-container">
            <div className="a-section__head">
              <span className="a-eyebrow">Alles inbegrepen</span>
              <h2 className="a-section__title">{agency.features.heading}</h2>
              <p className="a-section__intro">{agency.features.intro}</p>
            </div>
            <div className="a-features">
              {agency.features.items.map((f) => (
                <article className="a-feature" key={f.title}>
                  <div className="a-feature__icon" aria-hidden="true">{f.icon}</div>
                  <h3 className="a-feature__title">{f.title}</h3>
                  <p className="a-feature__desc">{f.description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="a-section" id="werkwijze">
          <div className="a-container">
            <div className="a-section__head">
              <span className="a-eyebrow">Werkwijze</span>
              <h2 className="a-section__title">{agency.werkwijze.heading}</h2>
              <p className="a-section__intro">{agency.werkwijze.intro}</p>
            </div>
            <ol className="a-steps">
              {agency.werkwijze.steps.map((s, i) => (
                <li className="a-step" key={s.title}>
                  <span className="a-step__num" aria-hidden="true">{i + 1}</span>
                  <h3 className="a-step__title">{s.title}</h3>
                  <p className="a-step__desc">{s.description}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="a-section a-section--warm" id="prijs">
          <div className="a-container">
            <div className="a-section__head">
              <span className="a-eyebrow">Prijs</span>
              <h2 className="a-section__title">{agency.prijs.heading}</h2>
            </div>
            <div className="a-price">
              <p className="a-price__amount">
                €{agency.priceMonthly} <span>per maand</span>
              </p>
              <ul className="a-price__list">
                {agency.prijs.includes.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
              <a href="#demo-aanvragen" className="a-btn a-btn--accent a-btn--lg a-btn--block">
                {agency.hero.ctaPrimary}
              </a>
              <p className="a-price__note">{agency.prijs.note}</p>
            </div>
            <p className="a-price__vergelijk">{agency.prijs.vergelijk}</p>
          </div>
        </section>

        <section className="a-section">
          <div className="a-container a-over">
            <span className="a-eyebrow">Over mij</span>
            <h2 className="a-section__title">{agency.over.heading}</h2>
            <p>{agency.over.body}</p>
          </div>
        </section>

        <section className="a-section a-section--warm" id="vragen">
          <div className="a-container a-faq">
            <div className="a-section__head">
              <span className="a-eyebrow">Veelgestelde vragen</span>
              <h2 className="a-section__title">Vragen die ik vaak krijg</h2>
            </div>
            <div className="a-faq-list">
              {agency.faq.map((item) => (
                <details className="a-faq-item" key={item.q}>
                  <summary className="a-faq-item__q">
                    {item.q}
                    <span className="a-faq-item__icon" aria-hidden="true" />
                  </summary>
                  <p className="a-faq-item__a">{item.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        <section className="a-section" id="demo-aanvragen">
          <div className="a-container a-contact">
            <div>
              <span className="a-eyebrow">Gratis demo</span>
              <h2 className="a-section__title">{agency.contact.heading}</h2>
              <p className="a-section__intro">{agency.contact.intro}</p>
            </div>
            <LeadForm slug="websitemannetje" />
          </div>
        </section>
      </main>

      <footer className="a-footer">
        <div className="a-container a-footer__inner">
          <span className="a-footer__brand">
            <span aria-hidden="true">{agency.mark}</span> {agency.name}
          </span>
          <nav className="a-footer__links" aria-label="Footer">
            <a href={`mailto:${agency.email}`}>{agency.email}</a>
            <Link href={demoPath}>Voorbeeldsite</Link>
            <Link href="/onboarding">Aanleverformulier voor klanten</Link>
          </nav>
          <span className="a-footer__copy">
            © {new Date().getFullYear()} {agency.name}. {agency.tagline}.
          </span>
        </div>
      </footer>
    </div>
  );
}
