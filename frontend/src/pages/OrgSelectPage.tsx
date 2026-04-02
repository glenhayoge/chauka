import { useEffect, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import {
  getOrganisations,
  createOrganisation,
  getPrograms,
  createProgram,
  getProjects,
  createProject,
  getProjectLogframes,
  createLogframe,
  getOrgProjects,
  createOrgProject,
  getOrgProjectLogframes,
  createOrgProjectLogframe,
} from '../api/organisations'
import { COUNTRIES, ORG_TYPES, SECTORS } from '../utils/orgOptions'

function slugify(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60)
}

export default function OrgSelectPage() {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const [selectedOrgId, setSelectedOrgId] = useState<number | null>(null)
  const [selectedProgramId, setSelectedProgramId] = useState<number | null>(null)
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null)
  const [standaloneProjectId, setStandaloneProjectId] = useState<number | null>(null)
  const [skipping, setSkipping] = useState(false)
  const [activeForm, setActiveForm] = useState<string | null>(null)

  const { data: orgs, isLoading: orgsLoading } = useQuery({
    queryKey: ['organisations'],
    queryFn: getOrganisations,
  })

  const { data: programs } = useQuery({
    queryKey: ['programs', selectedOrgId],
    queryFn: () => getPrograms(selectedOrgId!),
    enabled: selectedOrgId !== null,
  })

  const { data: projects } = useQuery({
    queryKey: ['projects', selectedOrgId, selectedProgramId],
    queryFn: () => getProjects(selectedOrgId!, selectedProgramId!),
    enabled: selectedOrgId !== null && selectedProgramId !== null,
  })

  const { data: logframes } = useQuery({
    queryKey: ['project-logframes', selectedOrgId, selectedProgramId, selectedProjectId],
    queryFn: () => getProjectLogframes(selectedOrgId!, selectedProgramId!, selectedProjectId!),
    enabled: selectedOrgId !== null && selectedProgramId !== null && selectedProjectId !== null,
  })

  // Standalone org projects (no program)
  const { data: orgProjects } = useQuery({
    queryKey: ['org-projects', selectedOrgId],
    queryFn: () => getOrgProjects(selectedOrgId!),
    enabled: selectedOrgId !== null,
  })

  // Logframes for standalone project
  const { data: standaloneLogframes } = useQuery({
    queryKey: ['standalone-project-logframes', selectedOrgId, standaloneProjectId],
    queryFn: () => getOrgProjectLogframes(selectedOrgId!, standaloneProjectId!),
    enabled: selectedOrgId !== null && standaloneProjectId !== null,
  })

  // Auto-select single org (in useEffect to avoid setState during render)
  useEffect(() => {
    if (orgs && orgs.length === 1 && selectedOrgId === null) {
      setSelectedOrgId(orgs[0].id)
    }
  }, [orgs, selectedOrgId])

  if (orgsLoading) return <p className="text-gray-500">Loading...</p>

  const isNewUser = orgs && orgs.length === 0

  // Breadcrumb
  const crumbs: { label: string; onClick?: () => void }[] = []
  if (selectedOrgId !== null) {
    const org = orgs?.find((o) => o.id === selectedOrgId)
    crumbs.push({
      label: org?.name ?? 'Organisation',
      onClick: orgs && orgs.length > 1 ? () => { setSelectedOrgId(null); setSelectedProgramId(null); setSelectedProjectId(null) } : undefined,
    })
  }
  if (selectedProgramId !== null) {
    const prog = programs?.find((p) => p.id === selectedProgramId)
    crumbs.push({ label: prog?.name ?? 'Program', onClick: () => { setSelectedProgramId(null); setSelectedProjectId(null) } })
  }
  if (selectedProjectId !== null) {
    const proj = projects?.find((p) => p.id === selectedProjectId)
    crumbs.push({ label: proj?.name ?? 'Project', onClick: () => setSelectedProjectId(null) })
  }
  if (standaloneProjectId !== null) {
    const proj = orgProjects?.find((p) => p.id === standaloneProjectId)
    crumbs.push({ label: proj?.name ?? 'Project', onClick: () => setStandaloneProjectId(null) })
  }

  return (
    <div>
      {/* Breadcrumb */}
      {crumbs.length > 0 && (
        <nav className="flex items-center gap-2 text-sm text-gray-500 mb-4">
          {crumbs.map((crumb, i) => (
            <span key={i} className="flex items-center gap-2">
              {i > 0 && <span>/</span>}
              {crumb.onClick ? (
                <button onClick={crumb.onClick} className="text-gray-700 hover:text-gray-900">{crumb.label}</button>
              ) : (
                <span className="font-medium text-gray-700">{crumb.label}</span>
              )}
            </span>
          ))}
        </nav>
      )}

      {/* Step 1: Select / Create Organisation */}
      {selectedOrgId === null && (
        <div>
          {isNewUser ? (
            <>
              <p className="text-sm font-medium text-gray-900 mb-4">Create your organisation to get started.</p>
              <NewOrgForm
                onCreated={(orgId) => {
                  queryClient.invalidateQueries({ queryKey: ['organisations'] })
                  setSelectedOrgId(orgId)
                }}
              />
            </>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 mb-4">
                {orgs?.map((org) => (
                  <div key={org.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                    <button
                      onClick={() => setSelectedOrgId(org.id)}
                      className="block w-full text-left"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-gray-900">{org.name}</span>
                        <svg className="w-4 h-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                      </div>
                      {org.description && <p className="text-sm text-gray-500 leading-snug">{org.description}</p>}
                    </button>
                    <div className="flex gap-3 mt-3 pt-3 border-t border-gray-100">
                      <Link
                        to={`/organisations/${org.id}/dashboard`}
                        onClick={(e) => e.stopPropagation()}
                        className="text-xs text-gray-500 hover:text-gray-700"
                      >
                        Dashboard
                      </Link>
                      <Link
                        to={`/organisations/${org.id}/settings`}
                        onClick={(e) => e.stopPropagation()}
                        className="text-xs text-gray-500 hover:text-gray-700"
                      >
                        Settings
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
              <CreateForm
                label="organisation"
                onSubmit={async (values) => {
                  const org = await createOrganisation({
                    name: values.name,
                    slug: slugify(values.name),
                    description: values.description,
                  })
                  queryClient.invalidateQueries({ queryKey: ['organisations'] })
                  setSelectedOrgId(org.id)
                }}
                fields={[
                  { name: 'name', label: 'Organisation name', required: true },
                  { name: 'description', label: 'Description' },
                ]}
              />
            </>
          )}
        </div>
      )}

      {/* Step 2: Programs & Standalone Projects */}
      {selectedOrgId !== null && selectedProgramId === null && standaloneProjectId === null && (
        <div>
          {/* All items in a single flat list */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 mb-4">
            {programs?.map((prog) => (
              <button
                key={`prog-${prog.id}`}
                onClick={() => setSelectedProgramId(prog.id)}
                className="text-left border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-gray-900">{prog.name}</span>
                  <svg className="w-4 h-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                </div>
                {prog.description && <p className="text-sm text-gray-500 leading-snug">{prog.description}</p>}
                {prog.start_date && prog.end_date && (
                  <p className="text-xs text-gray-400 mt-2">{prog.start_date} — {prog.end_date}</p>
                )}
              </button>
            ))}

            {orgProjects?.map((proj) => (
              <button
                key={`proj-${proj.id}`}
                onClick={() => setStandaloneProjectId(proj.id)}
                className="text-left border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-gray-900">{proj.name}</span>
                  <svg className="w-4 h-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                </div>
                {proj.description && <p className="text-sm text-gray-500 leading-snug">{proj.description}</p>}
                {proj.status !== 'active' && (
                  <p className="text-xs text-gray-400 mt-2">{proj.status}</p>
                )}
              </button>
            ))}
          </div>

          {/* Empty state */}
          {(!programs || programs.length === 0) && (!orgProjects || orgProjects.length === 0) && (
            <p className="text-sm text-gray-500 mb-4">No programs or projects yet.</p>
          )}

          {/* Create actions */}
          <div className="flex flex-wrap items-center gap-3 border-t border-gray-100 pt-4">
            <CreateForm
              label="program"
              fields={[
                { name: 'name', label: 'Program name', required: true },
                { name: 'description', label: 'Description' },
              ]}
              autoOpen={(!programs || programs.length === 0) && (!orgProjects || orgProjects.length === 0)}
              isOpen={activeForm === 'program'}
              onToggle={(open) => setActiveForm(open ? 'program' : null)}
              onSubmit={async (values) => {
                const prog = await createProgram(selectedOrgId, { name: values.name, description: values.description })
                queryClient.invalidateQueries({ queryKey: ['programs', selectedOrgId] })
                setSelectedProgramId(prog.id)
              }}
            />
            <CreateForm
              label="project"
              fields={[
                { name: 'name', label: 'Project name', required: true },
                { name: 'description', label: 'Description' },
              ]}
              isOpen={activeForm === 'project'}
              onToggle={(open) => setActiveForm(open ? 'project' : null)}
              onSubmit={async (values) => {
                const proj = await createOrgProject(selectedOrgId, { name: values.name, description: values.description })
                queryClient.invalidateQueries({ queryKey: ['org-projects', selectedOrgId] })
                setStandaloneProjectId(proj.id)
              }}
            />
            {(!programs || programs.length === 0) && (!orgProjects || orgProjects.length === 0) && (
              <button
                onClick={async () => {
                  setSkipping(true)
                  try {
                    const prog = await createProgram(selectedOrgId, { name: 'Untitled Program' })
                    const proj = await createProject(selectedOrgId, prog.id, { name: 'Untitled Project' })
                    const lf = await createLogframe(selectedOrgId, prog.id, proj.id, { name: 'Untitled Logframe' })
                    navigate(`/logframes/${lf.id}`)
                  } finally {
                    setSkipping(false)
                  }
                }}
                disabled={skipping}
                className="text-sm text-gray-400 hover:text-gray-600 disabled:opacity-50"
              >
                {skipping ? 'Setting up...' : 'Skip for now'}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Step 2b: Standalone project logframes */}
      {standaloneProjectId !== null && (
        <div>
          <h2 className="text-sm font-medium text-gray-900 mb-2">
            {standaloneLogframes && standaloneLogframes.length > 0 ? 'Select a Logframe' : 'Create a Logframe'}
          </h2>
          <p className="text-sm text-gray-500 mb-4">
            A logframe is where you define your results chain, indicators, and activities.
          </p>
          {standaloneLogframes && standaloneLogframes.length === 1 && (
            <Navigate to={`/logframes/${standaloneLogframes[0].id}`} replace />
          )}
          <div className="grid gap-3 max-w-md">
            {standaloneLogframes?.map((lf) => (
              <Link
                key={lf.id}
                to={`/logframes/${lf.id}`}
                className="block border rounded-lg p-4 hover:bg-gray-50 transition-colors"
              >
                <span className="font-medium">{lf.name}</span>
              </Link>
            ))}
          </div>
          <LogframeSetupForm
            autoOpen={standaloneLogframes && standaloneLogframes.length === 0}
            onSubmit={async (values) => {
              const lf = await createOrgProjectLogframe(selectedOrgId!, standaloneProjectId, { name: values.name })
              queryClient.invalidateQueries({ queryKey: ['standalone-project-logframes', selectedOrgId, standaloneProjectId] })
              navigate(`/logframes/${lf.id}`)
            }}
          />
        </div>
      )}

      {/* Step 3: Select / Create Project */}
      {selectedProgramId !== null && selectedProjectId === null && (
        <div>
          <h2 className="text-sm font-medium text-gray-900 mb-2">
            {projects && projects.length > 0 ? 'Select a Project' : 'Create a Project'}
          </h2>
          <p className="text-sm text-gray-500 mb-4">
            Projects contain the logframes where you plan and monitor your work.
          </p>
          <div className="grid gap-3 max-w-md">
            {projects?.map((proj) => (
              <button
                key={proj.id}
                onClick={() => setSelectedProjectId(proj.id)}
                className="block w-full text-left border rounded-lg p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium">{proj.name}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    proj.status === 'active' ? 'bg-green-100 text-green-700'
                    : proj.status === 'completed' ? 'bg-gray-200 text-gray-600'
                    : 'bg-gray-100 text-gray-700'
                  }`}>{proj.status}</span>
                </div>
                {proj.description && <p className="text-sm text-gray-500 mt-1">{proj.description}</p>}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-4 mt-4">
            <CreateForm
              label="project"
              fields={[
                { name: 'name', label: 'Project name', required: true },
                { name: 'description', label: 'Description' },
              ]}
              autoOpen={projects && projects.length === 0}
              onSubmit={async (values) => {
                const proj = await createProject(selectedOrgId!, selectedProgramId, { name: values.name, description: values.description })
                queryClient.invalidateQueries({ queryKey: ['projects', selectedOrgId, selectedProgramId] })
                setSelectedProjectId(proj.id)
              }}
            />
            {projects && projects.length === 0 && (
              <button
                onClick={async () => {
                  setSkipping(true)
                  try {
                    const proj = await createProject(selectedOrgId!, selectedProgramId!, { name: 'Untitled Project' })
                    const lf = await createLogframe(selectedOrgId!, selectedProgramId!, proj.id, { name: 'Untitled Logframe' })
                    navigate(`/logframes/${lf.id}`)
                  } finally {
                    setSkipping(false)
                  }
                }}
                disabled={skipping}
                className="text-sm text-gray-400 hover:text-gray-600 disabled:opacity-50"
              >
                {skipping ? 'Setting up...' : 'Skip for now'}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Step 4: Select / Create Logframe */}
      {selectedProjectId !== null && (
        <div>
          <h2 className="text-sm font-medium text-gray-900 mb-2">
            {logframes && logframes.length > 0 ? 'Select a Logframe' : 'Set Up Your Logframe'}
          </h2>
          <p className="text-sm text-gray-500 mb-4">
            {logframes && logframes.length > 0
              ? 'A logframe is where you define your results chain, indicators, and activities.'
              : 'Configure the reporting periods and currency for your logframe. These can be adjusted later in Settings.'}
          </p>
          {logframes && logframes.length === 1 && (
            <Navigate to={`/logframes/${logframes[0].id}`} replace />
          )}
          <div className="grid gap-3 max-w-md">
            {logframes?.map((lf) => (
              <Link
                key={lf.id}
                to={`/logframes/${lf.id}`}
                className="block border rounded-lg p-4 hover:bg-gray-50 transition-colors"
              >
                <span className="font-medium">{lf.name}</span>
              </Link>
            ))}
          </div>
          <LogframeSetupForm
            autoOpen={logframes && logframes.length === 0}
            onSubmit={async (values) => {
              const lf = await createLogframe(selectedOrgId!, selectedProgramId!, selectedProjectId!, values)
              queryClient.invalidateQueries({ queryKey: ['project-logframes', selectedOrgId, selectedProgramId, selectedProjectId] })
              navigate(`/logframes/${lf.id}`)
            }}
          />
        </div>
      )}
    </div>
  )
}

/** Prominent create form shown open for new users. */
const MONTH_OPTIONS = [
  { value: 1, label: 'January' }, { value: 2, label: 'February' },
  { value: 3, label: 'March' }, { value: 4, label: 'April' },
  { value: 5, label: 'May' }, { value: 6, label: 'June' },
  { value: 7, label: 'July' }, { value: 8, label: 'August' },
  { value: 9, label: 'September' }, { value: 10, label: 'October' },
  { value: 11, label: 'November' }, { value: 12, label: 'December' },
]

const PERIOD_OPTIONS = [
  { value: 1, label: 'Annual' },
  { value: 2, label: 'Semi-annual' },
  { value: 4, label: 'Quarterly' },
  { value: 12, label: 'Monthly' },
]

function LogframeSetupForm({ autoOpen, onSubmit }: {
  autoOpen?: boolean | null
  onSubmit: (values: { name: string; start_year: number; end_year: number; start_month: number; n_periods: number; currency: string }) => Promise<void>
}) {
  const currentYear = new Date().getFullYear()
  const [open, setOpen] = useState(!!autoOpen)
  const [name, setName] = useState('')
  const [startYear, setStartYear] = useState(currentYear)
  const [endYear, setEndYear] = useState(currentYear + 3)
  const [startMonth, setStartMonth] = useState(1)
  const [nPeriods, setNPeriods] = useState(4)
  const [currency, setCurrency] = useState('USD')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    if (endYear <= startYear) { setError('End year must be after start year'); return }
    setSaving(true)
    setError('')
    try {
      await onSubmit({
        name: name.trim(),
        start_year: startYear,
        end_year: endYear,
        start_month: startMonth,
        n_periods: nPeriods,
        currency: currency.trim() || 'USD',
      })
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail
      setError(msg || 'Failed to create logframe')
    } finally {
      setSaving(false)
    }
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="mt-4 text-sm text-gray-600 hover:text-gray-900">
        + Create new logframe
      </button>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="mt-4 border border-gray-200 rounded-lg p-4 bg-white max-w-md space-y-3 ">
      <div>
        <label className="block text-sm text-gray-600 mb-1">Logframe name</label>
        <input
          autoFocus
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Rural Water Access 2025-2028"
          required
          className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-gray-400 focus:border-gray-400"
        />
      </div>

      <div className="border-t pt-4">
        <p className="text-sm text-gray-600 mb-2">Reporting Periods</p>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm text-gray-600 mb-1">Start Year</label>
            <input
              type="number"
              value={startYear}
              onChange={(e) => setStartYear(parseInt(e.target.value) || currentYear)}
              className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-gray-400 focus:border-gray-400"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">End Year</label>
            <input
              type="number"
              value={endYear}
              onChange={(e) => setEndYear(parseInt(e.target.value) || currentYear + 3)}
              className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-gray-400 focus:border-gray-400"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Start Month</label>
            <select
              value={startMonth}
              onChange={(e) => setStartMonth(parseInt(e.target.value))}
              className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-gray-400 focus:border-gray-400"
            >
              {MONTH_OPTIONS.map((m) => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Frequency</label>
            <select
              value={nPeriods}
              onChange={(e) => setNPeriods(parseInt(e.target.value))}
              className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-gray-400 focus:border-gray-400"
            >
              {PERIOD_OPTIONS.map((p) => (
                <option key={p.value} value={p.value}>{p.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div>
        <label className="block text-sm text-gray-600 mb-1">Currency</label>
        <input
          type="text"
          value={currency}
          onChange={(e) => setCurrency(e.target.value)}
          placeholder="e.g. USD, GBP, EUR"
          className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-gray-400 focus:border-gray-400"
        />
      </div>

      {error && <p className="text-red-600 text-sm">{error}</p>}
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={saving || !name.trim()}
          className="flex-1 px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded hover:bg-gray-800 disabled:opacity-50"
        >
          {saving ? 'Creating...' : 'Create Logframe'}
        </button>
        {!autoOpen && (
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="px-4 py-2 text-gray-600 text-sm rounded border hover:bg-gray-50"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  )
}

function NewOrgForm({ onCreated }: { onCreated: (orgId: number) => void }) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [country, setCountry] = useState('')
  const [orgType, setOrgType] = useState('')
  const [sector, setSector] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    setSaving(true)
    setError('')
    try {
      const org = await createOrganisation({
        name: name.trim(),
        slug: slugify(name.trim()),
        description: description.trim(),
        country,
        org_type: orgType,
        sector,
      })
      onCreated(org.id)
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail
      setError(msg || 'Failed to create organisation')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="border border-gray-200 rounded-lg p-4 bg-white max-w-lg space-y-3 ">
      <div>
        <label className="block text-sm text-gray-600 mb-1">Organisation name</label>
        <input
          autoFocus
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. WaterAid Zambia"
          required
          className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-gray-400 focus:border-gray-400"
        />
      </div>
      <div>
        <label className="block text-sm text-gray-600 mb-1">Description <span className="text-gray-400 font-normal">(optional)</span></label>
        <input
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="What does your organisation do?"
          className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-gray-400 focus:border-gray-400"
        />
      </div>
      <div>
        <label className="block text-sm text-gray-600 mb-1">Country</label>
        <select
          value={country}
          onChange={(e) => setCountry(e.target.value)}
          required
          className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-gray-400 focus:border-gray-400"
        >
          <option value="">Select country</option>
          {COUNTRIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>
      <div>
        <label className="block text-sm text-gray-600 mb-1">Organisation type</label>
        <select
          value={orgType}
          onChange={(e) => setOrgType(e.target.value)}
          required
          className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-gray-400 focus:border-gray-400"
        >
          <option value="">Select type</option>
          {ORG_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>
      <div>
        <label className="block text-sm text-gray-600 mb-1">Sector</label>
        <select
          value={sector}
          onChange={(e) => setSector(e.target.value)}
          required
          className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-gray-400 focus:border-gray-400"
        >
          <option value="">Select sector</option>
          {SECTORS.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>
      {error && <p className="text-red-600 text-sm">{error}</p>}
      <button
        type="submit"
        disabled={saving || !name.trim() || !country || !orgType || !sector}
        className="w-full px-4 py-2.5 bg-gray-900 text-white text-sm font-medium rounded hover:bg-gray-800 disabled:opacity-50"
      >
        {saving ? 'Creating...' : 'Create Organisation'}
      </button>
    </form>
  )
}

interface Field {
  name: string
  label: string
  required?: boolean
  placeholder?: string
}

function CreateForm({ label, fields, onSubmit, autoOpen, isOpen, onToggle }: {
  label: string
  fields: Field[]
  onSubmit: (values: Record<string, string>) => Promise<void>
  autoOpen?: boolean | null
  isOpen?: boolean
  onToggle?: (open: boolean) => void
}) {
  const [internalOpen, setInternalOpen] = useState(!!autoOpen)
  const open = isOpen !== undefined ? isOpen : internalOpen
  function setOpen(v: boolean) {
    if (onToggle) onToggle(v)
    else setInternalOpen(v)
  }
  const [values, setValues] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  function setValue(name: string, value: string) {
    setValues((prev) => ({ ...prev, [name]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      await onSubmit(values)
      setValues({})
      setOpen(false)
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail
      setError(msg || `Failed to create ${label}`)
    } finally {
      setSaving(false)
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="mt-4 text-sm text-gray-600 hover:text-gray-900"
      >
        + Create new {label}
      </button>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="mt-4 border border-gray-200 rounded-lg p-4 bg-white max-w-md space-y-3">
      <h3 className="text-sm font-medium text-gray-700">Create {label}</h3>
      {fields.map((field) => (
        <div key={field.name}>
          <label className="block text-sm text-gray-600 mb-1">{field.label}</label>
          <input
            type="text"
            value={values[field.name] ?? ''}
            onChange={(e) => setValue(field.name, e.target.value)}
            placeholder={field.placeholder}
            required={field.required}
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-gray-400 focus:border-gray-400"
          />
        </div>
      ))}
      {error && <p className="text-red-600 text-xs">{error}</p>}
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={saving}
          className="px-4 py-2 bg-gray-900 text-white text-sm rounded hover:bg-gray-800 disabled:opacity-50"
        >
          {saving ? 'Creating\u2026' : `Create ${label}`}
        </button>
        <button
          type="button"
          onClick={() => { setOpen(false); setValues({}); setError('') }}
          className="px-4 py-2 text-gray-600 text-sm rounded border hover:bg-gray-50"
        >
          Cancel
        </button>
      </div>
    </form>
  )
}
