import { NextRequest, NextResponse } from "next/server";
import { getClient } from "@/lib/clients";
import { sendReviewRequest } from "@/lib/messaging/review";
import type { MessageChannel } from "@/lib/messaging/types";
import { clientIp, rateLimit } from "@/lib/util/ratelimit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface ReviewBody {
  clientSlug?: string;
  phone?: string;
  channel?: string;
}

const CHANNELS: MessageChannel[] = ["telegram", "sms", "whatsapp"];

export async function POST(req: NextRequest) {
  // Dit endpoint verstuurt uitgaande (soms betaalde) berichten naar een vrij
  // opgegeven nummer, of belast anders de operator via een melding. Publiek en
  // zonder rem is het ongelimiteerd herhaalbaar, dus eerst een rate limit per
  // IP, net als de onboarding-routes.
  if (!rateLimit(`review:${clientIp(req)}`, 10, 10 * 60_000)) {
    return NextResponse.json(
      { ok: false, error: "Te veel review-verzoeken in korte tijd. Probeer het over een paar minuten opnieuw." },
      { status: 429 },
    );
  }

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

  // Harde rem per klant: zo kan niemand onder één merknaam ongelimiteerd
  // berichten laten uitgaan, ook niet vanaf wisselende IP-adressen. We tellen
  // pas als de klant bestaat, zodat de teller alleen echte klanten volgt.
  if (!rateLimit(`review:client:${client.slug}`, 30, 10 * 60_000)) {
    return NextResponse.json(
      { ok: false, error: "Te veel review-verzoeken voor deze klant in korte tijd. Probeer het later opnieuw." },
      { status: 429 },
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
