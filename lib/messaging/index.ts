import type { MessageChannel, MessageSender } from "./types";
import { TelegramMessageSender } from "./telegram";
import { WhatsAppMessageSender } from "./whatsapp";
import { SmsMessageSender } from "./stubs";

export function getMessageSender(channel: MessageChannel): MessageSender {
  switch (channel) {
    case "telegram":
      return new TelegramMessageSender();
    case "sms":
      return new SmsMessageSender();
    case "whatsapp":
      return new WhatsAppMessageSender();
    default: {
      const exhaustive: never = channel;
      throw new Error(`Onbekend berichtkanaal: ${String(exhaustive)}`);
    }
  }
}

export type { MessageChannel, MessageSender, MessageResult } from "./types";
