"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Plus, Bot, Settings, Play, Pause, Trash2, MessageSquare, TestTube } from "lucide-react"
import Link from "next/link"
import { useState, useEffect } from "react"
import { getChatbots, toggleChatbotStatus, deleteChatbot } from "@/app/actions/chatbot-actions"

interface Chatbot {
  id: string
  name: string
  description: string
  is_active: boolean
  ai_model: string
  created_at: string
  messenger_page_id?: string
}

export default function ChatbotsPage() {
  const [chatbots, setChatbots] = useState<Chatbot[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchChatbots()
  }, [])

  const fetchChatbots = async () => {
    const { data, error } = await getChatbots()

    if (error) {
      console.error("Error fetching chatbots:", error)
    } else {
      setChatbots(data || [])
    }
    setIsLoading(false)
  }

  const handleToggleStatus = async (id: string, currentStatus: boolean) => {
    const { success, error } = await toggleChatbotStatus(id, currentStatus)

    if (error) {
      console.error("Error updating chatbot status:", error)
    } else if (success) {
      fetchChatbots()
    }
  }

  const handleDeleteChatbot = async (id: string) => {
    if (!confirm("Are you sure you want to delete this chatbot?")) return

    const { success, error } = await deleteChatbot(id)

    if (error) {
      console.error("Error deleting chatbot:", error)
    } else if (success) {
      fetchChatbots()
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Chatbots</h1>
        </div>
        <div className="text-center py-12">Loading...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Chatbots</h1>
          <p className="text-muted-foreground">Create and manage your AI chatbots for Messenger</p>
        </div>
        <Button asChild>
          <Link href="/dashboard/chatbots/new" className="gap-2">
            <Plus className="h-4 w-4" />
            New Chatbot
          </Link>
        </Button>
      </div>

      {chatbots.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Bot className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No chatbots yet</h3>
            <p className="text-muted-foreground text-center mb-4">
              Create your first AI chatbot to start engaging with customers on Messenger
            </p>
            <Button asChild>
              <Link href="/dashboard/chatbots/new" className="gap-2">
                <Plus className="h-4 w-4" />
                Create Chatbot
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {chatbots.map((chatbot) => (
            <Card key={chatbot.id} className="relative">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                      <Bot className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{chatbot.name}</CardTitle>
                      <Badge
                        className={`mt-1 ${
                          chatbot.is_active ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {chatbot.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">{chatbot.description || "No description provided"}</p>

                <div className="space-y-2 text-xs text-muted-foreground mb-4">
                  <div className="flex justify-between">
                    <span>AI Model:</span>
                    <span className="font-medium">{chatbot.ai_model}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Status:</span>
                    <span className="font-medium">{chatbot.messenger_page_id ? "Connected" : "Not Connected"}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => handleToggleStatus(chatbot.id, chatbot.is_active)}>
                    {chatbot.is_active ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                  </Button>

                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/dashboard/chatbots/${chatbot.id}/test`}>
                      <TestTube className="h-4 w-4" />
                    </Link>
                  </Button>

                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/dashboard/chatbots/${chatbot.id}/conversations`}>
                      <MessageSquare className="h-4 w-4" />
                    </Link>
                  </Button>

                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/dashboard/chatbots/${chatbot.id}/settings`}>
                      <Settings className="h-4 w-4" />
                    </Link>
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteChatbot(chatbot.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
