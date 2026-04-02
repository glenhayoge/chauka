import { useState } from 'react'
import { useParams, useSearchParams, useNavigate } from 'react-router-dom'
import { useBootstrap } from '../hooks/useBootstrap'
import { useLogframeStore } from '../store/logframe'
import { useQueryClient } from '@tanstack/react-query'
import { apiClient } from '../api/client'
import clsx from 'clsx'
import KoboSettings from '../components/integrations/KoboSettings'
import MembersPanel from '../components/settings/MembersPanel'
import OrgSettingsPanel from '../components/settings/OrgSettingsPanel'

const TABS = [
  { key: 'organisation', label: 'Organisation' },
  { key: 'logframe', label: 'Logframe' },
  { key: 'members', label: 'Members' },
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
  const activeTab: TabKey = TABS.some((t) => t.key === tabParam) ? tabParam! : 'organisation'

  function setTab(key: TabKey) {
    navigate(`/app/logframes/${id}/settings?tab=${key}`, { replace: true })
  }

  if (isLoading) return <p className="text-gray-500">Loading…</p>
  if (error) return <p className="text-red-600">Failed to load data.</p>
  if (!data) return null

  return (
    <div>
      <h2 className="text-lg font-semibold mb-4">Settings</h2>

      {/* Tab bar */}
      <div className="flex overflow-x-auto border-b border-gray-200 mb-6 -mx-3 px-3 sm:mx-0 sm:px-0">
        {TABS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={clsx(
              'px-4 sm:px-6 py-2.5 text-sm font-medium border-b-2 -mb-px whitespace-nowrap',
              activeTab === key
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900',
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'organisation' && (
        <OrgSettingsPanel logframeId={id} canEdit={data.canEdit} />
      )}
      {activeTab === 'logframe' && (
        <LogframeSettingsPanel logframeId={id} canEdit={data.canEdit} />
      )}
      {activeTab === 'members' && (
        <div>
          <MembersPanel
            canEdit={data.canEdit}
            userRole={data.userRole}
            orgId={data.orgContext?.organisation.id}
          />
          {data.orgContext && (
            <p className="mt-4 text-sm">
              <a
                href={`/organisations/${data.orgContext.organisation.id}/settings?tab=members`}
                className="text-blue-600 hover:underline"
              >
                Manage organisation settings &rarr;
              </a>
            </p>
          )}
        </div>
      )}
      {activeTab === 'integrations' && (
        <div className="space-y-6">
          <KoboSettings logframeId={id} canEdit={data.canEdit} />
        </div>
      )}
    </div>
  )
}

function LogframeSettingsPanel({ logframeId, canEdit }: { logframeId: number; canEdit: boolean }) {
  const data = useLogframeStore((s) => s.data)
  const queryClient = useQueryClient()

  if (!data?.settings) {
    return <p className="text-sm text-gray-400 italic">No logframe settings configured.</p>
  }

  const settings = data.settings
  const useComponents = settings.use_components ?? false

  async function saveSetting(field: string, value: string | number) {
    if (!canEdit) return
    await apiClient.patch(`/logframes/${logframeId}/settings/`, { [field]: value })
    queryClient.invalidateQueries({ queryKey: ['bootstrap', logframeId] })
  }

  async function toggleComponents() {
    if (!canEdit) return
    await apiClient.patch(`/logframes/${logframeId}/settings/`, {
      use_components: !useComponents,
      max_result_level: !useComponents ? 4 : 3,
    })
    queryClient.invalidateQueries({ queryKey: ['bootstrap', logframeId] })
  }

  return (
    <div className="space-y-6">
      {/* Logframe configuration */}
      <div className="bg-white border rounded-lg p-4">
        <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">
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
      <div className="bg-white border rounded-lg p-4">
        <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">
          Results Hierarchy
        </h3>

        <div className="flex items-start gap-3 mb-4">
          <button
            onClick={toggleComponents}
            disabled={!canEdit}
            className={clsx(
              'relative inline-flex h-6 w-11 items-center rounded-full transition-colors flex-shrink-0 mt-0.5',
              useComponents ? 'bg-blue-600' : 'bg-gray-300',
              !canEdit && 'opacity-50 cursor-not-allowed',
            )}
          >
            <span
              className={clsx(
                'inline-block h-4 w-4 rounded-full bg-white transition-transform',
                useComponents ? 'translate-x-6' : 'translate-x-1',
              )}
            />
          </button>
          <div>
            <div className="text-sm font-medium text-gray-700">
              Enable Components
            </div>
            <p className="text-xs text-gray-500 mt-0.5">
              Add an optional "Component" level between Outcome and Output to group related
              outputs and activities by project strategy area.
            </p>
          </div>
        </div>

        {/* Visual hierarchy preview */}
        <div className="border rounded p-3 bg-gray-50">
          <p className="text-xs font-medium text-gray-500 mb-2">Hierarchy structure:</p>
          <div className="space-y-1">
            <HierarchyLevel level={1} label="Impact (Goal)" indent={0} />
            <HierarchyLevel level={2} label="Outcome" indent={1} />
            {useComponents && (
              <HierarchyLevel level={3} label="Component" indent={2} highlight
                hint="groups related outputs" />
            )}
            <HierarchyLevel level={useComponents ? 4 : 3} label="Output" indent={useComponents ? 3 : 2} />
            <div className="flex items-center gap-2" style={{ paddingLeft: `${(useComponents ? 4 : 3) * 1}rem` }}>
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              <span className="text-xs text-amber-700">Activity</span>
              <span className="text-[10px] text-gray-400">(under Outputs only)</span>
            </div>
          </div>
        </div>
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
      <label className="block text-xs font-medium text-gray-500 mb-1">{label}</label>
      {editing ? (
        type === 'select' ? (
          <select
            autoFocus
            value={draft}
            onChange={(e) => { setDraft(e.target.value); }}
            onBlur={handleSave}
            className="w-full border border-blue-400 rounded px-3 py-1.5 text-sm focus:outline-none"
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
            className="w-full border border-blue-400 rounded px-3 py-1.5 text-sm focus:outline-none"
          />
        )
      ) : (
        <div
          onClick={() => canEdit && setEditing(true)}
          className={`text-sm px-3 py-1.5 rounded border border-gray-200 ${
            canEdit ? 'cursor-pointer hover:bg-yellow-50 active:bg-yellow-100' : ''
          } ${saving ? 'text-gray-400' : 'text-gray-800'}`}
        >
          {type === 'select' ? (options?.find((o) => o.value === value)?.label ?? value) : value}
        </div>
      )}
    </div>
  )
}

function HierarchyLevel({ level, label, indent, highlight, hint }: { level: number; label: string; indent: number; highlight?: boolean; hint?: string }) {
  const colors: Record<number, string> = {
    1: 'bg-slate-400',
    2: 'bg-slate-300',
    3: 'bg-slate-200',
    4: 'bg-slate-100',
  }
  return (
    <div
      className={clsx('flex items-center gap-2', highlight && 'font-medium')}
      style={{ paddingLeft: `${indent * 1}rem` }}
    >
      <span className={clsx('w-2 h-2 rounded-full', colors[level] ?? 'bg-slate-100')} />
      <span className={clsx('text-xs', highlight ? 'text-blue-700' : 'text-gray-600')}>
        {label}
      </span>
      {highlight && (
        <span className="text-[10px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded font-medium">
          NEW
        </span>
      )}
      {hint && (
        <span className="text-[10px] text-gray-400">{hint}</span>
      )}
    </div>
  )
}
