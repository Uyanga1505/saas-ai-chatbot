"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { formatDistanceToNow } from "date-fns"
import { useState, useEffect } from "react"
import { fetchLeads, type Lead } from "@/app/actions/leads-actions"
import { useChatbot } from "@/lib/chatbot-context"
import { Users, ExternalLink } from "lucide-react"
import Link from "next/link"

export function RecentConversations() {
  const { selectedChatbotId, getPageIds } = useChatbot()
  const [conversations, setConversations] = useState<Lead[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadConversations()
  }, [selectedChatbotId])

  const loadConversations = async () => {
    setIsLoading(true)
    const pageIds = getPageIds()
    const { data } = await fetchLeads(pageIds.length > 0 ? pageIds : undefined)
    setConversations(data.slice(0, 5))
    setIsLoading(false)
  }

  const getStatusColor = (qualified: boolean) => {
    return qualified ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
  }

  const getSentimentColor = (sentiment: string | null) => {
    if (!sentiment) return "bg-gray-100 text-gray-800"
    if (sentiment.toLowerCase() === "positive") return "bg-green-100 text-green-800"
    if (sentiment.toLowerCase() === "negative") return "bg-red-100 text-red-800"
    return "bg-blue-100 text-blue-800"
  }

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return "Recently"
    try {
      const date = new Date(dateString)
      if (isNaN(date.getTime())) return "Recently"
      return formatDistanceToNow(date, { addSuffix: true })
    } catch (error) {
      return "Recently"
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Conversations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">Loading conversations...</div>
        </CardContent>
      </Card>
    )
  }

  if (conversations.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Conversations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">No conversations yet</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Recent Conversations</CardTitle>
        <Link href="/dashboard/leads">
          <Button variant="ghost" size="sm" className="gap-2">
            View All
            <ExternalLink className="h-4 w-4" />
          </Button>
        </Link>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {conversations.map((conversation) => (
            <Link key={conversation.id} href={`/dashboard/leads/${conversation.id}`}>
              <div className="flex items-center justify-between space-x-4 rounded-lg border p-4 hover:bg-accent transition-colors cursor-pointer">
                <div className="flex items-center space-x-4 flex-1 min-w-0">
                  <Avatar className="h-10 w-10 flex-shrink-0">
                    <AvatarFallback className="bg-blue-100 text-blue-600">
                      <Users className="h-5 w-5" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="space-y-1 flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {conversation.email_address || `Session ${conversation.session_id.slice(0, 12)}...`}
                    </p>
                    <p className="text-sm text-muted-foreground truncate">
                      {conversation.summary || `${conversation.message_count} messages`}
                    </p>
                    <div className="flex items-center gap-2 flex-wrap">
                      {conversation.sentiment && (
                        <Badge variant="outline" className={`${getSentimentColor(conversation.sentiment)} text-xs`}>
                          {conversation.sentiment}
                        </Badge>
                      )}
                      <span className="text-xs text-muted-foreground">{formatDate(conversation.updated_at)}</span>
                    </div>
                  </div>
                </div>
                <Badge className={`${getStatusColor(conversation.qualified_lead)} text-xs flex-shrink-0`}>
                  {conversation.qualified_lead ? "Qualified" : "Lead"}
                </Badge>
              </div>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
