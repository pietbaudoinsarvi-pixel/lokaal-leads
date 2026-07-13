import type { ClientConfig } from "@/config/types";
import { logDelivery } from "@/lib/db/queries";
import { getNotifier } from "./index";
import { TelegramNotifier } from "./telegram";
import type { LeadNotification } from "./types";

function formatLeadMessage(lead: LeadNotification): string {
  const bron = lead.source === "chat" ? "AI-chat" : "Contactformulier";
  return [
    `🌱 Nieuwe lead voor ${lead.businessName}`,
    ``,
    `Naam: ${lead.name}`,
    `Telefoon: ${lead.phone}`,
    `Bericht: ${lead.message || "(geen)"}`,
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

// Vangnet naar de operator (jij), altijd via Telegram, ongeacht het klant-kanaal.
async function alertOperator(
  client: ClientConfig,
  lead: LeadNotification,
  error?: string,
): Promise<void> {
  const operatorChatId = process.env.OPERATOR_TELEGRAM_CHAT_ID;
  if (!operatorChatId) return;

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
    await new TelegramNotifier().send(operatorChatId, text);
  } catch {
    // Laatste vangnet mag de request nooit breken.
  }
}
