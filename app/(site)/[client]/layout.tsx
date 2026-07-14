import type { ReactNode, CSSProperties } from "react";
import { notFound } from "next/navigation";
import { getClient } from "@/lib/clients";
import Header from "@/components/site/Header";
import Footer from "@/components/site/Footer";
import ChatWidget from "@/components/ChatWidget";
import "./site.css";

export async function generateMetadata({ params }: { params: Promise<{ client: string }> }) {
  const { client } = await params;
  const config = await getClient(client);
  if (!config) return { title: "Pagina niet gevonden" };
  return {
    title: `${config.business.name} | ${config.business.city}`,
    description: config.business.tagline,
  };
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
