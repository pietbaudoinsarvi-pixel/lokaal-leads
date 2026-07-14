import { TelegramNotifier } from "@/lib/notify/telegram";
import type { MessageResult, MessageSender } from "./types";

// Stub via Telegram. Tot we een SMS/WhatsApp-provider (Bird/Twilio) hebben, kan
// een review-verzoek niet echt naar het klantnummer. We sturen het daarom naar
// de operator (jou) mét het klantnummer erbij, zodat de flow werkt en je de link
// desnoods handmatig doorstuurt. Later vervangt de SMS/WhatsApp-sender dit.
export class TelegramMessageSender implements MessageSender {
  readonly channel = "telegram" as const;

  async send(to: string, text: string): Promise<MessageResult> {
    const operator = process.env.OPERATOR_TELEGRAM_CHAT_ID?.replace(/^﻿/, "").trim();
    if (!operator) return { ok: false, error: "OPERATOR_TELEGRAM_CHAT_ID ontbreekt" };
    const body = [
      `📤 Review-verzoek voor klant ${to}:`,
      ``,
      text,
      ``,
      `(Nu ter demo naar jou; later gaat dit automatisch per SMS of WhatsApp naar de klant.)`,
    ].join("\n");
    return new TelegramNotifier().send(operator, body);
  }
}
