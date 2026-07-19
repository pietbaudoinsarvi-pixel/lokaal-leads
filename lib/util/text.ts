// Eén regel voor tekstmeldingen: regeleindes en andere controltekens eruit,
// zodat gebruikersinvoer geen extra (vervalste) regels kan injecteren in een
// Telegram- of WhatsApp-melding aan de operator. Opslag behoudt altijd de
// originele tekst; alleen de melding wordt platgeslagen.
// Bewust zonder regex met control-escapes: codepoint-check op C0-range en DEL,
// gedrag gelijk aan de line()-helpers in de onboarding-route en dispatch.
export function line(s: string): string {
  let uit = "";
  for (const teken of s) {
    const code = teken.codePointAt(0) ?? 0;
    uit += code < 32 || code === 127 ? " " : teken;
  }
  return uit.replace(/ {2,}/g, " ").trim();
}
