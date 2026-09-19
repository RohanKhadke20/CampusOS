import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { demoDb } from "./repository.js";

let supabaseClient: SupabaseClient | null = null;

export function isDemoMode(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return !url || !anonKey || url.trim() === "" || anonKey.trim() === "";
}

export function getSupabaseClient(): SupabaseClient | null {
  if (isDemoMode()) {
    return null;
  }
  if (!supabaseClient) {
    supabaseClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
  }
  return supabaseClient;
}

export { demoDb };
