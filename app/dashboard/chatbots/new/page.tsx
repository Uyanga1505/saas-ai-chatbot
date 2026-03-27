"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { createChatbot } from "@/app/actions/chatbot-actions"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function NewChatbotPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [form, setForm] = useState({
    name: "",
    description: "",
    messenger_page_id: "",
    messenger_access_token: "",
    ai_model: "gemini",
    model_tier: "basic",
    system_prompt:
      "You are a helpful AI assistant for our business. Answer questions about our products and services professionally.",
    rag_store_id: "",
    handoff_email: "",
    notify_emails: "",
    enable_human_handoff: true,
    is_active: true,
  })

  const set = (key: string, val: string | boolean) =>
    setForm((f) => ({ ...f, [key]: val }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    try {
      const result = await createChatbot({
        ...form,
        notify_emails: form.notify_emails
          ? form.notify_emails.split(",").map((e) => e.trim()).filter(Boolean)
          : [],
      })
      router.push(`/dashboard/chatbots/${result.id}/settings`)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong")
      setIsLoading(false)
    }
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
        <p className="text-muted-foreground">Set up your AI chatbot for Facebook Messenger</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">

        {/* Basic info */}
        <Card>
          <CardHeader>
            <CardTitle>Basic info</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Chatbot name *</Label>
              <Input
                id="name"
                placeholder="e.g. My Business Bot"
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Describe what this chatbot does..."
                value={form.description}
                onChange={(e) => set("description", e.target.value)}
                rows={2}
              />
            </div>
          </CardContent>
        </Card>

        {/* Facebook connection */}
        <Card>
          <CardHeader>
            <CardTitle>Facebook page connection</CardTitle>
            <CardDescription>Connect your Facebook business page to receive and send messages via n8n.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="messenger_page_id">Facebook Page ID *</Label>
              <Input
                id="messenger_page_id"
                placeholder="e.g. 113756287895355"
                value={form.messenger_page_id}
                onChange={(e) => set("messenger_page_id", e.target.value)}
                required
              />
              <p className="text-xs text-muted-foreground">Found in your Facebook Page → About → Page ID</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="messenger_access_token">Page Access Token *</Label>
              <Textarea
                id="messenger_access_token"
                placeholder="Paste your long-lived page access token"
                value={form.messenger_access_token}
                onChange={(e) => set("messenger_access_token", e.target.value)}
                rows={3}
                required
              />
              <p className="text-xs text-muted-foreground">
                Meta Developer Console → Your App → Messenger → Access Tokens
              </p>
            </div>
          </CardContent>
        </Card>

        {/* AI model */}
        <Card>
          <CardHeader>
            <CardTitle>AI model</CardTitle>
            <CardDescription>Choose the AI model and pricing tier for this chatbot.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Model *</Label>
                <Select value={form.ai_model} onValueChange={(v) => set("ai_model", v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="gemini">Google Gemini</SelectItem>
                    <SelectItem value="gpt-4o">OpenAI GPT-4o</SelectItem>
                    <SelectItem value="gpt-4o-mini">OpenAI GPT-4o Mini</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Tier *</Label>
                <Select value={form.model_tier} onValueChange={(v) => set("model_tier", v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="basic">Basic</SelectItem>
                    <SelectItem value="premium">Premium</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Prompt & RAG */}
        <Card>
          <CardHeader>
            <CardTitle>System prompt & knowledge base</CardTitle>
            <CardDescription>
              Tell the AI who it is and how to behave. n8n will inject this prompt dynamically for each conversation.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="system_prompt">System prompt *</Label>
              <Textarea
                id="system_prompt"
                value={form.system_prompt}
                onChange={(e) => set("system_prompt", e.target.value)}
                rows={8}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="rag_store_id">RAG Store ID</Label>
              <Input
                id="rag_store_id"
                placeholder="e.g. fileSearchStores/frag-xxxxx"
                value={form.rag_store_id}
                onChange={(e) => set("rag_store_id", e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Your Gemini File Search Store ID for this business's knowledge base
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Notifications & handoff */}
        <Card>
          <CardHeader>
            <CardTitle>Notifications & human handoff</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="handoff_email">Primary handoff email</Label>
              <Input
                id="handoff_email"
                type="email"
                placeholder="you@example.com"
                value={form.handoff_email}
                onChange={(e) => set("handoff_email", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notify_emails">Notification emails</Label>
              <Input
                id="notify_emails"
                placeholder="email1@example.com, email2@example.com"
                value={form.notify_emails}
                onChange={(e) => set("notify_emails", e.target.value)}
              />
              <p className="text-xs text-muted-foreground">Comma-separated. These receive order/lead email alerts from n8n.</p>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label>Enable human handoff</Label>
                <p className="text-xs text-muted-foreground">Allow users to request a human agent</p>
              </div>
              <Switch
                checked={form.enable_human_handoff}
                onCheckedChange={(v) => set("enable_human_handoff", v)}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label>Activate immediately</Label>
                <p className="text-xs text-muted-foreground">Start responding to messages right away</p>
              </div>
              <Switch
                checked={form.is_active}
                onCheckedChange={(v) => set("is_active", v)}
              />
            </div>
          </CardContent>
        </Card>

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
    </div>
  )
}
