"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

export default function NewChatbotPage() {
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [aiModel, setAiModel] = useState("gpt-3.5-turbo")
  const [systemPrompt, setSystemPrompt] = useState(
    "You are a helpful AI assistant for customer support. Be friendly, professional, and helpful in all your responses.",
  )
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    const supabase = createClient()

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      setError("You must be logged in to create a chatbot")
      setIsLoading(false)
      return
    }

    const { error: insertError } = await supabase.from("chatbots").insert({
      name,
      description,
      ai_model: aiModel,
      system_prompt: systemPrompt,
      user_id: user.id,
      is_active: false,
    })

    if (insertError) {
      setError(insertError.message)
    } else {
      router.push("/dashboard/chatbots")
    }

    setIsLoading(false)
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
        <h1 className="text-3xl font-bold">Create New Chatbot</h1>
        <p className="text-muted-foreground">Set up your AI chatbot for Messenger integration</p>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Chatbot Configuration</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">Chatbot Name</Label>
              <Input
                id="name"
                placeholder="e.g., Customer Support Bot"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Describe what this chatbot does..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="aiModel">AI Model</Label>
              <Select value={aiModel} onValueChange={setAiModel}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="gpt-3.5-turbo">GPT-3.5 Turbo</SelectItem>
                  <SelectItem value="gpt-4">GPT-4</SelectItem>
                  <SelectItem value="gpt-4-turbo">GPT-4 Turbo</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="systemPrompt">System Prompt</Label>
              <Textarea
                id="systemPrompt"
                placeholder="Define how your chatbot should behave..."
                value={systemPrompt}
                onChange={(e) => setSystemPrompt(e.target.value)}
                rows={4}
              />
              <p className="text-xs text-muted-foreground">
                This prompt defines your chatbot's personality and behavior. Be specific about tone, style, and
                capabilities.
              </p>
            </div>

            {error && <div className="text-sm text-red-500 bg-red-50 p-3 rounded-md">{error}</div>}

            <div className="flex gap-4">
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Creating..." : "Create Chatbot"}
              </Button>
              <Button type="button" variant="outline" asChild>
                <Link href="/dashboard/chatbots">Cancel</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
