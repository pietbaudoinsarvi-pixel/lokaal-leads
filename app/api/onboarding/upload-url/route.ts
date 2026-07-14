import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/db/client";
import { clientIp, rateLimit } from "@/lib/util/ratelimit";

// Geeft een eenmalige, beveiligde upload-URL uit waarmee de browser een foto
// RECHTSTREEKS naar Supabase Storage stuurt. Zo lopen grote bestanden niet
// door deze serverless-functie heen (Vercel heeft een body-limiet van ~4,5 MB).
// Misbruik-remmen: rate limit per IP + hard plafond per inzending.

const BUCKET = "onboarding";
const MAX_SIZE = 15 * 1024 * 1024; // 15 MB per bestand
const MAX_PER_SUBMISSION = 70; // 60 foto's + logo + json + marge
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Bucket eenmalig aanmaken als hij nog niet bestaat (idempotent), zodat er
// geen handmatige setup-stap in het Supabase-dashboard nodig is.
let bucketReady = false;
async function ensureBucket(): Promise<void> {
  if (bucketReady) return;
  const db = getServiceClient();
  const { data } = await db.storage.getBucket(BUCKET);
  if (!data) {
    const { error } = await db.storage.createBucket(BUCKET, {
      public: false,
      fileSizeLimit: MAX_SIZE,
    });
    if (error && !/already exists/i.test(error.message)) {
      throw new Error(`Bucket aanmaken mislukt: ${error.message}`);
    }
  }
  bucketReady = true;
}

// Bestandsnaam veilig maken: alleen a-z, 0-9 en streepjes, extensie behouden.
function safeName(name: string): string {
  const dot = name.lastIndexOf(".");
  const rawExt = dot >= 0 ? name.slice(dot + 1) : "";
  const ext =
    rawExt.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 8) || "bin";
  const base =
    (dot >= 0 ? name.slice(0, dot) : name)
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) || "bestand";
  return `${base}.${ext}`;
}

export async function POST(req: NextRequest) {
  try {
    // Best-effort rem tegen bulk-misbruik van dit publieke endpoint. Ruim
    // genoeg voor een legitieme klant (60 foto's + logo + wat retries).
    if (!rateLimit(`upload:${clientIp(req)}`, 120, 10 * 60_000)) {
      return NextResponse.json(
        { error: "Te veel uploads in korte tijd. Probeer het over een paar minuten opnieuw." },
        { status: 429 },
      );
    }

    const body = (await req.json().catch(() => null)) as {
      submissionId?: unknown;
      fileName?: unknown;
      contentType?: unknown;
      size?: unknown;
      kind?: unknown;
    } | null;

    const submissionId =
      typeof body?.submissionId === "string" ? body.submissionId : "";
    const fileName = typeof body?.fileName === "string" ? body.fileName : "";
    const contentType =
      typeof body?.contentType === "string" ? body.contentType : "";
    const size = typeof body?.size === "number" ? body.size : 0;
    const kind = body?.kind === "logo" ? "logo" : "fotos";

    if (!UUID_RE.test(submissionId)) {
      return NextResponse.json(
        { error: "Ongeldige inzending-id." },
        { status: 400 },
      );
    }
    if (!contentType.startsWith("image/")) {
      return NextResponse.json(
        { error: "Alleen afbeeldingen zijn toegestaan." },
        { status: 400 },
      );
    }
    if (size <= 0 || size > MAX_SIZE) {
      return NextResponse.json(
        { error: "Bestand is te groot (maximaal 15 MB per foto)." },
        { status: 400 },
      );
    }

    await ensureBucket();
    const db = getServiceClient();
    const prefix = submissionId.toLowerCase();

    // Hard plafond per inzending, zodat één submissionId de bucket niet kan
    // volpompen. list() op de map van deze inzending is goedkoop.
    const { data: bestaande } = await db.storage
      .from(BUCKET)
      .list(`${prefix}/${kind}`, { limit: MAX_PER_SUBMISSION + 1 });
    if ((bestaande?.length ?? 0) >= MAX_PER_SUBMISSION) {
      return NextResponse.json(
        { error: "Maximum aantal bestanden voor deze inzending bereikt." },
        { status: 400 },
      );
    }

    const path = `${prefix}/${kind}/${Date.now()}-${safeName(fileName)}`;
    const { data, error } = await db.storage
      .from(BUCKET)
      .createSignedUploadUrl(path);

    if (error || !data) {
      console.error("upload-url: createSignedUploadUrl faalde:", error?.message);
      return NextResponse.json(
        { error: "Upload voorbereiden mislukt. Probeer het opnieuw." },
        { status: 500 },
      );
    }
    return NextResponse.json({ signedUrl: data.signedUrl, path });
  } catch (e) {
    console.error("upload-url: onverwachte fout:", e);
    return NextResponse.json(
      { error: "Er ging iets mis. Probeer het later opnieuw." },
      { status: 500 },
    );
  }
}
