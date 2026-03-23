import Link from "next/link"
import { MessageSquare } from "lucide-react"

export const metadata = {
  title: "Privacy Policy – ChatFlow",
  description: "How ChatFlow collects, uses, and protects your data.",
}

export default function PrivacyPolicyPage() {
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
        <h1 className="text-4xl font-bold mb-2">Privacy Policy</h1>
        <p className="text-muted-foreground mb-8">Last updated: March 23, 2026</p>

        <div className="prose prose-gray max-w-none space-y-8 text-sm leading-relaxed">

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">1. Introduction</h2>
            <p>
              ChatFlow ("we", "us", or "our") operates a SaaS platform that allows businesses to build and deploy
              AI-powered chatbots connected to Facebook Messenger. This Privacy Policy explains how we collect, use,
              disclose, and safeguard your information when you use our platform, including any data processed on your
              behalf through the Facebook Messenger Platform.
            </p>
            <p>
              By using ChatFlow, you agree to the collection and use of information in accordance with this policy.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">2. Information We Collect</h2>
            <h3 className="font-medium">2.1 Account Information</h3>
            <p>
              When you register for ChatFlow, we collect your email address, full name, and company name. This
              information is used solely to create and maintain your account.
            </p>

            <h3 className="font-medium">2.2 Chatbot Configuration Data</h3>
            <p>
              We store the configuration you provide for your chatbots, including system prompts, AI model preferences,
              and business information you enter to train your bot.
            </p>

            <h3 className="font-medium">2.3 Facebook Messenger Data</h3>
            <p>
              When you connect a Facebook Page to ChatFlow, we process the following data through the Messenger Platform
              on your behalf:
            </p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>Messenger user IDs of people who message your Facebook Page</li>
              <li>Message content sent by users to your Page</li>
              <li>Timestamps of messages</li>
              <li>Your Facebook Page ID and Page Access Token (stored encrypted)</li>
            </ul>
            <p>
              We do not collect Facebook users' names, profile pictures, or any other profile information beyond their
              Messenger-scoped user ID.
            </p>

            <h3 className="font-medium">2.4 Usage Data</h3>
            <p>
              We automatically collect anonymized usage analytics (page views, feature usage) to improve the platform.
              This data does not identify individual users.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">3. How We Use Your Information</h2>
            <p>We use the information we collect to:</p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>Provide and operate the ChatFlow platform</li>
              <li>Process and respond to Facebook Messenger messages on behalf of your business</li>
              <li>Generate AI responses using the AI model you select</li>
              <li>Store conversation history so your chatbot has context</li>
              <li>Display analytics and conversation insights in your dashboard</li>
              <li>Send transactional emails (e.g., account verification, password reset)</li>
              <li>Improve our services and fix bugs</li>
            </ul>
            <p>
              We do not sell your data or your end users' data to any third party. We do not use Messenger conversation
              data for advertising purposes.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">4. Facebook Platform Data</h2>
            <p>
              ChatFlow integrates with the Meta (Facebook) Messenger Platform. Our use of data received from Facebook
              APIs complies with{" "}
              <a
                href="https://developers.facebook.com/policy/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary underline"
              >
                Meta's Platform Terms
              </a>{" "}
              and{" "}
              <a
                href="https://developers.facebook.com/devpolicy/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary underline"
              >
                Developer Policies
              </a>
              .
            </p>
            <p>Specifically:</p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>We only request the minimum permissions necessary: <code>pages_messaging</code></li>
              <li>We do not share Messenger conversation data with third parties except the AI provider (OpenAI) to generate responses</li>
              <li>Conversation data is stored only as long as necessary to provide the service</li>
              <li>
                Users who message your Facebook Page can request deletion of their conversation data by contacting you
                directly; as the platform operator you can delete any conversation from your ChatFlow dashboard
              </li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">5. Data Sharing and Third Parties</h2>
            <p>We share your data only with the following service providers, strictly to operate our platform:</p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>
                <strong>Supabase</strong> – Database and authentication hosting. Data stored in Supabase is encrypted at
                rest and in transit.
              </li>
              <li>
                <strong>OpenAI</strong> – AI response generation. Message content is sent to OpenAI's API to generate
                chatbot replies. OpenAI's usage policies govern their data handling.
              </li>
              <li>
                <strong>Vercel</strong> – Application hosting and infrastructure.
              </li>
            </ul>
            <p>
              We do not sell, rent, or trade your personal information or your end users' data to any third parties.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">6. Data Retention</h2>
            <p>
              We retain your account data and chatbot configurations for as long as your account is active. Conversation
              history is retained to provide your chatbot with context and for analytics purposes.
            </p>
            <p>
              Upon account deletion, we will delete your account data, chatbot configurations, and associated
              conversation history within 30 days.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">7. Data Security</h2>
            <p>
              We implement industry-standard security measures including encryption in transit (TLS), encryption at rest,
              and Row Level Security (RLS) in our database to ensure each user can only access their own data. Facebook
              Page Access Tokens are stored encrypted.
            </p>
            <p>
              However, no method of transmission over the Internet or electronic storage is 100% secure. While we strive
              to use commercially acceptable means to protect your data, we cannot guarantee absolute security.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">8. Your Rights</h2>
            <p>
              Depending on your location, you may have rights to access, correct, or delete your personal data. To
              exercise these rights, contact us at the email below. We will respond within 30 days.
            </p>
            <p>
              If you are located in the European Economic Area, you have rights under the GDPR including the right to
              data portability and the right to lodge a complaint with a supervisory authority.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">9. Children's Privacy</h2>
            <p>
              ChatFlow is not directed to children under 13. We do not knowingly collect personal information from
              children under 13. If we learn that we have collected such information, we will delete it promptly.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">10. Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. We will notify you of significant changes by email or
              by posting a prominent notice on our platform. The "Last updated" date at the top reflects the most recent
              revision.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">11. Contact Us</h2>
            <p>
              If you have questions about this Privacy Policy or our data practices, please contact us at:
            </p>
            <p>
              <strong>ChatFlow</strong>
              <br />
              Email: privacy@chatflow.app
            </p>
          </section>
        </div>

        <div className="mt-12 pt-8 border-t border-border text-sm text-muted-foreground">
          <Link href="/terms-of-service" className="text-primary underline mr-6">
            Terms of Service
          </Link>
          <Link href="/" className="text-primary underline">
            Back to Home
          </Link>
        </div>
      </main>
    </div>
  )
}
