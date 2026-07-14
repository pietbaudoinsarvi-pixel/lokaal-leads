import { notFound } from "next/navigation";
import Link from "next/link";
import { getClient } from "@/lib/clients";
import About from "@/components/site/About";

export async function generateMetadata({ params }: { params: Promise<{ client: string }> }) {
  const { client } = await params;
  const config = await getClient(client);
  if (!config) return {};
  return {
    title: `Over ons | ${config.business.name} ${config.business.city}`,
    description: config.presentation.about.body.slice(0, 155),
    alternates: { canonical: `/${client}/over` },
  };
}

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
          <h2>{p.cta.about.heading}</h2>
          <p>{p.cta.about.body}</p>
          <Link href={`/${config.slug}/contact`} className="btn btn--accent btn--lg">
            {p.hero.ctaLabel}
          </Link>
        </div>
      </section>
    </>
  );
}
