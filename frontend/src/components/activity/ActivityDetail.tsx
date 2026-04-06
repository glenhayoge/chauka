import { useState } from 'react'
import type { Activity, BudgetLine, Milestone } from '../../api/types'
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
import { displayDate } from '../../utils/format'

interface Props {
  activity: Activity
  logframeId: string
}

export default function ActivityDetail({ activity, logframeId }: Props) {
  const data = useLogframeStore((s) => s.data!)
  const queryClient = useQueryClient()
  const canEdit = data.canEdit

  const budgetLines = data.budgetLines.filter((b) => b.activity_id === activity.id)
  const taLines = (data.taLines ?? []).filter((t) => t.activity_id === activity.id)
  const resources = (data.resources ?? []).filter((r) => r.activity_id === activity.id)
  const statusUpdates = (data.statusUpdates ?? []).filter((s) => s.activity_id === activity.id)
  const milestones = data.milestones.filter((m) => m.activity_id === activity.id)
  const totalBudget = budgetLines.reduce((sum, b) => sum + (b.amount || 0), 0)
  const currency = data.settings?.currency ?? ''

  const activityBase = `/logframes/${logframeId}/results/${activity.result_id}/activities/${activity.id}`

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

  async function addMilestone(periodId: number, description: string) {
    await apiClient.post(`${activityBase}/milestones/`, { activity_id: activity.id, period_id: periodId, description })
    queryClient.invalidateQueries({ queryKey: ['bootstrap', logframeId] })
  }

  async function saveMilestone(milestoneId: number, field: string, value: unknown) {
    await apiClient.patch(`${activityBase}/milestones/${milestoneId}`, { [field]: value })
    queryClient.invalidateQueries({ queryKey: ['bootstrap', logframeId] })
  }

  async function deleteMilestone(milestoneId: number) {
    await apiClient.delete(`${activityBase}/milestones/${milestoneId}`)
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
        <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">
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

      {/* Milestones */}
      <div>
        <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">
          Milestones
        </h4>
        <MilestonesSection
          milestones={milestones}
          periods={data.periods}
          canEdit={canEdit}
          onAdd={addMilestone}
          onSave={saveMilestone}
          onDelete={deleteMilestone}
        />
      </div>

      {/* Resources */}
      <div>
        <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">
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
        <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">
          Implementation Budget
        </h4>

        {/* Grouped budget lines */}
        {Array.from(grouped.entries()).map(([category, lines]) => {
          const catTotal = lines.reduce((s, l) => s + (l.amount || 0), 0)
          return (
            <div key={category} className="mb-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-semibold text-muted-foreground">{category}</span>
                <span className="text-xs text-muted-foreground">{currency} {catTotal.toLocaleString()}</span>
              </div>
              {lines.map((line) => (
                <div key={line.id} className="flex items-center gap-3 text-sm py-0.5 pl-3">
                  <span className="text-foreground min-w-[140px]">
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
          <p className="text-xs text-muted-foreground italic mb-2">No budget lines yet.</p>
        )}

        {budgetLines.length > 0 && (
          <div className="text-sm font-medium text-foreground pt-1 mt-1 border-t border-border">
            Activity Total: {currency} {totalBudget.toLocaleString()}
          </div>
        )}

        {canEdit && (
          <AddBudgetLineForm currency={currency} onAdd={addBudgetLine} />
        )}
      </div>

      {/* Status History */}
      <div>
        <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">
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
    <form onSubmit={handleSubmit} className="mt-2 border rounded p-3 bg-accent space-y-2">
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
          className="px-3 py-1 bg-primary text-background text-xs rounded hover:bg-primary/80 disabled:opacity-50"
        >
          {saving ? 'Adding...' : 'Add'}
        </button>
        <button
          type="button"
          onClick={() => { setOpen(false); setCategory(''); setName(''); setAmount('') }}
          className="px-3 py-1 text-muted-foreground text-xs rounded border hover:bg-muted"
        >
          Cancel
        </button>
      </div>
    </form>
  )
}

function MilestonesSection({
  milestones,
  periods,
  canEdit,
  onAdd,
  onSave,
  onDelete,
}: {
  milestones: Milestone[]
  periods: { id: number; start_month: number; start_year: number; end_month: number; end_year: number }[]
  canEdit: boolean
  onAdd: (periodId: number, description: string) => Promise<void>
  onSave: (milestoneId: number, field: string, value: unknown) => Promise<void>
  onDelete: (milestoneId: number) => Promise<void>
}) {
  const [adding, setAdding] = useState(false)
  const [selectedPeriod, setSelectedPeriod] = useState('')
  const [description, setDescription] = useState('')
  const [saving, setSaving] = useState(false)

  const assignedPeriodIds = new Set(milestones.map((m) => m.period_id))
  const availablePeriods = periods.filter((p) => !assignedPeriodIds.has(p.id))

  async function handleAdd() {
    if (!selectedPeriod) return
    setSaving(true)
    try {
      await onAdd(parseInt(selectedPeriod), description.trim())
      setSelectedPeriod('')
      setDescription('')
      setAdding(false)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      {milestones.length === 0 && !adding && (
        <p className="text-xs text-muted-foreground italic mb-1">No milestones set.</p>
      )}

      {milestones.length > 0 && (
        <div className="overflow-x-auto">
          <table className="text-xs border-collapse w-full">
            <thead>
              <tr className="bg-muted">
                <th className="border border-border px-2 py-1 text-left font-medium text-muted-foreground">Period</th>
                <th className="border border-border px-2 py-1 text-left font-medium text-muted-foreground">Description</th>
                {canEdit && <th className="border border-border px-1 py-1 w-6" />}
              </tr>
            </thead>
            <tbody>
              {milestones.map((m) => {
                const period = periods.find((p) => p.id === m.period_id)
                if (!period) return null
                return (
                  <tr key={m.id} className="hover:bg-muted">
                    <td className="border border-border px-2 py-1 whitespace-nowrap">
                      <span className="text-primary">
                        {displayDate(period.start_month, period.start_year)}
                        {' – '}
                        {displayDate(period.end_month, period.end_year)}
                      </span>
                    </td>
                    <td className="border border-border px-2 py-1">
                      <EditableText
                        value={m.description}
                        onSave={(v) => onSave(m.id, 'description', v)}
                        placeholder="e.g. Survey instrument finalised"
                        className="text-xs"
                        disabled={!canEdit}
                      />
                    </td>
                    {canEdit && (
                      <td className="border border-border px-1 py-1 text-center">
                        <DeleteButton onClick={() => onDelete(m.id)} label="Remove" />
                      </td>
                    )}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {canEdit && !adding && availablePeriods.length > 0 && (
        <div className="mt-1">
          <AddButton onClick={() => setAdding(true)} label="Add milestone" />
        </div>
      )}

      {adding && (
        <div className="mt-2 border rounded p-3 bg-accent space-y-2">
          <div className="flex flex-wrap gap-2">
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              required
              className="border rounded px-2 py-1 text-xs flex-1 min-w-[180px]"
            >
              <option value="">Select period</option>
              {availablePeriods.map((p) => (
                <option key={p.id} value={p.id}>
                  {displayDate(p.start_month, p.start_year)} – {displayDate(p.end_month, p.end_year)}
                </option>
              ))}
            </select>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Description (e.g. Data collection complete)"
              className="border rounded px-2 py-1 text-xs flex-1 min-w-[200px]"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleAdd}
              disabled={saving || !selectedPeriod}
              className="px-3 py-1 bg-primary text-background text-xs rounded hover:bg-primary/80 disabled:opacity-50"
            >
              {saving ? 'Adding...' : 'Add'}
            </button>
            <button
              onClick={() => { setAdding(false); setSelectedPeriod(''); setDescription('') }}
              className="px-3 py-1 text-muted-foreground text-xs rounded border hover:bg-muted"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
