# Websitemannetje: handleiding voor de operator

Alles wat je nodig hebt om klanten te winnen, sites live te zetten en het systeem draaiend te houden. Voor de technische details van de code: zie `README.md`. Voor het aanscherpen van je aanbod, garantie en verkoopteksten: zie `HANDLEIDING-AANBOD.md`.

**De plekken:**

| Wat | Waar |
|---|---|
| Live site (agency + alle klant-sites) | https://lokaal-leads.vercel.app |
| Code | https://github.com/pietbaudoinsarvi-pixel/lokaal-leads (privé) |
| Lokaal | `C:\Users\piet_\lokaal-leads` |
| Hosting en env-vars | Vercel-dashboard, project **lokaal-leads** |
| Aanleveringen en foto's | Supabase-dashboard, Storage, bucket **onboarding** |
| Leads en logs | Supabase-dashboard, Table Editor (`leads`, `events`, `deliveries`, `review_requests`) |

**Spiekbrief (alle commando's, altijd vanuit de projectmap):**

```
npm run dev                                          # lokaal draaien op localhost:3000
npm run typecheck                                    # types checken
npm run nieuwe-klant -- --demo "Bedrijf" "Plaats"    # prospect-demo in 1 minuut
npm run nieuwe-klant -- <submissionId> [slug]        # klant-config uit aanlevering
vercel --prod                                        # live zetten
```

---

## 1. Zo verdien je geld met dit systeem

Jij verkoopt een abonnement van **149 euro per maand, alles inbegrepen** (site, hosting, aanvragen op de telefoon, AI-assistent, automatische reviewverzoeken, onderhoud). Geen opstartkosten, maandelijks opzegbaar.

De verkooptruc is **demo eerst**: je bouwt de website al VOORDAT je contact opneemt. De prospect ziet zijn eigen bedrijf online staan en hoeft alleen nog ja te zeggen. Met de generator kost een demo je een minuut werk.

Pitch-munitie:

- Eén gewonnen klus (tuinaanleg: 5.000 tot 15.000 euro) betaalt de site voor jaren.
- Losse leads kopen kost al snel 20 tot 60 euro per aanvraag, ook als de klus niet doorgaat (zo staat het ook op je site; het volledige Werkspot-bereik is 3 tot 75 euro per lead, en gemiddeld zo'n 208 euro aan leadkosten per gewonnen klus).
- Een losse stack (sitebouwer + reviewtool + chatbot) kost al snel 283+ euro per maand.
- Niet "meer leads" beloven maar "kies de beste klussen": veel hoveniers hebben wachtlijsten.
- Seizoen: de zoekpiek is maart/april/mei. Hoveniers hebben in november t/m februari tijd om te beslissen. Zomerpitch: "wie nu bouwt staat in maart bovenaan".

## 2. De juridische spelregels (belangrijk, boetes tot 900.000 euro)

87% van de hoveniers is eenmanszaak of vof. Die mag je **NIET koud bellen, mailen of DM'en** (ook niet via LinkedIn of WhatsApp) zonder opt-in. Wat WEL mag:

- **Geadresseerde post** sturen (de demo-kaart!). Check eerst de non-mailing-indicator in het KVK-register en vermeld een afmeldmogelijkheid (staat al op de kaart).
- **Fysiek langsgaan** (B2B toegestaan, zelfde KVK-check is netjes).
- **BV's koud bellen** (zo'n 10% van de markt, vaak de grotere bedrijven). Meld wie je bent, gebruik een herkenbaar nummer en respecteer "nee".
- **Reageren** op hun eigen uitingen (een oproep, een advertentie, een reactie op je site).

Check dus per prospect de rechtsvorm in het KVK-register: BV = bellen mag, eenmanszaak/vof = alleen post of langsgaan.

## 3. Een prospect binnenhalen, stap voor stap

**Stap 1: prospects vinden.** Goede signalen: geen website in Google Maps, een Facebookpagina als "site", geen https, een gratis maildomein (@gmail), minder dan 10 reviews. Bronnen: Outscraper (Google Maps-export, 500 gratis, filter op "Site is blank"), de VHG-ledenzoeker, Werkspot-stadspagina's.

**Stap 2: demo bouwen (1 minuut).**

```
npm run nieuwe-klant -- --demo "Tuinen Van Dijk" "Amersfoort"
```

Dit maakt `config/clients/tuinen-van-dijk.ts`: hun naam en plaats, nette hovenier-teksten, demo-foto's en voorbeeld-reviews. De demo is noindex (komt niet in Google) en meldingen komen bij jou binnen. Bekijk hem met `npm run dev` op `localhost:3000/tuinen-van-dijk`, pas eventueel teksten aan, en zet hem live met `vercel --prod`.

**Stap 3: kaart printen en versturen.** Open `https://lokaal-leads.vercel.app/print/tuinen-van-dijk`, klik op de printknop (A5, stevig papier, 200 grams of meer). Op de kaart staan een QR-code naar de demo, de prijs en de verplichte afmeldregel. Adresseren, postzegel, klaar.

**Stap 4: opvolgen.** Bewezen ritme: dag 0 de kaart, dag 3 tot 7 langsgaan (of bellen als het een BV is), eventueel een korte persoonlijke video als extra contactmoment. Realistische verwachting: 3 tot 5% wordt klant bij koude benadering; je eerste klant komt waarschijnlijk uit je eigen netwerk.

## 4. Van "ja" naar live site

**Stap 1: aanleverformulier sturen.** Stuur de klant deze link (vult zijn bedrijfsnaam alvast in):

```
https://lokaal-leads.vercel.app/onboarding?bedrijf=Tuinen+Van+Dijk
```

De klant vult alles in vanaf zijn telefoon: gegevens, diensten, verhaal, kleur, logo en tot 60 foto's (worden automatisch verkleind en naar WebP omgezet). Jij krijgt een melding met het inzending-id; alles staat in Supabase Storage onder `onboarding/<id>/`.

**Stap 2: config genereren.**

```
npm run nieuwe-klant -- <submissionId> tuinen-van-dijk --force
```

(`--force` omdat de demo-config al bestond.) Het script downloadt alle foto's naar `public/photos/tuinen-van-dijk/` en herschrijft de config met de echte antwoorden: juiste aanspreekvorm (u of je), de merkkleur uit het formulier met automatisch kloppende contrastkleuren, telefoonnummer, diensten, en de praktische info als kennis voor de AI-assistent.

**Stap 3: afmaken.** Zoek op `TODO` in de config: hero-tekst persoonlijk maken, over-ons herschrijven, beste foto's kiezen voor hero en galerij. Check ook:

- `seo.index` staat op `true` (echte klant hoort in Google)
- `operational.notifyTarget` is het 06-nummer van de klant
- `operational.googleReviewLink` is de echte reviewlink (klant kan hem vinden via Google Business Profile, "vraag om reviews")
- de voorbeeld-reviews uit de demo zijn vervangen door echte, of het blok is weggehaald

**Stap 4: live.** `npm run typecheck`, lokaal bekijken, `vercel --prod`. Klaar. Sluit ook een verwerkersovereenkomst met de klant (jij verwerkt klantgegevens namens hem); een template daarvoor staat nog op de openstaande lijst.

## 5. Dagelijks gebruik: leads en reviews

**Leads.** Elke offerteaanvraag (formulier of AI-chat) komt direct als bericht binnen, nu via Telegram, na de WhatsApp-setup via WhatsApp. De belofte op de sites is "reactie binnen 1 werkdag", dus bel of app de klant dezelfde dag door. Dubbele inzendingen binnen 5 minuten worden automatisch genegeerd. Alles staat ook in Supabase (`leads`-tabel) als back-up.

**Reviewverzoeken.** Na elke afgeronde klus stuur je namens de klant een reviewverzoek naar diens klant. Makkelijkste weg: de testpagina `/review-test`, of direct:

```
POST https://lokaal-leads.vercel.app/api/review-request
{ "clientSlug": "tuinen-van-dijk", "phone": "+31612345678" }
```

Zolang de WhatsApp Cloud API niet is ingesteld krijg JIJ het verzoek doorgestuurd om handmatig door te sturen. Regels: verzoek naar ALLE klanten (selecteren op tevredenheid is verboden), geen beloningen beloven, opt-out respecteren.

## 6. Beheer

- **Deployen:** altijd `vercel --prod` VANUIT de projectmap (anders probeert Vercel je home-directory te deployen). Structurele fix die nog openstaat: de Vercel-GitHub-koppeling aanzetten (Vercel-dashboard, project, Settings, Git), dan gaat elke push vanzelf live.
- **Env-vars** staan in het Vercel-dashboard (Settings, Environment Variables). Zet ze daar en niet via de CLI met een PowerShell-pipe (die plakt een onzichtbare BOM voor de waarde en dan breken HTTP-headers). De lokale `.env.local` heeft nog placeholder-waarden voor Supabase; vul die een keer met de echte waarden uit het dashboard, dan werkt de generator ook in Supabase-modus.
- **WhatsApp aanzetten:** volg `SETUP-WHATSAPP.md`. Route A (CallMeBot, 5 minuten) voor meldingen aan jezelf, route B (Meta Cloud API met templates) voor echte berichten aan klanten. Tot die tijd werkt alles via Telegram.
- **Kosten:** Vercel en Supabase draaien op gratis tiers; de AI-chat loopt op je bestaande Anthropic-tegoed (org-breed).

## 7. Problemen oplossen

| Probleem | Oplossing |
|---|---|
| Melding komt niet aan | Check de `deliveries`-tabel in Supabase (daar staat de fout), check env-vars in Vercel. De lead zelf is nooit weg: staat in de `leads`-tabel. |
| Vercel vraagt "deploying your home directory" | Je staat niet in de projectmap. `cd C:\Users\piet_\lokaal-leads` en opnieuw. |
| Nieuwe klant-config geeft 404 | Lokaal: dev-server herstart. Live: eerst deployen (configs worden bij de build ingepakt). |
| Foto-upload klant faalt | Limieten: 60 foto's, 15 MB per foto, 120 uploads per 10 minuten. Laat de klant even wachten en opnieuw proberen; gelukte foto's blijven staan. |
| Formulier zegt "te veel inzendingen" | Rate limit (10 per 10 minuten per IP-adres), gaat vanzelf over. |
| QR op de kaart wijst naar het verkeerde adres | De kaart gebruikt de productie-URL. Na de domein-verhuizing naar websitemannetje.nl: zet `NEXT_PUBLIC_SITE_URL` in Vercel en deploy opnieuw. |

## 8. Openstaande punten (prioriteit bovenaan)

1. **websitemannetje.nl registreren** (was vrij op 14 juli, kan elke dag weg zijn) en aan het Vercel-project koppelen.
2. **WhatsApp instellen** via `SETUP-WHATSAPP.md` (nu loopt alles via Telegram, werkt ook prima).
3. **Vercel-GitHub-koppeling** aanzetten zodat elke push automatisch live gaat.
4. **Echte Supabase-waarden in `.env.local`** zodat de generator aanleveringen kan ophalen.
5. Verwerkersovereenkomst-template maken voor nieuwe klanten.
6. Later: eigen domein per klant, Upstash rate limits, Mollie-incasso, echte reviewlink in de demo.
