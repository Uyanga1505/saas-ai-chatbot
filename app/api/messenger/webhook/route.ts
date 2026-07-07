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

  // Log the incoming message to n8n_chat_histories so n8n can pick it up
  // NOTE: Do NOT include sender_id — it's a generated column (auto-extracted from session_id)
  const { error: insertError } = await supabase.from("n8n_chat_histories").insert({
    session_id: `fb_${senderId}`,
    page_id: pageId,
    message: { type: "human", content: messageText },
  })

  if (insertError) {
    console.error(`[webhook] Failed to insert message:`, insertError)
  }
}