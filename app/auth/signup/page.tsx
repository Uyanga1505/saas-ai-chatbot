"use client"

import type React from "react"

import { signUp } from "@/app/actions/auth-actions"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"

export default function SignupPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [fullName, setFullName] = useState("")
  const [companyName, setCompanyName] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const result = await signUp(email, password, fullName)

      if (result.error) {
        setError(result.error)
      } else if (result.isAutoConfirmed) {
        // User was auto-confirmed, go straight to dashboard
        router.push("/dashboard")
      } else {
        router.push("/auth/verify-email")
      }
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Create your account</CardTitle>
          <CardDescription>Start building AI chatbots for Messenger</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSignup} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name</Label>
              <Input
                id="fullName"
                type="text"
                placeholder="Enter your full name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="companyName">Company Name (Optional)</Label>
              <Input
                id="companyName"
                type="text"
                placeholder="Enter your company name"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Create a password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            {error && (
              <div className="text-sm bg-red-50 border border-red-200 p-4 rounded-md space-y-2">
                <p className="text-red-600 font-medium">{error}</p>
                {error.includes("Missing Supabase environment variables") && (
                  <div className="text-red-700 text-xs space-y-2 mt-3 pt-3 border-t border-red-200">
                    <p className="font-semibold">To use your Supabase database in v0 preview:</p>
                    <ol className="list-decimal list-inside space-y-1 pl-2">
                      <li>
                        Open <code className="bg-red-100 px-1 py-0.5 rounded">lib/supabase/config.ts</code>
                      </li>
                      <li>Uncomment the TEMP_SUPABASE_URL and TEMP_SUPABASE_ANON_KEY lines</li>
                      <li>Replace with your actual Supabase credentials</li>
                      <li>Comment out the process.env lines</li>
                    </ol>
                    <p className="mt-2 font-semibold">Find your credentials at:</p>
                    <p className="break-all">supabase.com/dashboard → Your Project → Settings → API</p>
                  </div>
                )}
              </div>
            )}
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Creating account..." : "Create account"}
            </Button>
          </form>
          <div className="mt-6 text-center text-sm">
            Already have an account?{" "}
            <Link href="/auth/login" className="text-blue-600 hover:underline">
              Sign in
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
