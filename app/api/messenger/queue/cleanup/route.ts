import { createAdminClient } from "@/lib/supabase/admin"
import { NextRequest, NextResponse } from "next/server"

// ─── POST /api/messenger/queue/cleanup ───────────────────────────────────────
//
// Resets stale 'processing' messages back to 'pending'.
// A message is considered stale if it's been 'processing' for more than
// 2 minutes (n8n should finish well within that window).
//
// Call this on a schedule (e.g., every 1-2 minutes from n8n or Vercel Cron)
// to recover from n8n crashes or timeouts.
// ─────────────────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const apiKey = req.headers.get("x-api-key")
  const expectedKey = process.env.QUEUE_API_KEY

  if (expectedKey && apiKey !== expectedKey) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const supabase = createAdminClient()
  const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000).toISOString()

  const { data, error } = await supabase
    .from("n8n_chat_histories")
    .update({ processing_status: "pending" })
    .eq("processing_status", "processing")
    .lt("created_at", twoMinutesAgo)
    .select("id")

  if (error) {
    console.error("[cleanup] Error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const resetCount = data?.length || 0
  if (resetCount > 0) {
    console.log(`[cleanup] Reset ${resetCount} stale messages to pending`)
  }

  return NextResponse.json({ reset: resetCount })
}
