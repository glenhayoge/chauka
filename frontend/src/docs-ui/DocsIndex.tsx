import { Link } from 'react-router-dom'
import { sections, getDocsForSection } from './registry'

export default function DocsIndex() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-2">Chauka Documentation</h1>
      <p className="text-sm text-muted-foreground mb-8 max-w-xl">
        Chauka is a logframe management platform for M&E teams. This documentation
        follows the Diataxis framework — content is organised by purpose so you can
        find what you need quickly.
      </p>

      <div className="grid gap-6 sm:grid-cols-2">
        {sections.map((section) => {
          const items = getDocsForSection(section.key)
          const first = items[0]
          return (
            <div key={section.key} className="border border-border rounded-lg p-5">
              <Link
                to={first ? `/docs/${first.slug}` : '/docs'}
                className="text-base font-semibold text-foreground hover:text-primary transition-colors"
              >
                {section.label}
              </Link>
              <p className="text-xs text-muted-foreground mt-1 mb-3">{section.description}</p>
              <ul className="space-y-1">
                {items.slice(0, 4).map((doc) => (
                  <li key={doc.slug}>
                    <Link
                      to={`/docs/${doc.slug}`}
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {doc.title}
                    </Link>
                  </li>
                ))}
                {items.length > 4 && (
                  <li className="text-xs text-muted-foreground">
                    + {items.length - 4} more
                  </li>
                )}
              </ul>
            </div>
          )
        })}
      </div>
    </div>
  )
}
