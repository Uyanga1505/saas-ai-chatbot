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

    const { data, error } = await supabase
      .from("conversation_insights")
      .select("*")
      .eq("session_id", sessionId)
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

    // Get all leads from n8n_chat_histories
    const { data: leads, error: leadsError } = await supabase
      .from("n8n_chat_histories")
      .select("*")
      .order("created_at", { ascending: false })

    if (leadsError) {
      console.error("[v0] Error fetching leads:", leadsError)
      return { data: [], error: leadsError.message }
    }

    // Get all insights
    const { data: insights, error: insightsError } = await supabase.from("conversation_insights").select("*")

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

    const { data, error } = await supabase.from("conversation_insights").select("*").limit(100)

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
