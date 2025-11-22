"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Users, Search, Mail, Phone, TrendingUp, MessageSquare, Star, AlertCircle, CheckCircle2 } from "lucide-react"
import { useState, useEffect } from "react"
import { fetchLeads, type Lead } from "@/app/actions/leads-actions"
import { formatDistanceToNow } from "date-fns"
import Link from "next/link"

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [connectionError, setConnectionError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterQualified, setFilterQualified] = useState<string>("all")
  const [filterSentiment, setFilterSentiment] = useState<string>("all")

  useEffect(() => {
    loadLeads()
  }, [])

  const loadLeads = async () => {
    const { data, error } = await fetchLeads()
    if (error) {
      setConnectionError(error)
    }
    setLeads(data)
    setIsLoading(false)
  }

  const filteredLeads = leads.filter((lead) => {
    const matchesSearch =
      lead.session_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.email_address?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.phone?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.sender_id?.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesQualified =
      filterQualified === "all" ||
      (filterQualified === "qualified" && lead.qualified_lead) ||
      (filterQualified === "unqualified" && !lead.qualified_lead)

    const matchesSentiment = filterSentiment === "all" || lead.sentiment?.toLowerCase() === filterSentiment

    return matchesSearch && matchesQualified && matchesSentiment
  })

  const getQualityColor = (score: number | null) => {
    if (!score) return "bg-gray-100 text-gray-800"
    if (score >= 8) return "bg-green-100 text-green-800"
    if (score >= 5) return "bg-yellow-100 text-yellow-800"
    return "bg-red-100 text-red-800"
  }

  const getSentimentColor = (sentiment: string | null) => {
    if (!sentiment) return "bg-gray-100 text-gray-800"
    if (sentiment.toLowerCase() === "positive") return "bg-green-100 text-green-800"
    if (sentiment.toLowerCase() === "negative") return "bg-red-100 text-red-800"
    return "bg-blue-100 text-blue-800"
  }

  const qualifiedCount = leads.filter((l) => l.qualified_lead).length
  const avgQualityScore =
    leads.filter((l) => l.lead_quality_score).reduce((sum, l) => sum + (l.lead_quality_score || 0), 0) /
      leads.filter((l) => l.lead_quality_score).length || 0

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Leads</h1>
          <p className="text-muted-foreground">Track and manage qualified leads from conversations</p>
        </div>
        <div className="text-center py-12">Loading leads...</div>
      </div>
    )
  }

  if (connectionError && leads.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Leads</h1>
          <p className="text-muted-foreground">Track and manage qualified leads from conversations</p>
        </div>
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-6 space-y-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
              <div className="space-y-2 flex-1">
                <h3 className="font-semibold text-blue-900">External Database Not Connected</h3>
                <p className="text-sm text-blue-800">
                  To view your Facebook Messenger leads, you need to connect your external Supabase database with your
                  lead tracking data.
                </p>
                <div className="bg-white rounded-lg p-4 border border-blue-200 space-y-3">
                  <p className="text-sm font-medium text-blue-900">Setup Instructions:</p>
                  <ol className="text-sm text-blue-800 space-y-2 list-decimal list-inside">
                    <li>Deploy this project to Vercel by clicking the "Publish" button</li>
                    <li>In your Vercel project dashboard, go to Settings → Environment Variables</li>
                    <li>
                      Add these two environment variables:
                      <ul className="ml-6 mt-2 space-y-1 list-disc list-inside">
                        <li>
                          <code className="bg-blue-100 px-2 py-0.5 rounded">EXTERNAL_SUPABASE_URL</code> - Your Supabase
                          project URL
                        </li>
                        <li>
                          <code className="bg-blue-100 px-2 py-0.5 rounded">EXTERNAL_SUPABASE_ANON_KEY</code> - Your
                          Supabase anon key
                        </li>
                      </ul>
                    </li>
                    <li>Redeploy your project for the changes to take effect</li>
                  </ol>
                  <p className="text-xs text-blue-700 mt-3">
                    You can find these values in your Supabase dashboard under Settings → API
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Leads</h1>
        <p className="text-muted-foreground">Track and manage qualified leads from conversations</p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Leads</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{leads.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Qualified Leads</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{qualifiedCount}</div>
            <p className="text-xs text-muted-foreground">
              {leads.length > 0 ? ((qualifiedCount / leads.length) * 100).toFixed(0) : 0}% conversion
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Quality Score</CardTitle>
            <Star className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgQualityScore.toFixed(1)}/10</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">With Contact Info</CardTitle>
            <Mail className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{leads.filter((l) => l.email_address || l.phone).length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by email, phone, or session..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={filterQualified} onValueChange={setFilterQualified}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Leads</SelectItem>
            <SelectItem value="qualified">Qualified Only</SelectItem>
            <SelectItem value="unqualified">Unqualified</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterSentiment} onValueChange={setFilterSentiment}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Filter by sentiment" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Sentiments</SelectItem>
            <SelectItem value="positive">Positive</SelectItem>
            <SelectItem value="neutral">Neutral</SelectItem>
            <SelectItem value="negative">Negative</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Leads List */}
      {filteredLeads.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Users className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No leads found</h3>
            <p className="text-muted-foreground text-center">
              {searchTerm || filterQualified !== "all" || filterSentiment !== "all"
                ? "Try adjusting your filters"
                : "Leads will appear here when conversations are analyzed"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredLeads.map((lead) => (
            <Card key={lead.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex flex-col lg:flex-row lg:items-start gap-4">
                  <Avatar className="h-12 w-12">
                    <AvatarFallback>
                      <Users className="h-6 w-6" />
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 space-y-3">
                    {/* Header */}
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-semibold">
                            {lead.sender_id ? `User ${lead.sender_id.slice(-8)}` : "Anonymous User"}
                          </h3>
                          {lead.qualified_lead && <Badge className="bg-green-100 text-green-800">Qualified</Badge>}
                          {lead.lead_quality_score && (
                            <Badge className={getQualityColor(lead.lead_quality_score)}>
                              <Star className="h-3 w-3 mr-1" />
                              {lead.lead_quality_score}/10
                            </Badge>
                          )}
                          {lead.sentiment && (
                            <Badge className={getSentimentColor(lead.sentiment)}>{lead.sentiment}</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">Session: {lead.session_id}</p>
                      </div>
                      <Link href={`/dashboard/leads/${lead.id}`}>
                        <Button variant="outline" size="sm">
                          View Details
                        </Button>
                      </Link>
                    </div>

                    {/* Contact Info */}
                    {(lead.email_address || lead.phone) && (
                      <div className="flex flex-wrap items-center gap-4 text-sm">
                        {lead.email_address && (
                          <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4 text-muted-foreground" />
                            <span>{lead.email_address}</span>
                          </div>
                        )}
                        {lead.phone && (
                          <div className="flex items-center gap-2">
                            <Phone className="h-4 w-4 text-muted-foreground" />
                            <span>{lead.phone}</span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Summary */}
                    {lead.summary && <p className="text-sm text-muted-foreground line-clamp-2">{lead.summary}</p>}

                    {/* Pain Points */}
                    {lead.pain_points && lead.pain_points.length > 0 && (
                      <div className="flex flex-wrap items-center gap-2">
                        <AlertCircle className="h-4 w-4 text-orange-600" />
                        <span className="text-sm font-medium">Pain Points:</span>
                        <div className="flex flex-wrap gap-1">
                          {lead.pain_points.slice(0, 3).map((point, idx) => (
                            <Badge key={idx} variant="outline" className="text-xs">
                              {point}
                            </Badge>
                          ))}
                          {lead.pain_points.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{lead.pain_points.length - 3} more
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Intent & Follow-up */}
                    <div className="flex flex-wrap items-center gap-6 text-xs text-muted-foreground">
                      {lead.customer_intent && (
                        <div className="flex items-center gap-2">
                          <TrendingUp className="h-3 w-3" />
                          <span>Intent: {lead.customer_intent}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <MessageSquare className="h-3 w-3" />
                        <span>{lead.message_count} messages</span>
                      </div>
                      <span>{formatDistanceToNow(new Date(lead.created_at), { addSuffix: true })}</span>
                    </div>

                    {/* Recommended Follow-up */}
                    {lead.recommended_followup && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                        <p className="text-sm text-blue-900">
                          <span className="font-medium">Recommended: </span>
                          {lead.recommended_followup}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
