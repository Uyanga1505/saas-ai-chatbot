// TO USE YOUR SUPABASE DATABASE IN V0 PREVIEW:
// 1. Uncomment the lines below and replace with your actual Supabase credentials
// 2. Comment out the process.env lines
// 3. IMPORTANT: Before deploying to production, reverse these changes!

// Temporary hardcoded values (ONLY for v0 preview testing)
import { SUPABASE_CREDENTIALS } from "./credentials"

// Server-side configuration
export const supabaseConfig = {
  url:
    SUPABASE_CREDENTIALS.url !== "PASTE_YOUR_URL_HERE"
      ? SUPABASE_CREDENTIALS.url
      : process.env.EXTERNAL_SUPABASE_URL || "",

  anonKey:
    SUPABASE_CREDENTIALS.anonKey !== "PASTE_YOUR_ANON_KEY_HERE"
      ? SUPABASE_CREDENTIALS.anonKey
      : process.env.EXTERNAL_SUPABASE_ANON_KEY || "",
}

// Helper to check if Supabase is configured
export function isSupabaseConfigured() {
  return Boolean(supabaseConfig.url && supabaseConfig.anonKey)
}

export function getSupabaseConfigError() {
  if (!supabaseConfig.url && !supabaseConfig.anonKey) {
    return "Missing both EXTERNAL_SUPABASE_URL and EXTERNAL_SUPABASE_ANON_KEY. Please add them as environment variables or temporarily hardcode them in lib/supabase/config.ts for v0 preview."
  }
  if (!supabaseConfig.url) {
    return "Missing EXTERNAL_SUPABASE_URL environment variable."
  }
  if (!supabaseConfig.anonKey) {
    return "Missing EXTERNAL_SUPABASE_ANON_KEY environment variable."
  }
  return null
}
