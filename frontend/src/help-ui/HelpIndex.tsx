import { Link } from 'react-router-dom'
import { helpSections, getHelpForSection } from './registry'

export default function HelpIndex() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-2">Chauka Help Centre</h1>
      <p className="text-sm text-muted-foreground mb-8 max-w-xl">
        Learn how to use Chauka to manage your logframes, track indicators,
        plan activities, and monitor your development programmes. Whether you're
        new to M&E or an experienced practitioner, these guides will help you
        get the most out of Chauka.
      </p>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {helpSections.map((section) => {
          const items = getHelpForSection(section.key)
          const first = items[0]
          return (
            <div key={section.key} className="border border-border rounded-lg p-5">
              <Link
                to={first ? `/help/${first.slug}` : '/help'}
                className="text-base font-semibold text-foreground hover:text-primary transition-colors"
              >
                {section.label}
              </Link>
              <p className="text-xs text-muted-foreground mt-1 mb-3">{section.description}</p>
              <ul className="space-y-1">
                {items.slice(0, 5).map((article) => (
                  <li key={article.slug}>
                    <Link
                      to={`/help/${article.slug}`}
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {article.title}
                    </Link>
                  </li>
                ))}
                {items.length > 5 && (
                  <li className="text-xs text-muted-foreground">
                    + {items.length - 5} more
                  </li>
                )}
              </ul>
            </div>
          )
        })}
      </div>

      <div className="mt-10 p-5 border border-border rounded-lg bg-muted/30">
        <p className="text-sm font-medium text-foreground mb-1">Looking for developer documentation?</p>
        <p className="text-xs text-muted-foreground">
          If you're a developer working on the Chauka codebase, visit the{' '}
          <Link to="/docs" className="text-primary hover:underline">Developer Docs</Link> instead.
        </p>
      </div>
    </div>
  )
}
