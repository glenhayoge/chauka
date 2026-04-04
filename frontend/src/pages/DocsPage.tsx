import Navbar from '../components/layout/Navbar'
import Footer from '../components/layout/Footer'

export default function DocsPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="flex-1 px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <p className="text-sm font-medium text-foreground mb-4">Documentation</p>

          <div className="space-y-6 text-sm text-muted-foreground leading-relaxed">
            <Section title="Getting started">
              <ol className="list-decimal pl-5 space-y-1 text-muted-foreground">
                <li>Create an account and set up your organisation</li>
                <li>Create a program or standalone project</li>
                <li>Create a logframe with reporting periods and currency</li>
                <li>Build your results hierarchy: Goal, Outcomes, Outputs</li>
                <li>Add activities under Outputs with budgets and resources</li>
                <li>Set indicators with baselines and targets in Result Design</li>
                <li>Track progress in the Monitor tab</li>
              </ol>
            </Section>

            <Section title="Key concepts">
              <dl className="space-y-3">
                <Def term="Logframe" description="A logical framework that links your project goal to outcomes, outputs, activities, and measurable indicators." />
                <Def term="Indicator" description="A measurable value that tracks progress. Each indicator has sub-indicators, baselines, and periodic targets." />
                <Def term="Result" description="An item in the results hierarchy: Impact (Goal), Outcome, Output, or Component." />
                <Def term="Activity" description="A task or intervention under an Output. Contains budget lines, resources, and status updates." />
                <Def term="Period" description="A reporting interval (quarterly, semi-annual, or annual) for setting targets and tracking actuals." />
              </dl>
            </Section>

            <Section title="Tabs">
              <dl className="space-y-2">
                <Def term="Overview" description="Results hierarchy with expand/collapse, activities, and inline editing." />
                <Def term="Result Design" description="Detailed indicator and assumption editor with targets table." />
                <Def term="Monitor" description="Enter actuals, compare against baselines and targets, set ratings." />
                <Def term="Budget" description="Budget vs actual by activity with categorised line items and expenses." />
                <Def term="Workload" description="Staff allocation across activities with over-allocation detection." />
              </dl>
            </Section>

            <Section title="Organisation structure">
              <p className="text-muted-foreground mb-2">Chauka supports flexible hierarchies:</p>
              <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
                <li>Organisation &rarr; Program &rarr; Project &rarr; Logframe</li>
                <li>Organisation &rarr; Program &rarr; Logframe (no project)</li>
                <li>Organisation &rarr; Project &rarr; Logframe (no program)</li>
              </ul>
            </Section>

            <Section title="Roles">
              <dl className="space-y-2">
                <Def term="Org Admin" description="Full access to all programs, projects, and members." />
                <Def term="Project Lead" description="Edit access to logframes within their project." />
                <Def term="Data Collector" description="Can enter actuals and expenses but not modify structure." />
                <Def term="Viewer" description="Read-only access to assigned logframes." />
              </dl>
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
      <p className="text-sm text-foreground mb-2">{title}</p>
      <div>{children}</div>
    </div>
  )
}

function Def({ term, description }: { term: string; description: string }) {
  return (
    <div>
      <dt className="text-sm text-foreground">{term}</dt>
      <dd className="text-sm text-muted-foreground">{description}</dd>
    </div>
  )
}
