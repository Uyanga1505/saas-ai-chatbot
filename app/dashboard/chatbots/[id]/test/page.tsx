"use client"

import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { useParams } from "next/navigation"
import { ChatInterface } from "@/components/chat/chat-interface"

interface Chatbot {
  id: string
  name: string
  description: string
  is_active: boolean
}

export default function TestChatbotPage() {
  const params = useParams()
  const [chatbot, setChatbot] = useState<Chatbot | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchChatbot()
  }, [])

  const fetchChatbot = async () => {
    const supabase = createClient()
    const { data, error } = await supabase.from("chatbots").select("*").eq("id", params.id).single()

    if (error) {
      console.error("Error fetching chatbot:", error)
    } else {
      setChatbot(data)
    }
    setIsLoading(false)
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/dashboard/chatbots" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Chatbots
            </Link>
          </Button>
        </div>
        <div className="text-center py-12">Loading...</div>
      </div>
    )
  }

  if (!chatbot) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/dashboard/chatbots" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Chatbots
            </Link>
          </Button>
        </div>
        <div className="text-center py-12">Chatbot not found</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/dashboard/chatbots" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Chatbots
          </Link>
        </Button>
      </div>

      <div>
        <h1 className="text-3xl font-bold">Test Chatbot</h1>
        <p className="text-muted-foreground">Test your chatbot's responses before deploying to Messenger</p>
      </div>

      <div className="max-w-2xl mx-auto">
        <ChatInterface chatbotId={chatbot.id} chatbotName={chatbot.name} />
      </div>
    </div>
  )
}
