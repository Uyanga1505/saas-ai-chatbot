"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import {
  Mail,
  Phone,
  Star,
  AlertCircle,
  TrendingUp,
  MessageSquare,
  ArrowLeft,
  CheckCircle2,
  Smile,
  Meh,
  Frown,
} from "lucide-react"
import { useState, useEffect } from "react"
import { getLeadById } from "@/app/actions/leads-actions"
import { getConversationInsights } from "@/app/actions/insights-actions"
import { formatDistanceToNow, format } from "date-fns"
import Link from "next/link"
import { useParams } from "next/navigation"
import { ConversationHistory } from "@/components/dashboard/conversation-history"
import { ConversationInsights } from "@/components/dashboard/conversation-insights"

interface Lead {
  id: number
  session_id: string
  message_count: number
  qualified_lead: boolean
  email_address: string | null
  phone: string | null
  summary: string | null
  lead_quality_score: number | null
  pain_points: string[] | null
  customer_intent: string | null
  recommended_followup: string | null
  sentiment: string | null
  analyzed_at: string | null
  created_at: string
  updated_at: string
  sender_id: string | null
}

const formatDate = (dateString: string | null | undefined): string => {
  if (!dateString) return "N/A"

  try {
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return "N/A"
    return format(date, "MMM d, yyyy")
  } catch {
    return "N/A"
  }
}

const formatRelativeTime = (dateString: string | null | undefined): string => {
  if (!dateString) return "N/A"

  try {
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return "N/A"
    return formatDistanceToNow(date, { addSuffix: true })
  } catch {
    return "N/A"
  }
}

export default function LeadDetailPage() {
  const params = useParams()
  const [lead, setLead] = useState<Lead | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [insightsContact, setInsightsContact] = useState<{
    email?: string | null
    phone?: string | null
  }>({})

  useEffect(() => {
    fetchLead()
  }, [params.id])

  const fetchLead = async () => {
    try {
      const data = await getLeadById(params.id as string)
      setLead(data)

      if (data?.session_id) {
        const { insights } = await getConversationInsights(data.session_id)
        if (insights && insights.length > 0) {
          const latestInsight = insights[0]
          setInsightsContact({
            email: latestInsight.email_address || latestInsight.contact_email,
            phone: latestInsight.phone || latestInsight.phone_number,
          })
        }
      }
    } catch (error) {
      console.error("Error fetching lead:", error)
    }
    setIsLoading(false)
  }

  const getQualityColor = (score: number | null) => {
    if (!score) return "bg-gray-100 text-gray-800"
    if (score >= 8) return "bg-green-100 text-green-800"
    if (score >= 5) return "bg-yellow-100 text-yellow-800"
    return "bg-red-100 text-red-800"
  }

  const getSentimentIcon = (sentiment: string | null) => {
    if (!sentiment) return <Meh className="h-5 w-5" />
    if (sentiment.toLowerCase() === "positive") return <Smile className="h-5 w-5 text-green-600" />
    if (sentiment.toLowerCase() === "negative") return <Frown className="h-5 w-5 text-red-600" />
    return <Meh className="h-5 w-5 text-blue-600" />
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">Loading lead details...</div>
      </div>
    )
  }

  if (!lead) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Lead not found</h3>
            <Link href="/dashboard/leads">
              <Button>Back to Leads</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  const email = insightsContact.email || lead.email_address
  const phone = insightsContact.phone || lead.phone

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard/leads">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Lead Details</h1>
          <p className="text-muted-foreground">Session: {lead.session_id}</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Status Card */}
          <Card>
            <CardHeader>
              <CardTitle>Lead Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap items-center gap-3">
                {lead.qualified_lead && (
                  <Badge className="bg-green-100 text-green-800 px-3 py-1">
                    <CheckCircle2 className="h-4 w-4 mr-1" />
                    Qualified Lead
                  </Badge>
                )}
                {lead.lead_quality_score && (
                  <Badge className={`${getQualityColor(lead.lead_quality_score)} px-3 py-1`}>
                    <Star className="h-4 w-4 mr-1" />
                    Score: {lead.lead_quality_score}/10
                  </Badge>
                )}
                {lead.sentiment && (
                  <div className="flex items-center gap-2">
                    {getSentimentIcon(lead.sentiment)}
                    <span className="text-sm font-medium capitalize">{lead.sentiment} Sentiment</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Summary */}
          {lead.summary && (
            <Card>
              <CardHeader>
                <CardTitle>Conversation Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{lead.summary}</p>
              </CardContent>
            </Card>
          )}

          {/* Conversation History */}
          <ConversationHistory sessionId={lead.session_id} />

          {/* AI-powered Conversation Insights */}
          <ConversationInsights sessionId={lead.session_id} />

          {/* Pain Points */}
          {lead.pain_points && lead.pain_points.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-orange-600" />
                  Pain Points Identified
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {lead.pain_points.map((point, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-orange-600 mt-1">•</span>
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Customer Intent */}
          {lead.customer_intent && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Customer Intent
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{lead.customer_intent}</p>
              </CardContent>
            </Card>
          )}

          {/* Recommended Follow-up */}
          {lead.recommended_followup && (
            <Card className="border-blue-200 bg-blue-50">
              <CardHeader>
                <CardTitle className="text-blue-900">Recommended Follow-up Action</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-blue-900">{lead.recommended_followup}</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Contact Info */}
          <Card>
            <CardHeader>
              <CardTitle>Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {email ? (
                <div className="flex items-start gap-3">
                  <Mail className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">Email</p>
                    <a href={`mailto:${email}`} className="text-sm text-blue-600 hover:underline break-all">
                      {email}
                    </a>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3 text-muted-foreground">
                  <Mail className="h-5 w-5" />
                  <p className="text-sm">No email provided</p>
                </div>
              )}

              <Separator />

              {phone ? (
                <div className="flex items-start gap-3">
                  <Phone className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">Phone</p>
                    <a href={`tel:${phone}`} className="text-sm text-blue-600 hover:underline break-all">
                      {phone}
                    </a>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3 text-muted-foreground">
                  <Phone className="h-5 w-5" />
                  <p className="text-sm">No phone provided</p>
                </div>
              )}

              {lead.sender_id && (
                <>
                  <Separator />
                  <div className="flex items-center gap-3">
                    <MessageSquare className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Sender ID</p>
                      <p className="text-sm text-muted-foreground break-all">{lead.sender_id}</p>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Conversation Stats */}
          <Card>
            <CardHeader>
              <CardTitle>Conversation Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Messages</span>
                <span className="text-sm font-medium">{lead.message_count}</span>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Created</span>
                <span className="text-sm font-medium">{formatDate(lead.created_at)}</span>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Last Updated</span>
                <span className="text-sm font-medium">{formatRelativeTime(lead.updated_at)}</span>
              </div>
              {lead.analyzed_at && (
                <>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Analyzed</span>
                    <span className="text-sm font-medium">{formatRelativeTime(lead.analyzed_at)}</span>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {email && (
                <a href={`mailto:${email}`} className="block">
                  <Button className="w-full bg-transparent" variant="outline">
                    <Mail className="h-4 w-4 mr-2" />
                    Send Email
                  </Button>
                </a>
              )}
              {phone && (
                <a href={`tel:${phone}`} className="block">
                  <Button className="w-full bg-transparent" variant="outline">
                    <Phone className="h-4 w-4 mr-2" />
                    Call Phone
                  </Button>
                </a>
              )}
              <Button className="w-full bg-transparent" variant="outline">
                <MessageSquare className="h-4 w-4 mr-2" />
                View Full Thread
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
