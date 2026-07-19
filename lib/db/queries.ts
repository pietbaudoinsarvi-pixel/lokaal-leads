import { getServiceClient } from "./client";

export interface EventRow {
  id: string;
  client_slug: string;
  type: string;
  source: string;
  dedup_key: string;
  payload: Record<string, unknown>;
  created_at: string;
}

export interface InsertEventInput {
  client_slug: string;
  type: string;
  source: string;
  dedup_key: string;
  payload: Record<string, unknown>;
}

// Schrijft een event idempotent weg. Bij een botsing op (client_slug, dedup_key)
// wordt niets ingevoegd en geven we het bestaande event terug met isNew=false,
// zodat de caller GEEN tweede melding verstuurt.
export async function insertEvent(
  input: InsertEventInput,
): Promise<{ event: EventRow; isNew: boolean }> {
  const supabase = getServiceClient();

  const { data, error } = await supabase
    .from("events")
    .upsert(input, {
      onConflict: "client_slug,dedup_key",
      ignoreDuplicates: true,
    })
    .select()
    .maybeSingle();
  if (error) throw error;
  if (data) return { event: data as EventRow, isNew: true };

  // Duplicaat: haal het bestaande event op zodat de caller de id heeft.
  const { data: existing, error: fetchError } = await supabase
    .from("events")
    .select("*")
    .eq("client_slug", input.client_slug)
    .eq("dedup_key", input.dedup_key)
    .maybeSingle();
  if (fetchError) throw fetchError;
  if (!existing) {
    throw new Error("Event-upsert gaf niets terug en bestaand event niet gevonden.");
  }
  return { event: existing as EventRow, isNew: false };
}

export interface DeriveLeadInput {
  client_slug: string;
  event_id: string;
  source: "form" | "chat";
  name: string;
  phone: string;
  message: string;
}

export async function deriveLead(input: DeriveLeadInput): Promise<{ id: string }> {
  const supabase = getServiceClient();
  const { data, error } = await supabase
    .from("leads")
    .insert(input)
    .select("id")
    .single();
  if (error) throw error;
  return data as { id: string };
}

// Herstelpad voor het duplicaat-scenario in submitLead: kijk of er voor dit
// event al een lead-record bestaat. limit(1) in plaats van single, zodat een
// zeldzaam dubbel record het herstel niet laat crashen.
export async function findLeadIdByEventId(event_id: string): Promise<string | null> {
  const supabase = getServiceClient();
  const { data, error } = await supabase
    .from("leads")
    .select("id")
    .eq("event_id", event_id)
    .limit(1);
  if (error) throw error;
  return data && data.length > 0 ? (data[0] as { id: string }).id : null;
}

// Is er voor dit event al een geslaagde melding gelogd?
export async function hasSentDelivery(event_id: string): Promise<boolean> {
  const supabase = getServiceClient();
  const { data, error } = await supabase
    .from("deliveries")
    .select("event_id")
    .eq("event_id", event_id)
    .eq("status", "sent")
    .limit(1);
  if (error) throw error;
  return (data?.length ?? 0) > 0;
}

export interface LogDeliveryInput {
  event_id: string;
  channel: string;
  target: string;
  status: "sent" | "failed";
  error: string | null;
  attempts: number;
}

// Delivery-logging mag de leadflow NOOIT breken: fouten hier worden alleen
// gelogd, niet doorgegooid.
export async function logDelivery(input: LogDeliveryInput): Promise<void> {
  const supabase = getServiceClient();
  const { error } = await supabase.from("deliveries").insert(input);
  if (error) {
    console.error("logDelivery faalde:", error.message);
  }
}

export interface LogReviewRequestInput {
  client_slug: string;
  phone: string;
  channel: string;
  status: string;
}

export async function logReviewRequest(
  input: LogReviewRequestInput,
): Promise<{ id: string } | null> {
  const supabase = getServiceClient();
  const { data, error } = await supabase
    .from("review_requests")
    .insert({ ...input, sent_at: new Date().toISOString() })
    .select("id")
    .single();
  if (error) {
    console.error("logReviewRequest faalde:", error.message);
    return null;
  }
  return data as { id: string };
}
