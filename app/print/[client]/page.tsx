import { notFound } from "next/navigation";
import QRCode from "qrcode";
import { getClient } from "@/lib/clients";
import { agency } from "@/config/agency";
import { siteUrl } from "@/lib/site-url";
import PrintButton from "@/components/PrintButton";
import "./print.css";

// Printbare demo-kaart (A5) voor de legale post-route: geadresseerde post met
// een QR naar de klaarstaande demo. Werkwijze: eerst de demo-config maken
// (npm run nieuwe-klant of een kopie van demo-hovenier), dan deze pagina
// printen en per post naar de prospect sturen. De afmeldregel onderaan is
// verplicht bij geadresseerd reclamedrukwerk (recht van verzet).

export async function generateMetadata({ params }: { params: Promise<{ client: string }> }) {
  const { client } = await params;
  const config = await getClient(client);
  return {
    title: config ? `Demo-kaart | ${config.business.name}` : "Demo-kaart",
    robots: { index: false, follow: false },
  };
}

export default async function PrintKaart({ params }: { params: Promise<{ client: string }> }) {
  const { client } = await params;
  const config = await getClient(client);
  if (!config) notFound();

  const demoUrl = `${siteUrl}/${config.slug}`;
  // QR als inline SVG: scherp op elke printer, geen externe dienst nodig.
  const qrSvg = await QRCode.toString(demoUrl, {
    type: "svg",
    margin: 0,
    errorCorrectionLevel: "M",
    color: { dark: "#15304B", light: "#0000" },
  });
  const urlZonderProtocol = demoUrl.replace(/^https?:\/\//, "");

  return (
    <div className="print-shell">
      <div className="print-toolbar">
        <h1>Demo-kaart voor {config.business.name}</h1>
        <p>
          A5-formaat, bedoeld voor geadresseerde post naar de prospect. Print op
          stevig papier (200 grams of meer) en check vooraf de KVK
          non-mailing-indicator.
        </p>
        <PrintButton label="Print de kaart (A5)" />
      </div>

      <div className="kaart">
        <header className="kaart__kop">
          <div className="kaart__merk">
            <span className="kaart__merk-mark" aria-hidden="true">{agency.mark}</span>
            {agency.name}
          </div>
          <h2 className="kaart__titel">
            Ik heb alvast een website voor {config.business.name} gemaakt
          </h2>
          <p className="kaart__sub">
            Echt waar, hij staat al online. Het offerteformulier werkt, de
            slimme assistent beantwoordt vragen en elke aanvraag komt direct
            binnen als appje. Bekijk maar even.
          </p>
        </header>

        <div className="kaart__body">
          <div className="kaart__scan">
            <div
              className="kaart__qr"
              role="img"
              aria-label={`QR-code naar ${urlZonderProtocol}`}
              dangerouslySetInnerHTML={{ __html: qrSvg }}
            />
            <div className="kaart__scan-tekst">
              <strong>Scan de code met je telefoon</strong>
              en je ziet je eigen website. Of typ het adres in:
              <span className="kaart__url">{urlZonderProtocol}</span>
            </div>
          </div>

          <ul className="kaart__punten">
            <li><span className="vink" aria-hidden="true">✓</span> Elke aanvraag direct op je telefoon, geen mailbox-gedoe</li>
            <li><span className="vink" aria-hidden="true">✓</span> Automatisch meer Google-reviews na elke klus</li>
            <li><span className="vink" aria-hidden="true">✓</span> Hosting, onderhoud en aanpassingen: alles inbegrepen</li>
          </ul>

          <div className="kaart__prijs">
            <strong>{agency.priceMonthly} euro per maand, alles inbegrepen.</strong>{" "}
            Geen opstartkosten en maandelijks opzegbaar. Bevalt de demo niet?
            Dan gooi je deze kaart weg en hoor je nooit meer wat van mij.
          </div>

          <div className="kaart__afzender">
            <strong>Groet, Piet</strong>
            {agency.name} · {agency.email}
          </div>
        </div>

        <footer className="kaart__voet">
          Je ontvangt deze kaart eenmalig omdat ik denk dat een goede website
          {" "}{config.business.name} meer klussen oplevert. Liever geen post van
          mij? Stuur een berichtje naar {agency.email} en ik haal je adres
          direct van mijn lijstje.
        </footer>
      </div>
    </div>
  );
}
