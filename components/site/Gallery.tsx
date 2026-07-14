import type { ClientConfig } from "@/config/types";

interface GalleryProps {
  gallery: ClientConfig["presentation"]["gallery"];
}

export default function Gallery({ gallery }: GalleryProps) {
  if (!gallery || gallery.items.length === 0) return null;

  return (
    <section className="section section--alt" id="werk">
      <div className="container">
        <div className="section__head">
          <span className="eyebrow">Ons werk</span>
          <h2 className="section__title">{gallery.heading}</h2>
          {gallery.intro && <p className="section__intro">{gallery.intro}</p>}
        </div>
        <div className="gallery-grid">
          {gallery.items.map((g, i) => (
            <figure className="gallery-item" key={i}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={g.image}
                alt={g.caption ?? "Voorbeeld van ons werk"}
                loading="lazy"
                decoding="async"
              />
              {g.caption && <figcaption className="gallery-item__caption">{g.caption}</figcaption>}
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
