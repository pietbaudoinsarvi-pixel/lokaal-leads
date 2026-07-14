import type { ReactNode, CSSProperties } from "react";
import { notFound } from "next/navigation";
import { getClient } from "@/lib/clients";
import Header from "@/components/site/Header";
import Footer from "@/components/site/Footer";
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
  } as CSSProperties;

  return (
    <div className="site-shell" style={themeVars}>
      <Header businessName={config.business.name} phone={config.business.phone} slug={config.slug} />
      <main>{children}</main>
      <Footer business={config.business} slug={config.slug} year={new Date().getFullYear()} />
    </div>
  );
}
