import { NextResponse } from "next/server";
import { getClient } from "@/lib/clients";
import { insertEvent, deriveLead } from "@/lib/db/queries";
import { dispatchLeadNotification } from "@/lib/notify/dispatch";
import { leadDedupKey } from "@/lib/util/dedup";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface LeadBody {
  clientSlug?: string;
  name?: string;
  phone?: string;
  message?: string;
  source?: "form" | "chat";
}

export async function POST(req: Request) {
  let body: LeadBody;
  try {
    body = (await req.json()) as LeadBody;
  } catch {
    return NextResponse.json({ ok: false, error: "Ongeldige JSON." }, { status: 400 });
  }

  const clientSlug = (body.clientSlug ?? "").trim();
  const name = (body.name ?? "").trim();
  const phone = (body.phone ?? "").trim();
  const message = (body.message ?? "").trim();
  const source: "form" | "chat" = body.source === "chat" ? "chat" : "form";

  if (!clientSlug) {
    return NextResponse.json({ ok: false, error: "clientSlug is verplicht." }, { status: 400 });
  }
  if (!name || !phone) {
    return NextResponse.json(
      { ok: false, error: "Naam en telefoon zijn verplicht." },
      { status: 400 },
    );
  }

  const client = await getClient(clientSlug);
  if (!client) {
    return NextResponse.json(
      { ok: false, error: `Onbekende klant: ${clientSlug}.` },
      { status: 404 },
    );
  }

  const dedupKey = leadDedupKey(clientSlug, phone, message);

  try {
    // 1. Alles wordt eerst een event (idempotent).
    const { event, isNew } = await insertEvent({
      client_slug: clientSlug,
      type: "lead",
      source,
      dedup_key: dedupKey,
      payload: { name, phone, message, source },
    });

    // 2. Duplicaat (webhook-retry / dubbelklik): geen tweede melding.
    if (!isNew) {
      return NextResponse.json({ ok: true, duplicate: true });
    }

    // 3. Lead-record volgt uit het event.
    const lead = await deriveLead({
      client_slug: clientSlug,
      event_id: event.id,
      source,
      name,
      phone,
      message,
    });

    // 4. Synchrone melding. Faalt hij definitief, dan is de lead nog steeds
    //    opgeslagen en krijgt de operator een alert; de caller krijgt altijd ok.
    const { delivered } = await dispatchLeadNotification({
      eventId: event.id,
      client,
      lead: {
        clientSlug,
        businessName: client.business.name,
        source,
        name,
        phone,
        message,
        createdAt: new Date().toISOString(),
      },
    });

    return NextResponse.json({ ok: true, leadId: lead.id, delivered });
  } catch (e) {
    console.error("[/api/lead] fout:", e);
    const anyErr = e as { message?: string; code?: string; details?: string; hint?: string };
    const msg =
      e instanceof Error
        ? e.message
        : anyErr && anyErr.message
          ? `${anyErr.message}${anyErr.code ? ` [${anyErr.code}]` : ""}${anyErr.details ? ` (${anyErr.details})` : ""}`
          : JSON.stringify(e);
    return NextResponse.json({ ok: false, error: `Serverfout: ${msg}` }, { status: 500 });
  }
}
