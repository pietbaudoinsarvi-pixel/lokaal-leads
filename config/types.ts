// Type van een klant-config. Dit is de BRON VAN WAARHEID per klant.
// Een nieuwe klant toevoegen = een nieuw bestand in /config/clients/<slug>.ts
// dat een ClientConfig als default exporteert. Nooit nieuwe paginacode.

export type NotifyChannel = "telegram" | "whatsapp" | "sms" | "email";

export interface ServiceItem {
  title: string;
  description: string;
  icon?: string; // emoji of icon-naam, fallback als er geen foto is
  image?: string; // pad naar een foto voor deze dienst (voorkeur boven icon)
}

export interface FaqItem {
  q: string;
  a: string;
}

export interface CtaBlock {
  heading: string;
  body: string;
}

export interface GalleryItem {
  image: string;
  caption?: string;
}

export interface ClientConfig {
  slug: string;

  business: {
    name: string;
    tagline: string;
    phone: string;
    email: string;
    city: string;
    serviceArea: string;
    address?: string;
    kvk?: string;
    logoMark?: string; // klein merk-teken naast de naam (emoji), niche-neutraal
  };

  theme: {
    primary: string; // hex, hoofdkleur
    accent: string; // hex, accentkleur
    dark?: string; // optionele donkere tint
    onPrimary?: string; // tekstkleur op --primary (contrast), default wit
    onAccent?: string; // tekstkleur op --accent (contrast), default donker
  };

  // Presentatie: alles wat de sjabloon-UI rendert.
  presentation: {
    hero: {
      heading: string;
      subheading: string;
      ctaLabel: string;
      imageSlot: string;
    };
    services: {
      heading: string;
      intro: string;
      items: ServiceItem[];
    };
    about: {
      heading: string;
      body: string;
      imageSlot: string;
    };
    contact: {
      heading: string;
      intro: string;
    };
    // Korte belofte-punten in de strip onder de hero (optioneel).
    usps?: string[];
    // Portfolio/galerij van uitgevoerd werk (optioneel).
    gallery?: {
      heading: string;
      intro?: string;
      items: GalleryItem[];
    };
    // Call-to-action-banden. Per klant/niche tekstueel aan te passen.
    cta: {
      home: CtaBlock;
      about: CtaBlock;
    };
    photos: Record<string, string>; // benoemde foto-slots -> url/pad
  };

  // AI-kennis: voedt de system prompt van de chatbot.
  ai: {
    tone: string;
    services: string[];
    serviceArea: string;
    faq: FaqItem[];
    extraKnowledge?: string;
  };

  // Operationele velden: sturen de backend aan.
  operational: {
    notifyChannel: NotifyChannel;
    notifyTarget: string; // telegram chat_id / telefoon / e-mail
    googleReviewLink: string; // directe Google-review-link van de klant
  };
}
