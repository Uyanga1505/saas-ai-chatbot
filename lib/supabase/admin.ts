import { createClient } from "@supabase/supabase-js"
import { supabaseConfig } from "./config"

/**
 * Creates a Supabase admin client using the service role key.
 * Use this ONLY in server-side contexts that don't have user auth
 * (e.g., webhooks called by external services like Facebook).
 *
 * This client bypasses RLS policies — never expose it to the client.
 */
export function createAdminClient() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!serviceRoleKey) {
    throw new Error(
      "Missing SUPABASE_SERVICE_ROLE_KEY environment variable. " +
      "Add it in your Vercel project settings (Settings → Environment Variables)."
    )
  }

  return createClient(supabaseConfig.url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}