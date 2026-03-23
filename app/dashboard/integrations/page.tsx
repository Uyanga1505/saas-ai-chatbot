"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { MessageSquare, ExternalLink, Copy, CheckCircle, AlertCircle } from "lucide-react"
import { useState } from "react"

export default function IntegrationsPage() {
  const [copied, setCopied] = useState(false)
  const webhookUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/api/messenger/webhook`

  const copyWebhookUrl = async () => {
    await navigator.clipboard.writeText(webhookUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Integrations</h1>
        <p className="text-muted-foreground">Connect your chatbots to external platforms</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
                  <MessageSquare className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <CardTitle>Facebook Messenger</CardTitle>
                  <Badge className="mt-1 bg-green-100 text-green-800">Available</Badge>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Connect your chatbots to Facebook Messenger to engage with customers directly on their preferred platform.
            </p>

            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span>Real-time message processing</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span>AI-powered responses</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span>Conversation history</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span>Multiple chatbot support</span>
              </div>
            </div>

            <div className="border-t pt-4">
              <h4 className="font-medium mb-2">Webhook URL</h4>
              <div className="flex items-center gap-2">
                <code className="flex-1 text-xs bg-muted p-2 rounded font-mono break-all">{webhookUrl}</code>
                <Button variant="outline" size="sm" onClick={copyWebhookUrl}>
                  {copied ? <CheckCircle className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            <Button className="w-full" asChild>
              <a
                href="https://developers.facebook.com/docs/messenger-platform/getting-started"
                target="_blank"
                rel="noopener noreferrer"
                className="gap-2"
              >
                Setup Guide
                <ExternalLink className="h-4 w-4" />
              </a>
            </Button>
          </CardContent>
        </Card>

        <Card className="opacity-60">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100">
                  <MessageSquare className="h-5 w-5 text-gray-600" />
                </div>
                <div>
                  <CardTitle>WhatsApp Business</CardTitle>
                  <Badge className="mt-1 bg-gray-100 text-gray-800">Coming Soon</Badge>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Expand your reach with WhatsApp Business integration. Connect with customers on the world's most popular
              messaging platform.
            </p>

            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <AlertCircle className="h-4 w-4" />
                <span>Business API integration</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <AlertCircle className="h-4 w-4" />
                <span>Rich media support</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <AlertCircle className="h-4 w-4" />
                <span>Template messages</span>
              </div>
            </div>

            <Button className="w-full" disabled>
              Coming Soon
            </Button>
          </CardContent>
        </Card>

        <Card className="opacity-60">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100">
                  <MessageSquare className="h-5 w-5 text-gray-600" />
                </div>
                <div>
                  <CardTitle>Slack</CardTitle>
                  <Badge className="mt-1 bg-gray-100 text-gray-800">Coming Soon</Badge>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Integrate with Slack to provide AI assistance directly in your team's workspace channels.
            </p>

            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <AlertCircle className="h-4 w-4" />
                <span>Slack app integration</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <AlertCircle className="h-4 w-4" />
                <span>Channel and DM support</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <AlertCircle className="h-4 w-4" />
                <span>Slash commands</span>
              </div>
            </div>

            <Button className="w-full" disabled>
              Coming Soon
            </Button>
          </CardContent>
        </Card>

        <Card className="opacity-60">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100">
                  <MessageSquare className="h-5 w-5 text-gray-600" />
                </div>
                <div>
                  <CardTitle>Discord</CardTitle>
                  <Badge className="mt-1 bg-gray-100 text-gray-800">Coming Soon</Badge>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Deploy your chatbots to Discord servers to engage with gaming and community audiences.
            </p>

            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <AlertCircle className="h-4 w-4" />
                <span>Discord bot integration</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <AlertCircle className="h-4 w-4" />
                <span>Server and DM support</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <AlertCircle className="h-4 w-4" />
                <span>Slash commands</span>
              </div>
            </div>

            <Button className="w-full" disabled>
              Coming Soon
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Setup Instructions for Facebook Messenger</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-3">
              <h4 className="font-medium">1. Create Facebook App</h4>
              <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                <li>Go to Facebook Developers Console</li>
                <li>Create a new app for your business</li>
                <li>Add the Messenger product</li>
              </ul>
            </div>

            <div className="space-y-3">
              <h4 className="font-medium">2. Configure Webhooks</h4>
              <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                <li>Set webhook URL to the URL shown above</li>
                <li>Set Verify Token to the value of your <code className="bg-muted px-1 rounded text-xs">MESSENGER_VERIFY_TOKEN</code> env variable</li>
                <li>Subscribe to the <strong>messages</strong> event</li>
              </ul>
            </div>

            <div className="space-y-3">
              <h4 className="font-medium">3. Get Page Access Token</h4>
              <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                <li>Connect your Facebook Page</li>
                <li>Generate Page Access Token</li>
                <li>Copy token to chatbot settings</li>
              </ul>
            </div>

            <div className="space-y-3">
              <h4 className="font-medium">4. Test Integration</h4>
              <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                <li>Activate your chatbot</li>
                <li>Send test message to your page</li>
                <li>Verify AI responses work</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
