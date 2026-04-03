import { useState, useMemo } from 'react'
import { useParams } from 'react-router-dom'
import { useBootstrap } from '../hooks/useBootstrap'
import { useLogframeStore } from '../store/logframe'
import TabNav from '../components/layout/TabNav'
import clsx from 'clsx'
import { type MonthKey, getMonthsBetween, activityOverlapsMonth, getBarPosition } from '../utils/timeline'

type ViewMode = 'table' | 'timeline' | 'roles'

interface StaffAllocation {
  person: string
  role: string
  activityId: number
  activityName: string
  startDate: string
  endDate: string
  days: number
  allocationPct: number
}

export default function WorkloadPage() {
  const { logframeId } = useParams<{ logframeId: string }>()
  const id = Number(logframeId)
  const { isLoading, error } = useBootstrap(id)
  const data = useLogframeStore((s) => s.data)
  const [view, setView] = useState<ViewMode>('table')

  const allocations = useMemo(() => {
    if (!data) return []
    const resources = (data.resources ?? []).filter((r) => r.resource_type === 'human')
    const result: StaffAllocation[] = []
    for (const res of resources) {
      const activity = data.activities.find((a) => a.id === res.activity_id)
      if (!activity?.start_date || !activity?.end_date) continue
      const person = res.person || res.role
      result.push({
        person,
        role: res.role,
        activityId: activity.id,
        activityName: activity.name,
        startDate: activity.start_date,
        endDate: activity.end_date,
        days: res.days_required,
        allocationPct: res.allocation_pct ?? 100,
      })
    }
    return result
  }, [data])

  // Get date range across all activities
  const months = useMemo(() => {
    if (allocations.length === 0) return []
    const starts = allocations.map((a) => a.startDate).sort()
    const ends = allocations.map((a) => a.endDate).sort()
    return getMonthsBetween(starts[0], ends[ends.length - 1])
  }, [allocations])

  // Unique staff
  const staffList = useMemo(() => {
    return [...new Set(allocations.map((a) => a.person))].sort()
  }, [allocations])

  if (isLoading) return <p className="text-gray-500">Loading...</p>
  if (error) return <p className="text-red-600">Failed to load data.</p>
  if (!data) return null

  return (
    <div>
      <TabNav />
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Workload Planning</h2>
        <div className="flex gap-1 bg-gray-100 rounded p-0.5">
          {([['table', 'Staff Table'], ['timeline', 'Timeline'], ['roles', 'By Role']] as const).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setView(key)}
              className={clsx(
                'px-3 py-1 text-xs rounded font-medium',
                view === key ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-600 hover:text-gray-800',
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {allocations.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 text-sm mb-2">No human resources assigned to activities with dates.</p>
          <p className="text-gray-400 text-xs">Assign staff in Activity &rarr; Resources, and set activity start/end dates.</p>
        </div>
      ) : (
        <>
          {view === 'table' && (
            <StaffTable staffList={staffList} allocations={allocations} months={months} />
          )}
          {view === 'timeline' && (
            <TimelineView allocations={allocations} months={months} />
          )}
          {view === 'roles' && (
            <RoleDemandSummary allocations={allocations} months={months} />
          )}
        </>
      )}
    </div>
  )
}

function StaffTable({ staffList, allocations, months }: {
  staffList: string[]
  allocations: StaffAllocation[]
  months: MonthKey[]
}) {
  return (
    <div className="overflow-x-auto">
      <table className="text-xs border-collapse w-full">
        <thead>
          <tr className="bg-gray-50">
            <th className="border border-gray-200 px-3 py-2 text-left font-medium text-gray-600 min-w-[140px] sticky left-0 bg-gray-50 z-10">
              Staff
            </th>
            {months.map((m) => (
              <th key={m.label} className="border border-gray-200 px-2 py-2 text-center font-medium text-gray-500 min-w-[70px]">
                <div className="text-[10px]">{m.label}</div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {staffList.map((person) => {
            const personAllocs = allocations.filter((a) => a.person === person)
            return (
              <tr key={person} className="hover:bg-gray-50">
                <td className="border border-gray-200 px-3 py-2 font-medium text-gray-700 sticky left-0 bg-white z-10">
                  {person}
                  <div className="text-[10px] text-gray-400 font-normal">
                    {personAllocs[0]?.role}
                  </div>
                </td>
                {months.map((m) => {
                  // Sum allocation % for this person in this month
                  let totalPct = 0
                  for (const alloc of personAllocs) {
                    if (activityOverlapsMonth(alloc.startDate, alloc.endDate, m.year, m.month)) {
                      totalPct += alloc.allocationPct
                    }
                  }
                  const overAllocated = totalPct > 100
                  return (
                    <td
                      key={m.label}
                      className={clsx(
                        'border border-gray-200 px-2 py-2 text-center',
                        totalPct === 0 && 'text-gray-300',
                        totalPct > 0 && totalPct <= 50 && 'bg-blue-50 text-blue-700',
                        totalPct > 50 && totalPct <= 100 && 'bg-blue-100 text-blue-800',
                        overAllocated && 'bg-red-100 text-red-700 font-bold',
                      )}
                      title={overAllocated ? `Over-allocated: ${totalPct}%` : `${totalPct}% allocated`}
                    >
                      {totalPct > 0 ? `${totalPct}%` : ''}
                      {overAllocated && <span className="block text-[9px]">OVER</span>}
                    </td>
                  )
                })}
              </tr>
            )
          })}
        </tbody>
      </table>
      <div className="flex gap-4 mt-3 text-[10px] text-gray-500">
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-blue-50 border" /> 1-50%</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-blue-100 border" /> 51-100%</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-red-100 border" /> Over 100%</span>
      </div>
    </div>
  )
}

function TimelineView({ allocations, months }: {
  allocations: StaffAllocation[]
  months: MonthKey[]
}) {
  // Group by person
  const byPerson = new Map<string, StaffAllocation[]>()
  for (const a of allocations) {
    if (!byPerson.has(a.person)) byPerson.set(a.person, [])
    byPerson.get(a.person)!.push(a)
  }

  const COLORS = [
    'bg-blue-200 text-blue-800',
    'bg-green-200 text-green-800',
    'bg-amber-200 text-amber-800',
    'bg-purple-200 text-purple-800',
    'bg-pink-200 text-pink-800',
    'bg-cyan-200 text-cyan-800',
  ]

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[600px]">
        {/* Month headers */}
        <div className="flex border-b border-gray-200">
          <div className="w-36 flex-shrink-0 px-2 py-1 text-xs font-medium text-gray-600">Staff</div>
          {months.map((m) => (
            <div key={m.label} className="flex-1 min-w-[60px] px-1 py-1 text-[10px] text-center text-gray-500 border-l border-gray-100">
              {m.label}
            </div>
          ))}
        </div>

        {/* Person rows */}
        {Array.from(byPerson.entries()).map(([person, allocs], personIdx) => (
          <div key={person} className="flex border-b border-gray-100">
            <div className="w-36 flex-shrink-0 px-2 py-2 text-xs font-medium text-gray-700">
              {person}
            </div>
            <div className="flex-1 relative" style={{ minHeight: `${Math.max(allocs.length, 1) * 24 + 8}px` }}>
              {allocs.map((alloc, idx) => {
                const pos = getBarPosition(alloc.startDate, alloc.endDate, months)
                if (!pos) return null
                const { left, width } = pos
                const color = COLORS[(personIdx + idx) % COLORS.length]
                return (
                  <div
                    key={`${alloc.activityId}-${idx}`}
                    className={clsx('absolute rounded px-1 text-[10px] truncate', color)}
                    style={{
                      left: `${left}%`,
                      width: `${width}%`,
                      top: `${idx * 24 + 4}px`,
                      height: '20px',
                      lineHeight: '20px',
                    }}
                    title={`${alloc.activityName} (${alloc.allocationPct}%, ${alloc.days} days)`}
                  >
                    {alloc.activityName}
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function RoleDemandSummary({ allocations, months }: {
  allocations: StaffAllocation[]
  months: MonthKey[]
}) {
  // Group by role
  const roles = [...new Set(allocations.map((a) => a.role))].sort()

  return (
    <div className="space-y-6">
      {roles.map((role) => {
        const roleAllocs = allocations.filter((a) => a.role === role)
        const people = [...new Set(roleAllocs.map((a) => a.person))]
        const totalDays = roleAllocs.reduce((s, a) => s + a.days, 0)

        return (
          <div key={role} className="bg-white border rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-gray-700">{role}</h3>
              <div className="flex gap-4 text-xs text-gray-500">
                <span>{people.length} staff</span>
                <span>{totalDays} total days</span>
              </div>
            </div>

            {/* Monthly demand */}
            <div className="overflow-x-auto">
              <table className="text-xs border-collapse w-full">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="border border-gray-200 px-2 py-1 text-left font-medium text-gray-600 min-w-[100px]">Month</th>
                    <th className="border border-gray-200 px-2 py-1 text-center font-medium text-gray-600">People needed</th>
                    <th className="border border-gray-200 px-2 py-1 text-center font-medium text-gray-600">Total %</th>
                    <th className="border border-gray-200 px-2 py-1 text-left font-medium text-gray-600">Activities</th>
                  </tr>
                </thead>
                <tbody>
                  {months.map((m) => {
                    const active = roleAllocs.filter((a) =>
                      activityOverlapsMonth(a.startDate, a.endDate, m.year, m.month)
                    )
                    if (active.length === 0) return null
                    const totalPct = active.reduce((s, a) => s + a.allocationPct, 0)
                    const activePeople = [...new Set(active.map((a) => a.person))]
                    return (
                      <tr key={m.label}>
                        <td className="border border-gray-200 px-2 py-1 text-gray-600">{m.label}</td>
                        <td className="border border-gray-200 px-2 py-1 text-center">{activePeople.length}</td>
                        <td className={clsx(
                          'border border-gray-200 px-2 py-1 text-center font-medium',
                          totalPct > 100 ? 'text-red-600' : 'text-gray-700',
                        )}>
                          {totalPct}%
                          {totalPct > 100 && <span className="text-[9px] ml-1 text-red-500">OVER</span>}
                        </td>
                        <td className="border border-gray-200 px-2 py-1 text-gray-500">
                          {active.map((a) => a.activityName).join(', ')}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Staff list */}
            <div className="mt-2 flex flex-wrap gap-1">
              {people.map((p) => (
                <span key={p} className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded">{p}</span>
              ))}
            </div>
          </div>
        )
      })}

      {roles.length === 0 && (
        <p className="text-gray-400 text-sm italic">No role data available.</p>
      )}
    </div>
  )
}
