import { notFound } from "next/navigation";
import { getClient } from "@/lib/clients";
import Contact from "@/components/site/Contact";

export default async function ContactPage({ params }: { params: Promise<{ client: string }> }) {
  const { client } = await params;
  const config = await getClient(client);
  if (!config) notFound();

  const p = config.presentation;

  return (
    <>
      <section className="page-hero">
        <div className="container">
          <span className="page-hero__eyebrow">Contact</span>
          <h1>{p.contact.heading}</h1>
          <p>{p.contact.intro}</p>
        </div>
      </section>
      <Contact contact={p.contact} business={config.business} slug={config.slug} hideHead />
    </>
  );
}
