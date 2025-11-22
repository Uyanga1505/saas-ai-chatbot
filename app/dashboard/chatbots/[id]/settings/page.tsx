"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { ArrowLeft, Save } from "lucide-react"
import Link from "next/link"
import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { useParams, useRouter } from "next/navigation"

interface Chatbot {
  id: string
  name: string
  description: string
  ai_model: string
  system_prompt: string
  is_active: boolean
  messenger_page_id?: string
  messenger_access_token?: string
}

export default function ChatbotSettingsPage() {
  const params = useParams()
  const router = useRouter()
  const [chatbot, setChatbot] = useState<Chatbot | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  useEffect(() => {
    fetchChatbot()
  }, [])

  const fetchChatbot = async () => {
    const supabase = createClient()
    const { data, error } = await supabase.from("chatbots").select("*").eq("id", params.id).single()

    if (error) {
      console.error("Error fetching chatbot:", error)
      setError("Failed to load chatbot settings")
    } else {
      setChatbot(data)
    }
    setIsLoading(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!chatbot) return

    setIsSaving(true)
    setError(null)
    setSuccess(null)

    const supabase = createClient()
    const { error: updateError } = await supabase
      .from("chatbots")
      .update({
        name: chatbot.name,
        description: chatbot.description,
        ai_model: chatbot.ai_model,
        system_prompt: chatbot.system_prompt,
        is_active: chatbot.is_active,
        messenger_page_id: chatbot.messenger_page_id,
        messenger_access_token: chatbot.messenger_access_token,
      })
      .eq("id", chatbot.id)

    if (updateError) {
      setError(updateError.message)
    } else {
      setSuccess("Settings saved successfully!")
    }

    setIsSaving(false)
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
        <h1 className="text-3xl font-bold">Chatbot Settings</h1>
        <p className="text-muted-foreground">Configure your chatbot's behavior and integrations</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Basic Configuration</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name">Chatbot Name</Label>
                <Input
                  id="name"
                  value={chatbot.name}
                  onChange={(e) => setChatbot({ ...chatbot, name: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={chatbot.description || ""}
                  onChange={(e) => setChatbot({ ...chatbot, description: e.target.value })}
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="aiModel">AI Model</Label>
                <Select value={chatbot.ai_model} onValueChange={(value) => setChatbot({ ...chatbot, ai_model: value })}>
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
                  value={chatbot.system_prompt}
                  onChange={(e) => setChatbot({ ...chatbot, system_prompt: e.target.value })}
                  rows={4}
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="isActive"
                  checked={chatbot.is_active}
                  onCheckedChange={(checked) => setChatbot({ ...chatbot, is_active: checked })}
                />
                <Label htmlFor="isActive">Active</Label>
              </div>

              {error && <div className="text-sm text-red-500 bg-red-50 p-3 rounded-md">{error}</div>}

              {success && <div className="text-sm text-green-500 bg-green-50 p-3 rounded-md">{success}</div>}

              <Button type="submit" disabled={isSaving} className="gap-2">
                <Save className="h-4 w-4" />
                {isSaving ? "Saving..." : "Save Settings"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Messenger Integration</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="pageId">Facebook Page ID</Label>
              <Input
                id="pageId"
                placeholder="Enter your Facebook Page ID"
                value={chatbot.messenger_page_id || ""}
                onChange={(e) => setChatbot({ ...chatbot, messenger_page_id: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="accessToken">Page Access Token</Label>
              <Input
                id="accessToken"
                type="password"
                placeholder="Enter your Page Access Token"
                value={chatbot.messenger_access_token || ""}
                onChange={(e) => setChatbot({ ...chatbot, messenger_access_token: e.target.value })}
              />
            </div>

            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">Setup Instructions</h4>
              <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                <li>Create a Facebook App in the Meta Developer Console</li>
                <li>Add the Messenger product to your app</li>
                <li>Generate a Page Access Token for your Facebook Page</li>
                <li>Enter your Page ID and Access Token above</li>
                <li>Configure webhooks to receive messages</li>
              </ol>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
