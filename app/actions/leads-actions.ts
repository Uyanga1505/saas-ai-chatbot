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
  conversation?: any
  full_conversation_history?: any
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

export async function getConversationHistory(sessionId: string, conversationId?: string) {
  try {
    const supabase = await createClient()

    console.log("[v0] Fetching conversation for session:", sessionId)

    const { data: messages, error: messagesError } = await supabase
      .from("n8n_chat_histories")
      .select("*")
      .eq("session_id", sessionId)
      .order("created_at", { ascending: true })

    if (messagesError) {
      console.error("[v0] Error fetching messages:", messagesError)
      return []
    }

    if (!messages || messages.length === 0) {
      console.log("[v0] No messages found for session")
      return []
    }

    console.log("[v0] Found", messages.length, "message rows")
    console.log("[v0] Sample message keys:", messages[0] ? Object.keys(messages[0]) : "no data")

    return messages.map((row: any, idx: number) => ({
      id: row.id || idx,
      created_at: row.created_at || row.updated_at,
      session_id: sessionId,
      message: row.message || row.summary || row,
      conversation_id: sessionId,
      user_id: row.user_id || null,
      sender_id: row.sender_id || "unknown",
    }))
  } catch (error) {
    console.error("[v0] Error fetching conversation:", error)
    return []
  }
}

export async function getLeads() {
  return fetchLeads()
}

export async function getLeadById(id: string) {
  const result = await fetchLeadById(Number.parseInt(id))
  return result.data
}

export async function getLeadsSummary() {
  try {
    const supabase = await createClient()

    const { data: leads, error } = await supabase.from("n8n_chat_histories").select("*")

    if (error) {
      console.error("Error fetching leads summary:", error)
      return {
        totalLeads: 0,
        qualifiedLeads: 0,
        withContactInfo: 0,
        avgQualityScore: 0,
      }
    }

    const totalLeads = leads?.length || 0
    const qualifiedLeads = leads?.filter((lead: any) => lead.qualified_lead === true).length || 0
    const withContactInfo = leads?.filter((lead: any) => lead.email_address || lead.phone).length || 0

    const qualityScores = leads
      ?.map((lead: any) => lead.lead_quality_score)
      .filter((score: any) => score != null && !isNaN(score))

    const avgQualityScore =
      qualityScores && qualityScores.length > 0
        ? qualityScores.reduce((sum: number, score: number) => sum + score, 0) / qualityScores.length
        : 0

    return {
      totalLeads,
      qualifiedLeads,
      withContactInfo,
      avgQualityScore,
    }
  } catch (error) {
    console.error("Error calculating leads summary:", error)
    return {
      totalLeads: 0,
      qualifiedLeads: 0,
      withContactInfo: 0,
      avgQualityScore: 0,
    }
  }
}
