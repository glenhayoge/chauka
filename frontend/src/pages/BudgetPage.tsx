import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { useBootstrap } from '../hooks/useBootstrap'
import { useLogframeStore } from '../store/logframe'
import { useQueryClient } from '@tanstack/react-query'
import { apiClient } from '../api/client'
import TabNav from '../components/layout/TabNav'
import DeleteButton from '../components/ui/DeleteButton'
import EmptyState from '../components/ui/EmptyState'
import type { Activity, BudgetLine, Expense } from '../api/types'
import { formatDateDisplay } from '../utils/format'

export default function BudgetPage() {
  const { logframeId } = useParams<{ logframeId: string }>()
  const id = Number(logframeId)
  const { isLoading, error } = useBootstrap(id)
  const data = useLogframeStore((s) => s.data)

  if (isLoading) return <p className="text-gray-500">Loading…</p>
  if (error) return <p className="text-red-600">Failed to load data.</p>
  if (!data) return null

  const currency = data.settings?.currency ?? ''
  const activities = data.activities
  const budgetLines = data.budgetLines
  const expenses = data.expenses ?? []

  // Compute totals
  const totalBudget = budgetLines.reduce((s, b) => s + (b.amount || 0), 0)
  const totalSpent = expenses.reduce((s, e) => s + (e.amount || 0), 0)
  const totalRemaining = totalBudget - totalSpent
  const utilizationPct = totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0

  return (
    <div>
      <TabNav />
      <h2 className="text-lg font-semibold mb-4">Budget</h2>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 mb-6">
        <SummaryCard label="Total Budget" value={`${currency} ${totalBudget.toLocaleString()}`} />
        <SummaryCard label="Total Spent" value={`${currency} ${totalSpent.toLocaleString()}`} />
        <SummaryCard
          label="Remaining"
          value={`${currency} ${totalRemaining.toLocaleString()}`}
          color={totalRemaining < 0 ? 'text-red-600' : 'text-green-700'}
        />
        <SummaryCard label="Utilization" value={`${utilizationPct}%`} />
      </div>

      {/* Per-activity budget breakdown */}
      {activities.map((activity) => {
        const actBudgetLines = budgetLines.filter((b) => b.activity_id === activity.id)
        if (actBudgetLines.length === 0) return null
        return (
          <ActivityBudgetSection
            key={activity.id}
            activity={activity}
            budgetLines={actBudgetLines}
            expenses={expenses}
            currency={currency}
            logframeId={id}
            canEdit={data.canEdit}
          />
        )
      })}

      {budgetLines.length === 0 && (
        <EmptyState
          title="No budget lines yet"
          description="Add budget lines to activities from the Overview page. Expand an activity and use the Implementation Budget section to add categorised budget items."
        />
      )}
    </div>
  )
}

function SummaryCard({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="bg-white border rounded-lg p-4 text-center">
      <div className={`text-xl sm:text-2xl font-bold ${color || 'text-blue-700'}`}>{value}</div>
      <div className="text-xs sm:text-sm text-gray-500 mt-1">{label}</div>
    </div>
  )
}

interface ActivityBudgetProps {
  activity: Activity
  budgetLines: BudgetLine[]
  expenses: Expense[]
  currency: string
  logframeId: number
  canEdit: boolean
}

function ActivityBudgetSection({ activity, budgetLines, expenses, currency, logframeId, canEdit }: ActivityBudgetProps) {
  const actBudget = budgetLines.reduce((s, b) => s + (b.amount || 0), 0)
  const blIds = new Set(budgetLines.map((b) => b.id))
  const actExpenses = expenses.filter((e) => blIds.has(e.budget_line_id))
  const actSpent = actExpenses.reduce((s, e) => s + (e.amount || 0), 0)
  const pct = actBudget > 0 ? Math.round((actSpent / actBudget) * 100) : 0

  return (
    <div className="mb-6 bg-white border rounded-lg overflow-hidden">
      {/* Activity header */}
      <div className="px-4 py-3 bg-gray-50 border-b flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <h3 className="text-sm font-semibold text-gray-800">
          {activity.name || <span className="text-gray-400 italic">(unnamed activity)</span>}
        </h3>
        <div className="flex items-center gap-4 text-xs text-gray-500">
          <span>Budget: <strong className="text-gray-700">{currency} {actBudget.toLocaleString()}</strong></span>
          <span>Spent: <strong className="text-gray-700">{currency} {actSpent.toLocaleString()}</strong></span>
          <UtilizationBar pct={pct} />
        </div>
      </div>

      {/* Budget lines table */}
      <div className="overflow-x-auto">
        <table className="text-sm border-collapse w-full">
          <thead>
            <tr className="bg-gray-50">
              <th className="border-b border-gray-200 px-4 py-2 text-left font-medium text-gray-600">Budget Line</th>
              <th className="border-b border-gray-200 px-4 py-2 text-right font-medium text-gray-600">Budget</th>
              <th className="border-b border-gray-200 px-4 py-2 text-right font-medium text-gray-600">Spent</th>
              <th className="border-b border-gray-200 px-4 py-2 text-right font-medium text-gray-600">Remaining</th>
              <th className="border-b border-gray-200 px-4 py-2 text-center font-medium text-gray-600 w-24">%</th>
            </tr>
          </thead>
          <tbody>
            {budgetLines.map((bl) => {
              const blExpenses = actExpenses.filter((e) => e.budget_line_id === bl.id)
              const blSpent = blExpenses.reduce((s, e) => s + (e.amount || 0), 0)
              const blRemaining = (bl.amount || 0) - blSpent
              const blPct = bl.amount > 0 ? Math.round((blSpent / bl.amount) * 100) : 0
              return (
                <BudgetLineRow
                  key={bl.id}
                  budgetLine={bl}
                  expenses={blExpenses}
                  spent={blSpent}
                  remaining={blRemaining}
                  pct={blPct}
                  currency={currency}
                  logframeId={logframeId}
                  canEdit={canEdit}
                />
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

interface BudgetLineRowProps {
  budgetLine: BudgetLine
  expenses: Expense[]
  spent: number
  remaining: number
  pct: number
  currency: string
  logframeId: number
  canEdit: boolean
}

function BudgetLineRow({ budgetLine, expenses, spent, remaining, pct, currency, logframeId, canEdit }: BudgetLineRowProps) {
  const [expanded, setExpanded] = useState(false)
  const [showForm, setShowForm] = useState(false)

  return (
    <>
      <tr
        className="hover:bg-gray-50 cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <td className="border-b border-gray-100 px-4 py-2 text-gray-700">
          <span className="text-gray-400 text-xs mr-1">{expanded ? '▼' : '▶'}</span>
          {budgetLine.name || '(unnamed)'}
        </td>
        <td className="border-b border-gray-100 px-4 py-2 text-right text-gray-700">
          {currency} {(budgetLine.amount || 0).toLocaleString()}
        </td>
        <td className="border-b border-gray-100 px-4 py-2 text-right text-gray-700">
          {currency} {spent.toLocaleString()}
        </td>
        <td className={`border-b border-gray-100 px-4 py-2 text-right font-medium ${remaining < 0 ? 'text-red-600' : 'text-gray-700'}`}>
          {currency} {remaining.toLocaleString()}
        </td>
        <td className="border-b border-gray-100 px-4 py-2 text-center">
          <UtilizationBar pct={pct} />
        </td>
      </tr>

      {/* Expanded: show expenses and add form */}
      {expanded && (
        <tr>
          <td colSpan={5} className="border-b border-gray-200 px-4 py-2 bg-gray-50">
            {expenses.length > 0 && (
              <table className="text-xs w-full mb-2">
                <thead>
                  <tr className="text-gray-500">
                    <th className="text-left py-1 font-medium">Date</th>
                    <th className="text-left py-1 font-medium">Description</th>
                    <th className="text-right py-1 font-medium">Amount</th>
                    {canEdit && <th className="w-6" />}
                  </tr>
                </thead>
                <tbody>
                  {expenses.map((exp) => (
                    <ExpenseRow key={exp.id} expense={exp} currency={currency} logframeId={logframeId} canEdit={canEdit} />
                  ))}
                </tbody>
              </table>
            )}
            {expenses.length === 0 && !showForm && (
              <p className="text-xs text-gray-400 italic mb-2">No expenses recorded yet.</p>
            )}
            {canEdit && !showForm && (
              <button
                onClick={(e) => { e.stopPropagation(); setShowForm(true) }}
                className="text-xs text-blue-600 hover:text-blue-800"
              >
                + Add expense
              </button>
            )}
            {showForm && (
              <AddExpenseForm
                budgetLineId={budgetLine.id}
                logframeId={logframeId}
                currency={currency}
                onDone={() => setShowForm(false)}
              />
            )}
          </td>
        </tr>
      )}
    </>
  )
}

function ExpenseRow({ expense, currency, logframeId, canEdit }: { expense: Expense; currency: string; logframeId: number; canEdit: boolean }) {
  const queryClient = useQueryClient()

  async function handleDelete() {
    await apiClient.delete(`/logframes/${logframeId}/expenses/${expense.id}`)
    queryClient.invalidateQueries({ queryKey: ['bootstrap', logframeId] })
  }

  return (
    <tr className="hover:bg-white">
      <td className="py-1 text-gray-600">{formatDateDisplay(expense.date)}</td>
      <td className="py-1 text-gray-600">{expense.description || '—'}</td>
      <td className="py-1 text-right text-gray-700">{currency} {expense.amount.toLocaleString()}</td>
      {canEdit && (
        <td className="py-1 text-center">
          <DeleteButton onClick={handleDelete} label="Remove" />
        </td>
      )}
    </tr>
  )
}

function AddExpenseForm({ budgetLineId, logframeId, currency, onDone }: { budgetLineId: number; logframeId: number; currency: string; onDone: () => void }) {
  const queryClient = useQueryClient()
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0])
  const [saving, setSaving] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!amount || !date) return
    setSaving(true)
    try {
      await apiClient.post(`/logframes/${logframeId}/expenses/`, {
        budget_line_id: budgetLineId,
        amount: parseFloat(amount),
        description,
        date,
      })
      queryClient.invalidateQueries({ queryKey: ['bootstrap', logframeId] })
      onDone()
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-wrap gap-2 items-end mt-1" onClick={(e) => e.stopPropagation()}>
      <div>
        <label className="block text-[10px] text-gray-500 mb-0.5">Date</label>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="border border-gray-300 rounded px-2 py-1 text-xs"
          required
        />
      </div>
      <div>
        <label className="block text-[10px] text-gray-500 mb-0.5">Amount ({currency})</label>
        <input
          type="number"
          step="0.01"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="border border-gray-300 rounded px-2 py-1 text-xs w-24"
          required
        />
      </div>
      <div className="flex-1 min-w-[120px]">
        <label className="block text-[10px] text-gray-500 mb-0.5">Description</label>
        <input
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Optional"
          className="border border-gray-300 rounded px-2 py-1 text-xs w-full"
        />
      </div>
      <button
        type="submit"
        disabled={saving}
        className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 disabled:opacity-50"
      >
        {saving ? 'Saving…' : 'Add'}
      </button>
      <button
        type="button"
        onClick={onDone}
        className="px-3 py-1 text-gray-500 text-xs rounded border hover:bg-gray-50"
      >
        Cancel
      </button>
    </form>
  )
}

function UtilizationBar({ pct }: { pct: number }) {
  const color = pct >= 100 ? 'bg-red-500' : pct >= 75 ? 'bg-yellow-500' : 'bg-green-500'
  return (
    <div className="inline-flex items-center gap-1.5">
      <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${Math.min(pct, 100)}%` }} />
      </div>
      <span className="text-xs text-gray-500 w-8">{pct}%</span>
    </div>
  )
}

