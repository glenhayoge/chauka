import { useState } from 'react'
import type { TALine } from '../../api/types'
import { apiClient } from '../../api/client'
import { useQueryClient } from '@tanstack/react-query'
import EditableText from '../ui/EditableText'
import EditableNumber from '../ui/EditableNumber'
import EditableSelect from '../ui/EditableSelect'
import EditableDate from '../ui/EditableDate'
import DeleteButton from '../ui/DeleteButton'
import AddButton from '../ui/AddButton'

const TA_TYPE_OPTIONS = [
  { value: 'Advisory/Policy Support', label: 'Advisory/Policy Support' },
  { value: 'Institution & Capacity Building', label: 'Institution & Capacity Building' },
  { value: 'Training & Knowledge Transfer', label: 'Training & Knowledge Transfer' },
  { value: 'Direct Implementation Support', label: 'Direct Implementation Support' },
  { value: 'Project Preparation (PPTA)', label: 'Project Preparation (PPTA)' },
  { value: 'Impact Enhancement & Sustainability', label: 'Impact Enhancement & Sustainability' },
]

const BAND_OPTIONS = [
  { value: 'Low', label: 'Low' },
  { value: 'Medium', label: 'Medium' },
  { value: 'High', label: 'High' },
]

interface Props {
  taLines: TALine[]
  activityId: number
  logframeId: number
  currency: string
  canEdit: boolean
}

export default function TALinesTable({ taLines, activityId, logframeId, currency, canEdit }: Props) {
  const queryClient = useQueryClient()
  const [adding, setAdding] = useState(false)

  const totalDays = taLines.reduce((sum, t) => sum + (t.no_days || 0), 0)
  const totalAmount = taLines.reduce((sum, t) => sum + (t.amount || 0), 0)

  const base = `/logframes/${logframeId}/talines`

  async function saveField(lineId: number, field: string, value: unknown) {
    await apiClient.patch(`${base}/${lineId}`, { [field]: value })
    queryClient.invalidateQueries({ queryKey: ['bootstrap', logframeId] })
  }

  function addLine() {
    setAdding(true)
    apiClient
      .post(`${base}/`, {
        activity_id: activityId,
        type: '',
        name: '',
        band: '',
        no_days: 0,
        amount: 0,
      })
      .then(() => queryClient.invalidateQueries({ queryKey: ['bootstrap', logframeId] }))
      .catch((err) => console.error('Failed to add TA line:', err?.response?.data ?? err))
      .finally(() => setAdding(false))
  }

  async function deleteLine(lineId: number) {
    await apiClient.delete(`${base}/${lineId}`)
    queryClient.invalidateQueries({ queryKey: ['bootstrap', logframeId] })
  }

  if (taLines.length === 0 && !canEdit) {
    return <p className="text-xs text-gray-400 italic">No TA lines</p>
  }

  return (
    <div>
      {taLines.length > 0 && (
        <div className="overflow-x-auto">
          <table className="text-xs border-collapse w-full">
            <thead>
              <tr className="bg-gray-50">
                <th className="border border-gray-200 px-2 py-1 text-left font-medium text-gray-600">Type</th>
                <th className="border border-gray-200 px-2 py-1 text-left font-medium text-gray-600">Name</th>
                <th className="border border-gray-200 px-2 py-1 text-center font-medium text-gray-600">Band</th>
                <th className="border border-gray-200 px-2 py-1 text-center font-medium text-gray-600">Start</th>
                <th className="border border-gray-200 px-2 py-1 text-center font-medium text-gray-600">End</th>
                <th className="border border-gray-200 px-2 py-1 text-right font-medium text-gray-600">Days</th>
                <th className="border border-gray-200 px-2 py-1 text-right font-medium text-gray-600">Amount</th>
                {canEdit && <th className="border border-gray-200 px-1 py-1 w-6" />}
              </tr>
            </thead>
            <tbody>
              {taLines.map((line) => (
                <tr key={line.id} className="hover:bg-gray-50">
                  <td className="border border-gray-200 px-2 py-1">
                    <EditableSelect
                      value={line.type || null}
                      options={TA_TYPE_OPTIONS}
                      onSave={(v) => saveField(line.id, 'type', v ?? '')}
                      placeholder="Select type"
                      disabled={!canEdit}
                    />
                  </td>
                  <td className="border border-gray-200 px-2 py-1">
                    <EditableText
                      value={line.name}
                      onSave={(v) => saveField(line.id, 'name', v)}
                      placeholder="Name"
                      disabled={!canEdit}
                    />
                  </td>
                  <td className="border border-gray-200 px-2 py-1 text-center">
                    <EditableSelect
                      value={line.band || null}
                      options={BAND_OPTIONS}
                      onSave={(v) => saveField(line.id, 'band', v ?? '')}
                      placeholder="—"
                      disabled={!canEdit}
                    />
                  </td>
                  <td className="border border-gray-200 px-2 py-1 text-center">
                    <EditableDate
                      value={line.start_date}
                      onSave={(v) => saveField(line.id, 'start_date', v)}
                      max={line.end_date}
                      disabled={!canEdit}
                    />
                  </td>
                  <td className="border border-gray-200 px-2 py-1 text-center">
                    <EditableDate
                      value={line.end_date}
                      onSave={(v) => saveField(line.id, 'end_date', v)}
                      min={line.start_date}
                      disabled={!canEdit}
                    />
                  </td>
                  <td className="border border-gray-200 px-2 py-1 text-right">
                    <EditableNumber
                      value={line.no_days}
                      onSave={(v) => saveField(line.id, 'no_days', v ?? 0)}
                      disabled={!canEdit}
                    />
                  </td>
                  <td className="border border-gray-200 px-2 py-1 text-right">
                    <EditableNumber
                      value={line.amount}
                      onSave={(v) => saveField(line.id, 'amount', v ?? 0)}
                      currency={currency}
                      disabled={!canEdit}
                    />
                  </td>
                  {canEdit && (
                    <td className="border border-gray-200 px-1 py-1 text-center">
                      <DeleteButton onClick={() => deleteLine(line.id)} label="Remove" />
                    </td>
                  )}
                </tr>
              ))}
              {/* Totals row */}
              <tr className="bg-gray-50 font-medium">
                <td colSpan={5} className="border border-gray-200 px-2 py-1 text-right text-gray-600">
                  Totals
                </td>
                <td className="border border-gray-200 px-2 py-1 text-right">{totalDays}</td>
                <td className="border border-gray-200 px-2 py-1 text-right">
                  {currency} {totalAmount.toLocaleString()}
                </td>
                {canEdit && <td className="border border-gray-200" />}
              </tr>
            </tbody>
          </table>
        </div>
      )}
      {canEdit && (
        <div className="mt-1">
          <AddButton onClick={addLine} label={adding ? 'Adding…' : 'Add TA line'} />
        </div>
      )}
    </div>
  )
}
