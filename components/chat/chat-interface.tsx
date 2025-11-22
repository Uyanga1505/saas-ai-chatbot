"use client"

import type React from "react"

import { useChat } from "@ai-sdk/react"
import { DefaultChatTransport, type UIMessage } from "ai"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Bot, User, Send } from "lucide-react"
import { useState } from "react"

interface ChatInterfaceProps {
  chatbotId: string
  chatbotName: string
}

export function ChatInterface({ chatbotId, chatbotName }: ChatInterfaceProps) {
  const [input, setInput] = useState("")

  const { messages, sendMessage, status } = useChat<UIMessage>({
    transport: new DefaultChatTransport({
      api: `/api/chat/${chatbotId}`,
      body: {
        messengerUserId: "test-user-" + Math.random().toString(36).substr(2, 9),
      },
    }),
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (input.trim() && status !== "in_progress") {
      sendMessage({ text: input })
      setInput("")
    }
  }

  return (
    <Card className="h-[600px] flex flex-col">
      <CardHeader className="border-b">
        <CardTitle className="flex items-center gap-2">
          <Bot className="h-5 w-5" />
          {chatbotName}
        </CardTitle>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col p-0">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 && (
            <div className="text-center text-muted-foreground py-8">Start a conversation with the chatbot</div>
          )}

          {messages.map((message) => (
            <div key={message.id} className={`flex gap-3 ${message.role === "user" ? "justify-end" : "justify-start"}`}>
              {message.role === "assistant" && (
                <Avatar className="h-8 w-8">
                  <AvatarFallback>
                    <Bot className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
              )}

              <div
                className={`max-w-[80%] rounded-lg px-3 py-2 ${
                  message.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted"
                }`}
              >
                {message.parts.map((part, index) => {
                  if (part.type === "text") {
                    return (
                      <p key={index} className="text-sm whitespace-pre-wrap">
                        {part.text}
                      </p>
                    )
                  }
                  return null
                })}
              </div>

              {message.role === "user" && (
                <Avatar className="h-8 w-8">
                  <AvatarFallback>
                    <User className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
              )}
            </div>
          ))}

          {status === "in_progress" && (
            <div className="flex gap-3 justify-start">
              <Avatar className="h-8 w-8">
                <AvatarFallback>
                  <Bot className="h-4 w-4" />
                </AvatarFallback>
              </Avatar>
              <div className="bg-muted rounded-lg px-3 py-2">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div
                    className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                    style={{ animationDelay: "0.1s" }}
                  ></div>
                  <div
                    className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                    style={{ animationDelay: "0.2s" }}
                  ></div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Input */}
        <div className="border-t p-4">
          <form onSubmit={handleSubmit} className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your message..."
              disabled={status === "in_progress"}
              className="flex-1"
            />
            <Button type="submit" size="sm" disabled={!input.trim() || status === "in_progress"}>
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </CardContent>
    </Card>
  )
}
