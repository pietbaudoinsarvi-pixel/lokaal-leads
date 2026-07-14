import type { ClientConfig } from "@/config/types";
import { logReviewRequest } from "@/lib/db/queries";
import { getMessageSender } from "./index";
import type { MessageChannel } from "./types";

// Klant-gerichte review-tekst, met de Google-review-link uit de klant-config.
export function buildReviewMessage(client: ClientConfig): string {
  const b = client.business;
  return (
    `Bedankt voor uw opdracht bij ${b.name}! Was u tevreden? ` +
    `Wij zouden het enorm waarderen als u een korte review achterlaat via Google: ` +
    `${client.operational.googleReviewLink}`
  );
}

export async function sendReviewRequest(params: {
  client: ClientConfig;
  phone: string;
  channel: MessageChannel;
}): Promise<{ ok: boolean; status: "sent" | "failed"; error?: string }> {
  const { client, phone, channel } = params;
  const text = buildReviewMessage(client);
  const sender = getMessageSender(channel);
  const res = await sender.send(phone, text);
  const status: "sent" | "failed" = res.ok ? "sent" : "failed";

  // Elk verzoek wordt gelogd, geslaagd of niet.
  await logReviewRequest({ client_slug: client.slug, phone, channel, status });

  return { ok: res.ok, status, error: res.error };
}
