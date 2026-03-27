import { openai } from "@ai-sdk/openai"
import { convertToModelMessages, streamText, type UIMessage } from "ai"
import { createClient } from "@/lib/supabase/server"

export const maxDuration = 30

export async function POST(req: Request, { params }: { params: Promise<{ chatbotId: string }> }) {
  try {
    const { chatbotId } = await params
    const { messages }: { messages: UIMessage[] } = await req.json()

    const supabase = await createClient()

    // Get chatbot configuration
    const { data: chatbot, error: chatbotError } = await supabase
      .from("chatbots")
      .select("*")
      .eq("id", chatbotId)
      .single()

    if (chatbotError || !chatbot) {
      return Response.json({ error: "Chatbot not found" }, { status: 404 })
    }

    // Convert messages for AI model
    const modelMessages = convertToModelMessages(messages)

    // Add system prompt
    const systemMessage = {
      role: "system" as const,
      content: chatbot.system_prompt || "You are a helpful AI assistant.",
    }

    // Map ai_model field to OpenAI model names
    // In production, n8n handles Gemini. The test UI uses OpenAI for quick testing.
    const modelName = chatbot.ai_model === "gemini" ? "gpt-4o-mini" : (chatbot.ai_model || "gpt-4o-mini")

    // Generate AI response
    const result = streamText({
      model: openai(modelName),
      messages: [systemMessage, ...modelMessages],
      abortSignal: req.signal,
      maxOutputTokens: chatbot.max_tokens || 1000,
      temperature: chatbot.temperature || 0.7,
    })

    return result.toUIMessageStreamResponse()
  } catch (error) {
    console.error("Chat API error:", error)
    return Response.json({ error: "Internal server error" }, { status: 500 })
  }
}
