// Uitgaande berichten (nu voor het review-verzoek). Zelfde patroon als de
// notifier: een interface met wisselbare implementaties per kanaal.
export type MessageChannel = "telegram" | "sms" | "whatsapp";

export interface MessageResult {
  ok: boolean;
  error?: string;
}

export interface MessageSender {
  readonly channel: MessageChannel;
  // `to` is het telefoonnummer van de klant. Zie TelegramMessageSender voor de
  // huidige stub-afhandeling zolang we nog geen SMS/WhatsApp-provider hebben.
  send(to: string, text: string): Promise<MessageResult>;
}
