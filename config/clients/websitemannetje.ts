import type { ClientConfig, NotifyChannel } from "../types";

// Config voor het eigen merk. Bestaat vooral zodat het demo-aanvraagformulier
// op de homepage dezelfde lead-pijplijn gebruikt als klant-sites (event ->
// dedup -> melding). De sjabloonpagina /websitemannetje is een onbelangrijk
// bijproduct en wordt nergens gelinkt.

// Zelfde env-schakelaar als demo-hovenier: NOTIFY_CHANNEL=whatsapp schakelt
// alle meldingen om (zie SETUP-WHATSAPP.md).
const kanaal: NotifyChannel =
  (process.env.NOTIFY_CHANNEL ?? "").replace(/^﻿/, "").trim().toLowerCase() === "whatsapp"
    ? "whatsapp"
    : "telegram";
const target =
  kanaal === "whatsapp"
    ? (process.env.OPERATOR_WHATSAPP_NUMBER ?? "").replace(/^﻿/, "").trim()
    : (process.env.OPERATOR_TELEGRAM_CHAT_ID ?? "").replace(/^﻿/, "").trim();
const config: ClientConfig = {
  slug: "websitemannetje",

  business: {
    name: "Websitemannetje",
    tagline: "Websites voor vakmensen die klussen opleveren",
    phone: "",
    email: "pietbaudoinsarvi@gmail.com",
    city: "Utrecht",
    serviceArea: "Heel Nederland",
    logoMark: "🔧",
  },

  theme: {
    primary: "#1F4467",
    accent: "#E8762D",
    dark: "#15304B",
    onPrimary: "#FFFFFF",
    onAccent: "#FFFFFF",
  },

  presentation: {
    hero: {
      heading: "Een website die klussen binnenhaalt",
      subheading:
        "Website, aanvragen op je telefoon en automatische Google-reviews. Alles geregeld.",
      ctaLabel: "Vraag je gratis demo aan",
      imageSlot: "hero",
    },
    services: {
      heading: "Wat je krijgt",
      intro: "Geen los websiteje, maar een systeem dat werk binnenhaalt.",
      items: [
        {
          title: "Moderne website",
          description: "Strak ontwerp met jouw foto's, kleuren en verhaal.",
          icon: "🖥️",
        },
        {
          title: "Aanvragen op je telefoon",
          description: "Elke offerteaanvraag direct als bericht op je mobiel.",
          icon: "📱",
        },
        {
          title: "Google-reviews",
          description: "Automatische reviewverzoeken na elke klus.",
          icon: "⭐",
        },
        {
          title: "Onderhoud",
          description: "Hosting, updates en aanpassingen inbegrepen.",
          icon: "🔧",
        },
      ],
    },
    about: {
      heading: "Wie is het mannetje?",
      body: "Ik ben Piet. Ik bouw websites voor vakmensen die geen tijd hebben voor computergedoe. Je belt of appt gewoon met mij, niet met een helpdesk.",
      imageSlot: "about",
    },
    contact: {
      heading: "Vraag je gratis demo aan",
      intro: "Laat je gegevens achter, dan bel of app ik je zodra je demo klaarstaat.",
    },
    cta: {
      home: {
        heading: "Benieuwd hoe jouw site eruit zou zien?",
        body: "Vraag de gratis demo aan. Eerst zien, dan beslissen.",
      },
      about: {
        heading: "Klaar om gevonden te worden?",
        body: "Vraag vrijblijvend je demo aan.",
      },
    },
    photos: {},
  },

  ai: {
    tone: "Vriendelijk, nuchter en to-the-point. Spreekt de bezoeker met 'je' aan.",
    services: [
      "websites voor vakmensen",
      "leadmeldingen op de telefoon",
      "automatische Google-reviewverzoeken",
      "website-onderhoud",
    ],
    serviceArea: "Heel Nederland, op afstand.",
    faq: [
      {
        q: "Wat kost het?",
        a: "149 euro per maand, alles inbegrepen. Geen opstartkosten en maandelijks opzegbaar.",
      },
      {
        q: "Hoe snel staat mijn site live?",
        a: "Binnen een week nadat je je foto's en gegevens hebt aangeleverd.",
      },
      {
        q: "Zit ik ergens aan vast?",
        a: "Nee, je kunt elke maand opzeggen.",
      },
    ],
    extraKnowledge:
      "Websitemannetje is een eenmansbedrijf van Piet. De demo wordt gratis gebouwd voordat de klant beslist.",
  },

  operational: {
    notifyChannel: kanaal,
    notifyTarget: target,
    googleReviewLink: "https://g.page/r/PLAATS-HIER-DE-REVIEW-LINK/review",
  },
};

export default config;
