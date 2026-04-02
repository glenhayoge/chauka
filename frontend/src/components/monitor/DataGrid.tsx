import type { SubIndicator } from '../../api/types'
import { useLogframeStore } from '../../store/logframe'
import EditableText from '../ui/EditableText'
import StatusBadge from '../ui/StatusBadge'
import { apiClient } from '../../api/client'
import { useQueryClient } from '@tanstack/react-query'
import { displayDate } from '../../utils/format'

interface Props {
  logframeId: number
  subindicators: SubIndicator[]
}

export default function DataGrid({ logframeId, subindicators }: Props) {
  const data = useLogframeStore((s) => s.data!)
  const queryClient = useQueryClient()
  const canEdit = data.canEdit
  const { columns, dataEntries, periods, reportingPeriods } = data

  async function saveEntry(subId: number, colId: number, value: string) {
    const existing = dataEntries.find(
      (d) => d.subindicator_id === subId && d.column_id === colId
    )
    if (existing) {
      await apiClient.patch(`/logframes/${logframeId}/data-entries/${existing.id}`, { data: value })
    } else {
      await apiClient.post(`/logframes/${logframeId}/data-entries/`, {
        data: value,
        subindicator_id: subId,
        column_id: colId,
      })
    }
    queryClient.invalidateQueries({ queryKey: ['bootstrap', logframeId] })
  }

  return (
    <div className="overflow-x-auto">
      <table className="text-sm border-collapse w-full">
        <thead>
          <tr className="bg-gray-50">
            <th className="border px-3 py-2 text-left">Sub-indicator</th>
            {columns.map((col) => (
              <th key={col.id} className="border px-3 py-2 text-center">{col.name}</th>
            ))}
            {periods.map((p) => (
              <th key={p.id} className="border px-3 py-2 text-center text-xs">
                {displayDate(p.start_month, p.start_year)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {subindicators.map((sub) => (
            <tr key={sub.id} className="hover:bg-gray-50">
              <td className="border px-3 py-2">{sub.name || '(unnamed)'}</td>
              {columns.map((col) => {
                const entry = dataEntries.find(
                  (d) => d.subindicator_id === sub.id && d.column_id === col.id
                )
                return (
                  <td key={col.id} className="border px-3 py-2 text-center">
                    <EditableText
                      value={entry?.data ?? ''}
                      onSave={(v) => saveEntry(sub.id, col.id, v)}
                      disabled={!canEdit}
                    />
                  </td>
                )
              })}
              {periods.map((p) => {
                const rp = reportingPeriods.find(
                  (r) => r.subindicator_id === sub.id && r.period_id === p.id
                )
                return (
                  <td key={p.id} className="border px-3 py-2 text-center">
                    {rp ? <StatusBadge status={rp.status} /> : '\u2014'}
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
