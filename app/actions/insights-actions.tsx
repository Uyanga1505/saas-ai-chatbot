"use server"

import { createClient } from "@/lib/supabase/server"
import { normalizeSentiment } from "@/lib/sentiment"

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

export async function getLeadsWithInsights(limit = 500) {
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

    const pageIds = chatbots?.map(c => c.messenger_page_id).filter(Boolean) || []
    if (pageIds.length === 0) {
      return { data: [], error: null }
    }

    // conversation_insights is the source of truth for leads:
    // one row per session with AI analysis (qualified, score, sentiment,
    // contact info, summary). n8n_chat_histories holds raw per-message
    // rows and must NOT be used as a leads list.
    const { data: insights, error: insightsError } = await supabase
      .from("conversation_insights")
      .select("*")
      .in("page_id", pageIds)
      .order("created_at", { ascending: false })
      .limit(limit)

    if (insightsError) {
      console.error("[v0] Error fetching leads:", insightsError)
      return { data: [], error: insightsError.message }
    }

    const leads = (insights || []).map((row: any) => ({
      ...row,
      insight: row,
      // Normalize contact fields (data may use contact_email / phone_number)
      email_address: row.email_address || row.contact_email || null,
      phone: row.phone || row.phone_number || null,
    }))

    return { data: leads, error: null }
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

    // Exact total via count; distributions from the most recent 1000 insights
    const [countRes, { data, error }] = await Promise.all([
      supabase
        .from("conversation_insights")
        .select("*", { count: "exact", head: true })
        .in("page_id", pageIds),
      supabase
        .from("conversation_insights")
        .select("sentiment, customer_intent, lead_quality_score")
        .in("page_id", pageIds)
        .order("created_at", { ascending: false })
        .limit(1000),
    ])

    if (error) {
      console.error("[v0] Error fetching insights summary:", error)
      return { summary: null, error: error.message }
    }

    // Group free-form sentiment labels (mixed Mongolian/English variants)
    // into three canonical buckets: positive / neutral / negative
    const sentimentCounts = data.reduce((acc: any, insight: any) => {
      const sentiment = normalizeSentiment(insight.sentiment)
      acc[sentiment] = (acc[sentiment] || 0) + 1
      return acc
    }, {})

    // "Engagement" = average lead quality score (0-10); the table has no
    // separate engagement_score column
    const qualityScores = data
      .map((insight: any) => insight.lead_quality_score)
      .filter((score: any) => typeof score === "number")
    const avgEngagement =
      qualityScores.length > 0
        ? qualityScores.reduce((sum: number, score: number) => sum + score, 0) / qualityScores.length
        : 0

    const intentCounts = data.reduce((acc: any, insight: any) => {
      const intent = insight.customer_intent || "unknown"
      acc[intent] = (acc[intent] || 0) + 1
      return acc
    }, {})

    return {
      summary: {
        totalInsights: countRes.count ?? data.length,
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
