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
        {!hideHead && (
          <div className="section__head">
            <h2 className="section__title">{services.heading}</h2>
            <p className="section__intro">{services.intro}</p>
          </div>
        )}
        <div className="services-grid">
          {services.items.map((s, i) => (
            <article className="service-card" key={i}>
              <div className="service-card__icon" aria-hidden="true">{s.icon ?? "🌱"}</div>
              <h3 className="service-card__title">{s.title}</h3>
              <p className="service-card__desc">{s.description}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
