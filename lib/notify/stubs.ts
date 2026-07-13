import type { Notifier, NotifyResult } from "./types";

// De interface staat klaar; de implementaties komen later. Ze falen bewust
// duidelijk, zodat de dispatch-laag een operator-alert stuurt in plaats van
// stil de lead te missen.

// TODO: implementeer via WhatsApp Business API (Bird of 360dialog).
// Vereist business-verificatie en template-approval.
export class WhatsAppNotifier implements Notifier {
  readonly channel = "whatsapp" as const;
  async send(): Promise<NotifyResult> {
    return { ok: false, error: "WhatsAppNotifier nog niet geimplementeerd (TODO)" };
  }
}

// TODO: implementeer via Bird (NL) of Twilio SMS.
export class SmsNotifier implements Notifier {
  readonly channel = "sms" as const;
  async send(): Promise<NotifyResult> {
    return { ok: false, error: "SmsNotifier nog niet geimplementeerd (TODO)" };
  }
}

// TODO: implementeer via e-mailprovider (Postmark/Resend/SES).
export class EmailNotifier implements Notifier {
  readonly channel = "email" as const;
  async send(): Promise<NotifyResult> {
    return { ok: false, error: "EmailNotifier nog niet geimplementeerd (TODO)" };
  }
}
