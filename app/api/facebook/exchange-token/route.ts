import { NextRequest, NextResponse } from "next/server"

/**
 * Exchange short-lived Facebook page tokens for long-lived ones.
 *
 * Short-lived tokens expire in ~1 hour. Long-lived page tokens from
 * the Graph API are effectively permanent (they don't expire unless
 * the user de-authorizes the app or changes their password).
 */
export async function POST(request: NextRequest) {
  try {
    const { pages } = await request.json()

    if (!pages || !Array.isArray(pages)) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 })
    }

    const appId = process.env.NEXT_PUBLIC_FACEBOOK_APP_ID
    const appSecret = process.env.FACEBOOK_APP_SECRET

    // If we don't have app secret, return pages as-is (short-lived tokens still work)
    if (!appId || !appSecret) {
      return NextResponse.json({
        pages: pages.map((p: any) => ({
          id: p.id,
          name: p.name,
          category: p.category,
          access_token: p.access_token,
          picture: p.picture_url ? { data: { url: p.picture_url } } : undefined,
        })),
      })
    }

    // Exchange each page token for a long-lived one
    const longLivedPages = await Promise.all(
      pages.map(async (page: any) => {
        try {
          const url = new URL("https://graph.facebook.com/v21.0/oauth/access_token")
          url.searchParams.set("grant_type", "fb_exchange_token")
          url.searchParams.set("client_id", appId)
          url.searchParams.set("client_secret", appSecret)
          url.searchParams.set("fb_exchange_token", page.access_token)

          const res = await fetch(url.toString())
          const data = await res.json()

          return {
            id: page.id,
            name: page.name,
            category: page.category,
            access_token: data.access_token || page.access_token,
            picture: page.picture_url ? { data: { url: page.picture_url } } : undefined,
          }
        } catch {
          // If exchange fails for a specific page, return original token
          return {
            id: page.id,
            name: page.name,
            category: page.category,
            access_token: page.access_token,
            picture: page.picture_url ? { data: { url: page.picture_url } } : undefined,
          }
        }
      })
    )

    return NextResponse.json({ pages: longLivedPages })
  } catch (error) {
    console.error("Token exchange error:", error)
    return NextResponse.json({ error: "Token exchange failed" }, { status: 500 })
  }
}
