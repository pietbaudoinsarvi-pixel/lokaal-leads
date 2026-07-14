import type { MessageResult, MessageSender } from "./types";

// TODO: implementeer via Bird (NL) of Twilio SMS.
// (WhatsApp is inmiddels echt: zie ./whatsapp.ts.)
export class SmsMessageSender implements MessageSender {
  readonly channel = "sms" as const;
  async send(): Promise<MessageResult> {
    return { ok: false, error: "SmsMessageSender nog niet geimplementeerd (TODO Bird/Twilio)" };
  }
}
