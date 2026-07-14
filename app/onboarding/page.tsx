import { agency } from "@/config/agency";
import OnboardingForm from "@/components/OnboardingForm";
import "./onboarding.css";

export const metadata = {
  title: `Aanleverformulier | ${agency.name}`,
  description: "Lever hier de foto's en gegevens aan voor je nieuwe website.",
  robots: { index: false, follow: false },
};

// Aanleverformulier voor nieuwe klanten. Deel de link, eventueel met
// ?bedrijf=Naam om de bedrijfsnaam alvast in te vullen:
//   https://<domein>/onboarding?bedrijf=Hoveniersbedrijf%20Jansen
export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: Promise<{ bedrijf?: string }>;
}) {
  const { bedrijf } = await searchParams;

  return (
    <div className="ob">
      <header className="ob-header">
        <div className="ob-container">
          <p className="ob-header__brand">
            <span aria-hidden="true">{agency.mark}</span> {agency.name}
          </p>
          <h1>Aanleverformulier voor je nieuwe website</h1>
          <p>
            Leuk dat ik je website mag maken! Hier lever je alles in één keer
            aan: je gegevens, je verhaal en vooral foto&apos;s van je werk.
            Invullen duurt een minuut of tien en kan gewoon vanaf je telefoon.
          </p>
        </div>
      </header>
      <main className="ob-container">
        <OnboardingForm prefillBedrijf={bedrijf ?? ""} />
      </main>
    </div>
  );
}
