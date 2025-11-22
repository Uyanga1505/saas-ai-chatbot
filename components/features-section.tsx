import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { MessageSquare, Zap, Users, BarChart3, Shield, Puzzle } from "lucide-react"

const features = [
  {
    icon: MessageSquare,
    title: "Natural Conversations",
    description: "Advanced AI that understands context and maintains engaging conversations with your customers.",
  },
  {
    icon: Zap,
    title: "Instant Setup",
    description: "Deploy your chatbot to Messenger in minutes with our intuitive drag-and-drop builder.",
  },
  {
    icon: Users,
    title: "Multi-Agent Support",
    description: "Handle thousands of conversations simultaneously with intelligent routing and escalation.",
  },
  {
    icon: BarChart3,
    title: "Analytics & Insights",
    description: "Track performance, user satisfaction, and conversion rates with detailed analytics.",
  },
  {
    icon: Shield,
    title: "Enterprise Security",
    description: "Bank-grade security with SOC 2 compliance and end-to-end encryption.",
  },
  {
    icon: Puzzle,
    title: "Easy Integration",
    description: "Connect with your existing tools via webhooks, APIs, and pre-built integrations.",
  },
]

export function FeaturesSection() {
  return (
    <section id="features" className="py-20 sm:py-32">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl text-balance">
            Everything you need to build amazing chatbots
          </h2>
          <p className="mt-4 text-lg text-muted-foreground text-pretty">
            From simple FAQ bots to complex conversational AI, we've got you covered.
          </p>
        </div>

        <div className="mx-auto mt-16 grid max-w-6xl grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, index) => (
            <Card key={index} className="border-border/50 bg-card/50 backdrop-blur">
              <CardHeader>
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <feature.icon className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-xl">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base leading-relaxed">{feature.description}</CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
