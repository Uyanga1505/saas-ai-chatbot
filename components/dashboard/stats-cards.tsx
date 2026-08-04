"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Bot, MessageSquare, Users, TrendingUp } from "lucide-react"
import { useState, useEffect } from "react"
import { getLeadsSummary } from "@/app/actions/leads-actions"
import { useChatbot } from "@/lib/chatbot-context"

export function StatsCards() {
  const { selectedChatbotId, getPageIds } = useChatbot()
  const [stats, setStats] = useState({
    totalLeads: 0,
    qualifiedLeads: 0,
    avgQualityScore: 0,
    withContactInfo: 0,
  })

  useEffect(() => {
    loadStats()
  }, [selectedChatbotId])

  const loadStats = async () => {
    // Server-side aggregate counts — accurate for any dataset size
    const pageIds = getPageIds()
    const summary = await getLeadsSummary(pageIds.length > 0 ? pageIds : undefined)
    setStats(summary)
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Leads</CardTitle>
          <MessageSquare className="h-4 w-4 text-blue-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalLeads.toLocaleString()}</div>
          <p className="text-xs text-muted-foreground">From Messenger conversations</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Qualified Leads</CardTitle>
          <TrendingUp className="h-4 w-4 text-green-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.qualifiedLeads}</div>
          <p className="text-xs text-muted-foreground">
            {stats.totalLeads > 0 ? ((stats.qualifiedLeads / stats.totalLeads) * 100).toFixed(0) : 0}% conversion rate
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Avg Quality Score</CardTitle>
          <Bot className="h-4 w-4 text-purple-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.avgQualityScore.toFixed(1)}/10</div>
          <p className="text-xs text-muted-foreground">AI-analyzed lead quality</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Contact Info</CardTitle>
          <Users className="h-4 w-4 text-orange-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.withContactInfo}</div>
          <p className="text-xs text-muted-foreground">Leads with email or phone</p>
        </CardContent>
      </Card>
    </div>
  )
}
