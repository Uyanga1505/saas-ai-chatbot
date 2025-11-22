import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Mail } from "lucide-react"

export default function VerifyEmailPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
            <Mail className="h-6 w-6 text-blue-600" />
          </div>
          <CardTitle className="text-2xl font-bold">Check your email</CardTitle>
          <CardDescription>We've sent you a verification link to complete your registration</CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <p className="text-sm text-muted-foreground">
            Please check your email and click the verification link to activate your account. You can close this window
            once you've verified your email.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
