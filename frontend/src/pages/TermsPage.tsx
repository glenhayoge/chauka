import Navbar from '../components/layout/Navbar'
import Footer from '../components/layout/Footer'

export default function TermsPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="flex-1 px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <p className="text-sm font-medium text-gray-900 mb-1">Terms and conditions</p>
          <p className="text-xs text-gray-400 mb-8">Last updated March 2026</p>

          <div className="space-y-6 text-sm text-gray-600 leading-relaxed">
            <Section title="1. Acceptance of terms">
              By accessing and using Chauka, you agree to be bound by these terms.
              If you do not agree, do not use the platform.
            </Section>

            <Section title="2. Description of service">
              Chauka is an open-source monitoring, evaluation and learning (MEL) information
              system designed to help development organisations plan, monitor, and evaluate
              projects using logical frameworks. The service is provided as-is.
            </Section>

            <Section title="3. User accounts">
              You are responsible for maintaining the confidentiality of your account
              credentials. You agree to provide accurate information during registration
              and to keep your account details current.
            </Section>

            <Section title="4. Acceptable use">
              <p className="mb-2">You agree not to:</p>
              <ul className="list-disc pl-5 space-y-1 text-gray-500">
                <li>Use the service for any unlawful purpose</li>
                <li>Attempt to gain unauthorized access to other users' data</li>
                <li>Upload malicious content or interfere with the platform</li>
                <li>Share your account credentials with unauthorized parties</li>
              </ul>
            </Section>

            <Section title="5. Data ownership">
              You retain ownership of all data you enter into Chauka. The platform
              does not claim intellectual property rights over your logframes, indicators,
              or project data.
            </Section>

            <Section title="6. Limitation of liability">
              Chauka is provided "as is" without warranties of any kind. We are not
              liable for data loss, service interruptions, or damages arising from use
              of this platform.
            </Section>

            <Section title="7. Changes to terms">
              We may update these terms from time to time. Continued use after changes
              constitutes acceptance of the updated terms.
            </Section>

            <Section title="8. Contact">
              For questions about these terms, contact the Chauka project maintainers
              through the project's official channels.
            </Section>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-sm text-gray-900 mb-1">{title}</p>
      <div className="text-sm text-gray-600">{children}</div>
    </div>
  )
}
