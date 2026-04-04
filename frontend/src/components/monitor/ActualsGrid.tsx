import { useState } from 'react'
import type { Indicator, SubIndicator, Period, Target, Column, DataEntry, ReportingPeriod } from '../../api/types'
import { apiClient } from '../../api/client'
import { useQueryClient } from '@tanstack/react-query'
import EditableText from '../ui/EditableText'
import StatusBadge from '../ui/StatusBadge'
import RichTextEditor from '../ui/RichTextEditor'
import AddButton from '../ui/AddButton'
import ConfirmDialog from '../ui/ConfirmDialog'
import { displayDate } from '../../utils/format'

interface Props {
  indicator: Indicator
  subindicators: SubIndicator[]
  periods: Period[]
  targets: Target[]
  columns: Column[]
  dataEntries: DataEntry[]
  reportingPeriods: ReportingPeriod[]
  logframeId: number
  canEdit: boolean
}

function findTarget(targets: Target[], subId: number, periodId: number): Target | undefined {
  return targets.find((t) => t.subindicator_id === subId && t.milestone_id === periodId)
}

function getCurrentPeriodIndex(periods: Period[]): number {
  const now = new Date()
  const nowNum = now.getFullYear() * 12 + (now.getMonth() + 1)
  for (let i = 0; i < periods.length; i++) {
    const endNum = periods[i].end_year * 12 + periods[i].end_month
    if (endNum >= nowNum) return i
  }
  return periods.length - 1
}

export default function ActualsGrid({
  indicator,
  subindicators,
  periods,
  targets,
  columns,
  dataEntries,
  reportingPeriods,
  logframeId,
  canEdit,
}: Props) {
  const queryClient = useQueryClient()
  const [expandedCells, setExpandedCells] = useState<Set<string>>(new Set())
  const [deleteColumnId, setDeleteColumnId] = useState<number | null>(null)

  if (subindicators.length === 0) return null

  const sortedPeriods = [...periods].sort(
    (a, b) => a.start_year * 12 + a.start_month - (b.start_year * 12 + b.start_month)
  )

  const currentIdx = getCurrentPeriodIndex(sortedPeriods)
  const baselinePeriod = sortedPeriods[0] ?? null
  const nextPeriod = sortedPeriods[currentIdx] ?? sortedPeriods[sortedPeriods.length - 1] ?? null

  // Show last 3 columns (measurement dates) by default
  const recentColumns = columns.slice(-3)

  async function saveDataEntry(subId: number, colId: number, value: string) {
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

  async function saveColumnName(colId: number, name: string) {
    await apiClient.patch(`/logframes/${logframeId}/columns/${colId}`, { name })
    queryClient.invalidateQueries({ queryKey: ['bootstrap', logframeId] })
  }

  async function handleDeleteColumn() {
    if (deleteColumnId === null) return
    await apiClient.delete(`/logframes/${logframeId}/columns/${deleteColumnId}`)
    setDeleteColumnId(null)
    queryClient.invalidateQueries({ queryKey: ['bootstrap', logframeId] })
  }

  async function addColumn() {
    const today = new Date()
    const name = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
    await apiClient.post(`/logframes/${logframeId}/columns/`, { name })
    queryClient.invalidateQueries({ queryKey: ['bootstrap', logframeId] })
  }

  async function saveReportingPeriodStatus(subId: number, periodId: number, status: string) {
    const existing = reportingPeriods.find(
      (r) => r.subindicator_id === subId && r.period_id === periodId
    )
    if (existing) {
      await apiClient.patch(`/logframes/${logframeId}/reporting-periods/${existing.id}`, { status })
    } else {
      await apiClient.post(`/logframes/${logframeId}/reporting-periods/`, {
        subindicator_id: subId,
        period_id: periodId,
        status,
      })
    }
    queryClient.invalidateQueries({ queryKey: ['bootstrap', logframeId] })
  }

  function toggleEvidence(key: string) {
    setExpandedCells((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  const statusOptions: Array<'OK' | 'WARNING' | 'DANGER'> = ['OK', 'WARNING', 'DANGER']

  return (
    <div className="mb-6">
      <h4 className="text-sm font-medium text-muted-foreground mb-2">
        {indicator.name || '(unnamed indicator)'}
      </h4>
      <div className="overflow-x-auto">
        <table className="text-sm border-collapse w-full">
          <thead>
            <tr className="bg-muted">
              <th className="border border-border px-3 py-2 text-left font-medium text-muted-foreground min-w-[140px]">
                Sub-indicator
              </th>
              {baselinePeriod && (
                <th className="border border-border px-3 py-2 text-center font-medium text-muted-foreground bg-accent min-w-[80px]">
                  <div className="text-xs">Baseline</div>
                  <div className="text-[10px] text-muted-foreground">{displayDate(baselinePeriod.start_month, baselinePeriod.start_year)}</div>
                </th>
              )}
              {nextPeriod && nextPeriod !== baselinePeriod && (
                <th className="border border-border px-3 py-2 text-center font-medium text-muted-foreground bg-ok/10 min-w-[80px]">
                  <div className="text-xs">Next Target</div>
                  <div className="text-[10px] text-muted-foreground">{displayDate(nextPeriod.start_month, nextPeriod.start_year)}</div>
                </th>
              )}
              {recentColumns.map((col) => (
                <th key={col.id} className="border border-border px-3 py-2 text-center min-w-[100px]">
                  <div className="flex items-center justify-center gap-1">
                    <EditableText
                      value={col.name}
                      onSave={(v) => saveColumnName(col.id, v)}
                      placeholder="Date"
                      className="text-xs font-medium"
                      disabled={!canEdit}
                    />
                    {canEdit && (
                      <button
                        onClick={() => setDeleteColumnId(col.id)}
                        className="text-muted-foreground hover:text-destructive text-xs flex-shrink-0"
                        title="Delete column"
                      >
                        &times;
                      </button>
                    )}
                  </div>
                </th>
              ))}
              <th className="border border-border px-3 py-2 text-center font-medium text-muted-foreground min-w-[80px]">
                Rating
              </th>
              {canEdit && (
                <th className="border border-border px-1 py-2 bg-muted w-8" />
              )}
            </tr>
          </thead>
          <tbody>
            {subindicators.map((sub) => {
              const baselineTarget = baselinePeriod
                ? findTarget(targets, sub.id, baselinePeriod.id)
                : undefined
              const nextTarget = nextPeriod && nextPeriod !== baselinePeriod
                ? findTarget(targets, sub.id, nextPeriod.id)
                : undefined
              const latestRp = nextPeriod
                ? reportingPeriods.find((r) => r.subindicator_id === sub.id && r.period_id === nextPeriod.id)
                : undefined

              return (
                <SubIndicatorRow
                  key={sub.id}
                  sub={sub}
                  baselineTarget={baselineTarget}
                  nextTarget={nextTarget}
                  hasBaseline={!!baselinePeriod}
                  hasNextTarget={!!nextPeriod && nextPeriod !== baselinePeriod}
                  recentColumns={recentColumns}
                  dataEntries={dataEntries}
                  latestRp={latestRp}
                  nextPeriodId={nextPeriod?.id ?? null}
                  expandedCells={expandedCells}
                  toggleEvidence={toggleEvidence}
                  onSaveEntry={saveDataEntry}
                  onSaveStatus={(status) =>
                    nextPeriod && saveReportingPeriodStatus(sub.id, nextPeriod.id, status)
                  }
                  statusOptions={statusOptions}
                  canEdit={canEdit}
                />
              )
            })}
          </tbody>
        </table>
      </div>
      {canEdit && (
        <div className="mt-2">
          <AddButton onClick={addColumn} label="Add measurement column" />
        </div>
      )}

      <ConfirmDialog
        open={deleteColumnId !== null}
        title="Delete Measurement Column"
        description="This will permanently delete this column and all its data entries. This action cannot be undone."
        confirmText="Delete Column"
        onConfirm={handleDeleteColumn}
        onCancel={() => setDeleteColumnId(null)}
      />
    </div>
  )
}

interface SubIndicatorRowProps {
  sub: SubIndicator
  baselineTarget: Target | undefined
  nextTarget: Target | undefined
  hasBaseline: boolean
  hasNextTarget: boolean
  recentColumns: Column[]
  dataEntries: DataEntry[]
  latestRp: ReportingPeriod | undefined
  nextPeriodId: number | null
  expandedCells: Set<string>
  toggleEvidence: (key: string) => void
  onSaveEntry: (subId: number, colId: number, value: string) => Promise<void>
  onSaveStatus: (status: string) => void
  statusOptions: Array<'OK' | 'WARNING' | 'DANGER'>
  canEdit: boolean
}

function SubIndicatorRow({
  sub,
  baselineTarget,
  nextTarget,
  hasBaseline,
  hasNextTarget,
  recentColumns,
  dataEntries,
  latestRp,
  expandedCells,
  toggleEvidence,
  onSaveEntry,
  onSaveStatus,
  statusOptions,
  canEdit,
}: SubIndicatorRowProps) {
  return (
    <>
      <tr className="hover:bg-muted">
        <td className="border border-border px-3 py-2 text-foreground font-medium">
          {sub.name || '(unnamed)'}
        </td>

        {/* Baseline column (read-only) */}
        {hasBaseline && (
          <td className="border border-border px-3 py-2 text-center bg-accent text-muted-foreground">
            {baselineTarget?.value ?? <span className="text-muted-foreground">&mdash;</span>}
          </td>
        )}

        {/* Next target column (read-only) */}
        {hasNextTarget && (
          <td className="border border-border px-3 py-2 text-center bg-ok/10 text-muted-foreground">
            {nextTarget?.value ?? <span className="text-muted-foreground">&mdash;</span>}
          </td>
        )}

        {/* Actual value columns (editable) */}
        {recentColumns.map((col) => {
          const entry = dataEntries.find(
            (d) => d.subindicator_id === sub.id && d.column_id === col.id
          )
          const cellKey = `${sub.id}-${col.id}`
          const isExpanded = expandedCells.has(cellKey)
          return (
            <td key={col.id} className="border border-border px-3 py-2 text-center">
              <div className="flex items-center justify-center gap-1">
                <EditableText
                  value={entry?.data ?? ''}
                  onSave={(v) => onSaveEntry(sub.id, col.id, v)}
                  placeholder="—"
                  disabled={!canEdit}
                />
                <button
                  onClick={() => toggleEvidence(cellKey)}
                  className={`text-[10px] flex-shrink-0 ${isExpanded ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}
                  title="Toggle evidence"
                >
                  {isExpanded ? '▼' : '▶'}
                </button>
              </div>
            </td>
          )
        })}

        {/* Rating column */}
        <td className="border border-border px-3 py-2 text-center">
          {canEdit ? (
            <StatusPicker
              current={latestRp?.status ?? null}
              options={statusOptions}
              onSave={onSaveStatus}
            />
          ) : (
            latestRp ? <StatusBadge status={latestRp.status} /> : <span className="text-muted-foreground">&mdash;</span>
          )}
        </td>

        {canEdit && <td className="border border-border" />}
      </tr>

      {/* Evidence expansion rows */}
      {recentColumns.map((col) => {
        const cellKey = `${sub.id}-${col.id}`
        if (!expandedCells.has(cellKey)) return null
        return (
          <EvidenceRow
            key={`evidence-${cellKey}`}
            colSpan={
              (hasBaseline ? 1 : 0) +
              (hasNextTarget ? 1 : 0) +
              recentColumns.length +
              2 +
              (canEdit ? 1 : 0)
            }
            canEdit={canEdit}
          />
        )
      })}
    </>
  )
}

interface StatusPickerProps {
  current: 'OK' | 'WARNING' | 'DANGER' | null
  options: Array<'OK' | 'WARNING' | 'DANGER'>
  onSave: (status: string) => void
}

function StatusPicker({ current, options, onSave }: StatusPickerProps) {
  const [open, setOpen] = useState(false)

  return (
    <div className="relative inline-block">
      <button
        onClick={() => setOpen(!open)}
        className="cursor-pointer"
      >
        {current ? <StatusBadge status={current} /> : <span className="text-muted-foreground text-xs">Set rating</span>}
      </button>
      {open && (
        <div className="absolute right-0 top-6 z-10 bg-card border border-border rounded shadow-lg py-1 min-w-[100px]">
          {options.map((opt) => (
            <button
              key={opt}
              onClick={() => { onSave(opt); setOpen(false) }}
              className="flex items-center gap-2 w-full px-3 py-1 text-sm hover:bg-muted"
            >
              <StatusBadge status={opt} />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

interface EvidenceRowProps {
  colSpan: number
  canEdit: boolean
}

function EvidenceRow({ colSpan, canEdit }: EvidenceRowProps) {
  const [evidence, setEvidence] = useState('')

  return (
    <tr className="bg-warning/10">
      <td colSpan={colSpan} className="border border-border px-3 py-2">
        <div className="text-xs text-muted-foreground mb-1">Evidence / Notes</div>
        <RichTextEditor
          value={evidence}
          onSave={setEvidence}
          disabled={!canEdit}
        />
      </td>
    </tr>
  )
}
