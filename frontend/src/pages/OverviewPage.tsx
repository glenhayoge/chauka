import { useEffect, useMemo } from 'react'
import { useParams } from 'react-router-dom'
import { useBootstrap } from '../hooks/useBootstrap'
import { useLogframeStore } from '../store/logframe'
import { useUIStore } from '../store/ui'
import TabNav from '../components/layout/TabNav'
import ExportControls from '../components/overview/ExportControls'
import FilterBar from '../components/overview/FilterBar'
import ResultRow from '../components/overview/ResultRow'
import AddResultRow from '../components/overview/AddResultRow'
import EmptyState from '../components/ui/EmptyState'
import type { Activity, Result } from '../api/types'

const DEFAULT_OPEN_LEVEL = 2

/** Check if an activity's date range overlaps the filter range. */
function activityMatchesDateFilter(
  activity: Activity,
  dateFrom: string,
  dateTo: string,
): boolean {
  if (!dateFrom && !dateTo) return true
  // Activities without dates are excluded when a date filter is active
  if (!activity.start_date && !activity.end_date) return false
  const aStart = activity.start_date || activity.end_date!
  const aEnd = activity.end_date || activity.start_date!
  if (dateFrom && aEnd < dateFrom) return false
  if (dateTo && aStart > dateTo) return false
  return true
}

/**
 * Build a set of visible result IDs based on filter criteria.
 * A result is visible if:
 *  - It is a leaf with at least one matching activity, OR
 *  - It has at least one visible child result
 */
function computeVisibleResults(
  results: Result[],
  activities: Activity[],
  dateFrom: string,
  dateTo: string,
  leadId: number | null,
): Set<number> {
  // Build children map
  const childrenOf = new Map<number | null, Result[]>()
  for (const r of results) {
    const siblings = childrenOf.get(r.parent_id) ?? []
    siblings.push(r)
    childrenOf.set(r.parent_id, siblings)
  }

  // Index activities by result_id
  const activitiesByResult = new Map<number, Activity[]>()
  for (const a of activities) {
    const list = activitiesByResult.get(a.result_id) ?? []
    list.push(a)
    activitiesByResult.set(a.result_id, list)
  }

  const visible = new Set<number>()

  function visit(resultId: number): boolean {
    const children = childrenOf.get(resultId) ?? []
    let hasVisibleChild = false
    for (const child of children) {
      if (visit(child.id)) hasVisibleChild = true
    }

    if (hasVisibleChild) {
      visible.add(resultId)
      return true
    }

    // Leaf node: check activities
    if (children.length === 0) {
      const acts = activitiesByResult.get(resultId) ?? []
      const hasMatch = acts.some((a) => {
        if (!activityMatchesDateFilter(a, dateFrom, dateTo)) return false
        if (leadId !== null && a.lead_id !== leadId) return false
        return true
      })
      if (hasMatch) {
        visible.add(resultId)
        return true
      }
    }

    return false
  }

  // Start from top-level results
  const topLevel = childrenOf.get(null) ?? []
  for (const r of topLevel) {
    visit(r.id)
  }

  return visible
}

export default function OverviewPage() {
  const { logframeId } = useParams<{ logframeId: string }>()
  const id = Number(logframeId)
  const { isLoading, error } = useBootstrap(id)
  const data = useLogframeStore((s) => s.data)
  const initExpandedResults = useUIStore((s) => s.initExpandedResults)
  const filters = useUIStore((s) => s.filters)

  // Auto-expand results at level <= open_result_level on first load
  useEffect(() => {
    if (data) {
      const openLevel = data.conf?.open_result_level ?? DEFAULT_OPEN_LEVEL
      initExpandedResults(data.results, openLevel)
    }
  }, [data, initExpandedResults])

  const hasActiveFilters = filters.dateFrom || filters.dateTo || filters.leadId !== null

  const visibleResultIds = useMemo(() => {
    if (!data || !hasActiveFilters) return null // null = show all
    return computeVisibleResults(
      data.results,
      data.activities,
      filters.dateFrom,
      filters.dateTo,
      filters.leadId,
    )
  }, [data, filters.dateFrom, filters.dateTo, filters.leadId, hasActiveFilters])

  if (isLoading) return <p className="text-muted-foreground">Loading&hellip;</p>
  if (error) return <p className="text-destructive">Failed to load data.</p>
  if (!data) return null

  const topLevelResults = data.results
    .filter((r) => r.parent_id === null)
    .filter((r) => !visibleResultIds || visibleResultIds.has(r.id))
    .sort((a, b) => a.order - b.order)

  return (
    <div>
      <TabNav />
      <h2 className="text-lg font-semibold mb-4">{data.logframe.name}</h2>
      <FilterBar />
      <div className="border border-border rounded-lg overflow-hidden">
        {topLevelResults.map((result) => (
          <ResultRow
            key={result.id}
            result={result}
            allResults={data.results}
            logframeId={id}
            visibleResultIds={visibleResultIds}
          />
        ))}

        {hasActiveFilters && topLevelResults.length === 0 && (
          <div className="px-3 py-6 text-center text-muted-foreground text-sm">
            No results match the current filters.
          </div>
        )}

        {!hasActiveFilters && topLevelResults.length === 0 && !data.canEdit && (
          <EmptyState
            title="No results yet"
            description="This logframe doesn't have any results. Ask an editor to add the first result to start building the logframe."
          />
        )}

        {/* Add new top-level result */}
        {data.canEdit && (
          <AddResultRow logframeId={id} />
        )}
      </div>
      <ExportControls
        logframeId={id}
        periods={data.periods}
        settings={data.settings}
      />
    </div>
  )
}
