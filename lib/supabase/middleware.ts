import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"
import { supabaseConfig, isSupabaseConfigured } from "./config"

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  // If Supabase credentials are not available, just continue without auth check
  if (!isSupabaseConfigured()) {
    console.log("[v0] Supabase credentials not found, skipping auth check")
    return supabaseResponse
  }

  const supabase = createServerClient(supabaseConfig.url, supabaseConfig.anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
        supabaseResponse = NextResponse.next({
          request,
        })
        cookiesToSet.forEach(({ name, value, options }) => supabaseResponse.cookies.set(name, value, options))
      },
    },
  })

  // Handle auth code exchange — Supabase email links land at /?code=...
  const code = request.nextUrl.searchParams.get("code")
  if (code) {
    await supabase.auth.exchangeCodeForSession(code)
    const url = request.nextUrl.clone()
    url.pathname = "/dashboard"
    url.searchParams.delete("code")
    return NextResponse.redirect(url)
  }

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    // Redirect unauthenticated users to login for protected routes
    if (request.nextUrl.pathname.startsWith("/dashboard") && !user) {
      const url = request.nextUrl.clone()
      url.pathname = "/auth/login"
      return NextResponse.redirect(url)
    }

    // Redirect authenticated users away from auth pages to dashboard
    if (user && (request.nextUrl.pathname.startsWith("/auth/login") || request.nextUrl.pathname.startsWith("/auth/signup"))) {
      const url = request.nextUrl.clone()
      url.pathname = "/dashboard"
      return NextResponse.redirect(url)
    }
  } catch (error) {
    console.error("[v0] Error checking auth:", error)
    // Continue without auth check if there's an error
  }

  return supabaseResponse
}
