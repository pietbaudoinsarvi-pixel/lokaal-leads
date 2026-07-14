"use client";

import { useState, type FormEvent } from "react";

interface LeadFormProps {
  slug: string;
}

type Status = "idle" | "sending" | "ok" | "error";

// Herbruikbaar leadformulier. Post naar /api/lead (dezelfde event-flow en
// melding als elke andere lead). Alleen de client-slug gaat mee; nooit
// operationele/geheime config.
export default function LeadForm({ slug }: LeadFormProps) {
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState("");

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);
    setStatus("sending");
    setError("");
    try {
      const res = await fetch("/api/lead", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          clientSlug: slug,
          name: data.get("name"),
          phone: data.get("phone"),
          message: data.get("message"),
          source: "form",
        }),
      });
      const json = await res.json();
      if (res.ok && json.ok) {
        setStatus("ok");
        form.reset();
      } else {
        setStatus("error");
        setError(json.error ?? "Er ging iets mis. Probeer het later opnieuw.");
      }
    } catch {
      setStatus("error");
      setError("Kon niet verzenden. Controleer uw verbinding en probeer het opnieuw.");
    }
  }

  if (status === "ok") {
    return (
      <div className="lead-form lead-form--done" role="status">
        <h3>Bedankt voor uw aanvraag!</h3>
        <p>Wij hebben uw gegevens ontvangen en bellen u binnen een werkdag terug.</p>
      </div>
    );
  }

  return (
    <form className="lead-form" onSubmit={submit} noValidate>
      <label className="field">
        <span>Naam</span>
        <input name="name" required autoComplete="name" placeholder="Uw naam" />
      </label>
      <label className="field">
        <span>Telefoonnummer</span>
        <input name="phone" required type="tel" inputMode="tel" autoComplete="tel" placeholder="06 12 34 56 78" />
      </label>
      <label className="field">
        <span>Uw vraag (optioneel)</span>
        <textarea name="message" rows={4} placeholder="Vertel kort waar u ons voor nodig heeft." />
      </label>
      {status === "error" && <p className="lead-form__error" role="alert">{error}</p>}
      <button type="submit" className="btn btn--accent btn--block" disabled={status === "sending"}>
        {status === "sending" ? "Versturen..." : "Aanvraag versturen"}
      </button>
      <p className="lead-form__note">Wij bellen u binnen een werkdag terug. Geheel vrijblijvend.</p>
    </form>
  );
}
