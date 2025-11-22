"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Bot, Settings, Play, Pause } from "lucide-react"

const chatbots = [
  {
    id: "1",
    name: "Customer Support Bot",
    description: "Handles customer inquiries and support tickets",
    status: "active",
    conversations: 342,
    responseRate: "98%",
  },
  {
    id: "2",
    name: "Sales Assistant",
    description: "Helps with product recommendations and sales",
    status: "active",
    conversations: 156,
    responseRate: "95%",
  },
  {
    id: "3",
    name: "FAQ Bot",
    description: "Answers frequently asked questions",
    status: "paused",
    conversations: 89,
    responseRate: "99%",
  },
]

export function ChatbotOverview() {
  const getStatusColor = (status: string) => {
    return status === "active" ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Your Chatbots</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {chatbots.map((chatbot) => (
            <div key={chatbot.id} className="flex items-center justify-between space-x-4 rounded-lg border p-4">
              <div className="flex items-center space-x-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <Bot className="h-5 w-5 text-primary" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium">{chatbot.name}</p>
                  <p className="text-sm text-muted-foreground">{chatbot.description}</p>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span>{chatbot.conversations} conversations</span>
                    <span>{chatbot.responseRate} response rate</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge className={`${getStatusColor(chatbot.status)} text-xs`}>{chatbot.status}</Badge>
                <Button variant="ghost" size="sm">
                  {chatbot.status === "active" ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                </Button>
                <Button variant="ghost" size="sm">
                  <Settings className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
