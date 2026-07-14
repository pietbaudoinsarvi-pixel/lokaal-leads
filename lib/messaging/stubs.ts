import type { MessageResult, MessageSender } from "./types";

// TODO: implementeer via Bird (NL) of Twilio SMS.
export class SmsMessageSender implements MessageSender {
  readonly channel = "sms" as const;
  async send(): Promise<MessageResult> {
    return { ok: false, error: "SmsMessageSender nog niet geimplementeerd (TODO Bird/Twilio)" };
  }
}

// TODO: implementeer via WhatsApp Business API (Bird of 360dialog).
export class WhatsAppMessageSender implements MessageSender {
  readonly channel = "whatsapp" as const;
  async send(): Promise<MessageResult> {
    return { ok: false, error: "WhatsAppMessageSender nog niet geimplementeerd (TODO)" };
  }
}
