"use client";

import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";
import { agency } from "@/config/agency";

// Aanleverformulier voor nieuwe klanten. Foto's gaan RECHTSTREEKS van de
// browser naar Supabase Storage via signed upload-URLs (grote bestanden lopen
// dus niet door onze serverless-functies). Uploads lopen via XMLHttpRequest
// zodat we voortgang kunnen tonen en kunnen annuleren; maximaal 3 tegelijk.
// Daarna gaat het formulier zelf als JSON naar /api/onboarding.

const DIENSTEN = agency.onboardingDiensten;

const MAX_FOTOS = 60;
const MAX_SIZE = 15 * 1024 * 1024; // na verkleinen
const MAX_ORIGINEEL = 60 * 1024 * 1024; // harde bovengrens op het origineel
const MAX_TEGELIJK = 3;

// Foto's vóór het uploaden in de browser verkleinen en omzetten naar WebP:
// telefoontfoto's van 4-8 MB worden zo een paar honderd KB zonder zichtbaar
// kwaliteitsverlies, en WebP is precies het formaat dat de klant-sites zelf
// serveren (direct bruikbaar dus). Safari kan geen WebP encoderen en valt
// automatisch terug op JPEG. Lukt decoderen helemaal niet (exotisch
// formaat), dan gaat het origineel door.
const MAX_AFMETING = 2560; // langste zijde in pixels
const BEELD_KWALITEIT = 0.85;

function naarBlob(
  canvas: HTMLCanvasElement,
  type: string,
  kwaliteit: number,
): Promise<Blob | null> {
  return new Promise<Blob | null>((res) =>
    canvas.toBlob(res, type, kwaliteit),
  ).then((blob) =>
    // Browsers die het type niet kunnen encoderen vallen stil terug op PNG;
    // dat merken we hier en behandelen we als "niet gelukt".
    blob && blob.type === type ? blob : null,
  );
}

async function comprimeer(
  file: File,
): Promise<{ blob: Blob; type: string; name: string }> {
  const origineel = {
    blob: file as Blob,
    type: file.type || "image/jpeg",
    name: file.name,
  };
  try {
    const bitmap = await createImageBitmap(file, {
      imageOrientation: "from-image",
    });
    const schaal = Math.min(
      1,
      MAX_AFMETING / Math.max(bitmap.width, bitmap.height),
    );
    const w = Math.max(1, Math.round(bitmap.width * schaal));
    const h = Math.max(1, Math.round(bitmap.height * schaal));
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return origineel;
    ctx.drawImage(bitmap, 0, 0, w, h);
    bitmap.close();

    const basis = file.name.replace(/\.[^.]+$/, "");
    let blob = await naarBlob(canvas, "image/webp", BEELD_KWALITEIT);
    let naam = `${basis}.webp`;
    if (!blob) {
      blob = await naarBlob(canvas, "image/jpeg", BEELD_KWALITEIT);
      naam = `${basis}.jpg`;
    }
    if (blob && blob.size < file.size) {
      return { blob, type: blob.type, name: naam };
    }
    return origineel;
  } catch {
    return origineel;
  }
}

// Fallback voor heel oude browsers zonder crypto.randomUUID: wel random,
// zodat inzenders nooit dezelfde Storage-map delen.
function makeSubmissionId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  const hex = () => Math.floor(Math.random() * 16).toString(16);
  return "xxxxxxxx-xxxx-4xxx-8xxx-xxxxxxxxxxxx".replace(/x/g, hex);
}

interface FotoItem {
  key: string;
  name: string;
  status: "wachtrij" | "bezig" | "klaar" | "fout";
  progress: number; // 0-100, alleen relevant bij status "bezig"
  path?: string;
  error?: string;
}

type Status = "invullen" | "versturen" | "klaar" | "fout";

export default function OnboardingForm({ prefillBedrijf = "" }: { prefillBedrijf?: string }) {
  const [submissionId] = useState(makeSubmissionId);
  const [fotos, setFotos] = useState<FotoItem[]>([]);
  const [logo, setLogo] = useState<FotoItem | null>(null);
  const [fotoMelding, setFotoMelding] = useState("");
  const [status, setStatus] = useState<Status>("invullen");
  const [error, setError] = useState("");
  const [aangeraakt, setAangeraakt] = useState(false);
  const inFlight = useRef(false);
  const keyCounter = useRef(0);
  // Originele File-objecten (voor opnieuw proberen) en lopende requests
  // (voor annuleren) staan buiten de render-state.
  const filesRef = useRef(new Map<string, File>());
  const xhrRef = useRef(new Map<string, XMLHttpRequest>());
  const queueRef = useRef<string[]>([]);
  const activeRef = useRef(0);
  // Actuele logo-selectie, zodat een trage oude upload een nieuwere keuze
  // niet kan overschrijven (state-race).
  const logoKeyRef = useRef<string>("");

  // Waarschuw bij wegklikken zolang er iets is ingevuld of geupload en de
  // inzending nog niet verstuurd is.
  const dirty = status !== "klaar" && (aangeraakt || fotos.length > 0 || logo !== null);
  useEffect(() => {
    if (!dirty) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty]);

  // Bij unmount alle lopende uploads afbreken.
  useEffect(() => {
    const xhrs = xhrRef.current;
    return () => {
      for (const xhr of xhrs.values()) xhr.abort();
      xhrs.clear();
    };
  }, []);

  function updateFoto(key: string, patch: Partial<FotoItem>) {
    // Functionele update: als de foto intussen verwijderd is, gebeurt er niets.
    setFotos((prev) => prev.map((f) => (f.key === key ? { ...f, ...patch } : f)));
  }

  async function vraagUploadUrl(
    meta: { name: string; type: string; size: number },
    kind: "fotos" | "logo",
  ) {
    const res = await fetch("/api/onboarding/upload-url", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        submissionId,
        fileName: meta.name,
        contentType: meta.type || "image/jpeg",
        size: meta.size,
        kind,
      }),
    });
    const data = (await res.json().catch(() => ({}))) as {
      signedUrl?: string;
      path?: string;
      error?: string;
    };
    if (!res.ok || !data.signedUrl || !data.path) {
      throw new Error(data.error ?? "Upload voorbereiden mislukt.");
    }
    return { signedUrl: data.signedUrl, path: data.path };
  }

  function xhrPut(
    url: string,
    blob: Blob,
    contentType: string,
    key: string,
    onProgress: (pct: number) => void,
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhrRef.current.set(key, xhr);
      xhr.open("PUT", url);
      xhr.setRequestHeader("content-type", contentType || "image/jpeg");
      xhr.upload.onprogress = (ev) => {
        if (ev.lengthComputable) {
          onProgress(Math.round((ev.loaded / ev.total) * 100));
        }
      };
      xhr.onload = () => {
        xhrRef.current.delete(key);
        if (xhr.status >= 200 && xhr.status < 300) resolve();
        else reject(new Error(`Upload mislukt (${xhr.status}).`));
      };
      xhr.onerror = () => {
        xhrRef.current.delete(key);
        reject(new Error("Netwerkfout tijdens uploaden."));
      };
      xhr.onabort = () => {
        xhrRef.current.delete(key);
        reject(new Error("Upload afgebroken."));
      };
      xhr.send(blob);
    });
  }

  // Wachtrij: maximaal MAX_TEGELIJK foto-uploads tegelijk. Elke worker
  // verkleint eerst (in de browser) en uploadt daarna het resultaat.
  async function verwerkFoto(key: string, file: File): Promise<void> {
    const { blob, type, name } = await comprimeer(file);
    if (blob.size > MAX_SIZE) {
      throw new Error("Ook na verkleinen groter dan 15 MB.");
    }
    const { signedUrl, path } = await vraagUploadUrl(
      { name, type, size: blob.size },
      "fotos",
    );
    await xhrPut(signedUrl, blob, type, key, (pct) =>
      updateFoto(key, { progress: pct }),
    );
    updateFoto(key, { status: "klaar", progress: 100, path });
  }

  function pomp() {
    while (activeRef.current < MAX_TEGELIJK && queueRef.current.length > 0) {
      const key = queueRef.current.shift()!;
      const file = filesRef.current.get(key);
      if (!file) continue; // intussen verwijderd
      activeRef.current++;
      updateFoto(key, { status: "bezig", progress: 0, error: undefined });
      verwerkFoto(key, file)
        .catch((err: unknown) =>
          updateFoto(key, {
            status: "fout",
            error: err instanceof Error ? err.message : "Upload mislukt",
          }),
        )
        .finally(() => {
          activeRef.current--;
          pomp();
        });
    }
  }

  function onFotosChange(e: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    e.target.value = ""; // zelfde bestand later opnieuw kunnen kiezen
    const ruimte = MAX_FOTOS - fotos.length;
    if (files.length > ruimte) {
      setFotoMelding(
        ruimte <= 0
          ? `Het maximum van ${MAX_FOTOS} foto's is bereikt. Verwijder eerst een foto om een andere toe te voegen.`
          : `Er passen nog ${ruimte} foto's bij (maximum ${MAX_FOTOS}); de rest is niet toegevoegd.`,
      );
    } else if (files.length > 0) {
      setFotoMelding("");
    }
    files.slice(0, Math.max(0, ruimte)).forEach((file) => {
      const key = `f${keyCounter.current++}`;
      if (file.size > MAX_ORIGINEEL) {
        setFotos((prev) => [
          ...prev,
          { key, name: file.name, status: "fout", progress: 0, error: "Bestand is te groot" },
        ]);
        return;
      }
      filesRef.current.set(key, file);
      setFotos((prev) => [
        ...prev,
        { key, name: file.name, status: "wachtrij", progress: 0 },
      ]);
      queueRef.current.push(key);
    });
    pomp();
  }

  function verwijderFoto(key: string) {
    xhrRef.current.get(key)?.abort(); // lopende upload direct afbreken
    queueRef.current = queueRef.current.filter((k) => k !== key);
    filesRef.current.delete(key);
    setFotos((prev) => prev.filter((f) => f.key !== key));
  }

  function opnieuwFoto(key: string) {
    if (!filesRef.current.has(key)) return;
    updateFoto(key, { status: "wachtrij", progress: 0, error: undefined });
    queueRef.current.push(key);
    pomp();
  }

  function onLogoChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    // Eerdere logo-upload afbreken; die mag deze keuze niet overschrijven.
    if (logoKeyRef.current) xhrRef.current.get(logoKeyRef.current)?.abort();
    const key = `logo${keyCounter.current++}`;
    logoKeyRef.current = key;
    if (file.size > MAX_SIZE) {
      setLogo({ key, name: file.name, status: "fout", progress: 0, error: "Groter dan 15 MB" });
      return;
    }
    setLogo({ key, name: file.name, status: "bezig", progress: 0 });
    const zetLogo = (patch: Partial<FotoItem>) => {
      if (logoKeyRef.current !== key) return; // inmiddels ander logo gekozen
      setLogo((prev) => (prev && prev.key === key ? { ...prev, ...patch } : prev));
    };
    // Logo NIET verkleinen: PNG-transparantie moet intact blijven.
    vraagUploadUrl(
      { name: file.name, type: file.type || "image/png", size: file.size },
      "logo",
    )
      .then(({ signedUrl, path }) =>
        xhrPut(signedUrl, file, file.type || "image/png", key, (pct) =>
          zetLogo({ progress: pct }),
        ).then(() => zetLogo({ status: "klaar", progress: 100, path })),
      )
      .catch((err: unknown) =>
        zetLogo({
          status: "fout",
          error: err instanceof Error ? err.message : "Upload mislukt",
        }),
      );
  }

  const bezig =
    fotos.some((f) => f.status === "bezig" || f.status === "wachtrij") ||
    logo?.status === "bezig";
  const geslaagd = fotos.filter((f) => f.status === "klaar");
  const mislukt = fotos.filter((f) => f.status === "fout");

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (inFlight.current || bezig) return;
    inFlight.current = true;
    setStatus("versturen");
    setError("");
    const data = new FormData(e.currentTarget);
    try {
      const res = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          submissionId,
          bedrijfsnaam: data.get("bedrijfsnaam"),
          contactpersoon: data.get("contactpersoon"),
          telefoon: data.get("telefoon"),
          email: data.get("email"),
          plaats: data.get("plaats"),
          werkgebied: data.get("werkgebied"),
          kvk: data.get("kvk"),
          huidigeWebsite: data.get("huidigeWebsite"),
          diensten: data.getAll("diensten"),
          dienstenAnders: data.get("dienstenAnders"),
          sindsJaar: data.get("sindsJaar"),
          teamgrootte: data.get("teamgrootte"),
          onderscheidend: data.get("onderscheidend"),
          aanspreekvorm: data.get("aanspreekvorm"),
          kleur: data.get("kleur"),
          kleurToelichting: data.get("kleurToelichting"),
          logoPath: logo?.status === "klaar" ? logo.path : "",
          fotos: geslaagd.map((f) => f.path),
          bereikbaarheid: data.get("bereikbaarheid"),
          offerteWerkwijze: data.get("offerteWerkwijze"),
          extraInfo: data.get("extraInfo"),
          meldingenNummer: data.get("meldingenNummer"),
          googleLink: data.get("googleLink"),
          akkoord: data.get("akkoord") === "on",
        }),
      });
      const json = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        error?: string;
      };
      if (res.ok && json.ok) {
        setStatus("klaar");
        window.scrollTo({ top: 0 });
      } else {
        setStatus("fout");
        setError(json.error ?? "Er ging iets mis. Probeer het later opnieuw.");
      }
    } catch {
      setStatus("fout");
      setError("Versturen mislukt. Controleer je verbinding en probeer het opnieuw.");
    } finally {
      inFlight.current = false;
    }
  }

  if (status === "klaar") {
    return (
      <div className="ob-done" role="status">
        <div className="ob-done__icon" aria-hidden="true">✓</div>
        <h2>Alles ontvangen, dank je wel!</h2>
        <p>
          Ik ga met je materiaal aan de slag en laat je weten zodra je website
          klaarstaat om te bekijken. Foto's vergeten of nog iets aanvullen?
          Stuur ze gerust na via WhatsApp of e-mail.
        </p>
      </div>
    );
  }

  function fotoStatusTekst(f: FotoItem): string {
    switch (f.status) {
      case "wachtrij":
        return "In de wachtrij...";
      case "bezig":
        return `Bezig... ${f.progress}%`;
      case "klaar":
        return "✓ Geupload";
      case "fout":
        return `Mislukt: ${f.error}`;
    }
  }

  return (
    <form className="ob-form" onSubmit={submit} onChange={() => setAangeraakt(true)}>
      <p className="sr-only" aria-live="polite" role="status">
        {bezig ? "Foto's worden geupload." : ""}
      </p>

      <fieldset className="ob-section">
        <legend>1. Je bedrijf</legend>
        <div className="ob-grid">
          <label className="ob-field">
            <span>Bedrijfsnaam *</span>
            <input
              name="bedrijfsnaam"
              required
              defaultValue={prefillBedrijf}
              autoComplete="organization"
              placeholder="Bijv. Hoveniersbedrijf Jansen"
            />
          </label>
          <label className="ob-field">
            <span>Je naam *</span>
            <input name="contactpersoon" required autoComplete="name" placeholder="Voor- en achternaam" />
          </label>
          <label className="ob-field">
            <span>Telefoonnummer *</span>
            <input name="telefoon" required type="tel" inputMode="tel" autoComplete="tel" placeholder="06 12 34 56 78" />
          </label>
          <label className="ob-field">
            <span>E-mailadres</span>
            <input name="email" type="email" autoComplete="email" placeholder="naam@bedrijf.nl" />
          </label>
          <label className="ob-field">
            <span>Plaats *</span>
            <input name="plaats" required placeholder="Bijv. Utrecht" />
          </label>
          <label className="ob-field">
            <span>Werkgebied</span>
            <input name="werkgebied" placeholder="Bijv. Utrecht en omstreken, 25 km" />
          </label>
          <label className="ob-field">
            <span>KVK-nummer</span>
            <input name="kvk" inputMode="numeric" placeholder="12345678" />
          </label>
          <label className="ob-field">
            <span>Huidige website (als je die hebt)</span>
            <input name="huidigeWebsite" placeholder="www.voorbeeld.nl" />
          </label>
        </div>
      </fieldset>

      <fieldset className="ob-section">
        <legend>2. Je diensten</legend>
        <p className="ob-hint">Vink aan wat je doet. Dit worden de diensten op je site.</p>
        <div className="ob-checks">
          {DIENSTEN.map((d) => (
            <label className="ob-check" key={d}>
              <input type="checkbox" name="diensten" value={d} />
              <span>{d}</span>
            </label>
          ))}
        </div>
        <label className="ob-field">
          <span>Iets anders of een specialiteit?</span>
          <input name="dienstenAnders" placeholder="Bijv. daktuinen, beregening, boomverzorging" />
        </label>
      </fieldset>

      <fieldset className="ob-section">
        <legend>3. Over je bedrijf</legend>
        <div className="ob-grid">
          <label className="ob-field">
            <span>Actief sinds (jaartal)</span>
            <input name="sindsJaar" inputMode="numeric" placeholder="Bijv. 2010" />
          </label>
          <label className="ob-field">
            <span>Hoe groot is je team?</span>
            <select name="teamgrootte" defaultValue="">
              <option value="" disabled>Maak een keuze</option>
              <option value="alleen ik">Alleen ik</option>
              <option value="2-5">2 tot 5 mensen</option>
              <option value="6-10">6 tot 10 mensen</option>
              <option value="10+">Meer dan 10</option>
            </select>
          </label>
        </div>
        <label className="ob-field">
          <span>Wat maakt jouw bedrijf anders dan de rest?</span>
          <textarea
            name="onderscheidend"
            rows={3}
            placeholder="Bijv. 15 jaar ervaring, altijd zelf op de klus, afspraak is afspraak"
          />
        </label>
        <fieldset className="ob-subfieldset">
          <legend>Hoe spreek je je klanten aan op de site?</legend>
          <div className="ob-radios">
            <label className="ob-check">
              <input type="radio" name="aanspreekvorm" value="u" defaultChecked />
              <span>Met &quot;u&quot; (netjes)</span>
            </label>
            <label className="ob-check">
              <input type="radio" name="aanspreekvorm" value="je" />
              <span>Met &quot;je&quot; (informeel)</span>
            </label>
          </div>
        </fieldset>
      </fieldset>

      <fieldset className="ob-section">
        <legend>4. Stijl en logo</legend>
        <div className="ob-grid">
          <label className="ob-field ob-field--color">
            <span>Voorkeurskleur</span>
            <input name="kleur" type="color" defaultValue="#1E4A33" />
          </label>
          <label className="ob-field">
            <span>Toelichting op stijl of kleur</span>
            <input name="kleurToelichting" placeholder="Bijv. donkergroen zoals mijn bus" />
          </label>
        </div>
        <div className="ob-field">
          <span>Logo (als je dat hebt)</span>
          <label className="ob-upload ob-upload--klein">
            <input type="file" accept="image/*" onChange={onLogoChange} />
            <span>Kies je logobestand</span>
          </label>
          {logo && (
            <ul className="ob-files">
              <li className={`ob-file ob-file--${logo.status}`}>
                <span className="ob-file__name">{logo.name}</span>
                <span className="ob-file__status">{fotoStatusTekst(logo)}</span>
                {logo.status === "bezig" && (
                  <span className="ob-file__bar" style={{ width: `${logo.progress}%` }} aria-hidden="true" />
                )}
              </li>
            </ul>
          )}
        </div>
      </fieldset>

      <fieldset className="ob-section ob-section--fotos">
        <legend>5. Foto&apos;s van je werk</legend>
        <p className="ob-hint">
          Dit is het belangrijkste onderdeel: jouw foto&apos;s maken de site.
          Upload ze gewoon vanaf je telefoon.
        </p>
        <ul className="ob-tips">
          <li>Minimaal 8 foto&apos;s, meer mag altijd (tot {MAX_FOTOS})</li>
          <li>Opgeleverd werk doet het het best</li>
          <li>Ook mooi: jijzelf of je team aan het werk</li>
          <li>Liggende foto&apos;s werken het mooist</li>
          <li>Grote foto&apos;s verkleinen we automatisch, uploaden blijft snel</li>
        </ul>
        <label className="ob-upload">
          <input type="file" accept="image/*" multiple onChange={onFotosChange} />
          <span>📷 Kies foto&apos;s</span>
        </label>
        {fotoMelding && (
          <p className="ob-hint ob-hint--warn" role="status">{fotoMelding}</p>
        )}
        {fotos.length > 0 && (
          <ul className="ob-files">
            {fotos.map((f) => (
              <li className={`ob-file ob-file--${f.status}`} key={f.key}>
                <span className="ob-file__name">{f.name}</span>
                <span className="ob-file__status">{fotoStatusTekst(f)}</span>
                {f.status === "fout" && filesRef.current.has(f.key) && (
                  <button
                    type="button"
                    className="ob-file__retry"
                    onClick={() => opnieuwFoto(f.key)}
                  >
                    Opnieuw
                  </button>
                )}
                <button
                  type="button"
                  className="ob-file__remove"
                  onClick={() => verwijderFoto(f.key)}
                  aria-label={`Verwijder ${f.name}`}
                >
                  ✕
                </button>
                {f.status === "bezig" && (
                  <span className="ob-file__bar" style={{ width: `${f.progress}%` }} aria-hidden="true" />
                )}
              </li>
            ))}
          </ul>
        )}
        <p className="ob-hint">
          {geslaagd.length} foto{geslaagd.length === 1 ? "" : "'s"} geupload.
          {mislukt.length > 0 &&
            ` ${mislukt.length} mislukt; probeer die opnieuw of stuur ze later na.`}{" "}
          Geen foto&apos;s bij de hand? Je kunt ze ook later via WhatsApp nasturen.
        </p>
      </fieldset>

      <fieldset className="ob-section">
        <legend>6. Praktische informatie</legend>
        <label className="ob-field">
          <span>Wanneer ben je bereikbaar?</span>
          <input name="bereikbaarheid" placeholder="Bijv. ma t/m za van 7 tot 18 uur" />
        </label>
        <label className="ob-field">
          <span>Hoe werkt een offerte bij jou?</span>
          <input
            name="offerteWerkwijze"
            placeholder="Bijv. gratis, ik kom eerst langs om te kijken"
          />
        </label>
        <label className="ob-field">
          <span>Wat moet de website-assistent verder weten?</span>
          <textarea
            name="extraInfo"
            rows={3}
            placeholder="Alles wat klanten vaak vragen: prijzen, wachttijd, werkwijze, garantie"
          />
        </label>
      </fieldset>

      <fieldset className="ob-section">
        <legend>7. Meldingen en reviews</legend>
        <label className="ob-field">
          <span>Op welk mobiel nummer wil je nieuwe aanvragen ontvangen?</span>
          <input
            name="meldingenNummer"
            type="tel"
            inputMode="tel"
            placeholder="Laat leeg als het hetzelfde is als hierboven"
          />
        </label>
        <label className="ob-field">
          <span>Link naar je Google-bedrijfsprofiel (als je die hebt)</span>
          <input name="googleLink" placeholder="Geen? Dan regelen we dat samen." />
        </label>
      </fieldset>

      <label className="ob-check ob-akkoord">
        <input type="checkbox" name="akkoord" required />
        <span>
          Ik geef toestemming om de aangeleverde foto&apos;s en teksten op mijn
          website te gebruiken. *
        </span>
      </label>

      {status === "fout" && (
        <p className="ob-error" role="alert">{error}</p>
      )}

      <button
        type="submit"
        className="ob-submit"
        disabled={status === "versturen" || bezig}
      >
        {status === "versturen"
          ? "Versturen..."
          : bezig
            ? "Even wachten, foto's uploaden nog..."
            : "Alles versturen"}
      </button>
      <p className="ob-hint ob-hint--center">
        Kom je ergens niet uit? Sla het over, dan nemen we het samen door.
      </p>
    </form>
  );
}
