import { createAdminClient } from "@/lib/supabase/admin"
import { NextRequest, NextResponse } from "next/server"

// ─── Security: Verify the request is from n8n ────────────────────────────────

function isAuthorized(req: NextRequest): boolean {
  // Accept either Bearer token or x-api-key header
  const authHeader = req.headers.get("authorization")
  const apiKey = req.headers.get("x-api-key")
  const expectedKey = process.env.QUEUE_API_KEY

  // If no QUEUE_API_KEY is set, fall back to checking N8N_WEBHOOK_URL origin
  if (!expectedKey) {
    console.warn("[queue] QUEUE_API_KEY not set — endpoint is unprotected")
    return true
  }

  if (apiKey === expectedKey) return true
  if (authHeader === `Bearer ${expectedKey}`) return true

  return false
}

// ─── GET /api/messenger/queue ────────────────────────────────────────────────
//
// Called by n8n on a schedule (every 5-10 seconds).
// Returns pending messages with their chatbot config, ready for AI processing.
//
// Query params:
//   ?limit=5       Max messages to return (default 5, max 20)
//   ?status=failed  Also fetch failed messages for retry (default: pending only)
//
// Each returned message is atomically set to 'processing' so no other
// worker picks it up. If n8n crashes mid-processing, a separate cleanup
// job can reset stale 'processing' messages back to 'pending'.
// ─────────────────────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const limit = Math.min(Number(searchParams.get("limit") || "5"), 20)
  const includeStatus = searchParams.get("status") || "pending"
  const statuses =
    includeStatus === "all"
      ? ["pending", "failed"]
      : [includeStatus]

  const supabase = createAdminClient()

  // Fetch pending messages
  const { data: messages, error: fetchError } = await supabase
    .from("n8n_chat_histories")
    .select("id, session_id, page_id, message, raw_payload, facebook_mid, created_at, processing_status")
    .in("processing_status", statuses)
    .order("created_at", { ascending: true })
    .limit(limit)

  if (fetchError) {
    console.error("[queue] Fetch error:", fetchError)
    return NextResponse.json({ error: fetchError.message }, { status: 500 })
  }

  if (!messages || messages.length === 0) {
    return NextResponse.json({ messages: [], count: 0 })
  }

  // Atomically claim these messages by setting status to 'processing'
  const messageIds = messages.map((m) => m.id)
  const { error: claimError } = await supabase
    .from("n8n_chat_histories")
    .update({ processing_status: "processing" })
    .in("id", messageIds)

  if (claimError) {
    console.error("[queue] Claim error:", claimError)
    // Still return the messages — n8n can try to process them
  }

  // Fetch chatbot configs for all unique page_ids in this batch
  const uniquePageIds = Array.from(new Set(messages.map((m) => m.page_id).filter(Boolean)))
  const { data: chatbots } = await supabase
    .from("chatbots")
    .select("id, messenger_page_id, messenger_access_token, system_prompt, ai_model, enable_human_handoff")
    .in("messenger_page_id", uniquePageIds)
    .eq("is_active", true)

  // Build a lookup map: page_id → chatbot config
  const chatbotMap: Record<string, (typeof chatbots extends (infer T)[] | null ? T : never)> = {}
  if (chatbots) {
    for (const bot of chatbots) {
      if (bot.messenger_page_id) {
        chatbotMap[bot.messenger_page_id] = bot
      }
    }
  }

  // Enrich each message with its chatbot config
  const enriched = messages.map((msg) => ({
    queue_id: msg.id,
    session_id: msg.session_id,
    page_id: msg.page_id,
    message: msg.message,
    facebook_mid: msg.facebook_mid,
    raw_payload: msg.raw_payload,
    created_at: msg.created_at,
    chatbot: msg.page_id ? chatbotMap[msg.page_id] || null : null,
  }))

  console.log(`[queue] Serving ${enriched.length} messages to n8n`)
  return NextResponse.json({ messages: enriched, count: enriched.length })
}

// ─── POST /api/messenger/queue ───────────────────────────────────────────────
//
// Called by n8n after processing a message to update its status.
//
// Body: { queue_id: number, status: "done" | "failed", error?: string }
//
// ─────────────────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await req.json()
  const { queue_id, status, error: errorMsg } = body

  if (!queue_id || !["done", "failed"].includes(status)) {
    return NextResponse.json(
      { error: "Required: queue_id (number), status ('done' | 'failed')" },
      { status: 400 }
    )
  }

  const supabase = createAdminClient()

  const updatePayload: Record<string, unknown> = {
    processing_status: status,
  }

  // If done, also mark the legacy 'processed' field
  if (status === "done") {
    updatePayload.processed = true
  }

  const { error: updateError } = await supabase
    .from("n8n_chat_histories")
    .update(updatePayload)
    .eq("id", queue_id)

  if (updateError) {
    console.error("[queue] Update error:", updateError)
    return NextResponse.json({ error: updateError.message }, { status: 500 })
  }

  console.log(`[queue] Message ${queue_id} → ${status}${errorMsg ? ` (${errorMsg})` : ""}`)
  return NextResponse.json({ success: true })
}
