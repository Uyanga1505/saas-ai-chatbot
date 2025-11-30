"use server"

import { createClient } from "@/lib/supabase/server"

export interface Lead {
  id: number
  session_id: string
  message_count: number
  qualified_lead: boolean
  email_address: string | null
  phone: string | null
  summary: string | null
  lead_quality_score: number | null
  pain_points: string[] | null
  customer_intent: string | null
  recommended_followup: string | null
  sentiment: string | null
  analyzed_at: string | null
  created_at: string
  updated_at: string
  sender_id: string | null
}

export interface Message {
  id: number
  session_id: string
  message: any // JSONB field containing message data
  conversation_id: string | null
  user_id: string | null
  sender_id: string | null
  created_at: string
}

export async function fetchLeads() {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from("n8n_chat_histories")
      .select("*")
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching leads:", error)
      return { data: [], error: error.message }
    }

    return { data: data || [], error: null }
  } catch (error) {
    console.error("Error connecting to database:", error)
    return { data: [], error: "Failed to connect to database" }
  }
}

export async function fetchLeadById(id: number) {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase.from("n8n_chat_histories").select("*").eq("id", id).single()

    if (error) {
      console.error("Error fetching lead:", error)
      return { data: null, error: error.message }
    }

    return { data, error: null }
  } catch (error) {
    console.error("Error connecting to database:", error)
    return { data: null, error: "Failed to connect to database" }
  }
}

export async function fetchConversationHistory(sessionId: string) {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from("conversation_history")
      .select("*")
      .eq("session_id", sessionId)
      .order("created_at", { ascending: true })

    if (error) {
      console.error("Error fetching conversation history:", error)
      return { data: [], error: error.message }
    }

    return { data: data || [], error: null }
  } catch (error) {
    console.error("Error connecting to database:", error)
    return { data: [], error: "Failed to connect to database" }
  }
}

export async function getLeads() {
  return fetchLeads()
}

export async function getLeadById(id: string) {
  const result = await fetchLeadById(Number.parseInt(id))
  return result.data
}

export async function getConversationHistory(sessionId: string, conversationId?: string) {
  try {
    const supabase = await createClient()

    let query = supabase.from("conversation_history").select("*").order("created_at", { ascending: true })

    // Filter by session_id or conversation_id
    if (conversationId) {
      query = query.eq("conversation_id", conversationId)
    } else {
      query = query.eq("session_id", sessionId)
    }

    const { data, error } = await query

    if (error) {
      console.error("Error fetching conversation history:", error)
      return []
    }

    return data || []
  } catch (error) {
    console.error("Error connecting to database:", error)
    return []
  }
}
