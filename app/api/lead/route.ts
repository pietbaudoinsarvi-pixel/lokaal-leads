import { NextResponse } from "next/server";
import { getClient } from "@/lib/clients";
import { submitLead } from "@/lib/leads/submit";
import { clientIp, rateLimit } from "@/lib/util/ratelimit";

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
  // Publiek endpoint, dus rem floods van nepleads per IP (zoals onboarding).
  // De dedup-sleutel alleen is te omzeilen door bericht of telefoon per request
  // te varieren, daarom is deze IP-limiet de eigenlijke rem tegen volpompen.
  if (!rateLimit(`lead:${clientIp(req)}`, 10, 10 * 60_000)) {
    return NextResponse.json(
      { ok: false, error: "Te veel aanvragen in korte tijd. Probeer het over een paar minuten opnieuw." },
      { status: 429 },
    );
  }

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

  const result = await submitLead({ client, name, phone, message, source });
  if (!result.ok) {
    return NextResponse.json({ ok: false, error: `Serverfout: ${result.error}` }, { status: 500 });
  }
  if (result.duplicate) {
    return NextResponse.json({ ok: true, duplicate: true });
  }
  return NextResponse.json({ ok: true, leadId: result.leadId, delivered: result.delivered });
}
