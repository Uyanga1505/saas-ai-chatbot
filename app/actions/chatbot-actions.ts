"use server"

import { createClient } from "@/lib/supabase/server"

export async function getChatbots() {
  const supabase = await createClient()

  const { data, error } = await supabase.from("chatbots").select("*").order("created_at", { ascending: false })

  if (error) {
    console.error("[v0] Error fetching chatbots:", error)
    return { data: null, error: error.message }
  }

  return { data, error: null }
}

export async function toggleChatbotStatus(id: string, currentStatus: boolean) {
  const supabase = await createClient()

  const { error } = await supabase.from("chatbots").update({ is_active: !currentStatus }).eq("id", id)

  if (error) {
    console.error("[v0] Error updating chatbot status:", error)
    return { success: false, error: error.message }
  }

  return { success: true, error: null }
}

export async function deleteChatbot(id: string) {
  const supabase = await createClient()

  const { error } = await supabase.from("chatbots").delete().eq("id", id)

  if (error) {
    console.error("[v0] Error deleting chatbot:", error)
    return { success: false, error: error.message }
  }

  return { success: true, error: null }
}
