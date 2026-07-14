import Anthropic from "@anthropic-ai/sdk";

let cached: Anthropic | null = null;

// Server-only Anthropic-client. ANTHROPIC_API_KEY komt NOOIT in de client-bundle.
// Env wordt lazy en BOM-tolerant gelezen (zie de env-hygiene elders in het project).
export function getAnthropic(): Anthropic {
  if (cached) return cached;
  const apiKey = process.env.ANTHROPIC_API_KEY?.replace(/^﻿/, "").trim();
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY ontbreekt (server-side).");
  }
  cached = new Anthropic({ apiKey });
  return cached;
}

// Model uit env, met default claude-sonnet-5 (bewuste projectkeuze).
export function getModel(): string {
  return process.env.ANTHROPIC_MODEL?.replace(/^﻿/, "").trim() || "claude-sonnet-5";
}
