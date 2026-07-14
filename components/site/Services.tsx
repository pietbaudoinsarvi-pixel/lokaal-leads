import type { ClientConfig } from "@/config/types";

interface ServicesProps {
  services: ClientConfig["presentation"]["services"];
  hideHead?: boolean;
  alt?: boolean;
}

export default function Services({ services, hideHead = false, alt = false }: ServicesProps) {
  return (
    <section className={`section ${alt ? "section--alt" : ""}`} id="diensten">
      <div className="container">
        {hideHead ? (
          // Kop blijft in de DOM (visueel verborgen) zodat de kopvolgorde geldig
          // blijft wanneer de titel al in de page-hero staat.
          <h2 className="sr-only">{services.heading}</h2>
        ) : (
          <div className="section__head">
            <h2 className="section__title">{services.heading}</h2>
            <p className="section__intro">{services.intro}</p>
          </div>
        )}
        <div className="services-grid">
          {services.items.map((s, i) => (
            <article className="service-card" key={i}>
              {s.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  className="service-card__media"
                  src={s.image}
                  alt={s.title}
                  loading="lazy"
                  decoding="async"
                />
              ) : (
                <div className="service-card__media service-card__media--fallback" aria-hidden="true">
                  {s.icon ?? "✦"}
                </div>
              )}
              <div className="service-card__body">
                <h3 className="service-card__title">{s.title}</h3>
                <p className="service-card__desc">{s.description}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
