import { Link, useParams, useLocation } from 'react-router-dom'
import clsx from 'clsx'

const TABS = [
  { label: 'Overview', path: '/overview' },
  { label: 'Result Design', path: '/design' },
  { label: 'Monitor', path: '/monitor' },
  { label: 'Budget', path: '/budget' },
  { label: 'Workload', path: '/workload' },
]

export default function TabNav() {
  const { logframeId } = useParams<{ logframeId: string }>()
  const { pathname } = useLocation()
  const base = `/app/logframes/${logframeId}`

  return (
    <nav className="flex overflow-x-auto border-b border-gray-200 mb-4 sm:mb-6 -mx-3 px-3 sm:mx-0 sm:px-0">
      {TABS.map(({ label, path }) => {
        const href = base + path
        const active = pathname.startsWith(href)
        return (
          <Link
            key={path}
            to={href}
            className={clsx(
              'px-4 sm:px-6 py-2.5 sm:py-3 text-sm font-medium border-b-2 -mb-px whitespace-nowrap',
              active
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            )}
          >
            {label}
          </Link>
        )
      })}
    </nav>
  )
}
