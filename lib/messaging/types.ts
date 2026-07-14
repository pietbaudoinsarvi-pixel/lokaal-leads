// Uitgaande berichten (nu voor het review-verzoek). Zelfde patroon als de
// notifier: een interface met wisselbare implementaties per kanaal.
export type MessageChannel = "telegram" | "sms" | "whatsapp";

export interface MessageResult {
  ok: boolean;
  error?: string;
}

// Structurele velden voor kanalen die met goedgekeurde templates werken
// (WhatsApp): daar mag de tekst niet vrij zijn, maar wel de parameters.
export interface MessageContext {
  businessName: string;
  reviewLink: string;
}

export interface MessageSender {
  readonly channel: MessageChannel;
  // `to` is het telefoonnummer van de klant. `context` is optioneel en wordt
  // gebruikt door template-kanalen (WhatsApp); tekst-kanalen negeren het.
  send(to: string, text: string, context?: MessageContext): Promise<MessageResult>;
}
