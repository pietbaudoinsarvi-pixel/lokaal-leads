import type { NotifyChannel } from "@/config/types";

export interface LeadNotification {
  clientSlug: string;
  businessName: string;
  source: "form" | "chat";
  name: string;
  phone: string;
  message: string;
  createdAt: string;
}

export interface NotifyResult {
  ok: boolean;
  error?: string;
}

// Elke notifier stuurt een tekstbericht naar een target (chat_id/telefoon/e-mail).
// Welke notifier draait, bepaalt de klant-config (notify_channel), zodat je later
// per klant kunt wisselen zonder code te veranderen.
export interface Notifier {
  readonly channel: NotifyChannel;
  send(target: string, text: string): Promise<NotifyResult>;
}
