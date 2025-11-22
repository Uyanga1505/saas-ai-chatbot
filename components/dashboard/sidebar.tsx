"use client"

import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"
import { MessageSquare, Bot, BarChart3, Settings, LogOut, Home, Zap, Users } from "lucide-react"
import Link from "next/link"
import { useRouter, usePathname } from "next/navigation"
import { useState } from "react"

const navigation = [
  { name: "Overview", href: "/dashboard", icon: Home },
  { name: "Chatbots", href: "/dashboard/chatbots", icon: Bot },
  { name: "Conversations", href: "/dashboard/conversations", icon: MessageSquare },
  { name: "Leads", href: "/dashboard/leads", icon: Users },
  { name: "Analytics", href: "/dashboard/analytics", icon: BarChart3 },
  { name: "Integrations", href: "/dashboard/integrations", icon: Zap },
  { name: "Settings", href: "/dashboard/settings", icon: Settings },
]

export function DashboardSidebar() {
  const router = useRouter()
  const pathname = usePathname()
  const [isLoading, setIsLoading] = useState(false)

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

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-4">
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
