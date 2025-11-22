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
      const data = await getConversationHistory(sessionId, conversationId)
      setMessages(data || [])
    } catch (error) {
      console.error("Error fetching messages:", error)
    }
    setIsLoading(false)
  }

  // Extract message text from various possible formats
  const getMessageText = (message: Message["message"]) => {
    if (typeof message === "string") return message
    if (message.content) return message.content
    if (message.text) return message.text
    return JSON.stringify(message)
  }

  // Determine if message is from user or bot
  const isUserMessage = (message: Message) => {
    const msgData = message.message
    if (msgData.role === "user" || msgData.sender === "user") return true
    if (msgData.role === "assistant" || msgData.sender === "bot") return false
    // Default to alternating pattern
    return messages.indexOf(message) % 2 === 0
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
              <div key={message.id} className={`flex gap-3 ${isUser ? "justify-start" : "justify-end"}`}>
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
                  <span className="text-xs text-muted-foreground mt-1">
                    {format(new Date(message.created_at), "MMM d, h:mm a")}
                  </span>
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
