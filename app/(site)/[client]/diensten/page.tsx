import { notFound } from "next/navigation";
import { getClient } from "@/lib/clients";
import Services from "@/components/site/Services";

export async function generateMetadata({ params }: { params: Promise<{ client: string }> }) {
  const { client } = await params;
  const config = await getClient(client);
  if (!config) return {};
  return {
    title: `${config.presentation.services.heading} | ${config.business.name} ${config.business.city}`,
    description: config.presentation.services.intro,
    alternates: { canonical: `/${client}/diensten` },
  };
}

export default async function DienstenPage({ params }: { params: Promise<{ client: string }> }) {
  const { client } = await params;
  const config = await getClient(client);
  if (!config) notFound();

  const p = config.presentation;

  return (
    <>
      <section className="page-hero">
        <div className="container">
          <span className="page-hero__eyebrow">{config.business.city}</span>
          <h1>{p.services.heading}</h1>
          <p>{p.services.intro}</p>
        </div>
      </section>
      <Services services={p.services} hideHead />
    </>
  );
}
