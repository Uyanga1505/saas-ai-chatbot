import { createAdminClient } from "@/lib/supabase/admin"
import { NextRequest, NextResponse } from "next/server"

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const mode = searchParams.get("hub.mode")
  const token = searchParams.get("hub.verify_token")
  const challenge = searchParams.get("hub.challenge")

  if (mode === "subscribe" && token === process.env.MESSENGER_VERIFY_TOKEN) {
    return new NextResponse(challenge, { status: 200 })
  }

  return NextResponse.json({ error: "Forbidden" }, { status: 403 })
}

export async function POST(req: NextRequest) {
  const body = await req.json()

  // Process the webhook synchronously — Vercel may kill the function
  // after the response is sent, so we can't use fire-and-forget.
  // Facebook allows up to 20s before timing out.
  try {
    await processWebhook(body)
  } catch (err) {
    console.error("[webhook] processWebhook error:", err)
  }

  return NextResponse.json({ status: "ok" }, { status: 200 })
}

async function processWebhook(body: Record<string, unknown>) {
  const entry = (body.entry as Record<string, unknown>[])?.[0]
  if (!entry) return

  const messaging = (entry.messaging as Record<string, unknown>[])?.[0]
  if (!messaging) return

  const pageId = (messaging.recipient as Record<string, string>)?.id
  const senderId = (messaging.sender as Record<string, string>)?.id
  const messageText = (messaging.message as Record<string, string>)?.text

  // Skip echo messages (bot talking to itself)
  if (!pageId || !senderId || !messageText || senderId === pageId) return

  // Use admin client — webhook has no user session, so cookie-based auth won't work
  const supabase = createAdminClient()

  // Find the active chatbot for this Facebook page
  const { data: chatbot, error: chatbotError } = await supabase
    .from("chatbots")
    .select("id, system_prompt, ai_model, messenger_access_token, enable_human_handoff")
    .eq("messenger_page_id", pageId)
    .eq("is_active", true)
    .single()

  if (chatbotError || !chatbot) {
    console.error(`[webhook] No active chatbot found for page_id: ${pageId}`, chatbotError)
    return
  }

  // Store the incoming human message
  // NOTE: Do NOT include sender_id — it's a generated column (auto-extracted from session_id)
  const { error: insertError } = await supabase.from("n8n_chat_histories").insert({
    session_id: `fb_${senderId}`,
    page_id: pageId,
    message: { type: "human", content: messageText },
  })

  if (insertError) {
    console.error(`[webhook] Failed to insert message:`, insertError)
  }

  // Forward the full Facebook payload to n8n for AI processing and reply
  const n8nWebhookUrl = process.env.N8N_WEBHOOK_URL
  if (n8nWebhookUrl) {
    try {
      const n8nResponse = await fetch(n8nWebhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          entry: [{ messaging: [{ sender: { id: senderId }, recipient: { id: pageId }, message: { text: messageText } }] }],
          object: "page",
        }),
      })
      if (!n8nResponse.ok) {
        console.error(`[webhook] n8n responded with ${n8nResponse.status}`)
      }
    } catch (err) {
      console.error("[webhook] Failed to forward to n8n:", err)
    }
  }
}
