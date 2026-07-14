import { notifyOperator } from "@/lib/notify/operator";
import { waCloudTemplate, waCloudText, whatsAppProvider } from "@/lib/notify/whatsapp";
import type { MessageContext, MessageResult, MessageSender } from "./types";

// Review-verzoek via WhatsApp, rechtstreeks naar de KLANT van de hovenier.
//
// Productie-route (Meta Cloud API): eerst een vrij tekstbericht (werkt als de
// klant recent zelf heeft geappt, het 24-uurs venster); anders de
// goedgekeurde review-template WHATSAPP_REVIEW_TEMPLATE_NAME met twee
// body-parameters: {{1}} = bedrijfsnaam, {{2}} = Google-review-link.
// Voorbeeld-template om bij Meta in te dienen (categorie utility):
//   "Bedankt voor uw opdracht bij {{1}}! Was u tevreden? Wij zouden een
//    korte Google-review enorm waarderen: {{2}}"
//
// Zolang de Cloud API nog niet is ingesteld: het verzoek gaat naar de
// operator (WhatsApp of Telegram) om handmatig door te sturen, zodat de flow
// nooit dood is. Let op: CallMeBot kan alleen naar de operator zelf sturen en
// is dus geen kanaal richting klanten.
export class WhatsAppMessageSender implements MessageSender {
  readonly channel = "whatsapp" as const;

  async send(to: string, text: string, context?: MessageContext): Promise<MessageResult> {
    if (whatsAppProvider() === "cloud") {
      const tekst = await waCloudText(to, text);
      if (tekst.ok) return { ok: true };

      const templateName = (process.env.WHATSAPP_REVIEW_TEMPLATE_NAME ?? "")
        .replace(/^﻿/, "")
        .trim();
      if (templateName && context) {
        const template = await waCloudTemplate(to, templateName, [
          context.businessName,
          context.reviewLink,
        ]);
        if (template.ok) return { ok: true };
        return {
          ok: false,
          error: `tekst: ${tekst.error}; template: ${template.error}`,
        };
      }
      return {
        ok: false,
        error: `${tekst.error} (tip: zet WHATSAPP_REVIEW_TEMPLATE_NAME voor verzoeken buiten het 24-uurs venster)`,
      };
    }

    // Nog geen Cloud API: naar de operator ter handmatige doorzending.
    const res = await notifyOperator(
      [
        `📤 Review-verzoek voor klant ${to}:`,
        ``,
        text,
        ``,
        `(WhatsApp Cloud API nog niet ingesteld; stuur dit zelf even door. Zie SETUP-WHATSAPP.md.)`,
      ].join("\n"),
    );
    return res.ok ? { ok: true } : { ok: false, error: res.error };
  }
}
