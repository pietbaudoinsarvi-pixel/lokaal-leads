# WhatsApp instellen (in plaats van Telegram)

Het hele systeem (leadmeldingen, aanlever-meldingen, operator-alerts en
review-verzoeken) schakelt om naar WhatsApp met alleen env-vars, zonder
codewijziging. Zolang WhatsApp niet (goed) is ingesteld valt alles
automatisch terug op Telegram, dus er gaat nooit een melding verloren.

Er zijn twee routes. Begin gerust met de quick-start; de productie-route kan
later, de env-vars bepalen wat er draait.

---

## Route A: quick-start via CallMeBot (5 minuten, meldingen aan jezelf)

Goed om vandaag nog leadmeldingen op je eigen WhatsApp te krijgen. Kan NIET
naar klanten sturen (alleen naar jouw eigen nummer) en loopt via een gratis
derde partij, dus zie dit als tussenoplossing.

1. Volg de actuele instructies op
   [callmebot.com/blog/free-api-whatsapp-messages](https://www.callmebot.com/blog/free-api-whatsapp-messages/):
   voeg hun nummer toe aan je contacten en stuur het activatiebericht via
   WhatsApp. Je krijgt direct een **API-key** terug.
2. Zet in Vercel (Project Settings > Environment Variables, Production +
   Preview) en in `.env.local`:

   | Variabele | Waarde |
   |---|---|
   | `NOTIFY_CHANNEL` | `whatsapp` |
   | `OPERATOR_WHATSAPP_NUMBER` | je eigen nummer, bv. `+31612345678` |
   | `CALLMEBOT_API_KEY` | de key uit stap 1 |

3. Redeploy (`vercel --prod`) en test via `/lead-test`. De melding hoort nu
   op je WhatsApp binnen te komen; faalt er iets, dan komt hij op Telegram.

---

## Route B: productie via de officiële Meta WhatsApp Cloud API

Nodig zodra je berichten naar klanten wilt sturen (review-verzoeken) of van
de derde partij af wilt. Kosten: een testnummer is gratis; met een eigen
nummer betaal je per template-bericht een paar cent, vrije berichten binnen
het 24-uurs servicevenster zijn gratis.

### Stap 1: Meta-app aanmaken

1. Maak (of gebruik) een Meta Business-account op
   [business.facebook.com](https://business.facebook.com).
2. Ga naar [developers.facebook.com](https://developers.facebook.com) >
   **Create App** > type **Business**.
3. Voeg in de app het product **WhatsApp** toe. Je krijgt meteen een gratis
   **testnummer** waarmee je naar maximaal 5 geverifieerde nummers mag
   sturen; voeg je eigen 06-nummer toe als ontvanger. (Later koppel je een
   eigen zakelijk nummer; dat nummer mag nog geen actief WhatsApp-account
   hebben. Een vast nummer kan ook.)

### Stap 2: token en phone number id

1. In het WhatsApp-dashboard van de app zie je het **Phone number ID**
   (niet het telefoonnummer zelf, maar het lange ID eronder).
2. Voor testen werkt het tijdelijke token (24 uur). Voor productie maak je
   een **System User** aan in Business Settings > Users > System users, geef
   die toegang tot de app en genereer een token zonder vervaldatum met de
   permissie `whatsapp_business_messaging`.

### Stap 3: templates indienen (WhatsApp Manager > Message templates)

Templates zijn nodig om berichten te sturen buiten het 24-uurs venster
(business-initiated). Dien deze twee in, categorie **Utility**, taal
**Nederlands**; goedkeuring duurt meestal minuten tot een uur.

**Template 1: operator-meldingen** (naam bv. `melding_operator`, 1 variabele)

> Nieuw bericht van je website-systeem: {{1}}

**Template 2: review-verzoek** (naam bv. `review_verzoek`, 2 variabelen)

> Bedankt voor uw opdracht bij {{1}}! Was u tevreden? Wij zouden een korte
> Google-review enorm waarderen: {{2}}

### Stap 4: env-vars zetten (Vercel + .env.local)

| Variabele | Waarde |
|---|---|
| `NOTIFY_CHANNEL` | `whatsapp` |
| `OPERATOR_WHATSAPP_NUMBER` | jouw nummer, bv. `+31612345678` |
| `WHATSAPP_ACCESS_TOKEN` | het (system user-)token |
| `WHATSAPP_PHONE_NUMBER_ID` | het Phone number ID |
| `WHATSAPP_TEMPLATE_NAME` | `melding_operator` |
| `WHATSAPP_REVIEW_TEMPLATE_NAME` | `review_verzoek` |
| `WHATSAPP_TEMPLATE_LANGUAGE` | `nl` (default, mag weg) |

Redeploy en test: `/lead-test` (leadmelding), `/onboarding` insturen
(aanlever-melding), `/review-test` (review-verzoek, kanaal WhatsApp).

### Handig om te weten

- **24-uurs venster:** stuur zelf één appje naar je business-nummer en het
  systeem kan 24 uur lang vrije tekstberichten sturen (gratis). Daarbuiten
  gebruikt het automatisch de template.
- **Volgorde in de code:** eerst vrije tekst, dan template. Je hoeft niets
  te kiezen.
- **Review-verzoeken en de AVG:** verstuur alleen naar nummers die de
  hovenier bij de klus heeft gekregen, wijs op bezwaar (opt-out) en sluit
  een verwerkersovereenkomst met elke klant (jij verwerkt de nummers
  namens hen). Nooit filteren op tevreden klanten en nooit een beloning
  beloven; dat verbiedt Google expliciet.

---

## Hoe het systeem kiest (geen actie nodig)

| Situatie | Wat er gebeurt |
|---|---|
| `NOTIFY_CHANNEL=whatsapp` + Cloud API-vars gezet | Alles via WhatsApp (Cloud API) |
| `NOTIFY_CHANNEL=whatsapp` + alleen CallMeBot-key | Operator-meldingen via WhatsApp; review-verzoeken komen bij jou om door te sturen |
| WhatsApp faalt of niet ingesteld | Automatische terugval op Telegram |
| Geen van beide ingesteld | Melding faalt zichtbaar; lead/aanlevering blijft altijd bewaard in Supabase |

Per echte klant zet je in `/config/clients/<slug>.ts` gewoon
`notifyChannel: "whatsapp"` en `notifyTarget: "+316..."` (het nummer van de
klant); de env-schakelaar hierboven geldt alleen voor de demo-configs die
naar jou (operator) melden.
