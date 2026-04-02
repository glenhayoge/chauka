import { Link, useParams, useSearchParams } from 'react-router-dom'
import { useBootstrap } from '../hooks/useBootstrap'
import { useLogframeStore } from '../store/logframe'
import TabNav from '../components/layout/TabNav'
import ActualsGrid from '../components/monitor/ActualsGrid'
import EmptyState from '../components/ui/EmptyState'

export default function MonitorPage() {
  const { logframeId } = useParams<{ logframeId: string }>()
  const id = Number(logframeId)
  const { isLoading, error } = useBootstrap(id)
  const data = useLogframeStore((s) => s.data)
  const [searchParams] = useSearchParams()
  const filterResultId = searchParams.get('result')

  if (isLoading) return <p className="text-gray-500">Loading…</p>
  if (error) return <p className="text-red-600">Failed to load data.</p>
  if (!data) return null

  const results = filterResultId
    ? data.results.filter((r) => r.id === Number(filterResultId))
    : data.results

  return (
    <div>
      <TabNav />
      <div className="flex items-center gap-3 mb-4">
        <h2 className="text-lg font-semibold">Monitor</h2>
        {filterResultId && (
          <Link
            to={`/app/logframes/${id}/monitor`}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            &larr; Show all results
          </Link>
        )}
      </div>
      {results.map((result) => {
        const indicators = data.indicators.filter((i) => i.result_id === result.id)
        if (indicators.length === 0) return null

        const levelLabel = result.level ? data.levels[String(result.level)] : ''

        return (
          <div key={result.id} className="mb-8">
            <div className="flex items-center gap-2 mb-3">
              {levelLabel && (
                <span className="text-xs bg-gray-100 text-gray-600 rounded px-2 py-0.5 font-medium">
                  {levelLabel}
                </span>
              )}
              <h3 className="font-medium text-gray-700">
                {result.name || '(unnamed result)'}
              </h3>
            </div>
            {indicators.map((indicator) => {
              const subindicators = data.subIndicators.filter(
                (s) => s.indicator_id === indicator.id
              )
              if (subindicators.length === 0) return null
              const indicatorTargets = (data.targets ?? []).filter(
                (t) => t.indicator_id === indicator.id
              )
              return (
                <ActualsGrid
                  key={indicator.id}
                  indicator={indicator}
                  subindicators={subindicators}
                  periods={data.periods}
                  targets={indicatorTargets}
                  columns={data.columns}
                  dataEntries={data.dataEntries}
                  reportingPeriods={data.reportingPeriods}
                  logframeId={id}
                  canEdit={data.canEdit}
                />
              )
            })}
          </div>
        )
      })}
      {results.length === 0 && (
        <EmptyState
          title="No indicators to monitor"
          description="Add indicators with sub-indicators in the Result Design tab first. Then you can track actuals and set ratings here."
        />
      )}
    </div>
  )
}
