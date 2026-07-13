"use client";

import { useState, type CSSProperties, type FormEvent } from "react";

export default function LeadTest() {
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setResult("");
    const data = new FormData(e.currentTarget);
    try {
      const res = await fetch("/api/lead", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          clientSlug: data.get("clientSlug"),
          name: data.get("name"),
          phone: data.get("phone"),
          message: data.get("message"),
          source: "form",
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
      <h1>Lead-test</h1>
      <p>
        Vul in en verstuur. Je zou binnen enkele seconden een Telegram-melding
        moeten krijgen. Verstuur twee keer snel achter elkaar: de tweede keer
        geeft <code>duplicate: true</code> en stuurt geen tweede melding.
      </p>
      <form onSubmit={submit} style={{ display: "grid", gap: "0.75rem" }}>
        <label>
          Klant-slug
          <input name="clientSlug" defaultValue="demo-hovenier" required style={input} />
        </label>
        <label>
          Naam
          <input name="name" defaultValue="Test Klant" required style={input} />
        </label>
        <label>
          Telefoon
          <input name="phone" defaultValue="+31 6 55 55 55 55" required style={input} />
        </label>
        <label>
          Bericht
          <textarea
            name="message"
            defaultValue="Ik wil graag een offerte voor mijn tuin."
            rows={3}
            style={input}
          />
        </label>
        <button type="submit" disabled={loading} style={{ padding: "0.6rem", fontWeight: 600 }}>
          {loading ? "Versturen..." : "Verstuur test-lead"}
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
