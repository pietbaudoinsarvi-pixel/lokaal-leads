import Link from "next/link";

export default function Home() {
  return (
    <main style={{ maxWidth: 640, margin: "4rem auto", padding: "0 1rem" }}>
      <h1>Lokaal Leads</h1>
      <p>
        Demo-hoveniersite: <Link href="/demo-hovenier">/demo-hovenier</Link>
      </p>
      <p style={{ color: "#666" }}>
        Operator-tests: <Link href="/lead-test">/lead-test</Link> (leadmelding) en{" "}
        <Link href="/review-test">/review-test</Link> (review-verzoek). Een nieuwe klant
        toevoegen betekent puur een nieuw bestand in <code>/config/clients</code>.
      </p>
    </main>
  );
}
