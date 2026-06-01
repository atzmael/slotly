import { createClient } from "@supabase/supabase-js";
import type { Database } from "./db/types";

export function createServiceSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const secretKey = process.env.SUPABASE_SECRET_KEY;

  if (!supabaseUrl || !secretKey) {
    throw new Error("Missing Supabase service environment variables");
  }

  return createClient<Database>(supabaseUrl, secretKey, {
    auth: {
      persistSession: false,
    },
  });
}
