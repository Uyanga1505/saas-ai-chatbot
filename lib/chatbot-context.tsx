"use client"

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react"
import { getChatbots } from "@/app/actions/chatbot-actions"

export interface Chatbot {
  id: string
  user_id: string
  name: string
  description?: string
  messenger_page_id?: string
  messenger_access_token?: string
  ai_model?: string
  system_prompt?: string
  is_active?: boolean
  created_at?: string
  updated_at?: string
  selected_model?: string
  temperature?: number
  max_tokens?: number
  enable_human_handoff?: boolean
  handoff_email?: string
  agent_type?: string
  rag_store_id?: string
  model_tier?: string
  notify_emails?: string[]
}

interface ChatbotContextType {
  chatbots: Chatbot[]
  selectedChatbot: Chatbot | null
  selectedChatbotId: string | null
  isLoading: boolean
  selectChatbot: (id: string | null) => void
  refreshChatbots: () => Promise<void>
  /** Returns the page_ids to filter data by — either the selected chatbot's or all */
  getPageIds: () => string[]
}

const ChatbotContext = createContext<ChatbotContextType | undefined>(undefined)

export function ChatbotProvider({ children }: { children: ReactNode }) {
  const [chatbots, setChatbots] = useState<Chatbot[]>([])
  const [selectedChatbotId, setSelectedChatbotId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const loadChatbots = useCallback(async () => {
    setIsLoading(true)
    try {
      const result = await getChatbots()
      const list = result.data || []
      setChatbots(list)

      // Restore selection from localStorage or default to "all"
      if (typeof window !== "undefined") {
        const saved = localStorage.getItem("selectedChatbotId")
        if (saved && list.find((c: Chatbot) => c.id === saved)) {
          setSelectedChatbotId(saved)
        }
      }
    } catch (err) {
      console.error("Failed to load chatbots:", err)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadChatbots()
  }, [loadChatbots])

  const selectChatbot = (id: string | null) => {
    setSelectedChatbotId(id)
    if (typeof window !== "undefined") {
      if (id) {
        localStorage.setItem("selectedChatbotId", id)
      } else {
        localStorage.removeItem("selectedChatbotId")
      }
    }
  }

  const selectedChatbot = chatbots.find((c) => c.id === selectedChatbotId) || null

  const getPageIds = () => {
    if (selectedChatbot?.messenger_page_id) {
      return [selectedChatbot.messenger_page_id]
    }
    // Return all page_ids for this user's chatbots
    return chatbots
      .map((c) => c.messenger_page_id)
      .filter((pid): pid is string => !!pid)
  }

  return (
    <ChatbotContext.Provider
      value={{
        chatbots,
        selectedChatbot,
        selectedChatbotId,
        isLoading,
        selectChatbot,
        refreshChatbots: loadChatbots,
        getPageIds,
      }}
    >
      {children}
    </ChatbotContext.Provider>
  )
}

export function useChatbot() {
  const context = useContext(ChatbotContext)
  if (!context) {
    throw new Error("useChatbot must be used within a ChatbotProvider")
  }
  return context
}
