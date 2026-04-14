"use client"

import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"
import { useChatbot } from "@/lib/chatbot-context"
import {
  MessageSquare,
  Bot,
  BarChart3,
  Settings,
  LogOut,
  Home,
  Zap,
  Users,
  Lightbulb,
  ChevronsUpDown,
  Plus,
  Check,
} from "lucide-react"
import Link from "next/link"
import { useRouter, usePathname } from "next/navigation"
import { useState } from "react"

const navigation = [
  { name: "Overview", href: "/dashboard", icon: Home },
  { name: "Chatbots", href: "/dashboard/chatbots", icon: Bot },
  { name: "Conversations", href: "/dashboard/conversations", icon: MessageSquare },
  { name: "Leads", href: "/dashboard/leads", icon: Users },
  { name: "Insights", href: "/dashboard/insights", icon: Lightbulb },
  { name: "Analytics", href: "/dashboard/analytics", icon: BarChart3 },
  { name: "Integrations", href: "/dashboard/integrations", icon: Zap },
  { name: "Settings", href: "/dashboard/settings", icon: Settings },
]

export function DashboardSidebar() {
  const router = useRouter()
  const pathname = usePathname()
  const [isLoading, setIsLoading] = useState(false)
  const [selectorOpen, setSelectorOpen] = useState(false)
  const { chatbots, selectedChatbot, selectedChatbotId, selectChatbot } = useChatbot()

  const handleSignOut = async () => {
    setIsLoading(true)
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/")
  }

  return (
    <div className="flex h-full w-64 flex-col bg-background border-r border-border">
      {/* Logo */}
      <div className="flex h-16 items-center gap-2 px-6 border-b border-border">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
          <MessageSquare className="h-5 w-5 text-primary-foreground" />
        </div>
        <span className="text-xl font-bold">ChatFlow</span>
      </div>

      {/* Chatbot Selector */}
      <div className="px-3 pt-4 pb-2">
        <div className="relative">
          <button
            onClick={() => setSelectorOpen(!selectorOpen)}
            className="flex w-full items-center justify-between rounded-lg border border-border bg-muted/50 px-3 py-2.5 text-sm font-medium hover:bg-muted transition-colors"
          >
            <div className="flex items-center gap-2 truncate">
              <Bot className="h-4 w-4 text-primary flex-shrink-0" />
              <span className="truncate">
                {selectedChatbot ? selectedChatbot.name : "All Chatbots"}
              </span>
            </div>
            <ChevronsUpDown className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          </button>

          {selectorOpen && (
            <div className="absolute z-50 mt-1 w-full rounded-lg border border-border bg-background shadow-lg">
              {/* All Chatbots option */}
              <button
                onClick={() => {
                  selectChatbot(null)
                  setSelectorOpen(false)
                }}
                className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-muted transition-colors rounded-t-lg"
              >
                <Check className={`h-4 w-4 ${!selectedChatbotId ? "text-primary" : "text-transparent"}`} />
                <span className={!selectedChatbotId ? "font-medium" : ""}>All Chatbots</span>
              </button>

              {/* Divider */}
              {chatbots.length > 0 && <div className="border-t border-border" />}

              {/* Individual chatbots */}
              {chatbots.map((bot) => (
                <button
                  key={bot.id}
                  onClick={() => {
                    selectChatbot(bot.id)
                    setSelectorOpen(false)
                  }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-muted transition-colors"
                >
                  <Check className={`h-4 w-4 ${selectedChatbotId === bot.id ? "text-primary" : "text-transparent"}`} />
                  <div className="flex flex-col items-start truncate">
                    <span className={`truncate ${selectedChatbotId === bot.id ? "font-medium" : ""}`}>
                      {bot.name}
                    </span>
                    {bot.messenger_page_id && (
                      <span className="text-xs text-muted-foreground truncate">
                        Page: {bot.messenger_page_id}
                      </span>
                    )}
                  </div>
                  {bot.is_active && (
                    <span className="ml-auto h-2 w-2 rounded-full bg-green-500 flex-shrink-0" />
                  )}
                </button>
              ))}

              {/* Add new chatbot */}
              <div className="border-t border-border">
                <Link
                  href="/dashboard/chatbots/new"
                  onClick={() => setSelectorOpen(false)}
                  className="flex w-full items-center gap-2 px-3 py-2 text-sm text-primary hover:bg-muted transition-colors rounded-b-lg"
                >
                  <Plus className="h-4 w-4" />
                  <span>Add New Chatbot</span>
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-2">
        {navigation.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <item.icon className="h-4 w-4" />
              {item.name}
            </Link>
          )
        })}
      </nav>

      {/* Sign Out */}
      <div className="p-3 border-t border-border">
        <Button variant="ghost" className="w-full justify-start gap-3" onClick={handleSignOut} disabled={isLoading}>
          <LogOut className="h-4 w-4" />
          {isLoading ? "Signing out..." : "Sign out"}
        </Button>
      </div>
    </div>
  )
}
