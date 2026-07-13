"use server"

import { createClient } from "@/lib/supabase/server"

export interface ConversationInsight {
  id: number
  session_id: string
  sentiment?: string
  sentiment_score?: number
  topics?: string[]
  key_phrases?: string[]
  intent?: string
  customer_intent?: string
  engagement_score?: number
  response_quality?: number
  conversation_duration?: number
  message_count?: number
  ai_analysis?: any
  email_address?: string | null
  phone?: string | null
  phone_number?: string | null
  contact_email?: string | null
  created_at: string
  updated_at?: string
}

export async function getConversationInsights(sessionId: string) {
  try {
    const supabase = await createClient()

    // Authenticate and scope to user's chatbots
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { insights: [], error: "Not authenticated" }

    const { data: chatbots } = await supabase
      .from("chatbots")
      .select("messenger_page_id")
      .eq("user_id", user.id)

    const pageIds = chatbots?.map(c => c.messenger_page_id).filter(Boolean) || []
    if (pageIds.length === 0) return { insights: [], error: null }

    const { data, error } = await supabase
      .from("conversation_insights")
      .select("*")
      .eq("session_id", sessionId)
      .in("page_id", pageIds)  // Tenant isolation
      .order("created_at", { ascending: false })

    if (error) {
      console.error("[v0] Error fetching conversation insights:", error)
      return { insights: [], error: error.message }
    }

    return { insights: (data as ConversationInsight[]) || [], error: null }
  } catch (error) {
    console.error("[v0] Exception fetching conversation insights:", error)
    return { insights: [], error: "Failed to fetch conversation insights" }
  }
}

export async function getLeadsWithInsights() {
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
      console.error("[v0] Error fetching user chatbots:", chatbotsError)
      return { data: [], error: chatbotsError.message }
    }

    // If user has no chatbots, return empty data
    if (!chatbots || chatbots.length === 0) {
      return { data: [], error: null }
    }

    const pageIds = chatbots.map(c => c.messenger_page_id)

    // Get leads from n8n_chat_histories filtered by user's chatbot page_ids
    const { data: leads, error: leadsError } = await supabase
      .from("n8n_chat_histories")
      .select("*")
      .in("page_id", pageIds)
      .order("created_at", { ascending: false })

    if (leadsError) {
      console.error("[v0] Error fetching leads:", leadsError)
      return { data: [], error: leadsError.message }
    }

    // Get insights filtered by user's chatbot page_ids
    const { data: insights, error: insightsError } = await supabase
      .from("conversation_insights")
      .select("*")
      .in("page_id", pageIds)

    if (insightsError) {
      console.error("[v0] Error fetching insights:", insightsError)
      // Continue without insights if table doesn't exist
    }

    // Merge insights with leads
    const leadsWithInsights = leads.map((lead: any) => {
      const insight = insights?.find((i: any) => i.session_id === lead.session_id)
      return {
        ...lead,
        insight: insight || null,
        // Merge contact info from both tables (prefer insight table)
        email_address: insight?.email_address || insight?.contact_email || lead.email_address,
        phone: insight?.phone || insight?.phone_number || lead.phone,
      }
    })

    return { data: leadsWithInsights, error: null }
  } catch (error) {
    console.error("[v0] Exception fetching leads with insights:", error)
    return { data: [], error: "Failed to fetch leads with insights" }
  }
}

export async function getInsightsSummary() {
  try {
    const supabase = await createClient()

    // Get current user and their chatbot page_ids for multi-tenant filtering
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { summary: null, error: "Not authenticated" }

    const { data: chatbots } = await supabase
      .from("chatbots")
      .select("messenger_page_id")
      .eq("user_id", user.id)

    const pageIds = chatbots?.map(c => c.messenger_page_id).filter(Boolean) || []

    // If user has no chatbots, return empty summary (don't fall through to unfiltered query)
    if (pageIds.length === 0) {
      return {
        summary: {
          totalInsights: 0,
          sentimentDistribution: {},
          averageEngagement: 0,
          intentDistribution: {},
        },
        error: null,
      }
    }

    let query = supabase.from("conversation_insights").select("*").in("page_id", pageIds).limit(100)

    const { data, error } = await query

    if (error) {
      console.error("[v0] Error fetching insights summary:", error)
      return { summary: null, error: error.message }
    }

    // Calculate summary statistics - safely handle missing fields
    const sentimentCounts = data.reduce((acc: any, insight: any) => {
      const sentiment = insight.sentiment || "neutral"
      acc[sentiment] = (acc[sentiment] || 0) + 1
      return acc
    }, {})

    const engagementScores = data
      .map((insight: any) => insight.engagement_score)
      .filter((score: any) => typeof score === "number")
    const avgEngagement =
      engagementScores.length > 0
        ? engagementScores.reduce((sum: number, score: number) => sum + score, 0) / engagementScores.length
        : 0

    const intentCounts = data.reduce((acc: any, insight: any) => {
      const intent = insight.intent || insight.customer_intent || "unknown"
      acc[intent] = (acc[intent] || 0) + 1
      return acc
    }, {})

    return {
      summary: {
        totalInsights: data.length,
        sentimentDistribution: sentimentCounts,
        averageEngagement: avgEngagement,
        intentDistribution: intentCounts,
      },
      error: null,
    }
  } catch (error) {
    console.error("[v0] Exception fetching insights summary:", error)
    return { summary: null, error: "Failed to fetch insights summary" }
  }
}
