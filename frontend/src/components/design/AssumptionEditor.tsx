import { useState } from 'react'
import type { Assumption, RiskRating } from '../../api/types'
import { apiClient } from '../../api/client'
import { useQueryClient } from '@tanstack/react-query'
import RichTextEditor from '../ui/RichTextEditor'
import DeleteButton from '../ui/DeleteButton'
import AddButton from '../ui/AddButton'
import EditableSelect from '../ui/EditableSelect'
import ConfirmDialog from '../ui/ConfirmDialog'

interface Props {
  assumptions: Assumption[]
  riskRatings: RiskRating[]
  resultId: number
  logframeId: number
  canEdit: boolean
}

export default function AssumptionEditor({ assumptions, riskRatings, resultId, logframeId, canEdit }: Props) {
  const queryClient = useQueryClient()
  const base = `/logframes/${logframeId}/results/${resultId}/assumptions`
  const [deleteId, setDeleteId] = useState<number | null>(null)

  async function saveDescription(assumptionId: number, description: string) {
    await apiClient.patch(`${base}/${assumptionId}`, { description })
    queryClient.invalidateQueries({ queryKey: ['bootstrap', logframeId] })
  }

  async function saveRiskRating(assumptionId: number, riskRatingId: string | number | null) {
    const val = riskRatingId === null || riskRatingId === '' ? null : Number(riskRatingId)
    await apiClient.patch(`${base}/${assumptionId}`, { risk_rating_id: val })
    queryClient.invalidateQueries({ queryKey: ['bootstrap', logframeId] })
  }

  async function addAssumption() {
    await apiClient.post(`${base}/`, { description: '' })
    queryClient.invalidateQueries({ queryKey: ['bootstrap', logframeId] })
  }

  async function handleDeleteAssumption() {
    if (deleteId === null) return
    await apiClient.delete(`${base}/${deleteId}`)
    setDeleteId(null)
    queryClient.invalidateQueries({ queryKey: ['bootstrap', logframeId] })
  }

  const riskRatingOptions = riskRatings.map((r) => ({ value: r.id, label: r.name }))

  return (
    <div>
      {assumptions.length === 0 && (
        <p className="text-sm text-muted-foreground italic mb-2">No assumptions yet.</p>
      )}
      {assumptions.map((a) => (
        <div key={a.id} className="border rounded p-3 mb-2 bg-card">
          <div className="flex items-start gap-2">
            <div className="flex-1">
              <RichTextEditor
                value={a.description}
                onSave={(v) => saveDescription(a.id, v)}
                disabled={!canEdit}
              />
            </div>
            {canEdit && (
              <DeleteButton onClick={() => setDeleteId(a.id)} label="Remove assumption" />
            )}
          </div>
          {riskRatings.length > 0 && (
            <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
              <span>Risk:</span>
              <EditableSelect
                value={a.risk_rating_id}
                options={riskRatingOptions}
                onSave={(v) => saveRiskRating(a.id, v)}
                placeholder="Select risk rating"
                disabled={!canEdit}
              />
            </div>
          )}
        </div>
      ))}
      {canEdit && <AddButton onClick={addAssumption} label="Add assumption" />}

      <ConfirmDialog
        open={deleteId !== null}
        title="Delete Assumption"
        description="This will permanently delete this assumption."
        confirmText="Delete"
        onConfirm={handleDeleteAssumption}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  )
}
