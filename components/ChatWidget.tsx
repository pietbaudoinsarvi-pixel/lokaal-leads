"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";

interface ChatWidgetProps {
  slug: string;
  businessName: string;
  logoMark?: string;
}

type ChatMessage = { role: "user" | "assistant"; content: string };

// Site-brede AI-chatwidget. Praat met /api/chat (server-side Claude). Alleen de
// slug en presentatie-velden gaan mee; nooit operationele/geheime config.
export default function ChatWidget({ slug, businessName, logoMark }: ChatWidgetProps) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const bodyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bodyRef.current?.scrollTo({ top: bodyRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, open]);

  async function send(e: FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text || busy) return;

    const history: ChatMessage[] = [...messages, { role: "user", content: text }];
    setMessages([...history, { role: "assistant", content: "" }]);
    setInput("");
    setBusy(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ clientSlug: slug, messages: history }),
      });
      if (!res.ok || !res.body) throw new Error("no stream");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let acc = "";
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        acc += decoder.decode(value, { stream: true });
        setMessages((m) => {
          const copy = m.slice();
          copy[copy.length - 1] = { role: "assistant", content: acc };
          return copy;
        });
      }
      if (!acc.trim()) {
        setMessages((m) => {
          const copy = m.slice();
          copy[copy.length - 1] = {
            role: "assistant",
            content: "Sorry, er ging iets mis. Bel ons gerust rechtstreeks.",
          };
          return copy;
        });
      }
    } catch {
      setMessages((m) => {
        const copy = m.slice();
        copy[copy.length - 1] = {
          role: "assistant",
          content: "Sorry, er ging iets mis. Probeer het later opnieuw of bel ons.",
        };
        return copy;
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <button
        className="chat-fab"
        type="button"
        aria-label={open ? "Chat sluiten" : "Chat openen"}
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        {open ? "✕" : "💬"}
      </button>

      {open && (
        <div className="chat-panel" role="dialog" aria-label={`Chat met ${businessName}`}>
          <div className="chat-panel__head">
            {logoMark && <span className="chat-panel__mark" aria-hidden="true">{logoMark}</span>}
            <div>
              <strong>{businessName}</strong>
              <span>Wij reageren snel</span>
            </div>
          </div>

          <div className="chat-panel__body" ref={bodyRef}>
            {messages.length === 0 && (
              <div className="chat-msg chat-msg--bot">
                Hallo! Waarmee kan ik u helpen? Stel gerust een vraag of vraag een offerte aan.
              </div>
            )}
            {messages.map((m, i) => (
              <div
                key={i}
                className={`chat-msg ${m.role === "user" ? "chat-msg--user" : "chat-msg--bot"}`}
              >
                {m.content || (busy && i === messages.length - 1 ? "…" : "")}
              </div>
            ))}
          </div>

          <form className="chat-panel__input" onSubmit={send}>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Typ uw bericht..."
              disabled={busy}
              aria-label="Uw bericht"
            />
            <button type="submit" disabled={busy || !input.trim()} aria-label="Versturen">
              ➤
            </button>
          </form>
        </div>
      )}
    </>
  );
}
