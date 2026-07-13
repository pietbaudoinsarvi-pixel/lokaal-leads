import type { NotifyChannel } from "@/config/types";
import type { Notifier } from "./types";
import { TelegramNotifier } from "./telegram";
import { WhatsAppNotifier, SmsNotifier, EmailNotifier } from "./stubs";

// Kiest de juiste notifier op basis van het kanaal uit de klant-config.
export function getNotifier(channel: NotifyChannel): Notifier {
  switch (channel) {
    case "telegram":
      return new TelegramNotifier();
    case "whatsapp":
      return new WhatsAppNotifier();
    case "sms":
      return new SmsNotifier();
    case "email":
      return new EmailNotifier();
    default: {
      const exhaustive: never = channel;
      throw new Error(`Onbekend notify-kanaal: ${String(exhaustive)}`);
    }
  }
}

export type { Notifier, NotifyResult, LeadNotification } from "./types";
