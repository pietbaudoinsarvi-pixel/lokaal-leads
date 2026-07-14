interface UspsProps {
  usps?: string[];
}

export default function Usps({ usps }: UspsProps) {
  if (!usps || usps.length === 0) return null;

  return (
    <section className="usp-strip">
      <div className="container usp-strip__inner">
        {usps.map((u, i) => (
          <span className="usp-strip__item" key={i}>
            <span className="usp-strip__check" aria-hidden="true">✓</span>
            {u}
          </span>
        ))}
      </div>
    </section>
  );
}
