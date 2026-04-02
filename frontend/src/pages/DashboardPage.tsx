import { useParams, Link } from 'react-router-dom'
import { useBootstrap } from '../hooks/useBootstrap'
import { useLogframeStore } from '../store/logframe'
import TabNav from '../components/layout/TabNav'

const PLACEHOLDER_NAMES = ['Untitled Program', 'Untitled Project', 'Untitled Logframe']

export default function DashboardPage() {
  const { logframeId } = useParams<{ logframeId: string }>()
  const id = Number(logframeId)
  const { isLoading, error } = useBootstrap(id)
  const data = useLogframeStore((s) => s.data)

  if (isLoading) return <p className="text-gray-500">Loading…</p>
  if (error) return <p className="text-red-600">Failed to load data.</p>
  if (!data) return null

  const resultCount = data.results.length
  const indicatorCount = data.indicators.length
  const activityCount = data.activities.length

  // Check for placeholder names that need updating
  const incomplete: string[] = []
  if (data.orgContext) {
    if (data.orgContext.program && PLACEHOLDER_NAMES.includes(data.orgContext.program.name)) incomplete.push('Program')
    if (data.orgContext.project && PLACEHOLDER_NAMES.includes(data.orgContext.project.name)) incomplete.push('Project')
  }
  if (PLACEHOLDER_NAMES.includes(data.logframe.name)) incomplete.push('Logframe')

  return (
    <div>
      <TabNav />

      {/* Logframe name + Print button */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">{data.logframe.name}</h2>
        <Link
          to={`/app/logframes/${id}/print`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
          </svg>
          Print Logframe
        </Link>
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
            to={`/app/logframes/${id}/settings?tab=organisation`}
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

      {data.settings && (
        <div className="bg-white border rounded-lg p-4 mb-6">
          <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">
            Logframe Details
          </h3>
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <div>
              <dt className="text-gray-500">Name</dt>
              <dd className="font-medium">{data.settings.name}</dd>
            </div>
            {data.settings.description && (
              <div className="col-span-2">
                <dt className="text-gray-500">Description</dt>
                <dd>{data.settings.description}</dd>
              </div>
            )}
            <div>
              <dt className="text-gray-500">Period</dt>
              <dd>{data.settings.start_year} – {data.settings.end_year}</dd>
            </div>
            <div>
              <dt className="text-gray-500">Currency</dt>
              <dd>{data.settings.currency}</dd>
            </div>
          </dl>
        </div>
      )}
    </div>
  )
}

function SummaryCard({ label, count }: { label: string; count: number }) {
  return (
    <div className="bg-white border rounded-lg p-4 text-center">
      <div className="text-3xl font-bold text-blue-700">{count}</div>
      <div className="text-sm text-gray-500 mt-1">{label}</div>
    </div>
  )
}
