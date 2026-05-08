"use client"

import type React from "react"
import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { createChatbot } from "@/app/actions/chatbot-actions"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { ArrowLeft, Upload, FileText, X } from "lucide-react"
import Link from "next/link"
import { FacebookPageSelector } from "@/components/facebook-page-selector"

export default function NewChatbotPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const promptFileRef = useRef<HTMLInputElement>(null)
  const kbFileRef = useRef<HTMLInputElement>(null)
  const [kbFiles, setKbFiles] = useState<File[]>([])

  const [form, setForm] = useState({
    name: "",
    description: "",
    messenger_page_id: "",
    messenger_access_token: "",
    ai_model: "gemini",
    model_tier: "basic",
    system_prompt:
      "You are a helpful AI assistant for our business. Answer questions about our products and services professionally.",
    handoff_email: "",
    notify_emails: "",
    enable_human_handoff: true,
    is_active: true,
  })

  const set = (key: string, val: string | boolean) =>
    setForm((f) => ({ ...f, [key]: val }))

  const handlePromptFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      const text = ev.target?.result as string
      if (text) set("system_prompt", text)
    }
    reader.readAsText(file)
    if (promptFileRef.current) promptFileRef.current.value = ""
  }

  const handleKbFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files
    if (!fileList || fileList.length === 0) return

    const file = fileList[0]
    const allowedTypes = [
      "application/pdf",
      "text/plain",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ]

    if (!allowedTypes.includes(file.type)) {
      setError("Unsupported file type. Please upload PDF, TXT, DOCX, or XLSX files.")
      return
    }

    if (file.size > 10 * 1024 * 1024) {
      setError("File too large. Maximum size is 10 MB.")
      return
    }

    setKbFiles((prev) => [...prev, file])
    setError(null)
    if (kbFileRef.current) kbFileRef.current.value = ""
  }

  const removeKbFile = (index: number) => {
    setKbFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

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
      if (!result?.id) {
        throw new Error("Failed to create chatbot — no ID returned")
      }

      // Upload queued KB files
      for (const file of kbFiles) {
        try {
          const formData = new FormData()
          formData.append("file", file)
          formData.append("chatbot_id", result.id)
          await fetch("/api/knowledge-base", { method: "POST", body: formData })
        } catch {
          console.error(`Failed to upload ${file.name}`)
        }
      }

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
            <CardDescription>
              Log in with Facebook to see your Pages, then pick the one this chatbot should respond on.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <FacebookPageSelector
              selectedPageId={form.messenger_page_id}
              onPageSelected={({ page_id, access_token }) => {
                setForm((f) => ({
                  ...f,
                  messenger_page_id: page_id,
                  messenger_access_token: access_token,
                }))
              }}
            />
            {form.messenger_page_id && (
              <p className="mt-3 text-xs text-green-600">
                Page connected — ID: {form.messenger_page_id}
              </p>
            )}
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

        {/* Prompt & KB */}
        <Card>
          <CardHeader>
            <CardTitle>System prompt & knowledge base</CardTitle>
            <CardDescription>
              Tell the AI who it is and how to behave. You can type the prompt or upload a .txt file.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="system_prompt">System prompt *</Label>
                <div>
                  <input
                    ref={promptFileRef}
                    type="file"
                    accept=".pdf,.txt,.docx,.xlsx,.md,.text,.csv"
                    onChange={handlePromptFileUpload}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="gap-1.5 text-xs"
                    onClick={() => promptFileRef.current?.click()}
                  >
                    <Upload className="h-3.5 w-3.5" />
                    Load from file
                  </Button>
                </div>
              </div>
              <Textarea
                id="system_prompt"
                value={form.system_prompt}
                onChange={(e) => set("system_prompt", e.target.value)}
                rows={8}
                required
              />
              <p className="text-xs text-muted-foreground">
                Type your prompt directly or upload a .txt file.
              </p>
            </div>

            {/* KB file upload */}
            <div className="space-y-2">
              <Label>Knowledge base files</Label>
              <p className="text-xs text-muted-foreground">
                Upload documents for the chatbot to reference when answering questions.
              </p>
              <input
                ref={kbFileRef}
                type="file"
                accept=".pdf,.txt,.docx,.xlsx"
                onChange={handleKbFileSelect}
                className="hidden"
              />
              <div
                onClick={() => kbFileRef.current?.click()}
                className="flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-muted-foreground/25 p-6 cursor-pointer transition-colors hover:border-primary/50 hover:bg-muted/50"
              >
                <Upload className="h-8 w-8 text-muted-foreground" />
                <p className="text-sm font-medium">
                  Click to add files or <span className="text-primary underline">browse</span>
                </p>
                <p className="text-xs text-muted-foreground">
                  Supports PDF, TXT, DOCX, XLSX (max 10 MB)
                </p>
              </div>

              {kbFiles.length > 0 && (
                <div className="space-y-1.5">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Queued files ({kbFiles.length})
                  </p>
                  <div className="divide-y divide-border rounded-lg border">
                    {kbFiles.map((file, i) => (
                      <div key={`${file.name}-${i}`} className="flex items-center gap-3 px-3 py-2">
                        <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{file.name}</p>
                          <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0 text-muted-foreground hover:text-red-500"
                          onClick={() => removeKbFile(i)}
                        >
                          <X className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    These files will be uploaded automatically after the chatbot is created.
                  </p>
                </div>
              )}
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
            {isLoading
              ? kbFiles.length > 0
                ? "Creating & uploading files..."
                : "Creating..."
              : "Create Chatbot"}
          </Button>
          <Button type="button" variant="outline" asChild>
            <Link href="/dashboard/chatbots">Cancel</Link>
          </Button>
        </div>
      </form>
    </div>
  )
}
