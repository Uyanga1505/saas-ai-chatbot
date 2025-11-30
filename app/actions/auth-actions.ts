"use server"

import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { headers } from "next/headers"

export async function signUp(email: string, password: string, fullName: string) {
  try {
    const supabase = await createClient()

    const headersList = await headers()
    const origin =
      headersList.get("origin") ||
      headersList.get("referer")?.split("/").slice(0, 3).join("/") ||
      "http://localhost:3000"

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${origin}/auth/callback`,
        data: {
          full_name: fullName,
        },
      },
    })

    if (error) {
      return { error: error.message }
    }

    return { data, error: null }
  } catch (error) {
    console.error("Error signing up:", error)
    return { error: "An unexpected error occurred during signup" }
  }
}

export async function signIn(email: string, password: string) {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      return { error: error.message }
    }

    return { data, error: null }
  } catch (error) {
    console.error("Error signing in:", error)
    return { error: "An unexpected error occurred during sign in" }
  }
}

export async function signOut() {
  try {
    const supabase = await createClient()
    await supabase.auth.signOut()
  } catch (error) {
    console.error("Error signing out:", error)
  }
  redirect("/")
}

export async function getCurrentUser() {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser()

    if (error) {
      return null
    }

    return user
  } catch (error) {
    console.error("Error getting current user:", error)
    return null
  }
}
