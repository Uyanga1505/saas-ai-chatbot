"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { getLeadsSummary } from "@/app/actions/leads-actions"
import { getInsightsSummary } from "@/app/actions/insights-actions"
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"
import { Users, MessageSquare, Target, Activity } from "lucide-react"

const COLORS = ["hsl(var(--chart-1))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))"]

export default function AnalyticsPage() {
  const [leadStats, setLeadStats] = useState<any>(null)
  const [insightStats, setInsightStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadAnalytics()
  }, [])

  async function loadAnalytics() {
    try {
      const [leads, insights] = await Promise.all([getLeadsSummary(), getInsightsSummary()])
      setLeadStats(leads)
      setInsightStats(insights)
    } catch (error) {
      console.error("Failed to load analytics:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-muted-foreground">Loading analytics...</div>
      </div>
    )
  }

  const sentimentData = insightStats?.sentimentDistribution || []
  const intentData = insightStats?.intentDistribution || []

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Analytics</h1>
        <p className="text-muted-foreground">Comprehensive insights into your conversations and leads</p>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Conversations</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{leadStats?.totalLeads || 0}</div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Qualified Leads</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{leadStats?.qualifiedLeads || 0}</div>
            <p className="text-xs text-muted-foreground">
              {leadStats?.totalLeads > 0
                ? `${Math.round((leadStats.qualifiedLeads / leadStats.totalLeads) * 100)}% conversion`
                : "No data"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">With Contact Info</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{leadStats?.withContactInfo || 0}</div>
            <p className="text-xs text-muted-foreground">Email or phone collected</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Quality Score</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {leadStats?.avgQualityScore ? leadStats.avgQualityScore.toFixed(1) : "N/A"}
            </div>
            <p className="text-xs text-muted-foreground">Out of 10</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Sentiment Distribution</CardTitle>
            <CardDescription>Customer sentiment analysis across conversations</CardDescription>
          </CardHeader>
          <CardContent>
            {sentimentData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={sentimentData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={(entry) => `${entry.sentiment}: ${entry.count}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="count"
                  >
                    {sentimentData.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                No sentiment data available
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Customer Intent</CardTitle>
            <CardDescription>Distribution of customer intentions</CardDescription>
          </CardHeader>
          <CardContent>
            {intentData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={intentData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="intent" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="count" fill="hsl(var(--chart-1))" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                No intent data available
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Additional Stats */}
      <Card>
        <CardHeader>
          <CardTitle>Conversation Insights Summary</CardTitle>
          <CardDescription>Key metrics from your conversation insights</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <p className="text-sm font-medium">Total Insights</p>
              <p className="text-2xl font-bold">{insightStats?.totalInsights || 0}</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium">Most Common Sentiment</p>
              <p className="text-2xl font-bold capitalize">
                {sentimentData.length > 0
                  ? sentimentData.sort((a: any, b: any) => b.count - a.count)[0].sentiment
                  : "N/A"}
              </p>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium">Most Common Intent</p>
              <p className="text-2xl font-bold capitalize">
                {intentData.length > 0 ? intentData.sort((a: any, b: any) => b.count - a.count)[0].intent : "N/A"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
