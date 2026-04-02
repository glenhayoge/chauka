import { useState } from 'react'
import type { Activity, BudgetLine } from '../../api/types'
import { useLogframeStore } from '../../store/logframe'
import EditableText from '../ui/EditableText'
import EditableNumber from '../ui/EditableNumber'
import AddButton from '../ui/AddButton'
import DeleteButton from '../ui/DeleteButton'
import TALinesTable from './TALinesTable'
import ResourcesTable from './ResourcesTable'
import StatusHistory from './StatusHistory'
import { apiClient } from '../../api/client'
import { useQueryClient } from '@tanstack/react-query'
import { BUDGET_CATEGORIES } from '../../utils/budgetCategories'

interface Props {
  activity: Activity
  logframeId: number
}

export default function ActivityDetail({ activity, logframeId }: Props) {
  const data = useLogframeStore((s) => s.data!)
  const queryClient = useQueryClient()
  const canEdit = data.canEdit

  const budgetLines = data.budgetLines.filter((b) => b.activity_id === activity.id)
  const taLines = (data.taLines ?? []).filter((t) => t.activity_id === activity.id)
  const resources = (data.resources ?? []).filter((r) => r.activity_id === activity.id)
  const statusUpdates = (data.statusUpdates ?? []).filter((s) => s.activity_id === activity.id)
  const totalBudget = budgetLines.reduce((sum, b) => sum + (b.amount || 0), 0)
  const currency = data.settings?.currency ?? ''

  const activityBase = `/app/logframes/${logframeId}/results/${activity.result_id}/activities/${activity.id}`

  async function saveBudgetLine(lineId: number, field: string, value: unknown) {
    await apiClient.patch(`${activityBase}/budget-lines/${lineId}`, { [field]: value })
    queryClient.invalidateQueries({ queryKey: ['bootstrap', logframeId] })
  }

  async function addBudgetLine(category: string, name: string, amount: number) {
    await apiClient.post(`${activityBase}/budget-lines/`, { category, name, amount })
    queryClient.invalidateQueries({ queryKey: ['bootstrap', logframeId] })
  }

  async function deleteBudgetLine(lineId: number) {
    await apiClient.delete(`${activityBase}/budget-lines/${lineId}`)
    queryClient.invalidateQueries({ queryKey: ['bootstrap', logframeId] })
  }

  // Group budget lines by category
  const grouped = new Map<string, BudgetLine[]>()
  for (const line of budgetLines) {
    const cat = line.category || 'Uncategorized'
    if (!grouped.has(cat)) grouped.set(cat, [])
    grouped.get(cat)!.push(line)
  }

  return (
    <div className="ml-7 mb-2 border-l-2 border-amber-300 pl-4 py-2 space-y-4">
      {/* Technical Assistance */}
      <div>
        <h4 className="text-xs font-bold text-gray-600 uppercase tracking-wider mb-1">
          Technical Assistance
        </h4>
        <TALinesTable
          taLines={taLines}
          activityId={activity.id}
          logframeId={logframeId}
          currency={currency}
          canEdit={canEdit}
        />
      </div>

      {/* Resources */}
      <div>
        <h4 className="text-xs font-bold text-gray-600 uppercase tracking-wider mb-1">
          Resources
        </h4>
        <ResourcesTable
          resources={resources}
          activityId={activity.id}
          logframeId={logframeId}
          canEdit={canEdit}
        />
      </div>

      {/* Implementation Budget */}
      <div>
        <h4 className="text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">
          Implementation Budget
        </h4>

        {/* Grouped budget lines */}
        {Array.from(grouped.entries()).map(([category, lines]) => {
          const catTotal = lines.reduce((s, l) => s + (l.amount || 0), 0)
          return (
            <div key={category} className="mb-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-semibold text-gray-500">{category}</span>
                <span className="text-xs text-gray-400">{currency} {catTotal.toLocaleString()}</span>
              </div>
              {lines.map((line) => (
                <div key={line.id} className="flex items-center gap-3 text-sm py-0.5 pl-3">
                  <span className="text-gray-700 min-w-[140px]">
                    <EditableText
                      value={line.name}
                      onSave={(v) => saveBudgetLine(line.id, 'name', v)}
                      placeholder="Item name"
                      className="text-sm"
                      disabled={!canEdit}
                    />
                  </span>
                  <EditableNumber
                    value={line.amount}
                    onSave={(v) => saveBudgetLine(line.id, 'amount', v)}
                    currency={currency}
                    disabled={!canEdit}
                  />
                  {canEdit && (
                    <DeleteButton onClick={() => deleteBudgetLine(line.id)} label="Remove" />
                  )}
                </div>
              ))}
            </div>
          )
        })}

        {budgetLines.length === 0 && (
          <p className="text-xs text-gray-400 italic mb-2">No budget lines yet.</p>
        )}

        {budgetLines.length > 0 && (
          <div className="text-sm font-medium text-gray-700 pt-1 mt-1 border-t border-gray-200">
            Activity Total: {currency} {totalBudget.toLocaleString()}
          </div>
        )}

        {canEdit && (
          <AddBudgetLineForm currency={currency} onAdd={addBudgetLine} />
        )}
      </div>

      {/* Status History */}
      <div>
        <h4 className="text-xs font-bold text-gray-600 uppercase tracking-wider mb-1">
          Status History
        </h4>
        <StatusHistory
          statusUpdates={statusUpdates}
          statusCodes={data.statusCodes}
          activityId={activity.id}
          logframeId={logframeId}
          canEdit={canEdit}
        />
      </div>
    </div>
  )
}

function AddBudgetLineForm({ currency, onAdd }: { currency: string; onAdd: (category: string, name: string, amount: number) => Promise<void> }) {
  const [open, setOpen] = useState(false)
  const [category, setCategory] = useState('')
  const [name, setName] = useState('')
  const [amount, setAmount] = useState('')
  const [saving, setSaving] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!category || !name.trim() || !amount) return
    setSaving(true)
    try {
      await onAdd(category, name.trim(), parseFloat(amount))
      setCategory('')
      setName('')
      setAmount('')
      setOpen(false)
    } finally {
      setSaving(false)
    }
  }

  if (!open) {
    return (
      <div className="mt-1">
        <AddButton onClick={() => setOpen(true)} label="Add budget line" />
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="mt-2 border rounded p-3 bg-blue-50 space-y-2">
      <div className="flex flex-wrap gap-2">
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          required
          className="border rounded px-2 py-1 text-xs flex-1 min-w-[160px]"
        >
          <option value="">Select category</option>
          {BUDGET_CATEGORIES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Item name"
          required
          className="border rounded px-2 py-1 text-xs flex-1 min-w-[120px]"
        />
        <input
          type="number"
          step="0.01"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder={`Amount (${currency})`}
          required
          className="border rounded px-2 py-1 text-xs w-28"
        />
      </div>
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={saving || !category || !name.trim() || !amount}
          className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {saving ? 'Adding...' : 'Add'}
        </button>
        <button
          type="button"
          onClick={() => { setOpen(false); setCategory(''); setName(''); setAmount('') }}
          className="px-3 py-1 text-gray-500 text-xs rounded border hover:bg-gray-50"
        >
          Cancel
        </button>
      </div>
    </form>
  )
}
