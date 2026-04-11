import { useQuery } from '@tanstack/react-query'
import { getPlatformDashboard } from '../../api/admin'

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="bg-background border border-border rounded-lg p-4">
      <p className="text-xs text-muted-foreground uppercase tracking-wider">{label}</p>
      <p className="text-2xl font-semibold mt-1">{value}</p>
      {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
    </div>
  )
}

export default function AdminDashboardPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['admin-dashboard'],
    queryFn: getPlatformDashboard,
  })

  if (isLoading) return <p className="text-sm text-muted-foreground">Loading dashboard...</p>
  if (error) return <p className="text-sm text-red-500">Failed to load dashboard.</p>
  if (!data) return null

  const utilisation = data.total_budget > 0
    ? ((data.total_spent / data.total_budget) * 100).toFixed(1)
    : '0.0'

  return (
    <div className="space-y-8 max-w-6xl">
      <div>
        <h1 className="text-xl font-semibold">Platform Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">Overview of the entire Chauka platform.</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <StatCard label="Total Users" value={data.user_count} sub={`${data.active_user_count} active`} />
        <StatCard label="Organisations" value={data.org_count} />
        <StatCard label="Programs" value={data.program_count} />
        <StatCard label="Projects" value={data.project_count} />
        <StatCard label="Logframes" value={data.logframe_count} />
        <StatCard
          label="Budget"
          value={`$${data.total_budget.toLocaleString()}`}
          sub={`${utilisation}% utilised`}
        />
      </div>

      {/* Two-column: recent signups + audit log */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent signups */}
        <div className="border border-border rounded-lg">
          <div className="px-4 py-3 border-b border-border">
            <h2 className="text-sm font-medium">Recent Signups</h2>
          </div>
          <div className="divide-y divide-border">
            {data.recent_signups.length === 0 && (
              <p className="px-4 py-3 text-sm text-muted-foreground">No recent signups.</p>
            )}
            {data.recent_signups.map((user) => (
              <div key={user.id} className="px-4 py-2.5 flex items-center justify-between text-sm">
                <div>
                  <span className="font-medium">{user.username}</span>
                  {user.first_name && (
                    <span className="text-muted-foreground ml-2">{user.first_name} {user.last_name}</span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {user.is_superuser && (
                    <span className="text-[10px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded">Super</span>
                  )}
                  {user.is_staff && !user.is_superuser && (
                    <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">Staff</span>
                  )}
                  <span className="text-xs text-muted-foreground">
                    {user.date_joined ? new Date(user.date_joined).toLocaleDateString() : ''}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent audit log */}
        <div className="border border-border rounded-lg">
          <div className="px-4 py-3 border-b border-border">
            <h2 className="text-sm font-medium">Recent Activity</h2>
          </div>
          <div className="divide-y divide-border">
            {data.recent_audit_entries.length === 0 && (
              <p className="px-4 py-3 text-sm text-muted-foreground">No recent activity.</p>
            )}
            {data.recent_audit_entries.map((entry) => (
              <div key={entry.id} className="px-4 py-2.5 text-sm">
                <div className="flex items-center justify-between">
                  <span>
                    <span className="font-medium">{(entry as any).username || `User #${entry.user_id}`}</span>
                    <span className="text-muted-foreground mx-1">{entry.action}</span>
                    <span className="text-foreground/80">{entry.entity_type} #{entry.entity_id}</span>
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {entry.timestamp ? new Date(entry.timestamp).toLocaleString() : ''}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top organisations */}
      {data.org_breakdown.length > 0 && (
        <div className="border border-border rounded-lg">
          <div className="px-4 py-3 border-b border-border">
            <h2 className="text-sm font-medium">Top Organisations</h2>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-muted-foreground">
                <th className="px-4 py-2 font-medium">Organisation</th>
                <th className="px-4 py-2 font-medium text-right">Members</th>
                <th className="px-4 py-2 font-medium text-right">Logframes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {data.org_breakdown.map((org) => (
                <tr key={org.name}>
                  <td className="px-4 py-2">{org.name}</td>
                  <td className="px-4 py-2 text-right">{org.member_count}</td>
                  <td className="px-4 py-2 text-right">{org.logframe_count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
