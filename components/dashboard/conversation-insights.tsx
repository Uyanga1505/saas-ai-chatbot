"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { getConversationInsights, type ConversationInsight } from "@/app/actions/insights-actions"
import { Activity, Brain, MessageSquare, TrendingUp, Zap, Target } from "lucide-react"

interface ConversationInsightsProps {
  sessionId: string
}

export function ConversationInsights({ sessionId }: ConversationInsightsProps) {
  const [insights, setInsights] = useState<ConversationInsight[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchInsights() {
      setLoading(true)
      const { insights: data, error: err } = await getConversationInsights(sessionId)

      if (err) {
        setError(err)
      } else {
        setInsights(data)
      }

      setLoading(false)
    }

    if (sessionId) {
      fetchInsights()
    }
  }, [sessionId])

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>AI Insights</CardTitle>
          <CardDescription>Loading conversation analytics...</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>AI Insights</CardTitle>
          <CardDescription>Unable to load insights</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{error}</p>
        </CardContent>
      </Card>
    )
  }

  if (insights.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>AI Insights</CardTitle>
          <CardDescription>No insights available for this conversation</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Insights will appear here once the conversation is analyzed.</p>
        </CardContent>
      </Card>
    )
  }

  // Get the latest insight
  const latestInsight = insights[0]

  const getSentimentColor = (sentiment?: string) => {
    switch (sentiment?.toLowerCase()) {
      case "positive":
        return "default"
      case "negative":
        return "destructive"
      case "neutral":
        return "secondary"
      default:
        return "outline"
    }
  }

  const formatScore = (score?: number) => {
    if (!score && score !== 0) return "N/A"
    return `${Math.round(score * 100)}%`
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            AI Insights & Analytics
          </CardTitle>
          <CardDescription>Comprehensive conversation analysis powered by AI</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Sentiment Analysis */}
          {latestInsight.sentiment && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Activity className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Sentiment</span>
                </div>
                <Badge variant={getSentimentColor(latestInsight.sentiment)}>{latestInsight.sentiment}</Badge>
              </div>
              {latestInsight.sentiment_score !== undefined && (
                <div className="text-sm text-muted-foreground">
                  Confidence: {formatScore(latestInsight.sentiment_score)}
                </div>
              )}
            </div>
          )}

          {/* Intent Detection */}
          {(latestInsight.intent || latestInsight.customer_intent) && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Target className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Customer Intent</span>
                </div>
                <Badge variant="outline">{latestInsight.intent || latestInsight.customer_intent}</Badge>
              </div>
            </div>
          )}

          {/* Engagement Score */}
          {latestInsight.engagement_score !== undefined && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Engagement Score</span>
                </div>
                <span className="text-sm font-semibold">{formatScore(latestInsight.engagement_score)}</span>
              </div>
              <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary transition-all"
                  style={{ width: `${(latestInsight.engagement_score || 0) * 100}%` }}
                />
              </div>
            </div>
          )}

          {/* Response Quality */}
          {latestInsight.response_quality !== undefined && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Response Quality</span>
                </div>
                <span className="text-sm font-semibold">{formatScore(latestInsight.response_quality)}</span>
              </div>
              <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                <div
                  className="h-full bg-green-500 transition-all"
                  style={{ width: `${(latestInsight.response_quality || 0) * 100}%` }}
                />
              </div>
            </div>
          )}

          {/* Conversation Metrics */}
          {(latestInsight.message_count || latestInsight.conversation_duration) && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 mb-2">
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Conversation Metrics</span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {latestInsight.message_count && (
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Messages</p>
                    <p className="text-lg font-semibold">{latestInsight.message_count}</p>
                  </div>
                )}
                {latestInsight.conversation_duration && (
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Duration</p>
                    <p className="text-lg font-semibold">{Math.round(latestInsight.conversation_duration / 60)}m</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Topics */}
          {latestInsight.topics && latestInsight.topics.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Topics Discussed</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {latestInsight.topics.map((topic, index) => (
                  <Badge key={index} variant="secondary">
                    {topic}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Key Phrases */}
          {latestInsight.key_phrases && latestInsight.key_phrases.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Key Phrases</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {latestInsight.key_phrases.map((phrase, index) => (
                  <Badge key={index} variant="outline">
                    {phrase}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* AI Analysis */}
          {latestInsight.ai_analysis && (
            <div className="space-y-2 pt-4 border-t">
              <span className="text-sm font-medium">AI Analysis Summary</span>
              <div className="text-sm text-muted-foreground bg-secondary/50 p-3 rounded-lg">
                {typeof latestInsight.ai_analysis === "string"
                  ? latestInsight.ai_analysis
                  : JSON.stringify(latestInsight.ai_analysis, null, 2)}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
