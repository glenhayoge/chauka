import { useState } from 'react'
import { apiClient } from '../../api/client'
import { useQueryClient } from '@tanstack/react-query'
import type { SubIndicator, Period, Target } from '../../api/types'

interface Props {
  subindicators: SubIndicator[]
  periods: Period[]
  targets: Target[]
  logframeId: number
  canEdit: boolean
}

function formatPeriod(p: Period): string {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  return `${months[p.start_month - 1]} ${p.start_year}`
}

export default function TargetsTable({ subindicators, periods, targets, logframeId, canEdit }: Props) {
  if (subindicators.length === 0 || periods.length === 0) return null

  return (
    <div className="overflow-x-auto mt-2">
      <table className="text-sm border-collapse w-full">
        <thead>
          <tr>
            <th className="border border-gray-200 bg-gray-50 px-2 py-1 text-left font-medium text-gray-600 min-w-[140px]">
              Sub-indicator
            </th>
            {periods.map((p) => (
              <th key={p.id} className="border border-gray-200 bg-gray-50 px-2 py-1 text-center font-medium text-gray-600 min-w-[80px]">
                {formatPeriod(p)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {subindicators.map((sub) => (
            <tr key={sub.id}>
              <td className="border border-gray-200 px-2 py-1 text-gray-700">{sub.name || '(unnamed)'}</td>
              {periods.map((period) => {
                const target = targets.find(
                  (t) => t.subindicator_id === sub.id && t.milestone_id === period.id
                )
                return (
                  <TargetCell
                    key={`${sub.id}-${period.id}`}
                    target={target}
                    subindicatorId={sub.id}
                    indicatorId={sub.indicator_id}
                    periodId={period.id}
                    logframeId={logframeId}
                    canEdit={canEdit}
                  />
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

interface CellProps {
  target: Target | undefined
  subindicatorId: number
  indicatorId: number
  periodId: number
  logframeId: number
  canEdit: boolean
}

function TargetCell({ target, subindicatorId, indicatorId, periodId, logframeId, canEdit }: CellProps) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(target?.value ?? '')
  const [saving, setSaving] = useState(false)
  const queryClient = useQueryClient()

  async function handleSave() {
    setEditing(false)
    const newValue = draft.trim() || null
    const oldValue = target?.value ?? null
    if (newValue === oldValue) return

    setSaving(true)
    try {
      if (target) {
        await apiClient.patch(`/logframes/${logframeId}/targets/${target.id}`, { value: newValue })
      } else {
        await apiClient.post(`/logframes/${logframeId}/targets/`, {
          indicator_id: indicatorId,
          subindicator_id: subindicatorId,
          milestone_id: periodId,
          value: newValue,
        })
      }
      queryClient.invalidateQueries({ queryKey: ['bootstrap', logframeId] })
    } finally {
      setSaving(false)
    }
  }

  if (editing) {
    return (
      <td className="border border-gray-200 p-0">
        <input
          autoFocus
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={handleSave}
          onKeyDown={(e) => {
            if (e.key === 'Enter') (e.target as HTMLInputElement).blur()
            if (e.key === 'Escape') { setDraft(target?.value ?? ''); setEditing(false) }
          }}
          className="w-full px-2 py-1 text-center border-blue-400 outline-none bg-blue-50"
        />
      </td>
    )
  }

  return (
    <td
      onClick={() => canEdit && setEditing(true)}
      className={`border border-gray-200 px-2 py-1 text-center ${
        canEdit ? 'cursor-pointer hover:bg-yellow-50' : ''
      } ${saving ? 'text-gray-400' : ''}`}
    >
      {target?.value ?? ''}
    </td>
  )
}
