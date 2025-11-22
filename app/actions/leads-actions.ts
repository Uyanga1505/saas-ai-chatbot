"use server"

import { createExternalClient } from "@/lib/supabase/external-client"

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
  sender: string
  message_text: string
  timestamp: string
  created_at: string
}

export async function fetchLeads() {
  try {
    const supabase = createExternalClient()

    if (!supabase) {
      console.warn("External Supabase is not configured.")
      return { data: [], error: null }
    }

    const { data, error } = await supabase.from("conversations").select("*").order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching leads:", error)
      return { data: [], error: error.message }
    }

    return { data: data || [], error: null }
  } catch (error) {
    console.error("Error connecting to external database:", error)
    return { data: [], error: "Failed to connect to external database" }
  }
}

export async function fetchLeadById(id: number) {
  try {
    const supabase = createExternalClient()

    if (!supabase) {
      return { data: null, error: "External Supabase is not configured" }
    }

    const { data, error } = await supabase.from("conversations").select("*").eq("id", id).single()

    if (error) {
      console.error("Error fetching lead:", error)
      return { data: null, error: error.message }
    }

    return { data, error: null }
  } catch (error) {
    console.error("Error connecting to external database:", error)
    return { data: null, error: "Failed to connect to external database" }
  }
}

export async function fetchConversationHistory(sessionId: string) {
  try {
    const supabase = createExternalClient()

    if (!supabase) {
      return { data: [], error: "External Supabase is not configured" }
    }

    const { data, error } = await supabase
      .from("messages")
      .select("*")
      .eq("session_id", sessionId)
      .order("timestamp", { ascending: true })

    if (error) {
      console.error("Error fetching conversation history:", error)
      return { data: [], error: error.message }
    }

    return { data: data || [], error: null }
  } catch (error) {
    console.error("Error connecting to external database:", error)
    return { data: [], error: "Failed to connect to external database" }
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
    const supabase = createExternalClient()

    if (!supabase) {
      return []
    }

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
    console.error("Error connecting to external database:", error)
    return []
  }
}
