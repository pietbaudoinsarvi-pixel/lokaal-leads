import type { CSSProperties } from "react";
import type { ClientConfig } from "@/config/types";

interface AboutProps {
  about: ClientConfig["presentation"]["about"];
  photo?: string;
  hideHead?: boolean;
  alt?: boolean;
}

export default function About({ about, photo, hideHead = false, alt = true }: AboutProps) {
  const media: CSSProperties | undefined = photo ? { backgroundImage: `url('${photo}')` } : undefined;
  return (
    <section className={`section ${alt ? "section--alt" : ""}`} id="over">
      <div className="container about">
        <div className="about__media" style={media} aria-hidden="true" />
        <div className="about__body">
          {!hideHead && <h2 className="section__title">{about.heading}</h2>}
          <p>{about.body}</p>
        </div>
      </div>
    </section>
  );
}
