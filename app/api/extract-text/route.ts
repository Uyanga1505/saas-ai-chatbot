import { NextRequest, NextResponse } from "next/server"

/**
 * POST /api/extract-text
 * Accepts a file upload and returns the extracted plain text.
 * Used by the system prompt "Load from file" feature.
 * No auth required — runs client-side only, no data is stored.
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File | null

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: "File too large. Max 10 MB." }, { status: 400 })
    }

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    let text = ""

    if (file.type === "text/plain" || file.name.endsWith(".txt") || file.name.endsWith(".md") || file.name.endsWith(".csv")) {
      text = new TextDecoder().decode(buffer)
    } else if (file.type === "application/pdf" || file.name.endsWith(".pdf")) {
      text = await extractPdfText(buffer)
    } else if (
      file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
      file.name.endsWith(".docx")
    ) {
      text = await extractDocxText(buffer)
    } else if (
      file.type === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
      file.name.endsWith(".xlsx")
    ) {
      text = await extractXlsxText(buffer)
    } else {
      // Fallback: try reading as plain text
      text = new TextDecoder().decode(buffer)
    }

    if (!text.trim()) {
      return NextResponse.json({ error: "Could not extract text from this file." }, { status: 422 })
    }

    return NextResponse.json({ text })
  } catch (error) {
    console.error("[extract-text] Error:", error)
    return NextResponse.json({ error: "Failed to extract text" }, { status: 500 })
  }
}

// ─── Text extraction helpers ─────────────────────────────────────────────────

async function extractPdfText(buffer: Buffer): Promise<string> {
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
  try {
    const JSZip = (await import("jszip")).default
    const zip = await JSZip.loadAsync(buffer)
    const docXml = await zip.file("word/document.xml")?.async("string")
    if (!docXml) return ""

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
  try {
    const JSZip = (await import("jszip")).default
    const zip = await JSZip.loadAsync(buffer)

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
    const sheetFiles = Object.keys(zip.files).filter(
      (f) => f.startsWith("xl/worksheets/sheet") && f.endsWith(".xml")
    )

    for (const sheetFile of sheetFiles) {
      const sheetXml = await zip.file(sheetFile)?.async("string")
      if (!sheetXml) continue

      const rowMatches = sheetXml.match(/<row[^>]*>([\s\S]*?)<\/row>/g)
      if (!rowMatches) continue

      for (const rowXml of rowMatches) {
        const cellValues: string[] = []
        const cellMatches = rowXml.match(/<c[^>]*>[\s\S]*?<\/c>/g)
        if (!cellMatches) continue

        for (const cellXml of cellMatches) {
          const valueMatch = cellXml.match(/<v>([\s\S]*?)<\/v>/)
          if (!valueMatch) continue

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
