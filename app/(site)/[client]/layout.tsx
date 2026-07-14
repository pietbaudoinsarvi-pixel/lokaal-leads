import type { ReactNode, CSSProperties } from "react";
import { notFound } from "next/navigation";
import { getClient } from "@/lib/clients";
import { siteUrl } from "@/lib/site-url";
import Header from "@/components/site/Header";
import Footer from "@/components/site/Footer";
import ChatWidget from "@/components/ChatWidget";
import "./site.css";

export async function generateMetadata({ params }: { params: Promise<{ client: string }> }) {
  const { client } = await params;
  const config = await getClient(client);
  if (!config) return { title: "Pagina niet gevonden" };
  const heroFoto = config.presentation.photos[config.presentation.hero.imageSlot];
  const description = config.seo?.description ?? config.business.tagline;
  return {
    title: `${config.business.name} | ${config.business.city}`,
    description,
    // Demo's en sjabloonpagina's horen niet in Google (seo.index: false);
    // echte klant-sites wel (default).
    ...(config.seo?.index === false
      ? { robots: { index: false, follow: false } }
      : {}),
    // Open Graph: zo toont een link die je (bv. via WhatsApp) naar een
    // prospect stuurt meteen een nette preview met foto en bedrijfsnaam.
    openGraph: {
      title: `${config.business.name} | ${config.business.city}`,
      description,
      type: "website",
      locale: "nl_NL",
      siteName: config.business.name,
      ...(heroFoto ? { images: [{ url: heroFoto }] } : {}),
    },
  };
}

// schema.org LocalBusiness-data zodat Google het bedrijf, werkgebied en de
// beoordeling begrijpt (kans op sterren en een kennispaneel in de resultaten).
// Alles komt uit config; velden die ontbreken blijven gewoon weg.
function buildJsonLd(config: NonNullable<Awaited<ReturnType<typeof getClient>>>) {
  const heroFoto = config.presentation.photos[config.presentation.hero.imageSlot];
  const reviews = config.presentation.reviews;
  const data = {
    "@context": "https://schema.org",
    "@type": config.seo?.schemaType ?? "LocalBusiness",
    name: config.business.name,
    description: config.seo?.description ?? config.business.tagline,
    url: `${siteUrl}/${config.slug}`,
    telephone: config.business.phone || undefined,
    email: config.business.email || undefined,
    image: heroFoto ? `${siteUrl}${heroFoto}` : undefined,
    address: {
      "@type": "PostalAddress",
      ...(config.business.address ? { streetAddress: config.business.address } : {}),
      addressLocality: config.business.city,
      addressCountry: "NL",
    },
    areaServed: config.business.serviceArea,
    ...(reviews?.rating && reviews.count
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: reviews.rating,
            reviewCount: reviews.count,
          },
        }
      : {}),
  };
  // "<" escapen zodat gebruikersinvoer nooit uit het script-blok kan breken.
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

export default async function SiteLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ client: string }>;
}) {
  const { client } = await params;
  const config = await getClient(client);
  if (!config) notFound();

  // Kleuren uit config.theme als CSS-variabelen. Alle sjabloon-stijl leest deze.
  const themeVars = {
    "--primary": config.theme.primary,
    "--accent": config.theme.accent,
    "--dark": config.theme.dark ?? "#14301f",
    "--on-primary": config.theme.onPrimary ?? "#ffffff",
    "--on-accent": config.theme.onAccent ?? "#2a2410",
  } as CSSProperties;

  return (
    <div className="site-shell" style={themeVars}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: buildJsonLd(config) }}
      />
      <a href="#main" className="skip-link">Naar inhoud</a>
      <Header
        businessName={config.business.name}
        phone={config.business.phone}
        slug={config.slug}
        logoMark={config.business.logoMark}
      />
      <main id="main">{children}</main>
      <Footer
        business={config.business}
        slug={config.slug}
        year={new Date().getFullYear()}
        logoMark={config.business.logoMark}
      />
      <ChatWidget
        slug={config.slug}
        businessName={config.business.name}
        logoMark={config.business.logoMark}
      />
    </div>
  );
}
