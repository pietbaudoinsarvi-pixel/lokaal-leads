import LeadForm from "@/components/LeadForm";
import type { ClientConfig } from "@/config/types";

interface ContactProps {
  contact: ClientConfig["presentation"]["contact"];
  business: ClientConfig["business"];
  slug: string;
  hideHead?: boolean;
  // Je-vorm in het formulier, voor klanten met presentation.aanspreekvorm "je".
  informal?: boolean;
}

export default function Contact({ contact, business, slug, hideHead = false, informal = false }: ContactProps) {
  const telHref = `tel:${business.phone.replace(/[^0-9+]/g, "")}`;
  return (
    <section className="section" id="contact">
      <div className="container contact">
        <div className="contact__info">
          {!hideHead && (
            <>
              <h2 className="section__title">{contact.heading}</h2>
              <p className="section__intro">{contact.intro}</p>
            </>
          )}
          <ul className="contact__list">
            {business.phone && (
              <li>
                <span>Telefoon</span>
                <a href={telHref}>{business.phone}</a>
              </li>
            )}
            <li>
              <span>E-mail</span>
              <a href={`mailto:${business.email}`}>{business.email}</a>
            </li>
            <li>
              <span>Werkgebied</span>
              <span style={{ color: "var(--ink)", textTransform: "none", letterSpacing: "normal", fontWeight: 400 }}>
                {business.serviceArea}
              </span>
            </li>
          </ul>
        </div>
        <div className="contact__form">
          <LeadForm slug={slug} informal={informal} />
        </div>
      </div>
    </section>
  );
}
