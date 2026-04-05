import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useBootstrap } from '../hooks/useBootstrap'
import { useLogframeStore } from '../store/logframe'
import { useResolveLogframeId } from '../hooks/useResolveIds'
import TabNav from '../components/layout/TabNav'
import ExportDialog from '../components/dashboard/ExportDialog'

const PLACEHOLDER_NAMES = ['Untitled Program', 'Untitled Project', 'Untitled Logframe']

export default function DashboardPage() {
  const { logframeId: publicId } = useParams<{ logframeId: string }>()
  const { id: resolvedId, isLoading: resolving, notFound } = useResolveLogframeId(publicId)
  const { isLoading, error } = useBootstrap(resolvedId ?? 0)
  const data = useLogframeStore((s) => s.data)
  const [exportOpen, setExportOpen] = useState(false)

  if (resolving) return <p className="text-muted-foreground">Loading…</p>
  if (notFound)  return <p className="text-destructive">Logframe not found.</p>
  if (isLoading) return <p className="text-muted-foreground">Loading…</p>
  if (error)     return <p className="text-destructive">Failed to load data.</p>
  if (!data)     return null

  const resultCount   = data.results.length
  const indicatorCount = data.indicators.length
  const activityCount = data.activities.length

  const incomplete: string[] = []
  if (data.orgContext) {
    if (data.orgContext.program && PLACEHOLDER_NAMES.includes(data.orgContext.program.name)) incomplete.push('Program')
    if (data.orgContext.project && PLACEHOLDER_NAMES.includes(data.orgContext.project.name)) incomplete.push('Project')
  }
  if (PLACEHOLDER_NAMES.includes(data.logframe.name)) incomplete.push('Logframe')

  return (
    <div>
      <TabNav />

      {/* Logframe name + action buttons */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">{data.logframe.name}</h2>
        <div className="flex items-center gap-2">
          {/* Print */}
          <Link
            to={`/app/logframes/${publicId}/print`}
            target="_blank"
            rel="noopener noreferrer"
            title="Print logframe"
            className="inline-flex items-center justify-center w-8 h-8 text-foreground bg-card border border-border rounded-md hover:bg-muted"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
          </Link>
          {/* Export to Excel */}
          {resolvedId && (
            <button
              onClick={() => setExportOpen(true)}
              title="Export to Excel"
              className="inline-flex items-center justify-center w-8 h-8 text-foreground bg-card border border-border rounded-md hover:bg-muted"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Setup reminder */}
      {incomplete.length > 0 && (
        <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
          <div className="flex-1">
            <p className="text-sm text-amber-800">
              <span className="font-medium">Setup incomplete:</span>{' '}
              {incomplete.join(', ')} {incomplete.length === 1 ? 'name needs' : 'names need'} to be updated.
            </p>
          </div>
          <Link
            to={`/app/logframes/${publicId}/settings?tab=organisation`}
            className="text-sm font-medium text-amber-700 hover:text-amber-900 underline whitespace-nowrap"
          >
            Update in Settings
          </Link>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-6">
        <SummaryCard label="Results" count={resultCount} />
        <SummaryCard label="Indicators" count={indicatorCount} />
        <SummaryCard label="Activities" count={activityCount} />
      </div>

      <div className="bg-card border rounded-lg p-4 mb-6">
        <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide mb-3">
          Logframe Details
        </h3>
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
          <div>
            <dt className="text-muted-foreground">Name</dt>
            <dd className="font-medium">{data.logframe.name}</dd>
          </div>
          {data.orgContext?.organisation && (
            <div>
              <dt className="text-muted-foreground">Organisation</dt>
              <dd className="font-medium">{data.orgContext.organisation.name}</dd>
            </div>
          )}
          {data.orgContext?.program && (
            <div>
              <dt className="text-muted-foreground">Program</dt>
              <dd>{data.orgContext.program.name}</dd>
            </div>
          )}
          {data.orgContext?.project && (
            <div>
              <dt className="text-muted-foreground">Project</dt>
              <dd>{data.orgContext.project.name}</dd>
            </div>
          )}
          {data.settings?.description && (
            <div className="col-span-2">
              <dt className="text-muted-foreground">Description</dt>
              <dd>{data.settings.description}</dd>
            </div>
          )}
          {data.settings && (
            <>
              <div>
                <dt className="text-muted-foreground">Period</dt>
                <dd>
                  {data.settings.start_year === data.settings.end_year
                    ? data.settings.start_year
                    : `${data.settings.start_year} – ${data.settings.end_year}`}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Currency</dt>
                <dd>{data.settings.currency}</dd>
              </div>
            </>
          )}
        </dl>
      </div>

      {/* Export dialog */}
      {exportOpen && resolvedId && (
        <ExportDialog
          logframeId={resolvedId}
          onClose={() => setExportOpen(false)}
        />
      )}
    </div>
  )
}

function SummaryCard({ label, count }: { label: string; count: number }) {
  return (
    <div className="bg-card border rounded-lg p-4 text-center">
      <div className="text-3xl font-bold text-primary">{count}</div>
      <div className="text-sm text-muted-foreground mt-1">{label}</div>
    </div>
  )
}
