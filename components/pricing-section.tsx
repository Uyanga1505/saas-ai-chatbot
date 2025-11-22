import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Check } from "lucide-react"

const plans = [
  {
    name: "Starter",
    price: "$29",
    description: "Perfect for small businesses getting started",
    features: ["1 chatbot", "1,000 conversations/month", "Basic analytics", "Email support", "Messenger integration"],
    popular: false,
  },
  {
    name: "Professional",
    price: "$99",
    description: "For growing businesses with higher volume",
    features: [
      "5 chatbots",
      "10,000 conversations/month",
      "Advanced analytics",
      "Priority support",
      "All integrations",
      "Custom branding",
      "A/B testing",
    ],
    popular: true,
  },
  {
    name: "Enterprise",
    price: "Custom",
    description: "For large organizations with custom needs",
    features: [
      "Unlimited chatbots",
      "Unlimited conversations",
      "White-label solution",
      "Dedicated support",
      "Custom integrations",
      "SLA guarantee",
      "Advanced security",
    ],
    popular: false,
  },
]

export function PricingSection() {
  return (
    <section id="pricing" className="py-20 sm:py-32">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl text-balance">Simple, transparent pricing</h2>
          <p className="mt-4 text-lg text-muted-foreground text-pretty">
            Choose the plan that's right for your business. All plans include a 14-day free trial.
          </p>
        </div>

        <div className="mx-auto mt-16 grid max-w-5xl grid-cols-1 gap-8 lg:grid-cols-3">
          {plans.map((plan, index) => (
            <Card
              key={index}
              className={`relative ${plan.popular ? "border-primary shadow-lg scale-105" : "border-border/50"}`}
            >
              {plan.popular && (
                <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground">
                  Most Popular
                </Badge>
              )}
              <CardHeader className="text-center">
                <CardTitle className="text-2xl">{plan.name}</CardTitle>
                <div className="mt-4">
                  <span className="text-4xl font-bold">{plan.price}</span>
                  {plan.price !== "Custom" && <span className="text-muted-foreground">/month</span>}
                </div>
                <CardDescription className="mt-2">{plan.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-center gap-3">
                      <Check className="h-4 w-4 text-primary" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button className="mt-8 w-full" variant={plan.popular ? "default" : "outline"}>
                  {plan.price === "Custom" ? "Contact Sales" : "Start Free Trial"}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
