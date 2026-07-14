import { notFound } from "next/navigation";
import Link from "next/link";
import { getClient } from "@/lib/clients";
import Hero from "@/components/site/Hero";
import Usps from "@/components/site/Usps";
import Process from "@/components/site/Process";
import Services from "@/components/site/Services";
import Gallery from "@/components/site/Gallery";
import Reviews from "@/components/site/Reviews";
import Faq from "@/components/site/Faq";
import About from "@/components/site/About";

export async function generateMetadata({ params }: { params: Promise<{ client: string }> }) {
  const { client } = await params;
  return { alternates: { canonical: `/${client}` } };
}

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
        eyebrow={config.business.city}
        reviews={p.reviews}
      />
      <Usps usps={p.usps} />
      <Process process={p.process} />
      <Services services={p.services} />
      <Gallery gallery={p.gallery} />
      <Reviews reviews={p.reviews} googleReviewLink={config.operational.googleReviewLink} />
      <Faq items={config.ai.faq} />
      <About about={p.about} photo={p.photos[p.about.imageSlot]} />
      <section className="cta-band">
        <div className="container cta-band__inner">
          <h2>{p.cta.home.heading}</h2>
          <p>{p.cta.home.body}</p>
          <Link href={`/${config.slug}/contact`} className="btn btn--accent btn--lg">
            {p.hero.ctaLabel}
          </Link>
        </div>
      </section>
    </>
  );
}
