"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { getInsightsSummary } from "@/app/actions/insights-actions"
import { Brain, TrendingUp, Smile, Frown, Meh, Target, Activity } from "lucide-react"

export default function InsightsPage() {
  const [summary, setSummary] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchSummary() {
      setLoading(true)
      const { summary: data, error: err } = await getInsightsSummary()

      if (err) {
        setError(err)
      } else {
        setSummary(data)
      }

      setLoading(false)
    }

    fetchSummary()
  }, [])

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">AI Insights Dashboard</h1>
          <p className="text-muted-foreground">Aggregate analytics across all conversations</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">AI Insights Dashboard</h1>
          <p className="text-muted-foreground">Aggregate analytics across all conversations</p>
        </div>

        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Activity className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Unable to load insights</h3>
            <p className="text-sm text-muted-foreground">{error}</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!summary) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">AI Insights Dashboard</h1>
          <p className="text-muted-foreground">Aggregate analytics across all conversations</p>
        </div>

        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Brain className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No insights available</h3>
            <p className="text-sm text-muted-foreground">Insights will appear here once conversations are analyzed.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const sentimentData = Object.entries(summary.sentimentDistribution || {}).map(([key, value]) => ({
    sentiment: key,
    count: value as number,
  }))

  const intentData = Object.entries(summary.intentDistribution || {}).map(([key, value]) => ({
    intent: key,
    count: value as number,
  }))

  const getSentimentIcon = (sentiment: string) => {
    switch (sentiment.toLowerCase()) {
      case "positive":
        return <Smile className="h-4 w-4 text-green-600" />
      case "negative":
        return <Frown className="h-4 w-4 text-red-600" />
      case "neutral":
        return <Meh className="h-4 w-4 text-blue-600" />
      default:
        return <Meh className="h-4 w-4" />
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">AI Insights Dashboard</h1>
        <p className="text-muted-foreground">Aggregate analytics across all conversations</p>
      </div>

      {/* Summary Stats */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Insights</CardTitle>
            <Brain className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.totalInsights}</div>
            <p className="text-xs text-muted-foreground">Conversations analyzed</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Avg Engagement</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Math.round(summary.averageEngagement * 100)}%</div>
            <p className="text-xs text-muted-foreground">Average engagement score</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Sentiment Types</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{sentimentData.length}</div>
            <p className="text-xs text-muted-foreground">Different sentiments detected</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Intent Types</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{intentData.length}</div>
            <p className="text-xs text-muted-foreground">Different intents identified</p>
          </CardContent>
        </Card>
      </div>

      {/* Sentiment Distribution */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Sentiment Distribution
          </CardTitle>
          <CardDescription>How customers feel about their conversations</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {sentimentData.map((item) => (
              <div key={item.sentiment} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {getSentimentIcon(item.sentiment)}
                    <span className="text-sm font-medium capitalize">{item.sentiment}</span>
                  </div>
                  <span className="text-sm font-semibold">{item.count}</span>
                </div>
                <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all ${
                      item.sentiment.toLowerCase() === "positive"
                        ? "bg-green-500"
                        : item.sentiment.toLowerCase() === "negative"
                          ? "bg-red-500"
                          : "bg-blue-500"
                    }`}
                    style={{ width: `${(item.count / summary.totalInsights) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Intent Distribution */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Customer Intent Distribution
          </CardTitle>
          <CardDescription>What customers are trying to accomplish</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {intentData.map((item) => (
              <div key={item.intent} className="flex items-center justify-between p-3 border rounded-lg">
                <span className="text-sm font-medium capitalize">{item.intent.replace(/_/g, " ")}</span>
                <Badge variant="secondary">{item.count}</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
