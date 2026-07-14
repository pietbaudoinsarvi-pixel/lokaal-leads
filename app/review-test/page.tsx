"use client";

import { useState, type CSSProperties, type FormEvent } from "react";

export default function ReviewTest() {
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setResult("");
    const data = new FormData(e.currentTarget);
    try {
      const res = await fetch("/api/review-request", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          clientSlug: data.get("clientSlug"),
          phone: data.get("phone"),
          channel: data.get("channel"),
        }),
      });
      const json = await res.json();
      setResult(`${res.status}\n${JSON.stringify(json, null, 2)}`);
    } catch (err) {
      setResult("Fout: " + (err instanceof Error ? err.message : String(err)));
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={{ maxWidth: 480, margin: "3rem auto", padding: "0 1rem" }}>
      <h1>Review-verzoek testen</h1>
      <p>
        Stuurt de Google-review-link uit de klant-config. Met de WhatsApp
        Cloud API ingesteld gaat het verzoek echt naar het klantnummer;
        anders komt het bij jou (operator) binnen om door te sturen.
      </p>
      <form onSubmit={submit} style={{ display: "grid", gap: "0.75rem" }}>
        <label>
          Klant-slug
          <input name="clientSlug" defaultValue="demo-hovenier" required style={input} />
        </label>
        <label>
          Telefoonnummer klant
          <input name="phone" defaultValue="+31 6 12 34 56 78" required style={input} />
        </label>
        <label>
          Kanaal
          <select name="channel" defaultValue="whatsapp" style={input}>
            <option value="whatsapp">WhatsApp (standaard)</option>
            <option value="telegram">Telegram (via operator)</option>
            <option value="sms">SMS (stub, TODO)</option>
          </select>
        </label>
        <button type="submit" disabled={loading} style={{ padding: "0.6rem", fontWeight: 600 }}>
          {loading ? "Versturen..." : "Review-verzoek versturen"}
        </button>
      </form>
      {result && (
        <pre style={{ background: "#f4f4f4", padding: "1rem", marginTop: "1rem", whiteSpace: "pre-wrap" }}>
          {result}
        </pre>
      )}
    </main>
  );
}

const input: CSSProperties = {
  display: "block",
  width: "100%",
  padding: "0.5rem",
  marginTop: "0.25rem",
  boxSizing: "border-box",
};
