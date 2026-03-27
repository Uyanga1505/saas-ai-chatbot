"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { MessageSquare, Bot, User } from "lucide-react"
import { useState, useEffect } from "react"
import { getConversationHistory } from "@/app/actions/leads-actions"
import { format } from "date-fns"

interface Message {
  id: number
  created_at: string
  session_id: string
  message: {
    role?: string
    content?: string
    text?: string
    sender?: string
    [key: string]: any
  }
  conversation_id: string
  user_id: string | null
  sender_id: string
}

interface ConversationHistoryProps {
  sessionId: string
  conversationId?: string
}

export function ConversationHistory({ sessionId, conversationId }: ConversationHistoryProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchMessages()
  }, [sessionId])

  const fetchMessages = async () => {
    try {
      console.log("[v0] Fetching messages for session:", sessionId)
      const data = await getConversationHistory(sessionId, conversationId)
      console.log("[v0] Received messages:", data?.length || 0)
      setMessages(data || [])
    } catch (error) {
      console.error("[v0] Error fetching messages:", error)
    }
    setIsLoading(false)
  }

  const getMessageText = (message: Message["message"]) => {
    if (!message) return "No message"
    if (typeof message === "string") return message

    // Check common message field names
    if (message.content) return message.content
    if (message.text) return message.text
    if (message.message) return message.message
    if (message.body) return message.body

    // If it's an object with no obvious text field, stringify it
    return JSON.stringify(message, null, 2)
  }

  const isUserMessage = (message: Message) => {
    const msgData = message.message
    const senderId = message.sender_id?.toLowerCase() || ""

    // Check type field (n8n LangChain format: {type: "human"/"ai", content: "..."})
    if (msgData?.type === "human") return true
    if (msgData?.type === "ai") return false

    // Check role field
    if (msgData?.role === "user" || msgData?.role === "human") return true
    if (msgData?.role === "assistant" || msgData?.role === "bot" || msgData?.role === "ai") return false

    // Check sender field
    if (msgData?.sender === "user" || msgData?.sender === "human") return true
    if (msgData?.sender === "bot" || msgData?.sender === "assistant") return false

    // Check sender_id
    if (senderId.includes("user") || senderId.includes("customer")) return true
    if (senderId.includes("bot") || senderId.includes("assistant")) return false

    // Default: alternate between user and bot
    return messages.indexOf(message) % 2 === 0
  }

  const formatMessageDate = (dateString: string) => {
    try {
      const date = new Date(dateString)
      if (isNaN(date.getTime())) return "Recently"
      return format(date, "MMM d, h:mm a")
    } catch {
      return "Recently"
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Conversation History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">Loading conversation...</div>
        </CardContent>
      </Card>
    )
  }

  if (messages.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Conversation History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">No messages found for this conversation.</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Conversation History
          <Badge variant="secondary" className="ml-2">
            {messages.length} messages
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {messages.map((message, idx) => {
            const isUser = isUserMessage(message)
            const messageText = getMessageText(message.message)

            return (
              <div key={message.id || idx} className={`flex gap-3 ${isUser ? "justify-start" : "justify-end"}`}>
                {isUser && (
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-blue-100 text-blue-600">
                      <User className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                )}

                <div className={`flex flex-col ${isUser ? "items-start" : "items-end"} max-w-[70%]`}>
                  <div
                    className={`rounded-lg px-4 py-2 ${
                      isUser ? "bg-blue-100 text-blue-900" : "bg-gray-100 text-gray-900"
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap break-words">{messageText}</p>
                  </div>
                  <span className="text-xs text-muted-foreground mt-1">{formatMessageDate(message.created_at)}</span>
                </div>

                {!isUser && (
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-purple-100 text-purple-600">
                      <Bot className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                )}
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
