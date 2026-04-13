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

    // Check if user was auto-confirmed (no email verification needed)
    const isAutoConfirmed = !!data?.user?.email_confirmed_at

    // Check if this is a fake signup (email already exists) - Supabase returns
    // a user with empty identities array to prevent email enumeration
    const isFakeSignup = data?.user?.identities?.length === 0

    if (isFakeSignup) {
      return { error: "An account with this email already exists. Please sign in instead." }
    }

    return { data, error: null, isAutoConfirmed }
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

export async function updateProfile(data: { full_name: string; company_name: string }) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return { error: "Not authenticated" }
    }

    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: data.full_name,
        company_name: data.company_name,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id)

    if (error) {
      return { error: error.message }
    }

    return { error: null }
  } catch (error) {
    console.error("Error updating profile:", error)
    return { error: "An unexpected error occurred" }
  }
}
