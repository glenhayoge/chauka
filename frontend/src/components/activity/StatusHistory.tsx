import { useState } from 'react'
import type { StatusUpdate, StatusCode } from '../../api/types'
import { apiClient } from '../../api/client'
import { useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '../../store/auth'
import DeleteButton from '../ui/DeleteButton'
import AddButton from '../ui/AddButton'

interface Props {
  statusUpdates: StatusUpdate[]
  statusCodes: StatusCode[]
  activityId: number
  logframeId: number
  canEdit: boolean
}

export default function StatusHistory({ statusUpdates, statusCodes, activityId, logframeId, canEdit }: Props) {
  const queryClient = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [expanded, setExpanded] = useState(false)

  const sorted = [...statusUpdates].sort((a, b) => b.date.localeCompare(a.date))
  const displayed = expanded ? sorted : sorted.slice(0, 3)
  const hasMore = sorted.length > 3

  const base = `/logframes/${logframeId}/statusupdates`

  async function deleteUpdate(updateId: number) {
    await apiClient.delete(`${base}/${updateId}`)
    queryClient.invalidateQueries({ queryKey: ['bootstrap', logframeId] })
  }

  function getCodeName(codeId: number | null): string {
    if (!codeId) return '—'
    return statusCodes.find((c) => c.id === codeId)?.name ?? '—'
  }

  if (sorted.length === 0 && !canEdit) {
    return <p className="text-xs text-gray-400 italic">No status updates</p>
  }

  return (
    <div>
      {/* Add form */}
      {canEdit && showForm && (
        <AddStatusForm
          activityId={activityId}
          logframeId={logframeId}
          statusCodes={statusCodes}
          onDone={() => setShowForm(false)}
        />
      )}

      {/* Status table */}
      {sorted.length > 0 && (
        <div className="overflow-x-auto">
          <table className="text-xs border-collapse w-full">
            <thead>
              <tr className="bg-gray-50">
                <th className="border border-gray-200 px-2 py-1 text-left font-medium text-gray-600 w-24">Date</th>
                <th className="border border-gray-200 px-2 py-1 text-left font-medium text-gray-600 w-24">Status</th>
                <th className="border border-gray-200 px-2 py-1 text-left font-medium text-gray-600">Description</th>
                {canEdit && <th className="border border-gray-200 px-1 py-1 w-6" />}
              </tr>
            </thead>
            <tbody>
              {displayed.map((su) => (
                <tr key={su.id} className="hover:bg-gray-50">
                  <td className="border border-gray-200 px-2 py-1 text-gray-600 whitespace-nowrap">
                    {formatDate(su.date)}
                  </td>
                  <td className="border border-gray-200 px-2 py-1">
                    <span className="bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded text-[10px] font-medium">
                      {getCodeName(su.code_id)}
                    </span>
                  </td>
                  <td className="border border-gray-200 px-2 py-1 text-gray-700">
                    {su.description || '—'}
                  </td>
                  {canEdit && (
                    <td className="border border-gray-200 px-1 py-1 text-center">
                      <DeleteButton onClick={() => deleteUpdate(su.id)} label="Remove" />
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Show more / less */}
      {hasMore && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-[10px] text-blue-600 hover:text-blue-800 mt-1"
        >
          {expanded ? 'Show less' : `Show all ${sorted.length} updates`}
        </button>
      )}

      {canEdit && !showForm && (
        <div className="mt-1">
          <AddButton onClick={() => setShowForm(true)} label="Add status update" />
        </div>
      )}
    </div>
  )
}

interface AddFormProps {
  activityId: number
  logframeId: number
  statusCodes: StatusCode[]
  onDone: () => void
}

function AddStatusForm({ activityId, logframeId, statusCodes, onDone }: AddFormProps) {
  const queryClient = useQueryClient()
  const userId = useAuthStore((s) => s.userId)
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0])
  const [codeId, setCodeId] = useState<string>('')
  const [description, setDescription] = useState('')
  const [saving, setSaving] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      await apiClient.post(`/logframes/${logframeId}/statusupdates/`, {
        activity_id: activityId,
        user_id: userId,
        code_id: codeId ? Number(codeId) : null,
        date,
        description,
      })
      queryClient.invalidateQueries({ queryKey: ['bootstrap', logframeId] })
      onDone()
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="border rounded p-2 mb-2 bg-blue-50 space-y-2">
      <div className="flex gap-2">
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="border rounded px-2 py-1 text-xs"
          required
        />
        <select
          value={codeId}
          onChange={(e) => setCodeId(e.target.value)}
          className="border rounded px-2 py-1 text-xs flex-1"
        >
          <option value="">Select status code</option>
          {statusCodes.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>
      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Description"
        className="border rounded px-2 py-1 text-xs w-full h-16 resize-none"
      />
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={saving}
          className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {saving ? 'Saving…' : 'Save'}
        </button>
        <button
          type="button"
          onClick={onDone}
          className="px-3 py-1 bg-white text-gray-600 text-xs rounded border hover:bg-gray-50"
        >
          Cancel
        </button>
      </div>
    </form>
  )
}

function formatDate(d: string): string {
  const [year, month, day] = d.split('-')
  return `${day}/${month}/${year}`
}
