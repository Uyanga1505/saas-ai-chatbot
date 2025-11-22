import { openai } from "@ai-sdk/openai"
import { convertToModelMessages, streamText, type UIMessage } from "ai"
import { createClient } from "@/lib/supabase/server"

export const maxDuration = 30

export async function POST(req: Request, { params }: { params: Promise<{ chatbotId: string }> }) {
  try {
    const { chatbotId } = await params
    const { messages, messengerUserId }: { messages: UIMessage[]; messengerUserId: string } = await req.json()

    const supabase = await createClient()

    // Get chatbot configuration
    const { data: chatbot, error: chatbotError } = await supabase
      .from("chatbots")
      .select("*")
      .eq("id", chatbotId)
      .eq("is_active", true)
      .single()

    if (chatbotError || !chatbot) {
      return Response.json({ error: "Chatbot not found or inactive" }, { status: 404 })
    }

    // Get or create conversation
    let { data: conversation } = await supabase
      .from("conversations")
      .select("id")
      .eq("chatbot_id", chatbotId)
      .eq("messenger_user_id", messengerUserId)
      .single()

    if (!conversation) {
      const { data: newConversation, error: conversationError } = await supabase
        .from("conversations")
        .insert({
          chatbot_id: chatbotId,
          messenger_user_id: messengerUserId,
        })
        .select("id")
        .single()

      if (conversationError) {
        return Response.json({ error: "Failed to create conversation" }, { status: 500 })
      }
      conversation = newConversation
    }

    // Store user message
    const userMessage = messages[messages.length - 1]
    if (userMessage.role === "user") {
      await supabase.from("messages").insert({
        conversation_id: conversation.id,
        content: userMessage.parts.find((part) => part.type === "text")?.text || "",
        role: "user",
      })
    }

    // Convert messages for AI model
    const modelMessages = convertToModelMessages(messages)

    // Add system prompt
    const systemMessage = {
      role: "system" as const,
      content: chatbot.system_prompt || "You are a helpful AI assistant.",
    }

    // Generate AI response
    const result = streamText({
      model: openai(chatbot.ai_model || "gpt-3.5-turbo"),
      messages: [systemMessage, ...modelMessages],
      abortSignal: req.signal,
      maxOutputTokens: 1000,
      temperature: 0.7,
    })

    return result.toUIMessageStreamResponse({
      onFinish: async ({ text }) => {
        // Store AI response
        if (text) {
          await supabase.from("messages").insert({
            conversation_id: conversation.id,
            content: text,
            role: "assistant",
          })
        }
      },
    })
  } catch (error) {
    console.error("Chat API error:", error)
    return Response.json({ error: "Internal server error" }, { status: 500 })
  }
}
