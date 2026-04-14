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

    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { data: [], error: "Not authenticated" }

    // Get user's chatbots and their page_ids
    const { data: chatbots, error: chatbotsError } = await supabase
      .from("chatbots")
      .select("messenger_page_id")
      .eq("user_id", user.id)

    if (chatbotsError) {
      console.error("Error fetching user chatbots:", chatbotsError)
      return { data: [], error: chatbotsError.message }
    }

    // If user has no chatbots, return empty data
    if (!chatbots || chatbots.length === 0) {
      return { data: [], error: null }
    }

    const pageIds = chatbots.map(c => c.messenger_page_id)

    // Query conversation_insights filtered by user's chatbot page_ids
    // (qualified_lead, email_address, phone, summary, sentiment, lead_quality_score etc.)
    const { data, error } = await supabase
      .from("conversation_insights")
      .select("*")
      .in("page_id", pageIds)
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

    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { data: null, error: "Not authenticated" }

    // Get user's chatbots and their page_ids
    const { data: chatbots, error: chatbotsError } = await supabase
      .from("chatbots")
      .select("messenger_page_id")
      .eq("user_id", user.id)

    if (chatbotsError) {
      console.error("Error fetching user chatbots:", chatbotsError)
      return { data: null, error: chatbotsError.message }
    }

    // If user has no chatbots, return null
    if (!chatbots || chatbots.length === 0) {
      return { data: null, error: "No chatbots found" }
    }

    const pageIds = chatbots.map(c => c.messenger_page_id)

    // Query conversation_insights filtered by user's chatbot page_ids
    const { data, error } = await supabase
      .from("conversation_insights")
      .select("*")
      .eq("id", id)
      .in("page_id", pageIds)
      .single()

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

    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return {
        totalLeads: 0,
        qualifiedLeads: 0,
        withContactInfo: 0,
        avgQualityScore: 0,
      }
    }

    // Get user's chatbots and their page_ids
    const { data: chatbots, error: chatbotsError } = await supabase
      .from("chatbots")
      .select("messenger_page_id")
      .eq("user_id", user.id)

    if (chatbotsError) {
      console.error("Error fetching user chatbots:", chatbotsError)
      return {
        totalLeads: 0,
        qualifiedLeads: 0,
        withContactInfo: 0,
        avgQualityScore: 0,
      }
    }

    // If user has no chatbots, return zero summary
    if (!chatbots || chatbots.length === 0) {
      return {
        totalLeads: 0,
        qualifiedLeads: 0,
        withContactInfo: 0,
        avgQualityScore: 0,
      }
    }

    const pageIds = chatbots.map(c => c.messenger_page_id)

    const { data: leads, error } = await supabase
      .from("conversation_insights")
      .select("*")
      .in("page_id", pageIds)

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
