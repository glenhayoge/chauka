import { useState } from 'react'
import type { Indicator, Period, Target } from '../../api/types'
import { useLogframeStore } from '../../store/logframe'
import EditableText from '../ui/EditableText'
import EditableCheckbox from '../ui/EditableCheckbox'
import DeleteButton from '../ui/DeleteButton'
import AddButton from '../ui/AddButton'
import ConfirmDialog from '../ui/ConfirmDialog'
import TargetsTable from './TargetsTable'
import { apiClient } from '../../api/client'
import { useQueryClient } from '@tanstack/react-query'

interface Props {
  indicator: Indicator
  logframeId: number
  periods: Period[]
  targets: Target[]
}

export default function IndicatorEditor({ indicator, logframeId, periods, targets }: Props) {
  const data = useLogframeStore((s) => s.data!)
  const queryClient = useQueryClient()
  const canEdit = data.canEdit
  const [deleteIndicatorOpen, setDeleteIndicatorOpen] = useState(false)
  const [deleteSubId, setDeleteSubId] = useState<number | null>(null)

  const subindicators = data.subIndicators.filter((s) => s.indicator_id === indicator.id)
  const indicatorTargets = targets.filter((t) => t.indicator_id === indicator.id)
  const base = `/app/logframes/${logframeId}/results/${indicator.result_id}/indicators/${indicator.id}`

  async function saveField(field: string, value: unknown) {
    await apiClient.patch(base, { [field]: value })
    queryClient.invalidateQueries({ queryKey: ['bootstrap', logframeId] })
  }

  async function saveSubindicator(subId: number, name: string) {
    await apiClient.patch(`${base}/subindicators/${subId}`, { name })
    queryClient.invalidateQueries({ queryKey: ['bootstrap', logframeId] })
  }

  async function addSubindicator() {
    await apiClient.post(`${base}/subindicators/`, { name: '', indicator_id: indicator.id })
    queryClient.invalidateQueries({ queryKey: ['bootstrap', logframeId] })
  }

  async function handleDeleteSubindicator() {
    if (deleteSubId === null) return
    await apiClient.delete(`${base}/subindicators/${deleteSubId}`)
    setDeleteSubId(null)
    queryClient.invalidateQueries({ queryKey: ['bootstrap', logframeId] })
  }

  async function handleDeleteIndicator() {
    await apiClient.delete(base)
    setDeleteIndicatorOpen(false)
    queryClient.invalidateQueries({ queryKey: ['bootstrap', logframeId] })
  }

  return (
    <div className="border rounded p-3 mb-3 bg-white">
      <div className="flex items-start gap-2">
        <div className="flex-1">
          <EditableText
            value={indicator.name}
            onSave={(v) => saveField('name', v)}
            placeholder="Indicator name"
            className="font-medium"
            disabled={!canEdit}
          />
        </div>
        {canEdit && <DeleteButton onClick={() => setDeleteIndicatorOpen(true)} label="Delete indicator" />}
      </div>

      <div className="mt-1 text-sm text-gray-600">
        <span className="text-gray-500 mr-1">Source:</span>
        <EditableText
          value={indicator.source_of_verification}
          onSave={(v) => saveField('source_of_verification', v)}
          placeholder="Source of verification"
          disabled={!canEdit}
        />
      </div>

      <div className="mt-1">
        <EditableCheckbox
          value={indicator.needs_baseline}
          onChange={(v) => saveField('needs_baseline', v)}
          label="Needs baseline"
          disabled={!canEdit}
        />
      </div>

      {/* Sub-indicators */}
      <div className="mt-2 ml-2">
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Sub-indicators</p>
        {subindicators.map((sub) => (
          <div key={sub.id} className="flex items-center gap-2 text-sm py-0.5">
            <span className="text-gray-400">{'\u2192'}</span>
            <EditableText
              value={sub.name}
              onSave={(v) => saveSubindicator(sub.id, v)}
              placeholder="Sub-indicator name"
              disabled={!canEdit}
            />
            {canEdit && <DeleteButton onClick={() => setDeleteSubId(sub.id)} label="Remove" />}
          </div>
        ))}
        {canEdit && <AddButton onClick={addSubindicator} label="Add sub-indicator" />}
      </div>

      {/* Targets table */}
      {subindicators.length > 0 && periods.length > 0 && (
        <div className="mt-3">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Targets</p>
          <TargetsTable
            subindicators={subindicators}
            periods={periods}
            targets={indicatorTargets}
            logframeId={logframeId}
            canEdit={canEdit}
          />
        </div>
      )}

      <ConfirmDialog
        open={deleteIndicatorOpen}
        title="Delete Indicator"
        description="This will permanently delete this indicator and all its sub-indicators and targets. This action cannot be undone."
        confirmText="Delete Indicator"
        onConfirm={handleDeleteIndicator}
        onCancel={() => setDeleteIndicatorOpen(false)}
      />
      <ConfirmDialog
        open={deleteSubId !== null}
        title="Delete Sub-indicator"
        description="This will permanently delete this sub-indicator and all its target values."
        confirmText="Delete"
        onConfirm={handleDeleteSubindicator}
        onCancel={() => setDeleteSubId(null)}
      />
    </div>
  )
}
