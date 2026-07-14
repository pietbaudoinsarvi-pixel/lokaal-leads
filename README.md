# Websitemannetje (repo: lokaal-leads)

Geproductiseerde websites met een slimme backend voor lokale vakmensen
(start-niche: hoveniers). De website is de haak; de waarde zit in de
backend: elke aanvraag komt direct als melding op de telefoon van de
eigenaar, en na elke klus gaat er automatisch een Google-review-verzoek uit.

**Kern-principe:** er is EEN niche-sjabloon en per klant alleen een
configbestand. Een nieuwe klant toevoegen = een nieuw bestand in
`/config/clients/<slug>.ts`. Nooit nieuwe paginacode of layout per klant.

Live: [lokaal-leads.vercel.app](https://lokaal-leads.vercel.app)
(eigen merk-site) en `/demo-hovenier` (klant-demo).

## Wat er is (alles werkend en live)

| Onderdeel | Waar |
|---|---|
| Eigen merk-site (Websitemannetje) met ingebedde demo en demo-aanvraagformulier | `/` (content in `config/agency.ts`) |
| Klant-sjabloonsite uit config (home, diensten, over, contact + reviews, werkwijze, FAQ) | `/[client]`, componenten in `components/site` |
| Lead-pijplijn: event (idempotent) -> lead -> synchrone melding met retry + operator-alert | `POST /api/lead`, `lib/leads`, `lib/notify` |
| AI-chatwidget (server-side Claude, streaming, capture_lead naar dezelfde pijplijn) | `POST /api/chat`, `components/ChatWidget.tsx` |
| Review-verzoek met Google-link uit config, gelogd in `review_requests` | `POST /api/review-request`, `lib/messaging` |
| Aanleverformulier voor klanten (foto's direct naar Supabase Storage, browser-compressie naar WebP) | `/onboarding`, `app/api/onboarding` |
| Meldingen via WhatsApp met Telegram-fallback | `lib/notify/whatsapp.ts`, zie `SETUP-WHATSAPP.md` |
| Klant/demo-generator (config + foto's uit een aanlevering of alleen naam+plaats) | `npm run nieuwe-klant`, `scripts/nieuwe-klant.mjs` |
| Printbare A5-postkaart met QR naar de demo (voor de legale post-route) | `/print/[client]` |
| SEO: sitemap, robots.txt, JSON-LD LocalBusiness, canonicals, noindex-vlag per klant | `app/sitemap.ts`, `app/robots.ts`, `config.seo` |
| Operator-testpagina's | `/lead-test`, `/review-test` |

## Setup

1. `npm install`
2. **Supabase:** project aanmaken, `supabase/schema.sql` uitvoeren in de SQL
   Editor. De storage-bucket `onboarding` maakt de app zelf aan.
3. **Meldkanaal:** WhatsApp instellen volgens `SETUP-WHATSAPP.md`
   (quick-start of Meta Cloud API), of Telegram: bot via @BotFather,
   chat_id via @userinfobot.
4. `cp .env.example .env.local` en vullen:
   - `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`
   - `ANTHROPIC_API_KEY` (AI-chat), optioneel `ANTHROPIC_MODEL`
   - Telegram: `TELEGRAM_BOT_TOKEN`, `OPERATOR_TELEGRAM_CHAT_ID`
   - WhatsApp: zie `SETUP-WHATSAPP.md` (`NOTIFY_CHANNEL=whatsapp`,
     `OPERATOR_WHATSAPP_NUMBER`, en Cloud API- of CallMeBot-vars)
5. `npm run dev` en testen: `/lead-test` hoort binnen seconden een melding
   op je telefoon te geven.

**Idempotentie testen:** dezelfde lead twee keer snel versturen geeft de
tweede keer `{"ok":true,"duplicate":true}` zonder tweede melding
(5-minuten-venster).

**Fallback testen:** zet een kapot WhatsApp-token; de melding komt dan via
Telegram. Kapot allebei? De response blijft `ok:true` (lead nooit verloren)
en `deliveries` logt `failed`.

## Een nieuwe klant toevoegen

**Prospect-demo (verkoop, kost een minuut):**

```
npm run nieuwe-klant -- --demo "Bedrijfsnaam" "Plaats"
```

Maakt `config/clients/<slug>.ts` met de naam en plaats van de prospect,
demo-foto's en voorbeeld-reviews, noindex, meldingen naar jou. Bekijken op
`/<slug>`, dan `vercel --prod` en de postkaart printen via `/print/<slug>`
(A5, met QR naar de demo en de verplichte afmeldregel voor geadresseerde
post).

**Na akkoord (klant heeft `/onboarding?bedrijf=Naam` ingevuld):**

```
npm run nieuwe-klant -- <submissionId> [slug] --force
```

Het submissionId staat in de melding op je telefoon. Het script downloadt
alle foto's naar `public/photos/<slug>/`, en genereert een complete config
in de gekozen aanspreekvorm (u/je) met de merkkleur uit het formulier en
automatisch berekende contrastkleuren. Daarna: TODO's in de config nalopen,
`seo.index` staat aan, `notifyChannel`/`notifyTarget` staan op het
WhatsApp-nummer van de klant. Er is ook `--lokaal pad/naar/aanlevering.json`
voor een aanlevering buiten het formulier om.

Handmatig kan ook nog steeds: kopieer `config/clients/demo-hovenier.ts` en
pas alles aan. Geen code, geen registratie: de sitemap en de site pikken elk
configbestand automatisch op.

## Deploy

Handmatig: `vercel --prod` (de Vercel-GitHub-koppeling voor auto-deploy
staat nog open). Env-vars staan in Vercel onder Settings > Environment
Variables; let op de BOM-gotcha hieronder.

## Architectuur-principes

1. **Alles wordt eerst een event.** Melding en CRM-record komen uit dezelfde bron.
2. **Idempotentie** via `dedup_key` (hash van klant + telefoon + bericht + 5-min-venster).
3. **Melding is synchroon** in dezelfde request (poging + retry), gelogd in `deliveries`. Faalt alles, dan operator-alert; de request geeft altijd succes terug zodat er nooit een lead verloren gaat.
4. **Notifier en MessageSender zijn interfaces** (`lib/notify`, `lib/messaging`). WhatsApp (Meta Cloud API of CallMeBot) en Telegram zijn echt; SMS/e-mail zijn stubs. Kanaal per klant via config, operator-kanaal via env.
5. **Config is de bron van waarheid per klant** (`/config/clients`); eigen merk-content in `config/agency.ts`. Supabase bevat alleen runtime-data per `client_slug`.

## Gotcha's

- **PowerShell BOM:** PowerShell 5.1 plakt een BOM (U+FEFF) voor waarden bij
  `vercel env add` via een pipe. Alle env-reads in de code strippen die,
  maar zet env-vars het liefst via het Vercel-dashboard.
- **Supabase keys:** nieuwe vorm `sb_secret_...` (server) en
  `sb_publishable_...` (client); `SUPABASE_URL` is de kale
  `https://<ref>.supabase.co` zonder `/rest/v1/`.

## Nog niet gebouwd (bewust)

- SMS (Bird/Twilio) en e-mail als meldkanalen (stubs staan klaar).
- Missed-call-text-back / telefonie.
- Google Business Profile API (reviews teruglezen).
- Mollie / facturatie, PWA unified inbox.
- Multi-tenant auth, self-service, no-code builder, online boeken: NIET de
  bedoeling (operator-model).
