import { useState } from 'react'
import { useParams, useSearchParams, useNavigate, Link } from 'react-router-dom'
import { useBootstrap } from '../hooks/useBootstrap'
import { useLogframeStore } from '../store/logframe'
import { useQueryClient } from '@tanstack/react-query'
import { apiClient } from '../api/client'
import clsx from 'clsx'
import KoboSettings from '../components/integrations/KoboSettings'
import GoogleSheetsSettings from '../components/integrations/GoogleSheetsSettings'

const TABS = [
  { key: 'logframe', label: 'Logframe' },
  { key: 'integrations', label: 'Integrations' },
] as const

type TabKey = (typeof TABS)[number]['key']

export default function SettingsPage() {
  const { logframeId } = useParams<{ logframeId: string }>()
  const id = Number(logframeId)
  const { isLoading, error } = useBootstrap(id)
  const data = useLogframeStore((s) => s.data)
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

  const tabParam = searchParams.get('tab') as TabKey | null
  const activeTab: TabKey = TABS.some((t) => t.key === tabParam) ? tabParam! : 'logframe'

  function setTab(key: TabKey) {
    navigate(`/app/logframes/${id}/settings?tab=${key}`, { replace: true })
  }

  if (isLoading) return <p className="text-muted-foreground">Loading…</p>
  if (error) return <p className="text-destructive">Failed to load data.</p>
  if (!data) return null

  return (
    <div>
      {/* <h2 className="text-lg font-semibold mb-4">Settings</h2> */}

      {/* Tab bar */}
      <div className="flex overflow-x-auto border-b border-border mb-6 -mx-3 px-3 sm:mx-0 sm:px-0">
        {TABS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={clsx(
              'px-4 sm:px-6 py-2.5 text-sm font-medium border-b-2 -mb-px whitespace-nowrap',
              activeTab === key
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground',
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Link to org settings */}
      {data.orgContext && (
        <div className="mb-6 text-right">
          <Link
            to={`/organisations/${data.orgContext.organisation.id}/settings?tab=programs`}
            className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Manage programs &amp; projects &rarr;
          </Link>
        </div>
      )}

      {/* Tab content */}
      {activeTab === 'logframe' && (
        <LogframeSettingsPanel logframeId={id} canEdit={data.canEdit} />
      )}
      {activeTab === 'integrations' && (
        <div className="space-y-6">
          <KoboSettings logframeId={id} canEdit={data.canEdit} />
          <GoogleSheetsSettings logframeId={id} canEdit={data.canEdit} />
        </div>
      )}
    </div>
  )
}

function LogframeSettingsPanel({ logframeId, canEdit }: { logframeId: number; canEdit: boolean }) {
  const data = useLogframeStore((s) => s.data)
  const queryClient = useQueryClient()

  if (!data?.settings) {
    return <p className="text-sm text-muted-foreground italic">No logframe settings configured.</p>
  }

  const settings = data.settings
  const logframe = data.logframe

  async function saveSetting(field: string, value: string | number) {
    if (!canEdit) return
    await apiClient.patch(`/logframes/${logframeId}/settings/`, { [field]: value })
    queryClient.invalidateQueries({ queryKey: ['bootstrap', logframeId] })
  }

  async function saveLogframeName(value: string) {
    if (!canEdit || !value.trim()) return
    await apiClient.patch(`/logframes/${logframeId}`, { name: value.trim() })
    queryClient.invalidateQueries({ queryKey: ['bootstrap', logframeId] })
    queryClient.invalidateQueries({ queryKey: ['logframes'] })
  }

  return (
    <div className="space-y-6">
      {/* Logframe name */}
      <div className="border border-border rounded-md p-4">
        <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide mb-3">
          Logframe
        </h3>
        <SettingField
          label="Name"
          value={logframe.name}
          onSave={saveLogframeName}
          canEdit={canEdit}
        />
      </div>

      {/* Logframe configuration */}
      <div className="bg-card border rounded-lg p-4">
        <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide mb-3">
          Logframe Configuration
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <SettingField
            label="Start Year"
            value={String(settings.start_year)}
            type="number"
            onSave={(v) => saveSetting('start_year', parseInt(v))}
            canEdit={canEdit}
          />
          <SettingField
            label="End Year"
            value={String(settings.end_year)}
            type="number"
            onSave={(v) => saveSetting('end_year', parseInt(v))}
            canEdit={canEdit}
          />
          <SettingField
            label="Start Month"
            value={String(settings.start_month)}
            type="select"
            options={[
              { value: '1', label: 'January' }, { value: '2', label: 'February' },
              { value: '3', label: 'March' }, { value: '4', label: 'April' },
              { value: '5', label: 'May' }, { value: '6', label: 'June' },
              { value: '7', label: 'July' }, { value: '8', label: 'August' },
              { value: '9', label: 'September' }, { value: '10', label: 'October' },
              { value: '11', label: 'November' }, { value: '12', label: 'December' },
            ]}
            onSave={(v) => saveSetting('start_month', parseInt(v))}
            canEdit={canEdit}
          />
          <SettingField
            label="Currency"
            value={settings.currency}
            onSave={(v) => saveSetting('currency', v)}
            canEdit={canEdit}
          />
          <SettingField
            label="Periods per Year"
            value={String(settings.n_periods)}
            type="select"
            options={[
              { value: '1', label: '1 (Annual)' },
              { value: '2', label: '2 (Semi-annual)' },
              { value: '4', label: '4 (Quarterly)' },
              { value: '12', label: '12 (Monthly)' },
            ]}
            onSave={(v) => saveSetting('n_periods', parseInt(v))}
            canEdit={canEdit}
          />
        </div>
      </div>

      {/* Hierarchy structure */}
      <div className="bg-card border rounded-lg p-4">
        <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide mb-3">
          Results Hierarchy
        </h3>
        <p className="text-xs text-muted-foreground mb-3">
          Configure the level names for your logframe hierarchy. Activities attach under the deepest level.
        </p>
        <LevelEditor
          levels={data.levels}
          logframeId={logframeId}
          canEdit={canEdit}
        />
      </div>
    </div>
  )
}

function SettingField({ label, value, type = 'text', options, onSave, canEdit }: {
  label: string
  value: string
  type?: 'text' | 'number' | 'select'
  options?: { value: string; label: string }[]
  onSave: (value: string) => Promise<void>
  canEdit: boolean
}) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value)
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    setEditing(false)
    if (draft !== value && draft.trim()) {
      setSaving(true)
      try { await onSave(draft.trim()) } finally { setSaving(false) }
    } else {
      setDraft(value)
    }
  }

  return (
    <div>
      <label className="block text-xs font-medium text-muted-foreground mb-1">{label}</label>
      {editing ? (
        type === 'select' ? (
          <select
            autoFocus
            value={draft}
            onChange={(e) => { setDraft(e.target.value); }}
            onBlur={handleSave}
            className="w-full border border-ring rounded px-3 py-1.5 text-sm focus:outline-none"
          >
            {options?.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        ) : (
          <input
            autoFocus
            type={type}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={handleSave}
            onKeyDown={(e) => {
              if (e.key === 'Enter') (e.target as HTMLInputElement).blur()
              if (e.key === 'Escape') { setDraft(value); setEditing(false) }
            }}
            className="w-full border border-ring rounded px-3 py-1.5 text-sm focus:outline-none"
          />
        )
      ) : (
        <div
          onClick={() => canEdit && setEditing(true)}
          className={`text-sm px-3 py-1.5 rounded border border-border ${canEdit ? 'cursor-pointer hover:bg-warning/10 active:bg-warning/10' : ''
            } ${saving ? 'text-muted-foreground' : 'text-foreground'}`}
        >
          {type === 'select' ? (options?.find((o) => o.value === value)?.label ?? value) : value}
        </div>
      )}
    </div>
  )
}

function LevelEditor({ levels, logframeId, canEdit }: {
  levels: Record<string, string>
  logframeId: number
  canEdit: boolean
}) {
  const queryClient = useQueryClient()

  // Initialize from bootstrap levels (works for both custom and default)
  const sortedEntries = Object.entries(levels).sort(([a], [b]) => Number(a) - Number(b))
  const [drafts, setDrafts] = useState<{ level: number; name: string }[]>(
    sortedEntries.map(([k, v]) => ({ level: Number(k), name: v }))
  )
  const [saving, setSaving] = useState(false)

  // Sync when levels change externally (e.g., after save)
  const levelsKey = JSON.stringify(levels)
  const [lastKey, setLastKey] = useState(levelsKey)
  if (levelsKey !== lastKey) {
    setLastKey(levelsKey)
    setDrafts(Object.entries(levels).sort(([a], [b]) => Number(a) - Number(b)).map(([k, v]) => ({ level: Number(k), name: v })))
  }

  async function saveLevels(newDrafts: { level: number; name: string }[]) {
    setSaving(true)
    try {
      const labelMap: Record<string, string> = {}
      newDrafts.forEach((d, i) => { labelMap[String(i + 1)] = d.name })
      await apiClient.patch(`/logframes/${logframeId}/settings/`, {
        level_labels: labelMap,
        max_result_level: newDrafts.length,
      })
      queryClient.invalidateQueries({ queryKey: ['bootstrap', logframeId] })
    } finally {
      setSaving(false)
    }
  }

  function handleRename(index: number, name: string) {
    const updated = drafts.map((d, i) => i === index ? { ...d, name } : d)
    setDrafts(updated)
  }

  async function handleBlur(index: number) {
    const current = drafts[index]
    const original = sortedEntries[index]
    if (original && current.name === original[1]) return
    if (!current.name.trim()) return
    await saveLevels(drafts)
  }

  async function addLevel() {
    const newDrafts = [...drafts, { level: drafts.length + 1, name: `Level ${drafts.length + 1}` }]
    setDrafts(newDrafts)
    await saveLevels(newDrafts)
  }

  async function removeLevel(index: number) {
    if (drafts.length <= 1) return
    const newDrafts = drafts.filter((_, i) => i !== index)
    setDrafts(newDrafts)
    await saveLevels(newDrafts)
  }

  async function moveLevel(index: number, direction: -1 | 1) {
    const target = index + direction
    if (target < 0 || target >= drafts.length) return
    const newDrafts = [...drafts]
      ;[newDrafts[index], newDrafts[target]] = [newDrafts[target], newDrafts[index]]
    setDrafts(newDrafts)
    await saveLevels(newDrafts)
  }

  return (
    <div>
      <div className="space-y-2 mb-3">
        {drafts.map((d, i) => (
          <div key={i} className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground w-5 text-right flex-shrink-0">{i + 1}</span>
            <div
              className="w-2 h-2 rounded-full flex-shrink-0"
              style={{ marginLeft: `${i * 8}px` }}
            />
            {canEdit ? (
              <input
                type="text"
                value={d.name}
                onChange={(e) => handleRename(i, e.target.value)}
                onBlur={() => handleBlur(i)}
                onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur() }}
                className="border border-border rounded px-2 py-1 text-sm flex-1 min-w-[120px] focus:border-ring focus:outline-none"
                disabled={saving}
              />
            ) : (
              <span className="text-sm text-foreground flex-1">{d.name}</span>
            )}
            {canEdit && (
              <div className="flex gap-0.5 flex-shrink-0">
                <button
                  onClick={() => moveLevel(i, -1)}
                  disabled={i === 0 || saving}
                  className="text-muted-foreground hover:text-foreground disabled:opacity-30 px-1 text-xs"
                  title="Move up"
                >
                  ▲
                </button>
                <button
                  onClick={() => moveLevel(i, 1)}
                  disabled={i === drafts.length - 1 || saving}
                  className="text-muted-foreground hover:text-foreground disabled:opacity-30 px-1 text-xs"
                  title="Move down"
                >
                  ▼
                </button>
                <button
                  onClick={() => removeLevel(i)}
                  disabled={drafts.length <= 1 || saving}
                  className="text-destructive hover:text-destructive/80 disabled:opacity-30 px-1 text-xs font-bold"
                  title="Remove level"
                >
                  ×
                </button>
              </div>
            )}
          </div>
        ))}
        {/* Activity indicator */}
        <div className="flex items-center gap-2">
          <span className="w-5 flex-shrink-0" />
          <div
            className="w-2 h-2 rounded-full bg-amber-400 flex-shrink-0"
            style={{ marginLeft: `${drafts.length * 8}px` }}
          />
          <span className="text-xs text-amber-700">Activity</span>
          <span className="text-[10px] text-muted-foreground">(under {drafts[drafts.length - 1]?.name ?? 'deepest level'} only)</span>
        </div>
      </div>

      {canEdit && (
        <button
          onClick={addLevel}
          disabled={saving}
          className="text-sm text-primary hover:text-primary/80 disabled:opacity-50"
        >
          + Add level
        </button>
      )}
    </div>
  )
}
