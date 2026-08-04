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

export async function fetchLeads(filterPageIds?: string[]) {
  try {
    const supabase = await createClient()

    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { data: [], error: "Not authenticated" }

    // Use provided page_ids or fetch all from user's chatbots
    let pageIds = filterPageIds
    if (!pageIds || pageIds.length === 0) {
      const { data: chatbots, error: chatbotsError } = await supabase
        .from("chatbots")
        .select("messenger_page_id")
        .eq("user_id", user.id)

      if (chatbotsError) {
        console.error("Error fetching user chatbots:", chatbotsError)
        return { data: [], error: chatbotsError.message }
      }

      if (!chatbots || chatbots.length === 0) {
        return { data: [], error: null }
      }

      pageIds = chatbots.map(c => c.messenger_page_id).filter(Boolean)
    }

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

    // Authenticate and scope to user's chatbots
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    const { data: chatbots } = await supabase
      .from("chatbots")
      .select("messenger_page_id")
      .eq("user_id", user.id)

    const pageIds = chatbots?.map(c => c.messenger_page_id).filter(Boolean) || []
    if (pageIds.length === 0) return []

    console.log("[v0] Fetching conversation for session:", sessionId)

    const { data: messages, error: messagesError } = await supabase
      .from("n8n_chat_histories")
      .select("*")
      .eq("session_id", sessionId)
      .in("page_id", pageIds)  // Tenant isolation
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

export async function getLeadsSummary(filterPageIds?: string[]) {
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

    const userPageIds = chatbots.map(c => c.messenger_page_id).filter(Boolean)
    // Optional filter (e.g. selected chatbot) — always intersected with the
    // user's own pages so a caller can never widen the scope.
    const pageIds =
      filterPageIds && filterPageIds.length > 0
        ? userPageIds.filter(p => filterPageIds.includes(p))
        : userPageIds
    if (pageIds.length === 0) {
      return { totalLeads: 0, qualifiedLeads: 0, withContactInfo: 0, avgQualityScore: 0 }
    }

    // Use server-side counts — select("*") is capped at 1000 rows and
    // produces wrong totals for large datasets.
    const [totalRes, qualifiedRes, contactRes, scoresRes] = await Promise.all([
      supabase
        .from("conversation_insights")
        .select("*", { count: "exact", head: true })
        .in("page_id", pageIds),
      supabase
        .from("conversation_insights")
        .select("*", { count: "exact", head: true })
        .in("page_id", pageIds)
        .eq("qualified_lead", true),
      supabase
        .from("conversation_insights")
        .select("*", { count: "exact", head: true })
        .in("page_id", pageIds)
        .or("email_address.not.is.null,phone.not.is.null"),
      supabase
        .from("conversation_insights")
        .select("lead_quality_score")
        .in("page_id", pageIds)
        .not("lead_quality_score", "is", null)
        .order("created_at", { ascending: false })
        .limit(1000),
    ])

    const scores = (scoresRes.data || [])
      .map((r: any) => r.lead_quality_score)
      .filter((s: any) => s != null && !isNaN(s))

    return {
      totalLeads: totalRes.count || 0,
      qualifiedLeads: qualifiedRes.count || 0,
      withContactInfo: contactRes.count || 0,
      avgQualityScore:
        scores.length > 0 ? scores.reduce((a: number, b: number) => a + b, 0) / scores.length : 0,
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
