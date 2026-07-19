import type { ClientConfig } from "@/config/types";
import {
  insertEvent,
  deriveLead,
  findLeadIdByEventId,
  hasSentDelivery,
} from "@/lib/db/queries";
import { dispatchLeadNotification } from "@/lib/notify/dispatch";
import { leadDedupKey } from "@/lib/util/dedup";

export interface SubmitLeadInput {
  client: ClientConfig;
  name: string;
  phone: string;
  message: string;
  source: "form" | "chat";
}

export type SubmitLeadResult =
  | { ok: true; duplicate: boolean; delivered: boolean; leadId?: string }
  | { ok: false; error: string };

// Gedeelde lead-pijplijn voor zowel het formulier (/api/lead) als de AI-chat
// (capture_lead-tool). Alles wordt eerst een event (idempotent), daaruit volgt
// het lead-record en de synchrone melding. Zo komen melding en CRM-record altijd
// uit dezelfde bron, ongeacht het kanaal.
export async function submitLead(input: SubmitLeadInput): Promise<SubmitLeadResult> {
  const { client, name, phone, message, source } = input;
  const clientSlug = client.slug;
  const dedupKey = leadDedupKey(clientSlug, phone, message);

  try {
    const { event, isNew } = await insertEvent({
      client_slug: clientSlug,
      type: "lead",
      source,
      dedup_key: dedupKey,
      payload: { name, phone, message, source },
    });

    const notification = {
      clientSlug,
      businessName: client.business.name,
      source,
      name,
      phone,
      message,
      createdAt: new Date().toISOString(),
    };

    if (!isNew) {
      // Duplicaat. Normaal is de eerste poging volledig gelukt en sturen we
      // geen tweede melding. Maar als die eerste poging halverwege stierf
      // (event weggeschreven, lead-record of melding niet), zou de aanvraag
      // hier stil verloren gaan terwijl de bezoeker "gelukt" ziet. Daarom
      // controleren we wat er echt staat en maken we alsnog af wat ontbreekt.
      // In het ergste geval levert dat een dubbele melding op; dat is altijd
      // beter dan een verloren lead (kernbelofte).
      let leadId = await findLeadIdByEventId(event.id);
      const meldingVerstuurd = await hasSentDelivery(event.id);
      if (leadId && meldingVerstuurd) {
        return { ok: true, duplicate: true, delivered: true, leadId };
      }

      if (!leadId) {
        leadId = (
          await deriveLead({
            client_slug: clientSlug,
            event_id: event.id,
            source,
            name,
            phone,
            message,
          })
        ).id;
      }
      let delivered = meldingVerstuurd;
      if (!meldingVerstuurd) {
        ({ delivered } = await dispatchLeadNotification({
          eventId: event.id,
          client,
          lead: notification,
        }));
      }
      return { ok: true, duplicate: true, delivered, leadId };
    }

    const lead = await deriveLead({
      client_slug: clientSlug,
      event_id: event.id,
      source,
      name,
      phone,
      message,
    });

    const { delivered } = await dispatchLeadNotification({
      eventId: event.id,
      client,
      lead: notification,
    });

    return { ok: true, duplicate: false, delivered, leadId: lead.id };
  } catch (e) {
    console.error("[submitLead] fout:", e);
    const anyErr = e as { message?: string; code?: string; details?: string };
    const msg =
      e instanceof Error
        ? e.message
        : anyErr && anyErr.message
          ? `${anyErr.message}${anyErr.code ? ` [${anyErr.code}]` : ""}${anyErr.details ? ` (${anyErr.details})` : ""}`
          : JSON.stringify(e);
    return { ok: false, error: msg };
  }
}
