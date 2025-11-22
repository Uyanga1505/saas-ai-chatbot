import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MessageCircle, User, Bot } from "lucide-react"

export function DemoSection() {
  return (
    <section className="py-20 sm:py-32 bg-muted/30">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl text-balance">See it in action</h2>
          <p className="mt-4 text-lg text-muted-foreground text-pretty">
            Watch how our AI chatbot handles real customer conversations
          </p>
        </div>

        <div className="mx-auto mt-16 max-w-4xl">
          <Card className="overflow-hidden border-border/50 bg-card/80 backdrop-blur">
            <CardContent className="p-0">
              <div className="flex h-12 items-center justify-between border-b border-border/50 px-4">
                <div className="flex items-center gap-2">
                  <MessageCircle className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">Messenger Chat</span>
                </div>
                <Badge variant="secondary" className="text-xs">
                  Live Demo
                </Badge>
              </div>

              <div className="space-y-4 p-6">
                <div className="flex items-start gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                    <User className="h-4 w-4" />
                  </div>
                  <div className="flex-1">
                    <div className="rounded-lg bg-muted p-3">
                      <p className="text-sm">Hi! I'm looking for help with my recent order #12345</p>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">2:34 PM</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary">
                    <Bot className="h-4 w-4 text-primary-foreground" />
                  </div>
                  <div className="flex-1">
                    <div className="rounded-lg bg-primary/10 p-3">
                      <p className="text-sm">
                        I'd be happy to help you with order #12345! Let me pull up your details. I can see your order
                        was shipped yesterday and should arrive by tomorrow. Would you like tracking information?
                      </p>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">2:34 PM</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                    <User className="h-4 w-4" />
                  </div>
                  <div className="flex-1">
                    <div className="rounded-lg bg-muted p-3">
                      <p className="text-sm">Yes please! That would be great.</p>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">2:35 PM</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary">
                    <Bot className="h-4 w-4 text-primary-foreground" />
                  </div>
                  <div className="flex-1">
                    <div className="rounded-lg bg-primary/10 p-3">
                      <p className="text-sm">
                        Here's your tracking link: track.example.com/12345. Your package is currently in transit and
                        will be delivered tomorrow between 9 AM - 5 PM. Is there anything else I can help you with?
                      </p>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">2:35 PM</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  )
}
