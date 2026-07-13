import type { Notifier, NotifyResult } from "./types";

// Volledig geimplementeerde notifier. Gebruikt de Telegram Bot API rechtstreeks
// via fetch, dus geen extra dependency nodig.
export class TelegramNotifier implements Notifier {
  readonly channel = "telegram" as const;

  async send(target: string, text: string): Promise<NotifyResult> {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    if (!token) return { ok: false, error: "TELEGRAM_BOT_TOKEN ontbreekt" };
    if (!target) return { ok: false, error: "notifyTarget (chat_id) ontbreekt" };

    try {
      const res = await fetch(
        `https://api.telegram.org/bot${token}/sendMessage`,
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            chat_id: target,
            text,
            disable_web_page_preview: true,
          }),
        },
      );

      const data = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        description?: string;
      };

      if (!res.ok || !data.ok) {
        return {
          ok: false,
          error: `Telegram ${res.status}: ${data.description ?? "onbekende fout"}`,
        };
      }
      return { ok: true };
    } catch (e) {
      return { ok: false, error: e instanceof Error ? e.message : String(e) };
    }
  }
}
