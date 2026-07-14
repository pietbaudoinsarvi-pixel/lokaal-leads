"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";

interface LeadFormProps {
  slug: string;
  // Klant-sites spreken bezoekers standaard met "u" aan; de eigen merksite
  // gebruikt "je". Dit schakelt alleen de copy, niet het gedrag.
  informal?: boolean;
}

type Status = "idle" | "sending" | "ok" | "error";

// Herbruikbaar leadformulier. Post naar /api/lead (dezelfde event-flow en
// melding als elke andere lead). Alleen de client-slug gaat mee; nooit
// operationele/geheime config.
export default function LeadForm({ slug, informal = false }: LeadFormProps) {
  const t = informal
    ? {
        live: "Bedankt, je aanvraag is verstuurd. Ik bel of app je binnen een werkdag terug.",
        doneTitle: "Bedankt voor je aanvraag!",
        doneBody: "Ik heb je gegevens ontvangen en bel of app je binnen een werkdag terug.",
        naam: "Je naam",
        vraag: "Je bericht (optioneel)",
        vraagPlaceholder: "Bedrijfsnaam en plaats, dan kan ik meteen aan de slag.",
        note: "Ik bel of app je binnen een werkdag terug. Geheel vrijblijvend.",
      }
    : {
        live: "Bedankt, uw aanvraag is verstuurd. Wij bellen u binnen een werkdag terug.",
        doneTitle: "Bedankt voor uw aanvraag!",
        doneBody: "Wij hebben uw gegevens ontvangen en bellen u binnen een werkdag terug.",
        naam: "Uw naam",
        vraag: "Uw vraag (optioneel)",
        vraagPlaceholder: "Vertel kort waar u ons voor nodig heeft.",
        note: "Wij bellen u binnen een werkdag terug. Geheel vrijblijvend.",
      };
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState("");
  const inFlight = useRef(false);
  const doneRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (status === "ok") doneRef.current?.focus();
  }, [status]);

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (inFlight.current) return; // guard tegen dubbele submit (bv. snel 2x Enter)
    inFlight.current = true;
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
    } finally {
      inFlight.current = false;
    }
  }

  return (
    <div className="lead-form-wrap">
      {/* Permanent gemonteerde live region zodat de succesmelding betrouwbaar
          door screenreaders wordt aangekondigd. */}
      <p className="sr-only" aria-live="polite" role="status">
        {status === "ok" ? t.live : ""}
      </p>

      {status === "ok" ? (
        <div className="lead-form lead-form--done" ref={doneRef} tabIndex={-1}>
          <h3>{t.doneTitle}</h3>
          <p>{t.doneBody}</p>
        </div>
      ) : (
        <form className="lead-form" onSubmit={submit}>
          <label className="field">
            <span>Naam</span>
            <input name="name" required autoComplete="name" placeholder={t.naam} />
          </label>
          <label className="field">
            <span>Telefoonnummer</span>
            <input name="phone" required type="tel" inputMode="tel" autoComplete="tel" placeholder="06 12 34 56 78" />
          </label>
          <label className="field">
            <span>{t.vraag}</span>
            <textarea name="message" rows={4} placeholder={t.vraagPlaceholder} />
          </label>
          {status === "error" && <p className="lead-form__error" role="alert">{error}</p>}
          <button type="submit" className="btn btn--accent btn--block" disabled={status === "sending"}>
            {status === "sending" ? "Versturen..." : "Aanvraag versturen"}
          </button>
          <p className="lead-form__note">{t.note}</p>
        </form>
      )}
    </div>
  );
}
