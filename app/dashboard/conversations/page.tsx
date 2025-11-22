"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { MessageSquare, Search, Filter, User, Star, CheckCircle2, ExternalLink } from "lucide-react"
import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { fetchLeads, type Lead } from "@/app/actions/leads-actions"
import { formatDistanceToNow } from "date-fns"
import Link from "next/link"

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
  const [internalConversations, setInternalConversations] = useState<Conversation[]>([])
  const [externalConversations, setExternalConversations] = useState<Lead[]>([])
  const [isLoadingInternal, setIsLoadingInternal] = useState(true)
  const [isLoadingExternal, setIsLoadingExternal] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [activeTab, setActiveTab] = useState("messenger")

  useEffect(() => {
    fetchInternalConversations()
    fetchExternalConversations()
  }, [])

  const fetchInternalConversations = async () => {
    const supabase = createClient()
    const { data, error } = await supabase
      .from("conversations")
      .select(`
        *,
        chatbot:chatbots(name),
        messages(content, role, created_at)
      `)
      .order("updated_at", { ascending: false })

    if (error) {
      console.error("Error fetching internal conversations:", error)
    } else {
      setInternalConversations(data || [])
    }
    setIsLoadingInternal(false)
  }

  const fetchExternalConversations = async () => {
    const { data } = await fetchLeads()
    setExternalConversations(data)
    setIsLoadingExternal(false)
  }

  const filteredInternalConversations = internalConversations.filter(
    (conversation) =>
      conversation.messenger_user_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      conversation.chatbot.name.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const filteredExternalConversations = externalConversations.filter(
    (conversation) =>
      conversation.session_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      conversation.email_address?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      conversation.sender_id?.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const getLastMessage = (messages: any[]) => {
    if (messages.length === 0) return "No messages"
    const lastMessage = messages[messages.length - 1]
    return lastMessage.content.length > 50 ? lastMessage.content.substring(0, 50) + "..." : lastMessage.content
  }

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
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="messenger">Messenger Leads</TabsTrigger>
          <TabsTrigger value="internal">Internal Chats</TabsTrigger>
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
                              <span>{formatDistanceToNow(new Date(conversation.updated_at), { addSuffix: true })}</span>
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

        <TabsContent value="internal" className="space-y-4 mt-6">
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search conversations..."
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

          {isLoadingInternal ? (
            <div className="text-center py-12">Loading internal conversations...</div>
          ) : filteredInternalConversations.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No conversations yet</h3>
                <p className="text-muted-foreground text-center">Internal test conversations will appear here</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredInternalConversations.map((conversation) => (
                <Card key={conversation.id} className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <Avatar className="h-12 w-12">
                          <AvatarFallback>
                            <User className="h-6 w-6" />
                          </AvatarFallback>
                        </Avatar>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-medium">User {conversation.messenger_user_id.slice(-8)}</h3>
                            <Badge variant="outline" className="text-xs">
                              {conversation.chatbot.name}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">{getLastMessage(conversation.messages)}</p>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span>{conversation.messages.length} messages</span>
                            <span>
                              Last active {formatDistanceToNow(new Date(conversation.updated_at), { addSuffix: true })}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className="bg-green-100 text-green-800">Active</Badge>
                        <Button variant="ghost" size="sm">
                          <MessageSquare className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
