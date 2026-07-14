import Anthropic from "@anthropic-ai/sdk";
import { getClient } from "@/lib/clients";
import { getAnthropic, getModel } from "@/lib/ai/anthropic";
import { buildSystemPrompt } from "@/lib/ai/systemPrompt";
import { submitLead } from "@/lib/leads/submit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface ChatBody {
  clientSlug?: string;
  messages?: { role?: string; content?: string }[];
}

const CAPTURE_LEAD_TOOL: Anthropic.Tool = {
  name: "capture_lead",
  description:
    "Sla de contactgegevens van de bezoeker op zodra je zowel hun naam als telefoonnummer hebt EN ze een offerte, afspraak of terugbelverzoek willen. De eigenaar krijgt hiermee direct een melding op zijn telefoon.",
  input_schema: {
    type: "object",
    properties: {
      name: { type: "string", description: "Volledige naam van de bezoeker" },
      phone: { type: "string", description: "Telefoonnummer van de bezoeker" },
      message: {
        type: "string",
        description: "Korte samenvatting van de vraag of wens van de bezoeker",
      },
    },
    required: ["name", "phone", "message"],
    additionalProperties: false,
  },
  strict: true,
};

export async function POST(req: Request) {
  let body: ChatBody;
  try {
    body = (await req.json()) as ChatBody;
  } catch {
    return new Response("Ongeldige JSON.", { status: 400 });
  }

  const clientSlug = (body.clientSlug ?? "").trim();
  const client = await getClient(clientSlug);
  if (!client) {
    return new Response("Onbekende klant.", { status: 404 });
  }

  // Sanitize en begrens de historie.
  const messages: Anthropic.MessageParam[] = (Array.isArray(body.messages) ? body.messages : [])
    .filter(
      (m): m is { role: "user" | "assistant"; content: string } =>
        (m?.role === "user" || m?.role === "assistant") &&
        typeof m?.content === "string" &&
        m.content.trim().length > 0,
    )
    .slice(-20)
    .map((m) => ({ role: m.role, content: m.content.slice(0, 2000) }));

  if (messages.length === 0 || messages[messages.length - 1].role !== "user") {
    return new Response("Laatste bericht moet van de gebruiker zijn.", { status: 400 });
  }

  const system = buildSystemPrompt(client);
  const tools = [CAPTURE_LEAD_TOOL];
  const encoder = new TextEncoder();
  const convo: Anthropic.MessageParam[] = [...messages];

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        const anthropic = getAnthropic();
        const model = getModel();

        // Agentic loop: stream tekst naar de browser; voert capture_lead
        // server-side uit en gaat door tot de assistent klaar is.
        for (let i = 0; i < 4; i++) {
          const s = anthropic.messages.stream({
            model,
            max_tokens: 1024,
            system,
            tools,
            thinking: { type: "disabled" },
            messages: convo,
          });

          s.on("text", (delta: string) => {
            controller.enqueue(encoder.encode(delta));
          });

          const msg = await s.finalMessage();
          convo.push({ role: "assistant", content: msg.content });

          if (msg.stop_reason !== "tool_use") break;

          const toolResults: Anthropic.ToolResultBlockParam[] = [];
          for (const block of msg.content) {
            if (block.type === "tool_use" && block.name === "capture_lead") {
              const input = block.input as { name?: string; phone?: string; message?: string };
              const result = await submitLead({
                client,
                name: (input.name ?? "").trim(),
                phone: (input.phone ?? "").trim(),
                message: (input.message ?? "").trim() || "Aanvraag via de chat.",
                source: "chat",
              });
              toolResults.push({
                type: "tool_result",
                tool_use_id: block.id,
                content: result.ok
                  ? "Lead opgeslagen en melding verstuurd."
                  : `Kon de lead niet opslaan: ${result.error}`,
                is_error: !result.ok,
              });
            }
          }
          convo.push({ role: "user", content: toolResults });
        }

        controller.close();
      } catch (e) {
        console.error("[/api/chat] fout:", e);
        try {
          controller.enqueue(
            encoder.encode("\n\nSorry, er ging iets mis. Bel ons gerust rechtstreeks."),
          );
        } catch {
          // stream mogelijk al gesloten
        }
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "no-store" },
  });
}
