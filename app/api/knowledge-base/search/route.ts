import { createAdminClient } from "@/lib/supabase/admin"
import { NextRequest, NextResponse } from "next/server"

// ─── GET /api/knowledge-base/search ─────────────────────────────────────────
//
// Called by n8n's AI Agent as a tool to retrieve knowledge base content
// for the current chatbot tenant.
//
// Query params:
//   page_id  (required)  — The messenger_page_id of the chatbot
//   query    (optional)  — The user's question (for future semantic search)
//
// Security: Protected by QUEUE_API_KEY (same key n8n uses for the queue)
//
// Returns: { content: string, files: string[], chatbot: string }
//   - content: Combined text from all KB files for this chatbot
//   - files:   List of file names included
//   - chatbot: Name of the chatbot
//
// This replaces the Gemini file_search approach. Knowledge base files
// uploaded via the dashboard are stored in Supabase with extracted text.
// This endpoint serves that text directly to the AI Agent as context.
// ─────────────────────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  // ── Auth: same API key as queue endpoints ──
  const apiKey = req.headers.get("x-api-key")
  const authHeader = req.headers.get("authorization")
  const expectedKey = process.env.QUEUE_API_KEY

  if (expectedKey) {
    const isValid =
      apiKey === expectedKey || authHeader === `Bearer ${expectedKey}`
    if (!isValid) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
  }

  // ── Parse params ──
  const { searchParams } = new URL(req.url)
  const pageId = searchParams.get("page_id")

  if (!pageId) {
    return NextResponse.json(
      { error: "page_id is required" },
      { status: 400 }
    )
  }

  const supabase = createAdminClient()

  // ── Look up the chatbot by page_id ──
  const { data: chatbot, error: chatbotError } = await supabase
    .from("chatbots")
    .select("id, name, rag_mode")
    .eq("messenger_page_id", pageId)
    .eq("is_active", true)
    .single()

  if (chatbotError || !chatbot) {
    return NextResponse.json(
      { content: "", files: [], chatbot: null, rag_mode: "inject", error: "No active chatbot found for this page" },
      { status: 200 } // Return 200 so the AI tool doesn't error — just no KB data
    )
  }

  // ── Fetch all knowledge base files for this chatbot ──
  const { data: files, error: filesError } = await supabase
    .from("knowledge_base_files")
    .select("file_name, file_content, processed_content, status")
    .eq("chatbot_id", chatbot.id)
    .order("created_at", { ascending: true })

  if (filesError) {
    console.error("[kb-search] Error fetching KB files:", filesError)
    return NextResponse.json(
      { content: "", files: [], chatbot: chatbot.name, error: filesError.message },
      { status: 200 }
    )
  }

  if (!files || files.length === 0) {
    return NextResponse.json({
      content: "No knowledge base files found for this chatbot.",
      files: [],
      chatbot: chatbot.name,
    })
  }

  // ── Combine all file contents ──
  // Each file's content is wrapped with its filename as a header
  // so the AI can reference which document the info came from.
  const sections: string[] = []
  const fileNames: string[] = []

  for (const file of files) {
    const text = file.processed_content || file.file_content
    if (!text || text.trim().length === 0) continue

    fileNames.push(file.file_name)
    sections.push(
      `─── ${file.file_name} ───\n${text.trim()}`
    )
  }

  const combinedContent = sections.join("\n\n")

  console.log(
    `[kb-search] Returning ${fileNames.length} files for chatbot "${chatbot.name}" (page ${pageId}), ${combinedContent.length} chars`
  )

  return NextResponse.json({
    content: combinedContent,
    files: fileNames,
    chatbot: chatbot.name,
    rag_mode: chatbot.rag_mode ?? "inject",
  })
}
