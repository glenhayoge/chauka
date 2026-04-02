import { Link } from 'react-router-dom'
import type { Result } from '../../api/types'
import { useLogframeStore } from '../../store/logframe'
import { useUIStore } from '../../store/ui'
import EditableText from '../ui/EditableText'
import RatingBadge from '../ui/RatingBadge'
import ActivityRow from '../activity/ActivityRow'
import AddResultRow from './AddResultRow'
import { apiClient } from '../../api/client'
import { useQueryClient } from '@tanstack/react-query'
import clsx from 'clsx'

// Level-based background colors matching the legacy Chauka hierarchy
// Level 4 covers Output when components are enabled (3=Component, 4=Output)
const LEVEL_STYLES: Record<number, string> = {
  1: 'bg-slate-200',    // Impact (Goal) — darkest
  2: 'bg-slate-100',    // Outcome — medium
  3: 'bg-slate-50',     // Component or Output — light
  4: 'bg-white',        // Output (when components enabled)
}

interface Props {
  result: Result
  allResults: Result[]
  logframeId: number
  depth?: number
  visibleResultIds?: Set<number> | null
}

export default function ResultRow({ result, allResults, logframeId, depth = 0, visibleResultIds }: Props) {
  const data = useLogframeStore((s) => s.data!)
  const queryClient = useQueryClient()
  const canEdit = data.canEdit
  const expanded = useUIStore((s) => s.expandedResults.has(result.id))
  const toggleResult = useUIStore((s) => s.toggleResult)

  const children = allResults
    .filter((r) => r.parent_id === result.id)
    .filter((r) => !visibleResultIds || visibleResultIds.has(r.id))
    .sort((a, b) => a.order - b.order)

  const activities = data.activities.filter((a) => a.result_id === result.id)
  const currency = data.settings?.currency ?? ''

  // Compute recursive budget total for this result and all descendants
  function getResultBudgetTotal(resultId: number): number {
    const actIds = data.activities.filter((a) => a.result_id === resultId).map((a) => a.id)
    const directBudget = data.budgetLines
      .filter((b) => actIds.includes(b.activity_id))
      .reduce((s, b) => s + (b.amount || 0), 0)
    const childResults = allResults.filter((r) => r.parent_id === resultId)
    const childBudget = childResults.reduce((s, c) => s + getResultBudgetTotal(c.id), 0)
    return directBudget + childBudget
  }
  const resultBudgetTotal = getResultBudgetTotal(result.id)

  const levelLabel = result.level !== null ? (data.levels?.[String(result.level)] ?? null) : null
  const levelBg = result.level !== null ? (LEVEL_STYLES[result.level] ?? 'bg-white') : 'bg-white'

  // Determine if this result can have child results based on max_result_level
  const maxLevel = data.conf?.max_result_level ?? 3
  const currentLevel = result.level ?? 1
  const canAddChildResults = currentLevel < maxLevel
  // Activities only attach at the leaf result level (Output)
  // When components are enabled: Output is level 4, Component is level 3 (no activities)
  // Without components: Output is level 3 (has activities)
  const isLeafLevel = currentLevel >= maxLevel

  async function saveField(field: string, value: string | number | null) {
    await apiClient.patch(
      `/app/logframes/${logframeId}/results/${result.id}`,
      { [field]: value }
    )
    queryClient.invalidateQueries({ queryKey: ['bootstrap', logframeId] })
  }

  async function addActivity() {
    await apiClient.post(
      `/app/logframes/${logframeId}/results/${result.id}/activities/`,
      { name: '' }
    )
    queryClient.invalidateQueries({ queryKey: ['bootstrap', logframeId] })
  }

  return (
    <div>
      {/* Result header row — full width with level-based background */}
      <div
        className={clsx('border-b border-gray-300', levelBg)}
        style={{ paddingLeft: `${depth * 1.5 + 0.5}rem` }}
      >
        <div className="flex items-center gap-2 px-2 py-2.5">
          {/* Toggle triangle — always visible */}
          <button
            onClick={() => toggleResult(result.id)}
            className="text-gray-600 hover:text-gray-800 w-8 h-8 flex items-center justify-center flex-shrink-0 text-sm"
            aria-label={expanded ? 'Collapse' : 'Expand'}
          >
            {expanded ? '\u25BC' : '\u25B6'}
          </button>

          {/* Level label */}
          {levelLabel && (
            <span className="text-xs font-bold text-blue-700 whitespace-nowrap hidden sm:inline min-w-[70px]">
              {levelLabel}
            </span>
          )}

          {/* Edit / Monitor buttons — hidden on mobile, visible on desktop */}
          <div className="hidden sm:flex gap-1 flex-shrink-0">
            <Link
              to={`/app/logframes/${logframeId}/design?result=${result.id}`}
              className="text-xs px-2.5 py-0.5 rounded border border-gray-400 text-gray-700 bg-white hover:bg-gray-50 whitespace-nowrap"
            >
              Edit
            </Link>
            <Link
              to={`/app/logframes/${logframeId}/monitor?result=${result.id}`}
              className="text-xs px-2.5 py-0.5 rounded border border-gray-400 text-gray-700 bg-white hover:bg-gray-50 whitespace-nowrap"
            >
              Monitor
            </Link>
          </div>

          {/* Result name */}
          <div className="flex-1 min-w-0">
            <EditableText
              value={result.name}
              onSave={(v) => saveField('name', v)}
              placeholder="Click to add title"
              className="font-semibold text-gray-900"
              disabled={!canEdit}
            />
          </div>

          {/* Budget total */}
          {resultBudgetTotal > 0 && (
            <span className="text-xs text-gray-400 flex-shrink-0 hidden sm:inline">
              {currency} {resultBudgetTotal.toLocaleString()}
            </span>
          )}

          {/* Rating badge — far right */}
          <RatingBadge
            ratingId={result.rating_id}
            ratings={data.ratings ?? []}
            onSave={(ratingId) => saveField('rating_id', ratingId)}
            disabled={!canEdit}
          />
        </div>

        {/* Mobile-only: level label + Edit/Monitor buttons below result name */}
        <div className="flex sm:hidden items-center gap-2 px-2 pb-2" style={{ paddingLeft: '2.5rem' }}>
          {levelLabel && (
            <span className="text-xs font-bold text-blue-700 whitespace-nowrap">
              {levelLabel}
            </span>
          )}
          <Link
            to={`/app/logframes/${logframeId}/design?result=${result.id}`}
            className="text-xs px-2.5 py-1 rounded border border-gray-400 text-gray-700 bg-white active:bg-gray-100 whitespace-nowrap"
          >
            Edit
          </Link>
          <Link
            to={`/app/logframes/${logframeId}/monitor?result=${result.id}`}
            className="text-xs px-2.5 py-1 rounded border border-gray-400 text-gray-700 bg-white active:bg-gray-100 whitespace-nowrap"
          >
            Monitor
          </Link>
        </div>

        {/* Description below (if present) */}
        {result.description && (
          <div
            className="text-sm text-gray-600 pb-2 px-2"
            style={{ paddingLeft: `${1.5 + 4.5 + 5}rem` }}
            dangerouslySetInnerHTML={{ __html: result.description }}
          />
        )}
      </div>

      {/* Expanded children */}
      {expanded && (
        <div>
          {/* Child results */}
          {children.map((child) => (
            <ResultRow
              key={child.id}
              result={child}
              allResults={allResults}
              logframeId={logframeId}
              depth={depth + 1}
              visibleResultIds={visibleResultIds}
            />
          ))}

          {/* Activities — only shown at leaf level (Output) */}
          {isLeafLevel && activities.map((activity) => (
            <div
              key={activity.id}
              className="border-b border-gray-200 bg-white"
              style={{ paddingLeft: `${(depth + 1) * 1.5}rem` }}
            >
              <ActivityRow
                activity={activity}
                logframeId={logframeId}
              />
            </div>
          ))}

          {/* Add child result — only if current level < max_result_level */}
          {canEdit && canAddChildResults && (
            <AddResultRow
              logframeId={logframeId}
              parentId={result.id}
              depth={depth + 1}
            />
          )}

          {/* Click to add activity — only at leaf level (Output) */}
          {canEdit && isLeafLevel && (
            <div
              className="border-b border-gray-200 px-3 py-2 text-gray-400 italic text-sm cursor-pointer hover:bg-gray-50"
              style={{ paddingLeft: `${(depth + 1) * 1.5 + 0.75}rem` }}
              onClick={addActivity}
            >
              + Click to add activity
            </div>
          )}
        </div>
      )}
    </div>
  )
}
