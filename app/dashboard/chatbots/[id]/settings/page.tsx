"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { getChatbot, updateChatbot, deleteChatbot } from "@/app/actions/chatbot-actions"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { ArrowLeft, Save, Copy, CheckCircle } from "lucide-react"
import Link from "next/link"

interface ChatbotForm {
  id: string
  name: string
  description: string
  messenger_page_id: string
  messenger_access_token: string
  ai_model: string
  model_tier: string
  system_prompt: string
  rag_store_id: string
  handoff_email: string
  notify_emails: string   // stored as comma-separated string in the form
  enable_human_handoff: boolean
  is_active: boolean
}

export default function ChatbotSettingsPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  const [form, setForm] = useState<ChatbotForm | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [copiedWebhook, setCopiedWebhook] = useState(false)

  const webhookUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/api/messenger/webhook`
      : "/api/messenger/webhook"

  const copyWebhookUrl = async () => {
    await navigator.clipboard.writeText(webhookUrl)
    setCopiedWebhook(true)
    setTimeout(() => setCopiedWebhook(false), 2000)
  }

  useEffect(() => {
    getChatbot(id).then((data) => {
      if (!data) { router.push("/dashboard/chatbots"); return }
      setForm({
        ...data,
        description: data.description ?? "",
        messenger_page_id: data.messenger_page_id ?? "",
        messenger_access_token: data.messenger_access_token ?? "",
        ai_model: data.ai_model ?? "gemini",
        model_tier: data.model_tier ?? "basic",
        system_prompt: data.system_prompt ?? "",
        rag_store_id: data.rag_store_id ?? "",
        handoff_email: data.handoff_email ?? "",
        notify_emails: Array.isArray(data.notify_emails) ? data.notify_emails.join(", ") : "",
        enable_human_handoff: data.enable_human_handoff ?? true,
        is_active: data.is_active ?? false,
      })
      setIsLoading(false)
    })
  }, [id, router])

  const set = (key: keyof ChatbotForm, val: string | boolean) =>
    setForm((f) => f ? { ...f, [key]: val } : f)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form) return
    setIsSaving(true)
    setError(null)
    setSuccess(null)
    try {
      await updateChatbot(id, {
        name: form.name,
        description: form.description,
        messenger_page_id: form.messenger_page_id,
        messenger_access_token: form.messenger_access_token,
        ai_model: form.ai_model,
        model_tier: form.model_tier,
        system_prompt: form.system_prompt,
        rag_store_id: form.rag_store_id || undefined,
        handoff_email: form.handoff_email || undefined,
        notify_emails: form.notify_emails
          ? form.notify_emails.split(",").map((e) => e.trim()).filter(Boolean)
          : [],
        enable_human_handoff: form.enable_human_handoff,
        is_active: form.is_active,
      })
      setSuccess("Settings saved successfully!")
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Save failed")
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm("Delete this chatbot? This cannot be undone.")) return
    const result = await deleteChatbot(id)
    if (result.success) router.push("/dashboard/chatbots")
    else setError(result.error ?? "Delete failed")
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

  if (!form) return null

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

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid gap-6 lg:grid-cols-2">

          {/* Left column */}
          <div className="space-y-6">
            <Card>
              <CardHeader><CardTitle>Basic info</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Chatbot name</Label>
                  <Input
                    id="name"
                    value={form.name}
                    onChange={(e) => set("name", e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={form.description}
                    onChange={(e) => set("description", e.target.value)}
                    rows={2}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>AI model</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Model</Label>
                    <Select value={form.ai_model} onValueChange={(v) => set("ai_model", v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="gemini">Google Gemini</SelectItem>
                        <SelectItem value="gpt-4o">OpenAI GPT-4o</SelectItem>
                        <SelectItem value="gpt-4o-mini">OpenAI GPT-4o Mini</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Tier</Label>
                    <Select value={form.model_tier} onValueChange={(v) => set("model_tier", v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="basic">Basic</SelectItem>
                        <SelectItem value="premium">Premium</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>System prompt & knowledge base</CardTitle>
                <CardDescription>n8n pulls this dynamically on every message.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="system_prompt">System prompt</Label>
                  <Textarea
                    id="system_prompt"
                    value={form.system_prompt}
                    onChange={(e) => set("system_prompt", e.target.value)}
                    rows={10}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="rag_store_id">RAG Store ID</Label>
                  <Input
                    id="rag_store_id"
                    placeholder="fileSearchStores/frag-xxxxx"
                    value={form.rag_store_id}
                    onChange={(e) => set("rag_store_id", e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">Gemini File Search Store ID for this business</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Notifications & handoff</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="handoff_email">Primary handoff email</Label>
                  <Input
                    id="handoff_email"
                    type="email"
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
                  <p className="text-xs text-muted-foreground">Comma-separated. n8n sends order/lead alerts to these addresses.</p>
                </div>
                <div className="flex items-center justify-between">
                  <Label>Enable human handoff</Label>
                  <Switch
                    checked={form.enable_human_handoff}
                    onCheckedChange={(v) => set("enable_human_handoff", v)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label>Active</Label>
                  <Switch
                    checked={form.is_active}
                    onCheckedChange={(v) => set("is_active", v)}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right column */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Messenger integration</CardTitle>
                <CardDescription>Your page ID and token — n8n uses these to send replies.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="pageId">Facebook Page ID</Label>
                  <Input
                    id="pageId"
                    value={form.messenger_page_id}
                    onChange={(e) => set("messenger_page_id", e.target.value)}
                    placeholder="e.g. 113756287895355"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="accessToken">Page Access Token</Label>
                  <Textarea
                    id="accessToken"
                    value={form.messenger_access_token}
                    onChange={(e) => set("messenger_access_token", e.target.value)}
                    rows={4}
                    placeholder="Paste your long-lived page access token"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Webhook URL</Label>
                  <p className="text-xs text-muted-foreground">
                    Copy this URL into Facebook Developer Console → Messenger → Webhooks
                  </p>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 text-xs bg-muted p-2 rounded font-mono break-all">{webhookUrl}</code>
                    <Button type="button" variant="outline" size="sm" onClick={copyWebhookUrl}>
                      {copiedWebhook ? <CheckCircle className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-medium text-blue-900 mb-2">Facebook Developer Console — What to enter</h4>
                  <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                    <li>Go to <strong>developers.facebook.com</strong> → Your App → Messenger → Settings</li>
                    <li>Under <strong>Webhooks</strong>, click <em>Add Callback URL</em></li>
                    <li>Paste the <strong>Webhook URL</strong> above as the Callback URL</li>
                    <li>Set <strong>Verify Token</strong> to your <code className="bg-blue-100 px-1 rounded">MESSENGER_VERIFY_TOKEN</code> env value</li>
                    <li>Subscribe to the <strong>messages</strong> event</li>
                  </ol>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {error && <div className="text-sm text-red-500 bg-red-50 p-3 rounded-md">{error}</div>}
        {success && <div className="text-sm text-green-600 bg-green-50 p-3 rounded-md">{success}</div>}

        <Button type="submit" disabled={isSaving} className="gap-2">
          <Save className="h-4 w-4" />
          {isSaving ? "Saving..." : "Save Settings"}
        </Button>
      </form>

      <Separator />

      <Card className="border-destructive">
        <CardHeader>
          <CardTitle className="text-destructive">Danger zone</CardTitle>
          <CardDescription>Permanently delete this chatbot and all its data.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="destructive" type="button" onClick={handleDelete}>
            Delete chatbot
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
