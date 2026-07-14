import type { MetadataRoute } from "next";
import { listClients } from "@/lib/clients";
import { siteUrl } from "@/lib/site-url";

// sitemap.xml: de agency-homepage plus alle indexeerbare klant-sites met hun
// vier pagina's. Klanten met seo.index === false (demo's, sjabloonpagina's)
// blijven eruit. Nieuwe klant toevoegen = configbestand toevoegen; de sitemap
// pikt hem automatisch op.
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = [
    { url: siteUrl, changeFrequency: "weekly", priority: 1 },
  ];

  const clients = await listClients();
  for (const client of clients) {
    if (client.seo?.index === false) continue;
    const base = `${siteUrl}/${client.slug}`;
    entries.push(
      { url: base, changeFrequency: "weekly", priority: 0.9 },
      { url: `${base}/diensten`, changeFrequency: "monthly", priority: 0.7 },
      { url: `${base}/over`, changeFrequency: "monthly", priority: 0.5 },
      { url: `${base}/contact`, changeFrequency: "monthly", priority: 0.8 },
    );
  }

  return entries;
}
