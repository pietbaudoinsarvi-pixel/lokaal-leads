import { notFound } from "next/navigation";
import Link from "next/link";
import { getClient } from "@/lib/clients";
import About from "@/components/site/About";

export default async function OverPage({ params }: { params: Promise<{ client: string }> }) {
  const { client } = await params;
  const config = await getClient(client);
  if (!config) notFound();

  const p = config.presentation;

  return (
    <>
      <section className="page-hero">
        <div className="container">
          <span className="page-hero__eyebrow">Over {config.business.name}</span>
          <h1>{p.about.heading}</h1>
        </div>
      </section>
      <About about={p.about} photo={p.photos[p.about.imageSlot]} hideHead alt={false} />
      <section className="cta-band">
        <div className="container cta-band__inner">
          <h2>Benieuwd wat wij voor uw tuin kunnen doen?</h2>
          <p>Neem contact op voor een vrijblijvend gesprek.</p>
          <Link href={`/${config.slug}/contact`} className="btn btn--accent btn--lg">
            {p.hero.ctaLabel}
          </Link>
        </div>
      </section>
    </>
  );
}
