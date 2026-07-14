import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/db/client";
import { notifyOperator } from "@/lib/notify/operator";
import { clientIp, rateLimit } from "@/lib/util/ratelimit";

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

// Voor velden die in de Telegram-melding belanden: regeleindes en andere
// controltekens eruit, zodat niemand extra (vervalste) regels in de melding
// aan de operator kan injecteren. Opslag in JSON behoudt wel de originele
// tekst (via str), alleen de melding wordt platgeslagen.
function line(s: string): string {
  // eslint-disable-next-line no-control-regex
  return s.replace(/[\r\n\t\u0000-\u001f\u007f]+/g, " ").trim();
}

export async function POST(req: NextRequest) {
  try {
    if (!rateLimit(`onboarding:${clientIp(req)}`, 10, 10 * 60_000)) {
      return NextResponse.json(
        { error: "Te veel inzendingen in korte tijd. Probeer het over een paar minuten opnieuw." },
        { status: 429 },
      );
    }

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
      console.error("onboarding: opslaan aanlevering.json faalde:", uploadError.message);
      return NextResponse.json(
        { error: "Opslaan mislukt. Probeer het later opnieuw." },
        { status: 500 },
      );
    }

    // Operator-melding, synchroon met retry (via notifyOperator: WhatsApp
    // eerst indien geconfigureerd, anders Telegram). Falen breekt de request
    // niet: de inzending staat al veilig in Storage. Alle gebruikersinvoer
    // gaat door line() zodat er geen vervalste regels geinjecteerd worden.
    const text = [
      `📥 Nieuwe aanlevering: ${line(bedrijf.naam)}`,
      ``,
      `Contact: ${line(bedrijf.contactpersoon)}, ${line(bedrijf.telefoon)}${bedrijf.email ? `, ${line(bedrijf.email)}` : ""}`,
      `Plaats: ${line(bedrijf.plaats)}`,
      `Diensten: ${line(payload.diensten.join(", ")) || "(geen aangevinkt)"}`,
      `Foto's: ${fotos.length}${logoPath ? " + logo" : ""}`,
      `Meldingen naar: ${line(payload.meldingen.nummer)}`,
      ``,
      `Alles staat in Supabase Storage: ${BUCKET}/${submissionId}/`,
    ].join("\n");

    const melding = await notifyOperator(text);

    return NextResponse.json({ ok: true, delivered: melding.ok });
  } catch (e) {
    console.error("onboarding: onverwachte fout:", e);
    return NextResponse.json(
      { error: "Er ging iets mis. Probeer het later opnieuw." },
      { status: 500 },
    );
  }
}
