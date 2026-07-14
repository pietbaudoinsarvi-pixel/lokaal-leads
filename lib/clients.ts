import { cache } from "react";
import { readdir } from "node:fs/promises";
import path from "node:path";
import type { ClientConfig } from "@/config/types";

// Laadt een klant-config op basis van slug. Nieuwe klant = nieuw bestand in
// /config/clients/<slug>.ts (default export). Geen registratie of codewijziging
// nodig: de dynamische import pakt elk bestand in die map automatisch mee.
//
// Gewikkeld in React cache(): binnen één request delen generateMetadata, de
// layout en de page dezelfde config zonder de import meerdere keren te doen.
export const getClient = cache(async (slug: string): Promise<ClientConfig | null> => {
  // Slug-guard: alleen kleine letters, cijfers en koppeltekens (voorkomt
  // path traversal en houdt slugs URL-veilig).
  if (!/^[a-z0-9-]+$/.test(slug)) return null;

  try {
    const mod = await import(`../config/clients/${slug}`);
    return (mod.default ?? null) as ClientConfig | null;
  } catch {
    return null;
  }
});

// Alle klant-configs, gelezen uit de bestandsnamen in /config/clients.
// Gebruikt door de sitemap; loopt via getClient zodat elke config maar één
// keer per request geladen wordt. Faalt stil naar [] (bv. als de map bij een
// exotische runtime niet meegepakt is): liever een kale sitemap dan een 500.
export const listClients = cache(async (): Promise<ClientConfig[]> => {
  try {
    const dir = path.join(process.cwd(), "config", "clients");
    const files = await readdir(dir);
    const slugs = files
      .filter((f) => f.endsWith(".ts"))
      .map((f) => f.replace(/\.ts$/, ""));
    const configs = await Promise.all(slugs.map((slug) => getClient(slug)));
    return configs.filter((c): c is ClientConfig => c !== null);
  } catch {
    return [];
  }
});
