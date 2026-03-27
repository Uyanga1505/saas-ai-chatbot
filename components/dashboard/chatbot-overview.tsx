"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Bot, Settings, Play, Pause } from "lucide-react"
import { useState, useEffect } from "react"
import { getChatbots, toggleChatbotStatus } from "@/app/actions/chatbot-actions"
import Link from "next/link"

interface Chatbot {
  id: string
  name: string
  description: string | null
  is_active: boolean
  ai_model: string | null
  messenger_page_id: string | null
}

export function ChatbotOverview() {
  const [chatbots, setChatbots] = useState<Chatbot[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadChatbots()
  }, [])

  const loadChatbots = async () => {
    const { data } = await getChatbots()
    setChatbots(data || [])
    setIsLoading(false)
  }

  const handleToggle = async (id: string, currentStatus: boolean) => {
    await toggleChatbotStatus(id, currentStatus)
    loadChatbots()
  }

  const getStatusColor = (active: boolean) => {
    return active ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader><CardTitle>Your Chatbots</CardTitle></CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">Loading chatbots...</div>
        </CardContent>
      </Card>
    )
  }

  if (chatbots.length === 0) {
    return (
      <Card>
        <CardHeader><CardTitle>Your Chatbots</CardTitle></CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            No chatbots yet.{" "}
            <Link href="/dashboard/chatbots/new" className="text-primary underline">Create one</Link>
          </div>
        </CardContent>
      </Card>
    )
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
                  <p className="text-sm text-muted-foreground">
                    {chatbot.description || "No description"}
                  </p>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span>{chatbot.ai_model || "No model"}</span>
                    <span>{chatbot.messenger_page_id ? "Messenger connected" : "Not connected"}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge className={`${getStatusColor(chatbot.is_active)} text-xs`}>
                  {chatbot.is_active ? "active" : "inactive"}
                </Badge>
                <Button variant="ghost" size="sm" onClick={() => handleToggle(chatbot.id, chatbot.is_active)}>
                  {chatbot.is_active ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                </Button>
                <Link href={`/dashboard/chatbots/${chatbot.id}/settings`}>
                  <Button variant="ghost" size="sm">
                    <Settings className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
