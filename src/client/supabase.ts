import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/server/db/types";

export function createBrowserSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl || !publishableKey) {
    throw new Error("Missing Supabase public environment variables");
  }

  return createClient<Database>(supabaseUrl, publishableKey);
}
