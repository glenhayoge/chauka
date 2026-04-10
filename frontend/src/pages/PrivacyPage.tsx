import Navbar from '../components/layout/Navbar'
import Footer from '../components/layout/Footer'
import PageTitle from '../components/PageTitle'

export default function PrivacyPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <PageTitle title="Privacy Policy" />
      <Navbar />
      <div className="flex-1 px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <p className="text-xl font-bold text-foreground mb-1">Privacy policy</p>
          <p className="text-xs text-muted-foreground mb-8">Last updated March 2026</p>
          <div className="space-y-6 text-sm text-muted-foreground leading-relaxed">
            <Section title="1. Information we collect">
              <p className="mb-2">When you use Chauka, we collect:</p>
              <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
                <li>Account information — name, email, username, password</li>
                <li>Organisation details — name, country, type, sector</li>
                <li>Project data — logframes, results, indicators, activities, budgets, monitoring data</li>
                <li>Usage data — login timestamps and basic activity logs</li>
              </ul>
            </Section>
            <Section title="2. How we use your information">
              <p className="mb-2">Your information is used to:</p>
              <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
                <li>Provide and maintain the platform</li>
                <li>Authenticate your identity and manage access</li>
                <li>Enable collaboration with your team</li>
                <li>Generate reports and exports you request</li>
              </ul>
            </Section>

            <Section title="3. Data sharing">
              We do not sell or share your personal data with third parties. Your project
              data is only accessible to members of your organisation as configured by
              administrators.
            </Section>

            <Section title="4. Data storage and security">
              Your data is stored securely with encryption in transit. We implement
              appropriate technical measures to protect against unauthorized access,
              alteration, or destruction.
            </Section>

            <Section title="5. Your rights">
              <p className="mb-2">You have the right to:</p>
              <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
                <li>Access and export your data at any time</li>
                <li>Update or correct your personal information</li>
                <li>Request deletion of your account and data</li>
                <li>Withdraw consent for data processing</li>
              </ul>
            </Section>

            <Section title="6. Open source">
              Chauka is open-source software. Self-hosted deployments are subject to
              the data practices of the hosting organisation rather than this policy.
            </Section>

            <Section title="7. Changes to this policy">
              We may update this policy periodically. We will notify users of significant
              changes through the platform.
            </Section>

            <Section title="8. Contact">
              For privacy-related inquiries, contact the Chauka project maintainers
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
      <p className="text-sm text-foreground mb-1">{title}</p>
      <div className="text-sm text-muted-foreground">{children}</div>
    </div>
  )
}
