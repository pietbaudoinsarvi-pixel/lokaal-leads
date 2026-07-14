// Klant- of demo-config aanmaken. Drie modi:
//
//   1. PROSPECT-DEMO (voor de verkoop, geen aanlevering nodig):
//      npm run nieuwe-klant -- --demo "Bedrijfsnaam" "Plaats" [slug]
//      Maakt in seconden een demo-site voor een prospect: hun naam en plaats,
//      met de nette hovenier-teksten en demo-foto's als invulling. Demo's
//      zijn noindex en melden naar jou (operator). Daarna direct te printen
//      als post-kaart via /print/<slug>.
//
//   2. AANLEVERING uit Supabase (na akkoord van de klant):
//      npm run nieuwe-klant -- <submissionId> [slug]
//      Leest onboarding/<submissionId>/aanlevering.json, downloadt de foto's
//      naar public/photos/<slug>/ en genereert een complete config in de
//      juiste aanspreekvorm (u/je) met de merk-kleur uit het formulier en
//      automatisch berekende contrastkleuren (WCAG).
//
//   3. LOKAAL JSON-bestand (testen, of aanlevering buiten het formulier om):
//      npm run nieuwe-klant -- --lokaal pad/naar/aanlevering.json [slug]
//
// Dit is een OPERATOR-tool: het maakt een sterke eerste versie, jij maakt af.
// --force overschrijft een bestaande config.

import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const ROOT = fileURLToPath(new URL("..", import.meta.url));

// ---------- helpers ----------

function slugify(name) {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}

// WCAG-contrast: bepaalt of witte of donkere tekst op een kleur hoort.
function relLuminance(hex) {
  const n = hex.replace("#", "");
  const [r, g, b] = [0, 2, 4].map((i) => {
    const c = parseInt(n.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
function contrast(hexA, hexB) {
  const [l1, l2] = [relLuminance(hexA), relLuminance(hexB)].sort((a, b) => b - a);
  return (l1 + 0.05) / (l2 + 0.05);
}
function textOn(bgHex) {
  return contrast("#FFFFFF", bgHex) >= 4.5 ? "#FFFFFF" : "#1A1A1A";
}
function darken(hex, factor = 0.6) {
  const n = hex.replace("#", "");
  const ch = (i) =>
    Math.round(parseInt(n.slice(i, i + 2), 16) * factor)
      .toString(16)
      .padStart(2, "0");
  return `#${ch(0)}${ch(2)}${ch(4)}`.toUpperCase();
}

function normalizePhone(raw) {
  const digits = (raw ?? "").replace(/[^\d+]/g, "");
  if (!digits) return "";
  if (digits.startsWith("+")) return digits;
  if (digits.startsWith("0031")) return `+${digits.slice(2)}`;
  if (digits.startsWith("0")) return `+31${digits.slice(1)}`;
  return `+31${digits}`;
}

// Alle vrije tekst gaat via JSON.stringify de TS-file in: altijd geldige code.
const q = (s) => JSON.stringify(s ?? "");

function fail(...msg) {
  console.error(...msg);
  process.exit(1);
}

// ---------- invoer en modus ----------

const force = process.argv.includes("--force");
const args = process.argv.slice(2).filter((a) => a !== "--force");

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

let modus; // "demo" | "supabase" | "lokaal"
if (args[0] === "--demo") modus = "demo";
else if (args[0] === "--lokaal") modus = "lokaal";
else if (UUID_RE.test((args[0] ?? "").toLowerCase())) modus = "supabase";
else {
  fail(
    "Gebruik:\n" +
      '  npm run nieuwe-klant -- --demo "Bedrijfsnaam" "Plaats" [slug]\n' +
      "  npm run nieuwe-klant -- <submissionId> [slug]\n" +
      "  npm run nieuwe-klant -- --lokaal pad/naar/aanlevering.json [slug]\n" +
      "Het submissionId staat in de Telegram/WhatsApp-melding van de aanlevering.",
  );
}

// ---------- inzending + foto's per modus ----------

const isDemo = modus === "demo";
let inzending;
let lokaleFotos = [];
let logoLokaal = "";
let slug;
let bron; // voor de commentaarregel in de gegenereerde config

if (modus === "demo") {
  const naam = (args[1] ?? "").trim();
  const plaats = (args[2] ?? "").trim();
  if (!naam || !plaats) fail('Demo-modus: npm run nieuwe-klant -- --demo "Bedrijfsnaam" "Plaats" [slug]');
  slug = (args[3] ?? slugify(naam)).toLowerCase();
  bron = `prospect-demo (${new Date().toISOString().slice(0, 10)})`;
  inzending = {
    bedrijf: { naam, plaats, telefoon: "", email: "", werkgebied: `${plaats} en omstreken` },
    diensten: ["Tuinaanleg", "Tuinonderhoud", "Bestrating", "Beplanting"],
    over: { aanspreekvorm: "u", onderscheidend: "" },
    stijl: { kleur: "#1E4A33" },
    fotos: [],
    praktisch: {},
    meldingen: {},
    reviews: {},
  };
} else {
  if (modus === "supabase") {
    // Env laden (.env.local, BOM-tolerant zoals de rest van de codebase).
    const envPath = path.join(ROOT, ".env.local");
    if (existsSync(envPath)) {
      for (const rawLine of readFileSync(envPath, "utf8").split(/\r?\n/)) {
        const line = rawLine.replace(/^﻿/, "").trim();
        if (!line || line.startsWith("#")) continue;
        const eq = line.indexOf("=");
        if (eq === -1) continue;
        const key = line.slice(0, eq).trim();
        const value = line.slice(eq + 1).trim().replace(/^["']|["']$/g, "");
        if (!(key in process.env)) process.env[key] = value;
      }
    }
    const supabaseUrl = (process.env.SUPABASE_URL ?? "").replace(/^﻿/, "").trim();
    const supabaseKey = (process.env.SUPABASE_SERVICE_ROLE_KEY ?? "").replace(/^﻿/, "").trim();
    if (!supabaseUrl || !supabaseKey || supabaseUrl.includes("YOUR-PROJECT")) {
      fail("SUPABASE_URL en SUPABASE_SERVICE_ROLE_KEY niet (echt) ingevuld in .env.local.");
    }

    const { createClient } = await import("@supabase/supabase-js");
    const db = createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false } });
    const BUCKET = "onboarding";
    const submissionId = args[0].toLowerCase();
    bron = `aanlevering ${submissionId}`;

    console.log(`Aanlevering ${submissionId} ophalen...`);
    const { data: jsonBlob, error: jsonError } = await db.storage
      .from(BUCKET)
      .download(`${submissionId}/aanlevering.json`);
    if (jsonError || !jsonBlob) fail(`aanlevering.json niet gevonden: ${jsonError?.message ?? "onbekend"}`);
    inzending = JSON.parse(await jsonBlob.text());

    slug = (args[1] ?? slugify(inzending.bedrijf?.naam ?? "")).toLowerCase();
    if (!/^[a-z0-9-]+$/.test(slug) || !slug) fail(`Ongeldige slug "${slug}".`);

    // Foto's downloaden naar public/photos/<slug>/.
    const fotoDir = path.join(ROOT, "public", "photos", slug);
    mkdirSync(fotoDir, { recursive: true });
    const fotoPaden = Array.isArray(inzending.fotos) ? inzending.fotos : [];
    let i = 0;
    for (const storagePath of fotoPaden) {
      i += 1;
      const ext = path.extname(storagePath).toLowerCase() || ".webp";
      const naam = `foto-${String(i).padStart(2, "0")}${ext}`;
      const { data, error } = await db.storage.from(BUCKET).download(storagePath);
      if (error || !data) {
        console.warn(`  ! foto overgeslagen (${storagePath}): ${error?.message ?? "onbekend"}`);
        continue;
      }
      writeFileSync(path.join(fotoDir, naam), Buffer.from(await data.arrayBuffer()));
      lokaleFotos.push(`/photos/${slug}/${naam}`);
      console.log(`  foto ${i}/${fotoPaden.length}: ${naam}`);
    }
    if (inzending.stijl?.logoPath) {
      const ext = path.extname(inzending.stijl.logoPath).toLowerCase() || ".png";
      const { data } = await db.storage.from(BUCKET).download(inzending.stijl.logoPath);
      if (data) {
        writeFileSync(path.join(fotoDir, `logo${ext}`), Buffer.from(await data.arrayBuffer()));
        logoLokaal = `/photos/${slug}/logo${ext}`;
        console.log(`  logo: logo${ext}`);
      }
    }
  } else {
    // --lokaal: aanlevering.json van schijf, zonder foto-download.
    const jsonPad = args[1];
    if (!jsonPad || !existsSync(jsonPad)) fail("Lokaal bestand niet gevonden:", jsonPad ?? "(geen pad)");
    inzending = JSON.parse(readFileSync(jsonPad, "utf8").replace(/^﻿/, ""));
    bron = `lokaal bestand ${path.basename(jsonPad)}`;
    slug = (args[2] ?? slugify(inzending.bedrijf?.naam ?? "")).toLowerCase();
    if ((inzending.fotos ?? []).length > 0) {
      console.warn("Let op: foto's worden in --lokaal-modus niet gedownload; zet ze zelf in public/photos/" + slug + "/");
    }
  }
}

if (!/^[a-z0-9-]+$/.test(slug) || !slug) fail(`Ongeldige slug "${slug}". Geef er zelf een op.`);
const configPath = path.join(ROOT, "config", "clients", `${slug}.ts`);
if (existsSync(configPath) && !force) {
  fail(`config/clients/${slug}.ts bestaat al. Gebruik --force om te overschrijven.`);
}

// In demo-modus lenen we de foto's van de demo-hovenier: goed genoeg om de
// prospect zijn eigen site te laten voelen; eigen foto's komen na akkoord.
if (isDemo) {
  lokaleFotos = [
    "/photos/demo-hovenier/hero-tuin.webp",
    "/photos/demo-hovenier/over-ons-hovenier.webp",
    "/photos/demo-hovenier/tuin-overzicht.webp",
    "/photos/demo-hovenier/terras-tuinmeubels.webp",
    "/photos/demo-hovenier/gazon-maaien.webp",
    "/photos/demo-hovenier/haag.webp",
    "/photos/demo-hovenier/tuin-sfeer.webp",
    "/photos/demo-hovenier/beplanting-bloem-detail.webp",
  ];
}

// ---------- config opbouwen ----------

const bedrijf = inzending.bedrijf ?? {};
const je = inzending.over?.aanspreekvorm === "je";
// Kleine helper: kies de juiste aanspreekvorm in gegenereerde copy.
const V = (uTekst, jeTekst) => (je ? jeTekst : uTekst);

const primary = /^#[0-9a-fA-F]{6}$/.test(inzending.stijl?.kleur ?? "")
  ? inzending.stijl.kleur.toUpperCase()
  : "#1E4A33";
// Vast accent (terracotta) als startpunt: warm, werkt op vrijwel elke
// hoofdkleur. Aanpassen per klant mag altijd.
const accent = "#C0623A";

const plaats = bedrijf.plaats || "TODO-plaats";
const werkgebied = bedrijf.werkgebied || `${plaats} en omstreken`;
const telefoon = normalizePhone(bedrijf.telefoon);
const sinds = inzending.over?.sindsJaar ?? "";
const ervaringUsp = /^\d{4}$/.test(sinds)
  ? `Vakwerk sinds ${sinds}`
  : "Vakwerk met oog voor detail";

// Standaardbeschrijvingen per dienst uit het aanleverformulier. In demo-modus
// krijgen de vier kerndiensten de foto's van de demo-hovenier mee.
const dienstInfo = {
  Tuinaanleg: { icon: "🌿", demoImage: "/photos/demo-hovenier/tuinaanleg-gazon.webp", tekst: "Compleet ontwerp en aanleg van een nieuwe tuin, inclusief bestrating en beplanting." },
  Tuinonderhoud: { icon: "✂️", demoImage: "/photos/demo-hovenier/tuinonderhoud-snoeien.webp", tekst: "Snoeien, maaien, wieden en bemesten. Periodiek of eenmalig, geheel op maat." },
  Bestrating: { icon: "🧱", demoImage: "/photos/demo-hovenier/bestrating-tuinpad.webp", tekst: "Terrassen, opritten en paden, strak en waterpas gelegd." },
  Beplanting: { icon: "🌱", demoImage: "/photos/demo-hovenier/beplanting-borders.webp", tekst: V("Advies en aanplant van borders, hagen en bomen die passen bij uw tuin.", "Advies en aanplant van borders, hagen en bomen die passen bij je tuin.") },
  Snoeien: { icon: "🌳", tekst: "Vakkundig snoeiwerk voor bomen, hagen en heesters, in het juiste seizoen." },
  Gazon: { icon: "🌾", tekst: "Aanleg en herstel van gazons: zaaien, graszoden en bemesting." },
  "Schuttingen en vlonders": { icon: "🪵", tekst: "Schuttingen, vlonders en pergola's, stevig geplaatst en netjes afgewerkt." },
  Vijvers: { icon: "💧", tekst: "Aanleg en onderhoud van vijvers en waterpartijen." },
  Tuinontwerp: { icon: "✏️", tekst: V("Een doordacht tuinontwerp op maat van uw wensen en budget.", "Een doordacht tuinontwerp op maat van je wensen en budget.") },
};
const gekozenDiensten = (Array.isArray(inzending.diensten) ? inzending.diensten : []).slice(0, 6);
const serviceItems = gekozenDiensten.map((naam) => {
  const info = dienstInfo[naam] ?? { icon: "🔧", tekst: `TODO: korte omschrijving van ${naam}.` };
  const image = isDemo && info.demoImage ? `\n        image: ${q(info.demoImage)},` : "";
  return `      {
        title: ${q(naam)},
        description: ${q(info.tekst)},
        icon: ${q(info.icon)},${image}
      },`;
}).join("\n");

const galleryFotos = isDemo ? lokaleFotos.slice(2) : lokaleFotos.slice(0, 6);
const galleryItems = galleryFotos.slice(0, 6).map((f) => `        { image: ${q(f)} },`).join("\n");
const heroFoto = lokaleFotos[0] ?? "";
const aboutFoto = lokaleFotos[1] ?? heroFoto;

const overBody =
  [
    inzending.over?.onderscheidend,
    /^\d{4}$/.test(sinds) ? `Actief sinds ${sinds}.` : "",
    inzending.over?.teamgrootte ? `Team: ${inzending.over.teamgrootte}.` : "",
  ].filter(Boolean).join(" ") ||
  `${bedrijf.naam} is een lokaal hoveniersbedrijf in ${plaats}. Wij werken netjes, denken mee en leveren op afspraak.${isDemo ? "" : " (TODO: persoonlijk maken)"}`;

const extraKennis = [
  inzending.praktisch?.bereikbaarheid ? `Bereikbaarheid: ${inzending.praktisch.bereikbaarheid}.` : "",
  inzending.praktisch?.offerteWerkwijze ? `Werkwijze offertes: ${inzending.praktisch.offerteWerkwijze}.` : "",
  inzending.praktisch?.extraInfo ?? "",
].filter(Boolean).join(" ");

const googleLink = inzending.reviews?.googleLink || "https://g.page/r/PLAATS-HIER-DE-REVIEW-LINK/review";
const meldNummer = normalizePhone(inzending.meldingen?.nummer) || telefoon;

// Demo's melden naar de operator (env-gestuurd, net als demo-hovenier);
// echte klanten naar hun eigen WhatsApp-nummer.
const demoHeader = `import type { ClientConfig, NotifyChannel } from "../types";

const kanaal: NotifyChannel =
  (process.env.NOTIFY_CHANNEL ?? "").replace(/^\\uFEFF/, "").trim().toLowerCase() === "whatsapp"
    ? "whatsapp"
    : "telegram";
const target =
  kanaal === "whatsapp"
    ? (process.env.OPERATOR_WHATSAPP_NUMBER ?? "").replace(/^\\uFEFF/, "").trim()
    : (process.env.OPERATOR_TELEGRAM_CHAT_ID ?? "").replace(/^\\uFEFF/, "").trim();
`;

const operationalBlok = isDemo
  ? `  operational: {
    // Demo: meldingen naar de operator; kanaal en doel komen uit env.
    notifyChannel: kanaal,
    notifyTarget: target,
    googleReviewLink: "https://g.page/r/PLAATS-HIER-DE-REVIEW-LINK/review",
  },`
  : `  operational: {
    notifyChannel: "whatsapp",
    notifyTarget: ${q(meldNummer)},
    googleReviewLink: ${q(googleLink)},${googleLink.includes("PLAATS-HIER") ? " // TODO: echte reviewlink opvragen" : ""}
  },`;

const seoBlok = isDemo
  ? `  seo: {
    // Demo voor een prospect: niet in Google. Op true na akkoord en livegang.
    index: false,
    schemaType: "HomeAndConstructionBusiness",
    description: ${q(`Hovenier in ${plaats} voor ${gekozenDiensten.slice(0, 3).join(", ").toLowerCase()}. Gratis offerte, reactie binnen 1 werkdag.`)},
  },`
  : `  seo: {
    index: true,
    schemaType: "HomeAndConstructionBusiness",
    description: ${q(`${gekozenDiensten.slice(0, 3).join(", ")} in ${plaats} en omgeving door ${bedrijf.naam}. Gratis offerte, reactie binnen 1 werkdag.`)}, // TODO: max ~155 tekens
  },`;

const reviewsBlok = isDemo
  ? `    reviews: {
      // Voorbeeld-reviews om de sectie te laten zien; vervangen door echte
      // Google-reviews van de klant zodra die er zijn.
      heading: "Wat klanten zeggen",
      rating: 4.9,
      count: 38,
      source: "Google",
      items: [
        { quote: "Vakwerk, netjes en precies op afspraak. Onze tuin is prachtig geworden.", name: "Familie Jansen", location: ${q(plaats)} },
        { quote: "Snelle reactie, duidelijke offerte en een strak resultaat.", name: "M. de Boer", location: ${q(plaats)} },
        { quote: "Al jaren tevreden over het onderhoud. Betrouwbaar en ze denken mee.", name: "P. van Dijk", location: ${q(plaats)} },
      ],
    },`
  : `    // reviews: invullen zodra er echte Google-reviews zijn (rating, count, quotes).`;

const configTs = `${isDemo ? demoHeader : `import type { ClientConfig } from "../types";`}

// GEGENEREERD door scripts/nieuwe-klant.mjs uit ${bron}.
// Loop de TODO's na en maak de teksten persoonlijk.${modus === "supabase" ? `\n// De aangeleverde antwoorden staan in Supabase Storage: onboarding/${args[0].toLowerCase()}/.` : ""}

const config: ClientConfig = {
  slug: ${q(slug)},

  business: {
    name: ${q(bedrijf.naam)},
    tagline: ${q(`Vakkundig ${(gekozenDiensten[0] ?? "vakwerk").toLowerCase()} en meer in ${plaats} en omgeving`)},${isDemo ? "" : " // TODO: aanscherpen"}
    phone: ${q(telefoon)},${telefoon ? "" : " // TODO: telefoonnummer"}
    email: ${q(bedrijf.email)},
    city: ${q(plaats)},
    serviceArea: ${q(werkgebied)},
    ${bedrijf.kvk ? `kvk: ${q(bedrijf.kvk)},` : `// kvk: nog niet aangeleverd`}
    logoMark: "🌿",${logoLokaal ? ` // logo staat op ${logoLokaal} (nog niet in de sjabloon verwerkt)` : ""}
  },

  theme: {
    // Contrastkleuren automatisch berekend (tekst op primary ${contrast(textOn(primary), primary).toFixed(1)}:1, op accent ${contrast(textOn(accent), accent).toFixed(1)}:1).
    primary: ${q(primary)},
    accent: ${q(accent)},
    dark: ${q(darken(primary))},
    onPrimary: ${q(textOn(primary))},
    onAccent: ${q(textOn(accent))},
  },

  presentation: {
    hero: {
      heading: "Een tuin om trots op te zijn, zonder gedoe",${isDemo ? "" : " // TODO: persoonlijk maken"}
      subheading: "Van aanleg tot vast onderhoud. Betrouwbaar, netjes en op afspraak.",
      ctaLabel: "Vraag een offerte aan",
      imageSlot: "hero",
    },
    services: {
      heading: "Onze diensten",
      intro: ${q(V("Alles voor uw tuin, van ontwerp tot onderhoud.", "Alles voor je tuin, van ontwerp tot onderhoud."))},
      items: [
${serviceItems}
      ],
    },
    about: {
      heading: ${q(`Over ${bedrijf.naam}`)},
      body: ${q(overBody)},
      imageSlot: "about",
    },
    contact: {
      heading: "Vraag een vrijblijvende offerte aan",
      intro: ${q(V("Laat uw gegevens achter en wij bellen u binnen een werkdag terug.", "Laat je gegevens achter en we bellen je binnen een werkdag terug."))},
    },
    usps: [
      "Gratis offerte, reactie binnen 1 werkdag",
      ${q(ervaringUsp)},
      "Vast aanspreekpunt",
      ${q(`Werkgebied ${werkgebied}`)},
    ],
${galleryFotos.length > 0 ? `    gallery: {
      heading: "Een greep uit ons werk",
      items: [
${galleryItems}
      ],${isDemo ? "" : " // TODO: captions toevoegen en beste volgorde kiezen"}
    },` : `    // gallery: geen foto's aangeleverd`}
    process: {
      heading: "Zo werkt het",
      intro: "In drie heldere stappen, zonder gedoe en met een vast aanspreekpunt.",
      steps: [
        {
          title: "Kennismaking en offerte",
          description: ${q(V("U belt of laat uw gegevens achter. Wij komen vrijblijvend langs en maken een gratis offerte op maat.", "Je belt of laat je gegevens achter. We komen vrijblijvend langs en maken een gratis offerte op maat."))},
        },
        {
          title: "Plan en planning",
          description: ${q(V("U ontvangt een helder plan met een vaste prijs en een duidelijke planning. Geen verrassingen achteraf.", "Je krijgt een helder plan met een vaste prijs en een duidelijke planning. Geen verrassingen achteraf."))},
        },
        {
          title: "Uitvoering en nazorg",
          description: ${q(V("Wij voeren het werk netjes uit en ruimen alles op. Ook daarna kunt u op ons rekenen.", "We voeren het werk netjes uit en ruimen alles op. Ook daarna kun je op ons rekenen."))},
        },
      ],
    },
${reviewsBlok}
    cta: {
      home: {
        heading: "Klaar voor een tuin om trots op te zijn?",
        body: ${q(V("Vraag vrijblijvend een offerte aan. Wij bellen u binnen een werkdag terug.", "Vraag vrijblijvend een offerte aan. We bellen je binnen een werkdag terug."))},
      },
      about: {
        heading: ${q(V("Benieuwd wat wij voor uw tuin kunnen doen?", "Benieuwd wat we voor je tuin kunnen doen?"))},
        body: "Neem contact op voor een vrijblijvend gesprek.",
      },
    },
    photos: {
      hero: ${q(heroFoto)},${isDemo ? "" : ` // TODO: mooiste brede foto kiezen uit /photos/${slug}/`}
      about: ${q(aboutFoto)},
    },
  },

  ai: {
    tone: ${q(V("Vriendelijk, deskundig en to-the-point. Spreekt de bezoeker met 'u' aan.", "Vriendelijk, deskundig en to-the-point. Spreekt de bezoeker met 'je' aan."))},
    services: [${gekozenDiensten.map((d) => q(d.toLowerCase())).join(", ")}],
    serviceArea: ${q(werkgebied)},
    faq: [
      {
        q: "Werken jullie ook in mijn omgeving?",
        a: ${q(V(`Wij werken in ${werkgebied}. Twijfelt u? Vraag het gerust.`, `We werken in ${werkgebied}. Twijfel je? Vraag het gerust.`))},
      },
      {
        q: "Kan ik een vrijblijvende offerte krijgen?",
        a: ${q(V("Zeker. Laat uw naam en telefoonnummer achter, dan plannen wij een gratis kennismaking in.", "Zeker. Laat je naam en telefoonnummer achter, dan plannen we een gratis kennismaking in."))},
      },
      {
        q: "Doen jullie ook periodiek onderhoud?",
        a: ${q(V("Ja, wij verzorgen periodiek onderhoud op maat: wekelijks, maandelijks of per seizoen.", "Ja, we verzorgen periodiek onderhoud op maat: wekelijks, maandelijks of per seizoen."))},
      },
    ],
    ${extraKennis ? `extraKnowledge: ${q(extraKennis)},` : `// extraKnowledge: geen praktische info aangeleverd`}
  },

${seoBlok}

${operationalBlok}
};

export default config;
`;

writeFileSync(configPath, configTs, "utf8");

console.log(`\nKlaar!`);
console.log(`  config:  config/clients/${slug}.ts`);
if (modus === "supabase") {
  console.log(`  foto's:  public/photos/${slug}/ (${lokaleFotos.length} stuks${logoLokaal ? " + logo" : ""})`);
}
if (isDemo) {
  console.log(`  foto's:  demo-hovenier-foto's (eigen foto's komen na akkoord via /onboarding)`);
}
console.log(`\nVolgende stappen:`);
console.log(`  1. npm run typecheck en npm run dev, bekijk http://localhost:3000/${slug}`);
console.log(`  2. Loop de teksten na${isDemo ? "" : " (zoek op TODO)"} en kies de beste foto-volgorde.`);
console.log(`  3. Post-kaart printen: http://localhost:3000/print/${slug}`);
