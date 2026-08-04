import { createAdminClient } from "@/lib/supabase/admin"
import { NextRequest, NextResponse } from "next/server"

// Allow time for the debounce wait before pushing to n8n
export const maxDuration = 30

// Seconds to wait after a message before triggering the AI — gives the
// user time to finish typing multi-message thoughts. The queue endpoint
// then combines all their pending messages into one reply.
const DEBOUNCE_SECONDS = Number(process.env.MESSAGE_DEBOUNCE_SECONDS ?? "8")

// ─── Facebook Webhook Verification ───────────────────────────────────────────

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

// ─── Incoming Message Handler ────────────────────────────────────────────────
//
// ASYNC & DECOUPLED ARCHITECTURE WITH TYPING DEBOUNCE:
//
// 1. Parse the Facebook payload
// 2. Dedup by facebook message ID (mid) — skip if already stored
// 3. Store in Supabase with processing_status = 'pending'
// 4. Wait DEBOUNCE_SECONDS — the user may still be typing more messages
// 5. If a NEWER message arrived for this session during the wait, do
//    nothing — that newer webhook invocation owns the batch
// 6. Otherwise push a wake-up to n8n; n8n fetches from the queue
//    endpoint, which combines all the user's pending messages into ONE
// 7. If n8n is down, the polling endpoint picks the batch up anyway
//
// Result: rapid consecutive messages get a single reply with full
// context, messages are never lost, duplicates are ignored, and
// Facebook gets its 200 well within its timeout.
// ─────────────────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const body = await req.json()

  try {
    const stored = await storeMessage(body)

    if (stored) {
      const { messageId, sessionId } = stored

      // ── Debounce: give the user time to finish typing ──
      if (DEBOUNCE_SECONDS > 0) {
        await new Promise((r) => setTimeout(r, DEBOUNCE_SECONDS * 1000))

        // If a newer message arrived in this session while we waited,
        // skip — the invocation handling that newer message will push.
        const supabase = createAdminClient()
        const { data: newer } = await supabase
          .from("n8n_chat_histories")
          .select("id")
          .eq("session_id", sessionId)
          .eq("processing_status", "pending")
          .gt("id", messageId)
          .limit(1)
          .maybeSingle()

        if (newer) {
          console.log(
            `[webhook] Newer message in ${sessionId} — deferring push to its invocation`
          )
          return NextResponse.json({ status: "ok" }, { status: 200 })
        }
      }

      // Push to n8n — must be awaited because Vercel kills the function
      // after the response is sent. If n8n is down, we catch the error —
      // the messages stay 'pending' and the polling endpoint retries.
      try {
        await pushToN8n(body, messageId)
      } catch (err) {
        console.error("[webhook] n8n push failed (pending in queue):", err)
      }
    }
  } catch (err) {
    console.error("[webhook] storeMessage error:", err)
  }

  return NextResponse.json({ status: "ok" }, { status: 200 })
}

// ─── Store Message with Dedup ────────────────────────────────────────────────

async function storeMessage(
  body: Record<string, unknown>
): Promise<{ messageId: number; sessionId: string } | null> {
  const entry = (body.entry as Record<string, unknown>[])?.[0]
  if (!entry) return null

  const messaging = (entry.messaging as Record<string, unknown>[])?.[0]
  if (!messaging) return null

  const pageId = (messaging.recipient as Record<string, string>)?.id
  const senderId = (messaging.sender as Record<string, string>)?.id
  const message = messaging.message as Record<string, string> | undefined
  const messageText = message?.text
  const messageMid = message?.mid // Facebook's unique message ID

  // Skip echo messages (bot talking to itself) or empty messages
  if (!pageId || !senderId || !messageText || senderId === pageId) return null

  // Use admin client — webhook has no user session
  const supabase = createAdminClient()

  // ── Dedup: skip if this Facebook message ID was already stored ──
  if (messageMid) {
    const { data: existing } = await supabase
      .from("n8n_chat_histories")
      .select("id")
      .eq("facebook_mid", messageMid)
      .maybeSingle()

    if (existing) {
      console.log(`[webhook] Duplicate mid=${messageMid}, skipping`)
      return null
    }
  }

  // ── Verify an active chatbot exists for this page ──
  const { data: chatbot, error: chatbotError } = await supabase
    .from("chatbots")
    .select("id")
    .eq("messenger_page_id", pageId)
    .eq("is_active", true)
    .single()

  if (chatbotError || !chatbot) {
    console.error(
      `[webhook] No active chatbot for page ${pageId}`,
      chatbotError
    )
    return null
  }

  // ── Store with status='pending' and the raw payload for async processing ──
  // NOTE: Do NOT include sender_id — it's a generated column
  const { data: inserted, error: insertError } = await supabase
    .from("n8n_chat_histories")
    .insert({
      session_id: `fb_${senderId}`,
      page_id: pageId,
      message: { type: "human", content: messageText },
      facebook_mid: messageMid || null,
      processing_status: "pending",
      raw_payload: body,
    })
    .select("id")
    .single()

  if (insertError) {
    // Handle unique constraint violation (race-condition dedup)
    if (insertError.code === "23505") {
      console.log(
        `[webhook] Duplicate mid=${messageMid} (constraint), skipping`
      )
      return null
    }
    console.error("[webhook] Insert failed:", insertError)
    return null
  }

  console.log(`[webhook] Stored message id=${inserted.id}, status=pending`)
  return { messageId: inserted.id, sessionId: `fb_${senderId}` }
}

// ─── Push to n8n ─────────────────────────────────────────────────────────────

async function pushToN8n(
  body: Record<string, unknown>,
  messageId: number
) {
  const n8nWebhookUrl = process.env.N8N_WEBHOOK_URL
  if (!n8nWebhookUrl) return

  // Add _queue_id to the payload so n8n can mark the message as done
  // after processing. Existing expressions like body.entry[0]... still work.
  const enrichedBody = { ...body, _queue_id: messageId }

  const res = await fetch(n8nWebhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(enrichedBody),
  })

  if (!res.ok) {
    const text = await res.text().catch(() => "")
    console.error(`[webhook] n8n ${res.status}: ${text}`)
  } else {
    console.log(`[webhook] Pushed message id=${messageId} to n8n`)
  }
}
