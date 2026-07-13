import type { ClientConfig } from "@/config/types";

// Laadt een klant-config op basis van slug. Nieuwe klant = nieuw bestand in
// /config/clients/<slug>.ts (default export). Geen registratie of codewijziging
// nodig: de dynamische import pakt elk bestand in die map automatisch mee.
export async function getClient(slug: string): Promise<ClientConfig | null> {
  // Slug-guard: alleen kleine letters, cijfers en koppeltekens (voorkomt
  // path traversal en houdt slugs URL-veilig).
  if (!/^[a-z0-9-]+$/.test(slug)) return null;

  try {
    const mod = await import(`../config/clients/${slug}`);
    return (mod.default ?? null) as ClientConfig | null;
  } catch {
    return null;
  }
}
