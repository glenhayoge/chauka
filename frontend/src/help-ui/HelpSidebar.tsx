import { Link, useLocation } from 'react-router-dom'
import { helpSections, getHelpForSection } from './registry'
import clsx from 'clsx'

export default function HelpSidebar({ onNavigate }: { onNavigate?: () => void }) {
  const { pathname } = useLocation()

  return (
    <nav className="space-y-6">
      {helpSections.map((section) => (
        <div key={section.key}>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
            {section.label}
          </p>
          <ul className="space-y-0.5">
            {getHelpForSection(section.key).map((article) => {
              const to = `/help/${article.slug}`
              const active = pathname === to
              return (
                <li key={article.slug}>
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
                    {article.title}
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
