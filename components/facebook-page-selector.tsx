"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Facebook, Check, RefreshCw, LogOut, AlertCircle } from "lucide-react"

declare global {
  interface Window {
    FB: any
    fbAsyncInit: () => void
  }
}

export interface FacebookPage {
  id: string
  name: string
  category: string
  access_token: string
  picture?: { data?: { url?: string } }
}

interface FacebookPageSelectorProps {
  onPageSelected: (page: { page_id: string; page_name: string; access_token: string }) => void
  selectedPageId?: string
  className?: string
}

export function FacebookPageSelector({
  onPageSelected,
  selectedPageId,
  className,
}: FacebookPageSelectorProps) {
  const [sdkLoaded, setSdkLoaded] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [pages, setPages] = useState<FacebookPage[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [userName, setUserName] = useState<string | null>(null)

  const FB_APP_ID = process.env.NEXT_PUBLIC_FACEBOOK_APP_ID

  // Load Facebook SDK
  useEffect(() => {
    if (!FB_APP_ID) {
      setError("Facebook App ID not configured. Set NEXT_PUBLIC_FACEBOOK_APP_ID in your environment variables.")
      return
    }

    if (window.FB) {
      setSdkLoaded(true)
      return
    }

    window.fbAsyncInit = () => {
      window.FB.init({
        appId: FB_APP_ID,
        cookie: true,
        xfbml: false,
        version: "v21.0",
      })
      setSdkLoaded(true)
    }

    // Load SDK script
    if (!document.getElementById("facebook-jssdk")) {
      const script = document.createElement("script")
      script.id = "facebook-jssdk"
      script.src = "https://connect.facebook.net/en_US/sdk.js"
      script.async = true
      script.defer = true
      document.body.appendChild(script)
    }
  }, [FB_APP_ID])

  // Check login status when SDK loads
  useEffect(() => {
    if (!sdkLoaded) return
    window.FB.getLoginStatus((response: any) => {
      if (response.status === "connected") {
        setIsLoggedIn(true)
        fetchPages()
        fetchUserName()
      }
    })
  }, [sdkLoaded])

  const fetchUserName = () => {
    window.FB.api("/me", { fields: "name" }, (response: any) => {
      if (response?.name) setUserName(response.name)
    })
  }

  const fetchPages = useCallback(() => {
    setLoading(true)
    setError(null)

    window.FB.api(
      "/me/accounts",
      { fields: "id,name,category,access_token,picture{url}" },
      async (response: any) => {
        if (response.error) {
          setError(response.error.message || "Failed to fetch pages")
          setLoading(false)
          return
        }

        const fbPages: FacebookPage[] = response.data || []

        if (fbPages.length === 0) {
          setError("No Facebook Pages found. Make sure you're an admin of at least one Facebook Page.")
          setLoading(false)
          return
        }

        // Exchange short-lived tokens for long-lived page tokens
        try {
          const res = await fetch("/api/facebook/exchange-token", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              pages: fbPages.map((p) => ({
                id: p.id,
                name: p.name,
                category: p.category,
                access_token: p.access_token,
                picture_url: p.picture?.data?.url,
              })),
            }),
          })

          if (res.ok) {
            const { pages: longLivedPages } = await res.json()
            setPages(longLivedPages)
          } else {
            // If token exchange fails, use original tokens (they'll still work, just expire sooner)
            setPages(fbPages)
          }
        } catch {
          // Fallback: use the short-lived page tokens
          setPages(fbPages)
        }

        setLoading(false)
      }
    )
  }, [])

  const handleLogin = () => {
    setLoading(true)
    setError(null)

    window.FB.login(
      (response: any) => {
        if (response.authResponse) {
          setIsLoggedIn(true)
          fetchPages()
          fetchUserName()
        } else {
          setError("Facebook login was cancelled")
          setLoading(false)
        }
      },
      {
        scope: "pages_show_list,pages_messaging,pages_read_engagement,pages_manage_metadata",
        return_scopes: true,
      }
    )
  }

  const handleLogout = () => {
    window.FB.logout(() => {
      setIsLoggedIn(false)
      setPages([])
      setUserName(null)
    })
  }

  const handleSelectPage = (page: FacebookPage) => {
    onPageSelected({
      page_id: page.id,
      page_name: page.name,
      access_token: page.access_token,
    })
  }

  if (!FB_APP_ID) {
    return (
      <div className={`rounded-lg border border-yellow-200 bg-yellow-50 p-4 ${className}`}>
        <div className="flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-yellow-900">Facebook App ID not configured</p>
            <p className="text-sm text-yellow-700 mt-1">
              Add <code className="bg-yellow-100 px-1 rounded">NEXT_PUBLIC_FACEBOOK_APP_ID</code> to your Vercel
              environment variables to enable Facebook Page connection.
            </p>
          </div>
        </div>
      </div>
    )
  }

  // Not logged in — show login button
  if (!isLoggedIn) {
    return (
      <div className={`space-y-3 ${className}`}>
        <Button
          type="button"
          onClick={handleLogin}
          disabled={!sdkLoaded || loading}
          className="w-full gap-2 bg-[#1877F2] hover:bg-[#166FE5] text-white"
        >
          <Facebook className="h-5 w-5" />
          {loading ? "Connecting..." : "Connect with Facebook"}
        </Button>
        {error && (
          <p className="text-sm text-red-600">{error}</p>
        )}
        <p className="text-xs text-muted-foreground text-center">
          We'll request permission to see your Pages and send messages on their behalf.
        </p>
      </div>
    )
  }

  // Logged in — show pages
  return (
    <div className={`space-y-4 ${className}`}>
      {/* Connected user header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm">
          <div className="h-2 w-2 rounded-full bg-green-500" />
          <span className="text-muted-foreground">
            Connected as <span className="font-medium text-foreground">{userName || "Facebook User"}</span>
          </span>
        </div>
        <div className="flex gap-2">
          <Button type="button" variant="ghost" size="sm" onClick={fetchPages} disabled={loading}>
            <RefreshCw className={`h-3 w-3 ${loading ? "animate-spin" : ""}`} />
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={handleLogout}>
            <LogOut className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}

      {loading ? (
        <div className="text-center py-6 text-sm text-muted-foreground">Loading your pages...</div>
      ) : pages.length === 0 ? (
        <div className="text-center py-6 text-sm text-muted-foreground">
          No pages found. Make sure you are an admin of a Facebook Page.
        </div>
      ) : (
        <div className="space-y-2">
          <p className="text-sm font-medium">Select a Facebook Page:</p>
          {pages.map((page) => {
            const isSelected = selectedPageId === page.id
            return (
              <Card
                key={page.id}
                className={`cursor-pointer transition-all hover:shadow-md ${
                  isSelected ? "ring-2 ring-primary border-primary" : ""
                }`}
                onClick={() => handleSelectPage(page)}
              >
                <CardContent className="flex items-center gap-3 p-3">
                  {page.picture?.data?.url ? (
                    <img
                      src={page.picture.data.url}
                      alt={page.name}
                      className="h-10 w-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                      <Facebook className="h-5 w-5 text-blue-600" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{page.name}</p>
                    <p className="text-xs text-muted-foreground">
                      ID: {page.id} · {page.category || "Page"}
                    </p>
                  </div>
                  {isSelected ? (
                    <Badge className="bg-green-100 text-green-800 gap-1">
                      <Check className="h-3 w-3" />
                      Connected
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-xs">Select</Badge>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
