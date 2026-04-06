import type { Activity } from '../../api/types'
import { useLogframeStore } from '../../store/logframe'
import EditableText from '../ui/EditableText'
import EditableNumber from '../ui/EditableNumber'
import { apiClient } from '../../api/client'
import { useQueryClient } from '@tanstack/react-query'
import { displayDate } from '../../utils/format'

interface Props {
  activity: Activity
  logframeId: string
}

export default function ActivityContainer({ activity, logframeId }: Props) {
  const data = useLogframeStore((s) => s.data!)
  const queryClient = useQueryClient()
  const canEdit = data.canEdit

  const budgetLines = data.budgetLines.filter((b) => b.activity_id === activity.id)
  const milestones = data.milestones.filter((m) => m.activity_id === activity.id)

  const totalBudget = budgetLines.reduce((sum, b) => sum + (b.amount || 0), 0)
  const currency = data.settings?.currency

  async function saveName(value: string) {
    await apiClient.patch(
      `/logframes/${logframeId}/results/${activity.result_id}/activities/${activity.id}`,
      { name: value }
    )
    queryClient.invalidateQueries({ queryKey: ['bootstrap', logframeId] })
  }

  async function saveBudgetLine(lineId: number, amount: number | null) {
    await apiClient.patch(
      `/logframes/${logframeId}/results/${activity.result_id}/activities/${activity.id}/budget-lines/${lineId}`,
      { amount }
    )
    queryClient.invalidateQueries({ queryKey: ['bootstrap', logframeId] })
  }

  return (
    <div className="ml-4 mt-2 border-l-2 border-border pl-3">
      <div className="flex items-center justify-between">
        <EditableText
          value={activity.name}
          onSave={saveName}
          placeholder="Activity name"
          className="text-sm"
          disabled={!canEdit}
        />
        <span className="text-xs text-muted-foreground ml-2">
          {currency} {totalBudget.toLocaleString()}
        </span>
      </div>

      {milestones.length > 0 && (
        <div className="mt-1 flex flex-wrap gap-1">
          {milestones.map((m) => {
            const period = data.periods.find((p) => p.id === m.period_id)
            return period ? (
              <span key={m.id} className="text-xs bg-accent text-accent-foreground px-2 py-0.5 rounded">
                {displayDate(period.start_month, period.start_year)}
                {m.description ? `: ${m.description}` : ''}
              </span>
            ) : null
          })}
        </div>
      )}

      {budgetLines.length > 0 && (
        <div className="mt-1">
          {budgetLines.map((line) => (
            <div key={line.id} className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">{line.name}:</span>
              <EditableNumber
                value={line.amount}
                onSave={(v) => saveBudgetLine(line.id, v)}
                currency={currency}
                disabled={!canEdit}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
