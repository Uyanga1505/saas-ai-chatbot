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
// Called by n8n on a schedule (every 5-10 seconds) and after webhook pushes.
// Returns pending messages with their chatbot config, ready for AI processing.
//
// DEBOUNCE + BATCHING:
// People often type one thought across several rapid messages. To reply
// once — with full context — instead of once per message:
//
//   1. A session is only served when its NEWEST pending message is older
//      than the debounce window (default 8s). If the user is still
//      typing, the whole session is held until they stop.
//   2. All pending messages of a served session are COMBINED into one
//      message (texts joined in order). The newest row becomes the
//      "primary" (its id is returned as queue_id); earlier rows are
//      marked 'batched' — consumed, needing no separate reply.
//
// n8n needs no changes: it still receives one item with one queue_id,
// and marks that id done/failed exactly as before.
//
// Query params:
//   ?limit=5        Max session batches to return (default 5, max 20)
//   ?status=failed  Also fetch failed messages for retry (default: pending)
//   ?debounce=8     Seconds to wait after the user's last message (0-60)
// ─────────────────────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const limit = Math.min(Number(searchParams.get("limit") || "5"), 20)
  const debounceSec = Math.min(Math.max(Number(searchParams.get("debounce") ?? "8"), 0), 60)
  const includeStatus = searchParams.get("status") || "pending"
  const statuses =
    includeStatus === "all"
      ? ["pending", "failed"]
      : [includeStatus]

  const supabase = createAdminClient()

  // Fetch a generous window of pending messages so we can group by session
  const { data: messages, error: fetchError } = await supabase
    .from("n8n_chat_histories")
    .select("id, session_id, page_id, message, raw_payload, facebook_mid, created_at, processing_status")
    .in("processing_status", statuses)
    .order("created_at", { ascending: true })
    .limit(100)

  if (fetchError) {
    console.error("[queue] Fetch error:", fetchError)
    return NextResponse.json({ error: fetchError.message }, { status: 500 })
  }

  if (!messages || messages.length === 0) {
    return NextResponse.json({ messages: [], count: 0 })
  }

  // ── Group messages by session ──
  const sessions = new Map<string, typeof messages>()
  for (const msg of messages) {
    const key = msg.session_id || `row_${msg.id}`
    if (!sessions.has(key)) sessions.set(key, [])
    sessions.get(key)!.push(msg)
  }

  // ── Debounce: only serve sessions where the user has stopped typing ──
  const now = Date.now()
  const ready: (typeof messages)[] = []
  for (const group of sessions.values()) {
    const newest = group[group.length - 1]
    const ageMs = now - new Date(newest.created_at).getTime()
    if (ageMs >= debounceSec * 1000) {
      ready.push(group)
    }
    if (ready.length >= limit) break
  }

  if (ready.length === 0) {
    // Users are still typing — next poll will pick these up
    return NextResponse.json({ messages: [], count: 0 })
  }

  // ── Claim: newest row per session → 'processing'; earlier → 'batched' ──
  const primaryIds = ready.map((group) => group[group.length - 1].id)
  const batchedIds = ready.flatMap((group) => group.slice(0, -1).map((m) => m.id))

  const { error: claimError } = await supabase
    .from("n8n_chat_histories")
    .update({ processing_status: "processing" })
    .in("id", primaryIds)

  if (claimError) {
    console.error("[queue] Claim error:", claimError)
    // Still return the messages — n8n can try to process them
  }

  if (batchedIds.length > 0) {
    const { error: batchError } = await supabase
      .from("n8n_chat_histories")
      .update({ processing_status: "batched", processed: true })
      .in("id", batchedIds)
    if (batchError) {
      console.error("[queue] Batch-claim error:", batchError)
    }
  }

  // Fetch chatbot configs for all unique page_ids in this batch
  const uniquePageIds = Array.from(
    new Set(ready.map((group) => group[0].page_id).filter(Boolean))
  )
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

  // ── One enriched item per session, with all texts combined in order ──
  const enriched = ready.map((group) => {
    const primary = group[group.length - 1]
    const combinedText = group
      .map((m) => (m.message as { content?: string })?.content || "")
      .filter(Boolean)
      .join("\n")

    return {
      queue_id: primary.id,
      session_id: primary.session_id,
      page_id: primary.page_id,
      message: { type: "human", content: combinedText },
      facebook_mid: primary.facebook_mid,
      raw_payload: primary.raw_payload,
      created_at: primary.created_at,
      batched_count: group.length,
      chatbot: primary.page_id ? chatbotMap[primary.page_id] || null : null,
    }
  })

  console.log(
    `[queue] Serving ${enriched.length} session batches (${primaryIds.length + batchedIds.length} messages) to n8n`
  )
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
