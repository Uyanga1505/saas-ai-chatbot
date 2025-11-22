"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { formatDistanceToNow } from "date-fns"

const conversations = [
  {
    id: "1",
    user: "John Doe",
    lastMessage: "Thanks for the help with my order!",
    timestamp: new Date(Date.now() - 1000 * 60 * 15), // 15 minutes ago
    status: "resolved",
    chatbot: "Support Bot",
  },
  {
    id: "2",
    user: "Sarah Wilson",
    lastMessage: "Can you help me with product recommendations?",
    timestamp: new Date(Date.now() - 1000 * 60 * 45), // 45 minutes ago
    status: "active",
    chatbot: "Sales Bot",
  },
  {
    id: "3",
    user: "Mike Johnson",
    lastMessage: "What are your business hours?",
    timestamp: new Date(Date.now() - 1000 * 60 * 120), // 2 hours ago
    status: "resolved",
    chatbot: "FAQ Bot",
  },
  {
    id: "4",
    user: "Emily Chen",
    lastMessage: "I need help with my account settings",
    timestamp: new Date(Date.now() - 1000 * 60 * 180), // 3 hours ago
    status: "pending",
    chatbot: "Support Bot",
  },
]

export function RecentConversations() {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800"
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "resolved":
        return "bg-gray-100 text-gray-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Conversations</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {conversations.map((conversation) => (
            <div key={conversation.id} className="flex items-center justify-between space-x-4 rounded-lg border p-4">
              <div className="flex items-center space-x-4">
                <Avatar className="h-10 w-10">
                  <AvatarFallback>
                    {conversation.user
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </AvatarFallback>
                </Avatar>
                <div className="space-y-1">
                  <p className="text-sm font-medium">{conversation.user}</p>
                  <p className="text-sm text-muted-foreground">{conversation.lastMessage}</p>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {conversation.chatbot}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(conversation.timestamp, { addSuffix: true })}
                    </span>
                  </div>
                </div>
              </div>
              <Badge className={`${getStatusColor(conversation.status)} text-xs`}>{conversation.status}</Badge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
