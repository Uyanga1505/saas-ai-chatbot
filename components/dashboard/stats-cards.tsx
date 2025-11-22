"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Bot, MessageSquare, Users, TrendingUp } from "lucide-react"

const stats = [
  {
    title: "Active Chatbots",
    value: "3",
    change: "+2 from last month",
    icon: Bot,
    color: "text-blue-600",
  },
  {
    title: "Total Conversations",
    value: "1,247",
    change: "+12% from last month",
    icon: MessageSquare,
    color: "text-green-600",
  },
  {
    title: "Unique Users",
    value: "892",
    change: "+8% from last month",
    icon: Users,
    color: "text-purple-600",
  },
  {
    title: "Response Rate",
    value: "98.5%",
    change: "+0.5% from last month",
    icon: TrendingUp,
    color: "text-orange-600",
  },
]

export function StatsCards() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => (
        <Card key={stat.title}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
            <stat.icon className={`h-4 w-4 ${stat.color}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stat.value}</div>
            <p className="text-xs text-muted-foreground">{stat.change}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
