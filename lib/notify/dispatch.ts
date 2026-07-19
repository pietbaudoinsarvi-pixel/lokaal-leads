import type { ClientConfig } from "@/config/types";
import { logDelivery } from "@/lib/db/queries";
import { getNotifier } from "./index";
import { notifyOperator } from "./operator";
import type { LeadNotification } from "./types";

// Voor velden die in de leadmelding belanden: regeleindes en andere
// controltekens eruit, zodat niemand extra (vervalste) regels in de melding
// kan injecteren. De lead blijft in opslag ongewijzigd; alleen de tekstmelding
// wordt platgeslagen. Zelfde aanpak als in /api/onboarding.
function line(s: string): string {
  // eslint-disable-next-line no-control-regex
  return s.replace(/[\r\n\t\u0000-\u001f\u007f]+/g, " ").trim();
}

function formatLeadMessage(lead: LeadNotification): string {
  const bron = lead.source === "chat" ? "AI-chat" : "Contactformulier";
  return [
    `🌱 Nieuwe lead voor ${lead.businessName}`,
    ``,
    `Naam: ${line(lead.name)}`,
    `Telefoon: ${line(lead.phone)}`,
    `Bericht: ${line(lead.message) || "(geen)"}`,
    ``,
    `Bron: ${bron}`,
  ].join("\n");
}

// Verstuurt de leadmelding SYNCHROON (initiele poging + 1 retry) en logt elke
// poging in deliveries. Faalt de melding definitief, dan loggen we 'failed' en
// sturen we een operator-alert. We gooien NOOIT: de lead is al opgeslagen en de
// caller moet altijd succes terugkrijgen zodat de lead niet verloren gaat.
export async function dispatchLeadNotification(params: {
  eventId: string;
  client: ClientConfig;
  lead: LeadNotification;
}): Promise<{ delivered: boolean }> {
  const { eventId, client, lead } = params;
  const channel = client.operational.notifyChannel;
  const target = client.operational.notifyTarget;
  const notifier = getNotifier(channel);
  const text = formatLeadMessage(lead);

  let attempts = 0;
  let lastError: string | undefined;

  for (let i = 0; i < 2; i++) {
    attempts++;
    const res = await notifier.send(target, text);
    if (res.ok) {
      await logDelivery({
        event_id: eventId,
        channel,
        target,
        status: "sent",
        error: null,
        attempts,
      });
      return { delivered: true };
    }
    lastError = res.error;
  }

  await logDelivery({
    event_id: eventId,
    channel,
    target,
    status: "failed",
    error: lastError ?? "onbekende fout",
    attempts,
  });
  await alertOperator(client, lead, lastError);
  return { delivered: false };
}

// Vangnet naar de operator (jij), via WhatsApp of Telegram (wat werkt),
// ongeacht het klant-kanaal.
async function alertOperator(
  client: ClientConfig,
  lead: LeadNotification,
  error?: string,
): Promise<void> {
  const text = [
    `⚠️ Lead-melding FAALDE voor ${client.slug} (${client.business.name})`,
    ``,
    `De lead is wel opgeslagen. Neem zelf contact op:`,
    `Naam: ${lead.name}`,
    `Telefoon: ${lead.phone}`,
    `Bericht: ${lead.message || "(geen)"}`,
    ``,
    `Fout: ${error ?? "onbekend"}`,
  ].join("\n");

  try {
    await notifyOperator(text);
  } catch {
    // Laatste vangnet mag de request nooit breken.
  }
}
