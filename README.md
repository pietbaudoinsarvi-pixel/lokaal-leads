# Lokaal Leads

Geproductiseerde websites met een slimme backend voor lokale bedrijven (start-niche: hoveniers). De website is de haak; de waarde zit in de backend: elke lead komt direct als melding op de telefoon van de eigenaar.

**Kern-principe:** er is EEN niche-sjabloon en per klant alleen een configbestand. Een nieuwe klant toevoegen = een nieuw bestand in `/config/clients/<slug>.ts`. Nooit nieuwe paginacode of layout per klant.

## Wat er nu is (stap 1)

De volledige lead-pijplijn, end-to-end testbaar:

- `POST /api/lead` maakt een **event** (idempotent), leidt daaruit een **lead** af, en stuurt **synchroon** een Telegram-melding met een retry.
- Elke meldingspoging wordt gelogd in `deliveries`. Faalt de melding definitief, dan wordt de lead alsnog bewaard en krijg jij (de operator) een alert.
- Een testpagina op `/lead-test` en een curl-voorbeeld hieronder.

De hovenier-sjabloonsite (stap 2), de AI-chat (stap 3) en de review-request (stap 4) volgen daarna.

## Setup

### 1. Dependencies

```bash
npm install
```

### 2. Supabase

1. Maak een project op [supabase.com](https://supabase.com).
2. Open de **SQL Editor** en plak/voer `supabase/schema.sql` uit.
3. Ga naar **Project Settings > API** en noteer de **Project URL** en de **`service_role`** key (onder "Project API keys"). De service-role-key is geheim en alleen server-side.

### 3. Telegram-bot

1. Open Telegram, start een chat met **@BotFather**, stuur `/newbot` en volg de stappen. Je krijgt een **bot-token**.
2. Stuur je nieuwe bot zelf een berichtje (bv. "hoi"), zodat er een chat bestaat.
3. Haal je **chat_id** op. Twee makkelijke manieren:
   - Stuur een bericht aan **@userinfobot**; die antwoordt met je numerieke id, of
   - Open in je browser `https://api.telegram.org/bot<JOUW_TOKEN>/getUpdates` en zoek `"chat":{"id":...}`.

### 4. Env

```bash
cp .env.example .env.local
```

Vul in: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `TELEGRAM_BOT_TOKEN`, `OPERATOR_TELEGRAM_CHAT_ID`. (Voor de demo is `OPERATOR_TELEGRAM_CHAT_ID` ook het notify-target van `demo-hovenier`, dus je hoeft verder niets in de config te zetten.) `ANTHROPIC_*` is pas nodig vanaf stap 3.

### 5. Draaien en testen

```bash
npm run dev
```

- Open `http://localhost:3000/lead-test`, vul in en verstuur. **Verwacht: binnen enkele seconden een Telegram-melding.**
- Of via curl (Git Bash):

  ```bash
  curl -X POST http://localhost:3000/api/lead \
    -H "content-type: application/json" \
    -d '{"clientSlug":"demo-hovenier","name":"Test Klant","phone":"+31612345678","message":"Offerte graag","source":"form"}'
  ```

- Of via PowerShell:

  ```powershell
  Invoke-RestMethod -Uri http://localhost:3000/api/lead -Method Post -ContentType 'application/json' `
    -Body '{"clientSlug":"demo-hovenier","name":"Test Klant","phone":"+31612345678","message":"Offerte graag","source":"form"}'
  ```

**Idempotentie testen:** verstuur twee keer snel achter elkaar dezelfde gegevens. De tweede keer geeft `{"ok":true,"duplicate":true}` en stuurt **geen** tweede melding (5-minuten-venster).

**Melding-fallback testen:** zet een verkeerde `TELEGRAM_BOT_TOKEN`, verstuur een lead. De response blijft `ok:true` (lead niet verloren), `deliveries` bevat een `failed`-rij. Zet je token terug voor de operator-alert.

## Een nieuwe klant toevoegen

Kopieer `config/clients/demo-hovenier.ts` naar `config/clients/<nieuwe-slug>.ts`, pas de inhoud aan (bedrijfsinfo, kleuren, foto-slots, AI-kennis, `notifyTarget`, `googleReviewLink`) en zet `slug` gelijk aan de bestandsnaam. Meer niet: geen code, geen registratie. De backend en (vanaf stap 2) de site pikken de klant automatisch op via `getClient(slug)`.

## Deploy naar Vercel

1. Push de repo naar GitHub/GitLab.
2. Importeer in Vercel als Next.js-project.
3. Zet dezelfde env-variabelen als in `.env.local` onder **Settings > Environment Variables**.
4. Deploy. Test `/lead-test` op de productie-URL.

## Architectuur (stap 1)

1. **Alles wordt eerst een event.** Melding en CRM-record komen uit dezelfde bron.
2. **Idempotentie** via een `dedup_key` (hash van klant + telefoon + bericht + 5-min-venster) met een unieke constraint op `(client_slug, dedup_key)`.
3. **Melding is synchroon** in dezelfde request (poging + 1 retry), nooit via polling. Elke poging in `deliveries`.
4. **Notifier is een interface** (`lib/notify`). Telegram is volledig; WhatsApp/SMS/Email zijn stubs met TODO. Welk kanaal draait, bepaalt `notify_channel` in de klant-config.
5. **Config is de bron van waarheid per klant** (`/config/clients`). Supabase bevat alleen runtime-data per `client_slug`.

## Nog niet gebouwd (TODO, later)

- Stap 2: hovenier-sjabloon (`/components/site` + `/app/(site)/[client]`) dat de demo uit config rendert, met `LeadForm`.
- Stap 3: AI-chat (`/app/api/chat` + `ChatWidget`), system prompt uit config, kan lead capturen naar `/api/lead`.
- Stap 4: `/app/api/review-request` stuurt de Google-review-link uit config en logt `review_requests`.
- Missed-call-text-back / telefonie (Bird of Twilio, nieuw NL-nummer).
- Google Business Profile API (reviews teruglezen).
- WhatsApp Business API-templates (approval-doorlooptijd).
- Mollie / facturatie.
- PWA unified inbox.
- Multi-tenant auth, self-service, no-code builder, online boeken.
