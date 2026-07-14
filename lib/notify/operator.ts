import { TelegramNotifier } from "./telegram";
import { WhatsAppNotifier, whatsAppConfigured } from "./whatsapp";

// Eén plek voor meldingen aan de operator (jou). Voorkeurskanaal is WhatsApp
// (zodra OPERATOR_WHATSAPP_NUMBER + een provider zijn geconfigureerd, zie
// SETUP-WHATSAPP.md); lukt dat niet, dan valt hij terug op Telegram. Zo kan
// de omschakeling per env-var, zonder codewijziging, en gaat er nooit een
// melding stil verloren zolang minstens één kanaal werkt.

function env(name: string): string {
  return (process.env[name] ?? "").replace(/^﻿/, "").trim();
}

export interface OperatorNotifyResult {
  ok: boolean;
  via?: "whatsapp" | "telegram";
  error?: string;
}

export async function notifyOperator(text: string): Promise<OperatorNotifyResult> {
  const fouten: string[] = [];

  // Twee rondes: elke poging die faalt krijgt via de tweede ronde in feite
  // één retry, net als de oude losse implementaties.
  for (let ronde = 0; ronde < 2; ronde++) {
    const waNummer = env("OPERATOR_WHATSAPP_NUMBER");
    if (waNummer && whatsAppConfigured()) {
      const res = await new WhatsAppNotifier().send(waNummer, text);
      if (res.ok) return { ok: true, via: "whatsapp" };
      fouten.push(`whatsapp: ${res.error}`);
    }

    const chatId = env("OPERATOR_TELEGRAM_CHAT_ID");
    if (chatId) {
      const res = await new TelegramNotifier().send(chatId, text);
      if (res.ok) return { ok: true, via: "telegram" };
      fouten.push(`telegram: ${res.error}`);
    }

    if (fouten.length === 0) {
      return { ok: false, error: "Geen operator-kanaal geconfigureerd" };
    }
  }

  return { ok: false, error: fouten.join("; ") };
}
