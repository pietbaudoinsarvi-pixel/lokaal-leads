import { createHash } from "node:crypto";

// Idempotentie-sleutel per lead-event. Dezelfde (klant, telefoon, bericht)
// binnen hetzelfde tijdvenster van 5 minuten levert dezelfde sleutel op, dus
// geen dubbele melding bij een webhook-retry of dubbelklik.
export function leadDedupKey(
  clientSlug: string,
  phone: string,
  message: string,
): string {
  const bucket = Math.floor(Date.now() / (5 * 60 * 1000));
  const raw = [clientSlug, phone.trim(), message.trim(), bucket].join("|");
  return createHash("sha256").update(raw).digest("hex").slice(0, 32);
}
