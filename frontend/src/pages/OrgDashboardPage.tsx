import { useParams, Link, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useAuthStore } from '../store/auth'
import { getOrganisation } from '../api/organisations'
import { getOrgDashboard } from '../api/organisations'

export default function OrgDashboardPage() {
  const { orgId } = useParams<{ orgId: string }>()
  const id = Number(orgId)
  const navigate = useNavigate()
  const { username, logout } = useAuthStore()

  const { data: org, isLoading: orgLoading, error: orgError } = useQuery({
    queryKey: ['organisation', id],
    queryFn: () => getOrganisation(id),
  })

  const { data: dashboard, isLoading: dashLoading } = useQuery({
    queryKey: ['org-dashboard', id],
    queryFn: () => getOrgDashboard(id),
    enabled: !!org,
  })

  function handleLogout() {
    logout()
    navigate('/login')
  }

  if (orgLoading || dashLoading) return <p className="text-muted-foreground p-6">Loading dashboard...</p>
  if (orgError || !org) return <p className="text-destructive p-6">Organisation not found.</p>

  const healthTotal =
    (dashboard?.indicator_health.on_track ?? 0) +
    (dashboard?.indicator_health.caution ?? 0) +
    (dashboard?.indicator_health.off_track ?? 0) +
    (dashboard?.indicator_health.not_rated ?? 0)

  function healthPct(count: number) {
    if (healthTotal === 0) return 0
    return Math.round((count / healthTotal) * 100)
  }

  function formatCurrency(value: number) {
    if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`
    if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`
    return value.toFixed(0)
  }

  return (
    <div className="min-h-screen flex flex-col bg-muted">
      {/* Header */}
      <header className="bg-primary text-background px-4 sm:px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/app" className="text-lg font-semibold hover:text-background/80">
            Chauka
          </Link>
          <span className="text-background/40">/</span>
          <span className="text-sm text-background/70 truncate">{org.name}</span>
          <span className="text-background/40">/</span>
          <span className="text-sm text-background/90">Dashboard</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-background/70 hidden sm:inline">{username}</span>
          <button
            onClick={handleLogout}
            className="text-sm text-background/70 hover:text-background underline hover:no-underline"
          >
            Log out
          </button>
        </div>
      </header>

      <main className="flex-1 p-3 sm:p-6 max-w-5xl mx-auto w-full">
        {/* Navigation links */}
        <div className="flex items-center gap-4 mb-4">
          <Link to="/app" className="text-sm text-muted-foreground hover:underline">
            &larr; Back to organisations
          </Link>
          <Link
            to={`/organisations/${id}/settings`}
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            Settings
          </Link>
        </div>

        <h2 className="text-xl font-semibold mb-6">{org.name} Dashboard</h2>

        {!dashboard ? (
          <p className="text-muted-foreground text-sm">No data available yet.</p>
        ) : (
          <>
            {/* Summary cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
              <SummaryCard label="Programs" value={dashboard.program_count} color="blue" />
              <SummaryCard label="Projects" value={dashboard.project_count} color="green" />
              <SummaryCard label="Logframes" value={dashboard.logframe_count} color="purple" />
              <SummaryCard
                label="Total Budget"
                value={formatCurrency(dashboard.total_budget)}
                color="amber"
              />
              <SummaryCard
                label="Total Spent"
                value={formatCurrency(dashboard.total_spent)}
                color="orange"
              />
              <SummaryCard
                label="Utilisation"
                value={`${dashboard.utilisation_pct}%`}
                color={dashboard.utilisation_pct > 90 ? 'red' : dashboard.utilisation_pct > 70 ? 'amber' : 'green'}
              />
            </div>

            {/* Second row: detailed counts */}
            <div className="grid grid-cols-3 gap-3 mb-8">
              <SummaryCard label="Results" value={dashboard.result_count} color="indigo" />
              <SummaryCard label="Indicators" value={dashboard.indicator_count} color="teal" />
              <SummaryCard label="Activities" value={dashboard.activity_count} color="cyan" />
            </div>

            {/* Indicator health */}
            <div className="bg-card border rounded-lg p-5 mb-8">
              <h3 className="text-sm font-semibold text-foreground mb-4">Result Health</h3>
              {healthTotal === 0 ? (
                <p className="text-sm text-muted-foreground">No results with ratings yet.</p>
              ) : (
                <>
                  {/* Health bar */}
                  <div className="flex h-6 rounded-full overflow-hidden mb-4">
                    {dashboard.indicator_health.on_track > 0 && (
                      <div
                        className="bg-ok flex items-center justify-center"
                        style={{ width: `${healthPct(dashboard.indicator_health.on_track)}%` }}
                      >
                        <span className="text-[10px] text-background font-medium">
                          {dashboard.indicator_health.on_track}
                        </span>
                      </div>
                    )}
                    {dashboard.indicator_health.caution > 0 && (
                      <div
                        className="bg-amber-400 flex items-center justify-center"
                        style={{ width: `${healthPct(dashboard.indicator_health.caution)}%` }}
                      >
                        <span className="text-[10px] text-background font-medium">
                          {dashboard.indicator_health.caution}
                        </span>
                      </div>
                    )}
                    {dashboard.indicator_health.off_track > 0 && (
                      <div
                        className="bg-destructive flex items-center justify-center"
                        style={{ width: `${healthPct(dashboard.indicator_health.off_track)}%` }}
                      >
                        <span className="text-[10px] text-background font-medium">
                          {dashboard.indicator_health.off_track}
                        </span>
                      </div>
                    )}
                    {dashboard.indicator_health.not_rated > 0 && (
                      <div
                        className="bg-muted flex items-center justify-center"
                        style={{ width: `${healthPct(dashboard.indicator_health.not_rated)}%` }}
                      >
                        <span className="text-[10px] text-muted-foreground font-medium">
                          {dashboard.indicator_health.not_rated}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Legend */}
                  <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-ok inline-block" />
                      On Track ({dashboard.indicator_health.on_track})
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block" />
                      Caution ({dashboard.indicator_health.caution})
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-destructive inline-block" />
                      Off Track ({dashboard.indicator_health.off_track})
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-muted inline-block" />
                      Not Rated ({dashboard.indicator_health.not_rated})
                    </span>
                  </div>
                </>
              )}
            </div>

            {/* Recent status updates */}
            <div className="bg-card border rounded-lg p-5">
              <h3 className="text-sm font-semibold text-foreground mb-4">Recent Activity</h3>
              {dashboard.recent_status_updates.length === 0 ? (
                <p className="text-sm text-muted-foreground">No status updates yet.</p>
              ) : (
                <div className="space-y-3">
                  {dashboard.recent_status_updates.map((update: { id: number; activity_name: string; logframe_name: string; date: string; description: string }) => (
                    <div
                      key={update.id}
                      className="flex items-start gap-3 border-b border-border pb-3 last:border-0 last:pb-0"
                    >
                      <div className="flex-shrink-0 mt-1 w-2 h-2 rounded-full bg-primary" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-0.5">
                          <span className="font-medium text-foreground">{update.activity_name}</span>
                          <span>&middot;</span>
                          <span>{update.logframe_name}</span>
                          <span>&middot;</span>
                          <span>{new Date(update.date).toLocaleDateString()}</span>
                        </div>
                        <p className="text-sm text-muted-foreground truncate">{update.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  )
}

const COLOR_MAP: Record<string, string> = {
  blue: 'bg-accent text-primary border-border',
  green: 'bg-ok/10 text-ok border-border',
  purple: 'bg-purple-50 text-purple-700 border-border',
  amber: 'bg-amber-50 text-amber-700 border-border',
  orange: 'bg-accent text-primary border-border',
  red: 'bg-destructive/10 text-destructive border-border',
  indigo: 'bg-indigo-50 text-indigo-700 border-border',
  teal: 'bg-teal-50 text-teal-700 border-border',
  cyan: 'bg-cyan-50 text-cyan-700 border-border',
}

function SummaryCard({
  label,
  value,
  color = 'blue',
}: {
  label: string
  value: number | string
  color?: string
}) {
  return (
    <div className={`rounded-lg border p-4 ${COLOR_MAP[color] ?? COLOR_MAP.blue}`}>
      <p className="text-[11px] font-medium uppercase tracking-wide opacity-70 mb-1">{label}</p>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  )
}
