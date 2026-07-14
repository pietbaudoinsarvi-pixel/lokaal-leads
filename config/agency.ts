// Merk-config voor de eigen site (Websitemannetje). Eén plek voor naam,
// prijs, teksten en contactgegevens. De homepage (app/page.tsx) en het
// aanleverformulier renderen hieruit.

export const agency = {
  name: "Websitemannetje",
  domain: "websitemannetje.nl",
  mark: "🔧",
  tagline: "Websites voor vakmensen die klussen opleveren",
  email: "pietbaudoinsarvi@gmail.com", // TODO: info@websitemannetje.nl na domeinregistratie
  priceMonthly: 149,
  demoSlug: "demo-hovenier",
  metaDescription:
    "Websites voor hoveniers en andere vakmensen: aanvragen direct op je telefoon, automatische Google-reviews en onderhoud inbegrepen. Demo eerst, betalen daarna.",

  nav: [
    { label: "Voorbeeld", href: "#voorbeeld" },
    { label: "Wat je krijgt", href: "#wat-je-krijgt" },
    { label: "Werkwijze", href: "#werkwijze" },
    { label: "Prijs", href: "#prijs" },
    { label: "Vragen", href: "#vragen" },
  ],
  navCta: "Gratis demo",

  hero: {
    eyebrow: "Websites voor vakmensen",
    heading: "Een website die klussen binnenhaalt? Daar heb je een mannetje voor.",
    sub: "Ik bouw je website, vang de aanvragen op en zorg voor je Google-reviews. Jij krijgt elke aanvraag direct op je telefoon en blijft gewoon doen waar je goed in bent.",
    ctaPrimary: "Vraag je gratis demo aan",
    ctaSecondary: "Bekijk een voorbeeld",
    trustLine: "Geen opstartkosten. Maandelijks opzegbaar. Eerst zien, dan beslissen.",
  },

  usps: [
    "Demo eerst, betalen daarna",
    "Aanvragen direct op je telefoon",
    "Automatisch meer Google-reviews",
    "Maandelijks opzegbaar",
  ],

  voorbeeld: {
    eyebrow: "Voorbeeld",
    heading: "Zo ziet jouw site eruit",
    intro:
      "Dit is een demo zoals ik hem voor een hovenier bouw. Alles werkt echt: het offerteformulier, de assistent die vragen beantwoordt, en de eigenaar krijgt elke aanvraag direct op zijn telefoon.",
    adresbalk: "degroenevinger.nl (demo)",
    iframeTitle: "Voorbeeld van een klant-website",
    linkLabel: "Open het voorbeeld volledig",
  },

  features: {
    eyebrow: "Alles inbegrepen",
    heading: "Wat je krijgt",
    intro: "Geen los websiteje, maar een systeem dat werk voor je binnenhaalt.",
    items: [
      {
        icon: "🖥️",
        title: "Moderne website",
        description:
          "Strak ontwerp met jouw foto's, kleuren en verhaal. Gebouwd om van bezoekers klanten te maken.",
      },
      {
        icon: "📱",
        title: "Aanvragen op je telefoon",
        description:
          "Elke offerteaanvraag komt direct binnen als bericht. Geen mailbox die je vergeet te checken.",
      },
      {
        icon: "🤖",
        title: "Slimme assistent",
        description:
          "Beantwoordt ook 's avonds en in het weekend vragen van bezoekers en noteert hun gegevens. Jij belt terug wanneer het jou uitkomt.",
      },
      {
        icon: "⭐",
        title: "Google-reviews op de automaat",
        description:
          "Na elke klus krijgt je klant automatisch een berichtje met jouw reviewlink. Zo groeit je bedrijf in Google.",
      },
      {
        icon: "🔧",
        title: "Onderhoud inbegrepen",
        description:
          "Hosting, updates, beveiliging en aanpassingen. Je hoeft nooit meer naar je website om te kijken.",
      },
      {
        icon: "🚀",
        title: "Snel en vindbaar",
        description:
          "Razendsnel op mobiel en gebouwd om lokaal gevonden te worden door mensen die nu een vakman zoeken.",
      },
    ],
  },

  werkwijze: {
    eyebrow: "Werkwijze",
    heading: "Zo werkt het",
    intro: "Drie stappen, en de eerste kost je helemaal niets.",
    steps: [
      {
        title: "Vraag de demo aan",
        description:
          "Vertel me je bedrijfsnaam en plaats. Ik bouw alvast een eerste versie van je site. Kost je niets en je zit nergens aan vast.",
      },
      {
        title: "Lever je materiaal aan",
        description:
          "Bevalt de demo? Via mijn aanleverformulier stuur je foto's en gegevens door, direct vanaf je telefoon.",
      },
      {
        title: "Live binnen een week",
        description:
          "Ik maak alles af en zet je site live. Vanaf dat moment komen aanvragen direct op je telefoon binnen.",
      },
    ],
  },

  prijs: {
    eyebrow: "Prijs",
    heading: "Eén duidelijke prijs",
    includes: [
      "Complete website met jouw foto's en verhaal",
      "Hosting, onderhoud en aanpassingen",
      "Aanvragen direct op je telefoon",
      "Slimme assistent die vragen beantwoordt",
      "Automatische Google-reviewverzoeken",
      "Persoonlijk contact, gewoon met mij",
    ],
    note: "Geen opstartkosten. Maandelijks opzegbaar.",
    vergelijk:
      "Ter vergelijking: losse leads kopen kost al snel 20 tot 60 euro per aanvraag, ook als de klus niet doorgaat. Eén gewonnen klus per jaar en je site heeft zichzelf dubbel en dwars terugverdiend.",
  },

  over: {
    eyebrow: "Over mij",
    heading: "Wie is het mannetje?",
    body: "Ik ben Piet. Ik bouw websites voor vakmensen die geen tijd hebben voor computergedoe. Je belt of appt gewoon met mij, niet met een helpdesk. Ik houd het simpel: jij doet je vak, ik zorg dat je gevonden wordt en dat geen aanvraag verloren gaat.",
  },

  faqEyebrow: "Veelgestelde vragen",
  faqHeading: "Vragen die ik vaak krijg",
  faq: [
    {
      q: "Wat kost het?",
      a: "149 euro per maand, alles inbegrepen. Geen opstartkosten en maandelijks opzegbaar.",
    },
    {
      q: "Hoe snel staat mijn site live?",
      a: "Binnen een week nadat je je foto's en gegevens hebt aangeleverd via het aanleverformulier.",
    },
    {
      q: "Zit ik ergens aan vast?",
      a: "Nee. Je kunt elke maand opzeggen, zonder kleine lettertjes.",
    },
    {
      q: "Ik heb al een website. Kan ik overstappen?",
      a: "Zeker, dat gebeurt juist vaak. Ik zet alles netjes over, ook je domeinnaam.",
    },
    {
      q: "Werk je alleen voor hoveniers?",
      a: "Ik ben begonnen in het groen, maar het systeem werkt voor elke vakman: stratenmakers, schilders, dakdekkers, noem maar op.",
    },
    {
      q: "Moet ik zelf iets bijhouden?",
      a: "Nee, dat is juist het idee. Ik regel de techniek, jij krijgt alleen een berichtje als er een aanvraag binnenkomt.",
    },
  ],

  contact: {
    eyebrow: "Gratis demo",
    heading: "Vraag je gratis demo aan",
    intro:
      "Laat je naam en nummer achter en zet in het bericht je bedrijfsnaam en plaats. Ik bouw je demo en bel of app je zodra hij klaarstaat. Kost niets, verplicht tot niets.",
  },

  // Dienstenlijst voor het aanleverformulier. Niche-afhankelijk: pas dit aan
  // als je een andere niche gaat bedienen.
  onboardingDiensten: [
    "Tuinaanleg",
    "Tuinonderhoud",
    "Bestrating",
    "Beplanting",
    "Snoeien",
    "Gazon",
    "Schuttingen en vlonders",
    "Vijvers",
    "Tuinontwerp",
  ],
} as const;
