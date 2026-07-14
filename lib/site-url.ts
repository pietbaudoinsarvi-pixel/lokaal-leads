// Eén bron van waarheid voor de absolute basis-URL van de site. Gebruikt door
// metadata (root layout), robots.txt, sitemap.xml, JSON-LD en de print-kaart.
// Volgorde: expliciete env-var, dan het Vercel-productiedomein, dan fallback.
export const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "https://lokaal-leads.vercel.app");
