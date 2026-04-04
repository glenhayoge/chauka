import { useMemo } from 'react'
import { useParams } from 'react-router-dom'
import { useBootstrap } from '../hooks/useBootstrap'
import { useLogframeStore } from '../store/logframe'
import TabNav from '../components/layout/TabNav'
import EmptyState from '../components/ui/EmptyState'
import clsx from 'clsx'
import type { Activity, Result, Milestone, Period } from '../api/types'
import { getMonthsBetween, getBarPosition, getTodayPosition, getQuarterGroups, type MonthKey } from '../utils/timeline'
import { formatDateDisplay } from '../utils/format'
import { buildResultCodeMap } from '../utils/resultCodes'

// Bar colors by result level
const LEVEL_BAR_COLORS: Record<number, string> = {
  1: 'bg-primary/40 text-foreground',
  2: 'bg-ok/30 text-foreground',
  3: 'bg-warning/30 text-foreground',
  4: 'bg-accent text-foreground',
}

// Group header backgrounds by level (matches ResultRow.tsx pattern)
const LEVEL_BG: Record<number, string> = {
  1: 'bg-muted',
  2: 'bg-muted/70',
  3: 'bg-muted/40',
  4: 'bg-background',
}

interface ResultNode {
  result: Result
  children: ResultNode[]
  activities: Activity[]
}

function buildResultTree(results: Result[], activities: Activity[]): ResultNode[] {
  const nodeMap = new Map<number, ResultNode>()
  for (const r of results) {
    nodeMap.set(r.id, { result: r, children: [], activities: [] })
  }
  for (const a of activities) {
    nodeMap.get(a.result_id)?.activities.push(a)
  }

  const roots: ResultNode[] = []
  for (const node of nodeMap.values()) {
    if (node.result.parent_id && nodeMap.has(node.result.parent_id)) {
      nodeMap.get(node.result.parent_id)!.children.push(node)
    } else {
      roots.push(node)
    }
  }

  // Sort children and activities by order
  function sortNode(node: ResultNode) {
    node.children.sort((a, b) => a.result.order - b.result.order)
    node.activities.sort((a, b) => a.order - b.order)
    node.children.forEach(sortNode)
  }
  roots.sort((a, b) => a.result.order - b.result.order)
  roots.forEach(sortNode)

  return roots
}

function hasActivities(node: ResultNode): boolean {
  return node.activities.length > 0 || node.children.some(hasActivities)
}

interface MilestoneMarker {
  milestoneId: number
  description: string
  monthIndex: number
}

function resolveMilestones(
  milestones: Milestone[],
  periods: Period[],
  months: MonthKey[]
): Map<number, MilestoneMarker[]> {
  const map = new Map<number, MilestoneMarker[]>()
  for (const m of milestones) {
    if (!m.period_id) continue
    const period = periods.find((p) => p.id === m.period_id)
    if (!period) continue
    const idx = months.findIndex(
      (mo) => mo.year === period.end_year && mo.month === period.end_month
    )
    if (idx < 0) continue
    if (!map.has(m.activity_id)) map.set(m.activity_id, [])
    map.get(m.activity_id)!.push({
      milestoneId: m.id,
      description: m.description || 'Milestone',
      monthIndex: idx,
    })
  }
  return map
}

export default function GanttPage() {
  const { logframeId } = useParams<{ logframeId: string }>()
  const id = Number(logframeId)
  const { isLoading, error } = useBootstrap(id)
  const data = useLogframeStore((s) => s.data)

  const datedActivities = useMemo(() => {
    if (!data) return []
    return data.activities.filter((a) => a.start_date && a.end_date)
  }, [data])

  const undatedActivities = useMemo(() => {
    if (!data) return []
    return data.activities.filter((a) => !a.start_date || !a.end_date)
  }, [data])

  const months = useMemo(() => {
    if (datedActivities.length === 0) return []
    const starts = datedActivities.map((a) => a.start_date!).sort()
    const ends = datedActivities.map((a) => a.end_date!).sort()
    return getMonthsBetween(starts[0], ends[ends.length - 1])
  }, [datedActivities])

  const quarters = useMemo(() => getQuarterGroups(months), [months])

  const todayPos = useMemo(() => getTodayPosition(months), [months])

  const tree = useMemo(() => {
    if (!data) return []
    return buildResultTree(data.results, datedActivities)
  }, [data, datedActivities])

  const milestoneMap = useMemo(() => {
    if (!data) return new Map<number, MilestoneMarker[]>()
    return resolveMilestones(data.milestones, data.periods, months)
  }, [data, months])

  const resultCodes = useMemo(() => {
    if (!data) return new Map<number, string>()
    return buildResultCodeMap(data.results)
  }, [data])

  if (isLoading) return <p className="text-muted-foreground">Loading...</p>
  if (error) return <p className="text-destructive">Failed to load data.</p>
  if (!data) return null

  if (data.activities.length === 0) {
    return (
      <div>
        <TabNav />
        <EmptyState
          title="No activities yet"
          description="Add activities to your results in the Result Design tab to see them on the timeline."
        />
      </div>
    )
  }

  if (datedActivities.length === 0) {
    return (
      <div>
        <TabNav />
        <h2 className="text-lg font-semibold mb-4">Activity Timeline</h2>
        <EmptyState
          title="No scheduled activities"
          description="Set start and end dates on your activities in the Result Design tab to see them on the timeline."
        />
        {undatedActivities.length > 0 && (
          <UnscheduledList activities={undatedActivities} results={data.results} levels={data.levels} />
        )}
      </div>
    )
  }

  return (
    <div>
      <TabNav />
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Activity Timeline</h2>
        <Legend levels={data.levels} />
      </div>

      {/* Gantt chart */}
      <div className="overflow-x-auto border border-border rounded-lg">
        <div className="min-w-[700px]">
          {/* Header rows */}
          <GanttHeader months={months} quarters={quarters} />

          {/* Body */}
          <div className="relative">
            {/* Today line */}
            {todayPos !== null && <TodayLine position={todayPos} />}

            {tree.filter(hasActivities).map((node) => (
              <ResultGroup
                key={node.result.id}
                node={node}
                months={months}
                milestoneMap={milestoneMap}
                levels={data.levels}
                resultCodes={resultCodes}
                depth={0}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Unscheduled */}
      {undatedActivities.length > 0 && (
        <UnscheduledList activities={undatedActivities} results={data.results} levels={data.levels} />
      )}
    </div>
  )
}

function Legend({ levels }: { levels: Record<string, string> }) {
  return (
    <div className="flex gap-3 text-[10px] text-muted-foreground">
      {Object.entries(levels).map(([lvl, label]) => {
        const color = LEVEL_BAR_COLORS[Number(lvl)] ?? 'bg-muted text-foreground'
        const bgClass = color.split(' ')[0]
        return (
          <span key={lvl} className="flex items-center gap-1">
            <span className={clsx('w-3 h-2 rounded-sm', bgClass)} />
            {label}
          </span>
        )
      })}
      <span className="flex items-center gap-1">
        <span className="w-2 h-2 bg-destructive rotate-45 inline-block" />
        Milestone
      </span>
    </div>
  )
}

function GanttHeader({ months, quarters }: { months: MonthKey[]; quarters: { label: string; span: number }[] }) {
  return (
    <div className="border-b border-border bg-muted sticky top-0 z-20">
      {/* Quarter row */}
      <div className="flex">
        <div className="w-96 flex-shrink-0" />
        {quarters.map((q, i) => (
          <div
            key={`${q.label}-${i}`}
            className="text-[10px] font-semibold text-muted-foreground text-center border-l border-border py-1"
            style={{ flex: `${q.span} 0 0` }}
          >
            {q.label}
          </div>
        ))}
      </div>
      {/* Month row */}
      <div className="flex border-t border-border">
        <div className="w-96 flex-shrink-0 px-3 py-1 text-xs font-medium text-muted-foreground">
          Activity
        </div>
        {months.map((m) => (
          <div
            key={m.label}
            className="flex-1 min-w-[36px] text-[10px] text-center text-muted-foreground border-l border-border py-1"
          >
            {m.label.split(' ')[0]}
          </div>
        ))}
      </div>
    </div>
  )
}

function ResultGroup({
  node,
  months,
  milestoneMap,
  levels,
  resultCodes,
  depth,
}: {
  node: ResultNode
  months: MonthKey[]
  milestoneMap: Map<number, MilestoneMarker[]>
  levels: Record<string, string>
  resultCodes: Map<number, string>
  depth: number
}) {
  if (!hasActivities(node)) return null

  const level = node.result.level ?? depth + 1
  const bg = LEVEL_BG[level] ?? 'bg-white'
  const levelLabel = levels[String(level)] ?? ''
  const code = resultCodes.get(node.result.id) ?? ''

  return (
    <>
      {/* Result group header */}
      <div className={clsx('flex border-b border-border', bg)}>
        <div
          className="w-96 flex-shrink-0 px-3 py-1.5 text-xs font-semibold text-foreground truncate"
          style={{ paddingLeft: `${depth * 16 + 12}px` }}
          title={node.result.name}
        >
          {code && (
            <span className="text-[10px] font-semibold text-muted-foreground mr-1">{code}</span>
          )}
          {levelLabel && (
            <span className="text-[10px] font-bold text-muted-foreground mr-1">{levelLabel}:</span>
          )}
          {node.result.name}
        </div>
        <div className="flex-1" />
      </div>

      {/* Activities */}
      {node.activities.map((activity) => (
        <ActivityBarRow
          key={activity.id}
          activity={activity}
          months={months}
          level={level}
          depth={depth}
          milestones={milestoneMap.get(activity.id) ?? []}
        />
      ))}

      {/* Child results */}
      {node.children.map((child) => (
        <ResultGroup
          key={child.result.id}
          node={child}
          months={months}
          milestoneMap={milestoneMap}
          levels={levels}
          resultCodes={resultCodes}
          depth={depth + 1}
        />
      ))}
    </>
  )
}

function ActivityBarRow({
  activity,
  months,
  level,
  depth,
  milestones,
}: {
  activity: Activity
  months: MonthKey[]
  level: number
  depth: number
  milestones: MilestoneMarker[]
}) {
  const pos = getBarPosition(activity.start_date!, activity.end_date!, months)
  const barColor = LEVEL_BAR_COLORS[level] ?? 'bg-muted text-foreground'
  const dateRange = `${formatDateDisplay(activity.start_date)} – ${formatDateDisplay(activity.end_date)}`

  return (
    <div className="flex border-b border-muted hover:bg-muted/50 group">
      {/* Activity name — sticky left */}
      <div
        className="w-96 flex-shrink-0 px-3 py-2 text-xs text-muted-foreground truncate sticky left-0 bg-card group-hover:bg-muted/50 z-10"
        style={{ paddingLeft: `${(depth + 1) * 16 + 12}px` }}
        title={`${activity.name}\n${dateRange}`}
      >
        {activity.name}
      </div>

      {/* Bar area */}
      <div className="flex-1 relative" style={{ minHeight: '32px' }}>
        {/* Month grid lines */}
        {months.map((m, i) => (
          <div
            key={m.label}
            className="absolute top-0 bottom-0 border-l border-muted"
            style={{ left: `${(i / months.length) * 100}%` }}
          />
        ))}

        {/* Activity bar */}
        {pos && (
          <div
            className={clsx('absolute rounded-sm px-1 text-[10px] truncate font-medium', barColor)}
            style={{
              left: `${pos.left}%`,
              width: `${pos.width}%`,
              top: '6px',
              height: '20px',
              lineHeight: '20px',
            }}
            title={`${activity.name}\n${dateRange}`}
          >
            {pos.width > 8 ? activity.name : ''}
          </div>
        )}

        {/* Milestone diamonds */}
        {milestones.map((ms) => {
          const msLeft = ((ms.monthIndex + 0.5) / months.length) * 100
          return (
            <div
              key={ms.milestoneId}
              className="absolute w-2.5 h-2.5 bg-destructive rotate-45 z-10 cursor-help"
              style={{
                left: `${msLeft}%`,
                top: '10px',
                marginLeft: '-5px',
              }}
              title={ms.description}
            />
          )
        })}
      </div>
    </div>
  )
}

function TodayLine({ position }: { position: number }) {
  return (
    <div
      className="absolute top-0 bottom-0 z-10 pointer-events-none"
      style={{ left: `calc(384px + (100% - 384px) * ${position / 100})` }}
    >
      <div className="w-px h-full border-l-2 border-dashed border-destructive opacity-60" />
      <div className="absolute -top-0.5 -left-3 text-[9px] text-destructive font-medium bg-card px-0.5 rounded">
        Today
      </div>
    </div>
  )
}

function UnscheduledList({
  activities,
  results,
  levels,
}: {
  activities: Activity[]
  results: Result[]
  levels: Record<string, string>
}) {
  const resultMap = new Map(results.map((r) => [r.id, r]))

  return (
    <div className="mt-6">
      <h3 className="text-sm font-semibold text-foreground mb-2">Unscheduled Activities</h3>
      <p className="text-xs text-muted-foreground mb-2">
        Set start and end dates to see these on the timeline.
      </p>
      <div className="border rounded-lg overflow-hidden">
        <table className="text-xs w-full">
          <thead>
            <tr className="bg-muted">
              <th className="px-3 py-1.5 text-left font-medium text-muted-foreground">Activity</th>
              <th className="px-3 py-1.5 text-left font-medium text-muted-foreground">Result</th>
              <th className="px-3 py-1.5 text-left font-medium text-muted-foreground">Start</th>
              <th className="px-3 py-1.5 text-left font-medium text-muted-foreground">End</th>
            </tr>
          </thead>
          <tbody>
            {activities.map((a) => {
              const parent = resultMap.get(a.result_id)
              const levelLabel = parent?.level ? levels[String(parent.level)] ?? '' : ''
              return (
                <tr key={a.id} className="border-t border-border hover:bg-muted">
                  <td className="px-3 py-1.5 text-foreground">{a.name}</td>
                  <td className="px-3 py-1.5 text-muted-foreground">
                    {levelLabel && <span className="text-muted-foreground">{levelLabel}: </span>}
                    {parent?.name ?? '—'}
                  </td>
                  <td className="px-3 py-1.5 text-muted-foreground">{a.start_date ? formatDateDisplay(a.start_date) : 'Not set'}</td>
                  <td className="px-3 py-1.5 text-muted-foreground">{a.end_date ? formatDateDisplay(a.end_date) : 'Not set'}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
