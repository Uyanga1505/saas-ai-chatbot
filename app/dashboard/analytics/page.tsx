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
  ResponsiveContainer,
} from "recharts"
import { Users, MessageSquare, Target, Activity, TrendingUp, Brain } from "lucide-react"

// Explicit palette — CSS chart variables aren't defined in this theme,
// which previously rendered every chart element black.
const PALETTE = ["#6366f1", "#10b981", "#f59e0b", "#f43f5e", "#0ea5e9", "#a855f7", "#14b8a6", "#f97316"]

// Well-known sentiment values get fixed, meaningful colors
const SENTIMENT_COLORS: Record<string, string> = {
  positive: "#10b981",
  neutral: "#94a3b8",
  negative: "#f43f5e",
}

/** Merge duplicate keys that differ only by case/whitespace, keep top N, group rest as "Other". */
function normalizeDistribution(dist: Record<string, number> | undefined, topN: number) {
  if (!dist) return []
  const merged: Record<string, number> = {}
  for (const [rawKey, value] of Object.entries(dist)) {
    const key = rawKey.trim().toLowerCase()
    if (!key) continue
    merged[key] = (merged[key] || 0) + (value as number)
  }
  const sorted = Object.entries(merged).sort((a, b) => b[1] - a[1])
  const top = sorted.slice(0, topN)
  const restTotal = sorted.slice(topN).reduce((sum, [, v]) => sum + v, 0)
  const rows = top.map(([name, count]) => ({ name: capitalize(name), count }))
  if (restTotal > 0) rows.push({ name: "Other", count: restTotal })
  return rows
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

function truncate(s: string, max: number) {
  return s.length > max ? s.slice(0, max - 1) + "…" : s
}

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

  const sentimentData = normalizeDistribution(insightStats?.summary?.sentimentDistribution, 5)
  const intentData = normalizeDistribution(insightStats?.summary?.intentDistribution, 8)
  const totalSentiment = sentimentData.reduce((sum, d) => sum + d.count, 0)

  const sentimentColor = (name: string, index: number) =>
    SENTIMENT_COLORS[name.toLowerCase()] || PALETTE[index % PALETTE.length]

  const kpis = [
    {
      title: "Total Conversations",
      value: (leadStats?.totalLeads || 0).toLocaleString(),
      sub: "All time",
      icon: Users,
      iconBg: "bg-indigo-100 dark:bg-indigo-950",
      iconColor: "text-indigo-600 dark:text-indigo-400",
    },
    {
      title: "Qualified Leads",
      value: (leadStats?.qualifiedLeads || 0).toLocaleString(),
      sub:
        leadStats?.totalLeads > 0
          ? `${Math.round((leadStats.qualifiedLeads / leadStats.totalLeads) * 100)}% conversion`
          : "No data yet",
      icon: Target,
      iconBg: "bg-emerald-100 dark:bg-emerald-950",
      iconColor: "text-emerald-600 dark:text-emerald-400",
    },
    {
      title: "With Contact Info",
      value: (leadStats?.withContactInfo || 0).toLocaleString(),
      sub: "Email or phone collected",
      icon: MessageSquare,
      iconBg: "bg-sky-100 dark:bg-sky-950",
      iconColor: "text-sky-600 dark:text-sky-400",
    },
    {
      title: "Avg Quality Score",
      value: leadStats?.avgQualityScore ? leadStats.avgQualityScore.toFixed(1) : "N/A",
      sub: "Out of 10",
      icon: Activity,
      iconBg: "bg-amber-100 dark:bg-amber-950",
      iconColor: "text-amber-600 dark:text-amber-400",
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Analytics</h1>
        <p className="text-muted-foreground">Comprehensive insights into your conversations and leads</p>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {kpis.map((kpi) => (
          <Card key={kpi.title}>
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">{kpi.title}</p>
                  <p className="text-3xl font-bold tracking-tight">{kpi.value}</p>
                  <p className="text-xs text-muted-foreground">{kpi.sub}</p>
                </div>
                <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${kpi.iconBg}`}>
                  <kpi.icon className={`h-5 w-5 ${kpi.iconColor}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-5">
        {/* Sentiment donut */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-indigo-500" />
              Sentiment Distribution
            </CardTitle>
            <CardDescription>Based on the most recent conversations</CardDescription>
          </CardHeader>
          <CardContent>
            {sentimentData.length > 0 ? (
              <div className="flex flex-col items-center gap-6">
                <div className="relative">
                  <ResponsiveContainer width={220} height={220}>
                    <PieChart>
                      <Pie
                        data={sentimentData}
                        cx="50%"
                        cy="50%"
                        innerRadius={62}
                        outerRadius={95}
                        paddingAngle={3}
                        dataKey="count"
                        nameKey="name"
                        strokeWidth={0}
                      >
                        {sentimentData.map((entry, index) => (
                          <Cell key={entry.name} fill={sentimentColor(entry.name, index)} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value: any, name: any) => [`${Number(value).toLocaleString()} conversations`, name]}
                        contentStyle={{ borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 13 }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-2xl font-bold">{totalSentiment.toLocaleString()}</span>
                    <span className="text-xs text-muted-foreground">analyzed</span>
                  </div>
                </div>

                {/* Legend */}
                <div className="w-full space-y-2">
                  {sentimentData.map((entry, index) => {
                    const pct = totalSentiment > 0 ? Math.round((entry.count / totalSentiment) * 100) : 0
                    return (
                      <div key={entry.name} className="flex items-center gap-3 text-sm">
                        <span
                          className="h-3 w-3 rounded-full flex-shrink-0"
                          style={{ backgroundColor: sentimentColor(entry.name, index) }}
                        />
                        <span className="flex-1 truncate" title={entry.name}>
                          {entry.name}
                        </span>
                        <span className="font-medium tabular-nums">{entry.count.toLocaleString()}</span>
                        <span className="w-10 text-right text-xs text-muted-foreground tabular-nums">{pct}%</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                No sentiment data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Intent horizontal bars */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-emerald-500" />
              Customer Intent
            </CardTitle>
            <CardDescription>What customers are trying to accomplish</CardDescription>
          </CardHeader>
          <CardContent>
            {intentData.length > 0 ? (
              <ResponsiveContainer width="100%" height={Math.max(280, intentData.length * 44)}>
                <BarChart data={intentData} layout="vertical" margin={{ left: 8, right: 24 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                  <XAxis type="number" tick={{ fontSize: 12 }} allowDecimals={false} />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={170}
                    tick={{ fontSize: 12 }}
                    tickFormatter={(v: string) => truncate(v, 24)}
                  />
                  <Tooltip
                    formatter={(value: any) => [`${Number(value).toLocaleString()} conversations`, "Count"]}
                    contentStyle={{ borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 13 }}
                  />
                  <Bar dataKey="count" radius={[0, 6, 6, 0]} maxBarSize={26}>
                    {intentData.map((entry, index) => (
                      <Cell key={entry.name} fill={PALETTE[index % PALETTE.length]} />
                    ))}
                  </Bar>
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

      {/* Summary strip */}
      <Card>
        <CardHeader>
          <CardTitle>Conversation Insights Summary</CardTitle>
          <CardDescription>Key metrics from your conversation insights</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-3">
            <div className="rounded-lg border p-4 space-y-1">
              <p className="text-sm text-muted-foreground">Total Insights</p>
              <p className="text-2xl font-bold">
                {(insightStats?.summary?.totalInsights || 0).toLocaleString()}
              </p>
            </div>
            <div className="rounded-lg border p-4 space-y-1">
              <p className="text-sm text-muted-foreground">Most Common Sentiment</p>
              <p className="text-2xl font-bold truncate" title={sentimentData[0]?.name}>
                {sentimentData[0]?.name || "N/A"}
              </p>
            </div>
            <div className="rounded-lg border p-4 space-y-1">
              <p className="text-sm text-muted-foreground">Most Common Intent</p>
              <p className="text-2xl font-bold truncate" title={intentData[0]?.name}>
                {intentData[0]?.name || "N/A"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
