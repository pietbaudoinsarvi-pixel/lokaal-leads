import type { ClientConfig } from "@/config/types";

interface ProcessProps {
  process: ClientConfig["presentation"]["process"];
}

export default function Process({ process }: ProcessProps) {
  if (!process || process.steps.length === 0) return null;

  return (
    <section className="section" id="werkwijze">
      <div className="container">
        <div className="section__head">
          <span className="eyebrow">Werkwijze</span>
          <h2 className="section__title">{process.heading}</h2>
          {process.intro && <p className="section__intro">{process.intro}</p>}
        </div>
        <ol className="process-grid">
          {process.steps.map((step, i) => (
            <li className="process-step" key={i}>
              <span className="process-step__num" aria-hidden="true">
                {i + 1}
              </span>
              <h3 className="process-step__title">{step.title}</h3>
              <p className="process-step__desc">{step.description}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
