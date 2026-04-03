import { Link, useLocation } from 'react-router-dom'
import { sections, getDocsForSection } from './registry'
import clsx from 'clsx'

export default function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const { pathname } = useLocation()

  return (
    <nav className="space-y-6">
      {sections.map((section) => (
        <div key={section.key}>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
            {section.label}
          </p>
          <ul className="space-y-0.5">
            {getDocsForSection(section.key).map((doc) => {
              const to = `/docs/${doc.slug}`
              const active = pathname === to
              return (
                <li key={doc.slug}>
                  <Link
                    to={to}
                    onClick={onNavigate}
                    className={clsx(
                      'block text-sm px-2 py-1.5 rounded-md transition-colors',
                      active
                        ? 'bg-primary/10 text-primary font-medium'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                    )}
                  >
                    {doc.title}
                  </Link>
                </li>
              )
            })}
          </ul>
        </div>
      ))}
    </nav>
  )
}
