import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"

/**
 * POST /api/knowledge-base
 * Upload a file to the knowledge base for a chatbot.
 * Accepts multipart form data with:
 *   - file: the uploaded file (PDF, TXT, DOCX)
 *   - chatbot_id: the chatbot to attach the file to
 *
 * Flow:
 *   1. Upload file to Supabase Storage (knowledge-base bucket)
 *   2. Extract text content from the file
 *   3. Store metadata + extracted content in knowledge_base_files table
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get("file") as File | null
    const chatbotId = formData.get("chatbot_id") as string | null

    if (!file || !chatbotId) {
      return NextResponse.json({ error: "File and chatbot_id are required" }, { status: 400 })
    }

    // Validate file type
    const allowedTypes = [
      "application/pdf",
      "text/plain",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ]
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Unsupported file type. Allowed: PDF, TXT, DOCX, XLSX" },
        { status: 400 }
      )
    }

    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: "File too large. Max 10MB." }, { status: 400 })
    }

    // Verify user owns this chatbot
    const { data: chatbot } = await supabase
      .from("chatbots")
      .select("id")
      .eq("id", chatbotId)
      .eq("user_id", user.id)
      .single()

    if (!chatbot) {
      return NextResponse.json({ error: "Chatbot not found" }, { status: 404 })
    }

    // Upload to Supabase Storage
    const fileExt = file.name.split(".").pop() || "bin"
    const storagePath = `${user.id}/${chatbotId}/${Date.now()}_${file.name}`

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    const { error: uploadError } = await supabase.storage
      .from("knowledge-base")
      .upload(storagePath, buffer, {
        contentType: file.type,
        upsert: false,
      })

    if (uploadError) {
      console.error("[kb-upload] Storage upload error:", uploadError)
      return NextResponse.json({ error: "File upload failed" }, { status: 500 })
    }

    // Extract text content based on file type
    let extractedText = ""
    try {
      if (file.type === "text/plain") {
        extractedText = new TextDecoder().decode(buffer)
      } else if (file.type === "application/pdf") {
        extractedText = await extractPdfText(buffer)
      } else if (file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
        extractedText = await extractDocxText(buffer)
      } else if (file.type === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet") {
        extractedText = await extractXlsxText(buffer)
      }
    } catch (extractErr) {
      console.error("[kb-upload] Text extraction error:", extractErr)
      // Still save the file, just mark as extraction failed
      extractedText = ""
    }

    // Save metadata to knowledge_base_files
    const { data: record, error: dbError } = await supabase
      .from("knowledge_base_files")
      .insert({
        chatbot_id: chatbotId,
        user_id: user.id,
        file_name: file.name,
        file_type: fileExt,
        file_size: file.size,
        storage_path: storagePath,
        file_content: extractedText || null,
        processed_content: extractedText || null,
        status: extractedText ? "ready" : "processing",
      })
      .select("id, file_name, file_type, file_size, status, created_at")
      .single()

    if (dbError) {
      console.error("[kb-upload] DB insert error:", dbError)
      // Clean up uploaded file
      await supabase.storage.from("knowledge-base").remove([storagePath])
      return NextResponse.json({ error: "Failed to save file record" }, { status: 500 })
    }

    return NextResponse.json({ file: record })
  } catch (error) {
    console.error("[kb-upload] Unexpected error:", error)
    return NextResponse.json({ error: "Upload failed" }, { status: 500 })
  }
}

/**
 * GET /api/knowledge-base?chatbot_id=xxx
 * List all knowledge base files for a chatbot.
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const chatbotId = request.nextUrl.searchParams.get("chatbot_id")
    if (!chatbotId) {
      return NextResponse.json({ error: "chatbot_id is required" }, { status: 400 })
    }

    const { data: files, error } = await supabase
      .from("knowledge_base_files")
      .select("id, file_name, file_type, file_size, status, created_at")
      .eq("chatbot_id", chatbotId)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ files: files || [] })
  } catch (error) {
    console.error("[kb-list] Error:", error)
    return NextResponse.json({ error: "Failed to list files" }, { status: 500 })
  }
}

/**
 * DELETE /api/knowledge-base?id=xxx
 * Delete a knowledge base file.
 */
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const fileId = request.nextUrl.searchParams.get("id")
    if (!fileId) {
      return NextResponse.json({ error: "id is required" }, { status: 400 })
    }

    // Get file record first (need storage_path)
    const { data: file } = await supabase
      .from("knowledge_base_files")
      .select("id, storage_path")
      .eq("id", fileId)
      .eq("user_id", user.id)
      .single()

    if (!file) {
      return NextResponse.json({ error: "File not found" }, { status: 404 })
    }

    // Delete from storage
    if (file.storage_path) {
      await supabase.storage.from("knowledge-base").remove([file.storage_path])
    }

    // Delete from database
    const { error } = await supabase
      .from("knowledge_base_files")
      .delete()
      .eq("id", fileId)
      .eq("user_id", user.id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[kb-delete] Error:", error)
    return NextResponse.json({ error: "Delete failed" }, { status: 500 })
  }
}

// ─── Text extraction helpers ─────────────────────────────────────────────────

async function extractPdfText(buffer: Buffer): Promise<string> {
  // Simple PDF text extraction — extracts visible text strings from the PDF
  // For production, consider using pdf-parse or a dedicated PDF library
  const text = buffer.toString("utf-8")
  const matches = text.match(/\((.*?)\)/g)
  if (!matches) return ""

  return matches
    .map((m) => m.slice(1, -1))
    .filter((s) => s.length > 1 && /[a-zA-Z]/.test(s))
    .join(" ")
    .replace(/\\n/g, "\n")
    .replace(/\s+/g, " ")
    .trim()
}

async function extractDocxText(buffer: Buffer): Promise<string> {
  // DOCX files are ZIP archives containing XML
  // Extract text from the document.xml within the ZIP
  try {
    const JSZip = (await import("jszip")).default
    const zip = await JSZip.loadAsync(buffer)
    const docXml = await zip.file("word/document.xml")?.async("string")
    if (!docXml) return ""

    // Strip XML tags to get plain text
    return docXml
      .replace(/<\/w:p>/g, "\n")
      .replace(/<[^>]+>/g, "")
      .replace(/\s+/g, " ")
      .trim()
  } catch {
    return ""
  }
}

async function extractXlsxText(buffer: Buffer): Promise<string> {
  // XLSX files are ZIP archives containing XML worksheets
  // Extract cell values from each sheet
  try {
    const JSZip = (await import("jszip")).default
    const zip = await JSZip.loadAsync(buffer)

    // Read shared strings (XLSX stores text in a shared string table)
    const sharedStringsXml = await zip.file("xl/sharedStrings.xml")?.async("string")
    const sharedStrings: string[] = []
    if (sharedStringsXml) {
      const matches = sharedStringsXml.match(/<t[^>]*>([\s\S]*?)<\/t>/g)
      if (matches) {
        for (const m of matches) {
          sharedStrings.push(m.replace(/<[^>]+>/g, ""))
        }
      }
    }

    const rows: string[] = []

    // Find all sheet files
    const sheetFiles = Object.keys(zip.files).filter(
      (f) => f.startsWith("xl/worksheets/sheet") && f.endsWith(".xml")
    )

    for (const sheetFile of sheetFiles) {
      const sheetXml = await zip.file(sheetFile)?.async("string")
      if (!sheetXml) continue

      // Extract rows — each <row> contains <c> cells
      const rowMatches = sheetXml.match(/<row[^>]*>([\s\S]*?)<\/row>/g)
      if (!rowMatches) continue

      for (const rowXml of rowMatches) {
        const cellValues: string[] = []
        const cellMatches = rowXml.match(/<c[^>]*>[\s\S]*?<\/c>/g)
        if (!cellMatches) continue

        for (const cellXml of cellMatches) {
          const valueMatch = cellXml.match(/<v>([\s\S]*?)<\/v>/)
          if (!valueMatch) continue

          // Check if it's a shared string reference (t="s")
          if (cellXml.includes('t="s"')) {
            const idx = parseInt(valueMatch[1], 10)
            cellValues.push(sharedStrings[idx] || "")
          } else {
            cellValues.push(valueMatch[1])
          }
        }

        if (cellValues.length > 0) {
          rows.push(cellValues.join("\t"))
        }
      }
    }

    return rows.join("\n").trim()
  } catch {
    return ""
  }
}
