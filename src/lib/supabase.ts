import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = import.meta.env["VITE_SUPABASE_URL"] as string | undefined;
const anonKey = import.meta.env["VITE_SUPABASE_ANON_KEY"] as string | undefined;

/** False until VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set (see .env). */
export const supabaseConfigured = Boolean(url && anonKey);

let client: SupabaseClient | null = null;

/** Browser Supabase client. Sessions persist in localStorage and refresh automatically. */
export function supabase(): SupabaseClient {
  if (!client) {
    if (!url || !anonKey)
      throw new Error(
        "Supabase is not configured: set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY",
      );
    const browser = typeof window !== "undefined";
    client = createClient(url, anonKey, {
      auth: { persistSession: browser, autoRefreshToken: browser, detectSessionInUrl: browser },
    });
  }
  return client;
}
