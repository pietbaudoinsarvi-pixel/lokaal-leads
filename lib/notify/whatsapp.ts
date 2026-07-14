import type { Notifier, NotifyResult } from "./types";

// Echte WhatsApp-notifier met twee providers:
//
// 1. "cloud" (productie): de officiele Meta WhatsApp Cloud API.
//    Vereist env: WHATSAPP_ACCESS_TOKEN, WHATSAPP_PHONE_NUMBER_ID.
//    Optioneel: WHATSAPP_TEMPLATE_NAME (+ WHATSAPP_TEMPLATE_LANGUAGE, default
//    "nl") als goedgekeurde utility-template met precies één body-parameter
//    {{1}}. Strategie: eerst een gewoon tekstbericht (werkt binnen het
//    24-uurs servicevenster); mislukt dat omdat het venster dicht is, dan de
//    template (die mag altijd, business-initiated).
//
// 2. "callmebot" (quick-start voor meldingen aan JEZELF): gratis dienst
//    api.callmebot.com. Vereist env: CALLMEBOT_API_KEY en werkt alleen naar
//    het nummer waarmee je je bij CallMeBot hebt aangemeld. Let op: berichten
//    lopen via een derde partij; prima om snel te starten, voor klantdata op
//    termijn de Cloud API gebruiken.
//
// Providerkeuze: WHATSAPP_PROVIDER=cloud|callmebot, anders automatisch:
// cloud als er een token is, anders callmebot als er een key is.

const GRAPH_VERSION = "v21.0";

function env(name: string): string {
  return (process.env[name] ?? "").replace(/^﻿/, "").trim();
}

// Telefoonnummer naar het formaat dat de Cloud API verwacht: alleen cijfers,
// internationaal (bv. "+31 6 12 34 56 78" of "0612345678" -> "31612345678").
export function normalizePhone(raw: string): string {
  let digits = raw.replace(/[^\d+]/g, "");
  if (digits.startsWith("+")) digits = digits.slice(1);
  else if (digits.startsWith("00")) digits = digits.slice(2);
  else if (digits.startsWith("0")) digits = "31" + digits.slice(1); // NL-aanname
  return digits;
}

// Template-parameters mogen geen regeleindes of tabs bevatten (Meta wijst ze
// af) en ook geen 4+ spaties achter elkaar.
function templateParam(text: string): string {
  return text.replace(/[\r\n\t]+/g, " | ").replace(/ {4,}/g, "   ").trim();
}

type Provider = "cloud" | "callmebot" | "none";

export function whatsAppProvider(): Provider {
  const gekozen = env("WHATSAPP_PROVIDER").toLowerCase();
  if (gekozen === "cloud" || gekozen === "callmebot") return gekozen;
  if (env("WHATSAPP_ACCESS_TOKEN") && env("WHATSAPP_PHONE_NUMBER_ID")) {
    return "cloud";
  }
  if (env("CALLMEBOT_API_KEY")) return "callmebot";
  return "none";
}

export function whatsAppConfigured(): boolean {
  return whatsAppProvider() !== "none";
}

async function cloudPost(to: string, body: Record<string, unknown>): Promise<NotifyResult> {
  const token = env("WHATSAPP_ACCESS_TOKEN");
  const phoneNumberId = env("WHATSAPP_PHONE_NUMBER_ID");
  if (!token || !phoneNumberId) {
    return {
      ok: false,
      error: "WHATSAPP_ACCESS_TOKEN of WHATSAPP_PHONE_NUMBER_ID ontbreekt",
    };
  }
  try {
    const res = await fetch(
      `https://graph.facebook.com/${GRAPH_VERSION}/${phoneNumberId}/messages`,
      {
        method: "POST",
        headers: {
          authorization: `Bearer ${token}`,
          "content-type": "application/json",
        },
        body: JSON.stringify({ messaging_product: "whatsapp", to, ...body }),
      },
    );
    if (res.ok) return { ok: true };
    const data = (await res.json().catch(() => ({}))) as {
      error?: { code?: number; message?: string };
    };
    return {
      ok: false,
      error: `WhatsApp ${res.status}: ${data.error?.message ?? "onbekende fout"}`,
    };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}

// Vrij tekstbericht. Werkt zolang de ontvanger binnen 24 uur iets naar dit
// nummer heeft gestuurd (het servicevenster van Meta).
export async function waCloudText(target: string, text: string): Promise<NotifyResult> {
  const to = normalizePhone(target);
  if (!to) return { ok: false, error: "Geen geldig WhatsApp-nummer" };
  return cloudPost(to, { type: "text", text: { preview_url: true, body: text } });
}

// Goedgekeurde template: mag altijd, ook buiten het venster (business-initiated).
export async function waCloudTemplate(
  target: string,
  templateName: string,
  params: string[],
  language?: string,
): Promise<NotifyResult> {
  const to = normalizePhone(target);
  if (!to) return { ok: false, error: "Geen geldig WhatsApp-nummer" };
  return cloudPost(to, {
    type: "template",
    template: {
      name: templateName,
      language: { code: language || env("WHATSAPP_TEMPLATE_LANGUAGE") || "nl" },
      components: [
        {
          type: "body",
          parameters: params.map((p) => ({ type: "text", text: templateParam(p) })),
        },
      ],
    },
  });
}

async function sendViaCloud(target: string, text: string): Promise<NotifyResult> {
  // Poging 1: vrij tekstbericht (binnen 24-uurs venster).
  const tekstPoging = await waCloudText(target, text);
  if (tekstPoging.ok) return { ok: true };

  // Poging 2: goedgekeurde operator-template (mag altijd).
  const templateName = env("WHATSAPP_TEMPLATE_NAME");
  if (templateName) {
    const templatePoging = await waCloudTemplate(target, templateName, [text]);
    if (templatePoging.ok) return { ok: true };
    return {
      ok: false,
      error: `tekst: ${tekstPoging.error}; template: ${templatePoging.error}`,
    };
  }

  return { ok: false, error: tekstPoging.error };
}

async function sendViaCallMeBot(target: string, text: string): Promise<NotifyResult> {
  const apiKey = env("CALLMEBOT_API_KEY");
  if (!apiKey) return { ok: false, error: "CALLMEBOT_API_KEY ontbreekt" };
  const phone = normalizePhone(target);
  if (!phone) return { ok: false, error: "Geen geldig WhatsApp-nummer" };

  try {
    const url =
      `https://api.callmebot.com/whatsapp.php?phone=%2B${phone}` +
      `&apikey=${encodeURIComponent(apiKey)}&text=${encodeURIComponent(text)}`;
    const res = await fetch(url);
    const body = await res.text().catch(() => "");
    // CallMeBot geeft 200 met een foutzin in de body bij problemen.
    if (res.ok && !/error|invalid/i.test(body)) return { ok: true };
    return {
      ok: false,
      error: `CallMeBot ${res.status}: ${body.slice(0, 160) || "onbekende fout"}`,
    };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}

export class WhatsAppNotifier implements Notifier {
  readonly channel = "whatsapp" as const;

  async send(target: string, text: string): Promise<NotifyResult> {
    switch (whatsAppProvider()) {
      case "cloud":
        return sendViaCloud(target, text);
      case "callmebot":
        return sendViaCallMeBot(target, text);
      default:
        return {
          ok: false,
          error:
            "WhatsApp is nog niet geconfigureerd (zie SETUP-WHATSAPP.md: zet WHATSAPP_ACCESS_TOKEN + WHATSAPP_PHONE_NUMBER_ID of CALLMEBOT_API_KEY)",
        };
    }
  }
}
