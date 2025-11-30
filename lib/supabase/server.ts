import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { supabaseConfig, isSupabaseConfigured } from "./config"

export async function createClient() {
  if (!isSupabaseConfigured()) {
    throw new Error(
      "Missing Supabase environment variables. Please add EXTERNAL_SUPABASE_URL and EXTERNAL_SUPABASE_ANON_KEY to your project.",
    )
  }

  const cookieStore = await cookies()

  return createServerClient(supabaseConfig.url, supabaseConfig.anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
        } catch {
          // The "setAll" method was called from a Server Component.
          // This can be ignored if you have middleware refreshing
          // user sessions.
        }
      },
    },
  })
}
