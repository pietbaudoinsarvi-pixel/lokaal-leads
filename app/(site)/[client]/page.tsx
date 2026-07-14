import { notFound } from "next/navigation";
import Link from "next/link";
import { getClient } from "@/lib/clients";
import Hero from "@/components/site/Hero";
import Services from "@/components/site/Services";
import About from "@/components/site/About";

export default async function HomePage({ params }: { params: Promise<{ client: string }> }) {
  const { client } = await params;
  const config = await getClient(client);
  if (!config) notFound();

  const p = config.presentation;

  return (
    <>
      <Hero
        hero={p.hero}
        slug={config.slug}
        phone={config.business.phone}
        photo={p.photos[p.hero.imageSlot]}
      />
      <Services services={p.services} />
      <About about={p.about} photo={p.photos[p.about.imageSlot]} />
      <section className="cta-band">
        <div className="container cta-band__inner">
          <h2>Klaar voor een tuin om trots op te zijn?</h2>
          <p>Vraag vrijblijvend een offerte aan. Wij bellen u binnen een werkdag terug.</p>
          <Link href={`/${config.slug}/contact`} className="btn btn--accent btn--lg">
            {p.hero.ctaLabel}
          </Link>
        </div>
      </section>
    </>
  );
}
