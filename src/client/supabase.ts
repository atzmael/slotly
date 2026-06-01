import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/server/db/types";

let browserSupabaseClient: ReturnType<typeof createClient<Database>> | null =
  null;

export function createBrowserSupabaseClient() {
  if (browserSupabaseClient) {
    return browserSupabaseClient;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl || !publishableKey) {
    throw new Error("Missing Supabase public environment variables");
  }

  browserSupabaseClient = createClient<Database>(supabaseUrl, publishableKey);
  return browserSupabaseClient;
}
