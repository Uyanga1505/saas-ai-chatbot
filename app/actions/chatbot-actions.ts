"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

// ─── Types ────────────────────────────────────────────────────────────────────

export type ChatbotFormData = {
  name: string
  description?: string
  messenger_page_id: string
  messenger_access_token: string
  ai_model: string        // "gemini" | "gpt-4o" | "gpt-4o-mini"
  model_tier: string      // "basic" | "premium"
  system_prompt: string
  rag_store_id?: string
  handoff_email?: string
  notify_emails?: string[]
  enable_human_handoff: boolean
  is_active: boolean
}

// ─── List ─────────────────────────────────────────────────────────────────────

export async function getChatbots() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { data: [], error: null }

  const { data, error } = await supabase
    .from("chatbots")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("[chatbot-actions] getChatbots:", error)
    return { data: null, error: error.message }
  }
  return { data, error: null }
}

// ─── Single ───────────────────────────────────────────────────────────────────

export async function getChatbot(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data, error } = await supabase
    .from("chatbots")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .single()

  if (error) { console.error("[chatbot-actions] getChatbot:", error); return null }
  return data
}

// ─── Create ───────────────────────────────────────────────────────────────────

export async function createChatbot(formData: ChatbotFormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Not authenticated")

  const { data, error } = await supabase
    .from("chatbots")
    .insert({
      user_id: user.id,
      name: formData.name,
      description: formData.description ?? null,
      messenger_page_id: formData.messenger_page_id,
      messenger_access_token: formData.messenger_access_token,
      ai_model: formData.ai_model,
      selected_model: formData.ai_model,
      model_tier: formData.model_tier,
      system_prompt: formData.system_prompt,
      rag_store_id: formData.rag_store_id ?? null,
      handoff_email: formData.handoff_email ?? null,
      notify_emails: formData.notify_emails ?? [],
      enable_human_handoff: formData.enable_human_handoff,
      is_active: formData.is_active,
    })
    .select()
    .single()

  if (error) throw new Error(error.message)
  revalidatePath("/dashboard/chatbots")
  return { id: data.id }
}

// ─── Update ───────────────────────────────────────────────────────────────────

export async function updateChatbot(id: string, formData: Partial<ChatbotFormData>) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Not authenticated")

  const payload: Record<string, unknown> = { ...formData }
  if (formData.ai_model) payload.selected_model = formData.ai_model

  const { error } = await supabase
    .from("chatbots")
    .update(payload)
    .eq("id", id)
    .eq("user_id", user.id)

  if (error) throw new Error(error.message)
  revalidatePath(`/dashboard/chatbots/${id}/settings`)
  revalidatePath("/dashboard/chatbots")
}

// ─── Toggle active ────────────────────────────────────────────────────────────

export async function toggleChatbotStatus(id: string, currentStatus: boolean) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: "Not authenticated" }

  const { error } = await supabase
    .from("chatbots")
    .update({ is_active: !currentStatus })
    .eq("id", id)
    .eq("user_id", user.id)

  if (error) {
    console.error("[chatbot-actions] toggleChatbotStatus:", error)
    return { success: false, error: error.message }
  }
  revalidatePath("/dashboard/chatbots")
  return { success: true, error: null }
}

// ─── Delete ───────────────────────────────────────────────────────────────────

export async function deleteChatbot(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: "Not authenticated" }

  const { error } = await supabase
    .from("chatbots")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id)

  if (error) {
    console.error("[chatbot-actions] deleteChatbot:", error)
    return { success: false, error: error.message }
  }
  revalidatePath("/dashboard/chatbots")
  return { success: true, error: null }
}
