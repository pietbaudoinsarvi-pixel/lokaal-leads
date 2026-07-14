import { NextResponse } from "next/server";
import { getClient } from "@/lib/clients";
import { sendReviewRequest } from "@/lib/messaging/review";
import type { MessageChannel } from "@/lib/messaging/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface ReviewBody {
  clientSlug?: string;
  phone?: string;
  channel?: string;
}

const CHANNELS: MessageChannel[] = ["telegram", "sms", "whatsapp"];

export async function POST(req: Request) {
  let body: ReviewBody;
  try {
    body = (await req.json()) as ReviewBody;
  } catch {
    return NextResponse.json({ ok: false, error: "Ongeldige JSON." }, { status: 400 });
  }

  const clientSlug = (body.clientSlug ?? "").trim();
  const phone = (body.phone ?? "").trim();
  // WhatsApp is het standaardkanaal; zolang de Cloud API niet is ingesteld
  // valt de WhatsApp-sender zelf terug op een melding aan de operator.
  const channel: MessageChannel = CHANNELS.includes(body.channel as MessageChannel)
    ? (body.channel as MessageChannel)
    : "whatsapp";

  if (!clientSlug) {
    return NextResponse.json({ ok: false, error: "clientSlug is verplicht." }, { status: 400 });
  }
  if (!phone) {
    return NextResponse.json({ ok: false, error: "phone is verplicht." }, { status: 400 });
  }

  const client = await getClient(clientSlug);
  if (!client) {
    return NextResponse.json(
      { ok: false, error: `Onbekende klant: ${clientSlug}.` },
      { status: 404 },
    );
  }

  const result = await sendReviewRequest({ client, phone, channel });
  return NextResponse.json({
    ok: result.ok,
    channel,
    status: result.status,
    ...(result.error ? { error: result.error } : {}),
  });
}
