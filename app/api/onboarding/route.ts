import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/db/client";
import { TelegramNotifier } from "@/lib/notify/telegram";

// Ontvangt het ingevulde aanleverformulier. De foto's staan op dit moment al
// in Supabase Storage (direct geupload via signed URLs); hier slaan we de
// antwoorden duurzaam op als JSON in dezelfde bucket en melden we de operator
// via Telegram. Filosofie zoals de lead-pijplijn: de inzending mag NOOIT
// verloren gaan, dus een gefaalde melding breekt de request niet.

const BUCKET = "onboarding";
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function str(v: unknown, max = 2000): string {
  return typeof v === "string" ? v.trim().slice(0, max) : "";
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => null)) as Record<
      string,
      unknown
    > | null;
    if (!body) {
      return NextResponse.json({ error: "Ongeldige aanvraag." }, { status: 400 });
    }

    const submissionId = str(body.submissionId, 40).toLowerCase();
    if (!UUID_RE.test(submissionId)) {
      return NextResponse.json(
        { error: "Ongeldige inzending-id." },
        { status: 400 },
      );
    }

    const bedrijf = {
      naam: str(body.bedrijfsnaam, 200),
      contactpersoon: str(body.contactpersoon, 200),
      telefoon: str(body.telefoon, 40),
      email: str(body.email, 200),
      plaats: str(body.plaats, 100),
      werkgebied: str(body.werkgebied, 200),
      kvk: str(body.kvk, 20),
      huidigeWebsite: str(body.huidigeWebsite, 300),
    };

    if (!bedrijf.naam || !bedrijf.contactpersoon || !bedrijf.telefoon || !bedrijf.plaats) {
      return NextResponse.json(
        { error: "Vul in elk geval bedrijfsnaam, naam, telefoonnummer en plaats in." },
        { status: 400 },
      );
    }
    if (body.akkoord !== true) {
      return NextResponse.json(
        { error: "Toestemming voor het gebruik van foto's en teksten is vereist." },
        { status: 400 },
      );
    }

    // Fotopaden: alleen paden binnen de eigen inzending accepteren.
    const fotos = (Array.isArray(body.fotos) ? body.fotos : [])
      .filter(
        (p): p is string =>
          typeof p === "string" && p.startsWith(`${submissionId}/`),
      )
      .slice(0, 60);
    const logoPath =
      typeof body.logoPath === "string" &&
      body.logoPath.startsWith(`${submissionId}/`)
        ? body.logoPath
        : "";

    const payload = {
      submissionId,
      ingevuldOp: new Date().toISOString(),
      bedrijf,
      diensten: (Array.isArray(body.diensten) ? body.diensten : [])
        .filter((d): d is string => typeof d === "string")
        .slice(0, 20)
        .map((d) => d.slice(0, 80)),
      dienstenAnders: str(body.dienstenAnders, 500),
      over: {
        sindsJaar: str(body.sindsJaar, 10),
        teamgrootte: str(body.teamgrootte, 40),
        onderscheidend: str(body.onderscheidend, 2000),
        aanspreekvorm: body.aanspreekvorm === "je" ? "je" : "u",
      },
      stijl: {
        kleur: str(body.kleur, 20),
        kleurToelichting: str(body.kleurToelichting, 500),
        logoPath,
      },
      fotos,
      praktisch: {
        bereikbaarheid: str(body.bereikbaarheid, 500),
        offerteWerkwijze: str(body.offerteWerkwijze, 1000),
        extraInfo: str(body.extraInfo, 3000),
      },
      meldingen: { nummer: str(body.meldingenNummer, 40) || bedrijf.telefoon },
      reviews: { googleLink: str(body.googleLink, 400) },
      akkoord: true,
    };

    // Duurzaam opslaan naast de foto's.
    const db = getServiceClient();
    const { error: uploadError } = await db.storage
      .from(BUCKET)
      .upload(
        `${submissionId}/aanlevering.json`,
        JSON.stringify(payload, null, 2),
        { contentType: "application/json; charset=utf-8", upsert: true },
      );
    if (uploadError) {
      return NextResponse.json(
        { error: `Opslaan mislukt: ${uploadError.message}` },
        { status: 500 },
      );
    }

    // Operator-melding, synchroon met 1 retry. Falen breekt de request niet:
    // de inzending staat al veilig in Storage.
    const operatorChatId = (process.env.OPERATOR_TELEGRAM_CHAT_ID ?? "")
      .replace(/^﻿/, "")
      .trim();
    const text = [
      `📥 Nieuwe aanlevering: ${bedrijf.naam}`,
      ``,
      `Contact: ${bedrijf.contactpersoon}, ${bedrijf.telefoon}${bedrijf.email ? `, ${bedrijf.email}` : ""}`,
      `Plaats: ${bedrijf.plaats}`,
      `Diensten: ${payload.diensten.join(", ") || "(geen aangevinkt)"}`,
      `Foto's: ${fotos.length}${logoPath ? " + logo" : ""}`,
      `Meldingen naar: ${payload.meldingen.nummer}`,
      ``,
      `Alles staat in Supabase Storage: ${BUCKET}/${submissionId}/`,
    ].join("\n");

    let delivered = false;
    const notifier = new TelegramNotifier();
    for (let i = 0; i < 2 && !delivered; i++) {
      const res = await notifier.send(operatorChatId, text);
      delivered = res.ok;
    }

    return NextResponse.json({ ok: true, delivered });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : String(e) },
      { status: 500 },
    );
  }
}
