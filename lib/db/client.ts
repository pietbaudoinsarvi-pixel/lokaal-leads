import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let cached: SupabaseClient | null = null;

// Supabase-client met de SERVICE ROLE. SERVER-ONLY: dit mag nooit in de
// client-bundle terechtkomen, want de service-role-key omzeilt RLS volledig.
// Env wordt lazy gelezen zodat `next build` niet faalt zonder .env.
export function getServiceClient(): SupabaseClient {
  if (cached) return cached;

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      "SUPABASE_URL en SUPABASE_SERVICE_ROLE_KEY zijn vereist (server-side).",
    );
  }

  cached = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return cached;
}
