export default function Home() {
  return (
    <main style={{ maxWidth: 640, margin: "4rem auto", padding: "0 1rem" }}>
      <h1>Lokaal Leads</h1>
      <p>
        Stap 1: de lead-pijplijn. Test de flow via{" "}
        <a href="/lead-test">/lead-test</a> of met een POST naar{" "}
        <code>/api/lead</code>.
      </p>
      <p style={{ color: "#666" }}>
        De hovenier-sjabloonsite (stap 2), AI-chat (stap 3) en review-request
        (stap 4) volgen zodra stap 1 is geverifieerd.
      </p>
    </main>
  );
}
