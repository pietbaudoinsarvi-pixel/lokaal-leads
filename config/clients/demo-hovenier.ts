import type { ClientConfig } from "../types";

// Demo-klant. Realistische placeholder-content voor een NL-hovenier.
// Vervang dit later door een echte prospect (of kopieer dit bestand naar
// een nieuwe slug voor een nieuwe klant).
const config: ClientConfig = {
  slug: "demo-hovenier",

  business: {
    name: "De Groene Vinger Hoveniers",
    tagline: "Vakkundig tuinonderhoud en tuinaanleg in de regio Utrecht",
    phone: "+31 6 12 34 56 78",
    email: "info@degroenevinger.nl",
    city: "Utrecht",
    serviceArea: "Utrecht en omstreken (straal 25 km)",
    kvk: "12345678",
  },

  theme: {
    primary: "#2F7D4F",
    accent: "#C7A45A",
    dark: "#14301F",
  },

  presentation: {
    hero: {
      heading: "Een tuin om trots op te zijn, zonder gedoe",
      subheading:
        "Van complete tuinaanleg tot vast onderhoud. Betrouwbaar, netjes en op afspraak.",
      ctaLabel: "Vraag een offerte aan",
      imageSlot: "hero",
    },
    services: {
      heading: "Onze diensten",
      intro: "Alles voor uw tuin, van ontwerp tot onderhoud.",
      items: [
        {
          title: "Tuinaanleg",
          description:
            "Compleet ontwerp en aanleg van uw droomtuin, inclusief bestrating en beplanting.",
          icon: "🌿",
        },
        {
          title: "Tuinonderhoud",
          description:
            "Snoeien, maaien, wieden en bemesten. Periodiek of eenmalig, geheel op maat.",
          icon: "✂️",
        },
        {
          title: "Bestrating",
          description: "Terrassen, opritten en paden, strak en waterpas gelegd.",
          icon: "🧱",
        },
        {
          title: "Beplanting",
          description:
            "Advies en aanplant van borders, hagen en bomen die passen bij uw tuin.",
          icon: "🌱",
        },
      ],
    },
    about: {
      heading: "Over ons",
      body: "De Groene Vinger is een lokaal hoveniersbedrijf met ruim 15 jaar ervaring. Wij werken netjes, denken mee en leveren op afspraak. Uw tuin is bij ons in goede handen.",
      imageSlot: "about",
    },
    contact: {
      heading: "Vraag een vrijblijvende offerte aan",
      intro: "Laat uw gegevens achter en wij bellen u binnen een werkdag terug.",
    },
    photos: {
      hero: "/photos/demo-hovenier/hero.jpg",
      about: "/photos/demo-hovenier/about.jpg",
    },
  },

  ai: {
    tone: "Vriendelijk, deskundig en to-the-point. Spreekt de bezoeker met 'u' aan.",
    services: ["tuinaanleg", "tuinonderhoud", "bestrating", "beplanting", "snoeiwerk"],
    serviceArea: "Utrecht en omstreken, binnen een straal van ongeveer 25 km.",
    faq: [
      {
        q: "Werken jullie ook in mijn omgeving?",
        a: "Wij werken in Utrecht en omstreken, ongeveer 25 km rondom de stad. Twijfelt u? Vraag het gerust.",
      },
      {
        q: "Kan ik een vrijblijvende offerte krijgen?",
        a: "Zeker. Laat uw naam en telefoonnummer achter, dan plannen wij een gratis kennismaking en offerte in.",
      },
      {
        q: "Doen jullie ook periodiek onderhoud?",
        a: "Ja, wij verzorgen periodiek tuinonderhoud op maat: wekelijks, maandelijks of per seizoen.",
      },
    ],
    extraKnowledge:
      "De eigenaar heet Jan. Het bedrijf is 6 dagen per week bereikbaar, zondag gesloten.",
  },

  operational: {
    notifyChannel: "telegram",
    // Voor de demo melden we naar jezelf, dus hergebruiken we je operator chat_id.
    // Bij een echte klant zet je hier een letterlijke chat_id of telefoonnummer.
    notifyTarget: process.env.OPERATOR_TELEGRAM_CHAT_ID ?? "",
    googleReviewLink: "https://g.page/r/PLAATS-HIER-DE-REVIEW-LINK/review",
  },
};

export default config;
