import { Link, useParams, useLocation } from 'react-router-dom'
import clsx from 'clsx'

const TABS = [
  { label: 'Overview', path: '/overview' },
  { label: 'Result Design', path: '/design' },
  { label: 'Monitor', path: '/monitor' },
  { label: 'Budget', path: '/budget' },
  { label: 'Timeline', path: '/timeline' },
  { label: 'Workload', path: '/workload' },
]

export default function TabNav() {
  const { logframeId } = useParams<{ logframeId: string }>()
  const { pathname } = useLocation()
  const base = `/app/logframes/${logframeId}`

  return (
    <nav className="flex overflow-x-auto border-b border-border/60 mb-4 sm:mb-6 -mx-3 px-3 sm:mx-0 sm:px-0">
      {TABS.map(({ label, path }) => {
        const href = base + path
        const active = pathname.startsWith(href)
        return (
          <Link
            key={path}
            to={href}
            className={clsx(
              'px-3 sm:px-5 py-2 text-xs font-medium tracking-wide border-b-2 -mb-px whitespace-nowrap uppercase transition-colors',
              active
                ? 'border-foreground/40 text-foreground'
                : 'border-transparent text-muted-foreground/70 hover:text-muted-foreground hover:border-border'
            )}
          >
            {label}
          </Link>
        )
      })}
    </nav>
  )
}
