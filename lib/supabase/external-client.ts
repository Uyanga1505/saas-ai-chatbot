import { createClient } from "@supabase/supabase-js"

// This should only be imported in server actions or API routes
export function createExternalClient() {
  // Use non-public environment variables for server-side only access
  const supabaseUrl = process.env.EXTERNAL_SUPABASE_URL
  const supabaseKey = process.env.EXTERNAL_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    // Return null if external Supabase is not configured
    return null
  }

  return createClient(supabaseUrl, supabaseKey)
}
