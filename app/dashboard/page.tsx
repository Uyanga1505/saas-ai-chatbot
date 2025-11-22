import { StatsCards } from "@/components/dashboard/stats-cards"
import { RecentConversations } from "@/components/dashboard/recent-conversations"
import { ChatbotOverview } from "@/components/dashboard/chatbot-overview"

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <StatsCards />

      <div className="grid gap-6 lg:grid-cols-2">
        <ChatbotOverview />
        <RecentConversations />
      </div>
    </div>
  )
}
