"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { MessageSquare, Search, Filter, User, Star, CheckCircle2, ExternalLink } from "lucide-react"
import { useState, useEffect } from "react"
import { fetchLeads, type Lead } from "@/app/actions/leads-actions"
import { formatDistanceToNow } from "date-fns"
import Link from "next/link"

const formatDate = (dateString: string | null | undefined): string => {
  if (!dateString) return "Recently"

  try {
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return "Recently"
    return formatDistanceToNow(date, { addSuffix: true })
  } catch {
    return "Recently"
  }
}

interface Conversation {
  id: string
  messenger_user_id: string
  created_at: string
  updated_at: string
  chatbot: {
    name: string
  }
  messages: {
    content: string
    role: string
    created_at: string
  }[]
}

export default function ConversationsPage() {
  const [externalConversations, setExternalConversations] = useState<Lead[]>([])
  const [isLoadingExternal, setIsLoadingExternal] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [activeTab, setActiveTab] = useState("messenger")

  useEffect(() => {
    fetchExternalConversations()
  }, [])

  const fetchExternalConversations = async () => {
    const { data } = await fetchLeads()
    setExternalConversations(data)
    setIsLoadingExternal(false)
  }

  const filteredExternalConversations = externalConversations.filter(
    (conversation) =>
      conversation.session_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      conversation.email_address?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      conversation.sender_id?.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const getQualityColor = (score: number | null) => {
    if (!score) return "bg-gray-100 text-gray-800"
    if (score >= 8) return "bg-green-100 text-green-800"
    if (score >= 5) return "bg-yellow-100 text-yellow-800"
    return "bg-red-100 text-red-800"
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Conversations</h1>
        <p className="text-muted-foreground">View and manage all chatbot conversations and leads</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-1">
          <TabsTrigger value="messenger">Messenger Leads</TabsTrigger>
        </TabsList>

        <TabsContent value="messenger" className="space-y-4 mt-6">
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by session, email, or sender..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button variant="outline" className="gap-2 bg-transparent">
              <Filter className="h-4 w-4" />
              Filter
            </Button>
          </div>

          {isLoadingExternal ? (
            <div className="text-center py-12">Loading messenger conversations...</div>
          ) : filteredExternalConversations.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No messenger conversations yet</h3>
                <p className="text-muted-foreground text-center">
                  Messenger conversations will appear here when users interact with your Facebook chatbot
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredExternalConversations.map((conversation) => (
                <Link key={conversation.id} href={`/dashboard/leads/${conversation.id}`}>
                  <Card className="hover:shadow-md transition-shadow cursor-pointer">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-4 flex-1">
                          <Avatar className="h-12 w-12">
                            <AvatarFallback className="bg-blue-100 text-blue-600">
                              <User className="h-6 w-6" />
                            </AvatarFallback>
                          </Avatar>
                          <div className="space-y-2 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="font-medium">
                                {conversation.email_address || `Session ${conversation.session_id.slice(0, 8)}`}
                              </h3>
                              {conversation.qualified_lead && (
                                <Badge className="bg-green-100 text-green-800">
                                  <CheckCircle2 className="h-3 w-3 mr-1" />
                                  Qualified
                                </Badge>
                              )}
                              {conversation.lead_quality_score && (
                                <Badge className={getQualityColor(conversation.lead_quality_score)}>
                                  <Star className="h-3 w-3 mr-1" />
                                  {conversation.lead_quality_score}/10
                                </Badge>
                              )}
                              {conversation.sentiment && (
                                <Badge variant="outline" className="capitalize">
                                  {conversation.sentiment}
                                </Badge>
                              )}
                            </div>

                            {conversation.summary && (
                              <p className="text-sm text-muted-foreground line-clamp-2">{conversation.summary}</p>
                            )}

                            <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
                              <span>{conversation.message_count} messages</span>
                              {conversation.email_address && (
                                <span className="flex items-center gap-1">
                                  <span>📧</span>
                                  {conversation.email_address}
                                </span>
                              )}
                              {conversation.phone && (
                                <span className="flex items-center gap-1">
                                  <span>📱</span>
                                  {conversation.phone}
                                </span>
                              )}
                              <span>{formatDate(conversation.updated_at)}</span>
                            </div>
                          </div>
                        </div>
                        <Button variant="ghost" size="sm">
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
