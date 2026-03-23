import Link from "next/link"
import { MessageSquare } from "lucide-react"

export const metadata = {
  title: "Terms of Service – ChatFlow",
  description: "The terms governing your use of the ChatFlow platform.",
}

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link href="/" className="flex items-center gap-2 w-fit">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <MessageSquare className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold">ChatFlow</span>
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 max-w-3xl">
        <h1 className="text-4xl font-bold mb-2">Terms of Service</h1>
        <p className="text-muted-foreground mb-8">Last updated: March 23, 2026</p>

        <div className="prose prose-gray max-w-none space-y-8 text-sm leading-relaxed">

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">1. Acceptance of Terms</h2>
            <p>
              By creating an account or using ChatFlow ("the Service"), you agree to be bound by these Terms of Service
              ("Terms"). If you do not agree, do not use the Service. ChatFlow reserves the right to update these Terms
              at any time; continued use after changes constitutes acceptance.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">2. Description of Service</h2>
            <p>
              ChatFlow is a SaaS platform that allows businesses to create AI-powered chatbots and connect them to
              Facebook Messenger. The platform provides tools to configure chatbot behavior, feed business information,
              manage conversations, and view analytics.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">3. Account Registration</h2>
            <p>
              You must provide accurate, complete, and current information when registering. You are responsible for
              maintaining the confidentiality of your account credentials and for all activities that occur under your
              account. Notify us immediately of any unauthorized access.
            </p>
            <p>
              You must be at least 18 years old to use the Service. By registering, you represent that you meet this
              requirement.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">4. Facebook Messenger Platform</h2>
            <p>
              Using ChatFlow's Messenger integration requires you to comply with{" "}
              <a
                href="https://developers.facebook.com/policy/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary underline"
              >
                Meta's Platform Terms
              </a>
              ,{" "}
              <a
                href="https://developers.facebook.com/devpolicy/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary underline"
              >
                Developer Policies
              </a>
              , and{" "}
              <a
                href="https://www.facebook.com/policies/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary underline"
              >
                Facebook's Community Standards
              </a>
              . You are solely responsible for ensuring your chatbot's use of the Messenger Platform is compliant with
              Meta's policies.
            </p>
            <p>You agree not to use ChatFlow to:</p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>Send spam, unsolicited messages, or bulk promotional content</li>
              <li>Impersonate another person or business</li>
              <li>Collect user data beyond what Meta's policies permit</li>
              <li>Violate any applicable laws or regulations</li>
              <li>Engage in deceptive or misleading practices</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">5. Acceptable Use</h2>
            <p>You agree to use the Service only for lawful purposes. You must not:</p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>Use the Service to transmit harmful, abusive, hateful, or illegal content</li>
              <li>Attempt to gain unauthorized access to other users' accounts or data</li>
              <li>Reverse engineer, decompile, or attempt to extract the source code of the Service</li>
              <li>Use automated tools to scrape or overload the platform</li>
              <li>Resell or sublicense access to the Service without written permission</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">6. Your Content and Data</h2>
            <p>
              You retain ownership of the business information, system prompts, and other content you provide to
              ChatFlow ("Your Content"). By using the Service, you grant ChatFlow a limited license to process Your
              Content solely to operate and provide the Service.
            </p>
            <p>
              You are responsible for the accuracy and legality of Your Content and the chatbot responses generated
              based on it. ChatFlow is not liable for errors, inaccuracies, or harm arising from AI-generated responses.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">7. AI-Generated Content Disclaimer</h2>
            <p>
              ChatFlow uses large language models (e.g., OpenAI GPT) to generate chatbot responses. AI-generated content
              may sometimes be inaccurate, incomplete, or inappropriate. You are responsible for configuring your chatbot
              appropriately and monitoring its behavior. ChatFlow makes no warranties about the accuracy of AI-generated
              responses.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">8. Intellectual Property</h2>
            <p>
              The ChatFlow name, logo, platform code, and all related intellectual property are owned by ChatFlow and
              may not be used without written permission. We respect the intellectual property rights of others and
              expect users to do the same.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">9. Termination</h2>
            <p>
              We reserve the right to suspend or terminate your account at any time for violations of these Terms,
              Meta's Platform Policies, or any applicable law. You may terminate your account at any time by contacting
              us. Upon termination, your access to the Service will cease and your data will be deleted within 30 days.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">10. Disclaimer of Warranties</h2>
            <p>
              THE SERVICE IS PROVIDED "AS IS" WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING WARRANTIES
              OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, OR NON-INFRINGEMENT. CHATFLOW DOES NOT WARRANT THAT
              THE SERVICE WILL BE UNINTERRUPTED, ERROR-FREE, OR SECURE.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">11. Limitation of Liability</h2>
            <p>
              TO THE MAXIMUM EXTENT PERMITTED BY LAW, CHATFLOW SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL,
              SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING LOSS OF PROFITS, DATA, OR BUSINESS, ARISING FROM
              YOUR USE OF THE SERVICE, EVEN IF CHATFLOW HAS BEEN ADVISED OF THE POSSIBILITY OF SUCH DAMAGES.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">12. Governing Law</h2>
            <p>
              These Terms are governed by applicable law. Any disputes shall be resolved through binding arbitration or
              in the courts of the jurisdiction where ChatFlow operates, unless prohibited by applicable law.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">13. Contact</h2>
            <p>For questions about these Terms, contact us at:</p>
            <p>
              <strong>ChatFlow</strong>
              <br />
              Email: legal@chatflow.app
            </p>
          </section>
        </div>

        <div className="mt-12 pt-8 border-t border-border text-sm text-muted-foreground">
          <Link href="/privacy-policy" className="text-primary underline mr-6">
            Privacy Policy
          </Link>
          <Link href="/" className="text-primary underline">
            Back to Home
          </Link>
        </div>
      </main>
    </div>
  )
}
