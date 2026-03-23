"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { ArrowLeft, Save, Copy, CheckCircle } from "lucide-react"
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
  const [copiedWebhook, setCopiedWebhook] = useState(false)

  const webhookUrl = typeof window !== "undefined"
    ? `${window.location.origin}/api/messenger/webhook`
    : "/api/messenger/webhook"

  const copyWebhookUrl = async () => {
    await navigator.clipboard.writeText(webhookUrl)
    setCopiedWebhook(true)
    setTimeout(() => setCopiedWebhook(false), 2000)
  }

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

            <div className="space-y-2">
              <Label>Webhook URL</Label>
              <p className="text-xs text-muted-foreground">Copy this URL into the Facebook Developer Console → Messenger → Webhooks</p>
              <div className="flex items-center gap-2">
                <code className="flex-1 text-xs bg-muted p-2 rounded font-mono break-all">{webhookUrl}</code>
                <Button type="button" variant="outline" size="sm" onClick={copyWebhookUrl}>
                  {copiedWebhook ? <CheckCircle className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">Facebook Developer Console – What to enter</h4>
              <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                <li>Go to <strong>developers.facebook.com</strong> → Your App → Messenger → Settings</li>
                <li>Under <strong>Webhooks</strong>, click <em>Add Callback URL</em></li>
                <li>Paste the <strong>Webhook URL</strong> above as the Callback URL</li>
                <li>Set <strong>Verify Token</strong> to your <code className="bg-blue-100 px-1 rounded">MESSENGER_VERIFY_TOKEN</code> env variable value</li>
                <li>Subscribe to the <strong>messages</strong> event</li>
                <li>Under <strong>Access Tokens</strong>, connect your Facebook Page and copy the Page Access Token here</li>
                <li>Copy the Page ID from your Facebook Page → About section and paste it above</li>
              </ol>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
