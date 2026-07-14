import { notFound } from "next/navigation";
import { getClient } from "@/lib/clients";
import Services from "@/components/site/Services";

export default async function DienstenPage({ params }: { params: Promise<{ client: string }> }) {
  const { client } = await params;
  const config = await getClient(client);
  if (!config) notFound();

  const p = config.presentation;

  return (
    <>
      <section className="page-hero">
        <div className="container">
          <span className="page-hero__eyebrow">{config.business.city} en omstreken</span>
          <h1>{p.services.heading}</h1>
          <p>{p.services.intro}</p>
        </div>
      </section>
      <Services services={p.services} hideHead />
    </>
  );
}
