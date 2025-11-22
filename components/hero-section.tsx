import { Button } from "@/components/ui/button"
import { ArrowRight, Play } from "lucide-react"

export function HeroSection() {
  return (
    <section className="relative overflow-hidden py-20 sm:py-32">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-background to-background" />

      <div className="container relative mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <h1 className="text-4xl font-bold tracking-tight text-balance sm:text-6xl lg:text-7xl">
            Build AI chatbots
            <br />
            <span className="text-primary">that actually work</span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-muted-foreground text-pretty">
            Create intelligent AI chatbots for Facebook Messenger that understand your customers, provide instant
            support, and drive conversions 24/7.
          </p>

          <div className="mt-10 flex items-center justify-center gap-4">
            <Button size="lg" className="h-12 px-8">
              Get Started Free
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <Button variant="outline" size="lg" className="h-12 px-8 bg-transparent">
              <Play className="mr-2 h-4 w-4" />
              Watch Demo
            </Button>
          </div>

          <div className="mt-12">
            <p className="text-sm text-muted-foreground">Trusted by AI teams at</p>
            <div className="mt-4 flex items-center justify-center gap-8 opacity-60">
              <div className="text-lg font-semibold">Shopify</div>
              <div className="text-lg font-semibold">Stripe</div>
              <div className="text-lg font-semibold">Notion</div>
              <div className="text-lg font-semibold">Vercel</div>
              <div className="text-lg font-semibold">OpenAI</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
