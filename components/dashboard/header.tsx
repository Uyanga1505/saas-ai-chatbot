"use client"

import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Bell, Plus } from "lucide-react"
import { useEffect, useState } from "react"
import { getCurrentUser } from "@/app/actions/auth-actions"
import Link from "next/link"
import { ThemeToggle } from "@/components/theme-toggle"

interface User {
  email?: string
  user_metadata?: {
    full_name?: string
  }
}

export function DashboardHeader() {
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    const getUser = async () => {
      const userData = await getCurrentUser()
      setUser(userData)
    }
    getUser()
  }, [])

  const getInitials = (name: string | undefined, email: string) => {
    if (name) {
      return name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
    }
    return email.charAt(0).toUpperCase()
  }

  return (
    <header className="flex h-16 items-center justify-between border-b border-border bg-background px-6">
      <div>
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Manage your AI chatbots and conversations</p>
      </div>

      <div className="flex items-center gap-4">
        <Button size="sm" className="gap-2" asChild>
          <Link href="/dashboard/chatbots/new">
            <Plus className="h-4 w-4" />
            New Chatbot
          </Link>
        </Button>

        <ThemeToggle />

        <Button variant="ghost" size="sm" asChild title="View conversations">
          <Link href="/dashboard/conversations">
            <Bell className="h-4 w-4" />
          </Link>
        </Button>

        <Link href="/dashboard/settings" title="Account settings">
          <Avatar className="h-8 w-8 cursor-pointer hover:ring-2 hover:ring-primary/50 transition-shadow">
            <AvatarFallback className="text-xs">
              {user ? getInitials(user.user_metadata?.full_name, user.email || "") : "U"}
            </AvatarFallback>
          </Avatar>
        </Link>
      </div>
    </header>
  )
}
