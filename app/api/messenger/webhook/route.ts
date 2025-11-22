import { createClient } from "@/lib/supabase/server"
import { openai } from "@ai-sdk/openai"
import { generateText } from "ai"

export async function GET(req: Request) {
  const url = new URL(req.url)
  const mode = url.searchParams.get("hub.mode")
  const token = url.searchParams.get("hub.verify_token")
  const challenge = url.searchParams.get("hub.challenge")

  if (mode === "subscribe" && token === "your_verify_token") {
    return new Response(challenge)
  }

  return new Response("Forbidden", { status: 403 })
}

export async function POST(req: Request) {
  try {
    const body = await req.json()

    // Process Messenger webhook events
    if (body.object === "page") {
      for (const entry of body.entry) {
        for (const event of entry.messaging) {
          if (event.message && event.message.text) {
            await handleMessage(event)
          }
        }
      }
    }

    return new Response("OK")
  } catch (error) {
    console.error("Webhook error:", error)
    return new Response("Error", { status: 500 })
  }
}

async function handleMessage(event: any) {
  const supabase = await createClient()
  const senderId = event.sender.id
  const messageText = event.message.text
  const pageId = event.recipient.id

  // Find chatbot by page ID
  const { data: chatbot } = await supabase
    .from("chatbots")
    .select("*")
    .eq("messenger_page_id", pageId)
    .eq("is_active", true)
    .single()

  if (!chatbot) {
    console.log("No active chatbot found for page:", pageId)
    return
  }

  // Get or create conversation
  let { data: conversation } = await supabase
    .from("conversations")
    .select("id")
    .eq("chatbot_id", chatbot.id)
    .eq("messenger_user_id", senderId)
    .single()

  if (!conversation) {
    const { data: newConversation } = await supabase
      .from("conversations")
      .insert({
        chatbot_id: chatbot.id,
        messenger_user_id: senderId,
      })
      .select("id")
      .single()
    conversation = newConversation
  }

  // Store user message
  await supabase.from("messages").insert({
    conversation_id: conversation.id,
    content: messageText,
    role: "user",
  })

  // Get recent conversation history for context
  const { data: recentMessages } = await supabase
    .from("messages")
    .select("content, role")
    .eq("conversation_id", conversation.id)
    .order("created_at", { ascending: false })
    .limit(10)

  // Build conversation context
  const conversationHistory =
    recentMessages?.reverse().map((msg) => ({
      role: msg.role as "user" | "assistant",
      content: msg.content,
    })) || []

  // Generate AI response
  const { text } = await generateText({
    model: openai(chatbot.ai_model || "gpt-3.5-turbo"),
    messages: [
      {
        role: "system",
        content: chatbot.system_prompt || "You are a helpful AI assistant.",
      },
      ...conversationHistory,
    ],
    maxOutputTokens: 1000,
    temperature: 0.7,
  })

  // Store AI response
  await supabase.from("messages").insert({
    conversation_id: conversation.id,
    content: text,
    role: "assistant",
  })

  // Send response back to Messenger
  await sendMessengerMessage(chatbot.messenger_access_token, senderId, text)
}

async function sendMessengerMessage(accessToken: string, recipientId: string, message: string) {
  try {
    const response = await fetch(`https://graph.facebook.com/v18.0/me/messages?access_token=${accessToken}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        recipient: { id: recipientId },
        message: { text: message },
      }),
    })

    if (!response.ok) {
      console.error("Failed to send Messenger message:", await response.text())
    }
  } catch (error) {
    console.error("Error sending Messenger message:", error)
  }
}
